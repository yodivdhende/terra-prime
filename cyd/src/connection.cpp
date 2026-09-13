#include <wifi.h>
#include <WiFi.h>
#include <globals.h>
#include <log.h>
#include <connection.h>

/**
 * RSSI thresholds for the bars, in dBm. -55 and better is a device sat next to the access point;
 * below -85 a link technically exists but nothing useful gets through it.
 */
static const int rssiForLevel[] = {-85, -75, -65, -55};
static const int strengthLevels = sizeof(rssiForLevel) / sizeof(rssiForLevel[0]);

bool connectToWifi()
{
  WiFi.begin(wifi_ssid, wifi_password);
  logWhite("connecting to: %s",wifi_ssid.c_str());
  while (WiFi.status() != WL_CONNECTED)
  {
    logWhite(".");
    delay(1000);
  }
  tft.print("\n");
  logGreen("connected with Ip: %s", String(WiFi.localIP()).c_str());
  return true;
}

bool reconnectWifi(uint32_t timeoutMs)
{
  if (WiFi.status() == WL_CONNECTED) return true;
  if (wifi_ssid.length() == 0)
  {
    Serial.println("wifi: no SSID configured, staying offline");
    return false;
  }

  Serial.printf("wifi: reconnecting to %s\n", wifi_ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifi_ssid, wifi_password);

  const uint32_t startedAt = millis();
  while (WiFi.status() != WL_CONNECTED)
  {
    if (millis() - startedAt >= timeoutMs)
    {
      Serial.println("wifi: reconnect timed out");
      return false;
    }
    delay(100);
  }

  Serial.printf("wifi: reconnected, %d dBm\n", wifiRssi());
  return true;
}

int wifiRssi()
{
  if (WiFi.status() != WL_CONNECTED) return 0;
  return WiFi.RSSI();
}

int wifiStrengthLevel()
{
  if (WiFi.status() != WL_CONNECTED) return 0;

  const int rssi = wifiRssi();
  int level = 0;
  for (int i = 0; i < strengthLevels; i++)
  {
    if (rssi >= rssiForLevel[i]) level = i + 1;
  }
  return level;
}
