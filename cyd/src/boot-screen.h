#ifndef BOOT_SCREEN
#define BOOT_SCREEN

#include <boot.h>

/**
 * The boot screen, drawn straight to the panel with TFT_eSPI.
 *
 * Not an LVGL screen, deliberately. LVGL would have to be initialised before the boot steps could
 * be reported, and then everything that blocks during boot needs LVGL pumped by hand to paint at
 * all, the screen has to be allocated and freed around a handover, and all of it competes for heap
 * with the WiFi stack at exactly the wrong moment. Writing text to the panel needs none of that:
 * `screenSetup()` has already initialised the display, a `tft.print` is on the glass when it
 * returns, and LVGL starting afterwards overwrites the whole screen anyway.
 */

/** Draw the title and every step as pending. Call after `screenSetup()`, before the steps run. */
void bootScreenInit();

/** `BootObserver`-shaped: redraw one step's marker, and the detail line under the list. */
void bootScreenSetStep(int index, BootStepState state, const char* detail);

/**
 * A step failed and boot is stopping here.
 *
 * The reason is already on screen: `logRed()` writes to the panel during boot, so whatever the
 * failing step complained about is sitting in the log area below the list.
 */
void bootScreenHalt(int failedIndex);

#endif
