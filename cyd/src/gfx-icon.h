#ifndef GFX_ICON
#define GFX_ICON

#include <Arduino.h>

/**
 * The expertise icon pack, drawn straight to the panel a row at a time.
 *
 * The files are the ones the site already exports (`manage/expertise` → "icon pack for
 * AguesGuard"), unchanged: a 24x24 `LV_COLOR_FORMAT_A8` LVGL binary image, a 12-byte header
 * followed by one alpha byte per pixel. Nothing on the site had to change to drop LVGL — the format
 * is just a header and a mask, and reading it takes twenty lines.
 *
 * A8 is a bare coverage mask with no colour of its own, which is the point: the group's colour
 * arrives from `/api/my/expertise` at draw time and is applied here, so re-colouring a group on the
 * site re-tints the device's icons with no re-export.
 *
 * Peak RAM is 72 bytes — one row of alpha and one row of pixels — against the 32 KB image cache
 * LVGL kept resident for the same job.
 */

/** The size the pack is rasterized at, matching `ICON_SIZE` in the site's `icon-export.ts`. */
#define GFX_ICON_SIZE 24

/**
 * Draw the icon at `path`, tinting its coverage from `background` toward `tint`.
 *
 * `path` is a VFS path, not an LVGL one: the Arduino SD library mounts the card at `/sd`, so an
 * icon is `/sd/icons/expertise/12.bin`. The caller must already hold the card's SPI bus — see
 * `SdBusHold` in `sd-reader.h`; one hold around a whole repaint, not one per icon.
 *
 * Returns false when the file is missing or malformed, having drawn nothing. That is not an error:
 * a card with a partial pack, or no `icons/` at all, still lays out correctly because the caller
 * keeps the row's indent either way.
 */
bool drawIconA8(const char* path, int16_t x, int16_t y, uint16_t tint, uint16_t background);

#endif
