#include <Arduino.h>
#include <log.h>
#include <globals.h>
#include <mqtt-client.h>

unsigned long lastMessageTimeStamp = 0;
String lastMessage = "";
String receivedMessage = "";
int timeUnit = 1000;

void uartSerialLoop()
{
    if (Serial.available())
    {
        Serial.print('-');
        char incommingChar = Serial.read();
        if (incommingChar == '\n')
        {
            Serial.println("SerialMessage: ");
            Serial.println(receivedMessage);
            lastMessage = receivedMessage;
            receivedMessage = "";
            lastMessageTimeStamp = millis();
            sendLink(lastMessage, true);
        }
        if(isAscii(incommingChar))
        {
            receivedMessage += incommingChar;
        }
    }
    // if(Serial.available() == false || lastMessageTimeStamp - millis() >= 1500)
    // {
    //     receivedMessage = "";
    //     lastMessageTimeStamp = 0;
    //     sendLink(lastMessage, false);
    // }
}
