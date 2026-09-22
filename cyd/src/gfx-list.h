#ifndef GFX_LIST
#define GFX_LIST

#include <Arduino.h>
#include <touch.h>

/**
 * A scrolling viewport — the only non-trivial widget on the device, shared by Expertise and
 * Implants.
 *
 * The list owns no data. It knows how many rows there are and how tall each one is, and asks the
 * screen to paint the ones that are visible; everything else — the JSON behind them, the icons,
 * the colours — belongs to the screen. That is what lets two screens with nothing in common share
 * one scroller.
 *
 * Rows are drawn in **viewport coordinates**: `drawRow()` gets `0` as its left edge and may draw up
 * to `w - THEME_SCROLLBAR_W` across, and TFT_eSPI's own viewport clips whatever spills off the top
 * or bottom. A row half off the edge is therefore drawn in full and cut by the hardware, rather
 * than needing every row painter to handle partial drawing.
 */
struct ListView {
    /** The viewport, in panel coordinates. The scrollbar lives inside its right edge. */
    int16_t x;
    int16_t y;
    int16_t w;
    int16_t h;
    /** How far the content is scrolled up, in pixels. Clamped to the content height. */
    int16_t scroll;
    int16_t rowCount;
    /** Height of row `index`, including whatever leading it carries. */
    int16_t (*rowHeight)(int index);
    /** Paint row `index` at `y` in viewport coordinates, `h` tall. */
    void (*drawRow)(int index, int16_t y, int16_t h);
};

/** Total height of every row, which is what `scroll` is clamped against. */
int16_t listContentHeight(const ListView& list);

/** Repaint the viewport and its scrollbar. Rows outside the viewport are never asked for. */
void listDraw(const ListView& list);

/**
 * Offer one touch event to the list.
 *
 * Returns true when the list consumed it. `outRedraw` is set when `scroll` moved and the caller
 * must repaint; `outTappedRow` is the row a tap landed on, or -1.
 *
 * The caller repaints rather than the list doing it, because a repaint may need the SD card —
 * Expertise reads an icon per row — and the bus hold belongs to whoever knows that.
 */
bool listHandleTouch(ListView& list, const TouchEvent& event, bool& outRedraw, int& outTappedRow);

#endif
