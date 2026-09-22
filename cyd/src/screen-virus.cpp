#include <screens.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * Virus: full-bleed and red, the one screen on the device that breaks the black-surface rule.
 *
 * That is the point of it — it is an alarm, pushed by an admin mid-session, and it has to be
 * unmistakable from across a table. Like Loot it carries no header and no way back; the next `goTo`
 * is the way out.
 */

/** Pure red, as the SquareLine screen had it — not the palette's `--color-error`. */
#define VIRUS_BACKGROUND 0xF800

static void virusDraw()
{
    tft.fillScreen(VIRUS_BACKGROUND);

    const char* const text = "DANGER!!!";
    gfxUseTitleFont();
    const int16_t width = gfxTextWidth(text);
    tft.setTextColor(THEME_TEXT);
    tft.drawString(text, (THEME_PANEL_W - width) / 2, (THEME_PANEL_H - THEME_TITLE_BOX_H) / 2);
}

const Screen* screenVirus()
{
    static const Screen screen = {NULL, false, NULL, virusDraw, NULL, NULL};
    return &screen;
}

void UiVirusSetup()
{
    screenShow(screenVirus());
}
