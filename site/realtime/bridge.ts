/**
 * The site bridge: the only thing in this system that holds broker credentials.
 *
 * It subscribes to everything devices say, keeps the fleet's live state in memory, appends what it
 * hears to the event log, and publishes commands on behalf of the control room and the
 * server-side rules. The domain does not know MQTT exists — a route asks the bridge to notify a
 * device, and the bridge decides that means a retained-free publish on `tp/device/<uid>/cmd`.
 *
 * Live connection state is in memory on purpose. There is no connection table: a device is online
 * because the broker still holds its session, and the authority on that is the retained status
 * topic plus the last will, not a row someone has to remember to clean up. A bridge restart
 * re-reads the whole fleet from the retained messages within a second of connecting.
 *
 * Runs as a plain Node module under type stripping — see `site/realtime/index.ts` for why that
 * constrains what this file may import.
 */

import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import {
	parseDeviceStatus,
	parseEventPayload,
	type BroadcastNotify,
	type DeviceCommand,
	type EventPayloads,
	type LightCue
} from '../src/lib/realtime/messages.ts';
import { setRealtimeBridge, type RealtimeBridge } from '../src/lib/realtime/registry.ts';
import type { RealtimeDevice, RealtimeEvent, RealtimeFrame } from '../src/lib/realtime/stream.ts';
import {
	BROADCAST_NOTIFY_TOPIC,
	DEVICE_STATUS_WILDCARD,
	EVENT_WILDCARD,
	LIGHT_CUE_TOPIC,
	deviceCommandTopic,
	eventNameForTopic,
	isTopicSafeUid,
	uidForStatusTopic
} from '../src/lib/realtime/topics.ts';

/**
 * How much of the event log a freshly opened dashboard is handed. The log is a live view, not an
 * archive: a control-room screen wants the last few minutes of a running game, and anything older
 * than that is a question for the database once the event tables exist.
 */
const EVENT_LOG_SIZE = 200;

/**
 * How long an AguesGuard has to stay docked with a Port before it opens. Carried over from the
 * WebSocket relay's link timer, which could only approximate a dwell by watching repeated pings
 * land inside a 3000–4800ms window; `port/connected` and `port/disconnected` say it outright, so
 * the rule is now the plain one it was always trying to be.
 */
const PORT_DWELL_MS = 3000;

export type BridgeConfig = {
	/** `mqtt://host:1883`. Absent means run without a broker — see `MqttBridge.start()`. */
	url: string | undefined;
	username: string | undefined;
	password: string | undefined;
	clientId: string;
};

export function bridgeConfigFromEnv(env: NodeJS.ProcessEnv): BridgeConfig {
	return {
		url: env.MQTT_URL,
		username: env.MQTT_USERNAME,
		password: env.MQTT_PASSWORD,
		// Distinct per process: two bridges sharing a client id would take turns kicking each other
		// off the broker, which looks exactly like a flapping network.
		clientId: env.MQTT_CLIENT_ID ?? `tp-bridge-${process.pid}-${Date.now().toString(36)}`
	};
}

export class MqttBridge implements RealtimeBridge {
	private client: MqttClient | null = null;
	private brokerConnected = false;
	private readonly devices = new Map<string, RealtimeDevice>();
	private readonly events: RealtimeEvent[] = [];
	private readonly listeners = new Set<(frame: RealtimeFrame) => void>();
	private readonly portDwellTimers = new Map<string, NodeJS.Timeout>();
	private nextSeq = 1;
	private readonly config: BridgeConfig;

	// Written out rather than declared as a constructor parameter property: Node strips types from
	// this file without transforming it, and a parameter property is syntax it cannot erase.
	constructor(config: BridgeConfig) {
		this.config = config;
	}

	/**
	 * Without `MQTT_URL` the bridge still registers itself and still serves the dashboard — it just
	 * has no broker and reports as much. That is what `vite dev` on a laptop with no broker running
	 * looks like, and it is better than an entrypoint that refuses to boot: the site is far more
	 * than its realtime layer, and a missing broker must not take the website down with it.
	 */
	public start(): void {
		setRealtimeBridge(this);

		if (this.config.url == null || this.config.url.length === 0) {
			console.warn('[realtime] MQTT_URL is not set - running without a broker');
			return;
		}

		const client = mqtt.connect(this.config.url, {
			clientId: this.config.clientId,
			username: this.config.username,
			password: this.config.password,
			// The bridge is not a device: it wants every retained status replayed on reconnect rather
			// than a queue of whatever it missed, and its own subscriptions cost nothing to redo.
			clean: true,
			reconnectPeriod: 5000
		});
		this.client = client;

		client.on('connect', () => {
			this.brokerConnected = true;
			console.log('[realtime] connected to broker');
			client.subscribe([DEVICE_STATUS_WILDCARD, EVENT_WILDCARD], { qos: 1 }, (error) => {
				if (error != null) console.error('[realtime] subscribe failed', error);
			});
			this.broadcast({ type: 'broker', connected: true });
		});

		client.on('close', () => {
			if (this.brokerConnected === false) return;
			this.brokerConnected = false;
			console.warn('[realtime] broker connection closed');
			this.broadcast({ type: 'broker', connected: false });
		});

		client.on('error', (error) => console.error('[realtime] broker error', error));
		client.on('message', (topic, payload) => this.handleMessage(topic, payload.toString()));
	}

	public async stop(): Promise<void> {
		for (const timer of this.portDwellTimers.values()) clearTimeout(timer);
		this.portDwellTimers.clear();
		await this.client?.endAsync();
		this.client = null;
	}

	public subscribe(listener: (frame: RealtimeFrame) => void): () => void {
		this.listeners.add(listener);
		listener({
			type: 'snapshot',
			brokerConnected: this.brokerConnected,
			devices: [...this.devices.values()],
			events: [...this.events]
		});
		return () => {
			this.listeners.delete(listener);
		};
	}

	public async publishDeviceCommand(uid: string, command: DeviceCommand): Promise<void> {
		if (isTopicSafeUid(uid) === false) throw new Error(`unusable device uid: ${uid}`);
		await this.publish(deviceCommandTopic(uid), command);
	}

	public async publishBroadcastNotify(notify: BroadcastNotify): Promise<void> {
		await this.publish(BROADCAST_NOTIFY_TOPIC, notify);
	}

	public async publishLightCue(cue: LightCue): Promise<void> {
		await this.publish(LIGHT_CUE_TOPIC, cue);
	}

	/**
	 * QoS 1, never retained. A command is a thing to do once: retaining it would re-fire on every
	 * reconnect, so a prop that lost WiFi would replay the last screen change forever.
	 */
	private async publish(topic: string, payload: unknown): Promise<void> {
		if (this.client == null || this.brokerConnected === false) {
			throw new Error('not connected to the broker');
		}
		await this.client.publishAsync(topic, JSON.stringify(payload), { qos: 1, retain: false });
	}

	private handleMessage(topic: string, raw: string): void {
		const statusUid = uidForStatusTopic(topic);
		if (statusUid !== null) {
			this.handleStatus(statusUid, raw);
			return;
		}

		const eventName = eventNameForTopic(topic);
		if (eventName !== null) {
			this.handleEvent(eventName, raw);
			return;
		}
		// Anything else under `tp/event/#` is a topic this build does not know. Devices outlive
		// deployments, so an unknown event is expected, not an error.
	}

	private handleStatus(uid: string, raw: string): void {
		const status = parseDeviceStatus(uid, raw);
		if (status === null) {
			console.warn(`[realtime] unreadable status from ${uid}`);
			return;
		}
		const device: RealtimeDevice = { ...status, lastSeen: new Date().toISOString() };
		this.devices.set(uid, device);
		this.broadcast({ type: 'device', device });

		// A device that drops mid-dock never sends `port/disconnected`; the will is the only notice
		// anyone gets, so it has to cancel the dwell too or the Port opens for a dead prop.
		if (status.online === false) this.cancelPortDwell(uid);
	}

	private handleEvent<Name extends keyof EventPayloads>(name: Name, raw: string): void {
		const payload = parseEventPayload(name, raw);
		if (payload === null) {
			console.warn(`[realtime] unreadable ${name} payload`);
			return;
		}

		const event: RealtimeEvent = {
			seq: this.nextSeq++,
			name,
			payload: payload as unknown as Record<string, unknown>,
			at: new Date().toISOString()
		};
		this.appendToEventLog(event);
		this.broadcast({ type: 'event', event });

		if (name === 'portConnected') this.startPortDwell(payload as EventPayloads['portConnected']);
		if (name === 'portDisconnected') {
			this.cancelPortDwell((payload as EventPayloads['portDisconnected']).device);
		}
	}

	/**
	 * The event log. One structured line per event on stdout — the deployment's log drain is the
	 * durable copy — plus a bounded in-memory tail for the dashboard's snapshot.
	 *
	 * There is no event table in the schema yet, so this is deliberately the whole of it: the
	 * transport work should not be the thing that invents a production table shape for the game's
	 * event history. When that table lands, this is the one method that has to change.
	 */
	private appendToEventLog(event: RealtimeEvent): void {
		console.log(JSON.stringify({ log: 'tp.event', ...event }));
		this.events.push(event);
		if (this.events.length > EVENT_LOG_SIZE)
			this.events.splice(0, this.events.length - EVENT_LOG_SIZE);
	}

	/** Show the docking device that something is happening, then open the Port if it stays put. */
	private startPortDwell({ device }: EventPayloads['portConnected']): void {
		this.cancelPortDwell(device);
		void this.publishDeviceCommand(device, { kind: 'cyd.show', screen: 'loading' }).catch(
			(error: unknown) => console.error('[realtime] could not start port dwell', error)
		);

		const timer = setTimeout(() => {
			this.portDwellTimers.delete(device);
			void this.publishDeviceCommand(device, { kind: 'cyd.show', screen: 'loot' }).catch(
				(error: unknown) => console.error('[realtime] could not finish port dwell', error)
			);
		}, PORT_DWELL_MS);
		// Nothing should be kept alive by a pending dwell: the process exits when the server does.
		timer.unref?.();
		this.portDwellTimers.set(device, timer);
	}

	private cancelPortDwell(device: string): void {
		const timer = this.portDwellTimers.get(device);
		if (timer == null) return;
		clearTimeout(timer);
		this.portDwellTimers.delete(device);
	}

	/** One slow listener must not stall the broker read loop, so a throwing listener is dropped. */
	private broadcast(frame: RealtimeFrame): void {
		for (const listener of this.listeners) {
			try {
				listener(frame);
			} catch (error) {
				console.error('[realtime] listener failed', error);
				this.listeners.delete(listener);
			}
		}
	}
}
