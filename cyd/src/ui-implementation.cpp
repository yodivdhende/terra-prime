#include <ui-implementation.h>
#include <TFT_eSPI.h>
#include <async-fetch.h>
#include <cache.h>
#include <character.h>
#include <connection.h>
#include <gfx-header.h>
#include <gfx-theme.h>
#include <globals.h>
#include <log.h>
#include <power.h>
#include <screen.h>
#include <screens.h>
#include <touch.h>

/**
 * Where boot hands the panel over, and the loop that keeps the UI alive.
 *
 * There is no framework under this any more. `uiLoop()` reads one touch event, gives it to the
 * header and then the current screen, lets the screen advance whatever animation it has, and drains
 * a finished background fetch — and that is the whole of it. What used to be `lv_timer_handler()`
 * is gone, along with the 23 KB draw buffer it fed, the seven screen object trees created eagerly
 * by `ui_init()` and never freed, and the image and layer caches behind them.
 *
 * `main.cpp` needs no change: `uiSetup()` and `uiLoop()` keep their names and their contract.
 */

/** How often the header's WiFi and battery cells are re-checked. The readings move far slower. */
#define STATUS_REFRESH_MS 2000

/** Paced the way the LVGL loop was, so nothing else in `loop()` is starved by a busy UI. */
#define UI_LOOP_DELAY_MS 5

static uint32_t lastStatusAt = 0;

/**
 * Push the two indicators that have a real data source into the header.
 *
 * The setters repaint only their own cell and only when the value actually changed, so calling
 * this on a timer costs nothing while the readings are steady. The clock is not driven: the device
 * has neither an RTC nor an NTP client, so it stays the placeholder the header draws it as.
 */
static void refreshStatusCells()
{
    if (millis() - lastStatusAt < STATUS_REFRESH_MS) return;
    lastStatusAt = millis();

    const Screen* screen = screenCurrent();
    if (screen == NULL || screen->showHeader == false) return;

    headerSetWifi(wifiStrengthLevel());
    const BatteryReading battery = batteryReading();
    headerSetBattery(battery.metered ? battery.percentage : -1, battery.charging);
}

void uiSetup()
{
    // The UI owns the display from here: raw `log*` writes have to stop, and the panel turns from
    // the portrait the boot screen used to the landscape every game screen is designed for.
    logSetTftEnabled(false);
    tft.setRotation(1);

    // Both of these are needed before a single header glyph will render, and both are set exactly
    // once. UTF-8 decoding is on at construction (`TFT_eSPI.cpp:471`), which makes `decodeUTF8()`
    // swallow any byte >= 0x80 as a lead byte — so `0xDB`, `0xB0`-`0xB2` and `0xF9` would draw
    // nothing at all. CP437 correction is off by default, which shifts every GLCD code above 175
    // by one (`TFT_eSPI.cpp:3202`) — so the shade blocks would draw, but the wrong ones.
    tft.setAttribute(UTF8_SWITCH, false);
    tft.setAttribute(CP437_SWITCH, true);

    // Every primitive positions text itself, from the top-left of the glyph box.
    tft.setTextDatum(TL_DATUM);

    touchSetup();
    screenShow(screenHome());

    Serial.printf("ui: setup done, free heap %u\n", (unsigned)ESP.getFreeHeap());
}

void uiLoop()
{
    TouchEvent event;
    if (touchPoll(event)) screenHandleTouch(event);

    screenTick();
    refreshStatusCells();

    // The only place a background `async-fetch` result is drained: writing it to the SD cache and
    // redrawing the screen it belongs to both have to happen from the main loop, the one thread
    // allowed near the SD card and touch controller's shared VSPI bus (see `async-fetch.h`).
    String path, body;
    if (asyncFetchPoll(path, body)) {
        if (body != "") cacheWrite(path, body, currentCharacter.versionId);
        if (path == "my/expertise") uiExpertiseApplyFetch(body);
        else if (path == "my/implants") uiImplantsApplyFetch(body);
    }

    delay(UI_LOOP_DELAY_MS);
}
