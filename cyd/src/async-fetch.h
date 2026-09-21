#ifndef ASYNC_FETCH
#define ASYNC_FETCH
    #include <Arduino.h>

    /**
     * A small background GET, so a screen can refresh over the network without blocking the LVGL
     * loop (and the touch reads that share it) for the round trip.
     *
     * Knows nothing about expertise, implants, or the SD cache — it runs `apiHttpGet()` on a
     * FreeRTOS task and hands the raw body back. That's deliberate: the SD card and the touch
     * controller share one VSPI bus and only one may hold MISO at a time (see the shared-VSPI
     * gotcha in `CLAUDE.md`), and the existing code keeps that safe by only ever touching either
     * from the single-threaded main loop. A task here that also called `cacheWrite()` or touched
     * LVGL would break that invariant. So the task does only the network call; `uiLoop()` is the
     * one place that drains a finished fetch and is the one place that writes it to the cache.
     */

    /**
     * Start a background GET of `path` if one isn't already in flight for it. Silently does nothing
     * if the in-flight table (capacity 2 — one per screen using this today) is already full of
     * other paths; the caller can just try again next time its screen loads.
     */
    void asyncFetchStart(const String& path);

    /**
     * Non-blocking: drains one finished fetch, if any are waiting, into `outPath`/`outBody` and
     * returns true. `outBody` is "" when the request failed — same as `apiHttpGet()` returning "".
     * Call this once per `uiLoop()` tick.
     */
    bool asyncFetchPoll(String& outPath, String& outBody);
#endif
