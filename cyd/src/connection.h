#ifndef CONNECTION_FUNC
#define CONNECTION_FUNC

#include <Arduino.h>

/** Associate at boot. Blocks until the network answers, and logs to the TFT. */
bool connectToWifi();

/**
 * Associate again after the radio was taken down — coming out of power save, say. Logs to Serial
 * only, because by then LVGL owns the screen. Returns false once `timeoutMs` has elapsed.
 */
bool reconnectWifi(uint32_t timeoutMs);

/** Signal strength in dBm, or 0 when the radio is not associated. */
int wifiRssi();

/** Signal strength as 0 (no link) to 4 (full) bars — what the status bar and the server want. */
int wifiStrengthLevel();

#endif
