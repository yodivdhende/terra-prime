#ifndef UI_NOTIFY
#define UI_NOTIFY

#include <Arduino.h>

/** How long a `cyd.notify` stays up when the command does not say. */
#define UI_NOTIFY_DEFAULT_MS 5000

/**
 * Put a message in front of whatever the device is showing, without changing screens. The control
 * room uses this to talk to a player mid-game, and the broadcast topic uses it to talk to a room
 * full of props at once — neither should disturb what the player was doing.
 */
void uiNotifyShow(const char *message, uint32_t durationMs);

/** Take the banner down once its time is up. Call from `loop()`. */
void uiNotifyLoop();

#endif
