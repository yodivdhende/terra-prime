#ifndef MQTT_CLIENT
#define MQTT_CLIENT

#include <Arduino.h>

void mqttSetup();
void mqttLoop();
void sendLink(String token, boolean status);

#endif
