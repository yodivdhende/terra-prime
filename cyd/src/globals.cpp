#include <TFT_eSPI.h>
#include <Arduino.h>
#include <XPT2046_Touchscreen.h>
#include <globals.h>


const uint16_t screenWidth  = 320;
const uint16_t screenHeight = 240;

// Touch screen pins live in globals.h: power save wakes the board on the touch IRQ line.
SPIClass tsSpi = SPIClass(VSPI);
XPT2046_Touchscreen ts(XPT2046_CS, XPT2046_IRQ);

String wifi_ssid;
String wifi_password;
String domain;
int webSocketPort;
String api_url;
String boot_gif_path;
String sessionToken;
String deviceUid;


TFT_eSPI tft = TFT_eSPI( screenHeight ,screenWidth ); /* TFT instance */

void clearScreen()
{
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(0,0);
}

void screenSetup()
{
  tsSpi.begin(XPT2046_CLK, XPT2046_MISO, XPT2046_MOSI, XPT2046_CS);
  ts.begin(tsSpi);
  ts.setRotation(1);
  tft.init();
  tft.setRotation(0) ;
  clearScreen();
  tft.setTextFont(2);
}