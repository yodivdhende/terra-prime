#include <Arduino.h>
#include <character.h>
#include <api.h>
#include <ArduinoJson.h>
#include <log.h>

Character currentCharacter;

/**
 * `GET api/my/character` — the character version this device is bound to.
 *
 * The old call was `GET api/characters/{characterId}` with no auth header at all, against a route
 * guarded for admins, using a character id the SD card asserted. `api/my/character` is the read
 * path for "whoever is asking", and `apiGet()` identifies this device to it (see `api.cpp`), so the
 * server decides which character comes back.
 */
bool fetchCharacter()
{
  String response = apiGet("my/character");
  if (response == "") {
    logRed("Empty character response");
    return false;
  }

  JsonDocument characterObj;
  DeserializationError error = deserializeJson(characterObj, response);
  if (error) {
    logRed("JSON error:");
    logRed(error.c_str());
    return false;
  }

  if (characterObj["name"].is<const char*>() == false) {
    logRed("Character response had no name");
    return false;
  }

  String name = characterObj["name"];
  currentCharacter.id = characterObj["id"];
  currentCharacter.name = name;
  currentCharacter.versionId = characterObj["versionId"];
  String versionName = characterObj["versionName"];
  currentCharacter.versionName = versionName;

  logGreen(name.c_str());
  return true;
}
