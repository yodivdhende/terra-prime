#include <gfx-icon.h>
#include <globals.h>
#include <sd-reader.h>
#include <stdio.h>

/**
 * See `gfx-icon.h`. The whole reader is the header check below plus one `fread` per row.
 *
 * There is no decoded-mask cache. LVGL kept a 32 KB one (`LV_CACHE_DEF_SIZE`) precisely so that
 * scrolling would not re-read the card every frame; reading 588 bytes per row entering the viewport
 * is about a millisecond, and the list repaint that triggers it already holds the bus for its whole
 * duration. If dragging ever feels sticky, a bounded LRU of decoded masks (576 bytes each) is the
 * fallback — measure before building it.
 */

/** `LV_IMAGE_HEADER_MAGIC`, the first byte of every file the site writes. */
#define LV_IMAGE_MAGIC 0x19
/** `LV_COLOR_FORMAT_A8` — the only format the pack contains, and the only one read here. */
#define LV_COLOR_FORMAT_A8 0x0e
/** magic(1) + colour format(1) + flags(2) + width(2) + height(2) + stride(2) + reserved(2). */
#define LV_IMAGE_HEADER_BYTES 12

/** Blend `background` toward `foreground` by `alpha`, in RGB565's own 5/6/5 channels. */
static uint16_t blend565(uint16_t background, uint16_t foreground, uint8_t alpha)
{
    if (alpha == 0) return background;
    if (alpha == 255) return foreground;

    const int backRed = (background >> 11) & 0x1F;
    const int backGreen = (background >> 5) & 0x3F;
    const int backBlue = background & 0x1F;
    const int foreRed = (foreground >> 11) & 0x1F;
    const int foreGreen = (foreground >> 5) & 0x3F;
    const int foreBlue = foreground & 0x1F;

    const int red = backRed + ((foreRed - backRed) * alpha) / 255;
    const int green = backGreen + ((foreGreen - backGreen) * alpha) / 255;
    const int blue = backBlue + ((foreBlue - backBlue) * alpha) / 255;

    return (uint16_t)((red << 11) | (green << 5) | blue);
}

static uint16_t readUint16(const uint8_t* bytes)
{
    // The site writes little-endian, matching `lv_image_header_t` on the target.
    return (uint16_t)(bytes[0] | (bytes[1] << 8));
}

bool drawIconA8(const char* path, int16_t x, int16_t y, uint16_t tint, uint16_t background)
{
    if (path == NULL) return false;
    if (isSdReady() == false) return false;

    FILE* file = fopen(path, "rb");
    if (file == NULL) return false;

    uint8_t header[LV_IMAGE_HEADER_BYTES];
    if (fread(header, 1, sizeof(header), file) != sizeof(header)) {
        fclose(file);
        return false;
    }

    const uint16_t width = readUint16(header + 4);
    const uint16_t height = readUint16(header + 6);
    const uint16_t stride = readUint16(header + 8);

    if (header[0] != LV_IMAGE_MAGIC || header[1] != LV_COLOR_FORMAT_A8 ||
        width == 0 || height == 0 || width > GFX_ICON_SIZE || height > GFX_ICON_SIZE ||
        stride < width) {
        fclose(file);
        return false;
    }

    uint8_t alpha[GFX_ICON_SIZE];
    uint16_t line[GFX_ICON_SIZE];

    // `pushImage()` sends a host-order array straight into the SPI FIFO, which transmits each word
    // low byte first — the opposite of what the panel wants. Swapping is TFT_eSPI's job, but only
    // when it has been asked; restore whatever the caller had set so this stays self-contained.
    const bool swapped = tft.getSwapBytes();
    tft.setSwapBytes(true);

    for (uint16_t row = 0; row < height; row++) {
        if (fread(alpha, 1, width, file) != width) {
            tft.setSwapBytes(swapped);
            fclose(file);
            return false;
        }
        for (uint16_t column = 0; column < width; column++) {
            line[column] = blend565(background, tint, alpha[column]);
        }
        tft.pushImage(x, y + (int16_t)row, width, 1, line);

        // A8 rows are unpadded in everything the site writes, but the header carries a stride, so
        // honour it rather than assuming.
        if (stride > width) fseek(file, stride - width, SEEK_CUR);
    }

    tft.setSwapBytes(swapped);
    fclose(file);
    return true;
}
