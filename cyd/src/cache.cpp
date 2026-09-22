#include <cache.h>
#include <Arduino.h>
#include <FS.h>
#include <SD.h>
#include <globals.h>
#include <sd-reader.h>

/**
 * A copy on the SD card of the last answer the site gave for each `api/my` path, so the prop
 * keeps showing the player's own sheet when the network goes.
 *
 * The card is already mounted at boot for `/config.json` and has no size limit worth worrying
 * about, which NVS would (its per-value ceiling is a few kilobytes and a long expertise list could
 * reach it). Nothing here can race the touch controller it shares the VSPI bus with: drawing and
 * touch reads are both driven from `loop()`, one at a time. They do fight over VSPI's MISO line
 * rather than the CPU, though — `reattachTouch()` leaves it wired to touch, so every access here
 * reclaims it with `reattachSd()` first and hands it back on the way out, via `sd-reader.h`'s
 * `SdBusHold`.
 *
 * Each file is a header line then the body:
 *
 *     1<TAB><characterVersionId>
 *     {"characterId":...}
 *
 * The leading `1` is the format version, so a later change to this layout can reject old files
 * instead of misreading them.
 */

#define CACHE_DIR "/cache"
#define CACHE_FORMAT "1"

/** `my/expertise` -> `/cache/my-expertise.json`. Slashes are the only character worth folding. */
static String cachePath(const String& path)
{
    String name = CACHE_DIR "/";
    for (const char* c = path.c_str(); *c; ++c) name += (*c == '/') ? '-' : *c;
    name += ".json";
    return name;
}

static String readWholeFile(File& file)
{
    String contents = "";
    contents.reserve(file.size());
    while (file.available()) contents += (char)file.read();
    return contents;
}

String cacheRead(const String& path, int characterVersionId)
{
    if (isSdReady() == false) return "";
    SdBusHold busHold;

    File file = SD.open(cachePath(path));
    if (!file) return "";
    const String contents = readWholeFile(file);
    file.close();

    const int headerEnd = contents.indexOf('\n');
    if (headerEnd < 0) return "";
    const String header = contents.substring(0, headerEnd);

    const int separator = header.indexOf('\t');
    if (separator < 0) return "";
    if (header.substring(0, separator) != CACHE_FORMAT) {
        Serial.println("cache: ignoring a file written in an older format");
        return "";
    }

    const int storedVersion = header.substring(separator + 1).toInt();
    if (characterVersionId != 0 && storedVersion != characterVersionId) {
        Serial.println("cache: stored body is for another character version, ignoring it");
        return "";
    }

    return contents.substring(headerEnd + 1);
}

/**
 * Written to a temporary file and renamed, because the prop is battery powered and gets switched
 * off mid-sentence: a half-written file would parse as garbage on the next boot, where the previous
 * complete one still answers.
 */
void cacheWrite(const String& path, const String& body, int characterVersionId)
{
    if (isSdReady() == false) return;
    if (body == "") return;
    SdBusHold busHold;

    SD.mkdir(CACHE_DIR);
    const String target = cachePath(path);
    const String temporary = target + ".part";

    File file = SD.open(temporary, FILE_WRITE);
    if (!file) {
        Serial.print("cache: cannot write ");
        Serial.println(temporary.c_str());
        return;
    }
    file.print(CACHE_FORMAT "\t");
    file.print(characterVersionId);
    file.print("\n");
    const size_t written = file.print(body);
    file.close();

    if (written != body.length()) {
        Serial.println("cache: short write, leaving the previous file in place");
        SD.remove(temporary);
        return;
    }

    SD.remove(target);
    if (SD.rename(temporary, target) == false) {
        Serial.println("cache: rename failed");
        SD.remove(temporary);
    }
}
