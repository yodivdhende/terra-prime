#ifndef BOOT_SEQUENCE
#define BOOT_SEQUENCE

#include <Arduino.h>

typedef enum {
    BOOT_PENDING,
    BOOT_RUNNING,
    BOOT_OK,
    BOOT_FAILED
} BootStepState;

/**
 * Reported as each step changes state. `detail` is a reason or a progress note, or NULL.
 *
 * The text is only valid for the duration of the call: it may point at a static that the next step
 * overwrites, so copy it rather than keeping the pointer.
 */
typedef void (*BootObserver)(int index, BootStepState state, const char* detail);

/** How many steps there are, and what each is called. The boot screen builds its rows from these. */
int bootStepCount();
const char* bootStepLabel(int index);

/**
 * Run every step in order, reporting each state change.
 *
 * Returns the index of the first step that failed, or -1 when all of them passed. Stops at the
 * first failure: nothing after a failed step is attempted, and nothing after it is reported either.
 */
int runBootSequence(BootObserver observer);

#endif
