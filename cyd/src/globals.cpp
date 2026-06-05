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
int mqttPort;
String api_url;
int character_id;
String boot_gif_path;
String sessionToken;


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