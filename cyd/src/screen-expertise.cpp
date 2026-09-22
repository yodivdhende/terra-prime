#include <screens.h>
#include <ArduinoJson.h>
#include <async-fetch.h>
#include <cache.h>
#include <character.h>
#include <gfx-draw.h>
#include <gfx-icon.h>
#include <gfx-list.h>
#include <gfx-theme.h>
#include <globals.h>
#include <sd-reader.h>

/**
 * The Expertise screen: a bar per expertise the character has, under a bar for the group it
 * belongs to.
 *
 * **Nothing here draws a number.** A player reads their standing off the length of a bar and
 * nothing else, so the bars are the only quantitative thing on the screen and every one of them
 * shares a scale. Group and member rows differ in font, bar thickness and indent — and deliberately
 * **not** in the bar's x or width, because a group bar that started somewhere else would be on a
 * different scale from the members it summarises. See "Expertise is bars, never numbers" in
 * `cyd/CLAUDE.md`.
 *
 * The JSON is parsed once, into the fixed row table below, and the `ListView` paints from that.
 * Keeping a `JsonDocument` alive across a drag would cost far more than the table does, and
 * re-parsing per frame is not worth thinking about.
 *
 * Every visit paints from the SD cache first (`cacheRead()`, no network wait) and then starts a
 * background fetch; `uiExpertiseApplyFetch()` redraws when that lands, but only if the body
 * actually changed and only if this is still the screen showing.
 */

/** Expertise values share the 0-100 scale the site's point-cost table is defined over. */
#define EXPERTISE_MAX 100

/** Rows the table holds. A character with more than this many expertise loses the tail. */
#define EXPERTISE_MAX_ROWS 80
#define EXPERTISE_NAME_MAX 28

/* Row geometry, in the list's viewport coordinates. */
#define EXPERTISE_VIEW_W (THEME_CONTENT_W - THEME_SCROLLBAR_W)
/** Shared by group and member rows, and the reason both can be compared at a glance. */
#define EXPERTISE_BAR_W 110
#define EXPERTISE_BAR_X (EXPERTISE_VIEW_W - EXPERTISE_BAR_W - 4)

/** Air above a group row, so each group reads as a block rather than the list running together. */
#define EXPERTISE_GROUP_LEAD 8
#define EXPERTISE_GROUP_BODY 32
#define EXPERTISE_GROUP_H (EXPERTISE_GROUP_LEAD + EXPERTISE_GROUP_BODY)
#define EXPERTISE_MEMBER_H 28

#define EXPERTISE_GROUP_ICON_X 2
#define EXPERTISE_MEMBER_ICON_X 16
#define EXPERTISE_GROUP_NAME_X 32
#define EXPERTISE_MEMBER_NAME_X 46

#define EXPERTISE_GROUP_BAR_H 10
#define EXPERTISE_MEMBER_BAR_H 6

struct ExpertiseRow {
    char name[EXPERTISE_NAME_MAX];
    uint16_t colour;
    int16_t iconId;
    uint8_t value;
    bool isGroup;
};

static ExpertiseRow rows[EXPERTISE_MAX_ROWS];
static int16_t rowCount = 0;

/** Shown instead of the list when there is nothing to draw. "" means there is. */
static char statusMessage[48] = "";

/** What is currently on screen, so a same-content refresh can skip the redraw. "" means nothing is. */
static String lastRenderedBody = "";

static ListView list;

/** `#rrggbb` from the API, folded to RGB565. Falls back to the accent when the group has no colour. */
static uint16_t parseColour(const char* hex)
{
    if (hex == NULL || strlen(hex) != 7 || hex[0] != '#') return THEME_ACCENT;
    char* end = NULL;
    const long value = strtol(hex + 1, &end, 16);
    if (end == NULL || *end != '\0') return THEME_ACCENT;

    const uint8_t red = (uint8_t)((value >> 16) & 0xFF);
    const uint8_t green = (uint8_t)((value >> 8) & 0xFF);
    const uint8_t blue = (uint8_t)(value & 0xFF);
    return (uint16_t)(((red & 0xF8) << 8) | ((green & 0xFC) << 3) | (blue >> 3));
}

static void addRow(bool isGroup, int iconId, const char* name, int value, uint16_t colour)
{
    if (rowCount >= EXPERTISE_MAX_ROWS) return;
    ExpertiseRow& row = rows[rowCount++];
    snprintf(row.name, sizeof(row.name), "%s", name == NULL ? "?" : name);
    row.colour = colour;
    row.iconId = (int16_t)iconId;
    if (value < 0) value = 0;
    if (value > EXPERTISE_MAX) value = EXPERTISE_MAX;
    row.value = (uint8_t)value;
    row.isGroup = isGroup;
}

static int16_t expertiseRowHeight(int index)
{
    if (index < 0 || index >= rowCount) return 0;
    return rows[index].isGroup ? EXPERTISE_GROUP_H : EXPERTISE_MEMBER_H;
}

static void expertiseDrawRow(int index, int16_t y, int16_t height)
{
    if (index < 0 || index >= rowCount) return;
    const ExpertiseRow& row = rows[index];

    char path[48];
    if (row.isGroup) {
        // A hairline over every group but the first, which is what turns the list into blocks.
        if (index > 0) tft.drawFastHLine(0, y + 3, EXPERTISE_VIEW_W, THEME_HAIRLINE);

        const int16_t top = y + EXPERTISE_GROUP_LEAD;
        snprintf(path, sizeof(path), "/sd/icons/expertise-groups/%d.bin", row.iconId);
        drawIconA8(path, EXPERTISE_GROUP_ICON_X, top + 4, row.colour, THEME_BG);

        gfxUseTitleFont();
        drawTextClipped(EXPERTISE_GROUP_NAME_X, top + (EXPERTISE_GROUP_BODY - THEME_TITLE_BOX_H) / 2,
                        EXPERTISE_BAR_X - EXPERTISE_GROUP_NAME_X - THEME_PAD, row.name, THEME_ACCENT);

        drawBar(EXPERTISE_BAR_X, top + (EXPERTISE_GROUP_BODY - EXPERTISE_GROUP_BAR_H) / 2,
                EXPERTISE_BAR_W, EXPERTISE_GROUP_BAR_H, row.value, EXPERTISE_MAX, row.colour);
        return;
    }

    snprintf(path, sizeof(path), "/sd/icons/expertise/%d.bin", row.iconId);
    drawIconA8(path, EXPERTISE_MEMBER_ICON_X, y + (height - GFX_ICON_SIZE) / 2, row.colour, THEME_BG);

    gfxUseBodyFont();
    drawTextClipped(EXPERTISE_MEMBER_NAME_X, y + (height - THEME_BODY_BOX_H) / 2,
                    EXPERTISE_BAR_X - EXPERTISE_MEMBER_NAME_X - THEME_PAD, row.name, THEME_BODY);

    drawBar(EXPERTISE_BAR_X, y + (height - EXPERTISE_MEMBER_BAR_H) / 2,
            EXPERTISE_BAR_W, EXPERTISE_MEMBER_BAR_H, row.value, EXPERTISE_MAX, row.colour);
}

/** Parses `body` into the row table. Sets `statusMessage` instead when there is nothing to show. */
static void buildRows(const String& body)
{
    rowCount = 0;
    statusMessage[0] = '\0';
    list.scroll = 0;

    JsonDocument document;
    const DeserializationError error = deserializeJson(document, body);
    if (error) {
        Serial.print("expertise: JSON error ");
        Serial.println(error.c_str());
        snprintf(statusMessage, sizeof(statusMessage), "Could not read your expertise.");
        return;
    }

    JsonArray expertise = document["expertise"].as<JsonArray>();
    if (expertise.isNull() || expertise.size() == 0) {
        Serial.println("expertise: no expertise on record");
        snprintf(statusMessage, sizeof(statusMessage), "No expertise on record.");
        return;
    }

    // Rows arrive grouped, so each group is one contiguous run. Walking runs rather than single
    // entries is what makes the group's own row possible: its value is not in the response, and it
    // has to be drawn before the members it summarises.
    for (size_t start = 0; start < expertise.size();) {
        JsonObject first = expertise[start];
        const int groupId = first["group"] | 0;
        const uint16_t colour = parseColour(first["groupColor"]);

        size_t end = start;
        int total = 0;
        while (end < expertise.size() && (expertise[end]["group"] | 0) == groupId) {
            total += expertise[end]["value"] | 0;
            end++;
        }
        const size_t count = end - start;

        // The group's standing is the mean of what the character actually holds in it, rounded, on
        // the same 0-EXPERTISE_MAX scale as its members. Computed here because it is a way of
        // drawing the numbers the device already has, not a number the game defines.
        const int average = (total + (int)count / 2) / (int)count;
        addRow(true, groupId, first["groupName"] | "?", average, colour);
        for (size_t i = start; i < end; i++) {
            JsonObject entry = expertise[i];
            addRow(false, entry["id"] | 0, entry["name"] | "?", entry["value"] | 0, colour);
        }
        start = end;
    }

    list.rowCount = rowCount;
    Serial.print("expertise: parsed ");
    Serial.print(rowCount);
    Serial.println(" rows");
}

/**
 * Repaint the list, holding the SD bus for the whole pass.
 *
 * One hold around the repaint rather than one per icon: touch is never read mid-repaint, so a
 * single hold is both correct and the cheap option — each `reattachSd()`/`reattachTouch()` pair
 * tears down and re-begins a VSPI peripheral.
 */
static void repaintList()
{
    list.rowCount = rowCount;
    const SdBusHold busHold;
    listDraw(list);
}

static void expertiseDraw()
{
    if (rowCount == 0) {
        clearBand(THEME_CONTENT_Y, THEME_CONTENT_H);
        gfxUseBodyFont();
        drawTextClipped(THEME_CONTENT_X + THEME_PAD, THEME_CONTENT_Y + THEME_PAD,
                        THEME_CONTENT_W - 2 * THEME_PAD, statusMessage, THEME_DIM);
        return;
    }
    repaintList();
}

static void expertiseEnter()
{
    list.x = THEME_CONTENT_X;
    list.y = THEME_CONTENT_Y;
    list.w = THEME_CONTENT_W;
    list.h = THEME_CONTENT_H;
    list.scroll = 0;
    list.rowHeight = expertiseRowHeight;
    list.drawRow = expertiseDrawRow;

    // The version this device believes it is: a stored body for any other character is not used.
    lastRenderedBody = cacheRead("my/expertise", currentCharacter.versionId);
    if (lastRenderedBody != "") {
        Serial.println("expertise: painting from the SD cache");
        buildRows(lastRenderedBody);
    } else {
        rowCount = 0;
        list.rowCount = 0;
        snprintf(statusMessage, sizeof(statusMessage), "Loading...");
    }

    Serial.println("expertise: fetching my/expertise in the background");
    asyncFetchStart("my/expertise");
}

static bool expertiseTouch(const TouchEvent& event)
{
    if (rowCount == 0) return false;

    bool redraw = false;
    int tapped = -1;
    const bool consumed = listHandleTouch(list, event, redraw, tapped);
    if (redraw) repaintList();
    return consumed;
}

void uiExpertiseApplyFetch(const String& body)
{
    if (body == "") {
        Serial.println("expertise: background fetch failed");
        // Something is already on screen (from the cache, or an earlier fetch this visit) — the
        // offline fallback is exactly that, so leave it. Only say so if there is truly nothing.
        if (lastRenderedBody != "") return;
        if (screenCurrent() != screenExpertise()) return;
        rowCount = 0;
        list.rowCount = 0;
        snprintf(statusMessage, sizeof(statusMessage), "No connection, and nothing stored yet.");
        expertiseDraw();
        return;
    }

    if (body == lastRenderedBody) return;   // fresh data matches what is already shown
    Serial.println("expertise: background fetch landed, redrawing");
    lastRenderedBody = body;

    if (screenCurrent() != screenExpertise()) return;   // player moved on; next visit paints this
    buildRows(body);
    expertiseDraw();
}

const Screen* screenExpertise()
{
    static const Screen screen = {
        "Expertise", true, expertiseEnter, expertiseDraw, NULL, expertiseTouch
    };
    return &screen;
}
