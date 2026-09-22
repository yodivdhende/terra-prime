#include <gfx-draw.h>
#include <globals.h>

/**
 * See `gfx-draw.h`. Everything here is a clear followed by a print, and nothing is cached: the
 * panel is the only state, which is what makes a partial repaint (one header cell, one list row)
 * exactly as cheap as it looks.
 */

/** Longest string any of these will draw. Anything longer is cut, with or without truncation. */
#define GFX_TEXT_MAX 96

/** What a truncated string is marked with. `…` is in neither of the device's fonts. */
#define GFX_ELLIPSIS "..."

/** Air inside a button, left and right of its label. */
#define GFX_BUTTON_PAD 8

bool rectContains(const Rect& rect, int16_t x, int16_t y)
{
    return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

void clearBand(int16_t y, int16_t height)
{
    tft.fillRect(0, y, THEME_PANEL_W, height, THEME_BG);
}

void clearRect(const Rect& rect)
{
    tft.fillRect(rect.x, rect.y, rect.w, rect.h, THEME_BG);
}

void drawFrame()
{
    tft.fillScreen(THEME_BG);
    for (int16_t i = 0; i < THEME_BORDER; i++) {
        tft.drawRect(i, i, THEME_PANEL_W - 2 * i, THEME_PANEL_H - 2 * i, THEME_TEXT);
    }
}

void gfxUseTitleFont()
{
    tft.setTextSize(1);
    tft.setFreeFont(THEME_FONT_TITLE);
}

void gfxUseBodyFont()
{
    tft.setTextSize(1);
    tft.setFreeFont(THEME_FONT_BODY);
}

void gfxUseMetaFont()
{
    tft.setTextSize(1);
    tft.setTextFont(THEME_FONT_META);
}

void gfxUseGlyphFont(uint8_t size)
{
    tft.setTextFont(THEME_FONT_GLYPH);
    tft.setTextSize(size);
}

int16_t gfxTextWidth(const char* text)
{
    if (text == NULL || text[0] == '\0') return 0;
    return tft.textWidth(text);
}

void gfxUpperCopy(char* out, size_t outSize, const char* text)
{
    if (out == NULL || outSize == 0) return;
    size_t length = 0;
    while (text != NULL && text[length] != '\0' && length < outSize - 1) {
        out[length] = (char)toupper((unsigned char)text[length]);
        length++;
    }
    out[length] = '\0';
}

void drawHeading(const char* title)
{
    clearBand(THEME_HEADING_Y, THEME_HEADING_H);
    if (title == NULL || title[0] == '\0') return;

    char upper[GFX_TEXT_MAX];
    gfxUpperCopy(upper, sizeof(upper), title);

    gfxUseTitleFont();
    const int16_t top = THEME_HEADING_Y + (THEME_HEADING_H - THEME_TITLE_BOX_H) / 2;
    drawTextClipped(THEME_CONTENT_X + THEME_PAD, top, THEME_CONTENT_W - 2 * THEME_PAD, upper,
                    THEME_ACCENT);
}

void drawButton(const Rect& rect, const char* label, bool pressed)
{
    clearRect(rect);
    tft.drawRect(rect.x, rect.y, rect.w, rect.h, pressed ? THEME_ACCENT : THEME_OUTLINE);

    char upper[GFX_TEXT_MAX];
    gfxUpperCopy(upper, sizeof(upper), label);

    gfxUseBodyFont();
    const int16_t available = rect.w - 2 * GFX_BUTTON_PAD;
    const int16_t width = gfxTextWidth(upper);
    const int16_t x = width < available ? rect.x + (rect.w - width) / 2 : rect.x + GFX_BUTTON_PAD;
    const int16_t y = rect.y + (rect.h - THEME_BODY_BOX_H) / 2;
    drawTextClipped(x, y, available, upper, pressed ? THEME_ACCENT : THEME_TEXT);
}

void drawChromeButton(const Rect& rect, const char* glyph, bool pressed, bool enabled)
{
    const uint16_t chrome = enabled ? THEME_TEXT : THEME_HAIRLINE;

    if (pressed && enabled) {
        tft.fillRect(rect.x, rect.y, rect.w, rect.h, chrome);
    } else {
        clearRect(rect);
        for (int16_t i = 0; i < THEME_BORDER; i++) {
            tft.drawRect(rect.x + i, rect.y + i, rect.w - 2 * i, rect.h - 2 * i, chrome);
        }
    }

    if (glyph == NULL || glyph[0] == '\0') return;

    gfxUseGlyphFont(2);
    const int16_t width = gfxTextWidth(glyph);
    const int16_t height = THEME_GLYPH_BOX_H * 2;
    tft.setTextColor(pressed && enabled ? THEME_BG : chrome);
    tft.drawString(glyph, rect.x + (rect.w - width) / 2, rect.y + (rect.h - height) / 2);
}

void drawBar(int16_t x, int16_t y, int16_t w, int16_t h, int value, int maximum, uint16_t colour)
{
    if (w <= 2 || h <= 2) return;
    if (maximum <= 0) maximum = 1;
    if (value < 0) value = 0;
    if (value > maximum) value = maximum;

    tft.fillRect(x, y, w, h, THEME_TRACK);
    tft.drawRect(x, y, w, h, THEME_OUTLINE);

    // The fill sits inside the outline, so a full bar still reads as a bar rather than a block.
    const int16_t inner = w - 2;
    const int16_t filled = (int16_t)(((int32_t)inner * value) / maximum);
    if (filled > 0) tft.fillRect(x + 1, y + 1, filled, h - 2, colour);
}

void drawTextClipped(int16_t x, int16_t y, int16_t width, const char* text, uint16_t colour)
{
    if (text == NULL || text[0] == '\0' || width <= 0) return;

    tft.setTextColor(colour);
    if (gfxTextWidth(text) <= width) {
        tft.drawString(text, x, y);
        return;
    }

    // Shrink from the end until the prefix plus its marker fits. Strings here are a line long at
    // most, so walking down a character at a time costs less than the repaint it precedes.
    char buffer[GFX_TEXT_MAX + sizeof(GFX_ELLIPSIS)];
    size_t keep = strlen(text);
    if (keep > GFX_TEXT_MAX) keep = GFX_TEXT_MAX;

    while (keep > 0) {
        memcpy(buffer, text, keep);
        memcpy(buffer + keep, GFX_ELLIPSIS, sizeof(GFX_ELLIPSIS));
        if (gfxTextWidth(buffer) <= width) {
            tft.drawString(buffer, x, y);
            return;
        }
        keep--;
    }
    // Not even the marker fits. Draw nothing rather than spill into the next cell.
}
