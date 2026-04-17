import Seriously from '../seriously.js';

	'use strict';

	/*
	 * VideoFrame source — accepts VideoFrame objects pushed via source.push(frame).
	 *
	 * Compatible inputs: VideoFrame from requestVideoFrameCallback, VideoDecoder
	 * (WebCodecs), MediaStreamTrackProcessor, or ImageCapture.
	 *
	 * Usage:
	 *   const src = seriously.source('videoframe');
	 *   src.push(videoFrame);   // can be called from rVFC or WebCodecs callbacks
	 *
	 * The caller is responsible for closing VideoFrames it creates; this source
	 * closes frames internally once they have been uploaded to the GPU.
	 */

	Seriously.source('videoframe', function (source, options, force) {
		var me = this,
			destroyed = false,
			pendingFrame = null;

		if (force) {
			me._push = function (frame) {
				if (destroyed) {
					frame.close();
					return;
				}
				if (pendingFrame) {
					pendingFrame.close();
				}
				pendingFrame = frame;
				if (me.width !== frame.displayWidth || me.height !== frame.displayHeight) {
					me.width = frame.displayWidth;
					me.height = frame.displayHeight;
					me.resize();
				}
				me.setDirty();
			};

			return {
				deferTexture: false,
				render: function (gl) {
					var frame = pendingFrame;
					if (!frame) {
						return false;
					}
					pendingFrame = null;

					gl.bindTexture(gl.TEXTURE_2D, me.texture);
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, me.flip);
					gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
					try {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
						frame.close();
						return true;
					} catch (e) {
						frame.close();
						Seriously.logger.error('Error uploading VideoFrame to texture', e);
					}
					return false;
				},
				checkDirty: function () {
					return !!pendingFrame;
				},
				compare: function () {
					return false;
				},
				destroy: function () {
					destroyed = true;
					me._push = null;
					if (pendingFrame) {
						pendingFrame.close();
						pendingFrame = null;
					}
				}
			};
		}
	}, {
		title: 'VideoFrame Source'
	});
