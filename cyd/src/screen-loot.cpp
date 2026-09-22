#include <screens.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * Loot: one word, full-bleed.
 *
 * No header, deliberately — it is an admin-pushed interruption, not somewhere a player navigated
 * to, and the screen is meant to read from across a table. The way out is the next `goTo`, which is
 * how it worked under SquareLine too.
 */

static void lootDraw()
{
    // `screenShow()` has already cleared the panel to black for a full-bleed screen.
    const char* const text = "VERKREGEN";
    gfxUseTitleFont();
    const int16_t width = gfxTextWidth(text);
    tft.setTextColor(THEME_ACCENT);
    tft.drawString(text, (THEME_PANEL_W - width) / 2, (THEME_PANEL_H - THEME_TITLE_BOX_H) / 2);
}

const Screen* screenLoot()
{
    static const Screen screen = {NULL, false, NULL, lootDraw, NULL, NULL};
    return &screen;
}

void UiLootSetup()
{
    screenShow(screenLoot());
}
