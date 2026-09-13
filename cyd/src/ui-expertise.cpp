#include <Arduino.h>
#include <ArduinoJson.h>
#include <lvgl.h>
#include <ui/ui.h>
#include <api.h>
#include <character.h>
#include <ui-expertise.h>

/**
 * The Expertise screen: one progress bar per expertise the character has, filled from
 * `Character_Version_Expertise.Value`.
 *
 * `src/ui/` is generated from the SquareLine project, so nothing here edits it — the screen arrives
 * with a header and a title, and this file hangs a list under them and refills it on every
 * `LV_EVENT_SCREEN_LOADED`. Refilling rather than fetching once means a value an admin changes
 * mid-event shows up the next time the player opens the screen, and that every visit refreshes the
 * copy on the SD card that `api.cpp` falls back to when the network is gone.
 *
 * The server sends this device no icons: they are SVG documents, which LVGL cannot draw and the
 * ESP32 cannot afford to parse. Icons come off the SD card instead, pre-rasterized by the site's
 * icon-pack export (`manage/expertise`), keyed on expertise id. Bars and icons are tinted with the
 * group's colour, and rows arrive sorted by group, so each group is drawn under its own heading.
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

static void addGroupHeading(const char * name)
{
    lv_obj_t * heading = lv_label_create(expertiseList);
    lv_obj_set_width(heading, lv_pct(100));
    lv_label_set_text(heading, name);
    lv_obj_set_style_text_font(heading, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_opa(heading, 160, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_top(heading, 4, LV_PART_MAIN | LV_STATE_DEFAULT);
}

/**
 * The icon for one expertise, off the SD card.
 *
 * `A:` is LVGL's stdio driver, rooted at `/sd/` (`LV_FS_STDIO_PATH`), so this resolves to
 * `/sd/icons/expertise/<id>.bin` — an `LV_COLOR_FORMAT_A8` image written by the site's icon-pack
 * export. A8 is a bare alpha mask, which LVGL tints with the widget's `image_recolor`, so the group
 * colour comes from the API at draw time and is not baked into the file.
 *
 * A missing file is not an error: LVGL draws nothing and the slot still holds the row's indent, so
 * a card with a partial pack, or none at all, lines up with one that has every icon.
 */
static void addIcon(lv_obj_t * row, int expertiseId, lv_color_t color)
{
    lv_obj_t * icon = lv_image_create(row);
    lv_obj_set_size(icon, ICON_SIZE, ICON_SIZE);

    char path[48];
    lv_snprintf(path, sizeof(path), "A:icons/expertise/%d.bin", expertiseId);
    lv_image_set_src(icon, path);

    lv_obj_set_style_image_recolor(icon, color, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_image_recolor_opa(icon, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
}

static void addBar(int expertiseId, const char * name, int value, lv_color_t color)
{
    lv_obj_t * row = lv_obj_create(expertiseList);
    lv_obj_remove_style_all(row);
    lv_obj_set_width(row, lv_pct(100));
    lv_obj_set_height(row, 30);
    lv_obj_remove_flag(row, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_flex_flow(row, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(row, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    lv_obj_set_style_pad_column(row, 6, LV_PART_MAIN | LV_STATE_DEFAULT);

    addIcon(row, expertiseId, color);

    // Everything but the icon shares the rest of the row, so no width does arithmetic on 320.
    lv_obj_t * body = lv_obj_create(row);
    lv_obj_remove_style_all(body);
    lv_obj_set_height(body, lv_pct(100));
    lv_obj_set_flex_grow(body, 1);
    lv_obj_remove_flag(body, LV_OBJ_FLAG_SCROLLABLE);

    lv_obj_t * nameLabel = lv_label_create(body);
    lv_label_set_text(nameLabel, name);
    lv_obj_set_style_text_font(nameLabel, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_align(nameLabel, LV_ALIGN_TOP_LEFT, 0, 0);

    lv_obj_t * valueLabel = lv_label_create(body);
    lv_label_set_text_fmt(valueLabel, "%d", value);
    lv_obj_set_style_text_font(valueLabel, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_align(valueLabel, LV_ALIGN_TOP_RIGHT, 0, 0);

    lv_obj_t * bar = lv_bar_create(body);
    lv_obj_set_size(bar, lv_pct(100), 8);
    lv_obj_align(bar, LV_ALIGN_BOTTOM_LEFT, 0, 0);
    lv_bar_set_range(bar, 0, EXPERTISE_MAX);
    lv_bar_set_value(bar, value, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar, color, LV_PART_INDICATOR | LV_STATE_DEFAULT);
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
    String currentGroup = "";
    for (JsonObject entry : expertise) {
        const String groupName = entry["groupName"] | "";
        if (groupName != currentGroup) {
            currentGroup = groupName;
            addGroupHeading(groupName.c_str());
        }
        addBar(entry["id"] | 0, entry["name"] | "?", entry["value"] | 0,
               parseColor(entry["groupColor"], fallback));
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
