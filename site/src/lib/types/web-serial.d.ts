/**
 * Minimal Web Serial declarations.
 *
 * The API is Chromium-only, so TypeScript's DOM lib does not carry it. Only the parts
 * `$lib/utils/web-serial.ts` uses are declared here — pulling in `@types/w3c-web-serial` for one
 * call would be a dependency for three interfaces.
 */
interface SerialPort {
	readonly readable: ReadableStream<Uint8Array> | null;
	readonly writable: WritableStream<Uint8Array> | null;
	open(options: { baudRate: number }): Promise<void>;
	close(): Promise<void>;
}

interface Serial {
	requestPort(): Promise<SerialPort>;
	getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
	readonly serial: Serial;
}
