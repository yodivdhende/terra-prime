/**
 * The dashboard's view of the fleet.
 *
 * Holds an `EventSource` against `/api/realtime` — same origin, so there is no URL to configure
 * and nothing to get wrong between a laptop and the deployed domain. The browser never talks to
 * the MQTT broker: it has no credentials for one, and the site is already the place that knows
 * who is allowed to make a prop do something.
 *
 * A factory rather than a module-level singleton, because a page owns its subscription and has to
 * be able to close it — see `connect()`, which returns its own teardown.
 */
import type { RealtimeDevice, RealtimeEvent, RealtimeFrame } from '$lib/realtime/stream';
import type { BroadcastNotify, DeviceCommand, LightCue } from '$lib/realtime/messages';

/** Matches the bridge's own tail, so a reconnect cannot hand us more than we are willing to hold. */
const EVENT_LOG_SIZE = 200;

export type CommandResult = { ok: true } | { ok: false; error: string };

function createRealtimeManager() {
	let source: EventSource | null = null;
	/** The stream itself is up. Separate from `brokerConnected`: the site can be fine and the broker not. */
	let streaming = $state(false);
	let brokerConnected = $state(false);
	let devices: RealtimeDevice[] = $state([]);
	let events: RealtimeEvent[] = $state([]);

	function applyFrame(frame: RealtimeFrame) {
		if (frame.type === 'snapshot') {
			brokerConnected = frame.brokerConnected;
			devices = frame.devices;
			// Oldest first on the wire; newest first on screen, because a control room reads the top.
			events = [...frame.events].reverse();
			return;
		}
		if (frame.type === 'broker') {
			brokerConnected = frame.connected;
			return;
		}
		if (frame.type === 'device') {
			const index = devices.findIndex((device) => device.uid === frame.device.uid);
			if (index === -1) devices = [...devices, frame.device];
			else devices = devices.map((device, at) => (at === index ? frame.device : device));
			return;
		}
		events = [frame.event, ...events].slice(0, EVENT_LOG_SIZE);
	}

	/**
	 * `EventSource` reconnects on its own, and the bridge answers every new connection with a fresh
	 * snapshot, so a dropped stream repairs itself without this manager tracking what it missed.
	 */
	function connect(): () => void {
		if (source !== null) return disconnect;

		const eventSource = new EventSource('/api/realtime');
		source = eventSource;

		eventSource.onopen = () => {
			streaming = true;
		};
		eventSource.onmessage = (message) => {
			try {
				applyFrame(JSON.parse(message.data) as RealtimeFrame);
			} catch (error) {
				console.error('unreadable realtime frame', error);
			}
		};
		eventSource.onerror = () => {
			streaming = false;
			brokerConnected = false;
		};

		return disconnect;
	}

	function disconnect() {
		source?.close();
		source = null;
		streaming = false;
		brokerConnected = false;
	}

	async function send(body: unknown): Promise<CommandResult> {
		try {
			const response = await fetch('/api/realtime/commands', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (response.ok) return { ok: true };
			return { ok: false, error: `command failed (${response.status})` };
		} catch (error) {
			return { ok: false, error: error instanceof Error ? error.message : 'command failed' };
		}
	}

	return {
		get streaming() {
			return streaming;
		},
		get brokerConnected() {
			return brokerConnected;
		},
		get devices() {
			return devices;
		},
		get events() {
			return events;
		},
		/** The live status of one device, or undefined if it has never announced itself. */
		device: (uid: string): RealtimeDevice | undefined =>
			devices.find((device) => device.uid === uid),
		connect,
		disconnect,
		sendDeviceCommand: (uid: string, command: DeviceCommand) =>
			send({ target: 'device', uid, command }),
		sendBroadcastNotify: (notify: BroadcastNotify) => send({ target: 'broadcast', notify }),
		sendLightCue: (cue: LightCue) => send({ target: 'light', cue })
	};
}

export const REALTIME_MANAGER = createRealtimeManager();
