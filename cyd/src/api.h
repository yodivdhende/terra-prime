#ifndef API_CLIENT
#define API_CLIENT
    #include <Arduino.h>

    struct ApiResult {
        /** Response body. "" when the request failed and nothing was stored for this path. */
        String body;
        /** True when `body` is a stored copy rather than a live answer. */
        bool stale;
    };

    /**
     * GET `{api_url}{path}` with this device's credentials, storing the answer for next time and
     * falling back to the stored one when the request fails.
     *
     * `characterVersionId` is the version the caller believes this device is bound to; a stored
     * body for a different version is not used. Pass 0 for a request whose answer says which
     * version that is.
     */
    ApiResult apiGet(const String& path, int characterVersionId);

    /**
     * The live request alone, with no cache read or write — `apiGet()`'s network half. Returns ""
     * for anything that is not a 200 with a body.
     *
     * Exposed so `async-fetch.cpp` can run it on a background task: it touches only WiFi/HTTP, never
     * the SD card, which is what makes it safe to call off the main loop (see `async-fetch.h`).
     */
    String apiHttpGet(const String& path);
#endif
