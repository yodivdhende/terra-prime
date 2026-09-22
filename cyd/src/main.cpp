#include <Arduino.h>
#include <boot.h>
#include <boot-screen.h>
#include <globals.h>
#include <log.h>
#include <ui-implementation.h>
#include <uart-interface.h>
#include <web-socket.h>
#include <power.h>

/**
 * Boot draws straight to the panel, and then the UI does too — `uiSetup()` just turns the panel
 * landscape and takes ownership of it.
 *
 * The four network steps used to sit commented out here, each shaped
 * `if (x() == false) { return; }` — so a failure aborted `setup()` silently and a success reported
 * only to whoever had a serial cable attached. They run for real now, against a boot screen that
 * names every step and marks each as it goes.
 *
 * A failed step stops here: `uiSetup()` is never reached, so the boot screen and the reason under
 * it stay on the panel instead of being overwritten by a UI the device cannot use anyway.
 */

/** Long enough to read the finished list, short enough not to keep a player waiting. */
#define BOOT_HOLD_MS 1200

/** Whether every step passed. Nothing in `loop()` has anything to do if they did not. */
static bool bootOk = false;

void setup () {
  Serial.begin(115200);
  screenSetup();
  powerSetup();
  logWhite("booting " FIRMWARE_VERSION);

  bootScreenInit();
  const int failedStep = runBootSequence(bootScreenSetStep);
  bootOk = failedStep < 0;

  if (bootOk == false) {
    bootScreenHalt(failedStep);
    return;
  }

  delay(BOOT_HOLD_MS);
  uiSetup();
}


void loop (){
  // Runs regardless of boot success: it touches only the I2C battery IC and the radio's power
  // mode, neither of which depends on the UI, the WebSocket client, or the boot screen.
  powerLoop();

  // Nothing else is safe to run after a halt: the UI was never started, the WebSocket client
  // may never have been begun, and the config naming the server may never have been read. The
  // boot screen needs no upkeep — it is drawn on the panel, not rendered.
  if (bootOk == false) return;

  uiLoop();
  webSocketLoop();
  uartSerialLoop();
}
