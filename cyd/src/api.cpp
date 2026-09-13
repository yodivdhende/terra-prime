#include <api.h>
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <globals.h>

/**
 * Every read the device does goes through here, so authentication is attached in one place.
 *
 * The AguesGuard authenticates as *itself*: `X-Device-Uid` is the UID it is registered under in
 * `Devices`, and the server reads which character version it is bound to from that device's
 * `aguesguard` role. The prop therefore carries no player's session token, and re-binding a
 * handheld to another character is an admin edit with nothing to reflash and no SD card to rewrite.
 *
 * `sessionToken` is still sent as a cookie when `/config.json` carries one, which keeps a device
 * that is not in the registry yet working against `/api/my/**`. The server prefers the device
 * header when both arrive.
 *
 * Logging here is Serial-only on purpose: `log.cpp` writes straight to the TFT, which fights LVGL
 * once the UI is up, and these requests run from screens.
 */
String apiGet(const String& path)
{
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("apiGet: no WiFi");
    return "";
  }

  WiFiClient client;
  HTTPClient http;
  const String url = api_url + path;
  Serial.print("apiGet: ");
  Serial.println(url);

  http.setConnectTimeout(3000);
  http.setTimeout(5000);
  if (http.begin(client, url) == false) {
    Serial.println("apiGet: begin failed");
    return "";
  }

  if (deviceUid.length() > 0) http.addHeader("X-Device-Uid", deviceUid);
  if (sessionToken.length() > 0) http.addHeader("Cookie", "session-token=" + sessionToken);

  const int status = http.GET();
  String payload = "";
  if (status == HTTP_CODE_OK) {
    payload = http.getString();
  } else {
    Serial.print("apiGet: HTTP ");
    Serial.println(status);
  }
  http.end();
  return payload;
}
