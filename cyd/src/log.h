#ifndef LOG_FUNC 
#define LOG_FUNC 

    #include <Arduino.h>

    void logWhite(const char* log);
    void logWhite(const char* log, const char* param);
    void logGreen(const char* log);
    void logGreen(const char* log, const char* param);
    void logRed(const char* log);
    void logRed(const char* log, const char* param);

    /**
     * Whether these also write to the panel. On until `uiSetup()` turns it off.
     *
     * Boot reports through these calls and the boot screen is drawn the same way, so the panel is
     * the right destination until the UI owns the display — after which a raw write corrupts
     * whatever the current screen has drawn.
     */
    void logSetTftEnabled(bool enabled);
#endif
