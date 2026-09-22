#include <screens.h>
#include <ArduinoJson.h>
#include <async-fetch.h>
#include <cache.h>
#include <character.h>
#include <gfx-draw.h>
#include <gfx-list.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * The Implants screen: every implant the character carries, each with its description.
 *
 * Same shape as `screen-expertise.cpp` — one `ListView` over a table parsed once — but the rows are
 * variable height, because a description wraps to as many lines as it needs. Rows arrive sorted by
 * slot, so the list reads in the order the implants sit in the body.
 *
 * **Monospace makes the wrap a division rather than a measurement loop.** Every `FreeMono9pt7b`
 * glyph advances exactly 11px, so how many characters fit on a line is arithmetic, and the same
 * `nextWrappedLine()` both counts a row's lines at parse time and produces them at draw time —
 * which is what keeps `implantsRowHeight()` and `implantsDrawRow()` from ever disagreeing.
 *
 * No SD card is touched here: implants have no icons. The list repaints without a bus hold.
 */

#define IMPLANT_MAX 24
/** One wrapped line, plus room for the terminator. Sized past the widest column count below. */
#define IMPLANT_LINE_MAX 48

/** The list's drawable width, once the scrollbar gutter is taken off. */
#define IMPLANT_VIEW_W (THEME_CONTENT_W - THEME_SCROLLBAR_W)
/** Air left of a description, above each implant's name, and under its last line. */
#define IMPLANT_INDENT 8
#define IMPLANT_LEAD 8
#define IMPLANT_TRAILING 6
/** Characters that fit on a description line. */
#define IMPLANT_COLUMNS ((IMPLANT_VIEW_W - 2 * IMPLANT_INDENT) / THEME_BODY_CHAR_W)

static String implantNames[IMPLANT_MAX];
static String implantDescriptions[IMPLANT_MAX];
/** Wrapped line count per implant, computed once so `rowHeight()` stays a lookup. */
static int16_t implantLines[IMPLANT_MAX];
static int16_t implantCount = 0;

/** Shown instead of the list when there is nothing to draw. "" means there is. */
static char statusMessage[48] = "";

/** What is currently on screen, so a same-content refresh can skip the redraw. */
static String lastRenderedBody = "";

static ListView list;

/**
 * Copy the next wrapped line of `text` into `out` and return the index to continue from.
 *
 * Breaks on the last space that fits, or hard-breaks mid-word when a word is longer than the
 * column count. Returns `length` once there is nothing left, so a caller loops while the index is
 * below it.
 */
static int nextWrappedLine(const char* text, int length, int from, int columns, char* out,
                           size_t outSize)
{
    if (columns < 1) columns = 1;
    while (from < length && text[from] == ' ') from++;
    if (from >= length) {
        out[0] = '\0';
        return length;
    }

    int end = from + columns;
    if (end >= length) {
        end = length;
    } else {
        // The last space at or before the column boundary. Breaking *at* the boundary is allowed:
        // the space itself is dropped by the skip at the top of the next call.
        int space = -1;
        for (int i = from; i <= from + columns && i < length; i++) {
            if (text[i] == ' ') space = i;
        }
        if (space > from) end = space;
    }

    int count = end - from;
    if (count > (int)outSize - 1) count = (int)outSize - 1;
    memcpy(out, text + from, count);
    out[count] = '\0';
    return end;
}

static int16_t countWrappedLines(const String& text)
{
    char line[IMPLANT_LINE_MAX];
    const int length = (int)text.length();
    const char* raw = text.c_str();
    int from = 0;
    int16_t lines = 0;
    while (from < length) {
        from = nextWrappedLine(raw, length, from, IMPLANT_COLUMNS, line, sizeof(line));
        if (line[0] != '\0') lines++;
    }
    return lines;
}

static int16_t implantsRowHeight(int index)
{
    if (index < 0 || index >= implantCount) return 0;
    // Air above the name, then one slot for the name and one per wrapped description line, then
    // air before the next implant. `implantsDrawRow()` lays the slots out by the same arithmetic.
    return (int16_t)(IMPLANT_LEAD + THEME_ROW_PITCH * (1 + implantLines[index]) + IMPLANT_TRAILING);
}

static void implantsDrawRow(int index, int16_t y, int16_t height)
{
    if (index < 0 || index >= implantCount) return;
    // The row's height is entirely a function of its wrapped line count, so it is re-derived here
    // rather than read back from the list.
    (void)height;

    // A hairline over every implant but the first, in the lead above its name.
    if (index > 0) tft.drawFastHLine(0, y + 3, IMPLANT_VIEW_W, THEME_HAIRLINE);

    const int16_t top = y + IMPLANT_LEAD;

    char upper[IMPLANT_LINE_MAX];
    gfxUpperCopy(upper, sizeof(upper), implantNames[index].c_str());
    gfxUseTitleFont();
    drawTextClipped(0, top + (THEME_ROW_PITCH - THEME_TITLE_BOX_H) / 2, IMPLANT_VIEW_W, upper,
                    THEME_ACCENT);

    gfxUseBodyFont();
    char line[IMPLANT_LINE_MAX];
    const String& description = implantDescriptions[index];
    const int length = (int)description.length();
    const char* raw = description.c_str();
    int from = 0;
    int16_t slot = 1;
    while (from < length) {
        from = nextWrappedLine(raw, length, from, IMPLANT_COLUMNS, line, sizeof(line));
        if (line[0] == '\0') continue;
        drawTextClipped(IMPLANT_INDENT,
                        top + slot * THEME_ROW_PITCH + (THEME_ROW_PITCH - THEME_BODY_BOX_H) / 2,
                        IMPLANT_VIEW_W - IMPLANT_INDENT, line, THEME_BODY);
        slot++;
    }
}

static void clearRows()
{
    for (int16_t i = 0; i < IMPLANT_MAX; i++) {
        implantNames[i] = "";
        implantDescriptions[i] = "";
        implantLines[i] = 0;
    }
    implantCount = 0;
    list.rowCount = 0;
}

static void buildRows(const String& body)
{
    clearRows();
    statusMessage[0] = '\0';
    list.scroll = 0;

    JsonDocument document;
    const DeserializationError error = deserializeJson(document, body);
    if (error) {
        Serial.print("implants: JSON error ");
        Serial.println(error.c_str());
        snprintf(statusMessage, sizeof(statusMessage), "Could not read your implants.");
        return;
    }

    JsonArray implants = document["implants"].as<JsonArray>();
    if (implants.isNull() || implants.size() == 0) {
        snprintf(statusMessage, sizeof(statusMessage), "No implants fitted.");
        return;
    }

    for (JsonObject entry : implants) {
        if (implantCount >= IMPLANT_MAX) break;
        implantNames[implantCount] = (const char*)(entry["name"] | "?");
        implantDescriptions[implantCount] = (const char*)(entry["description"] | "");
        implantLines[implantCount] = countWrappedLines(implantDescriptions[implantCount]);
        implantCount++;
    }
    list.rowCount = implantCount;
}

static void implantsDraw()
{
    if (implantCount == 0) {
        clearBand(THEME_CONTENT_Y, THEME_CONTENT_H);
        gfxUseBodyFont();
        drawTextClipped(THEME_CONTENT_X + THEME_PAD, THEME_CONTENT_Y + THEME_PAD,
                        THEME_CONTENT_W - 2 * THEME_PAD, statusMessage, THEME_DIM);
        return;
    }
    list.rowCount = implantCount;
    listDraw(list);
}

static void implantsEnter()
{
    list.x = THEME_CONTENT_X;
    list.y = THEME_CONTENT_Y;
    list.w = THEME_CONTENT_W;
    list.h = THEME_CONTENT_H;
    list.scroll = 0;
    list.rowHeight = implantsRowHeight;
    list.drawRow = implantsDrawRow;

    // The version this device believes it is: a stored body for any other character is not used.
    lastRenderedBody = cacheRead("my/implants", currentCharacter.versionId);
    if (lastRenderedBody != "") {
        buildRows(lastRenderedBody);
    } else {
        clearRows();
        snprintf(statusMessage, sizeof(statusMessage), "Loading...");
    }

    asyncFetchStart("my/implants");
}

static bool implantsTouch(const TouchEvent& event)
{
    if (implantCount == 0) return false;

    bool redraw = false;
    int tapped = -1;
    const bool consumed = listHandleTouch(list, event, redraw, tapped);
    if (redraw) listDraw(list);
    return consumed;
}

void uiImplantsApplyFetch(const String& body)
{
    if (body == "") {
        // Something is already on screen (from the cache, or an earlier fetch this visit) — the
        // offline fallback is exactly that, so leave it. Only say so if there is truly nothing.
        if (lastRenderedBody != "") return;
        if (screenCurrent() != screenImplants()) return;
        clearRows();
        snprintf(statusMessage, sizeof(statusMessage), "No connection, and nothing stored yet.");
        implantsDraw();
        return;
    }

    if (body == lastRenderedBody) return;   // fresh data matches what is already shown
    lastRenderedBody = body;

    if (screenCurrent() != screenImplants()) return;   // player moved on; next visit paints this
    buildRows(body);
    implantsDraw();
}

const Screen* screenImplants()
{
    static const Screen screen = {
        "Implants", true, implantsEnter, implantsDraw, NULL, implantsTouch
    };
    return &screen;
}
