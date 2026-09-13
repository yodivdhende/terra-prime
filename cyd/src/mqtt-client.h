// Guard is prefixed: `MQTT_CLIENT` is generic enough to collide with a library define.
#ifndef TP_MQTT_CLIENT_H
#define TP_MQTT_CLIENT_H

#include <Arduino.h>

/**
 * The device's side of the MQTT transport. Configure from `config.json` (`mqtt.host`, `mqtt.port`,
 * `mqtt.username`, `mqtt.password`) and call `mqttSetup()` once the radio is associated.
 */
void mqttSetup();

/** Pump the client, reconnect when the link drops, and re-announce a changed status. */
void mqttLoop();

/** True while the broker session is up. */
bool mqttConnected();

/**
 * Facts this prop witnessed. The handheld is the networked half of a docking — it reads the other
 * board's UID over UART — so it is the one that reports the pairing, for Ports and Printers alike.
 */
void publishPortConnected(String portUid);
void publishPortDisconnected(String portUid);
void publishPrinterConnected(String printerUid);
void publishPrintTaken(String printerUid);

#endif
