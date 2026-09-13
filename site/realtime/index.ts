/**
 * The deployed entrypoint.
 *
 * `pnpm start` runs adapter-node's bundle on its own, which has no realtime layer in it at all —
 * that is what `site/dockerfile` used to launch, and it is why nothing a device published ever
 * reached production. This process mounts the same SvelteKit handler *and* starts the MQTT
 * bridge, so `/api/realtime` has something to read and a command has somewhere to go.
 *
 * One process, not two, because the bridge and the routes have to share state: the fleet's live
 * status lives in the bridge's memory and `/api/realtime` streams it. Splitting them would mean
 * inventing a second channel between them for no gain — see `$lib/realtime/registry.ts` for how
 * a route inside the bundle reaches the bridge instance out here.
 *
 * Node runs this file directly, stripping the types (Node >= 22.18). That is why every relative
 * import below carries its extension and why nothing in `$lib/realtime/` may import `$lib` or
 * Drizzle: there is no bundler in front of this, so an unresolvable import is a container that
 * will not boot.
 */

import express from 'express';
import { MqttBridge, bridgeConfigFromEnv } from './bridge.ts';
import { handler } from './sveltekit-handler.ts';

const port = Number(process.env.PORT ?? 3000);

const bridge = new MqttBridge(bridgeConfigFromEnv(process.env));
bridge.start();

const app = express();
app.use(handler);

const server = app.listen(port, () => {
	console.log(`[realtime] listening on ${port}`);
});

async function shutdown(signal: string): Promise<void> {
	console.log(`[realtime] ${signal} - shutting down`);
	// The broker goes first: closing the MQTT session cleanly is what stops every dashboard being
	// told the whole fleet just died when all that happened was a redeploy.
	await bridge.stop();
	server.close(() => process.exit(0));
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
