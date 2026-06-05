#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <globals.h>
#include <ui-downloading.h>
#include <ui-loot.h>
#include <ui-virus.h>
#include <mqtt-client.h>

WiFiClient net;
PubSubClient mqtt(net);

static unsigned long lastReconnectAttempt = 0;

static String statusTopic() { return "terra/status/" + sessionToken; }
static String gotoTopic() { return "terra/goto/" + sessionToken; }

void sendStatus()
{
    JsonDocument statusData;
    statusData["sessionToken"] = sessionToken;
    statusData["connectionType"] = "CYD";
    statusData["wifiStrength"] = WiFi.RSSI();
    String statusJsonString = "";
    serializeJson(statusData, statusJsonString);
    // Retained so the web admin sees us as soon as it subscribes.
    mqtt.publish(statusTopic().c_str(), statusJsonString.c_str(), true);
}

void sendLink(String token, boolean status)
{
    JsonDocument linkData;
    linkData["origin"] = sessionToken;
    linkData["linkTarget"] = token;
    linkData["isLinked"] = status;
    String linkObjString = "";
    serializeJson(linkData, linkObjString);
    Serial.println(linkObjString);
    mqtt.publish("terra/link", linkObjString.c_str());
}

void handleMessage(String message)
{
    JsonDocument messageObj;
    DeserializationError error = deserializeJson(messageObj, message);

    if (error)
    {
        Serial.println("error:");
        Serial.println(error.c_str());
        return;
    }

    String screen = messageObj["screen"] | "";
    Serial.println("screen:");
    Serial.println(screen);
    if (screen == "loading")
    {
        UiLoadingSetup();
        return;
    }
    if (screen == "loot")
    {
        UiLootSetup();
        return;
    }
    if (screen == "virus")
    {
        Serial.println("virus message");
        UiVirusSetup();
        return;
    }
}

void onMessage(char *topic, byte *payload, unsigned int length)
{
    String message = "";
    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }
    Serial.print("message: ");
    Serial.println(message);
    handleMessage(message);
}

static boolean reconnect()
{
    // clientId = sessionToken; LWT clears our retained status on ungraceful disconnect.
    String willTopic = statusTopic();
    if (mqtt.connect(sessionToken.c_str(), willTopic.c_str(), 0, true, ""))
    {
        Serial.println("MQTT Connected");
        sendStatus();
        mqtt.subscribe(gotoTopic().c_str());
    }
    else
    {
        Serial.print("MQTT connect failed, rc=");
        Serial.println(mqtt.state());
    }
    return mqtt.connected();
}

void mqttSetup()
{
    mqtt.setServer(domain.c_str(), mqttPort);
    mqtt.setBufferSize(512);
    mqtt.setCallback(onMessage);
    reconnect();
}

void mqttLoop()
{
    if (!mqtt.connected())
    {
        unsigned long now = millis();
        if (now - lastReconnectAttempt > 5000)
        {
            lastReconnectAttempt = now;
            reconnect();
        }
        return;
    }
    mqtt.loop();
}
