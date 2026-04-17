import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['test/**/*.test.js'],
		coverage: {
			provider: 'v8',
			include: ['seriously.js', 'effects/**/*.js', 'sources/**/*.js', 'targets/**/*.js', 'transforms/**/*.js'],
			reporter: ['text', 'lcov']
		}
	}
});
