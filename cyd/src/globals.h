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
/**
 * Re-attaches the touch controller to its SPI pins. `setupSD()` shares the VSPI peripheral with
 * the touchscreen but wires it to different physical pins, and whichever `begin()` ran last owns
 * the peripheral's MISO line — `SD.begin()` runs after touch is attached during boot, so touch is
 * left broken by the time boot hands off to the UI unless this is called first.
 */
void reattachTouch();

#endif