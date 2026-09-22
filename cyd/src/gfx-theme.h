#ifndef GFX_THEME
#define GFX_THEME

#include <TFT_eSPI.h>

/**
 * The look of every screen, in one place.
 *
 * The device is styled after the site's `/codex` terminal: black surfaces, a white frame, green
 * headings, monospaced body text. The colours below are the ones that *ship* on the site, read off
 * `site/src/lib/styles/theme.css` — not the ones its source suggests. Two CSS bugs flatten the real
 * page and are reproduced here deliberately: `--phosphor-glow-shadow` never parses (a missing
 * semicolon on the line above it) so nothing glows, and `--bg` lives only in a stylesheet nothing
 * imports, so every surface is pure black.
 *
 * Retuning the whole device means editing this file and nothing else.
 */

/* ── Palette ─────────────────────────────────────────────────────────────────────────────────
 * RGB565, since that is what the panel takes and what every TFT_eSPI call wants. The hex beside
 * each is the CSS custom property it comes from.
 */

/** `--color-bg` #000000 — the background of every screen, and of every window fill. */
#define THEME_BG 0x0000
/** `--color-main` #FFFFFF — primary text, and the frame around the panel. */
#define THEME_TEXT 0xFFFF
/** `--color-accent` #00CC00 — headings, rules, the scrollbar thumb, a pressed control. */
#define THEME_ACCENT 0x0660
/** `--color-main-result` #DDDDDD — body text: the content a player is actually reading. */
#define THEME_BODY 0xDEFB
/** `--color-main-dim` #AAAAAA — meta and status text, and an inert control. */
#define THEME_DIM 0xAD55
/** `--border-color-dim` #555555 — hairline separators between blocks. */
#define THEME_HAIRLINE 0x52AA
/** `.btn`'s idle border, `--color-accent` at 30% over black ≈ #003D00. */
#define THEME_OUTLINE 0x01E0
/** The unfilled part of a progress bar, #1A1A1A. */
#define THEME_TRACK 0x18C3
/** `--color-warning` #CC4444. */
#define THEME_WARNING 0xCA28
/** `--color-error` #CC0000. */
#define THEME_ERROR 0xC800

/* ── Type roles ──────────────────────────────────────────────────────────────────────────────
 * Three roles, and the rule that tells them apart at a glance:
 *
 *   uppercase + accent green = a heading
 *   sentence case + #DDDDDD  = content
 *   uppercase + dim          = status
 *
 * The `FreeMono*` GFX fonts cover 0x20-0x7E only (`FreeMono9pt7b.h`: `0x20, 0x7E`), so anything
 * outside plain ASCII has to be drawn in the built-in GLCD font — see `THEME_FONT_GLYPH`.
 */

/** Titles and headings. Uppercase, accent green. */
#define THEME_FONT_TITLE (&FreeMonoBold9pt7b)
/** Body text. Monospaced, which is what lets the Implants screen wrap by division. */
#define THEME_FONT_BODY (&FreeMono9pt7b)
/** Meta and status lines: TFT_eSPI's built-in 16px font, number 2. */
#define THEME_FONT_META 2
/**
 * The built-in GLCD font, number 1 — the only font on the device that reaches CP437.
 *
 * Fonts 2 and 3-8 hard-reject anything outside 32-127 (`TFT_eSPI.cpp:5094`, `:5111`) and the GFX
 * fonts stop at 0x7E, so the header's indicator glyphs (house, bullet, shade blocks) can only come
 * from here. `uiSetup()` turns UTF-8 decoding off and CP437 correction on for exactly this.
 */
#define THEME_FONT_GLYPH 1

/** Every `FreeMono*` glyph advances this far at size 1 — the fonts are monospaced. */
#define THEME_BODY_CHAR_W 11
/** Row pitch for body text: `FreeMono9pt7b`'s own `yAdvance`. */
#define THEME_ROW_PITCH 18
/** Height of a `FreeMono9pt7b` glyph box (ascent 11 + descent 4), for centring a line in a row. */
#define THEME_BODY_BOX_H 15
/** Height of a `FreeMonoBold9pt7b` glyph box (ascent 12 + descent 5). */
#define THEME_TITLE_BOX_H 17
/** A GLCD glyph is 5x7 on a 6px advance; the header draws it at size 2. */
#define THEME_GLYPH_ADVANCE 6
#define THEME_GLYPH_BOX_H 8

/* ── Panel layout, 320x240 landscape ─────────────────────────────────────────────────────────
 *
 *   y=0    +----------------------------------------------------------+  3px #FFFFFF border
 *   y=3    | [home]  RIVET KANE              ((.))    [#]   12:04     |  header, 28px
 *   y=31   +----------------------------------------------------------+  3px #FFFFFF rule
 *   y=34   |  EXPERTISE                                               |  screen heading, 20px
 *   y=54   |                                                         #|  content viewport
 *          |  ##  Combat                       ########......        #|  6px green scrollbar
 *   y=237  +----------------------------------------------------------+  3px #FFFFFF border
 */

#define THEME_PANEL_W 320
#define THEME_PANEL_H 240
#define THEME_BORDER 3

#define THEME_HEADER_Y THEME_BORDER
#define THEME_HEADER_H 28
/** The rule closing the header off from the content below it. */
#define THEME_RULE_Y (THEME_HEADER_Y + THEME_HEADER_H)
#define THEME_RULE_H 3

#define THEME_HEADING_Y (THEME_RULE_Y + THEME_RULE_H)
#define THEME_HEADING_H 20

/** The content rect on a screen that carries a header. */
#define THEME_CONTENT_X THEME_BORDER
#define THEME_CONTENT_Y (THEME_HEADING_Y + THEME_HEADING_H)
#define THEME_CONTENT_W (THEME_PANEL_W - 2 * THEME_BORDER)
#define THEME_CONTENT_H (THEME_PANEL_H - THEME_BORDER - THEME_CONTENT_Y)

/** The content rect on a full-bleed screen — everything inside the frame. */
#define THEME_FULL_X THEME_BORDER
#define THEME_FULL_Y THEME_BORDER
#define THEME_FULL_W (THEME_PANEL_W - 2 * THEME_BORDER)
#define THEME_FULL_H (THEME_PANEL_H - 2 * THEME_BORDER)

/** Air between the frame and the text inside it. */
#define THEME_PAD 8

/** Width of a `ListView`'s scrollbar gutter, taken off the right of its viewport. */
#define THEME_SCROLLBAR_W 6

/* ── Header cell budget ──────────────────────────────────────────────────────────────────────
 * Every cell is a fixed box drawn from its own left edge, and each indicator is a fixed-width
 * string, so a state change repaints one cell and never reflows the row.
 */

#define THEME_HOME_X 6
#define THEME_HOME_W 26
#define THEME_NAME_X 40
#define THEME_NAME_W 103
#define THEME_WIFI_X 149
#define THEME_WIFI_W 60
#define THEME_BATTERY_X 215
#define THEME_BATTERY_W 36
#define THEME_CLOCK_X 257
#define THEME_CLOCK_W 60

#endif
