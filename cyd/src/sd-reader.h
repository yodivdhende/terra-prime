#ifndef SD_READER_FUNC
#define SD_READER_FUNC
    #include <FS.h>
    #include <globals.h>
    bool setupSD();
    bool readConfig(fs::FS &fs);
    /** Whether the card mounted at boot, so the cache knows there is anywhere to write. */
    bool isSdReady();
    /**
     * Re-attaches the SD card to its SPI pins, symmetric to `globals.cpp`'s `reattachTouch()`.
     * `reattachTouch()` permanently reclaims VSPI's MISO line for touch once the UI comes up, so
     * this has to be called before any runtime card access or every command fails against a line
     * that is no longer wired to the card. `SD.begin()` and `SPIClass::begin()` each no-op once
     * already attached, so both `SD.end()` and the underlying `SPIClass`'s `end()` are needed
     * first, or the "reattach" silently does nothing.
     */
    void reattachSd();

    /**
     * Holds VSPI's MISO line for the SD card for as long as it is in scope, then hands it back to
     * touch — so every return path out of a card access leaves the bus where the UI expects it.
     *
     * Every runtime read of the card goes through one of these. It used to be file-static in
     * `cache.cpp`, which was the only runtime reader; `gfx-icon.cpp` now reads the icon pack while
     * the UI is live and needs exactly the same guard. Wrap the widest access you can — one hold
     * around a whole list repaint, not one per icon — since touch is never read mid-repaint.
     */
    struct SdBusHold {
        SdBusHold() { reattachSd(); }
        ~SdBusHold() { reattachTouch(); }
    };
#endif
