#include <Arduino.h>
#include <ArduinoJson.h>
#include <lvgl.h>
#include <ui/ui.h>
#include <api.h>
#include <character.h>
#include <ui-implants.h>

/**
 * The Implants screen: every implant the character carries, each with its description.
 *
 * Same shape as `ui-expertise.cpp` — `src/ui/` is generated, so this hangs a list under the
 * generated header and title and refills it on every `LV_EVENT_SCREEN_LOADED`, which also refreshes
 * the copy on the SD card that `api.cpp` falls back to offline. Rows arrive sorted by slot, so the
 * list reads in the order the implants sit in the body.
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

static void fillImplants(lv_event_t * e)
{
    LV_UNUSED(e);
    lv_obj_clean(implantList);

    // The version this device believes it is: a stored body for any other character is not used.
    const ApiResult result = apiGet("my/implants", currentCharacter.versionId);
    if (result.body == "") {
        addMessage("No connection, and nothing stored yet.");
        return;
    }

    JsonDocument document;
    const DeserializationError error = deserializeJson(document, result.body);
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
