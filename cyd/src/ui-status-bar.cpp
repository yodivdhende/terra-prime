#include <Arduino.h>
#include <lvgl.h>
#include <ui/ui.h>
#include <connection.h>
#include <power.h>
#include <ui-status-bar.h>

/**
 * The status bar every screen carries: battery on the left of the clock, WiFi next to it.
 *
 * `src/ui/` is generated from the SquareLine project, so nothing here edits it. The header arrives
 * with one `battery-full.png` and one `wifi.png` — a single frame each — and this file gives them a
 * state: the battery icon is tinted by how much charge is left and captioned with the percentage,
 * and the WiFi icon fades out as the signal drops and turns red when the link is gone.
 *
 * Every screen builds its own copy of the Header component, so the refresh walks all of them: LVGL
 * only draws the loaded screen, and the rest are then already right when the player navigates.
 */

/** How often the icons are refreshed. The readings behind them move far more slowly than this. */
#define STATUS_BAR_REFRESH_MS 2000

/** Charge below this is worth a warning colour, and below the second a red one. */
#define BATTERY_LOW_PERCENTAGE 50
#define BATTERY_CRITICAL_PERCENTAGE 20

/** Right edge of the charge caption, measured in from the right of the 320px header. */
#define BATTERY_LABEL_INSET -100

/** Every header on the device, and the charge caption this file hangs under each one. */
static lv_obj_t *headers[] = {NULL, NULL, NULL, NULL};
static lv_obj_t *chargeLabels[] = {NULL, NULL, NULL, NULL};
static const int headerCount = sizeof(headers) / sizeof(headers[0]);

static lv_color_t batteryColor(const BatteryReading &battery)
{
    if (battery.charging) return lv_palette_main(LV_PALETTE_GREEN);
    if (battery.percentage < BATTERY_CRITICAL_PERCENTAGE) return lv_palette_main(LV_PALETTE_RED);
    if (battery.percentage < BATTERY_LOW_PERCENTAGE) return lv_palette_main(LV_PALETTE_AMBER);
    return lv_color_white();
}

static void applyBattery(lv_obj_t *header, lv_obj_t *label, const BatteryReading &battery)
{
    lv_obj_t *icon = ui_comp_get_child(header, UI_COMP_HEADER_BATERYIMAGE);
    if (icon == NULL) return;

    if (battery.metered == false)
    {
        // No sense IC answered. Dim the icon and say nothing rather than invent a number.
        lv_obj_set_style_image_opa(icon, LV_OPA_40, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_image_recolor_opa(icon, LV_OPA_TRANSP, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_label_set_text(label, "--");
        return;
    }

    lv_obj_set_style_image_opa(icon, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_image_recolor(icon, batteryColor(battery), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_image_recolor_opa(icon, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);

    if (battery.charging) lv_label_set_text_fmt(label, LV_SYMBOL_CHARGE "%d%%", battery.percentage);
    else lv_label_set_text_fmt(label, "%d%%", battery.percentage);
}

static void applyWifi(lv_obj_t *header, int level)
{
    lv_obj_t *icon = ui_comp_get_child(header, UI_COMP_HEADER_WIFIIMAGE);
    if (icon == NULL) return;

    // One asset, five states: fade the icon as the signal drops, and redden it when there is no link.
    static const lv_opa_t opacityForLevel[] = {LV_OPA_30, LV_OPA_50, LV_OPA_70, LV_OPA_90, LV_OPA_COVER};
    if (level < 0) level = 0;
    if (level > 4) level = 4;

    lv_obj_set_style_image_opa(icon, opacityForLevel[level], LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_image_recolor(icon, lv_palette_main(LV_PALETTE_RED), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_image_recolor_opa(icon, level == 0 ? LV_OPA_COVER : LV_OPA_TRANSP,
                                       LV_PART_MAIN | LV_STATE_DEFAULT);
}

static void refreshStatusBar(lv_timer_t *timer)
{
    const BatteryReading battery = batteryReading();
    const int level = wifiStrengthLevel();

    // Restyling an object invalidates it, so redraw the icons only when they would actually look
    // different — a percentage that has not moved is not worth a repaint every two seconds.
    static int appliedPercentage = -2;
    static bool appliedCharging = false;
    static int appliedLevel = -1;
    const bool unchanged = battery.percentage == appliedPercentage &&
                           battery.charging == appliedCharging &&
                           level == appliedLevel;
    if (timer != NULL && unchanged) return;
    appliedPercentage = battery.percentage;
    appliedCharging = battery.charging;
    appliedLevel = level;

    for (int i = 0; i < headerCount; i++)
    {
        if (headers[i] == NULL || chargeLabels[i] == NULL) continue;
        applyBattery(headers[i], chargeLabels[i], battery);
        applyWifi(headers[i], level);
    }
}

void uiStatusBarInit()
{
    // Home, Messages, Implants, Expertise — the four screens SquareLine gives a header. The
    // download/loot/virus screens are full-bleed and have none.
    lv_obj_t *const screenHeaders[] = {ui_Header, ui_Header1, ui_Header3, ui_Header4};
    static_assert(sizeof(screenHeaders) / sizeof(screenHeaders[0]) == (size_t)headerCount,
                  "one slot per header");

    for (int i = 0; i < headerCount; i++)
    {
        headers[i] = screenHeaders[i];
        if (headers[i] == NULL) continue;

        // The charge percentage goes left of the WiFi icon: the icons and the clock have the right
        // of the header to themselves.
        chargeLabels[i] = lv_label_create(headers[i]);
        lv_label_set_text(chargeLabels[i], "--");
        lv_obj_set_style_text_font(chargeLabels[i], &lv_font_montserrat_12, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_align(chargeLabels[i], LV_ALIGN_RIGHT_MID, BATTERY_LABEL_INSET, 0);
    }

    refreshStatusBar(NULL);
    lv_timer_create(refreshStatusBar, STATUS_BAR_REFRESH_MS, NULL);
}
