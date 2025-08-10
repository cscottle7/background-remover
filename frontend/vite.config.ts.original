import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		extensions: ['.svelte', '.ts', '.js', '.json'],
		alias: {
			$lib: path.resolve('./src/lib')
		}
	},
	server: {
		port: 3002,
		host: '0.0.0.0',
		fs: {
			allow: ['..']
		}
	},
	build: {
		rollupOptions: {
			external: [],
			output: {
				manualChunks: undefined
			}
		}
	}
});