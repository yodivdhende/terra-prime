#ifndef SD_READER_FUNC
#define SD_READER_FUNC
    #include <FS.h>
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
#endif
