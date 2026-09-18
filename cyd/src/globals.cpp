#include <TFT_eSPI.h>
#include <Arduino.h>
#include <XPT2046_Touchscreen.h>


const uint16_t screenWidth  = 320;
const uint16_t screenHeight = 240;

/*Touch screen config*/
#define XPT2046_IRQ 36 //GPIO driver cảm ứng 
#define XPT2046_MOSI 32
#define XPT2046_MISO 39
#define XPT2046_CLK 25
#define XPT2046_CS 33
SPIClass tsSpi = SPIClass(VSPI);
XPT2046_Touchscreen ts(XPT2046_CS, XPT2046_IRQ);

String wifi_ssid;
String wifi_password;
String domain;
int webSocketPort;
// Defaulted here as well as in readConfig(), so a boot that never reaches the card still has a
// deadline rather than one that has already expired.
int wifiTimeout = 20;
String api_url;
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
  // Portrait while boot owns the panel: the long edge is vertical, which is 20 lines of text
  // against landscape's 15, and the boot log is what needs them. `uiSetup()` turns it to landscape
  // when LVGL takes over.
  tft.setRotation(0);
  clearScreen();
  tft.setTextFont(2);
}