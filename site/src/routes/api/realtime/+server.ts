/**
 * The dashboard's realtime feed.
 *
 * Server-sent events rather than a socket to the broker: the control room is a browser holding an
 * admin cookie, and this way broker credentials never leave the server and authorisation is the
 * same `authGuardForUser` every other admin route already uses. The dashboard only reads, so a
 * one-directional stream is the whole requirement — commands go back over `POST ./commands`.
 */
import { getRealtimeBridge } from '$lib/realtime/registry';
import type { RealtimeFrame } from '$lib/realtime/stream';
import { RequestError } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { type RequestHandler } from '@sveltejs/kit';

/**
 * Proxies and load balancers hang up on a quiet connection. The comment costs nothing, is ignored
 * by `EventSource` by definition, and is what keeps an idle control-room screen subscribed through
 * a whole game.
 */
const KEEPALIVE_MS = 25_000;

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);

		const bridge = getRealtimeBridge();
		// `pnpm start` runs without the realtime entrypoint in front of it, so this is a deployment
		// answer, not a client mistake — say so rather than streaming silence.
		//
		// `RequestError` rather than SvelteKit's `error()`: `handleRequest` turns anything that is not
		// a `RequestError` into a 500, so an `error(503)` thrown in here would reach the browser as
		// "something broke" instead of "the bridge is not running".
		if (bridge === null) {
			throw new RequestError(503, 'realtime bridge is not running in this process');
		}

		let unsubscribe: (() => void) | null = null;
		let keepalive: ReturnType<typeof setInterval> | null = null;

		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				const encoder = new TextEncoder();
				const send = (chunk: string) => {
					try {
						controller.enqueue(encoder.encode(chunk));
					} catch {
						// The browser went away between the bridge publishing and this write. Tearing the
						// subscription down here is what stops a closed tab holding a listener forever.
						cleanup();
					}
				};

				const cleanup = () => {
					unsubscribe?.();
					unsubscribe = null;
					if (keepalive !== null) clearInterval(keepalive);
					keepalive = null;
				};

				unsubscribe = bridge.subscribe((frame: RealtimeFrame) => {
					send(`data: ${JSON.stringify(frame)}\n\n`);
				});
				keepalive = setInterval(() => send(': keepalive\n\n'), KEEPALIVE_MS);
			},
			cancel() {
				unsubscribe?.();
				unsubscribe = null;
				if (keepalive !== null) clearInterval(keepalive);
				keepalive = null;
			}
		});

		return new Response(stream, {
			headers: {
				'content-type': 'text/event-stream',
				'cache-control': 'no-store',
				connection: 'keep-alive',
				// Nginx-shaped proxies buffer by default, which turns a live feed into a feed that
				// arrives all at once when the game is over.
				'x-accel-buffering': 'no'
			}
		});
	});
};
