import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Allow the dev Cloudflare tunnel (scripts/dev-tunnel.sh) to reach the
		// dev server — Vite rejects unknown Host headers with 403 otherwise
		allowedHosts: ['.starspace.group']
	},
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
