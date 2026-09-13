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
#endif
