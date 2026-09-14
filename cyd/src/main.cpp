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
#include <web-socket.h>
#include <power.h>

void setup () {
  Serial.begin(115200);
  screenSetup();
  powerSetup();
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
  // webSocketSetup();
  clearScreen();
  uiSetup(); 
}


void loop (){
  uiLoop();
  webSocketLoop();
  uartSerialLoop();
  powerLoop();
}






