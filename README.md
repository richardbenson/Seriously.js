# Seriously.js

Seriously.js is a real-time, node-based video compositor for the web.
Inspired by professional software such as After Effects and Nuke,
Seriously.js renders high-quality video effects, but allows them to be
dynamic and interactive.

## Installation

```bash
npm install seriously
```

## Usage

### ES modules (tree-shakable — import only what you need)

```js
import Seriously from 'seriously';
import 'seriously/effects/blur';
import 'seriously/effects/chroma';

const seriously = new Seriously();
const source = seriously.source(document.querySelector('video'));
const chroma  = seriously.effect('chroma');
const blur    = seriously.effect('blur');

chroma.source = source;
chroma.screen = [0.2, 0.8, 0.1, 1];
blur.source   = chroma;
blur.amount   = 0.3;

const target = seriously.target(document.querySelector('canvas'));
target.source = blur;
seriously.go();
```

### Full bundle (all 59 effects pre-loaded)

```js
import Seriously from 'seriously/all';
// or in a <script> tag:
// <script src="dist/seriously.all.js"></script>
```

### Build from source

```bash
npm install
npm run build   # outputs to dist/
```

## Getting Started

See [`docs/EFFECTS.md`](docs/EFFECTS.md) for a full reference of all effects and their parameters.
See [`docs/MODERNISATION.md`](docs/MODERNISATION.md) for the ongoing modernisation roadmap.

Original documentation and tutorials are at the [wiki](https://github.com/brianchirls/Seriously.js/wiki).

## Features

- GPU-accelerated via WebGL, up to 60 fps
- 59 built-in effects: colour grading, keying, blurs, distortion, creative and more
- Node-graph architecture — chain effects together freely
- Accepts `video`, `image`, `canvas`, `webcam`, `ImageData`, and Three.js sources
- Effect parameters accept numbers, colours, booleans, enums, and HTML form inputs
- Basic 2D and 3D transforms on any node
- Plugin architecture for custom effects, sources and targets
- Read pixel data from any node

### Included Effects
- Accumulator
- Ascii Text
- Bleach Bypass
- Blend
- Brightness/Contrast
- Channel Mapping
- Checkerboard Generator
- Chroma Key
- Color Complements
- [Color Cube](http://www.youtube.com/watch?v=rfQ8rKGTVlg&t=24m30s)
- Color Generator
- Color Look-Up Table
- Color Select
- Color Temperature
- Crop
- [Daltonize](http://www.daltonize.org/p/about.html)
- Directional Blur
- Displacement Map
- Dither
- Edge Detect
- Emboss
- Exposure Adjust
- Expressions
- Fader
- False Color
- Fast Approximate Anti-Aliasing
- Film Grain
- Freeze Frame
- Gaussian Blur
- Hex Tiles
- Highlights/Shadows
- Hue/Saturation Adjust
- Invert
- Kaleidoscope
- Layers
- Linear Transfer
- Luma Key
- Mirror
- Night Vision
- Optical Flow
- Panorama
- Pixelate
- Polar Coordinates
- Ripple
- Scanlines
- Sepia tone
- Simplex Noise
- Sketch
- Split
- Throttle Frame Rate
- Tone Adjust
- TV Glitch
- Vibrance
- Vignette
- White Balance

### Requirements

#### WebGL

Seriously.js requires a browser that supports [WebGL](http://en.wikipedia.org/wiki/Webgl). 
Development is targeted to and tested in Firefox (4.0+), Google Chrome (9+), Internet Explorer (11+) and Opera (18+). Safari is [expected to support WebGL](http://caniuse.com/#search=webgl)
in the near future.

Even though a browser may support WebGL, the ability to run it depends
on the system's graphics card. Seriously.js is heavily optimized, so most
modern desktops and notebooks should be sufficient. Older systems may
run slower, especially when using high-resolution videos.

Mobile browser support for WebGL has improved. Mobile Firefox, Chrome and Safari have decent
support, but they can be slower than desktop versions due to limited system resources.

Seriously.js provides a method to detect browser support and offer
descriptive error messages wherever possible.

#### Cross-Origin Videos and Images

Due to security limitations of WebGL, Seriously.js can only process video
or images that are served from the same domain, unless they are served
with [CORS headers](http://hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/).
Firefox, Chrome and Opera support CORS for video, but Safari and Internet Explorer do not, and videos served with CORS are rare. So for now, it is best to host your own video files.

## Contributing

Bug fixes, new features, effects and examples are welcome and appreciated. Please follow the [Contributing Guidelines](https://github.com/brianchirls/Seriously.js/wiki/Contributing).

## License
Seriously.js is made available under the [MIT License](http://www.opensource.org/licenses/mit-license.php).

Individual plugins may be licensed differently. Check source code comments.

## Credits

Seriously.js is created and maintained by [Brian Chirls](http://chirls.com)