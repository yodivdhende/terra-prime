#ifndef GLOBALS
#define GLOBALS

#include <TFT_eSPI.h>
#include <Arduino.h>
#include <XPT2046_Touchscreen.h>

/*Touch screen config*/
#define XPT2046_IRQ 36 //GPIO driver cảm ứng
#define XPT2046_MOSI 32
#define XPT2046_MISO 39
#define XPT2046_CLK 25
#define XPT2046_CS 33

extern const uint16_t screenWidth;
extern const uint16_t screenHeight;
extern TFT_eSPI tft;
extern String wifi_ssid;
extern String wifi_password;
extern String domain;
extern int webSocketPort;
extern String api_url;
extern String sessionToken;
/** The UID this device is registered under in `Devices` — how it authenticates to the API. */
extern String deviceUid;

extern XPT2046_Touchscreen ts;
void clearScreen();
void screenSetup();

#endif