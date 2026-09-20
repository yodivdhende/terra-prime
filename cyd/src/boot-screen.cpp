#include <boot-screen.h>
#include <TFT_eSPI.h>
#include <globals.h>

/**
 * Layout, in the portrait orientation `screenSetup()` leaves the panel in — 240 across by 320
 * down, which is 20 lines of text rather than the 15 landscape would give. The boot log is what
 * wants them, so boot keeps the long edge vertical and `uiSetup()` turns it to landscape:
 *
 *     AguesGuard V0.0.4            <- title
 *     ok  SD card and config       <- one row per boot step, marker redrawn as it changes
 *     >>  WiFi
 *     ..  Character
 *     ..  Realtime link configured
 *     connecting... 7s             <- detail line, overwritten in place
 *     (log output fills the rows below, scrolling once they run out)
 *
 * Markers are cleared with a filled rectangle before being drawn, because font 2 is proportional
 * and a shorter marker would otherwise leave the tail of the previous one behind.
 */

#define TITLE_Y 4
#define LIST_Y 28
/** Row pitch: the glyph box plus 2px of leading. */
#define ROW_HEIGHT 18
/** Height of a font-2 glyph. Clears use this, not the pitch, so they cannot bleed into the next row. */
#define FONT_HEIGHT 16
#define MARKER_X 6
#define MARKER_WIDTH 26
#define LABEL_X 34
/** Clear air under the detail line, so clearing it can never clip the first line of log output. */
#define LOG_GAP 8
/**
 * Upper bound on how many log rows the area under the list could ever hold, sized for a panel taller
 * than this device has. `bootScreenInit()` computes the real capacity from what is actually left
 * below the step list and never exceeds this.
 */
#define MAX_LOG_LINES 16
/** Long enough for the widest line boot logs (matches the `detail` buffer in `boot.cpp`). */
#define LOG_LINE_LEN 40

static int detailY = 0;

/** The scrolling log buffer under the detail line. */
static char logLines[MAX_LOG_LINES][LOG_LINE_LEN];
static uint16_t logColours[MAX_LOG_LINES];
static int logLineCount = 0;
/** How many rows actually fit below the list, computed in `bootScreenInit()`. */
static int logCapacity = 0;
static int logY = 0;

/**
 * `log*` prints at whatever the cursor happens to be, and drawing a row or the detail line moves
 * it. Without putting it back, a `logRed` from a failing step lands on top of the step list instead
 * of in the log area below it.
 */
class KeepCursor {
public:
    KeepCursor() : x(tft.getCursorX()), y(tft.getCursorY()) {}
    ~KeepCursor() { tft.setCursor(x, y); }
private:
    int16_t x;
    int16_t y;
};

static int rowY(int index)
{
    return LIST_Y + index * ROW_HEIGHT;
}

/**
 * The panel is portrait while boot owns it, so it is `screenHeight` across and `screenWidth` tall
 * — the globals are named for the landscape orientation LVGL switches to, and read backwards here.
 */
#define PANEL_WIDTH screenHeight
/** Same backwards reading as `PANEL_WIDTH`: portrait height is `screenWidth`. */
#define PANEL_HEIGHT screenWidth

/** Clear a band the full width of the screen. */
static void clearBand(int y, int height)
{
    tft.fillRect(0, y, PANEL_WIDTH, height, TFT_BLACK);
}

static void drawMarker(int index, const char* marker, uint16_t colour)
{
    tft.fillRect(MARKER_X, rowY(index), MARKER_WIDTH, FONT_HEIGHT, TFT_BLACK);
    tft.setTextColor(colour, TFT_BLACK);
    tft.setCursor(MARKER_X, rowY(index));
    tft.print(marker);
}

void bootScreenInit()
{
    tft.fillScreen(TFT_BLACK);

    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.setCursor(MARKER_X, TITLE_Y);
    tft.print("AguesGuard " FIRMWARE_VERSION);

    const int count = bootStepCount();
    for (int i = 0; i < count; i++) {
        drawMarker(i, "..", TFT_DARKGREY);
        tft.setTextColor(TFT_WHITE, TFT_BLACK);
        tft.setCursor(LABEL_X, rowY(i));
        tft.print(bootStepLabel(i));
    }

    detailY = rowY(count) + 6;
    // Log output starts below the detail line, so a logRed from a failing step lands under the
    // list instead of on top of it, with a gap so redrawing the detail cannot clip it.
    logY = detailY + ROW_HEIGHT + LOG_GAP;
    logCapacity = (PANEL_HEIGHT - logY) / ROW_HEIGHT;
    if (logCapacity > MAX_LOG_LINES) logCapacity = MAX_LOG_LINES;
    if (logCapacity < 0) logCapacity = 0;
    logLineCount = 0;
}

void bootScreenLog(const char* message, uint16_t colour)
{
    if (logCapacity <= 0) return;
    const KeepCursor keep;

    char line[LOG_LINE_LEN];
    snprintf(line, sizeof(line), "%s", message);

    if (logLineCount < logCapacity) {
        memcpy(logLines[logLineCount], line, sizeof(line));
        logColours[logLineCount] = colour;
        logLineCount++;
    } else {
        // Full: drop the oldest line and shift the rest up a row, same as a terminal scrolling.
        for (int i = 1; i < logCapacity; i++) {
            memcpy(logLines[i - 1], logLines[i], LOG_LINE_LEN);
            logColours[i - 1] = logColours[i];
        }
        memcpy(logLines[logCapacity - 1], line, sizeof(line));
        logColours[logCapacity - 1] = colour;
    }

    clearBand(logY, logCapacity * ROW_HEIGHT);
    for (int i = 0; i < logLineCount; i++) {
        tft.setTextColor(logColours[i], TFT_BLACK);
        tft.setCursor(MARKER_X, logY + i * ROW_HEIGHT);
        tft.print(logLines[i]);
    }
}

void bootScreenSetStep(int index, BootStepState state, const char* detail)
{
    if (index < 0 || index >= bootStepCount()) return;
    const KeepCursor keep;

    switch (state) {
        case BOOT_PENDING: drawMarker(index, "..", TFT_DARKGREY); break;
        case BOOT_RUNNING: drawMarker(index, ">>", TFT_WHITE);    break;
        case BOOT_OK:      drawMarker(index, "ok", TFT_GREEN);    break;
        case BOOT_FAILED:  drawMarker(index, "!!", TFT_RED);      break;
    }

    if (detail != NULL && detail[0] != '\0') {
        // In place: the WiFi step reports once a second and must not scroll the list away.
        clearBand(detailY, FONT_HEIGHT);
        tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
        tft.setCursor(MARKER_X, detailY);
        tft.print(detail);
    }
}

void bootScreenHalt(int failedIndex)
{
    const KeepCursor keep;
    clearBand(detailY, FONT_HEIGHT);
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.setCursor(MARKER_X, detailY);
    tft.print(bootStepLabel(failedIndex));
    tft.print(" failed");
}
