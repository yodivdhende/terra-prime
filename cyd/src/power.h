#ifndef POWER_MODULE
#define POWER_MODULE

#include <Arduino.h>

/** What the INA219 on the battery terminals last reported. */
struct BatteryReading
{
    /** False when no INA219 answered on the bus — the device runs on, just unmetered. */
    bool metered;
    /** Pack terminal voltage in volts, 0 when unmetered. */
    float volts;
    /** Pack current in amps: positive while discharging, negative while charging. */
    float amps;
    /** Charge left, 0-100. -1 when unmetered. */
    int percentage;
    /** True while current is flowing into the pack. */
    bool charging;
};

/** Bring up the I2C bus and the battery sense IC. Call once from `setup()`. */
void powerSetup();

/** Sample the battery and drop into power save once the UI has been idle. Call from `loop()`. */
void powerLoop();

/** The last battery sample. Safe to call before `powerSetup()` — it reads back unmetered. */
BatteryReading batteryReading();

/** Idle time before the device sleeps. 0 keeps it awake — useful while developing on the bench. */
void powerSaveSetIdleTimeout(uint32_t milliseconds);
uint32_t powerSaveIdleTimeout();

#endif
