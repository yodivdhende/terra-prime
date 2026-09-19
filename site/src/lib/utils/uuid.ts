// crypto.randomUUID() is a Web Crypto API method restricted to secure contexts (HTTPS or
// exactly `localhost`) — in the browser, over plain HTTP from any other origin (e.g. a LAN_MODE
// deployment reached by LAN IP or hostname), it's undefined and calling it throws. Fall back to
// a Math.random()-based v4 UUID there; these ids aren't used as security tokens, just as unique
// keys, so the weaker randomness is fine.
export function generateUuid(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
