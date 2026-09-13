/**
 * The control room's one way to make a prop do something.
 *
 * The browser names a target and a command, never a topic: the topic tree is the device-facing
 * API and stays server-side, so a leaked admin session cannot publish somewhere the dashboard was
 * never meant to reach. Everything is re-parsed here even though the dashboard is the only known
 * caller — the bridge holds credentials for every prop in the building.
 *
 * Failures are `RequestError`s rather than SvelteKit's `error()`, because `handleRequest` turns
 * anything else into a 500 — and the difference between "your request was wrong" and "the broker
 * is unreachable" is the whole of what the control room needs to know.
 */
import { parseBroadcastNotify, parseDeviceCommand, parseLightCue } from '$lib/realtime/messages';
import { getRealtimeBridge, type RealtimeBridge } from '$lib/realtime/registry';
import { isTopicSafeUid } from '$lib/realtime/topics';
import { BadRequest, RequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Everything is validated before this runs, so the only way it fails is the broker — which is the
 * site's problem to report, not the caller's to fix.
 */
async function publish(publishing: Promise<void>): Promise<void> {
	try {
		await publishing;
	} catch (err) {
		throw new RequestError(502, err instanceof Error ? err.message : 'could not reach the broker');
	}
}

function requireBridge(): RealtimeBridge {
	const bridge = getRealtimeBridge();
	if (bridge === null) {
		throw new RequestError(503, 'realtime bridge is not running in this process');
	}
	return bridge;
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const bridge = requireBridge();

		const body: unknown = await request.json();
		if (typeof body !== 'object' || body === null) throw new BadRequest();
		const { target, uid, command, notify, cue } = body as Record<string, unknown>;

		if (target === 'device') {
			if (typeof uid !== 'string' || isTopicSafeUid(uid) === false) {
				throw new BadRequest('uid is not a usable device uid');
			}
			const parsed = parseDeviceCommand(command);
			if (parsed === null) throw new BadRequest('unknown device command');
			await publish(bridge.publishDeviceCommand(uid, parsed));
			return json({ ok: true });
		}

		if (target === 'broadcast') {
			const parsed = parseBroadcastNotify(notify);
			if (parsed === null) throw new BadRequest('unusable broadcast payload');
			await publish(bridge.publishBroadcastNotify(parsed));
			return json({ ok: true });
		}

		if (target === 'light') {
			const parsed = parseLightCue(cue);
			if (parsed === null) throw new BadRequest('unusable light cue');
			await publish(bridge.publishLightCue(parsed));
			return json({ ok: true });
		}

		throw new BadRequest('unknown command target');
	});
};
