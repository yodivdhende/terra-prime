import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// const webSocketServer = {
// 	name: 'webSocketServer',
// 	configureServer(server: ViteDevServer) {
// 		if(!server.httpServer) return;
// 		new WebSocketMidiator(server.httpServer as http.Server, server.config.server.port);
// 	}
// }

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter(),
			// SvelteKit 3 replaced `$lib` with `#lib`; keep the old alias until imports are migrated.
			alias: { $lib: 'src/lib' }
		})
	],
	assetsInclude: ['**/*.glb'],
});
