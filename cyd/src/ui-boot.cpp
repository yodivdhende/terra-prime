#include <Arduino.h>
#include <lvgl.h>
#include <ui/ui.h>
#include <boot.h>
#include <globals.h>
#include <log.h>
#include <ui-boot.h>

/**
 * The boot screen: every step in `boot.h`'s table, each marked as it runs, before Home appears.
 *
 * Unlike the Expertise and Implants screens this one has no SquareLine counterpart to hang content
 * on — it exists only during `setup()` — so it creates its own screen with `lv_obj_create(NULL)`.
 * It still inherits the dark theme `ui_init()` installed, so it matches the rest of the UI.
 *
 * The hard part is that it has to paint while `setup()` is still running, before `loop()` exists to
 * pump LVGL. `lv_refr_now()` is what does that: it renders every invalid area synchronously, and
 * with a single partial buffer and an in-line software renderer it returns only once the pixels
 * have been pushed to the panel. So a row set to RUNNING is on the glass before the step it
 * announces begins to block. `lv_timer_handler()` would not do: the refresh timer has a 30 ms
 * period and pauses itself between frames, so a single call is not guaranteed to draw anything.
 *
 * Nothing on this screen is animated, for the same reason — `lv_refr_now()` advances animations by
 * wall-clock only when it is called, so an animated bar or a spinner would freeze during each step
 * and jump between them, which reads as a hang rather than as progress.
 */

#define STATUS_WIDTH 18
#define ROW_HEIGHT 22
/** Long enough to read the finished list, short enough not to delay a player at the table. */
#define HAND_OVER_MS 1200

static lv_obj_t * bootScreen = NULL;
static lv_obj_t * detailLabel = NULL;
static lv_obj_t * progressBar = NULL;
static lv_obj_t ** statusLabels = NULL;
static int rowCount = 0;

static void setDetail(const char * text)
{
    if (detailLabel == NULL) return;
    lv_label_set_text(detailLabel, text != NULL ? text : "");
}

static void addRow(int index)
{
    lv_obj_t * row = lv_obj_create(bootScreen);
    lv_obj_remove_style_all(row);
    lv_obj_set_width(row, lv_pct(100));
    lv_obj_set_height(row, ROW_HEIGHT);
    lv_obj_remove_flag(row, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_flex_flow(row, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(row, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    lv_obj_set_style_pad_column(row, 8, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_obj_t * status = lv_label_create(row);
    lv_obj_set_width(status, STATUS_WIDTH);
    lv_label_set_text(status, LV_SYMBOL_BULLET);
    lv_obj_set_style_text_font(status, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_opa(status, 100, LV_PART_MAIN | LV_STATE_DEFAULT);
    statusLabels[index] = status;

    lv_obj_t * label = lv_label_create(row);
    lv_obj_set_flex_grow(label, 1);
    lv_label_set_long_mode(label, LV_LABEL_LONG_DOT);
    lv_label_set_text(label, bootStepLabel(index));
    lv_obj_set_style_text_font(label, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
}

void uiBootInit()
{
    rowCount = bootStepCount();
    statusLabels = (lv_obj_t **)lv_malloc(sizeof(lv_obj_t *) * rowCount);
    if (statusLabels == NULL) return;

    bootScreen = lv_obj_create(NULL);
    lv_obj_remove_flag(bootScreen, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_flex_flow(bootScreen, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_style_pad_all(bootScreen, 12, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_row(bootScreen, 4, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_obj_t * title = lv_label_create(bootScreen);
    lv_label_set_text(title, "AguesGuard " FIRMWARE_VERSION);
    lv_obj_set_style_pad_bottom(title, 6, LV_PART_MAIN | LV_STATE_DEFAULT);

    for (int i = 0; i < rowCount; i++) addRow(i);

    progressBar = lv_bar_create(bootScreen);
    lv_obj_set_width(progressBar, lv_pct(100));
    lv_obj_set_height(progressBar, 6);
    lv_obj_set_style_margin_top(progressBar, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_bar_set_range(progressBar, 0, rowCount);
    lv_bar_set_value(progressBar, 0, LV_ANIM_OFF);

    detailLabel = lv_label_create(bootScreen);
    lv_obj_set_width(detailLabel, lv_pct(100));
    lv_label_set_long_mode(detailLabel, LV_LABEL_LONG_DOT);
    lv_label_set_text(detailLabel, "");
    lv_obj_set_style_text_font(detailLabel, &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_opa(detailLabel, 160, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_screen_load(bootScreen);
    lv_refr_now(NULL);
}

void uiBootSetStep(int index, BootStepState state, const char * detail)
{
    // Everything is NULL once the screen has been handed over and deleted, and a late WiFi tick or
    // a stray call must not write into freed objects.
    if (statusLabels == NULL || index < 0 || index >= rowCount) return;

    lv_obj_t * status = statusLabels[index];
    switch (state) {
        case BOOT_PENDING:
            lv_label_set_text(status, LV_SYMBOL_BULLET);
            lv_obj_set_style_text_opa(status, 100, LV_PART_MAIN | LV_STATE_DEFAULT);
            break;
        case BOOT_RUNNING:
            lv_label_set_text(status, LV_SYMBOL_RIGHT);
            lv_obj_set_style_text_opa(status, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
            break;
        case BOOT_OK:
            lv_label_set_text(status, LV_SYMBOL_OK);
            lv_obj_set_style_text_opa(status, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
            lv_obj_set_style_text_color(status, lv_palette_main(LV_PALETTE_GREEN),
                                        LV_PART_MAIN | LV_STATE_DEFAULT);
            lv_bar_set_value(progressBar, index + 1, LV_ANIM_OFF);
            break;
        case BOOT_FAILED:
            lv_label_set_text(status, LV_SYMBOL_CLOSE);
            lv_obj_set_style_text_opa(status, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
            lv_obj_set_style_text_color(status, lv_palette_main(LV_PALETTE_RED),
                                        LV_PART_MAIN | LV_STATE_DEFAULT);
            break;
    }

    if (detail != NULL && detail[0] != '\0') setDetail(detail);
    else if (state == BOOT_RUNNING) setDetail("");

    // Paint now: the caller is about to block, and nothing else will pump LVGL until it returns.
    lv_refr_now(NULL);
}

static void handOverToHome(lv_timer_t * timer)
{
    LV_UNUSED(timer);
    // auto_del frees the boot screen with its rows; it exists only for the length of a boot.
    bootScreen = NULL;
    detailLabel = NULL;
    progressBar = NULL;
    lv_free(statusLabels);
    statusLabels = NULL;
    rowCount = 0;

    lv_screen_load_anim(ui_Home, LV_SCR_LOAD_ANIM_NONE, 0, 0, true);
}

void uiBootFinish()
{
    setDetail("Ready");
    lv_refr_now(NULL);

    // A timer rather than a delay, so setup() returns and loop() starts pumping LVGL. Timers
    // repeat by default; this one must not.
    lv_timer_t * timer = lv_timer_create(handOverToHome, HAND_OVER_MS, NULL);
    if (timer != NULL) lv_timer_set_repeat_count(timer, 1);
}

void uiBootHalt(int failedIndex)
{
    char message[96];
    const char * reason = logLastError();
    if (reason != NULL && reason[0] != '\0') {
        snprintf(message, sizeof(message), "%s failed: %s", bootStepLabel(failedIndex), reason);
    } else {
        snprintf(message, sizeof(message), "%s failed", bootStepLabel(failedIndex));
    }
    setDetail(message);
    lv_refr_now(NULL);
}
