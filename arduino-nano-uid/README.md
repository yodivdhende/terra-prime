# arduino-nano-uid — the default Port sketch

Every Terra Prime **Port** is the same hardware running the same sketch: a standardized Arduino
Nano flashed once with `arduino-nano-uid.ino`. Nothing about a particular Port is compiled in.
The UID it announces is written afterwards, over USB, from the site — so a spare board off the
shelf becomes any Port you need without opening the Arduino IDE again.

A Port carries no behaviour. It announces its UID and that is all it does; what happens when an
AguesGuard docks with it is decided by whoever subscribes to the resulting `port.connected` /
`port.disconnected` events, which is how a Game claims a Port without anything in the registry
changing.

## What the board does

| Direction | Line | Meaning |
|---|---|---|
| Board → host | `<uid>\n`, four times a second | The heartbeat. This is what the AguesGuard listens for |
| Host → board | `SET_UID:<uid>\n` | Store `<uid>` in EEPROM |
| Board → host | `OK:<uid>\n` | The UID was stored |

Serial runs at **115200 baud**.

The 250 ms heartbeat interval is load-bearing. The AguesGuard treats the first UID it hears as
`port.connected` and declares `port.disconnected` after **one second of silence**, so the
interval has to leave room for roughly four beats inside that window. Slow the loop down and a
Port sitting perfectly still starts flapping between connected and disconnected.

A board whose EEPROM has never been written reads back an empty UID and **stays silent**. That is
deliberate: an unprovisioned Nano must never look like a docked Port.

## Flashing a board

1. Install the [Arduino IDE](https://www.arduino.cc/en/software) (or `arduino-cli`).
2. Open `arduino-nano-uid.ino`.
3. Select **Tools → Board → Arduino Nano**. On a board with the older bootloader, also set
   **Tools → Processor → ATmega328P (Old Bootloader)** — if the upload fails with
   `not in sync`, this is why.
4. Select the board's port under **Tools → Port**.
5. Upload.

With `arduino-cli`:

```sh
arduino-cli compile --fqbn arduino:avr:nano arduino-nano-uid
arduino-cli upload  --fqbn arduino:avr:nano -p /dev/ttyUSB0 arduino-nano-uid
```

Only `EEPROM.h` is used, which ships with the AVR core — there are no libraries to install.

## Provisioning a UID

Flashing gets you a silent board. Give it a UID from the site:

1. Open **Manage → Devices**, and either create the device (name + uid) or find it in the list.
2. Plug the Nano into the machine running the browser.
3. Press **program via USB** and pick the board in the port chooser.

The page writes `SET_UID:<uid>\n` and waits up to five seconds for `OK:<uid>\n`. On success it
toasts; on a timeout it reports the failure and nothing was stored.

This needs the **Web Serial API** — desktop Chrome or Edge, over HTTPS or on localhost. Firefox
and Safari do not implement it, and the button is hidden there. The UID can always be typed in by
hand instead and written with any serial terminal.

Uploading a new sketch does **not** wipe the UID: the AVR core preserves EEPROM across uploads,
so a reflashed board comes back up as the same Port.

### By hand, with a serial monitor

Open the port at 115200 baud with line ending set to **Newline**, then send:

```
SET_UID:port-cargo-bay-01
```

The board replies `OK:port-cargo-bay-01` and immediately starts looping the new UID.

## Verifying

- Watch the serial monitor: the UID should appear about four times a second, evenly spaced.
- Dock the Port with an AguesGuard. It should raise exactly **one** `port.connected` while the
  two stay together — not a stream of them.
- Pull it away. `port.disconnected` should follow about a second later, once and only once.

Flapping in either direction means the heartbeat is slower than the sketch intends; check
`BEAT_INTERVAL_MS` and that nothing in `loop()` blocks.
