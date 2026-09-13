/**
 * How a SvelteKit route reaches the MQTT bridge running in the same process.
 *
 * The deployed container runs one process: `site/realtime/index.ts` starts the bridge and mounts
 * the SvelteKit handler from `build/handler.js`. Importing the bridge module from a route would
 * not reach that instance — `build/handler.js` is a bundle, so `$lib/realtime/*` inside it is a
 * *copy* of this module, not the same one the bridge imported. A module-level singleton would
 * quietly become two singletons: one holding the broker connection, one empty and serving every
 * request.
 *
 * So the bridge parks itself on `globalThis` under a registered symbol, which is shared across
 * module instances by definition, and routes look it up through here. `getRealtimeBridge()`
 * returning null is a normal state, not a bug: it is what `vite dev` looks like, where the
 * SvelteKit dev server runs without the realtime entrypoint in front of it.
 *
 * The same no-dependency rule as `./topics.ts` applies — see the note at the top of that file.
 */

import type { BroadcastNotify, DeviceCommand, LightCue } from './messages.ts';
import type { RealtimeFrame } from './stream.ts';

/** What a route is allowed to do with the bridge. The implementation lives in `site/realtime/`. */
export type RealtimeBridge = {
	/**
	 * Hands back the current state as a `snapshot` frame and then every later frame, until the
	 * returned function is called. Subscribing is the only way to read state: there is no separate
	 * getter, so a subscriber cannot miss a frame published between reading and subscribing.
	 */
	subscribe(listener: (frame: RealtimeFrame) => void): () => void;
	publishDeviceCommand(uid: string, command: DeviceCommand): Promise<void>;
	publishBroadcastNotify(notify: BroadcastNotify): Promise<void>;
	publishLightCue(cue: LightCue): Promise<void>;
};

const BRIDGE_KEY = Symbol.for('terra-prime.realtime.bridge');

type BridgeHolder = { [BRIDGE_KEY]?: RealtimeBridge };

export function setRealtimeBridge(bridge: RealtimeBridge): void {
	(globalThis as BridgeHolder)[BRIDGE_KEY] = bridge;
}

/** Null when the process was started without the realtime entrypoint — `vite dev`, or `pnpm start`. */
export function getRealtimeBridge(): RealtimeBridge | null {
	return (globalThis as BridgeHolder)[BRIDGE_KEY] ?? null;
}
