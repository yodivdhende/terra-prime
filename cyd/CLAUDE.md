# CYD Firmware

## Overview

ESP32 firmware for the **CYD (Cheap Yellow Display)** tabletop RPG gaming dashboard.
Runs on an ESP32 dev board with a 320×240 TFT touchscreen (XPT2046 touch controller).
Displays a character stat screen, navigates between game screens on commands published by the terra-prime web server (`../site/`) over MQTT, and reports the UID of whatever board it docks with as an event on the same transport.

Part of the terra-prime monorepo. The web server lives at `../site/` (SvelteKit + Express).

---

## Prerequisites

- **PlatformIO** CLI or VS Code extension
- **Hardware** — ESP32 dev board with 320×240 TFT (ILI9341) and XPT2046 touch controller
- **Battery** (optional) — dual-18650 "V8" shield with an **INA219** across its raw cell terminals (see Battery & Power Save)
- **SD card** — FAT-formatted with `/config.json` at the root (see Runtime Config)
- **SquareLine Studio 1.5.1** — only needed for UI design changes

External libs fetched automatically by PlatformIO on first build:
- `XPT2046_Touchscreen` (GitHub)
- `PubSubClient` (PlatformIO registry)

Bundled in `lib/`:
- `TFT_eSPI`
- `ArduinoJson`

---

## Key Commands

```sh
pio run                                          # compile
pio run --target upload                          # flash to device
pio device monitor                               # serial monitor (115200 baud)
pio run --target upload && pio device monitor    # flash + monitor
```

All commands run from the `cyd/` directory. Config: `platformio.ini`.

---

## Architecture

**Boot sequence** (`src/main.cpp`):
1. `screenSetup()` — init TFT + touch SPI
2. `powerSetup()` — init I2C and the INA219 battery sense IC
3. `setupSD()` — read `/config.json` from SD into globals *(commented out)*
4. `connectToWifi()` *(commented out)*
5. `fetchCharacter()` — GET `{apiUrl}my/character`, authenticated as this device *(commented out)*
6. `mqttSetup()` — connect to the broker from `config.json`'s `mqtt` block, register the last will, publish a retained status *(commented out)*
7. `uiSetup()` — init LVGL, register callbacks, call `ui_init()`

**Main loop** runs five handlers:
- `uiLoop()` — `lv_timer_handler()` every 5 ms
- `mqttLoop()` — pumps the MQTT client, reconnects when the link drops, re-announces status when the WiFi bars or the charge change bracket
- `uiNotifyLoop()` — takes the `cyd.notify` banner down when its time is up
- `uartSerialLoop()` — reads newline-delimited UIDs off the serial line, calls `publishPortConnected()`
- `powerLoop()` — samples the battery, and sleeps the device once the UI has been idle

**Communication channels:**

| Channel | Direction | Purpose |
|---|---|---|
| HTTP REST | Device → Server | Fetch character data on boot, and screen data on demand |
| MQTT | Device → Broker | Retained status (online, WiFi bars, charge), and events for docking with a Port or Printer |
| MQTT | Broker → Device | `cyd.show` (navigate to `loading`, `loot`, `virus`) and `cyd.notify` (banner), on its own topic and on the broadcast topic |
| UART Serial | External → Device | The UID of the board this prop just docked with, republished via `publishPortConnected()` |
| SD card | SD ⇄ Device | Load config and the expertise icon pack at boot; store the last answer per `api/my` path for offline use |
| I2C | Sense IC → Device | INA219 on the battery terminals — pack voltage and current |

Command routing (`src/mqtt-client.cpp`): an incoming `{ "kind": "cyd.show", "screen": "loading|loot|virus" }` calls the corresponding `Ui*Setup()`; `{ "kind": "cyd.notify", "message": "..." }` raises the banner without changing screens. The topic tree is defined in `site/src/lib/realtime/topics.ts` — it is the API between every prop and the server, and these strings are flashed into hardware, so it is not cheap to change.

**Current dev state:** Network init is **commented out** in `main.cpp`. The device boots directly into LVGL for UI development without SD or WiFi.

---

## Important Files

| File | Purpose |
|---|---|
| `platformio.ini` | Build config — board, framework, baud rate, lib deps |
| `src/main.cpp` | Entry point — `setup()` / `loop()` wiring |
| `src/globals.h/cpp` | Global state: screen dims, WiFi creds, API URL, touch SPI pins, `screenSetup()` |
| `src/ui-implementation.h/cpp` | LVGL init, display flush, touch read callbacks, `uiSetup()` / `uiLoop()` |
| `src/mqtt-client.h/cpp` | MQTT client — connect with a last will, retained status, event publishing, command routing |
| `src/ui-notify.h/cpp` | `uiNotifyShow()` — the `cyd.notify` banner, drawn on LVGL's top layer so it survives a screen change |
| `src/api.h/cpp` | `apiGet()` — every REST read: device credentials on the way out, SD fallback on failure |
| `src/cache.h/cpp` | `cacheRead()` / `cacheWrite()` — the stored copy of each `api/my` answer |
| `src/character.h/cpp` | `Character` struct, `fetchCharacter()` |
| `src/sd-reader.h/cpp` | `setupSD()` + `readConfig()` — parses `/config.json` into globals |
| `src/uart-interface.h/cpp` | `uartSerialLoop()` — reads the docked board's UID off the serial line |
| `src/connection.h/cpp` | `connectToWifi()`, `reconnectWifi()`, `wifiRssi()` / `wifiStrengthLevel()` |
| `src/power.h/cpp` | INA219 battery read, charge curve, idle → light sleep, wake on touch |
| `src/ui-status-bar.h/cpp` | `uiStatusBarInit()` — battery and WiFi icons in every screen's header |
| `src/log.h/cpp` | `logWhite/logGreen/logRed()` — color output to Serial + TFT |
| `src/ui-downloading.cpp` | `UiLoadingSetup()` — animated progress bar |
| `src/ui-loot.cpp` | `UiLootSetup()` |
| `src/ui-virus.cpp` | `UiVirusSetup()` |
| `src/ui-expertise.h/cpp` | `uiExpertiseInit()` — fills the Expertise screen from `api/my/expertise` |
| `src/ui-implants.h/cpp` | `uiImplantsInit()` — fills the Implants screen from `api/my/implants` |
| `src/ui/` | **Generated by SquareLine Studio — do not hand-edit** |
| `ui-project/` | SquareLine Studio source project (`cyd-interface.spj`) |

---

## UI Development Workflow

UI is designed in **SquareLine Studio 1.5.1**. Never manually edit `src/ui/` — it is regenerated on every export.

Screens: `Home`, `DownloadScreen`, `LootScreen`, `VirusScreen`, `Expertise`, `Implants`, `Messages`.

**Edit workflow:**
1. Open `ui-project/cyd-interface.spj` in SquareLine Studio 1.5.1
2. Make design changes
3. **File → Export UI Files** → outputs to `src/ui/`
4. `pio run --target upload`

Screen transition logic lives in `src/ui-downloading.cpp`, `src/ui-loot.cpp`, `src/ui-virus.cpp` — not in `src/ui/`.

Screen *contents* that come from the API live outside `src/ui/` too. `uiSetup()` calls a
`ui<Screen>Init()` per data-backed screen after `ui_init()`; each hangs its own list under the
generated header and title and refills it on `LV_EVENT_SCREEN_LOADED`, so a value an admin changes
mid-event shows up the next time the player opens that screen.

The header's status icons work the same way: SquareLine exports one static frame each, and
`uiStatusBarInit()` (`src/ui-status-bar.cpp`) gives them their state on an `lv_timer` — reaching the
icons through `ui_comp_get_child(header, UI_COMP_HEADER_*)` rather than editing generated code.

---

## Battery & Power Save

Both live in `src/power.cpp`.

**Battery.** The prop runs off a dual-18650 "V8" shield, whose two cells sit in *parallel* behind a
5V boost converter. An **INA219** across the shield's **raw cell terminals** — ahead of the booster,
where the voltage still tracks charge — reports bus voltage and current over I2C:

| INA219 | goes to |
|---|---|
| Vin+ | cell pack + (the shield's raw battery terminal) |
| Vin- | the shield's battery input, i.e. the load side |
| VCC / GND | 3V3 / GND |
| SDA | GPIO 27 |
| SCL | GPIO 22 |

GPIO 27 and 22 are broken out on the CYD's spare connectors and are clear of both SPI buses (the
display and the XPT2046). No ADC pin is used. Wired as above, current reads **positive while
discharging**, negative while charging.

Voltage alone would read a handheld as half-empty the moment its backlight came on, so the current
reading is used to add the I·R sag back before the voltage is looked up in a single-cell 18650
discharge curve. If no INA219 answers, readings come back `metered = false`, the status bar shows
`--`, and everything else runs unchanged.

**Power save.** After `POWER_SAVE_IDLE_MS` (2 min) without a touch — measured with LVGL's own
inactivity timer — the backlight goes out, the radio is taken down, and the ESP32 enters **light**
sleep. Light, not deep: RAM and the call stack survive, so the screen the player was on comes back
already built. The XPT2046's IRQ line (GPIO 36) is the `ext0` wake source; on wake the backlight
comes back, LVGL's inactivity is reset, and `reconnectWifi()` re-associates if the device was
online — the MQTT client reconnects itself from there.

Re-associating takes a few seconds, so a screen opened right after a wake may find no network. That
is what the SD cache is for: `apiGet()` serves the stored answer and the screen fills anyway.

`powerSaveSetIdleTimeout(0)` disables sleeping, which is what you want on the bench.

---

## Runtime Config

Device reads `/config.json` from SD card root at boot (`src/sd-reader.cpp`):

```json
{
  "wifi": { "ssid": "...", "password": "..." },
  "apiUrl": "http://host/api/",
  "domain": "host",
  "deviceUid": "...",
  "sessionToken": "...",
  "mqtt": {
    "host": "broker-host",
    "port": 1883,
    "username": "...",
    "password": "..."
  }
}
```

`apiUrl` must include a trailing slash — `apiGet()` appends the path directly.

`deviceUid` is the UID this handheld is registered under in the site's `Devices` table, and is how
every REST read authenticates: the server resolves which character version the device is bound to
from its `aguesguard` role. There is no `characterId` — the device does not get to assert which
character it is showing. Register the UID and attach the role under `manage/devices`.

`mqtt.username` defaults to `deviceUid` when omitted — that is what the broker's ACL is written
against. The password is this prop's own: credentials are per device, because props get handed to
players. Issue them with `pnpm mqtt:credentials` in `site/`; see `docs/MQTT_SETUP.md`.

`sessionToken` is now only a REST fallback. `apiGet()` sends it as a
cookie, which keeps a device that is not in the registry yet working against `/api/my/**`; the
server prefers the device UID when both arrive.

### Expertise icons

The device cannot draw the site's expertise SVGs — LVGL has no SVG renderer — so they are
rasterized once on the site and copied to the card. In `manage/expertise`, **icon pack for
AguesGuard** downloads a zip that unpacks onto the card root:

```
icons/expertise/<expertise id>.bin
icons/expertise-groups/<group id>.bin
```

Each file is a 24x24 `LV_COLOR_FORMAT_A8` LVGL binary image: a 12-byte header and 576 alpha bytes,
588 bytes in total. A8 is a bare mask, and LVGL tints it with the widget's `image_recolor` style —
`ui-expertise.cpp` sets that from the group colour the API sends, so re-colouring a group on the
site needs no re-export. Only the ids change the files.

Keyed on id because names get edited and ids do not. A missing file draws nothing and keeps the
row's indent, so a card with a partial pack, or no `icons/` at all, still lays out correctly.

LVGL reaches the card through `LV_USE_FS_STDIO` with `LV_FS_STDIO_PATH "/sd/"` — the Arduino SD
library mounts through the ESP32's VFS at `/sd`, so `fopen()` gets there and no custom `lv_fs`
driver is needed. Paths are written `A:icons/expertise/12.bin`. `LV_CACHE_DEF_SIZE` is 32 KB so
scrolling does not re-read every icon off the card each frame.

### Offline cache

`apiGet()` writes every answer to `/cache/<path>.json` on the same card and falls back to it when a
request fails, so losing WiFi mid-event leaves the player's own sheet on screen instead of an error.

`ApiResult.stale` says whether a body came from the card rather than the network. The screens do not
surface it — the header's WiFi icon is where that belongs, and it is not wired to anything yet. Until
it is, stored values are shown without any marking.

Each file is a header line — the cache format version, a tab, and the character version the body
belongs to — followed by the body. That version is checked on read: an AguesGuard re-bound to
another character will not fall back to the previous player's numbers, it shows nothing instead.
Writes go to a `.part` file and are renamed, because the prop gets switched off mid-write.

The cache is disposable. Deleting `/cache` costs one round trip per screen.

---

## Gotchas

- **Network init is commented out.** Uncomment the four blocks in `setup()` (`src/main.cpp`) to enable full runtime. The device will hang on boot if SD is missing or WiFi is unreachable.
- **`src/ui/` is generated code.** Manual edits are overwritten on the next SquareLine Studio export.
- **SquareLine Studio export path** may be set to an absolute Windows path. Update it in SquareLine preferences when exporting from a different machine.
- **TFT rotation:** `screenSetup()` sets rotation 0 (portrait); `uiSetup()` overrides to rotation 1 (landscape) for LVGL. Don't change the `uiSetup()` rotation without also updating LVGL display dimensions.
- **UART undock is commented out.** `publishPortDisconnected(uid)` is never called, so a prop that walks away from a Port never says so — the dwell that opens the Port is only cancelled by the device going offline.
- **`connectToWifi()` blocks indefinitely** — no timeout if the network is unreachable. `reconnectWifi(timeoutMs)` is the bounded one, used after a wake.
- **`setupSD()` mounts at 80 MHz**, which is past the SPI-mode SD ceiling of 40 MHz. It predates
  the offline cache, which depends on the card mounting, so it is worth checking on hardware — if
  the card is unreliable, this is the first thing to lower.
- **The device sleeps after 2 minutes idle.** It wakes on touch, but a bench board with nothing touching it will go dark — call `powerSaveSetIdleTimeout(0)` while developing.
- **Light sleep drops the WiFi link on purpose.** The radio cannot stay associated through it; `powerLoop()` re-associates on wake, so anything holding a socket must tolerate a reconnect.
- **Battery readings need the INA219 on the *raw* cell terminals.** Metering the shield's boosted 5V output would read a flat 5V until the converter gave up.
- **`logRed/logGreen/logWhite` write to TFT directly.** After LVGL takes over, raw TFT writes conflict with LVGL rendering. Code that runs from a screen logs to `Serial` instead — see `src/api.cpp`.
