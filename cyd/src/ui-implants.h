#ifndef UI_IMPLANTS
#define UI_IMPLANTS
    #include <Arduino.h>

/**
 * Give the generated Implants screen its contents. Call once, after `ui_init()`: the screen
 * paints instantly from the SD cache every time it is shown, then refreshes from
 * `api/my/implants` in the background via `async-fetch.h`.
 */
void uiImplantsInit();

/**
 * Called from `uiLoop()` when a background `my/implants` fetch finishes. `body` is "" on
 * failure. Redraws the list only if the fetched body actually differs from what's on screen, and
 * only if the Implants screen is still the one showing.
 */
void uiImplantsApplyFetch(const String& body);

#endif
