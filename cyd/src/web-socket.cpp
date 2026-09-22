#include <Arduino.h>
#include <WebSocketsClient.h>
#include <log.h>
#include <ArduinoJson.h>
#include <globals.h>
#include <screens.h>
#include <connection.h>

/** How often the reported signal strength is re-checked against what the server was last told. */
#define WIFI_STRENGTH_CHECK_INTERVAL_MS 5000

WebSocketsClient webSocket;

static bool socketConnected = false;
static int reportedWifiStrength = -1;
static uint32_t lastWifiStrengthCheckAt = 0;

void sendStatus()
{
    const int wifiStrength = wifiStrengthLevel();

    JsonDocument statusData;
    JsonObject status = statusData.createNestedObject("status");
    status["sessionToken"] = sessionToken;
    status["connectionType"] = "CYD";
    status["wifiStrength"] = wifiStrength;
    String statusJsonString = "";
    serializeJson(statusData, statusJsonString);
    webSocket.sendTXT(statusJsonString);

    reportedWifiStrength = wifiStrength;
}

/**
 * The admin dashboard only knows what a device last told it, and `status` is sent once on connect —
 * so a handheld that walks out of range would sit there showing full bars. Re-send the status
 * whenever the strength actually changes bracket; a steady signal costs nothing.
 */
static void reportWifiStrength()
{
    if (socketConnected == false) return;
    if (millis() - lastWifiStrengthCheckAt < WIFI_STRENGTH_CHECK_INTERVAL_MS) return;
    lastWifiStrengthCheckAt = millis();

    if (wifiStrengthLevel() == reportedWifiStrength) return;
    sendStatus();
}

void sendLink(String token, boolean status)
{
    JsonDocument linkData;
    JsonObject link = linkData.createNestedObject("link");
    link["origin"] = sessionToken;
    link["linkTarget"] = token;
    link["isLinked"] = status;
    String linkObjString = "";
    serializeJson(linkData, linkObjString);
    Serial.println(linkObjString);
    webSocket.sendTXT(linkObjString);
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

    if (messageObj.containsKey("goTo"))
    {
        String screen = messageObj["goTo"]["screen"];
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
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.println("Websocket Disconnected");
        socketConnected = false;
        reportedWifiStrength = -1;
        break;
    case WStype_CONNECTED:
        Serial.println("Websocket Connected");
        socketConnected = true;
        sendStatus();
        break;
    case WStype_TEXT:
        Serial.print("message: ");
        Serial.println((char *)payload);
        handleMessage((String)(char *)payload);
        break;
    }
}

static bool webSocketStarted = false;

void webSocketSetup()
{
    // Handler first: begin() starts the connection, and an event that arrives before onEvent() has
    // been registered is lost.
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    webSocket.begin(domain, webSocketPort, "/connections");
    webSocketStarted = true;
}

void webSocketLoop()
{
    // Boot can halt before the WebSocket step, leaving a client that was never begun. Driving it
    // then means retrying a TCP connect to an empty host every five seconds, which stalls the loop
    // the halted boot screen is repainting from.
    if (webSocketStarted == false) return;
    webSocket.loop();
    reportWifiStrength();
}