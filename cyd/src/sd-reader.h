#ifndef SD_READER_FUNC
#define SD_READER_FUNC
    #include <FS.h>
    bool setupSD();
    bool readConfig(fs::FS &fs);
    /** Whether the card mounted at boot, so the cache knows there is anywhere to write. */
    bool isSdReady();
#endif
