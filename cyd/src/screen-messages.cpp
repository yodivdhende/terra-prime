#include <screens.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * Messages: a titled empty frame.
 *
 * It was an empty stub under SquareLine too — a header and a title and nothing under them. Ported
 * as-is rather than dropped, because the Home button that opens it is part of the layout the
 * players already know, and an empty screen that says so beats a button that does nothing.
 */

static void messagesDraw()
{
    clearBand(THEME_CONTENT_Y, THEME_CONTENT_H);

    // Uppercase + dim = status, the third of the three type roles.
    gfxUseMetaFont();
    const char* const text = "NO MESSAGES";
    const int16_t width = gfxTextWidth(text);
    tft.setTextColor(THEME_DIM);
    tft.drawString(text, (THEME_PANEL_W - width) / 2, THEME_CONTENT_Y + THEME_CONTENT_H / 2 - 8);
}

const Screen* screenMessages()
{
    static const Screen screen = {"Messages", true, NULL, messagesDraw, NULL, NULL};
    return &screen;
}
