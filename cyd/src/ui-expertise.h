#ifndef UI_EXPERTISE
#define UI_EXPERTISE
    #include <Arduino.h>

/**
 * Give the generated Expertise screen its contents. Call once, after `ui_init()`: the screen
 * paints instantly from the SD cache every time it is shown, then refreshes from
 * `api/my/expertise` in the background via `async-fetch.h`.
 */
void uiExpertiseInit();

/**
 * Called from `uiLoop()` when a background `my/expertise` fetch finishes. `body` is "" on
 * failure. Redraws the list only if the fetched body actually differs from what's on screen, and
 * only if the Expertise screen is still the one showing.
 */
void uiExpertiseApplyFetch(const String& body);

#endif
