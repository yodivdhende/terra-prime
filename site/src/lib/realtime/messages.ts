/**
 * Payload shapes for the topics in `./topics.ts`, and the parsers that turn a broker payload into
 * one of them.
 *
 * Anything arriving from the broker was written by a prop that is physically in a player's hands,
 * so every payload is parsed defensively: a malformed message is dropped, never thrown on. The
 * bridge runs for the length of an event and must not fall over because one device shipped with
 * bad firmware.
 *
 * The same no-dependency rule as `./topics.ts` applies — see the note at the top of that file.
 */

import { isTopicSafeUid } from './topics.ts';

/**
 * What a device says about itself. Published retained on its own status topic, and registered as
 * the last will so the broker publishes the offline form when the device stops answering.
 *
 * The will is a fixed payload chosen at connect time, which is why `at` is optional: a device
 * cannot timestamp its own death. The bridge stamps arrival time instead.
 */
export type DeviceStatus = {
	uid: string;
	online: boolean;
	/** Signal bars, 0 (no link) to 4 (full) — the same scale the status bar draws. */
	wifiStrength?: number;
	/** Charge percentage, 0–100. */
	battery?: number;
	firmware?: string;
};

/** Server → device. `cyd.show` forces a screen; `cyd.notify` puts a message on top of one. */
export type DeviceCommand =
	| { kind: 'cyd.show'; screen: string; data?: Record<string, unknown> }
	| { kind: 'cyd.notify'; message: string; durationMs?: number };

export type PortConnectedPayload = { port: string; device: string };
export type PrinterConnectedPayload = { printer: string; device: string };
export type GameWonPayload = { game: string; player: string };
export type PrintTakenPayload = { printer: string; device?: string };

/** Payload per event name, so a handler for one event cannot be handed another's payload. */
export type EventPayloads = {
	portConnected: PortConnectedPayload;
	portDisconnected: PortConnectedPayload;
	printerConnected: PrinterConnectedPayload;
	gameWon: GameWonPayload;
	printTaken: PrintTakenPayload;
};

/** What the light rig reads. One shape, no device vocabulary — see `LIGHT_CUE_TOPIC`. */
export type LightCue = {
	cue: string;
	fixture?: string;
	colour?: string;
	durationMs?: number;
};

export type BroadcastNotify = { message: string; durationMs?: number };

function asRecord(raw: string): Record<string, unknown> | null {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
		return parsed as Record<string, unknown>;
	} catch {
		return null;
	}
}

function asUid(value: unknown): string | null {
	return typeof value === 'string' && isTopicSafeUid(value) ? value : null;
}

function asBoundedNumber(value: unknown, min: number, max: number): number | undefined {
	if (typeof value !== 'number' || Number.isFinite(value) === false) return undefined;
	if (value < min || value > max) return undefined;
	return value;
}

/**
 * `uid` comes from the topic, not the payload: the broker ACL already pinned which topic this
 * device may publish on, so trusting the topic is what stops a device claiming to be another one.
 * A `uid` in the body is ignored.
 */
export function parseDeviceStatus(uid: string, raw: string): DeviceStatus | null {
	const body = asRecord(raw);
	if (body === null) return null;
	if (typeof body.online !== 'boolean') return null;
	return {
		uid,
		online: body.online,
		wifiStrength: asBoundedNumber(body.wifiStrength, 0, 4),
		battery: asBoundedNumber(body.battery, 0, 100),
		firmware: typeof body.firmware === 'string' ? body.firmware : undefined
	};
}

export function parseDeviceCommand(value: unknown): DeviceCommand | null {
	if (typeof value !== 'object' || value === null) return null;
	const body = value as Record<string, unknown>;
	if (body.kind === 'cyd.show') {
		if (typeof body.screen !== 'string' || body.screen.length === 0) return null;
		const data =
			typeof body.data === 'object' && body.data !== null && Array.isArray(body.data) === false
				? (body.data as Record<string, unknown>)
				: undefined;
		return { kind: 'cyd.show', screen: body.screen, data };
	}
	if (body.kind === 'cyd.notify') {
		if (typeof body.message !== 'string' || body.message.length === 0) return null;
		return {
			kind: 'cyd.notify',
			message: body.message,
			durationMs: asBoundedNumber(body.durationMs, 0, 600_000)
		};
	}
	return null;
}

/**
 * Every event payload names the props involved, and every one of those has to be a UID we would
 * be willing to put back into a topic — an event is the thing a Game reacts to by publishing a
 * command at one of these devices.
 */
export function parseEventPayload<Name extends keyof EventPayloads>(
	name: Name,
	raw: string
): EventPayloads[Name] | null {
	const body = asRecord(raw);
	if (body === null) return null;

	switch (name) {
		case 'portConnected':
		case 'portDisconnected': {
			const port = asUid(body.port);
			const device = asUid(body.device);
			if (port === null || device === null) return null;
			return { port, device } as EventPayloads[Name];
		}
		case 'printerConnected': {
			const printer = asUid(body.printer);
			const device = asUid(body.device);
			if (printer === null || device === null) return null;
			return { printer, device } as EventPayloads[Name];
		}
		case 'gameWon': {
			const game = asUid(body.game);
			if (game === null) return null;
			if (typeof body.player !== 'string' || body.player.length === 0) return null;
			return { game, player: body.player } as EventPayloads[Name];
		}
		case 'printTaken': {
			const printer = asUid(body.printer);
			if (printer === null) return null;
			const device = asUid(body.device);
			return { printer, device: device ?? undefined } as EventPayloads[Name];
		}
		default:
			return null;
	}
}

export function parseLightCue(value: unknown): LightCue | null {
	if (typeof value !== 'object' || value === null) return null;
	const body = value as Record<string, unknown>;
	if (typeof body.cue !== 'string' || body.cue.length === 0) return null;
	return {
		cue: body.cue,
		fixture: typeof body.fixture === 'string' ? body.fixture : undefined,
		colour: typeof body.colour === 'string' ? body.colour : undefined,
		durationMs: asBoundedNumber(body.durationMs, 0, 600_000)
	};
}

export function parseBroadcastNotify(value: unknown): BroadcastNotify | null {
	if (typeof value !== 'object' || value === null) return null;
	const body = value as Record<string, unknown>;
	if (typeof body.message !== 'string' || body.message.length === 0) return null;
	return {
		message: body.message,
		durationMs: asBoundedNumber(body.durationMs, 0, 600_000)
	};
}
