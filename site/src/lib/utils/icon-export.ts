import { toLvglA8Bin } from './lvgl-image';
import { createZip, type ZipEntry } from './zip';

/**
 * Building the icon pack an AguesGuard reads off its SD card.
 *
 * The device cannot draw the SVGs the site stores — LVGL has no SVG renderer and an ESP32 has no
 * memory to gain one — so the icons are rasterized here, once, into LVGL's own binary format at the
 * size the device actually draws them.
 *
 * Files are keyed on id, not name: names get edited and ids do not, and the device already receives
 * the id in `/api/my/expertise`. An id with no file on the card simply draws no icon, so a partial
 * pack is not a failure.
 *
 * The archive unpacks to `icons/…` and is meant to be dropped onto the card root next to
 * `config.json`.
 */

/** The size the device draws these at. One size, because a scaled `.bin` costs RAM to transform. */
export const ICON_SIZE = 24;

export type IconSource = {
	id: number;
	/** SVG markup, or null/empty for an entry with no icon — those are skipped. */
	icon?: string | null;
};

/**
 * Turns SVG markup into `size * size` alpha bytes, row-major from the top left.
 *
 * Only the alpha channel is kept, which is why the colour in the markup does not matter: these
 * icons carry no `fill` and would rasterize black, but the shape is in the coverage either way, and
 * the device tints it at draw time.
 */
export type RasterizeSvgAlpha = (svg: string, size: number) => Promise<Uint8Array>;

export type IconPackRequest = {
	expertise: IconSource[];
	groups: IconSource[];
};

export type IconPackResult = {
	zip: Uint8Array<ArrayBuffer>;
	/** What went in, for telling the admin what they got. */
	files: string[];
	/** Ids that had no icon to export, per collection. */
	skipped: { expertise: number[]; groups: number[] };
};

export async function buildIconPack(
	{ expertise, groups }: IconPackRequest,
	rasterize: RasterizeSvgAlpha,
	now?: Date
): Promise<IconPackResult> {
	const entries: ZipEntry[] = [];
	const skipped: IconPackResult['skipped'] = { expertise: [], groups: [] };

	for (const [collection, sources, directory] of [
		['expertise', expertise, 'icons/expertise'],
		['groups', groups, 'icons/expertise-groups']
	] as const) {
		for (const source of sources) {
			const markup = source.icon?.trim();
			if (!markup) {
				skipped[collection].push(source.id);
				continue;
			}
			const alpha = await rasterize(markup, ICON_SIZE);
			entries.push({
				path: `${directory}/${source.id}.bin`,
				bytes: toLvglA8Bin(alpha, ICON_SIZE, ICON_SIZE)
			});
		}
	}

	return {
		zip: createZip(entries, now),
		files: entries.map((entry) => entry.path),
		skipped
	};
}
