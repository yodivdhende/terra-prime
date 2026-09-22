#ifndef CONNECTION_FUNC
#define CONNECTION_FUNC

#include <Arduino.h>

/**
 * Called about once a second while waiting for the AP, with the whole seconds elapsed.
 *
 * The wait blocks, so this is what keeps the boot screen alive and ticking during the one boot
 * step that can take twenty seconds.
 */
typedef void (*WifiWaitTick)(int secondsElapsed);

/**
 * Connect to the AP named in `/config.json`, giving up after `wifiTimeout` seconds.
 *
 * Returns false on timeout, on a terminal failure the radio reports early (no such SSID, auth
 * rejected), or when no SSID is configured. `onTick` may be NULL.
 */
bool connectToWifi(WifiWaitTick onTick);

/**
 * Associate again after the radio was taken down — coming out of power save, say. Logs to Serial
 * only, because by then the UI owns the screen. Returns false once `timeoutMs` has elapsed.
 */
bool reconnectWifi(uint32_t timeoutMs);

/** Signal strength in dBm, or 0 when the radio is not associated. */
int wifiRssi();

/** Signal strength as 0 (no link) to 4 (full) bars — what the status bar and the server want. */
int wifiStrengthLevel();

#endif
