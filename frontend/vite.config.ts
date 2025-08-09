import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
			'$lib': resolve('./src/lib')
		},
		extensions: ['.ts', '.js', '.svelte']
	},
	server: {
		port: 3002,
		host: '0.0.0.0',
		fs: {
			allow: ['..']
		}
	}
});