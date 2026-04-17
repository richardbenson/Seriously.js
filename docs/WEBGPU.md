# WebGPU Backend Design

## Goals

Add a parallel WebGPU backend to Seriously.js that can replace the WebGL pipeline for a single Seriously instance. The WebGL backend remains the default and is not removed. A user opts in via a constructor option.

**In scope:**
- `{ backend: 'webgpu' }` constructor option
- Core pipeline: FrameBuffer equivalent, ShaderProgram equivalent, draw loop
- Render-pipeline effects (all pass-through effects that just run a fragment shader)
- Compute-pipeline effects for compute-heavy effects: `blur`, `opticalflow` (and future: denoise, upscale)
- Capability detection via `Seriously.capabilities()`

**Out of scope:**
- Hybrid WebGL+WebGPU in a single instance (no texture sharing without `WEBGL_webgpu_interop`, which is experimental and Chrome-only)
- GLSL-to-WGSL transpilation (not available in-browser; WGSL is written from scratch)
- WebGPU canvas target in a Worker (deferred to Phase 4 OffscreenCanvas work)

---

## Constructor API

```js
const seriously = new Seriously({ backend: 'webgpu' });
```

`backend` defaults to `'webgl'`. When `'webgpu'` is requested Seriously performs lazy async initialization — the `GPUDevice` is not created until the first `go()` call or the first frame request. This keeps construction synchronous.

For callers that need to know initialization is complete before attaching nodes:

```js
const seriously = await Seriously.createAsync({ backend: 'webgpu' });
```

`Seriously.createAsync(options)` returns a `Promise<SeriouslyInstance>` that resolves after `requestAdapter` + `requestDevice` succeed. It rejects if WebGPU is unavailable or the adapter cannot be obtained.

`Seriously.capabilities()` gains two new fields:

```js
{
  webgpu: boolean,          // navigator.gpu exists and requestAdapter() returned non-null
  webgpuCompute: boolean    // webgpu && device supports 'timestamp-query' (proxy for compute support)
}
```

---

## Async Initialization Strategy

WebGPU requires two async steps before any GPU work:

```js
const adapter = await navigator.gpu.requestAdapter();
const device  = await adapter.requestDevice();
```

The lazy-init approach:

1. `new Seriously({ backend: 'webgpu' })` stores `pendingBackend = 'webgpu'` and returns immediately.
2. On the first `go()` call, `renderDaemon()` detects `pendingBackend` and calls `initWebGPU()` — an internal async function that performs `requestAdapter` + `requestDevice`, then initialises the swap chain / context, then begins the RAF loop.
3. Until `initWebGPU()` resolves, `go()` returns a promise. Effects and sources can be attached before `go()` is called; they just aren't rendered yet.
4. `Seriously.createAsync()` is a thin wrapper that calls `new Seriously(opts)` and immediately triggers `initWebGPU()`, returning the promise.

If `requestAdapter()` returns `null` (no WebGPU adapter), Seriously emits a `'backendFallback'` event and falls back to WebGL.

---

## Core Abstraction Mapping

| WebGL concept | WebGPU equivalent |
|---|---|
| `WebGLTexture` (RGBA8) | `GPUTexture` (`rgba8unorm`) |
| `WebGLTexture` (RGBA16F) | `GPUTexture` (`rgba16float`) |
| `WebGLTexture` (RGBA32F) | `GPUTexture` (`rgba32float`) |
| `WebGLFramebuffer` + renderbuffer | `GPUTexture` with `RENDER_ATTACHMENT` usage |
| `ShaderProgram` (vertex + fragment) | `GPURenderPipeline` |
| Compute effect (blur, opticalflow) | `GPUComputePipeline` |
| `gl.uniform*` calls | `GPUBindGroup` (uniform buffer via `GPUBuffer`) |
| `gl.drawArrays(TRIANGLE_STRIP, 0, 4)` | `GPURenderPassEncoder.draw(4)` |
| `gl.dispatchCompute` (ES 3.1, not WebGL) | `GPUComputePassEncoder.dispatchWorkgroups(x, y)` |
| `WebGLSync` / fence | `device.queue.onSubmittedWorkDone()` |
| `gl.readPixels` | `GPUBuffer` (MAP_READ) + `copyTextureToBuffer` |

### GPUFrameBuffer

Replaces the WebGL `FrameBuffer` class. Owns a `GPUTexture` with usages `TEXTURE_BINDING | RENDER_ATTACHMENT | COPY_SRC`. Exposes `.texture` (the `GPUTexture`) and `.view` (a `GPUTextureView`).

```js
class GPUFrameBuffer {
    constructor(device, width, height, format = 'rgba8unorm') {
        this.format = format;
        this._create(device, width, height);
    }
    _create(device, width, height) {
        this.texture = device.createTexture({
            size: [width, height, 1],
            format: this.format,
            usage: GPUTextureUsage.TEXTURE_BINDING
                 | GPUTextureUsage.RENDER_ATTACHMENT
                 | GPUTextureUsage.COPY_SRC,
        });
        this.view = this.texture.createView();
    }
    resize(device, width, height) {
        this.texture.destroy();
        this._create(device, width, height);
    }
    destroy() { this.texture.destroy(); }
}
```

### Uniform Buffer Strategy

WebGL uses individual `gl.uniform*` calls. WebGPU requires uniforms to be packed into a `GPUBuffer` with `UNIFORM` usage.

Each effect's uniform block is described as a flat `Float32Array` / `Int32Array`. On every frame before dispatch, the array is written to a mapped staging buffer (or via `device.queue.writeBuffer`) and bound to bind group 0, binding 0.

For effects with many small uniforms (color, vector2, float), the entire uniform block is rebuilt each frame in a TypedArray and uploaded with `writeBuffer`. This matches how `gl.uniform*` works today and keeps the per-effect code simple.

### Bind Group Layout

Each render/compute pipeline uses a fixed two-group layout:

- **Group 0, binding 0**: uniform buffer (effect parameters)
- **Group 1, binding N**: input textures + samplers (one pair per input)

The sampler is always `clamp-to-edge`, `linear` filter. For effects that need `nearest` (e.g. `channels`), the pipeline descriptor specifies it explicitly.

---

## Effect Categories

### Category A — Render Pipeline (pass-through effects)

These effects take one or more input textures and write to an output texture using a fragment shader. The WebGL implementation is `gl.drawArrays(TRIANGLE_STRIP, 0, 4)` over a full-screen quad.

The WebGPU equivalent uses a `GPURenderPipeline` with:
- A minimal vertex shader that emits a full-screen triangle (no vertex buffer needed — positions computed from `vertex_index`)
- The effect's fragment shader, rewritten in WGSL

All 59 current effects fall into this category. The WGSL fragment shader is a mechanical translation of the GLSL; no algorithmic changes are needed.

**Full-screen triangle vertex shader (shared across all render-pipeline effects):**

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    // Emit a triangle that covers the full clip space
    let x = f32((vi & 1u) << 2u) - 1.0;
    let y = f32((vi & 2u) << 1u) - 1.0;
    return vec4f(x, y, 0.0, 1.0);
}
```

### Category B — Compute Pipeline (compute-heavy effects)

These effects benefit most from avoiding vertex/rasterization overhead. Each pixel (or block of pixels) is a workgroup invocation.

Effects in this category:
- `blur` — separable Gaussian; 10 draw calls → 2 compute dispatches per frame
- `opticalflow` — Horn-Schunck iteration; benefits from shared memory in workgroups
- Future: denoise, upscale

---

## WGSL Shader Strategy

There is no GLSL-to-WGSL transpiler available in-browser. WGSL shaders must be written from scratch. The approach:

1. Each effect that supports WebGPU gains a `wgsl` property alongside its existing `shader` (GLSL) property in the plugin definition.
2. The WebGPU backend checks for `effect.wgsl` at pipeline creation time. If absent, it falls back to WebGL for that effect node.
3. Start with `blur` and `opticalflow` (highest compute benefit). Port remaining effects incrementally.

WGSL for Seriously.js follows these conventions:
- Uniform structs are named `Params` and bound at group 0, binding 0.
- Input textures at group 1, bindings 0, 2, 4 … (odd bindings are samplers).
- Output texture (compute only) at group 2, binding 0 as `texture_storage_2d<rgba8unorm, write>`.

---

## Blur — Compute Shader Sketch

Current WebGL: 5 passes × 2 directions = 10 `drawArrays` calls per frame. Each pass halves the intermediate resolution before upscaling.

WebGPU: 2 compute dispatches per pass (horizontal, vertical). A 16×16 workgroup reads a tile with halo into shared memory, applies the 1D Gaussian, writes output. This eliminates rasterization overhead and enables true shared-memory reads.

```wgsl
// blur_horizontal.wgsl
struct Params {
    sigma:  f32,
    width:  u32,
    height: u32,
    radius: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(1) @binding(0) var src: texture_2d<f32>;
@group(1) @binding(1) var src_sampler: sampler;
@group(2) @binding(0) var dst: texture_storage_2d<rgba16float, write>;

const TILE_W = 16u;
const TILE_H = 16u;

var<workgroup> tile: array<array<vec4f, TILE_W + 64u>, TILE_H>;

@compute @workgroup_size(TILE_W, TILE_H)
fn main(
    @builtin(global_invocation_id) gid: vec3u,
    @builtin(local_invocation_id)  lid: vec3u,
) {
    let W = params.width;
    let H = params.height;
    let r = params.radius;

    // Load halo into shared memory
    let base_x = i32(gid.x) - i32(r);
    for (var k = lid.x; k < TILE_W + 2u * r; k += TILE_W) {
        let sx = clamp(base_x + i32(k), 0, i32(W) - 1);
        let sy = i32(gid.y);
        tile[lid.y][k] = textureLoad(src, vec2i(sx, sy), 0);
    }
    workgroupBarrier();

    if (gid.x >= W || gid.y >= H) { return; }

    // Gaussian weights (computed from sigma)
    var acc = vec4f(0.0);
    var weight_sum = 0.0;
    for (var k = 0u; k <= 2u * r; k++) {
        let offset = f32(i32(k) - i32(r));
        let w = exp(-0.5 * (offset * offset) / (params.sigma * params.sigma));
        acc += tile[lid.y][lid.x + k] * w;
        weight_sum += w;
    }

    textureStore(dst, vec2u(gid.x, gid.y), acc / weight_sum);
}
```

The vertical pass is identical with axes swapped. The progressive downscaling passes (0.2 → 0.3 → 0.5 → 0.8 → 1.0) each use a `GPUFrameBuffer` at the scaled resolution, matching the current WebGL approach.

---

## Optical Flow — Buffer Swap

Current WebGL: two passes per frame (compute flow to output, `gl.copyTexImage2D` to `previousFrameBuffer`). The copy is a full texture blit.

WebGPU: replace the copy with a buffer swap. `previousFrame` and `currentFrame` are two `GPUFrameBuffer` instances. After the compute dispatch writes to `outputTex`, swap the `GPUTexture` references:

```js
[this.previousFrameBuf, this.currentFrameBuf] =
    [this.currentFrameBuf, this.previousFrameBuf];
```

No GPU copy, no CPU round-trip. This matches the `//todo: just swap buffers rather than copy?` comment already in `effects/seriously.opticalflow.js`.

---

## Implementation Phases

### Phase 5.1 — Core WebGPU plumbing

- `Seriously({ backend: 'webgpu' })` constructor path
- `initWebGPU()` lazy init + `Seriously.createAsync()`
- `GPUFrameBuffer` class
- Render-pipeline base: full-screen triangle vertex shader, bind group layout, uniform buffer management
- `Seriously.capabilities()` WebGPU fields
- `Seriously.incompatible()` returns `true` if `backend: 'webgpu'` is requested but unavailable

### Phase 5.2 — First render-pipeline effect (proof of concept)

Port `effects/seriously.hue-saturation.js` to WebGPU — simple single-input, three-float-uniform effect. Validates the full pipeline from constructor to canvas output.

### Phase 5.3 — Blur compute pipeline

- Implement `blur_horizontal.wgsl` and `blur_vertical.wgsl`
- Wire into `effects/seriously.blur.js` as the `wgpu` path
- Benchmark against WebGL baseline (target: ≥2× throughput on 1080p, 5-pass blur)

### Phase 5.4 — Optical flow compute pipeline

- Implement Horn-Schunck WGSL compute shader
- Add buffer-swap optimization to replace `copyTexImage2D`
- Wire into `effects/seriously.opticalflow.js`

### Phase 5.5 — Remaining effects

Port remaining 57 effects. Most are mechanical GLSL→WGSL translations. A script can automate ~80% of this (vec/mat type renames, texture sampling syntax, uniform struct generation).

---

## Testing

Unit tests (Vitest + happy-dom) cannot test WebGPU — `navigator.gpu` is not available in happy-dom. WebGPU tests require a real browser.

Plan:
- Add a Playwright test suite (`test/webgpu/`) that runs in Chrome with `--enable-unsafe-webgpu` (available in Chrome 113+).
- Each test instantiates `Seriously({ backend: 'webgpu' })`, attaches a test source (solid colour `ImageData`), applies an effect, reads back pixels via `readPixels()`, and asserts colour values.
- CI: add a `test:webgpu` job running on `ubuntu-latest` with `playwright` and `chromium`.

---

## Open Questions

1. **Fallback granularity**: if an effect node in the graph has no WGSL shader, should the entire instance fall back to WebGL, or should individual nodes fall back while others use WebGPU? The per-node fallback is more flexible but requires texture sharing — which requires the `WEBGL_webgpu_interop` extension. For now: **instance-level fallback** (if any node in the graph lacks WGSL, fall back to WebGL for the whole instance).

2. **`readPixels()` on WebGPU**: WebGPU readback is async (`copyTextureToBuffer` + `mapAsync`). The current `readPixels()` is synchronous. Either add `readPixelsAsync()` or return a `Promise` from `readPixels()` when `backend === 'webgpu'`.

3. **Canvas target**: The WebGPU canvas context is `canvas.getContext('webgpu')` with a `GPUCanvasConfiguration`. This is incompatible with the current `targets/seriously.canvas.js` which calls `gl.drawArrays`. A new `targets/seriously.canvas-webgpu.js` target (or a branch inside the existing target) is needed.
