import Seriously from '../seriously.js';

	'use strict';

	/*
	 * VideoFrame target — renders each frame to an internal HTMLCanvasElement and
	 * emits a VideoFrame from it, suitable for feeding into a WebCodecs VideoEncoder
	 * or a MediaStreamTrackGenerator.
	 *
	 * This target must be created before any canvas-based target so that it becomes
	 * the primary WebGL context. If another canvas target already exists in the same
	 * Seriously instance, create a second Seriously instance for encoding.
	 *
	 * Usage:
	 *   const target = seriously.target('videoframe', { width: 1280, height: 720 });
	 *   target.source = effectChain;
	 *   target.on('frame', function (frame) {
	 *     encoder.encode(frame);
	 *     frame.close();
	 *   });
	 *   seriously.go();
	 *
	 * The 'frame' event listener receives the VideoFrame synchronously so that the
	 * caller can encode or transfer it before it is garbage-collected.
	 */

	var identity = new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]),
		mat4 = Seriously.util.mat4,
		hasVideoFrame = typeof VideoFrame !== 'undefined';

	Seriously.target('videoframe', function (target, options, force) {
		var me = this,
			canvas,
			context,
			ctxOpts,
			width,
			height;

		if (force) {
			width = (options && parseInt(options.width, 10)) || 640;
			height = (options && parseInt(options.height, 10)) || 480;

			canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			ctxOpts = {
				alpha: true,
				premultipliedAlpha: true,
				preserveDrawingBuffer: true,
				stencil: true
			};
			context = canvas.getContext('webgl2', ctxOpts) ||
				canvas.getContext('webgl', ctxOpts) ||
				canvas.getContext('experimental-webgl', ctxOpts);

			if (!context) {
				throw new Error('Unable to create WebGL context for VideoFrame target');
			}

			me.width = width;
			me.height = height;

			return {
				gl: context,
				render: function (draw, shader, model) {
					var matrix, x, y, frame, frameListeners, j;

					if (!this.dirty || !this.ready || !this.source || !this.model) {
						return;
					}

					this.resize();
					this.source.render();
					this.uniforms.source = this.source.texture;

					if (this.source.width === this.width && this.source.height === this.height) {
						this.uniforms.transform = this.source.cumulativeMatrix || identity;
						this.transformDirty = false;
					} else if (this.transformDirty) {
						matrix = this.transform || new Float32Array(16);
						this.transform = matrix;
						mat4.copy(matrix, this.source.cumulativeMatrix || identity);
						x = this.source.width / this.width;
						y = this.source.height / this.height;
						matrix[0] *= x;
						matrix[1] *= x;
						matrix[2] *= x;
						matrix[3] *= x;
						matrix[4] *= y;
						matrix[5] *= y;
						matrix[6] *= y;
						matrix[7] *= y;
						this.uniforms.transform = matrix;
						this.transformDirty = false;
					}

					draw(shader, model, this.uniforms, null, this);

					if (hasVideoFrame) {
						try {
							frame = new VideoFrame(canvas, {
								timestamp: Math.round(performance.now() * 1000)
							});
							frameListeners = this.listeners['frame'];
							if (frameListeners) {
								for (j = 0; j < frameListeners.length; j++) {
									frameListeners[j](frame);
								}
							} else {
								frame.close();
							}
						} catch (e) {
							Seriously.logger.error('Error creating VideoFrame from canvas', e);
						}
					}

					this.emit('render');
					this.dirty = false;
				},
				resize: function () {
					if (canvas.width !== this.width || canvas.height !== this.height) {
						canvas.width = this.width;
						canvas.height = this.height;
						this.uniforms.resolution[0] = this.width;
						this.uniforms.resolution[1] = this.height;
						this.emit('resize');
						this.setTransformDirty();
					}
				},
				destroy: function () {
					// canvas is GC'd; nothing else to clean up
				}
			};
		}
	}, {
		title: 'VideoFrame Target'
	});
