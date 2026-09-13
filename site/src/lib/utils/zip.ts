/**
 * A minimal ZIP writer, stored entries only.
 *
 * No dependency and no compression: the whole point is a handful of small binary files the admin
 * drops onto an SD card, and they are already dense — a deflate pass would save a few kilobytes on
 * a one-off download in exchange for a library. If an export ever grows to where that matters,
 * reach for a real zip library rather than adding compression here.
 *
 * Format: PKZIP APPNOTE 6.3.2, sections 4.3.7 (local file header), 4.3.12 (central directory) and
 * 4.3.16 (end of central directory). Only ASCII paths are emitted, so there is no need for the
 * UTF-8 name flag.
 */

export type ZipEntry = {
	/** Path inside the archive, `/`-separated, no leading slash. */
	path: string;
	bytes: Uint8Array;
};

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const STORED = 0;
/** The version needed to extract a stored entry: 1.0. */
const VERSION_STORED = 10;

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let bit = 0; bit < 8; bit++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[i] = c >>> 0;
	}
	return table;
}

export function crc32(bytes: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/**
 * DOS date/time, the only timestamp a plain zip entry carries. Seconds have 2-second resolution and
 * the epoch is 1980, which is the format's problem, not ours.
 */
function dosDateTime(date: Date): { time: number; date: number } {
	const year = Math.max(1980, date.getFullYear());
	return {
		time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
		date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
	};
}

export function createZip(entries: ZipEntry[], now: Date = new Date()): Uint8Array<ArrayBuffer> {
	const { time, date } = dosDateTime(now);
	const names = entries.map((entry) => new TextEncoder().encode(entry.path));
	const crcs = entries.map((entry) => crc32(entry.bytes));

	const localSize = entries.reduce(
		(total, entry, i) => total + 30 + names[i].length + entry.bytes.length,
		0
	);
	const centralSize = entries.reduce((total, _entry, i) => total + 46 + names[i].length, 0);
	const out = new Uint8Array(localSize + centralSize + 22);
	const view = new DataView(out.buffer);
	let at = 0;

	const offsets: number[] = [];
	entries.forEach((entry, i) => {
		offsets.push(at);
		view.setUint32(at, LOCAL_HEADER, true);
		view.setUint16(at + 4, VERSION_STORED, true);
		view.setUint16(at + 6, 0, true); // flags
		view.setUint16(at + 8, STORED, true);
		view.setUint16(at + 10, time, true);
		view.setUint16(at + 12, date, true);
		view.setUint32(at + 14, crcs[i], true);
		view.setUint32(at + 18, entry.bytes.length, true); // compressed size
		view.setUint32(at + 22, entry.bytes.length, true); // uncompressed size
		view.setUint16(at + 26, names[i].length, true);
		view.setUint16(at + 28, 0, true); // extra field length
		at += 30;
		out.set(names[i], at);
		at += names[i].length;
		out.set(entry.bytes, at);
		at += entry.bytes.length;
	});

	const centralStart = at;
	entries.forEach((entry, i) => {
		view.setUint32(at, CENTRAL_HEADER, true);
		view.setUint16(at + 4, VERSION_STORED, true); // version made by
		view.setUint16(at + 6, VERSION_STORED, true); // version needed
		view.setUint16(at + 8, 0, true); // flags
		view.setUint16(at + 10, STORED, true);
		view.setUint16(at + 12, time, true);
		view.setUint16(at + 14, date, true);
		view.setUint32(at + 16, crcs[i], true);
		view.setUint32(at + 20, entry.bytes.length, true);
		view.setUint32(at + 24, entry.bytes.length, true);
		view.setUint16(at + 28, names[i].length, true);
		view.setUint16(at + 30, 0, true); // extra field length
		view.setUint16(at + 32, 0, true); // comment length
		view.setUint16(at + 34, 0, true); // disk number
		view.setUint16(at + 36, 0, true); // internal attributes
		view.setUint32(at + 38, 0, true); // external attributes
		view.setUint32(at + 42, offsets[i], true);
		at += 46;
		out.set(names[i], at);
		at += names[i].length;
	});

	view.setUint32(at, END_OF_CENTRAL_DIRECTORY, true);
	view.setUint16(at + 4, 0, true); // this disk
	view.setUint16(at + 6, 0, true); // disk with the central directory
	view.setUint16(at + 8, entries.length, true);
	view.setUint16(at + 10, entries.length, true);
	view.setUint32(at + 12, at - centralStart, true);
	view.setUint32(at + 16, centralStart, true);
	view.setUint16(at + 20, 0, true); // comment length

	return out;
}
