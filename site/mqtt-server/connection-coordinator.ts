import mqtt, { type MqttClient } from 'mqtt';

const MQTT_URL = process.env.MQTT_URL ?? 'mqtt://localhost:1883';

const TOPIC_LINK = 'terra/link';
const gotoTopic = (token: string) => `terra/goto/${token}`;

/**
 * Tiny, link-only MQTT coordinator.
 *
 * Status presence and `goTo` routing are peer-to-peer over the broker (retained
 * `terra/status/{token}` + LWT, and direct `terra/goto/{token}` publishes), so this
 * coordinator does NOT track or rebroadcast connection status. Its only job is the
 * time-windowed link rendezvous that needs shared, cross-device state:
 *   - first link to a target -> send that origin to the `loading` screen
 *   - a second link to the same target 3–4.8s later -> send that origin to `loot`
 */
class ConnectionCoordinator {
	private client: MqttClient | undefined;
	private links: Map<string, Date> = new Map();

	public connect(url: string = MQTT_URL) {
		const client = mqtt.connect(url);
		this.client = client;

		client.on('connect', () => {
			console.log('mqtt coordinator connected:', url);
			client.subscribe(TOPIC_LINK, (err) => {
				if (err) console.error('failed to subscribe to', TOPIC_LINK, err);
			});
		});

		client.on('message', (topic, payload) => {
			if (topic !== TOPIC_LINK) return;
			try {
				const link: NonNullable<ConnectionCommand['link']> = JSON.parse(payload.toString());
				this.handleLink(link);
			} catch (error) {
				console.error('invalid link payload:', error);
			}
		});

		client.on('error', console.error);
		return client;
	}

	private handleLink({ origin, linkTarget, isLinked }: NonNullable<ConnectionCommand['link']>) {
		const linkInitDate = this.links.get(linkTarget);
		if (isLinked === false) {
			return;
		}
		if (linkInitDate == null) {
			const newDate = new Date();
			this.links.set(linkTarget, newDate);
			this.sendGoTo(origin, 'loading');
			return;
		}
		const timePasted = new Date().getTime() - linkInitDate.getTime();
		if (timePasted > 3000 && timePasted < 4800) {
			this.sendGoTo(origin, 'loot');
		}
	}

	private sendGoTo(token: string, screen: Screen, data?: Record<string, unknown>) {
		this.client?.publish(gotoTopic(token), JSON.stringify({ screen, data }));
	}
}

export const connectionCoordinator = new ConnectionCoordinator();

export type ConnectionCommand = {
	status?: StatusCommandInfo;
	goTo?: {
		targetToken: string;
		screen: Screen;
		data?: Record<string, unknown>;
	};
	link?: {
		origin: string;
		linkTarget: string;
		isLinked: boolean;
	};
};

export type Command = keyof ConnectionCommand;

export const Screens = {
	loading: 'loading',
	loot: 'loot',
	virus: 'virus'
} as const;
export type Screen = (typeof Screens)[keyof typeof Screens];

export type WebStatusCommandInfo = {
	sessionToken: string;
	connectionType: 'Web';
};

export type CYDStatusCommandInfo = {
	sessionToken: string;
	connectionType: 'CYD';
	wifiStrength: number;
};
export type StatusCommandInfo = WebStatusCommandInfo | CYDStatusCommandInfo;
