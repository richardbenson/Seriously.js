/**
 * Seriously.js — full bundle entry point.
 *
 * Import this to get the Seriously core pre-loaded with every built-in
 * effect, source, and transform. For smaller bundles, import the core
 * and individual effects directly:
 *
 *   import Seriously from 'seriously';
 *   import 'seriously/effects/blur';
 */
import Seriously from '../seriously.js';

// Effects
import '../effects/seriously.accumulator.js';
import '../effects/seriously.ascii.js';
import '../effects/seriously.bleach-bypass.js';
import '../effects/seriously.blend.js';
import '../effects/seriously.blur.js';
import '../effects/seriously.brightness-contrast.js';
import '../effects/seriously.channels.js';
import '../effects/seriously.checkerboard.js';
import '../effects/seriously.chroma.js';
import '../effects/seriously.color.js';
import '../effects/seriously.color-select.js';
import '../effects/seriously.colorcomplements.js';
import '../effects/seriously.colorcube.js';
import '../effects/seriously.crop.js';
import '../effects/seriously.daltonize.js';
import '../effects/seriously.directionblur.js';
import '../effects/seriously.displacement.js';
import '../effects/seriously.dither.js';
import '../effects/seriously.edge.js';
import '../effects/seriously.emboss.js';
import '../effects/seriously.exposure.js';
import '../effects/seriously.expression.js';
import '../effects/seriously.fader.js';
import '../effects/seriously.falsecolor.js';
import '../effects/seriously.filmgrain.js';
import '../effects/seriously.freeze.js';
import '../effects/seriously.fxaa.js';
import '../effects/seriously.gradientwipe.js';
import '../effects/seriously.hex.js';
import '../effects/seriously.highlights-shadows.js';
import '../effects/seriously.hue-saturation.js';
import '../effects/seriously.invert.js';
import '../effects/seriously.kaleidoscope.js';
import '../effects/seriously.layers.js';
import '../effects/seriously.linear-transfer.js';
import '../effects/seriously.lumakey.js';
import '../effects/seriously.lut.js';
import '../effects/seriously.mirror.js';
import '../effects/seriously.nightvision.js';
import '../effects/seriously.noise.js';
import '../effects/seriously.opticalflow.js';
import '../effects/seriously.panorama.js';
import '../effects/seriously.pixelate.js';
import '../effects/seriously.polar.js';
import '../effects/seriously.repeat.js';
import '../effects/seriously.ripple.js';
import '../effects/seriously.scanlines.js';
import '../effects/seriously.select.js';
import '../effects/seriously.sepia.js';
import '../effects/seriously.simplex.js';
import '../effects/seriously.sketch.js';
import '../effects/seriously.split.js';
import '../effects/seriously.temperature.js';
import '../effects/seriously.throttle.js';
import '../effects/seriously.tone.js';
import '../effects/seriously.tvglitch.js';
import '../effects/seriously.vibrance.js';
import '../effects/seriously.vignette.js';
import '../effects/seriously.whitebalance.js';

// Sources
import '../sources/seriously.array.js';
import '../sources/seriously.camera.js';
import '../sources/seriously.depth.js';
import '../sources/seriously.imagedata.js';
import '../sources/seriously.videoframe.js';

// Targets
import '../targets/seriously.videoframe.js';

// Transforms
import '../transforms/seriously.camerashake.js';
import '../transforms/seriously.transform3d.js';

export default Seriously;
