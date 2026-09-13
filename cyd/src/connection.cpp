#include <WiFi.h>
#include <connection.h>
#include <globals.h>
#include <log.h>
#include <connection.h>

/**
 * RSSI thresholds for the bars, in dBm. -55 and better is a device sat next to the access point;
 * below -85 a link technically exists but nothing useful gets through it.
 */
static const int rssiForLevel[] = {-85, -75, -65, -55};
static const int strengthLevels = sizeof(rssiForLevel) / sizeof(rssiForLevel[0]);

/**
 * The WiFi boot step.
 *
 * This used to loop on `WiFi.status() != WL_CONNECTED` with no exit, so it could only ever return
 * true or hang the device forever — which made the `== false` check at its call site dead code. It
 * now gives up after `wifiTimeout` seconds, which is what lets the boot screen report a WiFi
 * failure at all.
 *
 * Two of the radio's statuses are terminal rather than "not yet": a missing SSID and a rejected
 * password both come back within a few seconds, and waiting out the full timeout to report
 * "timeout" would hide the actual answer.
 */

/** Poll finer than the tick, so the deadline is honoured closely and the watchdog stays fed. */
#define WIFI_POLL_MS 100

bool connectToWifi(WifiWaitTick onTick)
{
  if (wifi_ssid.length() == 0) {
    logRed("No wifi.ssid in config.json");
    return false;
  }

  // Only what the card says: no stale credentials from a previous boot auto-connecting, and no
  // leftover AP mode.
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifi_ssid, wifi_password);
  logWhite("connecting to: %s", wifi_ssid.c_str());

  const uint32_t start = millis();
  const uint32_t timeoutMs = (uint32_t)wifiTimeout * 1000;
  int reportedSeconds = -1;

  for (;;) {
    const wl_status_t status = WiFi.status();
    if (status == WL_CONNECTED) {
      logGreen("connected with Ip: %s", WiFi.localIP().toString().c_str());
      return true;
    }
    if (status == WL_NO_SSID_AVAIL) {
      logRed("WiFi network not found: %s", wifi_ssid.c_str());
      WiFi.disconnect(true, true);
      return false;
    }
    if (status == WL_CONNECT_FAILED) {
      logRed("WiFi rejected the password");
      WiFi.disconnect(true, true);
      return false;
    }

    // Subtraction rather than comparing against `start + timeoutMs`, so a millis() rollover
    // mid-wait does not turn the deadline into one that has already passed.
    const uint32_t elapsed = millis() - start;
    if (elapsed >= timeoutMs) {
      logRed("WiFi timed out after %ss", String(wifiTimeout).c_str());
      WiFi.disconnect(true, true);
      return false;
    }

    const int seconds = (int)(elapsed / 1000);
    if (onTick != NULL && seconds != reportedSeconds) {
      reportedSeconds = seconds;
      onTick(seconds);
    }
    delay(WIFI_POLL_MS);
  }
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
