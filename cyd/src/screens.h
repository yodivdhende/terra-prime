#ifndef SCREENS
#define SCREENS

#include <Arduino.h>
#include <screen.h>

/**
 * Every screen the device has, and the handful of entry points other modules reach them through.
 *
 * One header rather than one per screen: a `Screen` is a static table, so a screen's whole public
 * surface is the accessor that returns a pointer to it, and collecting them here is what keeps
 * `screen.cpp` free of an include per screen.
 */

/** The three-button menu the device boots to and every home-button press returns to. */
const Screen* screenHome();
/** A bar per expertise, under a bar for the group it belongs to. Bars, never numbers. */
const Screen* screenExpertise();
/** Every implant the character carries, each with its description word-wrapped. */
const Screen* screenImplants();
/** An empty stub today, as it was under SquareLine. */
const Screen* screenMessages();
/** The animated progress bar an admin pushes over the WebSocket. */
const Screen* screenLoading();
/** Full-bleed. Pushed over the WebSocket. */
const Screen* screenLoot();
/** Full-bleed, and red. Pushed over the WebSocket. */
const Screen* screenVirus();

/*
 * The WebSocket router calls these three by name. They keep the names SquareLine's transition files
 * gave them so `web-socket.cpp`'s `handleMessage()` needs no change beyond which header it includes.
 */

/** Show the loading screen and restart its bar from empty. */
void UiLoadingSetup();
void UiLootSetup();
void UiVirusSetup();

/**
 * Called from `uiLoop()` when a background `my/expertise` fetch finishes. `body` is "" on failure.
 * Redraws only if the fetched body actually differs from what is on screen, and only if Expertise
 * is still the screen showing.
 */
void uiExpertiseApplyFetch(const String& body);

/** The same, for `my/implants`. */
void uiImplantsApplyFetch(const String& body);

#endif
