import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Allow the dev Cloudflare tunnel (scripts/dev-tunnel.sh) to reach the
		// dev server — Vite rejects unknown Host headers with 403 otherwise
		allowedHosts: ['.starspace.group']
	}
});
