#include <Arduino.h>
#include <ArduinoJson.h>
#include <lvgl.h>
#include <ui/ui.h>
#include <api.h>
#include <character.h>
#include <ui-expertise.h>

/**
 * The Expertise screen: a bar per expertise the character has, filled from
 * `Character_Version_Expertise.Value`, under a bar for the group it belongs to.
 *
 * Nothing here draws a number. Expertise is read off the length of a bar and nothing else, so the
 * bars are the only quantitative thing on the screen and every one of them shares a scale.
 *
 * `src/ui/` is generated from the SquareLine project, so nothing here edits it — the screen arrives
 * with a header and a title, and this file hangs a list under them and refills it on every
 * `LV_EVENT_SCREEN_LOADED`. Refilling rather than fetching once means a value an admin changes
 * mid-event shows up the next time the player opens the screen, and that every visit refreshes the
 * copy on the SD card that `api.cpp` falls back to when the network is gone.
 *
 * The server sends this device no icons: they are SVG documents, which LVGL cannot draw and the
 * ESP32 cannot afford to parse. Icons come off the SD card instead, pre-rasterized by the site's
 * icon-pack export (`manage/expertise`), keyed on expertise or group id. Bars and icons are tinted
 * with the group's colour, and rows arrive grouped, so each group is one contiguous run that gets
 * its own row before the members it summarises.
 */

/** Expertise values share the 0-100 scale the site's point-cost table is defined over. */
#define EXPERTISE_MAX 100

/** Matches `ICON_SIZE` in the site's `icon-export.ts`: the pack is rasterized at exactly this. */
#define ICON_SIZE 24

static lv_obj_t * expertiseList = NULL;

/** `#rrggbb` from the API, or the theme's default when the group has no colour set. */
static lv_color_t parseColor(const char * hex, lv_color_t fallback)
{
    if (hex == NULL || strlen(hex) != 7 || hex[0] != '#') return fallback;
    char * end = NULL;
    const long value = strtol(hex + 1, &end, 16);
    if (end == NULL || *end != '\0') return fallback;
    return lv_color_hex((uint32_t)value);
}

/**
 * An icon off the SD card, from `directory` and keyed on `id`.
 *
 * `A:` is LVGL's stdio driver, rooted at `/sd/` (`LV_FS_STDIO_PATH`), so this resolves to
 * `/sd/icons/<directory>/<id>.bin` — an `LV_COLOR_FORMAT_A8` image written by the site's icon-pack
 * export. A8 is a bare alpha mask, which LVGL tints with the widget's `image_recolor`, so the group
 * colour comes from the API at draw time and is not baked into the file.
 *
 * A missing file is not an error: LVGL draws nothing and the slot still holds the row's indent, so
 * a card with a partial pack, or none at all, lines up with one that has every icon.
 */
static void addIcon(lv_obj_t * row, const char * directory, int id, lv_color_t color)
{
    lv_obj_t * icon = lv_image_create(row);
    lv_obj_set_size(icon, ICON_SIZE, ICON_SIZE);

    char path[64];
    lv_snprintf(path, sizeof(path), "A:icons/%s/%d.bin", directory, id);
    lv_image_set_src(icon, path);

    lv_obj_set_style_image_recolor(icon, color, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_image_recolor_opa(icon, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
}

/**
 * One row: an icon, a name, and a bar. Used for both a group and the expertise under it.
 *
 * No row carries a number. A player reads their standing off the bar's length and nothing else,
 * which is the whole point of drawing expertise this way.
 *
 * Group and member rows differ in font, bar thickness and row height — never in the bar's geometry.
 * Every bar spans the same width over the same 0-`EXPERTISE_MAX` range, so lengths stay comparable
 * between a group and its members and between one group and the next. Hierarchy is carried by
 * weight, not by indenting a bar into a different scale.
 */
static void addRow(
    const char * iconDirectory,
    int iconId,
    const char * name,
    int value,
    lv_color_t color,
    const lv_font_t * font,
    int rowHeight,
    int barHeight,
    int marginTop
)
{
    lv_obj_t * row = lv_obj_create(expertiseList);
    lv_obj_remove_style_all(row);
    lv_obj_set_width(row, lv_pct(100));
    lv_obj_set_height(row, rowHeight);
    lv_obj_remove_flag(row, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_flex_flow(row, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(row, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    lv_obj_set_style_pad_column(row, 6, LV_PART_MAIN | LV_STATE_DEFAULT);
    // Air above a group row, so each group reads as a block rather than the list running together.
    // The parent's pad_row is uniform, so the gap has to come from the row's own margin.
    lv_obj_set_style_margin_top(row, marginTop, LV_PART_MAIN | LV_STATE_DEFAULT);

    addIcon(row, iconDirectory, iconId, color);

    // Everything but the icon shares the rest of the row, so no width does arithmetic on 320.
    lv_obj_t * body = lv_obj_create(row);
    lv_obj_remove_style_all(body);
    lv_obj_set_height(body, lv_pct(100));
    lv_obj_set_flex_grow(body, 1);
    lv_obj_remove_flag(body, LV_OBJ_FLAG_SCROLLABLE);

    lv_obj_t * nameLabel = lv_label_create(body);
    lv_obj_set_width(nameLabel, lv_pct(100));
    lv_label_set_long_mode(nameLabel, LV_LABEL_LONG_DOT);
    lv_label_set_text(nameLabel, name);
    lv_obj_set_style_text_font(nameLabel, font, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_align(nameLabel, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t * bar = lv_bar_create(body);
    lv_obj_set_size(bar, lv_pct(100), barHeight);
    lv_obj_align(bar, LV_ALIGN_BOTTOM_LEFT, 0, 0);
    lv_bar_set_range(bar, 0, EXPERTISE_MAX);
    lv_bar_set_value(bar, value, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar, color, LV_PART_INDICATOR | LV_STATE_DEFAULT);
}

/** The group's own row: its icon, its name, and how the character stands in it overall. */
static void addGroupRow(int groupId, const char * name, int value, lv_color_t color)
{
    addRow("expertise-groups", groupId, name, value, color, LV_FONT_DEFAULT, 34, 10, 8);
}

static void addExpertiseRow(int expertiseId, const char * name, int value, lv_color_t color)
{
    addRow("expertise", expertiseId, name, value, color, &lv_font_montserrat_12, 30, 6, 0);
}

static void addMessage(const char * text)
{
    lv_obj_t * label = lv_label_create(expertiseList);
    lv_obj_set_width(label, lv_pct(100));
    lv_label_set_long_mode(label, LV_LABEL_LONG_WRAP);
    lv_label_set_text(label, text);
    lv_obj_set_style_text_font(label, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
}

static void fillExpertise(lv_event_t * e)
{
    LV_UNUSED(e);
    lv_obj_clean(expertiseList);

    // The version this device believes it is: a stored body for any other character is not used.
    const ApiResult result = apiGet("my/expertise", currentCharacter.versionId);
    if (result.body == "") {
        addMessage("No connection, and nothing stored yet.");
        return;
    }

    JsonDocument document;
    const DeserializationError error = deserializeJson(document, result.body);
    if (error) {
        Serial.print("expertise: JSON error ");
        Serial.println(error.c_str());
        addMessage("Could not read your expertise.");
        return;
    }

    JsonArray expertise = document["expertise"].as<JsonArray>();
    if (expertise.isNull() || expertise.size() == 0) {
        addMessage("No expertise on record.");
        return;
    }

    const lv_color_t fallback = lv_palette_main(LV_PALETTE_BLUE);

    // Rows arrive grouped, so each group is one contiguous run. Walking runs rather than single
    // entries is what makes the group's own row possible: its value is not in the response, and it
    // has to be drawn before the members it summarises.
    for (size_t start = 0; start < expertise.size();) {
        JsonObject first = expertise[start];
        const int groupId = first["group"] | 0;
        const lv_color_t color = parseColor(first["groupColor"], fallback);

        size_t end = start;
        int total = 0;
        while (end < expertise.size() && (expertise[end]["group"] | 0) == groupId) {
            total += expertise[end]["value"] | 0;
            end++;
        }
        const size_t count = end - start;

        // The group's standing is the mean of what the character actually holds in it, rounded.
        // Same 0-EXPERTISE_MAX scale as the members, so the group bar sits among them rather than
        // on a scale of its own.
        const int average = (total + (int)count / 2) / (int)count;
        addGroupRow(groupId, first["groupName"] | "?", average, color);
        for (size_t i = start; i < end; i++) {
            JsonObject entry = expertise[i];
            addExpertiseRow(entry["id"] | 0, entry["name"] | "?", entry["value"] | 0, color);
        }
        start = end;
    }
}

void uiExpertiseInit()
{
    // The generated title sits in the middle of the screen; the list needs that room.
    lv_obj_set_align(ui_ExpertiseTitle, LV_ALIGN_TOP_MID);
    lv_obj_set_x(ui_ExpertiseTitle, 0);
    lv_obj_set_y(ui_ExpertiseTitle, 30);

    expertiseList = lv_obj_create(ui_Expertise);
    lv_obj_set_size(expertiseList, 320, 186);
    lv_obj_align(expertiseList, LV_ALIGN_TOP_MID, 0, 52);
    lv_obj_set_flex_flow(expertiseList, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_style_bg_opa(expertiseList, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(expertiseList, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_all(expertiseList, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_row(expertiseList, 4, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_obj_add_event_cb(ui_Expertise, fillExpertise, LV_EVENT_SCREEN_LOADED, NULL);
}
