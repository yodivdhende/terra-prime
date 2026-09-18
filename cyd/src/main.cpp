#include <Arduino.h>
#include <boot.h>
#include <globals.h>
#include <log.h>
#include <ui-boot.h>
#include <ui-implementation.h>
#include <uart-interface.h>
#include <web-socket.h>

/**
 * LVGL comes up before the boot steps run, which is the reverse of how this used to be.
 *
 * The four network steps used to sit commented out ahead of `uiSetup()`, each aborting `setup()` on
 * failure — so a failed boot produced a device with no UI at all, and a successful one reported its
 * progress by writing raw text to the panel, which is why `log.cpp` no longer touches the TFT. With
 * the UI first, the boot screen can show every step as it happens and stay on the one that broke.
 */

/** Whether every boot step passed. The loop handlers below have nothing to do if they did not. */
static bool bootOk = false;

void setup () {
  Serial.begin(115200);
  logWhite("booting " FIRMWARE_VERSION);

  screenSetup();
  clearScreen();
  uiSetup();

  // Replaces the screen ui_init() loaded. Nothing has painted yet, so Home never flashes.
  uiBootInit();

  const int failedStep = runBootSequence(uiBootSetStep);
  bootOk = failedStep < 0;

  if (bootOk) uiBootFinish();
  else uiBootHalt(failedStep);
}


void loop (){
  // Always: the halted boot screen is still being repainted from here, and on a good boot this is
  // what fires the timer that hands over to Home.
  uiLoop();

  // A halt can happen before the WebSocket step ran and before the config that names the server
  // was read, so neither of these has anything to talk to.
  if (bootOk == false) return;

  webSocketLoop();
  uartSerialLoop();
}
