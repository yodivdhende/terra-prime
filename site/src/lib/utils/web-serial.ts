/**
 * Provisioning a Port's UID over USB, in the browser.
 *
 * A Port Nano is flashed once with the default sketch in `arduino-nano-uid/` and knows nothing
 * else; its UID is written afterwards, from this page, over Web Serial. There is no server round
 * trip — the admin holds the hardware, so the hardware is what gets written.
 *
 * The protocol is the sketch's, and is two lines long: we send `SET_UID:<uid>\n`, the board
 * stores it in EEPROM and answers `OK:<uid>\n`. Anything else on the wire is the board's normal
 * heartbeat (it loops its current UID four times a second) and is skipped.
 *
 * Web Serial is Chromium-only and requires a secure context and a user gesture, hence
 * `isWebSerialSupported()` to hide the button where it cannot work.
 */

const BAUD_RATE = 115200;
const ACK_TIMEOUT_MS = 5000;

export type ProgramUidResult = { ok: true } | { ok: false; error: string };

export function isWebSerialSupported(): boolean {
	return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export async function programUid(uid: string): Promise<ProgramUidResult> {
	const trimmed = uid.trim();
	if (trimmed.length === 0) return { ok: false, error: 'Set a uid before programming' };
	if (/[\r\n:]/.test(trimmed)) {
		return { ok: false, error: 'A uid cannot contain a colon or a line break' };
	}
	if (isWebSerialSupported() === false) {
		return { ok: false, error: 'Web Serial is not available in this browser' };
	}

	let port: SerialPort | undefined;
	try {
		port = await navigator.serial.requestPort();
	} catch {
		// Also what a cancelled picker looks like; there is nothing to report.
		return { ok: false, error: 'No serial port was selected' };
	}

	try {
		await port.open({ baudRate: BAUD_RATE });
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Could not open the port' };
	}

	try {
		await write(port, `SET_UID:${trimmed}\n`);
		const acknowledged = await waitForAck(port, trimmed);
		if (acknowledged === false) {
			return { ok: false, error: 'The board did not acknowledge the uid' };
		}
		return { ok: true };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Programming failed' };
	} finally {
		await close(port);
	}
}

async function write(port: SerialPort, payload: string): Promise<void> {
	const writable = port.writable;
	if (writable == null) throw new Error('The port is not writable');
	const writer = writable.getWriter();
	try {
		await writer.write(new TextEncoder().encode(payload));
	} finally {
		writer.releaseLock();
	}
}

/**
 * The board is mid-heartbeat when we start listening, so the first thing we read is usually a
 * partial line. Buffer, split on newlines, and look only for `OK:<uid>`.
 */
async function waitForAck(port: SerialPort, uid: string): Promise<boolean> {
	const readable = port.readable;
	if (readable == null) throw new Error('The port is not readable');
	const reader = readable.getReader();
	const decoder = new TextDecoder();
	const deadline = Date.now() + ACK_TIMEOUT_MS;
	let buffer = '';

	try {
		while (Date.now() < deadline) {
			const chunk = await withTimeout(reader.read(), deadline - Date.now());
			if (chunk == null) return false;
			if (chunk.done) return false;
			buffer += decoder.decode(chunk.value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';
			if (lines.some((line) => line.trim() === `OK:${uid}`)) return true;
		}
		return false;
	} finally {
		await reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}

/** Resolves to null on timeout so the caller can stop waiting without losing the reader. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
	if (ms <= 0) return Promise.resolve(null);
	return Promise.race([
		promise,
		new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
	]);
}

async function close(port: SerialPort): Promise<void> {
	try {
		await port.close();
	} catch {
		// A port that never opened, or was unplugged mid-write, throws here; nothing to do.
	}
}
