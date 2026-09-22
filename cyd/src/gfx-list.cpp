#include <gfx-list.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * See `gfx-list.h`.
 *
 * A repaint costs about 12ms for the 314x183 viewport — a third of a full-panel repaint, which is
 * why scrolling never touches the frame or the header. The header in particular must not flicker
 * while a list moves under it.
 */

/** How far a finger may travel and still count as a tap rather than the start of a drag. */
#define LIST_TAP_SLOP 6

/** Shortest the scrollbar thumb is allowed to get, so a long list still shows where it is. */
#define LIST_THUMB_MIN 12

/**
 * Drag state. One finger means one drag, so this does not need to live on the view — but it does
 * name the view it belongs to, so a gesture that starts on one screen's list can never be finished
 * against another's after a navigation.
 */
static const ListView* draggingList = NULL;
static bool dragged = false;
static int16_t dragStartY = 0;
static int16_t dragStartScroll = 0;

static int16_t clampScroll(const ListView& list, int32_t scroll)
{
    const int32_t maximum = listContentHeight(list) - list.h;
    if (maximum <= 0) return 0;
    if (scroll < 0) return 0;
    if (scroll > maximum) return (int16_t)maximum;
    return (int16_t)scroll;
}

int16_t listContentHeight(const ListView& list)
{
    if (list.rowHeight == NULL) return 0;
    int32_t total = 0;
    for (int index = 0; index < list.rowCount; index++) total += list.rowHeight(index);
    return (int16_t)total;
}

/** The 6px accent thumb in the gutter at the right of the viewport. */
static void listDrawScrollbar(const ListView& list)
{
    const int16_t gutterX = list.x + list.w - THEME_SCROLLBAR_W;
    const int16_t content = listContentHeight(list);

    // Nothing to scroll: an empty gutter, rather than a thumb filling it and implying there is more
    // below.
    if (content <= list.h) {
        tft.fillRect(gutterX, list.y, THEME_SCROLLBAR_W, list.h, THEME_BG);
        return;
    }

    int16_t thumb = (int16_t)(((int32_t)list.h * list.h) / content);
    if (thumb < LIST_THUMB_MIN) thumb = LIST_THUMB_MIN;

    const int32_t travel = list.h - thumb;
    const int32_t scrollable = content - list.h;
    const int16_t top = list.y + (int16_t)((travel * list.scroll) / scrollable);

    tft.fillRect(gutterX, list.y, THEME_SCROLLBAR_W, list.h, THEME_TRACK);
    tft.fillRect(gutterX, top, THEME_SCROLLBAR_W, thumb, THEME_ACCENT);
}

void listDraw(const ListView& list)
{
    if (list.rowHeight == NULL || list.drawRow == NULL) return;

    const int16_t viewportW = list.w - THEME_SCROLLBAR_W;

    // The viewport is what clips a row that is only half on screen, so `drawRow()` can draw every
    // visible row in full and let the hardware cut the two at the edges.
    tft.setViewport(list.x, list.y, viewportW, list.h);
    tft.fillRect(0, 0, viewportW, list.h, THEME_BG);

    int16_t top = 0;
    for (int index = 0; index < list.rowCount; index++) {
        const int16_t height = list.rowHeight(index);
        const int16_t y = top - list.scroll;
        if (y >= list.h) break;            // this row and every row after it is below the fold
        if (y + height > 0) list.drawRow(index, y, height);
        top += height;
    }

    tft.resetViewport();
    listDrawScrollbar(list);
}

bool listHandleTouch(ListView& list, const TouchEvent& event, bool& outRedraw, int& outTappedRow)
{
    outRedraw = false;
    outTappedRow = -1;

    const Rect bounds = {list.x, list.y, list.w, list.h};

    switch (event.kind) {
        case TOUCH_DOWN:
            if (rectContains(bounds, event.x, event.y) == false) return false;
            draggingList = &list;
            dragged = false;
            dragStartY = event.y;
            dragStartScroll = list.scroll;
            return true;

        case TOUCH_MOVE: {
            if (draggingList != &list) return false;
            if (abs(event.y - dragStartY) > LIST_TAP_SLOP) dragged = true;
            // Content follows the finger: dragging up scrolls down.
            const int16_t scroll = clampScroll(list, (int32_t)dragStartScroll + (dragStartY - event.y));
            if (scroll != list.scroll) {
                list.scroll = scroll;
                outRedraw = true;
            }
            return true;
        }

        case TOUCH_UP: {
            if (draggingList != &list) return false;
            draggingList = NULL;
            if (dragged) return true;   // it was a scroll, not a tap

            if (list.rowHeight == NULL) return true;
            int32_t offset = (int32_t)(event.y - list.y) + list.scroll;
            for (int index = 0; index < list.rowCount; index++) {
                const int16_t height = list.rowHeight(index);
                if (offset < height) {
                    outTappedRow = index;
                    return true;
                }
                offset -= height;
            }
            return true;
        }
    }
    return false;
}
