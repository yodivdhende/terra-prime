#ifndef GFX_HEADER
#define GFX_HEADER

#include <Arduino.h>
#include <touch.h>

/**
 * The header every screen with chrome carries: home button, character name, WiFi, battery, clock.
 *
 * **The indicators are characters, not bitmaps.** Codex already works this way — literal `>`/`v`
 * tree arrows, `◉`/`◎` password toggles, `[####....]` ASCII progress bars — and a glyph costs five
 * bytes of an already-linked font against a few hundred for an image. They come from TFT_eSPI's
 * built-in GLCD font, the only font on the device that reaches CP437: fonts 2 and 3-8 reject
 * anything outside 32-127 outright, and the `FreeMono*` GFX fonts stop at 0x7E.
 *
 * Two things have to be true before any of it renders, and `uiSetup()` sets both, once:
 * UTF-8 decoding **off**, or every byte over 0x7F is swallowed as a lead byte and draws nothing;
 * and CP437 correction **on**, or TFT_eSPI's Adafruit-compatibility fixup shifts every code above
 * 175 by one and the shade blocks come out as the wrong glyph. Glyphs are therefore written as
 * escapes in `char` literals (`"[\xDB]"`) and never as UTF-8 source text.
 *
 * Each indicator is a **fixed-width string** and each setter repaints **only its own cell**, so a
 * clock ticking once a second can never reflow the row or trigger a panel repaint.
 */

/**
 * Paint the whole header and the rule under it.
 *
 * `homeEnabled` is false on Home itself, where the button is drawn dim and does nothing.
 * The indicators keep whatever state the setters last gave them, so a screen change does not
 * flicker them back to a default.
 */
void headerDraw(const char* characterName, bool homeEnabled);

/**
 * Signal strength, as the 0-4 bars `wifiStrengthLevel()` reports.
 *
 * Drawn as a ladder of CP437 glyphs — `((.))`, ` (.) `, `  .  `, `  ·  ` — all five characters
 * wide, so the cell never moves. This is also where `ApiResult.stale` belongs when it is finally
 * wired: it is the indicator that already means "the network".
 */
void headerSetWifi(int level);

/** Charge left, 0-100, or -1 for unmetered. `charging` tints the cell rather than widening it. */
void headerSetBattery(int percent, bool charging);

/** Wall clock. Nothing drives this yet — the device has neither an RTC nor an NTP client. */
void headerSetClock(int hours, int minutes);

/**
 * Offer one touch event to the header. Returns true when the header consumed it.
 *
 * The home button is the only thing here that takes touch, and a completed press navigates to Home
 * via `screenGoHome()` before this returns.
 */
bool headerHandleTouch(const TouchEvent& event);

#endif
