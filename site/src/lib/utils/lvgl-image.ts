/**
 * Writing LVGL 9 binary images, the format the AguesGuard reads icons in.
 *
 * Only `LV_COLOR_FORMAT_A8` is produced, which is all these icons need: they are monochrome line
 * art, so the alpha plane carries the whole shape and LVGL draws an A8 image as a mask tinted with
 * the widget's `image_recolor` style. That means one byte per pixel instead of three for RGB565A8,
 * and the colour stays a runtime decision — changing an expertise group's colour on the site
 * re-tints the device's icons with no re-export.
 *
 * Layout, matching `lv_image_header_t` in `cyd/lib/lvgl/src/draw/lv_image_dsc.h` on a little-endian
 * target: a 12-byte header of magic (1), colour format (1), flags (2), width (2), height (2),
 * stride (2), reserved (2), then `stride * height` bytes of alpha.
 */

/** `LV_IMAGE_HEADER_MAGIC` */
const MAGIC = 0x19;
/** `LV_COLOR_FORMAT_A8` */
const COLOR_FORMAT_A8 = 0x0e;
export const LVGL_HEADER_BYTES = 12;

/**
 * One `.bin` holding `width * height` alpha bytes, row-major from the top left.
 *
 * `alpha` must already be at the target size — scaling belongs to whatever rasterized it, which
 * has a real renderer to do it with.
 */
export function toLvglA8Bin(
	alpha: Uint8Array,
	width: number,
	height: number
): Uint8Array<ArrayBuffer> {
	if (width <= 0 || height <= 0) throw new Error('width and height must be positive');
	if (width > 0xffff || height > 0xffff) throw new Error('width and height must fit in 16 bits');
	if (alpha.length !== width * height) {
		throw new Error(`expected ${width * height} alpha bytes, got ${alpha.length}`);
	}

	// A8 is one byte per pixel, so a row is exactly `width` bytes with no padding.
	const stride = width;
	const out = new Uint8Array(LVGL_HEADER_BYTES + stride * height);
	const header = new DataView(out.buffer, 0, LVGL_HEADER_BYTES);
	header.setUint8(0, MAGIC);
	header.setUint8(1, COLOR_FORMAT_A8);
	header.setUint16(2, 0, true); // flags: not compressed, no premultiplied alpha
	header.setUint16(4, width, true);
	header.setUint16(6, height, true);
	header.setUint16(8, stride, true);
	header.setUint16(10, 0, true); // reserved
	out.set(alpha, LVGL_HEADER_BYTES);
	return out;
}
