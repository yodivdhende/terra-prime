#ifndef GFX_DRAW
#define GFX_DRAW

#include <Arduino.h>
#include <TFT_eSPI.h>
#include <gfx-theme.h>

/**
 * The drawing primitives every screen is built from.
 *
 * Same discipline as `boot-screen.cpp`, which is the house style these follow: clear the box you
 * are about to write into, then print into it. Nothing here retains state, nothing allocates, and
 * nothing is redrawn unless a caller asks for it — a screen change repaints the panel, a clock tick
 * repaints one cell.
 *
 * All of these draw at the current viewport's origin, so a caller inside `tft.setViewport()` gets
 * viewport-relative coordinates for free (that is how `gfx-list.cpp` clips a partly visible row).
 */

/** A box, in whatever coordinate space the caller is drawing in. */
struct Rect {
    int16_t x;
    int16_t y;
    int16_t w;
    int16_t h;
};

/** Whether `(x, y)` falls inside `rect`. Hit testing for every button on the device. */
bool rectContains(const Rect& rect, int16_t x, int16_t y);

/** Black out a band the full width of the panel — lifted from `boot-screen.cpp`'s `clearBand()`. */
void clearBand(int16_t y, int16_t height);

/** Black out one box. */
void clearRect(const Rect& rect);

/** Clear the panel and draw the 3px white frame around it. The first thing `screenShow()` does. */
void drawFrame();

/**
 * The screen's title, in the band under the header rule: uppercase, accent green, bold monospace.
 *
 * `title` is uppercased as it is drawn, so screens can be declared in sentence case.
 */
void drawHeading(const char* title);

/**
 * A full-width outline button in the codex `.btn` idiom: no fill, a thin border, uppercase label.
 *
 * Idle is a dim green outline with white text; pressed inverts to an accent border and accent text.
 * The button does not own its own hit testing — the screen that placed it does.
 */
void drawButton(const Rect& rect, const char* label, bool pressed);

/**
 * A square chrome control holding one glyph, drawn in the GLCD font so it can reach CP437.
 *
 * Used for the header's home button and nothing else so far. Idle is a 3px white box with a white
 * glyph, pressed inverts to a white fill with a black glyph, and disabled is drawn in the hairline
 * colour so it reads as present but inert.
 */
void drawChromeButton(const Rect& rect, const char* glyph, bool pressed, bool enabled);

/**
 * A progress bar: an outlined track with `value`/`maximum` of it filled in `colour`.
 *
 * Every Expertise bar shares one geometry over one range, which is the whole reason that screen can
 * draw no numbers — see "Expertise is bars, never numbers" in `cyd/CLAUDE.md`. Values outside the
 * range are clamped rather than overflowing the track.
 */
void drawBar(int16_t x, int16_t y, int16_t w, int16_t h, int value, int maximum, uint16_t colour);

/**
 * Draw `text` at `(x, y)` in the currently selected font, cut to `width` pixels.
 *
 * A string too long for its box is truncated and marked with `...`. Neither font on the device has
 * a `…` glyph — `FreeMono*` stops at 0x7E and the GLCD font's CP437 page has no ellipsis — so the
 * three-dot spelling is what `…` degrades to here.
 *
 * `y` is the top of the glyph box for every font, GFX free fonts included, because TFT_eSPI moves a
 * free font's datum to the baseline itself when the text datum is `TL_DATUM`.
 */
void drawTextClipped(int16_t x, int16_t y, int16_t width, const char* text, uint16_t colour);

/** Select the heading font: bold monospace, for a title or a group name. */
void gfxUseTitleFont();

/** Select the body font: monospace, 11px per glyph, 18px row pitch. */
void gfxUseBodyFont();

/** Select the meta font: built-in font 2, for status lines. */
void gfxUseMetaFont();

/**
 * Select the built-in GLCD font at `size`, the only font that can draw a CP437 glyph.
 *
 * Valid only once `uiSetup()` has turned UTF-8 decoding off and CP437 correction on; without both,
 * a byte over 0x7F either vanishes into a UTF-8 lead byte or lands one glyph off.
 */
void gfxUseGlyphFont(uint8_t size);

/** Width of `text` in the currently selected font. */
int16_t gfxTextWidth(const char* text);

/**
 * Copy `text` into `out` in upper case, truncated to fit.
 *
 * Uppercasing happens at draw time rather than in the data, so a heading can be declared in the
 * case it reads best in and still obey "uppercase + accent green = a heading".
 */
void gfxUpperCopy(char* out, size_t outSize, const char* text);

#endif
