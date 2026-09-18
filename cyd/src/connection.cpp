#include <WiFi.h>
#include <connection.h>
#include <globals.h>
#include <log.h>

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
