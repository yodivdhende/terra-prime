#include <Arduino.h>
#include <ArduinoJson.h>
#include <lvgl.h>
#include <ui/ui.h>
#include <api.h>
#include <cache.h>
#include <async-fetch.h>
#include <character.h>
#include <ui-implants.h>

/**
 * The Implants screen: every implant the character carries, each with its description.
 *
 * Same shape as `ui-expertise.cpp` — `src/ui/` is generated, so this hangs a list under the
 * generated header and title and refills it on every `LV_EVENT_SCREEN_LOADED`. Rows arrive sorted
 * by slot, so the list reads in the order the implants sit in the body.
 *
 * Each visit paints instantly from the SD cache (`cacheRead()`, no network wait), then starts a
 * background fetch (`async-fetch.h`) of the live answer. `uiImplantsApplyFetch()` — called from
 * `uiLoop()` once that lands — redraws only if the body actually changed, and only if this screen
 * is still the one on screen; either way the fresh answer is written back to the SD cache so the
 * next offline visit has it too.
 */

static lv_obj_t * implantList = NULL;

static void addImplant(const char * name, const char * description)
{
    lv_obj_t * row = lv_obj_create(implantList);
    lv_obj_remove_style_all(row);
    lv_obj_set_width(row, lv_pct(100));
    lv_obj_set_height(row, LV_SIZE_CONTENT);
    lv_obj_set_flex_flow(row, LV_FLEX_FLOW_COLUMN);
    lv_obj_remove_flag(row, LV_OBJ_FLAG_SCROLLABLE);

    lv_obj_t * nameLabel = lv_label_create(row);
    lv_obj_set_width(nameLabel, lv_pct(100));
    lv_label_set_long_mode(nameLabel, LV_LABEL_LONG_WRAP);
    lv_label_set_text(nameLabel, name);

    lv_obj_t * descriptionLabel = lv_label_create(row);
    lv_obj_set_width(descriptionLabel, lv_pct(100));
    lv_label_set_long_mode(descriptionLabel, LV_LABEL_LONG_WRAP);
    lv_label_set_text(descriptionLabel, description);
    lv_obj_set_style_text_font(descriptionLabel, &lv_font_montserrat_12,
                               LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_opa(descriptionLabel, 180, LV_PART_MAIN | LV_STATE_DEFAULT);
}

static void addMessage(const char * text)
{
    lv_obj_t * label = lv_label_create(implantList);
    lv_obj_set_width(label, lv_pct(100));
    lv_label_set_long_mode(label, LV_LABEL_LONG_WRAP);
    lv_label_set_text(label, text);
    lv_obj_set_style_text_font(label, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
}

/** What's currently drawn into `implantList`, so a same-content refresh can skip redrawing and an
 *  empty-cache screen knows whether it's shown anything yet. "" means nothing has. */
static String lastRenderedBody = "";

/** Parses `body` and draws it into `implantList`. Caller has already cleared the list. */
static void renderImplants(const String & body)
{
    JsonDocument document;
    const DeserializationError error = deserializeJson(document, body);
    if (error) {
        Serial.print("implants: JSON error ");
        Serial.println(error.c_str());
        addMessage("Could not read your implants.");
        return;
    }

    JsonArray implants = document["implants"].as<JsonArray>();
    if (implants.isNull() || implants.size() == 0) {
        addMessage("No implants fitted.");
        return;
    }

    for (JsonObject entry : implants) {
        addImplant(entry["name"] | "?", entry["description"] | "");
    }
}

static void fillImplants(lv_event_t * e)
{
    LV_UNUSED(e);
    lv_obj_clean(implantList);

    // The version this device believes it is: a stored body for any other character is not used.
    lastRenderedBody = cacheRead("my/implants", currentCharacter.versionId);
    if (lastRenderedBody != "") {
        renderImplants(lastRenderedBody);
    } else {
        addMessage("Loading...");
    }

    asyncFetchStart("my/implants");
}

void uiImplantsApplyFetch(const String & body)
{
    if (body == "") {
        // Something's already on screen (from cache, or an earlier fetch this visit) - the offline
        // fallback is exactly that, so leave it. Only say so if there truly is nothing to show.
        if (lastRenderedBody != "") return;
        if (lv_screen_active() != ui_Implants) return;
        lv_obj_clean(implantList);
        addMessage("No connection, and nothing stored yet.");
        return;
    }

    if (body == lastRenderedBody) return; // fresh data matches what's already shown
    lastRenderedBody = body;

    if (lv_screen_active() != ui_Implants) return; // player moved on; next visit paints this
    lv_obj_clean(implantList);
    renderImplants(body);
}

void uiImplantsInit()
{
    // The generated title sits in the middle of the screen; the list needs that room.
    lv_obj_set_align(ui_ImplantsTitle, LV_ALIGN_TOP_MID);
    lv_obj_set_x(ui_ImplantsTitle, 0);
    lv_obj_set_y(ui_ImplantsTitle, 30);

    implantList = lv_obj_create(ui_Implants);
    lv_obj_set_size(implantList, 320, 186);
    lv_obj_align(implantList, LV_ALIGN_TOP_MID, 0, 52);
    lv_obj_set_flex_flow(implantList, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_style_bg_opa(implantList, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(implantList, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_all(implantList, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_row(implantList, 8, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_obj_add_event_cb(ui_Implants, fillImplants, LV_EVENT_SCREEN_LOADED, NULL);
}
