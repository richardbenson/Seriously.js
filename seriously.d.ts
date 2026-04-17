/**
 * Seriously.js TypeScript declarations.
 * Covers the core API, all built-in effects, sources, targets, and transforms.
 */

// ---------------------------------------------------------------------------
// Primitive input value types
// ---------------------------------------------------------------------------

/** RGBA or RGB tuple, or a CSS color string accepted by the browser. */
export type SeriouslyColor =
  | [r: number, g: number, b: number]
  | [r: number, g: number, b: number, a: number]
  | string;

export type SeriouslyVector2 = [x: number, y: number];
export type SeriouslyVector3 = [x: number, y: number, z: number];
export type SeriouslyVector4 = [x: number, y: number, z: number, w: number];

/** Anything that can be used as an image input to an effect. */
export type SeriouslyImageSource =
  | Effect
  | Source
  | Transform
  | HTMLCanvasElement
  | HTMLImageElement
  | HTMLVideoElement
  | string
  | null;

// ---------------------------------------------------------------------------
// Base node interface shared by Effect, Source, Target, and Transform
// ---------------------------------------------------------------------------

export interface SeriouslyNode {
  readonly id: number;
  readonly width: number;
  readonly height: number;
  render(): void;
  readPixels(x: number, y: number, width: number, height: number, dest?: Uint8Array): Uint8Array;
  on(event: 'ready' | 'unready' | 'render' | 'resize' | 'dirty' | 'webglcontextlost' | 'webglcontextrestored' | string, callback: () => void): void;
  off(event: string, callback: () => void): void;
  destroy(): void;
  isDestroyed(): boolean;
  isReady(): boolean;
  purge(): this;
  restore(): this;
}

// ---------------------------------------------------------------------------
// Input descriptor returned by effect.inputs(name)
// ---------------------------------------------------------------------------

export interface InputDescriptor {
  type: 'image' | 'number' | 'boolean' | 'color' | 'enum' | 'vector' | 'string';
  defaultValue?: unknown;
  title: string;
  description?: string;
  /** Present when type === 'number' */
  min?: number;
  /** Present when type === 'number' */
  max?: number;
  /** Present when type === 'number' */
  step?: number;
  /** Present when type === 'enum' */
  options?: Record<string, string>;
  /** Present when type === 'vector' */
  dimensions?: number;
}

// ---------------------------------------------------------------------------
// Source node
// ---------------------------------------------------------------------------

export interface Source extends SeriouslyNode {
  /** The original DOM element or object backing this source. */
  readonly original: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | VideoFrame | ImageData | unknown;
  update(): void;
  /** Only available on push-based sources (e.g. the videoframe source). */
  push?(frame: VideoFrame): void;
}

// ---------------------------------------------------------------------------
// Target node
// ---------------------------------------------------------------------------

export interface Target extends SeriouslyNode {
  source: SeriouslyImageSource;
  /** The original canvas / element this target renders into. */
  readonly original: HTMLCanvasElement | unknown;
  go(options?: Record<string, unknown>): void;
  stop(): void;
  getTexture(): WebGLTexture | null;
  inputs(name?: string): Record<string, InputDescriptor> | InputDescriptor | null;
}

// ---------------------------------------------------------------------------
// Transform node
// ---------------------------------------------------------------------------

export interface Transform extends SeriouslyNode {
  readonly transform: string;
  readonly title: string;
  source: SeriouslyImageSource;
  [inputName: string]: unknown;
}

// ---------------------------------------------------------------------------
// Generic effect node (fallback when the hook is unknown)
// ---------------------------------------------------------------------------

export interface Effect extends SeriouslyNode {
  readonly effect: string;
  readonly title: string;
  inputs(): Record<string, InputDescriptor>;
  inputs(name: string): InputDescriptor | null;
  alias(inputName: string, aliasName: string): this;
  matte(polygons: [number, number][][] | [number, number][]): void;
  [inputName: string]: unknown;
}

// ---------------------------------------------------------------------------
// Typed effect interfaces — one per built-in plugin
// ---------------------------------------------------------------------------

export interface AccumulatorEffect extends Effect {
  readonly effect: 'accumulator';
  source: SeriouslyImageSource;
  clear: boolean;
  startColor: SeriouslyColor;
  opacity: number;
  blendGamma: number;
  blendMode: 'normal' | string;
}

export interface AsciiEffect extends Effect {
  readonly effect: 'ascii';
  source: SeriouslyImageSource;
  background: SeriouslyColor;
}

export interface BleachBypassEffect extends Effect {
  readonly effect: 'bleach-bypass';
  source: SeriouslyImageSource;
  amount: number;
}

export interface BlendEffect extends Effect {
  readonly effect: 'blend';
  top: SeriouslyImageSource;
  bottom: SeriouslyImageSource;
  opacity: number;
  blendGamma: number;
  sizeMode: 'top' | 'bottom' | 'union' | 'intersection' | string;
  mode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'dodge' | 'burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | string;
}

export interface BlurEffect extends Effect {
  readonly effect: 'blur';
  source: SeriouslyImageSource;
  amount: number;
  blendGamma: number;
}

export interface BrightnessContrastEffect extends Effect {
  readonly effect: 'brightness-contrast';
  source: SeriouslyImageSource;
  brightness: number;
  contrast: number;
}

export interface ChannelsEffect extends Effect {
  readonly effect: 'channels';
  source: SeriouslyImageSource;
  redSource: SeriouslyImageSource;
  greenSource: SeriouslyImageSource;
  blueSource: SeriouslyImageSource;
  alphaSource: SeriouslyImageSource;
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface CheckerboardEffect extends Effect {
  readonly effect: 'checkerboard';
  anchor: SeriouslyVector2;
  size: SeriouslyVector2;
  color1: SeriouslyColor;
  color2: SeriouslyColor;
  width: number;
  height: number;
}

export interface ChromaEffect extends Effect {
  readonly effect: 'chroma';
  source: SeriouslyImageSource;
  screen: SeriouslyColor;
  weight: number;
  balance: number;
  clipBlack: number;
  clipWhite: number;
  mask: boolean;
}

export interface ColorEffect extends Effect {
  readonly effect: 'color';
  color: SeriouslyColor;
  width: number;
  height: number;
}

export interface ColorSelectEffect extends Effect {
  readonly effect: 'color-select';
  source: SeriouslyImageSource;
  hueMin: number;
  hueMax: number;
  hueMinFalloff: number;
  hueMaxFalloff: number;
  saturationMin: number;
  saturationMax: number;
  saturationMinFalloff: number;
  saturationMaxFalloff: number;
  lightnessMin: number;
  lightnessMax: number;
  lightnessMinFalloff: number;
  lightnessMaxFalloff: number;
  mask: boolean;
}

export interface ColorComplementsEffect extends Effect {
  readonly effect: 'colorcomplements';
  source: SeriouslyImageSource;
  amount: number;
  concentration: number;
  correlation: number;
  guideColor: SeriouslyColor;
}

export interface ColorCubeEffect extends Effect {
  readonly effect: 'colorcube';
  source: SeriouslyImageSource;
  cube: SeriouslyImageSource;
  size: number;
}

export interface CropEffect extends Effect {
  readonly effect: 'crop';
  source: SeriouslyImageSource;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface DaltonizeEffect extends Effect {
  readonly effect: 'daltonize';
  source: SeriouslyImageSource;
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | string;
}

export interface DirectionBlurEffect extends Effect {
  readonly effect: 'directionblur';
  source: SeriouslyImageSource;
  amount: number;
  angle: number;
  blendGamma: number;
}

export interface DisplacementEffect extends Effect {
  readonly effect: 'displacement';
  source: SeriouslyImageSource;
  map: SeriouslyImageSource;
  xChannel: 'red' | 'green' | 'blue' | 'alpha' | string;
  yChannel: 'red' | 'green' | 'blue' | 'alpha' | string;
  fillMode: 'color' | 'edge' | 'mirror' | 'wrap' | string;
  color: SeriouslyColor;
  offset: number;
  mapScale: SeriouslyVector2;
  amount: number;
}

export interface DitherEffect extends Effect {
  readonly effect: 'dither';
  source: SeriouslyImageSource;
}

export interface EdgeEffect extends Effect {
  readonly effect: 'edge';
  source: SeriouslyImageSource;
  mode: 'sobel' | 'frei-chen' | string;
}

export interface EmbossEffect extends Effect {
  readonly effect: 'emboss';
  source: SeriouslyImageSource;
  amount: number;
}

export interface ExposureEffect extends Effect {
  readonly effect: 'exposure';
  source: SeriouslyImageSource;
  exposure: number;
}

export interface ExpressionEffect extends Effect {
  readonly effect: 'expression';
  source: SeriouslyImageSource;
  a: number;
  b: number;
  c: number;
  d: number;
  rgb: string;
  red: string;
  green: string;
  blue: string;
  alpha: string;
}

export interface FaderEffect extends Effect {
  readonly effect: 'fader';
  source: SeriouslyImageSource;
  color: SeriouslyColor;
  amount: number;
}

export interface FalseColorEffect extends Effect {
  readonly effect: 'falsecolor';
  source: SeriouslyImageSource;
  black: SeriouslyColor;
  white: SeriouslyColor;
}

export interface FilmGrainEffect extends Effect {
  readonly effect: 'filmgrain';
  source: SeriouslyImageSource;
  time: number;
  amount: number;
  colored: boolean;
}

export interface FreezeEffect extends Effect {
  readonly effect: 'freeze';
  source: SeriouslyImageSource;
  frozen: boolean;
}

export interface FxaaEffect extends Effect {
  readonly effect: 'fxaa';
  source: SeriouslyImageSource;
}

export interface GradientWipeEffect extends Effect {
  readonly effect: 'gradientwipe';
  source: SeriouslyImageSource;
  gradient: SeriouslyImageSource;
  transition: number;
  invert: boolean;
  smoothness: number;
}

export interface HexEffect extends Effect {
  readonly effect: 'hex';
  source: SeriouslyImageSource;
  size: number;
  center: SeriouslyVector2;
}

export interface HighlightsShadowsEffect extends Effect {
  readonly effect: 'highlights-shadows';
  source: SeriouslyImageSource;
  highlights: number;
  shadows: number;
}

export interface HueSaturationEffect extends Effect {
  readonly effect: 'hue-saturation';
  source: SeriouslyImageSource;
  hue: number;
  saturation: number;
}

export interface InvertEffect extends Effect {
  readonly effect: 'invert';
  source: SeriouslyImageSource;
}

export interface KaleidoscopeEffect extends Effect {
  readonly effect: 'kaleidoscope';
  source: SeriouslyImageSource;
  segments: number;
  offset: number;
}

export interface LayersEffect extends Effect {
  readonly effect: 'layers';
  sizeMode: 'first' | 'largest' | 'smallest' | string;
  source0: SeriouslyImageSource;
  source1: SeriouslyImageSource;
  source2: SeriouslyImageSource;
  source3: SeriouslyImageSource;
  opacity0: number;
  opacity1: number;
  opacity2: number;
  opacity3: number;
}

export interface LinearTransferEffect extends Effect {
  readonly effect: 'linear-transfer';
  source: SeriouslyImageSource;
  slope: SeriouslyVector4;
  intercept: SeriouslyVector4;
}

export interface LumaKeyEffect extends Effect {
  readonly effect: 'lumakey';
  source: SeriouslyImageSource;
  clipBlack: number;
  clipWhite: number;
  invert: boolean;
}

export interface LutEffect extends Effect {
  readonly effect: 'lut';
  source: SeriouslyImageSource;
  lut: SeriouslyImageSource;
  amount: number;
}

export interface MirrorEffect extends Effect {
  readonly effect: 'mirror';
  source: SeriouslyImageSource;
}

export interface NightVisionEffect extends Effect {
  readonly effect: 'nightvision';
  source: SeriouslyImageSource;
  time: number;
  luminanceThreshold: number;
  amplification: number;
  color: SeriouslyColor;
}

export interface NoiseEffect extends Effect {
  readonly effect: 'noise';
  source: SeriouslyImageSource;
  overlay: boolean;
  amount: number;
  time: number;
}

export interface OpticalFlowEffect extends Effect {
  readonly effect: 'opticalflow';
  source: SeriouslyImageSource;
  lambda: number;
  scaleResult: SeriouslyVector2;
  offset: number;
}

export interface PanoramaEffect extends Effect {
  readonly effect: 'panorama';
  source: SeriouslyImageSource;
  width: number;
  height: number;
  yaw: number;
  fov: number;
  pitch: number;
}

export interface PixelateEffect extends Effect {
  readonly effect: 'pixelate';
  source: SeriouslyImageSource;
  pixelSize: SeriouslyVector2;
}

export interface PolarEffect extends Effect {
  readonly effect: 'polar';
  source: SeriouslyImageSource;
  angle: number;
}

export interface RepeatEffect extends Effect {
  readonly effect: 'repeat';
  source: SeriouslyImageSource;
  transform: SeriouslyImageSource;
  repeat: number;
  width: number;
  height: number;
}

export interface RippleEffect extends Effect {
  readonly effect: 'ripple';
  source: SeriouslyImageSource;
  wave: number;
  distortion: number;
  center: SeriouslyVector2;
}

export interface ScanlinesEffect extends Effect {
  readonly effect: 'scanlines';
  source: SeriouslyImageSource;
  lines: number;
  size: number;
  intensity: number;
}

export interface SelectEffect extends Effect {
  readonly effect: 'select';
  active: number;
  sizeMode: string;
  source0: SeriouslyImageSource;
  source1: SeriouslyImageSource;
  source2: SeriouslyImageSource;
  source3: SeriouslyImageSource;
}

export interface SepiaEffect extends Effect {
  readonly effect: 'sepia';
  source: SeriouslyImageSource;
}

export interface SimplexEffect extends Effect {
  readonly effect: 'simplex';
  noiseScale: SeriouslyVector2;
  noiseOffset: SeriouslyVector2;
  octaves: number;
  persistence: number;
  amount: number;
  time: number;
  width: number;
  height: number;
  black: SeriouslyColor;
  white: SeriouslyColor;
}

export interface SketchEffect extends Effect {
  readonly effect: 'sketch';
  source: SeriouslyImageSource;
}

export interface SplitEffect extends Effect {
  readonly effect: 'split';
  sourceA: SeriouslyImageSource;
  sourceB: SeriouslyImageSource;
  sizeMode: 'a' | 'b' | string;
  split: number;
  angle: number;
  fuzzy: number;
  blendGamma: number;
}

export interface TemperatureEffect extends Effect {
  readonly effect: 'temperature';
  source: SeriouslyImageSource;
  temperature: number;
}

export interface ThrottleEffect extends Effect {
  readonly effect: 'throttle';
  source: SeriouslyImageSource;
  frameRate: number;
}

export interface ToneEffect extends Effect {
  readonly effect: 'tone';
  source: SeriouslyImageSource;
  light: SeriouslyColor;
  dark: SeriouslyColor;
  toned: number;
  desat: number;
}

export interface TvGlitchEffect extends Effect {
  readonly effect: 'tvglitch';
  source: SeriouslyImageSource;
  time: number;
  distortion: number;
  verticalSync: number;
  lineSync: number;
  scanlines: number;
  bars: number;
  barsRate: number;
  frameShape: number;
  frameLimit: number;
  frameSharpness: number;
  frameColor: SeriouslyColor;
}

export interface VibranceEffect extends Effect {
  readonly effect: 'vibrance';
  source: SeriouslyImageSource;
  amount: number;
}

export interface VignetteEffect extends Effect {
  readonly effect: 'vignette';
  source: SeriouslyImageSource;
  amount: number;
}

export interface WhiteBalanceEffect extends Effect {
  readonly effect: 'whitebalance';
  source: SeriouslyImageSource;
  white: SeriouslyColor;
  auto: boolean;
}

// ---------------------------------------------------------------------------
// Typed transform interfaces
// ---------------------------------------------------------------------------

export interface Transform3dNode extends Transform {
  readonly transform: '3d';
  translateX: number;
  translateY: number;
  translateZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationOrder: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  translate(x?: number, y?: number, z?: number): void;
  scale(x?: number, y?: number, z?: number): void;
  center(x?: number, y?: number, z?: number): void;
  reset(): void;
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export interface SeriouslyCapabilities {
  webgl2: boolean;
  floatTextures: boolean;
  halfFloatTextures: boolean;
  floatRenderTargets: boolean;
  halfFloatRenderTargets: boolean;
  multipleRenderTargets: boolean;
}

// ---------------------------------------------------------------------------
// Plugin / source / target / transform definition interfaces
// ---------------------------------------------------------------------------

export interface EffectPluginMeta {
  title?: string;
  description?: string;
  inputs?: Record<string, {
    type: 'image' | 'number' | 'boolean' | 'color' | 'enum' | 'vector' | 'string';
    uniform?: string;
    defaultValue?: unknown;
    min?: number;
    max?: number;
    step?: number;
    options?: Record<string, string>;
    dimensions?: number;
  }>;
  commonShader?: boolean;
  inPlace?: boolean | ((inputName: string) => boolean);
  shader?: (inputs: Record<string, unknown>, shaderSource: { vertex: string; fragment: string }, util: unknown) => { vertex: string; fragment: string } | undefined;
  draw?: (shader: unknown, model: unknown, uniforms: Record<string, unknown>, framebuffer: WebGLFramebuffer | null, drawFn: (...args: unknown[]) => void) => void;
  initialize?: (init: () => void, gl: WebGLRenderingContext | WebGL2RenderingContext) => void;
  destroy?: () => void;
  compatible?: (gl: WebGLRenderingContext) => boolean;
  requires?: (inputName: string, inputs: Record<string, unknown>) => boolean;
  resize?: () => void;
}

// ---------------------------------------------------------------------------
// Seriously constructor options
// ---------------------------------------------------------------------------

export interface SeriouslyOptions {
  /** Pre-existing canvas to use as the rendering surface. */
  canvas?: HTMLCanvasElement;
  /** Floating-point render targets. Default: 'uint8'. */
  precision?: 'uint8' | 'float16' | 'float32';
  /** Default input values keyed by effect hook. */
  defaults?: Record<string, Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Logger interface (Seriously.logger)
// ---------------------------------------------------------------------------

export interface SeriouslyLogger {
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  log(message: string, ...args: unknown[]): void;
}

// ---------------------------------------------------------------------------
// Main Seriously class
// ---------------------------------------------------------------------------

export interface SeriouslyInstance {
  readonly id: number;

  // Node factories
  effect(hook: 'accumulator', options?: Record<string, unknown>): AccumulatorEffect;
  effect(hook: 'ascii', options?: Record<string, unknown>): AsciiEffect;
  effect(hook: 'bleach-bypass', options?: Record<string, unknown>): BleachBypassEffect;
  effect(hook: 'blend', options?: Record<string, unknown>): BlendEffect;
  effect(hook: 'blur', options?: Record<string, unknown>): BlurEffect;
  effect(hook: 'brightness-contrast', options?: Record<string, unknown>): BrightnessContrastEffect;
  effect(hook: 'channels', options?: Record<string, unknown>): ChannelsEffect;
  effect(hook: 'checkerboard', options?: Record<string, unknown>): CheckerboardEffect;
  effect(hook: 'chroma', options?: Record<string, unknown>): ChromaEffect;
  effect(hook: 'color', options?: Record<string, unknown>): ColorEffect;
  effect(hook: 'color-select', options?: Record<string, unknown>): ColorSelectEffect;
  effect(hook: 'colorcomplements', options?: Record<string, unknown>): ColorComplementsEffect;
  effect(hook: 'colorcube', options?: Record<string, unknown>): ColorCubeEffect;
  effect(hook: 'crop', options?: Record<string, unknown>): CropEffect;
  effect(hook: 'daltonize', options?: Record<string, unknown>): DaltonizeEffect;
  effect(hook: 'directionblur', options?: Record<string, unknown>): DirectionBlurEffect;
  effect(hook: 'displacement', options?: Record<string, unknown>): DisplacementEffect;
  effect(hook: 'dither', options?: Record<string, unknown>): DitherEffect;
  effect(hook: 'edge', options?: Record<string, unknown>): EdgeEffect;
  effect(hook: 'emboss', options?: Record<string, unknown>): EmbossEffect;
  effect(hook: 'exposure', options?: Record<string, unknown>): ExposureEffect;
  effect(hook: 'expression', options?: Record<string, unknown>): ExpressionEffect;
  effect(hook: 'fader', options?: Record<string, unknown>): FaderEffect;
  effect(hook: 'falsecolor', options?: Record<string, unknown>): FalseColorEffect;
  effect(hook: 'filmgrain', options?: Record<string, unknown>): FilmGrainEffect;
  effect(hook: 'freeze', options?: Record<string, unknown>): FreezeEffect;
  effect(hook: 'fxaa', options?: Record<string, unknown>): FxaaEffect;
  effect(hook: 'gradientwipe', options?: Record<string, unknown>): GradientWipeEffect;
  effect(hook: 'hex', options?: Record<string, unknown>): HexEffect;
  effect(hook: 'highlights-shadows', options?: Record<string, unknown>): HighlightsShadowsEffect;
  effect(hook: 'hue-saturation', options?: Record<string, unknown>): HueSaturationEffect;
  effect(hook: 'invert', options?: Record<string, unknown>): InvertEffect;
  effect(hook: 'kaleidoscope', options?: Record<string, unknown>): KaleidoscopeEffect;
  effect(hook: 'layers', options?: Record<string, unknown>): LayersEffect;
  effect(hook: 'linear-transfer', options?: Record<string, unknown>): LinearTransferEffect;
  effect(hook: 'lumakey', options?: Record<string, unknown>): LumaKeyEffect;
  effect(hook: 'lut', options?: Record<string, unknown>): LutEffect;
  effect(hook: 'mirror', options?: Record<string, unknown>): MirrorEffect;
  effect(hook: 'nightvision', options?: Record<string, unknown>): NightVisionEffect;
  effect(hook: 'noise', options?: Record<string, unknown>): NoiseEffect;
  effect(hook: 'opticalflow', options?: Record<string, unknown>): OpticalFlowEffect;
  effect(hook: 'panorama', options?: Record<string, unknown>): PanoramaEffect;
  effect(hook: 'pixelate', options?: Record<string, unknown>): PixelateEffect;
  effect(hook: 'polar', options?: Record<string, unknown>): PolarEffect;
  effect(hook: 'repeat', options?: Record<string, unknown>): RepeatEffect;
  effect(hook: 'ripple', options?: Record<string, unknown>): RippleEffect;
  effect(hook: 'scanlines', options?: Record<string, unknown>): ScanlinesEffect;
  effect(hook: 'select', options?: Record<string, unknown>): SelectEffect;
  effect(hook: 'sepia', options?: Record<string, unknown>): SepiaEffect;
  effect(hook: 'simplex', options?: Record<string, unknown>): SimplexEffect;
  effect(hook: 'sketch', options?: Record<string, unknown>): SketchEffect;
  effect(hook: 'split', options?: Record<string, unknown>): SplitEffect;
  effect(hook: 'temperature', options?: Record<string, unknown>): TemperatureEffect;
  effect(hook: 'throttle', options?: Record<string, unknown>): ThrottleEffect;
  effect(hook: 'tone', options?: Record<string, unknown>): ToneEffect;
  effect(hook: 'tvglitch', options?: Record<string, unknown>): TvGlitchEffect;
  effect(hook: 'vibrance', options?: Record<string, unknown>): VibranceEffect;
  effect(hook: 'vignette', options?: Record<string, unknown>): VignetteEffect;
  effect(hook: 'whitebalance', options?: Record<string, unknown>): WhiteBalanceEffect;
  effect(hook: string, options?: Record<string, unknown>): Effect;

  /**
   * Create or retrieve a source node.
   * When given a DOM element, canvas, or image the appropriate source type is
   * inferred automatically. Pass a hook string as the first argument to
   * request a named source plugin (e.g. 'camera', 'videoframe').
   */
  source(hook: 'videoframe', options?: { width?: number; height?: number }): Source & { push(frame: VideoFrame): void };
  source(hook: 'camera', options?: MediaStreamConstraints & { useRVFC?: boolean }): Source;
  source(hook: 'imagedata', source: ImageData): Source;
  source(hook: 'array', source: ArrayBufferView, options?: { width?: number; height?: number }): Source;
  source(hook: string, source?: unknown, options?: Record<string, unknown>): Source;
  source(source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | string): Source;

  transform(hook: '3d', options?: { radians?: boolean }): Transform3dNode;
  transform(hook: string, options?: Record<string, unknown>): Transform;

  /**
   * Attach a target. Pass a canvas element (or CSS selector) for the most
   * common case; use a named hook for special targets such as 'videoframe'.
   */
  target(hook: 'videoframe', options?: { width?: number; height?: number }): Target;
  target(canvas: HTMLCanvasElement | string): Target;
  target(hook: string, target?: unknown, options?: Record<string, unknown>): Target;

  /** Start the render loop. Optional per-frame pre/post callbacks. */
  go(pre?: () => void, post?: () => void): void;
  stop(): void;
  render(): void;

  /**
   * Subscribe to an instance-level event.
   *
   * - `'beforeFrame'` — fires each animation frame before sources are polled
   *   and targets are rendered. Callback receives the rAF timestamp (ms).
   * - `'afterFrame'` — fires each animation frame after all targets render.
   *   Registering either event implicitly starts the render loop.
   */
  on(event: 'beforeFrame', callback: (timestamp: DOMHighResTimeStamp) => void): this;
  on(event: 'afterFrame', callback: () => void): this;
  /** Unsubscribe a previously registered instance-level callback. */
  off(event: 'beforeFrame' | 'afterFrame', callback: (...args: unknown[]) => void): this;

  /** Set default input values for all instances of an effect. */
  defaults(hook: string, options: Record<string, unknown> | null): void;
  defaults(map: Record<string, Record<string, unknown>>): void;

  aliases(): string[];
  removeAlias(name: string): void;

  /** Returns a string identifying why Seriously is incompatible, or false. */
  incompatible(hook?: string): string | false;

  isNode(candidate: unknown): boolean;
  isSource(candidate: unknown): candidate is Source;
  isEffect(candidate: unknown): candidate is Effect;
  isTransform(candidate: unknown): candidate is Transform;
  isTarget(candidate: unknown): candidate is Target;

  purge(): void;
  restore(): void;
  destroy(): void;
  isDestroyed(): boolean;
}

// ---------------------------------------------------------------------------
// Seriously static / constructor
// ---------------------------------------------------------------------------

export interface SeriouslyConstructor {
  new(options?: SeriouslyOptions | HTMLCanvasElement): SeriouslyInstance;
  (options?: SeriouslyOptions | HTMLCanvasElement): SeriouslyInstance;

  /** Returns a string if the environment is incompatible, otherwise false. */
  incompatible(hook?: string): string | false;

  /** Returns a snapshot of WebGL capability flags. */
  capabilities(): SeriouslyCapabilities;

  /** Register a new effect plugin. */
  plugin(hook: string, meta: EffectPluginMeta): EffectPluginMeta | undefined;
  plugin(hook: string, definition: (this: unknown, options: unknown) => EffectPluginMeta, meta?: EffectPluginMeta): EffectPluginMeta | undefined;

  removePlugin(hook: string): SeriouslyConstructor;

  /** Register a new source plugin. */
  source(hook: string, definition: (this: unknown, target: unknown, options: unknown, force: boolean) => unknown, meta?: { title?: string }): void;
  source(hook: string, meta: { title?: string }): void;

  removeSource(hook: string): SeriouslyConstructor;

  /** Register a new target plugin. */
  target(hook: string, definition: (this: unknown, target: unknown, options: unknown, force: boolean) => unknown, meta?: { title?: string }): void;

  removeTarget(hook: string): SeriouslyConstructor;

  /** Register a new transform plugin. */
  transform(hook: string, definition: (this: unknown, options: unknown) => unknown, meta?: { title?: string; description?: string }): void;

  removeTransform(hook: string): SeriouslyConstructor;

  logger: SeriouslyLogger;

  util: {
    mat4: {
      identity(m: Float32Array): Float32Array;
      copy(out: Float32Array, a: Float32Array): Float32Array;
      multiply(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array;
    };
    [key: string]: unknown;
  };
}

declare const Seriously: SeriouslyConstructor;
export default Seriously;
