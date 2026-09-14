#include <Arduino.h>
#include <lvgl.h>
#include <globals.h>
#include <ui-notify.h>

/**
 * The notification banner.
 *
 * Built on `lv_layer_top()` rather than on a screen, because a notification has to survive the
 * screen changing underneath it: a `cyd.show` and a `cyd.notify` can arrive together, and the
 * message is about the player, not about the screen. The top layer is drawn over every screen and
 * is not touched by `lv_screen_load()`, which is exactly that behaviour for free.
 *
 * `src/ui/` is generated from the SquareLine project, so the banner is built by hand here rather
 * than added to it — regenerating the project would otherwise drop it.
 */

#define NOTIFY_MARGIN 8
#define NOTIFY_PADDING 8

static lv_obj_t *banner = NULL;
static lv_obj_t *bannerLabel = NULL;
static uint32_t hideAt = 0;

static void buildBanner()
{
    banner = lv_obj_create(lv_layer_top());
    lv_obj_set_width(banner, screenWidth - (NOTIFY_MARGIN * 2));
    lv_obj_set_height(banner, LV_SIZE_CONTENT);
    lv_obj_align(banner, LV_ALIGN_BOTTOM_MID, 0, -NOTIFY_MARGIN);
    lv_obj_set_style_pad_all(banner, NOTIFY_PADDING, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_color(banner, lv_color_black(), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_opa(banner, LV_OPA_90, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_color(banner, lv_palette_main(LV_PALETTE_CYAN), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(banner, 1, LV_PART_MAIN | LV_STATE_DEFAULT);
    // The banner is information, not a control: letting it take touches would steal them from the
    // screen the player is actually using.
    lv_obj_remove_flag(banner, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_remove_flag(banner, LV_OBJ_FLAG_SCROLLABLE);

    bannerLabel = lv_label_create(banner);
    lv_obj_set_width(bannerLabel, lv_pct(100));
    lv_label_set_long_mode(bannerLabel, LV_LABEL_LONG_WRAP);
    lv_obj_set_style_text_color(bannerLabel, lv_color_white(), LV_PART_MAIN | LV_STATE_DEFAULT);
}

void uiNotifyShow(const char *message, uint32_t durationMs)
{
    if (message == NULL || message[0] == '\0') return;
    if (banner == NULL) buildBanner();

    lv_label_set_text(bannerLabel, message);
    lv_obj_remove_flag(banner, LV_OBJ_FLAG_HIDDEN);
    // A second message replaces the first and restarts the clock, rather than stacking: there is
    // one line of room at the bottom of a 320x240 screen.
    hideAt = millis() + (durationMs == 0 ? UI_NOTIFY_DEFAULT_MS : durationMs);
}

void uiNotifyLoop()
{
    if (banner == NULL || hideAt == 0) return;
    if (millis() < hideAt) return;
    lv_obj_add_flag(banner, LV_OBJ_FLAG_HIDDEN);
    hideAt = 0;
}
