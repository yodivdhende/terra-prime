#ifndef TOUCH_INPUT
#define TOUCH_INPUT

#include <Arduino.h>

/**
 * Touch input, read straight from the XPT2046 — what replaced LVGL's `indev`.
 *
 * One event at a time, drained by `uiLoop()` and handed to the header and then the current screen.
 * There is no gesture recognition beyond what a scrolling list needs: a press, the drags it turns
 * into, and a release that a screen reads as a tap when the finger did not travel.
 */

enum TouchKind {
    /** The finger landed. `x`/`y` are where. */
    TOUCH_DOWN,
    /** The finger moved far enough to be a drag rather than jitter. */
    TOUCH_MOVE,
    /** The finger left, at the last position it was seen. A tap is a `DOWN` that never moved. */
    TOUCH_UP
};

struct TouchEvent {
    TouchKind kind;
    int16_t x;
    int16_t y;
};

/** Claim the touch controller's SPI pins and start from a clean state. Call once from `uiSetup()`. */
void touchSetup();

/** Whether `touchSetup()` has run — i.e. whether boot handed off to the UI. */
bool touchIsReady();

/**
 * Non-blocking: fills `out` with the next event and returns true, or returns false when nothing
 * has changed. Call once per `uiLoop()` tick.
 */
bool touchPoll(TouchEvent& out);

/** Milliseconds since the panel was last touched — what power save measures idleness with. */
uint32_t touchInactiveMs();

/**
 * Treat now as a touch without producing an event.
 *
 * `power.cpp` calls this coming out of light sleep: the whole sleep counted as idle time, so
 * without it the device would drop straight back to sleep before handling the touch that woke it.
 */
void touchNoteActivity();

#endif
