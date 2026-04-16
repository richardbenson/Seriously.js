import { readdirSync } from 'fs';
import { resolve } from 'path';
import resolve_ from '@rollup/plugin-node-resolve';

const __dirname = new URL('.', import.meta.url).pathname;

// Collect all per-effect/source/transform entry points for the ESM tree-shakable output.
function collectEntries(dir, prefix) {
	return readdirSync(resolve(__dirname, dir))
		.filter(f => f.endsWith('.js'))
		.reduce((acc, f) => {
			const name = f.replace(/^seriously\./, '').replace(/\.js$/, '');
			acc[`${prefix}/${name}`] = `./${dir}/${f}`;
			return acc;
		}, {});
}

const pluginEntries = {
	...collectEntries('effects', 'effects'),
	...collectEntries('sources', 'sources'),
	...collectEntries('transforms', 'transforms'),
	...collectEntries('targets', 'targets'),
};

/** @type {import('rollup').RollupOptions[]} */
export default [
	// ── 1. ESM: individual per-effect files (tree-shakable) ──────────────────
	{
		input: {
			seriously: './seriously.js',
			...pluginEntries,
		},
		output: {
			dir: 'dist/esm',
			format: 'esm',
			preserveModules: false,
			entryFileNames: '[name].js',
			chunkFileNames: '_chunks/[name]-[hash].js',
		},
		external: ['three'],
		plugins: [resolve_()],
	},

	// ── 2. CJS: core only (for Node.js / bundlers that prefer CJS) ───────────
	{
		input: './seriously.js',
		output: {
			file: 'dist/seriously.cjs.js',
			format: 'cjs',
			exports: 'default',
		},
		plugins: [resolve_()],
	},

	// ── 3. CJS: full bundle (core + all effects) ─────────────────────────────
	{
		input: './src/index.js',
		output: {
			file: 'dist/seriously.all.cjs.js',
			format: 'cjs',
			exports: 'default',
		},
		plugins: [resolve_()],
		external: ['three'],
	},

	// ── 4. UMD: full bundle for direct <script> use ──────────────────────────
	{
		input: './src/index.js',
		output: {
			file: 'dist/seriously.all.js',
			format: 'umd',
			name: 'Seriously',
			exports: 'default',
			globals: { three: 'THREE' },
		},
		plugins: [resolve_()],
		external: ['three'],
	},
];
