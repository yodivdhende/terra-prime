/**
 * The MQTT topic tree — the API between every device and the server.
 *
 * This is the one module in the realtime stack that firmware is compiled against (by hand: the
 * device side of these strings lives in `cyd/src/mqtt-client.cpp`), so it is deliberately the
 * smallest thing that can be shared. Once a topic is flashed onto a prop that is out in a room,
 * renaming it means collecting the hardware — treat every string below as published API.
 *
 * The `<id>` in a device topic is the device's **UID**, the identity the hardware presents and
 * the one `Devices.Uid` is unique on. Not the row id: a device knows its UID from its SD card
 * and has never been told its database key.
 *
 * Nothing here may import from `$lib` or from anything with dependencies. The site bridge
 * (`site/realtime/`) is a plain Node process that imports this file by relative path and runs it
 * through Node's type stripping, so an import of Drizzle or `$app/*` here would break the
 * deployed entrypoint rather than fail a type check.
 */

/** Everything this system publishes sits under one root, so a broker ACL can be written per-prefix. */
export const TOPIC_ROOT = 'tp';

/**
 * Retained, and the last-will topic. A device publishes `{online:true}` on connect and registers
 * `{online:false}` as its will, so a prop whose battery dies shows as offline without the server
 * running any heartbeat logic — and a dashboard that opens later gets the whole fleet's last
 * known state from the retained messages alone.
 */
export function deviceStatusTopic(uid: string): string {
	return `${TOPIC_ROOT}/device/${uid}/status`;
}

/** Server → one device. Subscribed by that device only; no wildcard, no fan-out. */
export function deviceCommandTopic(uid: string): string {
	return `${TOPIC_ROOT}/device/${uid}/cmd`;
}

/** What the bridge subscribes to in order to see every device's status. */
export const DEVICE_STATUS_WILDCARD = `${TOPIC_ROOT}/device/+/status`;

/** What the bridge subscribes to in order to see every event any prop reports. */
export const EVENT_WILDCARD = `${TOPIC_ROOT}/event/#`;

/**
 * Facts, not commands: a prop says what happened to it and does not care who acts on it. A Game
 * claims a Port by subscribing to `port/connected` for that Port's UID — no registry change, and
 * the Port itself carries no configured behaviour at all.
 */
export const EVENT_TOPICS = {
	portConnected: `${TOPIC_ROOT}/event/port/connected`,
	portDisconnected: `${TOPIC_ROOT}/event/port/disconnected`,
	printerConnected: `${TOPIC_ROOT}/event/printer/connected`,
	gameWon: `${TOPIC_ROOT}/event/game/won`,
	printTaken: `${TOPIC_ROOT}/event/print/taken`
} as const;

export type EventName = keyof typeof EVENT_TOPICS;

/**
 * The light rig subscribes to exactly this topic and needs to understand nothing else about the
 * system — no device registry, no event vocabulary, one payload shape. Keeping the cue separate
 * from `tp/event/#` is what lets the rig be a dumb subscriber.
 */
export const LIGHT_CUE_TOPIC = `${TOPIC_ROOT}/cue/light`;

/** Every prop subscribes. The only topic a device listens on that is not addressed to it alone. */
export const BROADCAST_NOTIFY_TOPIC = `${TOPIC_ROOT}/broadcast/notify`;

const EVENT_TOPIC_NAMES: ReadonlyMap<string, EventName> = new Map(
	Object.entries(EVENT_TOPICS).map(([name, topic]) => [topic, name as EventName])
);

/** `tp/event/port/connected` -> `portConnected`, and null for anything else. */
export function eventNameForTopic(topic: string): EventName | null {
	return EVENT_TOPIC_NAMES.get(topic) ?? null;
}

/** The UID out of `tp/device/<uid>/status`, or null if the topic is not a status topic. */
export function uidForStatusTopic(topic: string): string | null {
	const parts = topic.split('/');
	if (parts.length !== 4) return null;
	const [root, device, uid, leaf] = parts;
	if (root !== TOPIC_ROOT || device !== 'device' || leaf !== 'status') return null;
	return uid.length === 0 ? null : uid;
}

/**
 * A UID goes into a topic string unescaped, so it has to be a topic-safe token. MQTT reserves
 * `+`, `#` and `/`, and a UID containing one would let a device subscribe to its neighbours by
 * claiming a wildcard as its own identity — the broker ACL is written in terms of this UID.
 */
export function isTopicSafeUid(uid: string): boolean {
	return /^[A-Za-z0-9._:-]{1,128}$/.test(uid);
}
