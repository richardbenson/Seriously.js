# Seriously.js Effects Reference

Seriously.js ships with 59 GPU-accelerated effect plugins plus 5 source plugins, 1 target plugin, and 2 transform plugins. All effects are WebGL fragment shaders invoked through the node-graph API.

## Using an Effect

```js
var seriously = new Seriously();
var effect = seriously.effect('blur');
effect.source = seriously.source('#my-video');
effect.amount = 0.5;
var target = seriously.target('#my-canvas');
target.source = effect;
seriously.go();
```

---

## Effects by Category

### Color Grading & Correction

#### `brightness-contrast`
Basic brightness and contrast adjustment.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `brightness` | number | 0 | –1 … 1 |
| `contrast` | number | 0 | –1 … 1 |

---

#### `exposure`
Exposure compensation applied as a multiplicative factor.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `exposure` | number | 0 | –10 … 10 |

---

#### `hue-saturation`
Rotate hue and scale saturation.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `hue` | number (0–1) | 0.4 |
| `saturation` | number | 0 |

---

#### `highlights-shadows`
Separate lift for highlight and shadow regions.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `highlights` | number | 0 | –1 … 1 |
| `shadows` | number | 0 | –1 … 1 |

---

#### `vibrance`
Intelligent saturation boost that targets muted colours more strongly than already-saturated ones.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `vibrance` | number | 0 | –1.2 … 1.2 |

---

#### `tone`
Separate tonal control over shadows, midtones, and highlights.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `cyan` | number | 0 | –1 … 1 |
| `magenta` | number | 0 | –1 … 1 |
| `yellow` | number | 0 | –1 … 1 |

---

#### `temperature`
Shift colour temperature in Kelvin. 6500 K is neutral (daylight).

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `temperature` | number | 6500 | 2000 … 12000 |

---

#### `whitebalance`
Full white balance correction: supply the colour that should become white.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `white` | color | `[1, 1, 1]` |
| `auto` | boolean | true |

---

#### `linear-transfer`
Convert between gamma-encoded (sRGB) and linear light. Essential for colour-correct compositing.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `linearize` | boolean | true |

---

#### `lut`
Apply a 1D colour look-up table supplied as an image strip.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `lut` | image | — | — |
| `amount` | number | 1 | 0 … 1 |

---

#### `colorcube`
Apply a 3D colour cube LUT (a.k.a. colour cube). The LUT is encoded as a square image. Supports variable cube sizes (8, 16, 32, 64).

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `cube` | image | — |
| `size` | number | 8 |

---

#### `bleach-bypass`
Cinematic bleach bypass look: desaturated with boosted contrast.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 1 | 0 … 1 |

---

#### `sepia`
Classic sepia tone.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 1 | 0 … 1 |

---

#### `falsecolor`
Map luminance values to a false colour ramp for exposure analysis.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 1 | 0 … 1 |

---

#### `invert`
Invert all colour channels (optionally including alpha).

| Input | Type | Default |
|---|---|---|
| `source` | image | — |

---

#### `colorcomplements`
Complementary and split-complementary colour grading.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `hue` | number | 0 |
| `saturation` | number | 1 |
| `amount` | number | 0.5 |

---

### Keying & Compositing

#### `chroma`
Green/blue screen removal. Supports mask preview.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `screen` | color | `[0.26, 0.76, 0.12, 1]` (green) |
| `weight` | number | 1 |
| `balance` | number | 1 |
| `clipBlack` | number | 0 |
| `clipWhite` | number | 1 |
| `mask` | boolean | false |

---

#### `lumakey`
Remove pixels by brightness — useful for titles on white/black backgrounds.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `luma` | number | 0 |
| `tolerance` | number | 0.1 |
| `softness` | number | 0.1 |
| `invert` | boolean | false |

---

#### `blend`
Composite two layers with one of 27 blend modes plus gamma-correct blending.

| Input | Type | Default |
|---|---|---|
| `top` | image | — |
| `bottom` | image | — |
| `opacity` | number | 1 |
| `blendGamma` | number | 2.2 |
| `sizeMode` | enum | `'bottom'` |
| `mode` | enum | `'normal'` |

Blend modes: `normal`, `lighten`, `darken`, `multiply`, `average`, `add`, `subtract`, `difference`, `negation`, `exclusion`, `screen`, `overlay`, `softLight`, `hardLight`, `colorDodge`, `colorBurn`, `linearDodge`, `linearBurn`, `linearLight`, `vividLight`, `pinLight`, `hardMix`, `reflect`, `glow`, `phoenix`, `hue`, `color`, `luminosity`, `saturation`.

---

#### `layers`
Composite a variable number of layers (dynamically expandable inputs).

| Input | Type | Default |
|---|---|---|
| `source0` … `sourceN` | image | — |
| `opacity0` … `opacityN` | number | 1 |
| `sizeMode` | enum | `'0'` |

---

#### `fader`
Simple opacity/alpha fade.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `opacity` | number | 1 | 0 … 1 |

---

#### `accumulator`
Draw the current frame on top of a persistent buffer — creates motion trails and frame blending effects. Supports the same blend modes as `blend`.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `clear` | boolean | false |
| `startColor` | color | `[0,0,0,0]` |
| `opacity` | number | 1 |
| `blendGamma` | number | 2.2 |
| `blendMode` | enum | `'normal'` |

---

#### `channels`
Re-route R/G/B/A channels between two sources. Each output channel can be sourced from any channel of either input.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `redSource` | image | — |
| `greenSource` | image | — |
| `blueSource` | image | — |
| `red` | enum | 0 (red) |
| `green` | enum | 1 (green) |
| `blue` | enum | 2 (blue) |
| `alpha` | enum | 3 (alpha) |
| `sizeMode` | enum | `'red'` |

---

#### `select`
Switch between multiple inputs programmatically.

| Input | Type | Default |
|---|---|---|
| `source0` … `sourceN` | image | — |
| `index` | number | 0 |

---

#### `gradientwipe`
Gradient-driven wipe transition between two images. Any greyscale image can be used as the wipe map.

| Input | Type | Default |
|---|---|---|
| `from` | image | — |
| `to` | image | — |
| `gradient` | image | — |
| `progress` | number | 0 |
| `softness` | number | 0.1 |

---

### Blur & Filtering

#### `blur`
Two-pass Gaussian blur with gamma-correct blending.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 0.2 | 0 … 1 |
| `blendGamma` | number | 2.2 | — |

---

#### `directionblur`
Directional (motion) blur.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 0.1 | 0 … 1 |
| `angle` | number | 0 | 0 … 360 |
| `blendGamma` | number | 2.2 | — |

---

#### `fxaa`
Fast Approximate Anti-Aliasing — softens jagged edges.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |

---

### Distortion & Geometry

#### `displacement`
Distort a source image using a displacement map. Each colour channel of the map drives displacement in a different direction.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `map` | image | — | — |
| `scaleX` | number | 0.1 | –1 … 1 |
| `scaleY` | number | 0.1 | –1 … 1 |

---

#### `ripple`
Sine-wave ripple/water distortion.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `time` | number | 0 |
| `amplitude` | number | 0.1 |
| `frequency` | number | 20 |
| `speed` | number | 1 |

---

#### `polar`
Convert between rectangular and polar coordinates.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `convert` | enum | `'rect-to-polar'` |

---

#### `panorama`
Cylindrical/spherical panorama projection for 360° video.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `lat` | number | 0 |
| `lon` | number | 0 |
| `fov` | number | 90 |

---

#### `kaleidoscope`
Mirror-tiling kaleidoscope effect.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `segments` | number | 6 |
| `angle` | number | 0 |

---

#### `crop`
Crop to a rectangle with pan support.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `left` | number | 0 | 0 … 1 |
| `right` | number | 1 | 0 … 1 |
| `top` | number | 0 | 0 … 1 |
| `bottom` | number | 1 | 0 … 1 |

---

#### `repeat`
Tile / repeat the source image.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `x` | number | 2 |
| `y` | number | 2 |

---

#### `pixelate`
Large pixel / mosaic effect.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 0.1 | 0 … 1 |

---

#### `hex`
Hexagonal tile pixelation.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `scale` | number | 20 |

---

#### `mirror`
Horizontal and/or vertical flip.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `horizontal` | boolean | false |
| `vertical` | boolean | false |

---

#### `split`
Split-screen: apply different effects to two halves (uses transforms to define the split point and orientation).

| Input | Type | Default |
|---|---|---|
| `top` | image | — |
| `bottom` | image | — |
| `blendGamma` | number | 2.2 |

---

### Stylistic & Creative

#### `ascii`
Convert the image to coloured ASCII art.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `background` | color | `[0,0,0,1]` |
| `characters` | string | (ASCII ramp) |

---

#### `sketch`
Pencil sketch look derived from edge detection.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `amount` | number | 1 |

---

#### `edge`
Frei-Chen edge detection.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `amount` | number | 0.5 |

---

#### `emboss`
Emboss / relief lighting effect.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `amount` | number | 1 |
| `angle` | number | 0 |

---

#### `scanlines`
CRT-style horizontal scanlines.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `count` | number | 512 |
| `color` | color | `[0,0,0,1]` |
| `opacity` | number | 0.5 |

---

#### `tvglitch`
VHS/CRT glitch with distortion, colour fringing, horizontal bars, and frame shape.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `time` | number | 0 |
| `distortion` | number | 0.1 |
| `verticalSync` | number | 0.1 |
| `lineSync` | number | 0.2 |
| `scanlines` | number | 0.3 |
| `bars` | number | 0 |
| `barsRate` | number | 1 |
| `frameShape` | number | 0.27 |
| `frameLimit` | number | 0.34 |
| `frameSharpness` | number | 8.4 |
| `frameColor` | color | `[0,0,0,1]` |

---

#### `filmgrain`
Animated film grain texture.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `time` | number | 0 |
| `amount` | number | 0.1 |
| `size` | number | 1 |

---

#### `nightvision`
Green phosphor night-vision look.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |

---

#### `daltonize`
Simulate or correct colour blindness (protanopia, deuteranopia, tritanopia).

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `type` | enum | `'deuteranopia'` |
| `correction` | boolean | false |

---

#### `color-select`
Desaturate everything except pixels close to a chosen colour.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `color` | color | `[1,0,0,1]` |
| `range` | number | 0.2 |
| `softness` | number | 0.1 |
| `saturation` | number | 0 |

---

#### `dither`
Ordered (Bayer matrix) dithering.

| Input | Type | Default | Range |
|---|---|---|---|
| `source` | image | — | — |
| `amount` | number | 1 | 0 … 1 |

---

#### `vignette`
Darken or lighten edges.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `amount` | number | 0.5 |
| `size` | number | 0.5 |

---

### Procedural Generators (Sources)

#### `color`
Solid colour generator.

| Input | Type | Default |
|---|---|---|
| `color` | color | `[0,0,0,1]` |

---

#### `checkerboard`
Generates a checkerboard pattern.

| Input | Type | Default |
|---|---|---|
| `color1` | color | `[0,0,0,1]` |
| `color2` | color | `[1,1,1,1]` |
| `rows` | number | 8 |
| `columns` | number | 8 |

---

#### `simplex`
Simplex noise generator (outputs animated noise texture).

| Input | Type | Default |
|---|---|---|
| `time` | number | 0 |
| `scale` | number | 1 |
| `speed` | number | 1 |
| `color` | color | `[1,1,1,1]` |

---

#### `noise`
Random noise overlay.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `time` | number | 0 |
| `amount` | number | 0.1 |

---

### Utility & System

#### `expression`
Custom per-pixel GLSL expression written as a JS string. Supports up to 4 numeric inputs (`a`, `b`, `c`, `d`) and separate expressions for `rgb`, `red`, `green`, `blue`, `alpha`.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `a` | number | 0 |
| `b` | number | 0 |
| `c` | number | 0 |
| `d` | number | 0 |
| `rgb` | string | — |
| `red` | string | — |
| `green` | string | — |
| `blue` | string | — |
| `alpha` | string | — |

---

#### `opticalflow`
Horn–Schunck optical flow: computes a per-pixel motion vector field and outputs it as an RG texture.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `lambda` | number | 0 |
| `scaleResult` | vector | `[1,1]` |
| `offset` | number | 1 |

---

#### `freeze`
Hold a single frame. Rendering stops as soon as `freeze` is set to `true`.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `freeze` | boolean | false |

---

#### `throttle`
Artificially reduce frame rate.

| Input | Type | Default |
|---|---|---|
| `source` | image | — |
| `rate` | number | 30 |

---

### Transforms

Transforms are applied to any node via `node.transform('3d')` rather than as pipeline effects.

#### `3d`
Full 3D perspective transform: translate, rotate, scale with configurable rotation order.

| Property | Type |
|---|---|
| `translateX/Y/Z` | number |
| `rotateX/Y/Z` | number (degrees) |
| `scaleX/Y/Z` | number |
| `rotationOrder` | string (`'xyz'`, etc.) |

---

#### `camerashake`
Animated camera shake using Simplex noise.

| Property | Type | Default |
|---|---|---|
| `x` | number | 0 |
| `y` | number | 0 |
| `time` | number | 0 |
| `speed` | number | 1 |
| `amount` | number | 0.05 |

---

## Sources

| Hook | Description |
|---|---|
| `video` | HTML `<video>` element |
| `image` | HTML `<img>` element or URL |
| `canvas` | HTML `<canvas>` element |
| `camera` | Webcam via `getUserMedia` |
| `imagedata` | `ImageData` or typed array |
| `three` | Three.js scene (requires `seriously.three.js`) |

## Targets

| Hook | Description |
|---|---|
| *(canvas)* | Any HTML `<canvas>` is a valid target (default) |
| `three` | Three.js texture target (requires `targets/seriously.three.js`) |
