#include <api.h>
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <cache.h>
#include <globals.h>

/**
 * Every read the device does goes through here, so authentication and the offline fallback are each
 * in one place.
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
 * Every answer is written to the SD cache and every failure falls back to it, so a prop that loses
 * the network mid-event keeps showing the player their own sheet. A cached body is marked stale on
 * the way out, and the screens say so rather than passing old numbers off as current.
 *
 * Logging here is Serial-only on purpose: `log.cpp` writes straight to the TFT, which fights LVGL
 * once the UI is up, and these requests run from screens.
 */

String apiHttpGet(const String& path)
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

ApiResult apiGet(const String& path, int characterVersionId)
{
  const String fresh = apiHttpGet(path);
  if (fresh != "") {
    cacheWrite(path, fresh, characterVersionId);
    return { fresh, false };
  }

  const String stored = cacheRead(path, characterVersionId);
  if (stored != "") {
    Serial.print("apiGet: serving the stored copy of ");
    Serial.println(path.c_str());
  }
  return { stored, stored != "" };
}
