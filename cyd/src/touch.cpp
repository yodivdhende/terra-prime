#include <touch.h>
#include <globals.h>
#include <XPT2046_Touchscreen.h>

/**
 * See `touch.h`.
 *
 * The coordinate mapping is the one LVGL's `my_touchpad_read()` used, with its auto-calibration
 * taken out. That code widened the raw bounds whenever a reading fell outside them and never
 * narrowed them again, so a single spurious sample — which a resistive panel produces on any hard
 * press near an edge — permanently squashed every coordinate afterwards, for the rest of the
 * session. The bounds are constants now; a reading outside them is clamped, not learned from.
 */

/** Raw XPT2046 range the panel actually spans, in the rotation `screenSetup()` leaves it in. */
#define TOUCH_RAW_MIN_X 200
#define TOUCH_RAW_MAX_X 3700
#define TOUCH_RAW_MIN_Y 240
#define TOUCH_RAW_MAX_Y 3800

/**
 * How far a finger has to travel before a press becomes a drag.
 *
 * Below this the position is not even reported, so a list does not scroll by a pixel under a
 * stationary thumb and a tap stays a tap.
 */
#define TOUCH_MOVE_THRESHOLD 4

/**
 * How long the controller has to report nothing before a release is believed.
 *
 * A resistive panel drops contact for a sample or two mid-drag. Without this, one dropped sample
 * ends the drag and starts a new one, which reads as a scroll that sticks.
 */
#define TOUCH_RELEASE_DEBOUNCE_MS 40

static bool ready = false;
static bool pressed = false;
static bool releasePending = false;
static uint32_t releasedAt = 0;
static uint32_t lastActivityAt = 0;
static int16_t lastX = 0;
static int16_t lastY = 0;

static int16_t clampToPanel(long value, int16_t limit)
{
    if (value < 0) return 0;
    if (value > limit) return limit;
    return (int16_t)value;
}

void touchSetup()
{
    // `setupSD()` stole the touch controller's VSPI pins during boot (see the shared-VSPI gotcha
    // in CLAUDE.md), so reclaim them before the first read or nothing responds to a tap.
    reattachTouch();
    pressed = false;
    releasePending = false;
    lastActivityAt = millis();
    ready = true;
}

bool touchIsReady()
{
    return ready;
}

bool touchPoll(TouchEvent& out)
{
    if (ready == false) return false;

    if (ts.touched()) {
        const TS_Point point = ts.getPoint();
        const int16_t x = clampToPanel(map(point.x, TOUCH_RAW_MIN_X, TOUCH_RAW_MAX_X, 0, screenWidth - 1),
                                       screenWidth - 1);
        const int16_t y = clampToPanel(map(point.y, TOUCH_RAW_MIN_Y, TOUCH_RAW_MAX_Y, 0, screenHeight - 1),
                                       screenHeight - 1);

        lastActivityAt = millis();
        releasePending = false;

        if (pressed == false) {
            pressed = true;
            lastX = x;
            lastY = y;
            out.kind = TOUCH_DOWN;
            out.x = x;
            out.y = y;
            return true;
        }

        if (abs(x - lastX) < TOUCH_MOVE_THRESHOLD && abs(y - lastY) < TOUCH_MOVE_THRESHOLD) {
            return false;
        }
        lastX = x;
        lastY = y;
        out.kind = TOUCH_MOVE;
        out.x = x;
        out.y = y;
        return true;
    }

    if (pressed == false) return false;

    if (releasePending == false) {
        releasePending = true;
        releasedAt = millis();
        return false;
    }
    if (millis() - releasedAt < TOUCH_RELEASE_DEBOUNCE_MS) return false;

    pressed = false;
    releasePending = false;
    // The controller reports nothing at all on release, so the release lands where the finger last
    // was — which is also what makes a tap's position the position it went down at.
    out.kind = TOUCH_UP;
    out.x = lastX;
    out.y = lastY;
    return true;
}

uint32_t touchInactiveMs()
{
    return millis() - lastActivityAt;
}

void touchNoteActivity()
{
    lastActivityAt = millis();
}
