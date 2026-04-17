import Seriously from '../seriously.js';

	'use strict';

	Seriously.source('camera', function (source, options, force) {
		var me = this,
			video,
			key,
			opts,
			destroyed = false,
			stream,
			rvfcId = null,
			framePending = false,
			useRVFC = false,
			lastRenderTime = 0;

		function cleanUp() {
			if (video) {
				video.pause();
				video.srcObject = null;
			}
			if (stream) {
				stream.getTracks().forEach(function (t) { t.stop(); });
			}
			stream = null;
		}

		function onVideoFrame() {
			framePending = true;
			rvfcId = null;
			me.setDirty();
		}

		function initialize() {
			if (destroyed) {
				return;
			}
			if (video.videoWidth) {
				me.width = video.videoWidth;
				me.height = video.videoHeight;
				useRVFC = typeof video.requestVideoFrameCallback === 'function';
				if (useRVFC) {
					rvfcId = video.requestVideoFrameCallback(onVideoFrame);
				}
				me.setReady();
			} else {
				setTimeout(initialize, 50);
			}
		}

		if (force) {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('Camera source type unavailable. Browser does not support getUserMedia');
			}

			opts = { video: true };
			if (source && typeof source === 'object') {
				for (key in source) {
					if (source.hasOwnProperty(key)) {
						opts[key] = source[key];
					}
				}
			}

			video = document.createElement('video');
			video.playsInline = true;
			video.muted = true;

			navigator.mediaDevices.getUserMedia(opts).then(function (s) {
				stream = s;
				if (destroyed) {
					cleanUp();
					return;
				}
				video.srcObject = stream;
				if (video.readyState >= 1) {
					initialize();
				} else {
					video.addEventListener('loadedmetadata', initialize, { once: true });
				}
				video.play();
			}).catch(function (err) {
				Seriously.logger.error('Unable to access video camera', err);
			});

			return {
				deferTexture: true,
				source: video,
				render: function (gl) {
					lastRenderTime = video.currentTime;
					framePending = false;
					if (useRVFC && !destroyed) {
						rvfcId = video.requestVideoFrameCallback(onVideoFrame);
					}

					gl.bindTexture(gl.TEXTURE_2D, me.texture);
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, me.flip);
					gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
					try {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
						return true;
					} catch (error) {
						Seriously.logger.error('Error rendering camera video source', error);
					}
					return false;
				},
				checkDirty: function () {
					if (useRVFC) {
						return framePending;
					}
					return video.currentTime !== lastRenderTime;
				},
				destroy: function () {
					destroyed = true;
					if (useRVFC && rvfcId !== null) {
						video.cancelVideoFrameCallback(rvfcId);
						rvfcId = null;
					}
					cleanUp();
				}
			};
		}
	}, {
		compatible: function () {
			return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
		},
		title: 'Camera'
	});
