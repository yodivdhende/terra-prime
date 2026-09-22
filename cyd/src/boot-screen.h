#ifndef BOOT_SCREEN
#define BOOT_SCREEN

#include <boot.h>

/**
 * The boot screen, drawn straight to the panel with TFT_eSPI.
 *
 * This was always the odd one out — every game screen was an LVGL object tree and this was not —
 * because a framework here would have to be initialised before the boot steps could be reported,
 * pumped by hand so anything that blocks still paints, and would compete for heap with the WiFi
 * stack at exactly the wrong moment. Since [TP-0239] the game screens draw this way too, and
 * `gfx-draw.cpp` is this file's clear-then-print discipline generalised. Nothing here changed.
 */

/** Draw the title and every step as pending. Call after `screenSetup()`, before the steps run. */
void bootScreenInit();

/** `BootObserver`-shaped: redraw one step's marker, and the detail line under the list. */
void bootScreenSetStep(int index, BootStepState state, const char* detail);

/**
 * Append a line to the log area under the step list.
 *
 * The area only fits so many rows; once it is full, the oldest line is dropped and the rest scroll
 * up by one to make room, the way a terminal does, so the most recent output is always the part
 * that stays on screen. `log.cpp` calls this for every `log*` while the panel is boot's to write to.
 */
void bootScreenLog(const char* message, uint16_t colour);

/**
 * A step failed and boot is stopping here.
 *
 * The reason is already on screen: `logRed()` writes to the panel during boot, so whatever the
 * failing step complained about is sitting in the log area below the list.
 */
void bootScreenHalt(int failedIndex);

#endif
