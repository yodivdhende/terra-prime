#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <esp_sleep.h>
#include <globals.h>
#include <connection.h>
#include <power.h>
#include <touch.h>

/**
 * Battery metering and power save for the untethered handheld.
 *
 * The prop runs off the dual-18650 "V8" shield, whose two cells sit in parallel behind a 5V boost
 * converter. An **INA219** watches the *raw* cell terminals — ahead of the booster, where the
 * voltage still tracks the state of charge — and reports both bus voltage and the current the
 * device is drawing, over I2C. Nothing here needs an ADC pin, and the I2C pair is deliberately
 * clear of the SPI the touch controller and the display run on.
 *
 * Wiring (INA219 breakout → CYD):
 *
 * | INA219 | goes to                                              |
 * |--------|------------------------------------------------------|
 * | Vin+   | cell pack + (the shield's raw battery terminal)       |
 * | Vin-   | the shield's battery input, i.e. the load side        |
 * | VCC    | 3V3                                                  |
 * | GND    | GND                                                  |
 * | SDA    | GPIO 27 (CN1)                                        |
 * | SCL    | GPIO 22 (CN1/P3)                                      |
 *
 * Current therefore reads positive while the pack discharges and negative while it charges.
 *
 * A pack under load sags well below its resting voltage, so a plain voltage lookup would report a
 * handheld as half-empty the moment its backlight came on. The current reading pays for itself
 * here: adding the I·R drop back on recovers the resting voltage the curve is defined over.
 *
 * If no INA219 answers, every reading comes back `metered = false` and the UI says so rather than
 * inventing a number — a board on USB with no sense IC still boots and runs.
 *
 * Power save is the other half of making a battery last an evening: after `POWER_SAVE_IDLE_MS`
 * without a touch the backlight goes out and the ESP32 enters **light** sleep, which keeps RAM and
 * the call stack intact so the UI comes back exactly as the player left it. The XPT2046 pulls its
 * IRQ line low on touch, and that line wakes the chip.
 */

/** Address the breakout ships with (A0 and A1 both tied low). */
#define INA219_ADDRESS 0x40
#define INA219_REG_CONFIG 0x00
#define INA219_REG_SHUNT_VOLTAGE 0x01
#define INA219_REG_BUS_VOLTAGE 0x02
/** 32V bus range, +-320mV shunt, 12-bit samples averaged by 8, bus and shunt converted continuously. */
#define INA219_CONFIG 0x399F
/** The shunt resistor on the breakout, in ohms. */
#define INA219_SHUNT_OHMS 0.1f
/** Bus voltage register: the reading lives in the top 13 bits, 4mV per count. */
#define INA219_BUS_VOLTAGE_LSB 0.004f
/** Shunt voltage register: signed, 10uV per count. */
#define INA219_SHUNT_VOLTAGE_LSB 0.00001f

/** I2C pins, chosen from what the CYD breaks out on CN1/P3 and clear of both SPI buses. */
#define BATTERY_SDA_PIN 27
#define BATTERY_SCL_PIN 22
/** The bus only carries this one slow sensor. */
#define BATTERY_I2C_HZ 100000

/** How often the pack is sampled. Charge moves slowly; the UI redraws from the cached reading. */
#define BATTERY_SAMPLE_INTERVAL_MS 2000
/**
 * Internal resistance of the pack plus its wiring, in ohms — two 18650s in parallel come out
 * around 35mOhm, and the shield's traces and the sense loop make up the rest. Used to undo the
 * sag under load before the voltage is looked up.
 */
#define BATTERY_INTERNAL_OHMS 0.08f
/** Current above which the pack counts as charging (negative = flowing in), in amps. */
#define BATTERY_CHARGE_THRESHOLD -0.02f
/** Smoothing on the resting voltage, 0-1: low enough that a screen transition cannot move the icon. */
#define BATTERY_SMOOTHING 0.25f

/** Idle time before the device sleeps. Two minutes is long enough to read a screen and walk away. */
#define POWER_SAVE_IDLE_MS 120000UL
/** How long to wait for the network to come back after a wake before giving up on it. */
#define POWER_SAVE_WIFI_TIMEOUT_MS 10000UL

/**
 * Discharge curve for a *single* 18650 — the V8 shield wires its two cells in parallel, so the pack
 * voltage is one cell's voltage and the cells only double the capacity. Points are resting
 * voltages, descending.
 */
struct CurvePoint
{
    float volts;
    int percentage;
};

static const CurvePoint dischargeCurve[] = {
    {4.20f, 100}, {4.10f, 90}, {4.00f, 80}, {3.95f, 70}, {3.88f, 60}, {3.83f, 50},
    {3.79f, 40},  {3.75f, 30}, {3.70f, 20}, {3.63f, 10}, {3.45f, 5},  {3.00f, 0},
};
static const size_t dischargeCurveLength = sizeof(dischargeCurve) / sizeof(dischargeCurve[0]);

static BatteryReading reading = {false, 0.0f, 0.0f, -1, false};
static float smoothedRestingVolts = 0.0f;
static uint32_t lastSampleAt = 0;
static uint32_t idleTimeoutMs = POWER_SAVE_IDLE_MS;

static bool readRegister(uint8_t address, uint16_t &value)
{
    Wire.beginTransmission(INA219_ADDRESS);
    Wire.write(address);
    if (Wire.endTransmission() != 0) return false;
    if (Wire.requestFrom((int)INA219_ADDRESS, (int)2) != 2) return false;

    // Read the two bytes into their own locals: the order operands of `|` are evaluated in is not
    // fixed, so folding both calls into one expression would be a coin flip.
    const uint8_t high = Wire.read();
    const uint8_t low = Wire.read();
    value = ((uint16_t)high << 8) | low;
    return true;
}

static bool writeRegister(uint8_t address, uint16_t value)
{
    Wire.beginTransmission(INA219_ADDRESS);
    Wire.write(address);
    Wire.write((uint8_t)(value >> 8));
    Wire.write((uint8_t)(value & 0xFF));
    return Wire.endTransmission() == 0;
}

/** Linear interpolation down the curve above. */
static int percentageForVolts(float volts)
{
    if (volts >= dischargeCurve[0].volts) return 100;

    for (size_t i = 1; i < dischargeCurveLength; i++)
    {
        const CurvePoint above = dischargeCurve[i - 1];
        const CurvePoint below = dischargeCurve[i];
        if (volts >= below.volts)
        {
            const float span = above.volts - below.volts;
            const float position = span > 0.0f ? (volts - below.volts) / span : 0.0f;
            return below.percentage + (int)roundf(position * (above.percentage - below.percentage));
        }
    }
    return 0;
}

static void sampleBattery()
{
    uint16_t rawBus = 0;
    uint16_t rawShunt = 0;
    if (readRegister(INA219_REG_BUS_VOLTAGE, rawBus) == false ||
        readRegister(INA219_REG_SHUNT_VOLTAGE, rawShunt) == false)
    {
        reading.metered = false;
        reading.volts = 0.0f;
        reading.amps = 0.0f;
        reading.charging = false;
        reading.percentage = -1;
        return;
    }

    // The bus voltage is measured at Vin-, so it is already a shunt drop below the cells; undo that
    // along with the pack's own sag, to read the curve at the resting voltage it describes.
    const float volts = (float)(rawBus >> 3) * INA219_BUS_VOLTAGE_LSB;
    const float amps = (float)(int16_t)rawShunt * INA219_SHUNT_VOLTAGE_LSB / INA219_SHUNT_OHMS;
    const float restingVolts = volts + amps * (INA219_SHUNT_OHMS + BATTERY_INTERNAL_OHMS);

    smoothedRestingVolts = smoothedRestingVolts == 0.0f
                               ? restingVolts
                               : smoothedRestingVolts + (restingVolts - smoothedRestingVolts) * BATTERY_SMOOTHING;

    reading.metered = true;
    reading.volts = volts;
    reading.amps = amps;
    reading.charging = amps < BATTERY_CHARGE_THRESHOLD;
    reading.percentage = percentageForVolts(smoothedRestingVolts);
}

static void setBacklight(bool on)
{
    pinMode(TFT_BL, OUTPUT);
    digitalWrite(TFT_BL, on ? TFT_BACKLIGHT_ON : !TFT_BACKLIGHT_ON);
}

/**
 * Backlight off, radio off, then light sleep until the touch controller pulls its IRQ line low.
 * Execution resumes on the line after `esp_light_sleep_start()` with RAM intact, so the screen the
 * player was on is still built and still holds its data — only the network has to be picked back up.
 */
static void enterPowerSave()
{
    // ext0 wakes on a *level*, so a finger still on the glass would wake the device the instant it
    // slept. Wait for the release instead.
    if (digitalRead(XPT2046_IRQ) == LOW) return;

    Serial.println("power: entering power save");
    Serial.flush();

    const bool wasConnected = WiFi.status() == WL_CONNECTED;
    if (wasConnected)
    {
        // The radio cannot stay associated through light sleep, so drop the link deliberately
        // rather than waking up to a half-dead connection.
        WiFi.disconnect(true);
        WiFi.mode(WIFI_OFF);
    }

    setBacklight(false);
    esp_sleep_enable_ext0_wakeup((gpio_num_t)XPT2046_IRQ, 0);
    esp_light_sleep_start();

    setBacklight(true);
    Serial.println("power: woken by touch");

    // The whole sleep counted as idle time; without this the device would sleep again on the
    // next pass, before the touch that woke it is ever handled.
    touchNoteActivity();

    if (wasConnected)
    {
        // The WebSocket client reconnects on its own once the radio is back up.
        reconnectWifi(POWER_SAVE_WIFI_TIMEOUT_MS);
    }
}

void powerSetup()
{
    Wire.begin(BATTERY_SDA_PIN, BATTERY_SCL_PIN, BATTERY_I2C_HZ);

    if (writeRegister(INA219_REG_CONFIG, INA219_CONFIG) == false)
    {
        Serial.println("power: no INA219 on the bus, battery is unmetered");
        return;
    }

    sampleBattery();
    lastSampleAt = millis();
    Serial.printf("power: battery %.2fV, %d%%\n", reading.volts, reading.percentage);
}

void powerLoop()
{
    if (millis() - lastSampleAt >= BATTERY_SAMPLE_INTERVAL_MS)
    {
        lastSampleAt = millis();
        sampleBattery();
    }

    // `touchIsReady()` is false until `uiSetup()` runs, which keeps a halted boot screen awake
    // rather than sleeping on top of the failure it is reporting.
    if (idleTimeoutMs == 0 || touchIsReady() == false) return;
    if (touchInactiveMs() < idleTimeoutMs) return;
    enterPowerSave();
}

BatteryReading batteryReading()
{
    return reading;
}

void powerSaveSetIdleTimeout(uint32_t milliseconds)
{
    idleTimeoutMs = milliseconds;
}

uint32_t powerSaveIdleTimeout()
{
    return idleTimeoutMs;
}
