#ifndef CONNECTION_FUNC
#define CONNECTION_FUNC

#include <Arduino.h>

/**
 * Called about once a second while waiting for the AP, with the whole seconds elapsed.
 *
 * The wait blocks, and LVGL only paints when something pumps it, so this is what keeps the boot
 * screen alive and ticking during the one boot step that can take twenty seconds.
 */
typedef void (*WifiWaitTick)(int secondsElapsed);

/**
 * Connect to the AP named in `/config.json`, giving up after `wifiTimeout` seconds.
 *
 * Returns false on timeout, on a terminal failure the radio reports early (no such SSID, auth
 * rejected), or when no SSID is configured. `onTick` may be NULL.
 */
bool connectToWifi(WifiWaitTick onTick);

#endif
