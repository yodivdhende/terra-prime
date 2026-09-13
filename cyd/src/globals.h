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
extern String api_url;
extern String sessionToken;
/** The UID this device is registered under in `Devices` — how it authenticates to the API. */
extern String deviceUid;

/**
 * The broker, from `config.json`'s `mqtt` block. The username is this device's own UID and the
 * password is its own: a credential is per prop, because a prop ends up in a player's hands.
 */
extern String mqttHost;
extern int mqttPort;
extern String mqttUsername;
extern String mqttPassword;

/** Reported in the device's status so the control room can see what a prop is running. */
extern const char *firmwareVersion;

extern XPT2046_Touchscreen ts;
void clearScreen();
void screenSetup();

#endif