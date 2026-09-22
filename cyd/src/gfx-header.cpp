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
 * Verified present in `lib/TFT_eSPI/Fonts/glcdfont.c`. Written as escapes, never as UTF-8 source.
 */

/** CP437 0x7F, a house. */
#define GLYPH_HOME "\x7F"
/**
 * The WiFi ladder, five characters wide at every rung.
 *
 * `0xF9` is the bullet, deliberately, and **not** CP437 `0x07`: `0x07` sits in the control range
 * that `TFT_eSPI.cpp:5068` rejects whenever a smooth font is loaded. `0xFA` is the smaller dot.
 */
static const char* const WIFI_LADDER[] = {
    "  \xFA  ", /* 0 — no link */
    "  \xFA  ", /* 1 */
    "  \xF9  ", /* 2 */
    " (\xF9) ", /* 3 */
    "((\xF9))"  /* 4 — full */
};

/** The battery ladder: full block, then three shade levels, then an empty cell for unmetered. */
#define BATTERY_FULL "[\xDB]"
#define BATTERY_HIGH "[\xB2]"
#define BATTERY_MID "[\xB1]"
#define BATTERY_LOW "[\xB0]"
#define BATTERY_UNMETERED "[ ]"

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
    if (batteryPercent < 0) return BATTERY_UNMETERED;
    if (batteryPercent >= 75) return BATTERY_FULL;
    if (batteryPercent >= 50) return BATTERY_HIGH;
    if (batteryPercent >= 25) return BATTERY_MID;
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
