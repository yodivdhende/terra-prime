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
     * The last message passed to `logRed`, or "" if there has been none.
     *
     * The boot screen halts on the step that failed, and the reason a step failed is only ever
     * stated in a `logRed` call. This is how that reason reaches the screen without touching the
     * call sites. The pointer is to a mutable static: copy the text, do not keep the pointer.
     */
    const char* logLastError();
#endif
