/*
 * Default sketch for a Terra Prime Port.
 *
 * Every Port is a standardized Arduino Nano flashed once with this sketch and never again. The
 * UID it announces is not compiled in — it is written afterwards over serial from the
 * `manage/devices` page, and lives in EEPROM so it survives a power cycle.
 *
 * On the wire the board does exactly one thing: it prints its UID, newline-terminated, four
 * times a second. That is the heartbeat `cyd/src/uart-interface.cpp` reads, and it is the whole
 * protocol in the docked direction. A Port has no behaviour beyond announcing itself — what
 * happens when an AguesGuard hears it is decided entirely by whoever subscribes to the resulting
 * port.connected / port.disconnected facts.
 *
 * In the other direction it accepts one command:
 *
 *   SET_UID:<uid>\n   -> store <uid> in EEPROM, reply OK:<uid>\n
 *
 * A board with a fresh (unwritten) EEPROM reads back an empty UID and stays silent until it is
 * provisioned for the first time — an unprovisioned Nano must never look like a docked Port.
 */

#include <Arduino.h>
#include <EEPROM.h>

/*
 * 250 ms is load-bearing, not cosmetic. The AguesGuard treats the first UID it hears as
 * port.connected and declares port.disconnected after one second of silence, so the interval has
 * to leave room for about four beats inside that window. Slow this loop down and a Port that is
 * sitting still starts flapping between connected and disconnected.
 */
const unsigned long BEAT_INTERVAL_MS = 250;

const long BAUD_RATE = 115200;

/* EEPROM layout: a one-byte length at 0, then that many UID bytes. */
const int EEPROM_LENGTH_ADDRESS = 0;
const int EEPROM_UID_ADDRESS = 1;
const byte MAX_UID_LENGTH = 64;

const char SET_UID_PREFIX[] = "SET_UID:";

String uid = "";
String incoming = "";
unsigned long lastBeat = 0;

void setup()
{
    Serial.begin(BAUD_RATE);
    incoming.reserve(MAX_UID_LENGTH + sizeof(SET_UID_PREFIX));
    uid = readUid();
}

void loop()
{
    readSerial();
    beat();
}

/* Announce the UID on a fixed cadence. An unprovisioned board has nothing to announce. */
void beat()
{
    if (uid.length() == 0)
    {
        return;
    }
    unsigned long now = millis();
    // Subtraction, not `now > lastBeat + interval`, so the 49-day millis() rollover is a
    // non-event.
    if (now - lastBeat < BEAT_INTERVAL_MS)
    {
        return;
    }
    lastBeat = now;
    Serial.println(uid);
}

void readSerial()
{
    while (Serial.available())
    {
        char character = Serial.read();
        if (character == '\n')
        {
            handleCommand(incoming);
            incoming = "";
            continue;
        }
        if (character == '\r')
        {
            continue;
        }
        if (incoming.length() < MAX_UID_LENGTH + sizeof(SET_UID_PREFIX))
        {
            incoming += character;
        }
    }
}

void handleCommand(String command)
{
    command.trim();
    if (command.startsWith(SET_UID_PREFIX) == false)
    {
        return;
    }
    String next = command.substring(strlen(SET_UID_PREFIX));
    next.trim();
    if (next.length() == 0 || next.length() > MAX_UID_LENGTH)
    {
        return;
    }
    writeUid(next);
    uid = next;
    // The manage page waits for this exact line before it calls the board provisioned.
    Serial.print("OK:");
    Serial.println(uid);
}

String readUid()
{
    byte length = EEPROM.read(EEPROM_LENGTH_ADDRESS);
    // 0xFF is what a never-written cell reads back as, and any other out-of-range length is
    // corruption. Either way the board is unprovisioned.
    if (length == 0 || length > MAX_UID_LENGTH)
    {
        return "";
    }
    String stored = "";
    stored.reserve(length);
    for (byte i = 0; i < length; i++)
    {
        stored += (char)EEPROM.read(EEPROM_UID_ADDRESS + i);
    }
    return stored;
}

void writeUid(String next)
{
    byte length = (byte)next.length();
    // EEPROM.update only spends a write cycle when the byte actually changes; re-provisioning a
    // board with the same UID then costs nothing.
    EEPROM.update(EEPROM_LENGTH_ADDRESS, length);
    for (byte i = 0; i < length; i++)
    {
        EEPROM.update(EEPROM_UID_ADDRESS + i, next[i]);
    }
}
