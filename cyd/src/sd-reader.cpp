#include <sd-reader.h>
#include <Arduino.h>
#include <FS.h>
#include <SD.h>
#include <log.h>
#include <SPI.h>
#include <globals.h>
#include <ArduinoJson.h>


bool setupSD() {

  SPIClass spi = SPIClass(VSPI);

  if (!SD.begin(SS, spi, 80000000)) {
    logRed("Card Mount Failed");
    return false;
  }
  uint8_t cardType = SD.cardType();

  if (cardType == CARD_NONE) {
    logRed("No SD card attached");
    return false;
  }

  Serial.print("SD Card Type: ");
  if (cardType == CARD_MMC) {
    logWhite("MMC");
  } else if (cardType == CARD_SD) {
    logWhite("SDSC");
  } else if (cardType == CARD_SDHC) {
    logWhite("SDHC");
  } else {
    logWhite("UNKNOWN");
  }

  uint64_t cardSize = SD.cardSize() / (1024 * 1024);
  logGreen("SD Card Size: %lluMB", String(cardSize).c_str());
  return readConfig(SD);
}

bool readConfig(fs::FS &fs) {
  const char * path =  "/config.json";
  logWhite("Reading file: %s", path);

  File file = fs.open(path);
  if (!file) {
    logRed("Failed to open file for reading");
    return false;
  }

  logWhite("Read from file: /config.json");
  String jsonData = String("");
  while (file.available()) {
    jsonData = jsonData + (char)file.read();
  }
  file.close();

  JsonDocument configObject;
  DeserializationError error = deserializeJson(configObject, jsonData);

  if(error) {
    logRed(error.c_str());
    return false;
  }

  logWhite("Setting config");

  int characterId = configObject["characterId"];
  String sessionTokenString= configObject["sessionToken"];
  String ssid = configObject["wifi"]["ssid"];
  String password = configObject["wifi"]["password"];
  String baseUrl = configObject["domain"];
  String apiUrl= configObject["apiUrl"];
  int id = configObject["characterId"];
  int port = configObject["mqttPort"];
  wifi_ssid = ssid;
  wifi_password = password;
  api_url = apiUrl;
  domain = baseUrl;
  character_id = id;
  sessionToken = sessionTokenString;
  mqttPort = port;

  return true;
}

