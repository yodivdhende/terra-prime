#include <Arduino.h>
#include <globals.h>
#include <log.h>
#include <TFT_eSPI.h>
#include <ArduinoJson.h>
#include <sd-reader.h>
#include <connection.h>
#include <character.h>
#include <ui-implementation.h>
#include <uart-interface.h>
#include <mqtt-client.h>

void setup () {
  Serial.begin(115200);
  screenSetup();
  logWhite("booting V0.0.4");
  // if(setupSD() == false) {
  //   return;
  // };
  // if(connectToWifi() == false){
  //   return;
  // };
  // if(fetchCharacter() == false){
  //   return;
  // };
  // mqttSetup();
  clearScreen();
  uiSetup(); 
}


void loop (){
  uiLoop();
  mqttLoop();
  uartSerialLoop();
}






