#include <boot.h>
#include <character.h>
#include <connection.h>
#include <log.h>
#include <sd-reader.h>
#include <web-socket.h>

/**
 * What booting this device consists of, as data.
 *
 * The screen and the runner read the same table, so a step cannot be added to one and forgotten in
 * the other — the screen would otherwise quietly claim to list every step while missing one.
 *
 * All four steps used to live commented out in `main.cpp`, each shaped
 * `if (x() == false) { return; }`, which aborted `setup()` before the UI existed: a failure left a
 * device with a blank screen and no way to tell what had happened.
 */

/** The step being run, so the WiFi tick can report progress against the right row. */
static int runningIndex = -1;
static BootObserver currentObserver = NULL;

/**
 * `connectToWifi` takes a plain function pointer, which carries no context, so the index and the
 * observer come from the statics above. Reporting from here is also what keeps the boot screen
 * painting during the one step that can block for twenty seconds.
 */
static void onWifiTick(int secondsElapsed)
{
    if (currentObserver == NULL) return;
    char detail[40];
    snprintf(detail, sizeof(detail), "connecting... %ds", secondsElapsed);
    currentObserver(runningIndex, BOOT_RUNNING, detail);
}

static bool stepWifi()
{
    return connectToWifi(onWifiTick);
}

/**
 * `webSocketSetup()` returns void, and the library connects asynchronously from `loop()` — the
 * socket is not up when this returns and cannot be. So the step reports that the client was
 * configured, which is all it honestly knows, and it cannot fail.
 */
static bool stepWebSocket()
{
    webSocketSetup();
    return true;
}

typedef struct {
    const char* label;
    bool (*run)();
} BootStep;

static const BootStep steps[] = {
    { "SD card and config", setupSD },
    { "WiFi", stepWifi },
    { "Character", fetchCharacter },
    { "Realtime link configured", stepWebSocket }
};

static const int stepCount = (int)(sizeof(steps) / sizeof(steps[0]));

int bootStepCount()
{
    return stepCount;
}

const char* bootStepLabel(int index)
{
    if (index < 0 || index >= stepCount) return "";
    return steps[index].label;
}

int runBootSequence(BootObserver observer)
{
    currentObserver = observer;

    for (int i = 0; i < stepCount; i++) {
        runningIndex = i;
        if (observer != NULL) observer(i, BOOT_RUNNING, NULL);

        const bool ok = steps[i].run();

        if (ok == false) {
            // No reason passed: the step's own logRed has already written it to the panel, right
            // below the list the observer is drawing.
            if (observer != NULL) observer(i, BOOT_FAILED, NULL);
            runningIndex = -1;
            currentObserver = NULL;
            return i;
        }
        if (observer != NULL) observer(i, BOOT_OK, NULL);
    }

    runningIndex = -1;
    currentObserver = NULL;
    return -1;
}
