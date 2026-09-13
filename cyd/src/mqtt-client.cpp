#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <log.h>
#include <globals.h>
#include <connection.h>
#include <power.h>
#include <ui-downloading.h>
#include <ui-loot.h>
#include <ui-notify.h>
#include <ui-virus.h>
#include <mqtt-client.h>

/**
 * MQTT replaces the WebSocket relay this device used to talk to.
 *
 * Two things the socket could not do are the reason. A prop whose battery dies mid-game simply
 * stops answering, and nothing on the server could tell that from a quiet device — the broker's
 * last will does, with no heartbeat logic anywhere. And a device that reboots used to come back
 * invisible until it announced itself; a retained status topic means the server already knows
 * what it was, the moment it reconnects.
 *
 * Topics are the ones in `site/src/lib/realtime/topics.ts`. That file is the contract, and these
 * strings are flashed into hardware that is handed to players — changing one means collecting
 * every prop in the building, so they are written out here verbatim rather than assembled
 * cleverly.
 */

/** How often the reported signal strength and charge are re-checked against what was last sent. */
#define STATUS_CHECK_INTERVAL_MS 5000

/** Charge is re-announced per whole bracket, not per percent: a status per point is noise. */
#define BATTERY_REPORT_STEP 5

/** Retry cadence while the broker is unreachable. Matches the WiFi reconnect interval. */
#define RECONNECT_INTERVAL_MS 5000

/**
 * PubSubClient's default 256-byte buffer truncates silently, and a `cyd.show` carrying data is
 * already close to it. Large enough for anything the topic tree defines, small enough to sit
 * beside LVGL's display buffers.
 */
#define MQTT_BUFFER_SIZE 512

static WiFiClient wifiClient;
static PubSubClient mqtt(wifiClient);

static String statusTopic;
static String commandTopic;

static int reportedWifiStrength = -1;
static int reportedBattery = -1;
static uint32_t lastStatusCheckAt = 0;
static uint32_t lastReconnectAttemptAt = 0;

bool mqttConnected()
{
    return mqtt.connected();
}

/** Current charge as a bracket, or -1 when no sense IC answered. */
static int batteryPercentage()
{
    BatteryReading battery = batteryReading();
    if (battery.metered == false) return -1;
    return (battery.percentage / BATTERY_REPORT_STEP) * BATTERY_REPORT_STEP;
}

/**
 * Retained, because this is the answer to "what is this prop doing" for anyone who asks later —
 * the server reads the whole fleet back out of these after a restart without waking a single
 * device.
 */
static void publishStatus()
{
    if (mqtt.connected() == false) return;

    const int wifiStrength = wifiStrengthLevel();
    const int battery = batteryPercentage();

    JsonDocument status;
    status["online"] = true;
    status["wifiStrength"] = wifiStrength;
    if (battery >= 0) status["battery"] = battery;
    status["firmware"] = firmwareVersion;

    String payload = "";
    serializeJson(status, payload);
    mqtt.publish(statusTopic.c_str(), payload.c_str(), true);

    reportedWifiStrength = wifiStrength;
    reportedBattery = battery;
}

/**
 * The dashboard only knows what a device last told it, so a handheld walking out of range would
 * sit there showing full bars. Re-announce whenever the signal changes bracket or the charge moves
 * a step; a device sitting still costs nothing.
 */
static void reportStatusChanges()
{
    if (mqtt.connected() == false) return;
    if (millis() - lastStatusCheckAt < STATUS_CHECK_INTERVAL_MS) return;
    lastStatusCheckAt = millis();

    if (wifiStrengthLevel() == reportedWifiStrength && batteryPercentage() == reportedBattery) return;
    publishStatus();
}

static void publishEvent(const char *topic, const JsonDocument &event)
{
    if (mqtt.connected() == false)
    {
        Serial.print("mqtt: dropping event, not connected: ");
        Serial.println(topic);
        return;
    }
    String payload = "";
    serializeJson(event, payload);
    Serial.print("mqtt: ");
    Serial.print(topic);
    Serial.print(" ");
    Serial.println(payload);
    mqtt.publish(topic, payload.c_str());
}

void publishPortConnected(String portUid)
{
    JsonDocument event;
    event["port"] = portUid;
    event["device"] = deviceUid;
    publishEvent("tp/event/port/connected", event);
}

void publishPortDisconnected(String portUid)
{
    JsonDocument event;
    event["port"] = portUid;
    event["device"] = deviceUid;
    publishEvent("tp/event/port/disconnected", event);
}

void publishPrinterConnected(String printerUid)
{
    JsonDocument event;
    event["printer"] = printerUid;
    event["device"] = deviceUid;
    publishEvent("tp/event/printer/connected", event);
}

void publishPrintTaken(String printerUid)
{
    JsonDocument event;
    event["printer"] = printerUid;
    event["device"] = deviceUid;
    publishEvent("tp/event/print/taken", event);
}

static void handleShow(JsonDocument &command)
{
    String screen = command["screen"];
    Serial.print("mqtt: show ");
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
        UiVirusSetup();
        return;
    }
    // A screen this build does not have. Devices outlive deployments, so say so and carry on
    // rather than leaving the player looking at a prop that froze.
    Serial.println("mqtt: unknown screen");
}

static void handleCommand(char *payload, unsigned int length)
{
    JsonDocument command;
    DeserializationError error = deserializeJson(command, payload, length);
    if (error)
    {
        Serial.print("mqtt: unreadable command: ");
        Serial.println(error.c_str());
        return;
    }

    String kind = command["kind"];
    if (kind == "cyd.show")
    {
        handleShow(command);
        return;
    }
    if (kind == "cyd.notify")
    {
        String message = command["message"];
        uint32_t durationMs = command["durationMs"] | UI_NOTIFY_DEFAULT_MS;
        uiNotifyShow(message.c_str(), durationMs);
        return;
    }
    Serial.println("mqtt: unknown command kind");
}

static void onMessage(char *topic, uint8_t *payload, unsigned int length)
{
    Serial.print("mqtt: <- ");
    Serial.println(topic);
    // Both topics this device subscribes to carry a command; the only difference is who it was
    // addressed to, and the device does not act differently for a broadcast.
    handleCommand((char *)payload, length);
}

/**
 * The will is registered here, in CONNECT, which is the whole point of it: the broker holds onto
 * it and publishes it if this session ends without a DISCONNECT. There is no matching code path
 * on the device, because the case it covers is the device being unable to run any.
 */
static bool connectToBroker()
{
    JsonDocument will;
    will["online"] = false;
    String willPayload = "";
    serializeJson(will, willPayload);

    const bool connected = mqtt.connect(
        deviceUid.c_str(),
        mqttUsername.c_str(),
        mqttPassword.c_str(),
        statusTopic.c_str(),
        1,
        true,
        willPayload.c_str());

    if (connected == false)
    {
        Serial.print("mqtt: connect failed, state ");
        Serial.println(mqtt.state());
        return false;
    }

    Serial.println("mqtt: connected");
    mqtt.subscribe(commandTopic.c_str(), 1);
    mqtt.subscribe("tp/broadcast/notify", 1);
    publishStatus();
    return true;
}

void mqttSetup()
{
    if (deviceUid.length() == 0)
    {
        logRed("No deviceUid in config.json - cannot join the broker");
        return;
    }
    if (mqttHost.length() == 0)
    {
        logRed("No mqtt.host in config.json - cannot join the broker");
        return;
    }

    statusTopic = "tp/device/" + deviceUid + "/status";
    commandTopic = "tp/device/" + deviceUid + "/cmd";

    mqtt.setBufferSize(MQTT_BUFFER_SIZE);
    mqtt.setServer(mqttHost.c_str(), mqttPort);
    mqtt.setCallback(onMessage);
    connectToBroker();
}

void mqttLoop()
{
    if (mqttHost.length() == 0) return;

    if (mqtt.connected() == false)
    {
        // Non-blocking: the UI keeps running while the broker is away, and a prop with no network
        // is still a prop the player can read.
        if (millis() - lastReconnectAttemptAt < RECONNECT_INTERVAL_MS) return;
        lastReconnectAttemptAt = millis();
        reportedWifiStrength = -1;
        reportedBattery = -1;
        if (WiFi.status() != WL_CONNECTED) return;
        connectToBroker();
        return;
    }

    mqtt.loop();
    reportStatusChanges();
}
