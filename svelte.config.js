import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			},
			// Emulate Cloudflare bindings (KV) during `npm run dev` using wrangler.toml
			platformProxy: {
				configPath: 'wrangler.toml',
				persist: true
			}
		})
	}
};

export default config;
