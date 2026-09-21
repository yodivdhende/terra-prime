# CYD Firmware

## Overview

ESP32 firmware for the **CYD (Cheap Yellow Display)** tabletop RPG gaming dashboard.
Runs on an ESP32 dev board with a 320×240 TFT touchscreen (XPT2046 touch controller).
Displays a character stat screen, navigates between game screens via WebSocket commands from the terra-prime web server (`../site/`), and links UART tokens to player sessions.

Part of the terra-prime monorepo. The web server lives at `../site/` (SvelteKit + Express).

---

## Prerequisites

- **PlatformIO** CLI or VS Code extension
- **Hardware** — ESP32 dev board with 320×240 TFT (ILI9341) and XPT2046 touch controller
- **SD card** — FAT-formatted with `/config.json` at the root (see Runtime Config)
- **SquareLine Studio 1.5.1** — only needed for UI design changes

External libs fetched automatically by PlatformIO on first build:
- `XPT2046_Touchscreen` (GitHub)
- `arduinoWebSockets` (GitHub)

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
1. `screenSetup()` — init TFT + touch SPI, **portrait**
2. `bootScreenInit()` — draw the title and every step as pending, **straight to the panel**
3. `runBootSequence()` (`src/boot.cpp`) runs the four steps, marking each as it goes:
   1. `setupSD()` — mount the card, parse `/config.json` into globals
   2. `connectToWifi()` — give up after `wifiTimeout` seconds
   3. `fetchCharacter()` — GET `{apiUrl}my/character`, authenticated as this device
   4. `webSocketSetup()` — configure the client; it connects asynchronously from `loop()`
4. All passed → hold ~1.2s so the finished list can be read, then `uiSetup()` (LVGL, `ui_init()`,
   `uiExpertiseInit()`, `uiImplantsInit()`), which turns the panel landscape and repaints it with Home
5. Any failure → `bootScreenHalt()` and `setup()` returns. `uiSetup()` is never reached, so the boot
   screen and the failing step's `logRed` line stay on the panel

**Boot runs portrait, the UI runs landscape.** The long edge vertical is 20 lines of text against
landscape's 15, and the boot log is what needs them: a successful boot prints 8 lines (card type and
size, three config lines, the AP and the IP, the character name) into a log area that starts below
the step list. Portrait fits that with four lines to spare; landscape would clip the last one.
`uiSetup()` turns the panel for LVGL, which owns it from then on.

**The boot screen is not an LVGL screen, deliberately.** An LVGL one would mean initialising LVGL
before the steps could be reported, pumping it by hand so anything that blocks still paints,
allocating and freeing a screen around a handover, and competing with the WiFi stack for heap at
the worst moment. Drawing text with `tft.print` needs none of it: `screenSetup()` has already
readied the display, a print is on the glass when it returns, and LVGL overwrites the screen when
it starts anyway.

The step table in `src/boot.h`/`boot.cpp` is the single source for both the sequence and the screen's
rows, so a new step cannot be added to one and missed by the other. `boot.cpp` knows nothing about
how progress is displayed — it takes an observer.

**Main loop** does nothing at all after a failed boot: LVGL was never initialised, the WebSocket
client may never have been begun, and the config naming the server may never have been read. The
boot screen needs no upkeep — it is drawn on the panel, not rendered. When boot succeeded:
- `uiLoop()` — `lv_timer_handler()` every 5 ms
- `webSocketLoop()` — processes WebSocket frames
- `uartSerialLoop()` — reads newline-delimited serial tokens, calls `sendLink()`

**Communication channels:**

| Channel | Direction | Purpose |
|---|---|---|
| HTTP REST | Device → Server | Fetch character data on boot, and screen data on demand |
| WebSocket | Server → Device | Navigate to screen (`loading`, `loot`, `virus`) |
| UART Serial | External → Device | Receive tokens, relay via `sendLink()` |
| SD card | SD ⇄ Device | Load config and the expertise icon pack at boot; store the last answer per `api/my` path for offline use |

WebSocket routing (`src/web-socket.cpp`): incoming `{ "goTo": { "screen": "loading|loot|virus" } }` calls the corresponding `Ui*Setup()`.

**The network steps are live.** They are no longer commented out, so the device needs a card with a
valid `/config.json` and a reachable AP to reach the Home screen. A failure halts on the boot screen
naming the step and the reason.

---

## Important Files

| File | Purpose |
|---|---|
| `platformio.ini` | Build config — board, framework, baud rate, lib deps |
| `src/main.cpp` | Entry point — `setup()` / `loop()` wiring |
| `src/globals.h/cpp` | Global state: screen dims, WiFi creds, API URL, touch SPI pins, `screenSetup()` |
| `src/ui-implementation.h/cpp` | LVGL init, display flush, touch read callbacks, `uiSetup()` / `uiLoop()` |
| `src/web-socket.h/cpp` | WebSocket client — setup, event handler, `sendLink()`, screen routing |
| `src/boot.h/cpp` | The boot step table and `runBootSequence()` — no LVGL, no screen knowledge |
| `src/boot-screen.h/cpp` | The boot screen, drawn to the panel with TFT_eSPI — not LVGL |
| `src/api.h/cpp` | `apiGet()` — every REST read: device credentials on the way out, SD fallback on failure |
| `src/cache.h/cpp` | `cacheRead()` / `cacheWrite()` — the stored copy of each `api/my` answer |
| `src/character.h/cpp` | `Character` struct, `fetchCharacter()` |
| `src/sd-reader.h/cpp` | `setupSD()` + `readConfig()` — parses `/config.json` into globals |
| `src/uart-interface.h/cpp` | `uartSerialLoop()` — reads serial tokens |
| `src/connection.h/cpp` | `connectToWifi()` |
| `src/log.h/cpp` | `logWhite/logGreen/logRed()` — Serial, plus the panel until `uiSetup()` calls `logSetTftEnabled(false)` |
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

---

## Runtime Config

Device reads `/config.json` from SD card root at boot (`src/sd-reader.cpp`):

```json
{
  "wifi": { "ssid": "...", "password": "..." },
  "apiUrl": "http://host/api/",
  "domain": "host",
  "webSocketPort": 80,
  "wifiTimeout": 20,
  "deviceUid": "...",
  "sessionToken": "..."
}
```

`wifiTimeout` is **seconds** to wait for the AP before the WiFi boot step fails. Missing, zero, or
outside 1-120 falls back to 20 — the key exists so boot always terminates, so there is deliberately
no way to ask for an unlimited wait. `connectToWifi()` also gives up early on the radio's terminal
answers (SSID not found, password rejected) rather than burning the whole timeout on them.

`apiUrl` must include a trailing slash — `apiGet()` appends the path directly.

`deviceUid` is the UID this handheld is registered under in the site's `Devices` table, and is how
every REST read authenticates: the server resolves which character version the device is bound to
from its `aguesguard` role. There is no `characterId` — the device does not get to assert which
character it is showing. Register the UID and attach the role under `manage/devices`.

`sessionToken` identifies this device on the WebSocket channel. `apiGet()` also sends it as a
cookie, which keeps a device that is not in the registry yet working against `/api/my/**`; the
server prefers the device UID when both arrive.

### Expertise is bars, never numbers

The Expertise screen draws **no numeric values** — a player reads their standing off the length of
a bar and nothing else. Anything added to that screen has to hold to it.

For that to work every bar shares one geometry: the same width, over the same 0-100 range, starting
at the same x. Each expertise group gets its own bar above its members, holding the mean of what
the character has in that group, so a group and its members sit on one scale and are directly
comparable. Group and member rows differ in font, bar thickness and spacing — never in the bar's
width or range, since that is the only quantitative thing on the screen.

> The mean is computed on the device, from values it already has. If "standing in a group" ever
> becomes a game-defined number rather than a way of drawing one, it belongs in
> `/api/my/expertise` instead, so the site and the device cannot disagree about it.

The site's admin and character-building pages still show numbers: an admin editing a value and a
player spending points both need them. The rule is about the player-facing device screen.

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

- **A bad card or AP now stops boot.** The four network steps are live and a failure halts on the
  boot screen, so the device never reaches Home without a valid `/config.json` and a reachable AP.
  Making a step non-fatal is one field on `BootStep` in `src/boot.cpp` — which is also where the SD
  cache would start paying off on an offline boot, since Home is what asks for the cached data.
- **`src/ui/` is generated code.** Manual edits are overwritten on the next SquareLine Studio export.
- **SquareLine Studio export path** may be set to an absolute Windows path. Update it in SquareLine preferences when exporting from a different machine.
- **TFT rotation changes mid-boot.** `screenSetup()` sets rotation 0 (portrait) because the boot
  screen wants the extra lines; `uiSetup()` turns it to 1 (landscape) for LVGL. So `screenWidth` and
  `screenHeight` are named for the landscape the UI uses and read backwards during boot —
  `boot-screen.cpp` defines `PANEL_WIDTH` as `screenHeight` for exactly that reason. Don't change
  the `uiSetup()` rotation without also updating the LVGL display dimensions.
- **Boot-screen clears are sized to the glyph box (16px), not the row pitch (18px)**, so clearing
  one row cannot bleed into the next.
- **UART unlink is commented out.** `sendLink(token, false)` is never called — tokens are never automatically unlinked.
- **`setupSD()` mounts at 80 MHz**, which is past the SPI-mode SD ceiling of 40 MHz. It predates
  the offline cache, which depends on the card mounting, so it is worth checking on hardware — if
  the card is unreliable, this is the first thing to lower.
- **`log*` writes to the panel until `uiSetup()` runs**, then Serial only — raw writes corrupt what
  LVGL has drawn. So a `logRed` from a failing boot step appears under the boot screen's step list,
  which is how a halt explains itself, while one from `api.cpp` at runtime goes to Serial alone.
  Keep using `logRed` for boot failures rather than `Serial.println`.
- **Boot-screen drawing preserves the log cursor.** `log*` prints wherever the cursor is, and
  drawing a step row moves it. `boot-screen.cpp` saves and restores it (`KeepCursor`); without that
  a `logRed` lands on top of the step list instead of below it.
- **SD and touch are both on VSPI, with different pins, and only one can own MISO at a time.**
  `screenSetup()` begins `tsSpi` (VSPI) on CLK 25 / MISO 39 / MOSI 32 / CS 33; `setupSD()` hands
  `sdSpi` (also VSPI) to `SD.begin()`, which begins it on VSPI's default 18/19/23 with CS 5. SCK and
  MOSI are outputs and can fan out, but **MISO is an input and only one pad can drive it** — so
  whichever `begin()` ran last owns it. The TFT is unaffected (HSPI, 12/13/14/15). This is not a
  timing race, so serialising access alone does not fix it — ownership has to be handed over
  explicitly. `globals.cpp`'s `reattachTouch()` does this for touch (called once from `uiSetup()`,
  since `setupSD()` steals MISO during boot); `sd-reader.cpp`'s `reattachSd()` does the mirror image
  for the card, and `cache.cpp` wraps every runtime `cacheRead()`/`cacheWrite()` in an `SdBusHold`
  that calls `reattachSd()` on entry and `reattachTouch()` on exit, since it touches the card while
  the UI runs. Both `begin()`s are internally idempotent (`SDFS`'s `_pdrv`, `SPIClass`'s `_spi`), so
  reclaiming either side needs the matching `end()` first or the reattach silently no-ops.
