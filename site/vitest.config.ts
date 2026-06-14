import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			'$env/static/private': resolve('./src/tests/mocks/env.ts'),
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		globals: true,
	},
});
