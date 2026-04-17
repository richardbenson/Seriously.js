# Seriously.js Modernisation Plan

## Current State

Seriously.js was last actively maintained in **2016**. The core architecture is solid — the node graph, shader pipeline, and effect library are all well-designed and the GLSL shaders are still valid. What needs updating is everything around them: the module system, video integration, build tooling, and browser API usage.

**Runtime:** WebGL 1.0 only, ES5, UMD/AMD module pattern, no npm package, no build step, all 59 effects loaded as separate script tags.

---

## Branch Reconciliation (completed)

The following branches were assessed and merged or noted:

### Merged

| Branch | What was brought in |
|---|---|
| `develop` | 15 commits: chroma divide-by-zero fix, blend repeating-pixels fix, layers alpha blending fix, blur shader pre-fetch optimisation, directional blur multi-node fix, canvas source resize fix, expression AMD fix, channels alphaSource crash fix, colorcube variable `size` param, colour validator refactor, iframe support, LUT effect, colour temperature effect, accumulator `startColor` input, CommonJS UMD headers for all plugins |
| `purge` | `.purge()` and `.restore()` methods on all node types and the Seriously instance |

### Not merged — conflicts requiring rewrite

| Branch | Reason not merged |
|---|---|
| `feature/defFunctions` | Allows plugin definitions to be functions (deferred input declaration, `this` bound to effect node). Conflicts throughout effect files because it changed `draw` to `parent` as the calling convention — a clean reimplementation during modernisation is preferable. See **Phase 4** below. |
| `transform-fix` | Incomplete architectural refactor of how transforms compose with non-in-place effects (faster, less GPU memory, fixes #54). Five commits are mutually dependent and can't be cherry-picked individually. The `ShaderProgram` uniform-array fix and the `transformDirty` fix are embedded in this branch but are not separable from the architectural change. See **Phase 3** below. |

### Not merged — obsolete or incomplete

| Branch | Reason skipped |
|---|---|
| `monitor` | Adds a `monitor(fn)` method to watch any object property and drive an effect parameter. Interesting feature but the branch diverged from a very old codebase base (2011). Better reimplemented using a reactive/observable pattern. See **Phase 4**. |
| `loadsave` | Partially implemented serialise/deserialise of the node graph. Complex and unfinished. Deferred to **Phase 5**. |
| `loop` | Single commit starting cyclic graph support. Incomplete. Deferred. |
| `multi-input` | Work started on array-typed inputs for effects. Incomplete. Relevant to **Phase 3**. |
| `video-texture-workaround` | Already in master (0 unique commits). |
| `transform` / `precision` / `noise` | Already in master (0 unique commits). |
| `CubicVR` | CubicVR 3D engine integration. Engine is unmaintained; not relevant. |
| `rainbow` | Firefox Rainbow plugin camera examples. Firefox Rainbow is obsolete. |
| `setTimeoutZero` | Whitespace and syntax cleanup only. No functional change worth a merge. |

---

## Modernisation Plan

The goal is to make Seriously.js useful in a modern web app that processes video — specifically targeting use cases like frame-accurate effect preview, live camera processing, and VideoFrame-based pipelines (WebCodecs, MediaStreamTrackProcessor).

### Phase 1 — Packaging & Module System *(unblocks everything else)*

The library cannot currently be `import`ed in any modern JS project.

- [x] Add `package.json` with proper `main`, `module`, and `exports` fields
- [x] Convert `seriously.js` and all 68 plugins to **ES modules** (`export default`, `import`) via `scripts/convert-to-esm.py`
- [x] Remove the hard `window` parameter (`}(window, function(window){`) — replaced with `globalThis`/`self`/`global` environment detection
- [x] Set up **Rollup** with:
  - `dist/seriously.all.js` — UMD bundle with all 59 effects (395 KB)
  - `dist/seriously.all.cjs.js` — CJS bundle with all effects (381 KB)
  - `dist/seriously.cjs.js` — CJS core only (154 KB)
  - `dist/esm/` — individual ESM files per effect for tree-shaking
- [ ] Publish to npm
- [x] Update `README.md` with npm install instructions and ES module usage

> **Note:** `expression.js` contained an embedded minified jsep v0.2.9 library with a literal newline byte inside a string constant (valid in old parsers, rejected by Rollup). Fixed by escaping it as `\n` and adding a local `window` alias for the jsep self-registration call.

**Effort:** ~2–3 days. No shader or API changes required.

---

### Phase 2 — Video Source Modernisation *(high-value for video apps)*

The current `video` source polls `requestAnimationFrame` and re-uploads the texture every frame regardless of whether the video decoder has produced a new frame.

- [x] Add `requestVideoFrameCallback` support to the `video` source node so texture upload is synchronised with the video decoder (eliminates redundant GPU uploads and frame tearing on high frame rate sources)
- [x] Add a **`VideoFrame` source node** (`sources/seriously.videoframe.js`) accepting `VideoFrame` objects from:
  - `HTMLVideoElement.requestVideoFrameCallback`
  - `VideoDecoder` (WebCodecs)
  - `MediaStreamTrackProcessor`
  - `ImageCapture`
- [x] Add a **`VideoFrame` target** (`targets/seriously.videoframe.js`) that outputs `VideoFrame` objects for use with `VideoEncoder` or `MediaStreamTrackGenerator` — enabling a fully GPU-accelerated encode pipeline
- [x] Update `sources/seriously.camera.js` to use the modern `getUserMedia` API (remove vendor-prefixed `webkitGetUserMedia`/`mozGetUserMedia` fallbacks); add `requestVideoFrameCallback` support

> **Note:** The VideoFrame target must be the primary (first) WebGL target in a Seriously instance, since it creates the rendering canvas. For pipelines requiring both a visible canvas and encoded output, use two Seriously instances or listen to the `'render'` event on a canvas target and call `new VideoFrame(canvas, …)` in the handler.

**Effort:** ~3–4 days.

---

### Phase 3 — WebGL 2 Upgrade *(quality & capability)*

WebGL 2.0 has been universally supported since 2018. The upgrade is largely additive.

- [x] Request a `webgl2` context with fallback to `webgl`. `getWebGlContext` now tries `webgl2` first. `attachContext` sets `isWebGL2` flag. Fix `Seriously.incompatible()` (typo `WebGLRenderContext` → checks both `WebGLRenderingContext` and `WebGL2RenderingContext`).
- [x] Replace the `colorcube` 2D-texture LUT encoding with a native `sampler3D` (`TEXTURE_3D`) on WebGL 2 — GLSL ES 3.0 shader with `sampler3D`; on WebGL 2 the plugin reads the slice-encoded 2D texture once and uploads a proper `TEXTURE_3D`. Falls back to the existing slice-interpolation shader on WebGL 1.
- [x] Add a **float texture pipeline**: use `RGBA16F` / `RGBA32F` framebuffers when `EXT_color_buffer_float` is available (WebGL 2) or `OES_texture_float` + `WEBGL_color_buffer_float` (WebGL 1). Add a `precision` option to the Seriously constructor (`'uint8'` | `'float16'` | `'float32'`). `ShaderProgram` `makeShaderSetter` now handles `SAMPLER_3D`. `addShaderName` inserts `#define` after `#version` when present.
- [x] Expose `Seriously.capabilities()` — returns `{ webgl2, floatTextures, halfFloatTextures, floatRenderTargets, halfFloatRenderTargets, multipleRenderTargets }`.
- [ ] Complete the `transform-fix` branch work: the architectural change that moves transform application into the effect's texture lookup (faster, avoids an extra framebuffer per transform node) — deferred to Phase 3.5 / Phase 4 prep
- [ ] Complete/rebase the `multi-input` branch work: allow effects to declare an array-typed input with variable length — deferred

**Effort:** ~1 week.

---

### Phase 4 — API Modernisation *(developer experience)*

- [x] **TypeScript types**: `seriously.d.ts` — covers the Seriously constructor and instance, all 59 effect hooks with typed inputs, Source / Target / Transform node interfaces, and the static `capabilities()` / `incompatible()` / plugin-registration APIs. Wired into `package.json` via `"types"` and `"exports"["."].types`.
- [x] **`feature/defFunctions` reimplementation**: already present — `Seriously.plugin(hook, definitionFn, meta)` stores `effect.definition`; `EffectNode` constructor calls `this.effectRef.definition.call(this, options)` when it is a function, allowing deferred input declaration with `this` bound to the node.
- [ ] **`monitor` feature reimplementation**: expose `effect.watch(property, target)` using a clean observable/signal-compatible API (or a simple getter/setter with dirty-marking) rather than the polling approach in the original branch.
- [x] Replace `Seriously.animate()` / `go(pre, post)` callback pattern with `seriously.on('beforeFrame', cb)` / `seriously.on('afterFrame', cb)` and matching `seriously.off()`. Both events implicitly start the render loop. The existing `go(pre, post)` API is preserved for backwards compatibility.
- [ ] Add `OffscreenCanvas` + `Worker` support: allow the full pipeline to run in a dedicated worker thread when `OffscreenCanvas.transferControlToOffscreen()` is available.
- [ ] Replace `var` + prototype chains with ES2020 classes throughout `seriously.js`.

**Effort:** ~1 week for types + defFunctions + monitor. Worker support is a larger project (~2 weeks).

---

### Phase 5 — Additional Features *(deferred)*

These are useful but lower priority than the above.

- [ ] **Load/Save** (`loadsave` branch): serialise and deserialise the node graph as JSON. Useful for saving effect presets. The branch has partial implementation and tests.
- [ ] **WebGPU compute path**: for compute-heavy effects (`opticalflow`, `blur`, future denoise/upscale), a WebGPU compute shader path would be dramatically faster. WebGPU is now available in Chrome/Edge/Safari/Firefox. This would be a parallel implementation, not a replacement.
- [ ] **HDR / wide-gamut output**: once the float pipeline is in place (Phase 3), add a `rec2020` / `p3` colour space option and an HDR canvas target using `colorSpace: 'display-p3'` or the `HTMLCanvasElement` HDR extensions.
- [ ] **Cyclic graphs** (`loop` branch): allow feedback loops in the node graph (the accumulator already simulates this manually; a first-class loop node would be cleaner).

---

## Breaking Changes Policy

Phase 1 (packaging) and Phase 2 (video sources) are **fully backwards compatible** — no existing API surface changes.

Phase 3 (WebGL 2) is backwards compatible; the fallback to WebGL 1 ensures existing deployments continue to work.

Phase 4 (API modernisation) introduces minor breaking changes:
- ES module `import` replaces `<script>` tag globals (mitigated by the bundled single-file build)
- If `Seriously.animate()` is removed, a deprecation notice and compatibility shim will be provided for at least one major version.

---

## Testing Strategy

The existing QUnit test suite (`test/seriously.unit.js`) runs in-browser and tests core functionality without a headless WebGL implementation. Steps needed:

- [ ] Port tests to **Vitest** with `@vitest/browser` or a headless WebGL provider (e.g. `gl` npm package for Node.js)
- [ ] Add CI via GitHub Actions running tests on every push
- [ ] Add visual regression tests using pixel comparison for key effects
