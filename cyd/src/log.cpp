#include <log.h>

/**
 * Serial only.
 *
 * These used to write to the `tft` object as well, which was fine while the boot sequence owned the
 * display and a documented hazard afterwards — raw TFT writes corrupt whatever LVGL has drawn. LVGL
 * now starts before any of the boot steps run, so there is no longer a window in which writing to
 * the panel from here is safe. The boot screen shows progress instead, and `logLastError()` carries
 * a failure reason to it.
 */

static char lastError[96] = "";

static void remember(const char* message)
{
  snprintf(lastError, sizeof(lastError), "%s", message);
}

const char* logLastError()
{
  return lastError;
}

/** Both format overloads cap at the same size; `param` is the only substitution any caller uses. */
static void formatInto(char* buffer, size_t size, const char* log, const char* param)
{
  snprintf(buffer, size, log, param);
}

void logWhite(const char* log) {
    Serial.println(log);
}

void logWhite(const char* log, const char* param)
{
  char buffer[253];
  formatInto(buffer, sizeof(buffer), log, param);
  Serial.println(buffer);
}

void logGreen(const char* log)
{
  Serial.println(log);
}

void logGreen(const char* log, const char* param)
{
  char buffer[253];
  formatInto(buffer, sizeof(buffer), log, param);
  Serial.println(buffer);
}

void logRed(const char* log)
{
  Serial.println(log);
  remember(log);
}

void logRed(const char* log, const char* param)
{
  char buffer[253];
  formatInto(buffer, sizeof(buffer), log, param);
  Serial.println(buffer);
  remember(buffer);
}
