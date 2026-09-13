#ifndef API_CACHE
#define API_CACHE
    #include <Arduino.h>

    /**
     * The last response body stored for `path`, or "" when there is nothing usable.
     *
     * `characterVersionId` is the version the caller currently believes this device is bound to.
     * A body stored for a different version is discarded rather than returned: an AguesGuard
     * re-bound to another character must not fall back to the previous player's numbers. Pass 0
     * to accept whatever is stored, for a request whose answer *is* which version this is.
     */
    String cacheRead(const String& path, int characterVersionId);

    /** Store `body` as the answer for `path`, replacing whatever was there. */
    void cacheWrite(const String& path, const String& body, int characterVersionId);
#endif
