#ifndef SCREEN_NAV
#define SCREEN_NAV

#include <Arduino.h>
#include <touch.h>

/**
 * The navigation model, replacing SquareLine's `_ui_screen_change()`.
 *
 * One screen is on the panel at a time and it owns the whole panel. There is no z-order, no
 * overlapping window, and no slide animation — a screen change is a repaint, about 22ms at 55MHz
 * for 320x240, which is quicker than the animation it replaces. Screens are static `Screen` values,
 * not object trees: nothing is allocated when one is shown and nothing is freed when it is left, so
 * the seven screens the device has cost seven function-pointer tables in flash and no heap at all.
 */
struct Screen {
    /** Drawn in the heading band, uppercased. Ignored when `showHeader` is false. */
    const char* heading;
    /** Whether the shared header and the heading band are drawn. False is full-bleed. */
    bool showHeader;
    /** Called before the content is painted — where a screen reads its cache and starts a fetch. */
    void (*enter)();
    /** Paint the content area. Called on every `screenShow()`, after `enter()`. */
    void (*draw)();
    /** Called every `uiLoop()` while this screen is showing. NULL for a screen with no animation. */
    void (*tick)();
    /** Handle one touch event; return true when it was consumed. Called after the header. */
    bool (*touch)(const TouchEvent& event);
};

/** Make `screen` the one on the panel: frame, header, heading, then its own content. */
void screenShow(const Screen* screen);

/** The screen currently on the panel, or NULL before `uiSetup()` has shown the first one. */
const Screen* screenCurrent();

/**
 * Navigate to Home.
 *
 * The single back-navigation path on the device, replacing `ui_event_comp_Header_HomeImage`. The
 * header's home button is the only thing that calls it.
 */
void screenGoHome();

/**
 * Route one touch event: the header gets first refusal, then the current screen.
 *
 * The order matters. A home-button press must never also reach the screen under it, or a tap that
 * navigates away would first scroll the list it was leaving.
 */
void screenHandleTouch(const TouchEvent& event);

/** Drive the current screen's animation, if it has one. Called once per `uiLoop()`. */
void screenTick();

#endif
