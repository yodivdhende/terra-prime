/**
 * What the site sends the dashboard, and what the dashboard sends back.
 *
 * The dashboard does not connect to the broker. It holds an `EventSource` against the site and
 * posts commands to the site, so broker credentials never reach a browser and authorisation stays
 * in the one place that already has the session cookie. That is the whole reason this file exists
 * separately from `./topics.ts`: the topic tree is the device-facing API, this is the
 * browser-facing one, and they are allowed to drift.
 *
 * The same no-dependency rule as `./topics.ts` applies — see the note at the top of that file.
 */

import type { BroadcastNotify, DeviceCommand, DeviceStatus, LightCue } from './messages.ts';
import type { EventName } from './topics.ts';

/** A device as the bridge currently understands it: its last status, plus when that arrived. */
export type RealtimeDevice = DeviceStatus & {
	/** ISO 8601. Stamped by the bridge on arrival — a last will carries no time of its own. */
	lastSeen: string;
};

/**
 * One thing that happened, as heard off `tp/event/#`. `seq` is per-bridge-process and only ever
 * increases, so a dashboard can tell a replayed event from a new one without comparing payloads.
 */
export type RealtimeEvent = {
	seq: number;
	name: EventName;
	payload: Record<string, unknown>;
	/** ISO 8601, stamped on arrival. */
	at: string;
};

/**
 * Frames on the SSE stream. The first is always a `snapshot`, so a dashboard that opens mid-event
 * is immediately current without a second fetch; everything after it is a delta.
 */
export type RealtimeFrame =
	| {
			type: 'snapshot';
			brokerConnected: boolean;
			devices: RealtimeDevice[];
			events: RealtimeEvent[];
	  }
	| { type: 'device'; device: RealtimeDevice }
	| { type: 'event'; event: RealtimeEvent }
	| { type: 'broker'; connected: boolean };

/**
 * What `POST /api/realtime/commands` accepts. The site turns one of these into a publish; the
 * browser never names a topic, which is what keeps the topic tree out of the client bundle and
 * off the list of things an admin session can address directly.
 */
export type CommandRequest =
	| { target: 'device'; uid: string; command: DeviceCommand }
	| { target: 'broadcast'; notify: BroadcastNotify }
	| { target: 'light'; cue: LightCue };
