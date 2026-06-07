import { connectionCoordinator } from './connection-coordinator.js';

// Standalone realtime sidecar: the link-only MQTT coordinator.
// The SvelteKit app is served separately (adapter-node, `pnpm start`); the browser
// talks to the broker directly, so this process only needs the MQTT client.
connectionCoordinator.connect();
