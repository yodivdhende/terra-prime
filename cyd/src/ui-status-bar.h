#ifndef UI_STATUS_BAR
#define UI_STATUS_BAR

/**
 * Make the header's battery and WiFi icons say something. Call once, after `ui_init()`: from then
 * on a timer refreshes every screen's header from the battery and radio readings.
 */
void uiStatusBarInit();

#endif
