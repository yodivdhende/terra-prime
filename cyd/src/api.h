#ifndef API_CLIENT
#define API_CLIENT
    #include <Arduino.h>

    /**
     * GET `{api_url}{path}` with whatever credentials `/config.json` carries, and return the body.
     * Returns an empty String on any failure — no WiFi, a transport error, or a non-200 status.
     */
    String apiGet(const String& path);
#endif
