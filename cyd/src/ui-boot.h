#ifndef UI_BOOT
#define UI_BOOT

#include <boot.h>

/**
 * Build the boot screen from the step table and make it the active screen.
 *
 * Call once, right after `ui_init()` — the screen it replaces is whichever one `ui_init()` loaded,
 * and nothing has painted yet at that point, so there is no flash of the Home screen.
 */
void uiBootInit();

/** `BootObserver`-shaped: mark a step and repaint before the caller blocks on it. */
void uiBootSetStep(int index, BootStepState state, const char* detail);

/** Every step passed: hold briefly so the finished list can be read, then go to Home. */
void uiBootFinish();

/** A step failed: stay here and say which, and why. */
void uiBootHalt(int failedIndex);

#endif
