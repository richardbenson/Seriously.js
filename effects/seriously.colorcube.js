import Seriously from '../seriously.js';

	'use strict';

	// based on tutorial by Gregg Tavares
	// http://www.youtube.com/watch?v=rfQ8rKGTVlg&t=24m30s

	function build3DLUT(pixels2d, size) {
		// Rearrange a readPixels dump of the 2D slice-encoded LUT into a flat
		// array suitable for texImage3D (R=x, G=y, B=z, each axis 0..size-1).
		//
		// The 2D texture layout is:  width=(size*size), height=size
		// Slice z occupies columns [z*size .. (z+1)*size-1].
		// The green axis is stored with y-flip (shader samples 1.0-coord.y).
		var pixels3d = new Uint8Array(size * size * size * 4),
			ix, iy, iz, srcCol, srcRow, srcIdx, dstIdx;

		for (iz = 0; iz < size; iz++) {
			for (iy = 0; iy < size; iy++) {
				for (ix = 0; ix < size; ix++) {
					srcCol = iz * size + ix;
					srcRow = size - 1 - iy;
					srcIdx = (srcRow * size * size + srcCol) * 4;
					dstIdx = (iz * size * size + iy * size + ix) * 4;
					pixels3d[dstIdx]     = pixels2d[srcIdx];
					pixels3d[dstIdx + 1] = pixels2d[srcIdx + 1];
					pixels3d[dstIdx + 2] = pixels2d[srcIdx + 2];
					pixels3d[dstIdx + 3] = pixels2d[srcIdx + 3];
				}
			}
		}
		return pixels3d;
	}

	Seriously.plugin('colorcube', {
		commonShader: false,

		initialize: function (init, gl) {
			this._gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
			this._lut3d = null;
			this._lut3dSize = 0;
			this._lastCubeTexture = null;
			init();
		},

		shader: function (inputs, shaderSource) {
			if (this._gl2) {
				shaderSource.vertex = [
					'#version 300 es',
					'precision mediump float;',
					'',
					'in vec4 position;',
					'in vec2 texCoord;',
					'',
					'uniform vec2 resolution;',
					'uniform mat4 transform;',
					'',
					'out vec2 vTexCoord;',
					'',
					'void main(void) {',
					'	vec4 screenPosition = vec4(position.xy * resolution / 2.0, position.z, position.w);',
					'	screenPosition = transform * screenPosition;',
					'	gl_Position.xy = screenPosition.xy * 2.0 / resolution;',
					'	gl_Position.z = screenPosition.z * 2.0 / (resolution.x / resolution.y);',
					'	gl_Position.w = screenPosition.w;',
					'	vTexCoord = texCoord;',
					'}'
				].join('\n');
				shaderSource.fragment = [
					'#version 300 es',
					'precision mediump float;',
					'',
					'uniform sampler2D source;',
					'uniform sampler3D colorCube;',
					'',
					'in vec2 vTexCoord;',
					'out vec4 fragColor;',
					'',
					'void main(void) {',
					'	vec4 originalColor = texture(source, vTexCoord);',
					'	vec3 color = texture(colorCube, originalColor.rgb).rgb;',
					'	fragColor = vec4(color, originalColor.a);',
					'}'
				].join('\n');
			} else {
				shaderSource.fragment = [
					'precision mediump float;',
					'',
					'uniform sampler2D source;',
					'uniform sampler2D colorCube;',
					'uniform float size;',
					'varying vec2 vTexCoord;',
					'',
					'vec3 sampleAs3DTexture(sampler2D tex, vec3 coord, float size) {',
					'	float sliceSize = 1.0 / size;',
					'	float slicePixelSize = sliceSize / size;',
					'	float sliceInnerSize = slicePixelSize * (size - 1.0);',
					'	float zSlice0 = min(floor(coord.z * size), size - 1.0);',
					'	float zSlice1 = min(zSlice0 + 1.0, size - 1.0);',
					'	float xOffset = slicePixelSize * 0.5 + coord.x * sliceInnerSize;',
					'	float s0 = xOffset + (zSlice0 * sliceSize);',
					'	float s1 = xOffset + (zSlice1 * sliceSize);',
					'	vec3 slice0Color = texture2D(tex, vec2(s0, 1.0 - coord.y)).rgb;',
					'	vec3 slice1Color = texture2D(tex, vec2(s1, 1.0 - coord.y)).rgb;',
					'	float zOffset = mod(coord.z * size, 1.0);',
					'	return mix(slice0Color, slice1Color, zOffset);',
					'}',
					'',
					'void main(void) {',
					'	vec4 originalColor = texture2D(source, vTexCoord);',
					'	vec3 color = sampleAs3DTexture(colorCube, originalColor.rgb, size);',
					'	gl_FragColor = vec4(color, originalColor.a);',
					'}'
				].join('\n');
			}
			return shaderSource;
		},

		draw: function (shader, model, uniforms, framebuffer, drawFn) {
			var gl = this.gl,
				size, cubeTexture, pixels2d, pixels3d, tmpFb;

			if (!this._gl2) {
				drawFn(shader, model, uniforms, framebuffer);
				return;
			}

			// WebGL 2 path: lazily build/rebuild the TEXTURE_3D LUT
			cubeTexture = uniforms.colorCube;
			size = Math.max(1, Math.round(this.inputs.size) || 8);

			if (cubeTexture && (cubeTexture !== this._lastCubeTexture || this._lut3dSize !== size)) {
				tmpFb = gl.createFramebuffer();
				gl.bindFramebuffer(gl.FRAMEBUFFER, tmpFb);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cubeTexture, 0);
				pixels2d = new Uint8Array(size * size * size * 4);
				gl.readPixels(0, 0, size * size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels2d);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.deleteFramebuffer(tmpFb);

				pixels3d = build3DLUT(pixels2d, size);

				if (!this._lut3d) {
					this._lut3d = gl.createTexture();
				}
				gl.bindTexture(gl.TEXTURE_3D, this._lut3d);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
				gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, size, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels3d);
				gl.bindTexture(gl.TEXTURE_3D, null);

				this._lut3dSize = size;
				this._lastCubeTexture = cubeTexture;
			}

			if (!this._lut3d) {
				// LUT not ready yet — pass through
				drawFn(shader, model, { source: uniforms.source, resolution: uniforms.resolution, transform: uniforms.transform }, framebuffer);
				return;
			}

			// Full manual draw: bind TEXTURE_2D source and TEXTURE_3D LUT
			shader.use();
			gl.viewport(0, 0, this.width, this.height);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

			gl.enableVertexAttribArray(shader.location.position);
			gl.enableVertexAttribArray(shader.location.texCoord);

			if (model.texCoord) {
				gl.bindBuffer(gl.ARRAY_BUFFER, model.texCoord);
				gl.vertexAttribPointer(shader.location.texCoord, model.texCoord.size, gl.FLOAT, false, 0, 0);
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, model.vertex);
			gl.vertexAttribPointer(shader.location.position, model.vertex.size, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.index);

			gl.disable(gl.DEPTH_TEST);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ZERO);
			gl.blendEquation(gl.FUNC_ADD);

			// Source → texture unit 0
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, uniforms.source);
			shader.uniforms.source && shader.uniforms.source.set(0);

			// 3D LUT → texture unit 1
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_3D, this._lut3d);
			shader.uniforms.colorCube && shader.uniforms.colorCube.set(1);

			shader.uniforms.transform && shader.uniforms.transform.set(uniforms.transform);
			shader.uniforms.resolution && shader.uniforms.resolution.set(uniforms.resolution);

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.drawElements(model.mode, model.length, gl.UNSIGNED_SHORT, 0);
			gl.enable(gl.DEPTH_TEST);
		},

		destroy: function () {
			if (this._lut3d && this.gl) {
				this.gl.deleteTexture(this._lut3d);
			}
			this._lut3d = null;
			this._lastCubeTexture = null;
		},

		inPlace: true,
		inputs: {
			source: {
				type: 'image',
				uniform: 'source'
			},
			cube: {
				type: 'image',
				uniform: 'colorCube'
			},
			size: {
				type: 'number',
				uniform: 'size',
				defaultValue: 8,
				min: 1,
				max: 256
			}
		},
		title: 'Color Cube',
		description: ''
	});
