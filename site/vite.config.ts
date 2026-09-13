import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { MqttBridge, bridgeConfigFromEnv } from './realtime/bridge';

/**
 * In production the MQTT bridge is started by `realtime/index.ts`, which `vite dev` does not run —
 * so without this the dashboard would answer 503 on every developer's machine and the realtime
 * layer could only be exercised by deploying it.
 *
 * The bridge parks itself on `globalThis`, which is what lets a route reach it from Vite's
 * separate SSR module graph. Without `MQTT_URL` it starts with no broker and says so, which is the
 * normal case for anyone working on something else.
 */
const realtimeBridge: Plugin = {
	name: 'realtime-bridge',
	apply: 'serve',
	configureServer(server) {
		const bridge = new MqttBridge(bridgeConfigFromEnv(process.env));
		bridge.start();
		// A restarted dev server must not leave the old session holding the broker: two clients
		// sharing an id take turns kicking each other off, which looks exactly like a flaky network.
		server.httpServer?.on('close', () => void bridge.stop());
	}
};

export default defineConfig({
	plugins: [sveltekit(), realtimeBridge],
	assetsInclude: ['**/*.glb']
});
