#include <gfx-header.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>
#include <screen.h>

/**
 * See `gfx-header.h`.
 *
 * Every cell keeps the last value it drew and returns early when asked to draw it again, so the
 * per-cell setters are safe to call from a polling loop: the two that are driven today are checked
 * every couple of seconds and repaint only when the reading actually moves.
 */

/* ── Glyphs ──────────────────────────────────────────────────────────────────────────────────
 * Each ladder is a fixed-width string at every rung, so a state change repaints one cell and can
 * never reflow the row. Both ladders below are plain ASCII; the house is the one glyph on the
 * device that is not, which is why the header still draws in the GLCD font — see `gfx-header.h`.
 */

/** CP437 0x7F, a house. Verified present in `lib/TFT_eSPI/Fonts/glcdfont.c`. */
#define GLYPH_HOME "\x7F"

/**
 * The WiFi ladder: three growing bars, three characters wide at every rung.
 *
 * `.` sits low, `o` is mid-height and `O` is full-height, so the rungs read as a staircase rather
 * than as three different symbols. `_` is the empty slot, on the baseline where a bar would start.
 *
 * `wifiStrengthLevel()` reports 0-4 and the ladder has four rungs, so one rung covers two levels.
 * The doubling is deliberately in the **middle**: both ends stay exact, so `___` means there is no
 * link at all and `.oO` means the signal really is at the top bucket, not "3 or 4 bars".
 */
static const char* const WIFI_LADDER[] = {
    "___", /* 0 — no link */
    ".__", /* 1 */
    ".o_", /* 2 */
    ".o_", /* 3 */
    ".oO"  /* 4 — full */
};

/**
 * The battery ladder: three segments draining right to left, five characters wide at every rung.
 *
 * `[ X ]` is "no charge to show", which covers both a flat pack and an unmetered one — a device
 * with no INA219 on the bus has nothing to draw either. The colour tells them apart: `batteryColour()`
 * returns the hairline for unmetered and the error red for flat.
 */
#define BATTERY_FULL "[===]"
#define BATTERY_MID "[== ]"
#define BATTERY_LOW "[=  ]"
#define BATTERY_EMPTY "[ X ]"

/** Charge at or above these keeps the next segment lit. */
#define BATTERY_FULL_PERCENTAGE 66
#define BATTERY_MID_PERCENTAGE 33

/** Charge below this is worth a warning colour, and below the second a red one. */
#define BATTERY_LOW_PERCENTAGE 50
#define BATTERY_CRITICAL_PERCENTAGE 20

/** The home button's box, inside the 28px header band. */
static const Rect HOME_BUTTON = {THEME_HOME_X, THEME_HEADER_Y + 1, THEME_HOME_W, THEME_HOME_W};

/** Header state, kept so a setter can repaint one cell without being told the rest again. */
static char characterName[32] = "";
static bool homeEnabled = false;
static bool homePressed = false;
static int wifiLevel = -1;
static int batteryPercent = -2;
static bool batteryCharging = false;
static int clockHours = -1;
static int clockMinutes = -1;

/** Vertically centre a glyph-font cell of `size` in the header band. */
static int16_t glyphTop(uint8_t size)
{
    return THEME_HEADER_Y + (THEME_HEADER_H - THEME_GLYPH_BOX_H * size) / 2;
}

static void drawHomeCell()
{
    drawChromeButton(HOME_BUTTON, GLYPH_HOME, homePressed, homeEnabled);
}

static void drawNameCell()
{
    tft.fillRect(THEME_NAME_X, THEME_HEADER_Y, THEME_NAME_W, THEME_HEADER_H, THEME_BG);
    gfxUseBodyFont();
    const int16_t top = THEME_HEADER_Y + (THEME_HEADER_H - THEME_BODY_BOX_H) / 2;
    drawTextClipped(THEME_NAME_X, top, THEME_NAME_W, characterName, THEME_BODY);
}

static void drawWifiCell()
{
    tft.fillRect(THEME_WIFI_X, THEME_HEADER_Y, THEME_WIFI_W, THEME_HEADER_H, THEME_BG);
    int level = wifiLevel;
    if (level < 0) level = 0;
    if (level > 4) level = 4;

    gfxUseGlyphFont(2);
    tft.setTextColor(level == 0 ? THEME_ERROR : THEME_DIM);
    tft.drawString(WIFI_LADDER[level], THEME_WIFI_X, glyphTop(2));
}

static const char* batteryGlyph()
{
    // Unmetered and flat share a rung: neither has a charge worth drawing. The colour separates them.
    if (batteryPercent <= 0) return BATTERY_EMPTY;
    if (batteryPercent >= BATTERY_FULL_PERCENTAGE) return BATTERY_FULL;
    if (batteryPercent >= BATTERY_MID_PERCENTAGE) return BATTERY_MID;
    return BATTERY_LOW;
}

static uint16_t batteryColour()
{
    if (batteryPercent < 0) return THEME_HAIRLINE;
    if (batteryCharging) return THEME_ACCENT;
    if (batteryPercent < BATTERY_CRITICAL_PERCENTAGE) return THEME_ERROR;
    if (batteryPercent < BATTERY_LOW_PERCENTAGE) return THEME_WARNING;
    return THEME_TEXT;
}

static void drawBatteryCell()
{
    tft.fillRect(THEME_BATTERY_X, THEME_HEADER_Y, THEME_BATTERY_W, THEME_HEADER_H, THEME_BG);
    gfxUseGlyphFont(2);
    tft.setTextColor(batteryColour());
    tft.drawString(batteryGlyph(), THEME_BATTERY_X, glyphTop(2));
}

static void drawClockCell()
{
    tft.fillRect(THEME_CLOCK_X, THEME_HEADER_Y, THEME_CLOCK_W, THEME_HEADER_H, THEME_BG);

    // Five characters either way, so the cell never reflows. `headerSetClock()` has already
    // rejected anything that would not fit.
    char text[8];
    if (clockHours < 0 || clockMinutes < 0) snprintf(text, sizeof(text), "--:--");
    else snprintf(text, sizeof(text), "%02d:%02d", clockHours % 100, clockMinutes % 100);

    gfxUseGlyphFont(2);
    tft.setTextColor(THEME_DIM);
    tft.drawString(text, THEME_CLOCK_X, glyphTop(2));
}

void headerDraw(const char* name, bool enabled)
{
    snprintf(characterName, sizeof(characterName), "%s", name == NULL ? "" : name);
    homeEnabled = enabled;
    homePressed = false;

    clearBand(THEME_HEADER_Y, THEME_HEADER_H);
    drawHomeCell();
    drawNameCell();
    drawWifiCell();
    drawBatteryCell();
    drawClockCell();

    // The rule closing the header off. Drawn here rather than in `drawFrame()` because a full-bleed
    // screen has no header and must not get the rule either.
    tft.fillRect(0, THEME_RULE_Y, THEME_PANEL_W, THEME_RULE_H, THEME_TEXT);
}

void headerSetWifi(int level)
{
    if (level == wifiLevel) return;
    wifiLevel = level;
    drawWifiCell();
}

void headerSetBattery(int percent, bool charging)
{
    if (percent == batteryPercent && charging == batteryCharging) return;
    batteryPercent = percent;
    batteryCharging = charging;
    drawBatteryCell();
}

void headerSetClock(int hours, int minutes)
{
    // Out of range reads as "no time" rather than being drawn: the cell is a fixed five characters
    // and a three-digit hour would both overflow the buffer and push the row out of shape.
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        hours = -1;
        minutes = -1;
    }
    if (hours == clockHours && minutes == clockMinutes) return;
    clockHours = hours;
    clockMinutes = minutes;
    drawClockCell();
}

bool headerHandleTouch(const TouchEvent& event)
{
    if (homeEnabled == false) return false;

    switch (event.kind) {
        case TOUCH_DOWN:
            if (rectContains(HOME_BUTTON, event.x, event.y) == false) return false;
            homePressed = true;
            drawHomeCell();
            return true;

        case TOUCH_MOVE:
            if (homePressed == false) return false;
            // A finger that slides off the button cancels the press, the way a button should — but
            // the gesture stays the header's, so the screen below never sees a stray drag.
            if (rectContains(HOME_BUTTON, event.x, event.y) == false) {
                homePressed = false;
                drawHomeCell();
            }
            return true;

        case TOUCH_UP:
            if (homePressed == false) return false;
            homePressed = false;
            drawHomeCell();
            if (rectContains(HOME_BUTTON, event.x, event.y)) screenGoHome();
            return true;
    }
    return false;
}
