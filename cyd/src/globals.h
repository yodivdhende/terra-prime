#ifndef GLOBALS
#define GLOBALS

/** Shown on the boot screen and logged at startup, so the two cannot drift apart. */
#define FIRMWARE_VERSION "V0.0.4"

#include <TFT_eSPI.h>
#include <Arduino.h>
#include <XPT2046_Touchscreen.h>

extern const uint16_t screenWidth;
extern const uint16_t screenHeight;
extern TFT_eSPI tft;
extern String wifi_ssid;
extern String wifi_password;
extern String domain;
extern int webSocketPort;
/**
 * Seconds to wait for the AP before the WiFi boot step gives up, from `/config.json`.
 * Defaulted and clamped in `readConfig()` — a 0 here would fail WiFi instantly.
 */
extern int wifiTimeout;
extern String api_url;
extern String sessionToken;
/** The UID this device is registered under in `Devices` — how it authenticates to the API. */
extern String deviceUid;

extern XPT2046_Touchscreen ts;
void clearScreen();
void screenSetup();

#endif