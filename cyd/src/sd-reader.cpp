#include <sd-reader.h>
#include <Arduino.h>
#include <FS.h>
#include <SD.h>
#include <log.h>
#include <SPI.h>
#include <globals.h>
#include <ArduinoJson.h>

/** Matches the default in `globals.cpp`, for a card whose config omits the key. */
#define WIFI_TIMEOUT_DEFAULT_SECONDS 20


/**
 * The card outlives `setupSD()` now — the cache in `cache.cpp` reads and writes it while the UI is
 * running — and `SD.begin()` keeps a pointer to the bus it is handed, not a copy. This used to be a
 * local, which left that pointer dangling the moment `setupSD()` returned; it was harmless only
 * because nothing touched the card afterwards.
 */
static SPIClass sdSpi(VSPI);
static bool sdReady = false;

bool isSdReady() {
  return sdReady;
}

bool setupSD() {

  // 20 MHz: the SPI-mode ceiling is 40 and this used to ask for 80. A marginal mount used to
  // mean "no SD"; now it means "will not boot", so the number has to be in spec.
  if (!SD.begin(SS, sdSpi, 20000000)) {
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
  logGreen("SD Card Size: %sMB", String(cardSize).c_str());
  sdReady = true;
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

  // No `characterId`: which character this device shows is the server's answer, read from the
  // `aguesguard` role of the device registered under `deviceUid`.
  String deviceUidString = configObject["deviceUid"];
  // Defaulted and clamped: a missing key parses as 0, which would fail WiFi before it started, and
  // a typo should not make the AP unreachable either.
  int wifiTimeoutSeconds = configObject["wifiTimeout"] | WIFI_TIMEOUT_DEFAULT_SECONDS;
  if (wifiTimeoutSeconds < 1 || wifiTimeoutSeconds > 120) {
    wifiTimeoutSeconds = WIFI_TIMEOUT_DEFAULT_SECONDS;
  }
  String sessionTokenString= configObject["sessionToken"];
  String ssid = configObject["wifi"]["ssid"];
  String password = configObject["wifi"]["password"];
  String baseUrl = configObject["domain"];
  String apiUrl= configObject["apiUrl"];
  int port = configObject["webSocketPort"];
  wifi_ssid = ssid;
  wifi_password = password;
  api_url = apiUrl;
  domain = baseUrl;
  deviceUid = deviceUidString;
  wifiTimeout = wifiTimeoutSeconds;
  sessionToken = sessionTokenString;
  webSocketPort = port;

  if (deviceUid.length() == 0) {
    logRed("No deviceUid in config.json - the API will not know which character this is");
  }

  return true;
}

