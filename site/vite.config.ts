import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// const webSocketServer = {
// 	name: 'webSocketServer',
// 	configureServer(server: ViteDevServer) {
// 		if(!server.httpServer) return;
// 		new WebSocketMidiator(server.httpServer as http.Server, server.config.server.port);
// 	}
// }

export default defineConfig({
	plugins: [sveltekit()],
	assetsInclude: ['**/*.glb'],
});
