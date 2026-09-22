#include <log.h>
#include <globals.h>
#include <boot-screen.h>

/**
 * Serial always; the panel only while boot owns it.
 *
 * `bootScreenLog()` is how the boot steps report — the boot screen is drawn the same way — but raw
 * writes corrupt whatever the current screen has drawn, so `uiSetup()` turns the panel output off as it takes the
 * display over. That is why a `logRed` from a failing boot step lands on the boot screen (scrolling
 * the log area, same as every other line) while one from `api.cpp` at runtime goes to Serial alone.
 */

static bool tftEnabled = true;

void logSetTftEnabled(bool enabled)
{
  tftEnabled = enabled;
}

static void emit(const char* message, uint16_t colour)
{
  Serial.println(message);
  if (tftEnabled == false) return;
  bootScreenLog(message, colour);
}

/** `param` is the only substitution any caller uses. */
static void emitFormatted(const char* log, const char* param, uint16_t colour)
{
  char buffer[253];
  snprintf(buffer, sizeof(buffer), log, param);
  emit(buffer, colour);
}

void logWhite(const char* log)                        { emit(log, TFT_WHITE); }
void logWhite(const char* log, const char* param)     { emitFormatted(log, param, TFT_WHITE); }
void logGreen(const char* log)                        { emit(log, TFT_GREEN); }
void logGreen(const char* log, const char* param)     { emitFormatted(log, param, TFT_GREEN); }
void logRed(const char* log)                          { emit(log, TFT_RED); }
void logRed(const char* log, const char* param)       { emitFormatted(log, param, TFT_RED); }
