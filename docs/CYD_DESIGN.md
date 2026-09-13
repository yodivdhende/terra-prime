# CYD Design Document

> Architecture and data-flow reference for the **CYD** ("Cheap Yellow Display") tabletop-prop
> device and how it interacts with the terra-prime site. Diagrams are [Mermaid](https://mermaid.js.org/)
> — edit the fenced code blocks directly and re-render (e.g. on [mermaid.live](https://mermaid.live))
> to adjust them.

## 1. Overview

**CYD** stands for "Cheap Yellow Display" — a low-cost ESP32 development board with an
integrated 320x240 ILI9341 TFT screen and an XPT2046 resistive touch controller (named after
the well-known RandomNerdTutorials hardware guide). In this repo, `cyd/` is a PlatformIO/Arduino
firmware project that turns one of these boards into a **physical tabletop-RPG companion prop**:
it sits at a player's table during a live session, renders character stats and animated
screens (loading / loot / virus / expertise / implants / messages) built with
**LVGL** + **SquareLine Studio**, and reacts in real time to commands pushed from the server.

The device is not autonomous — it is a thin client. All game logic, session state, and
character data live on the site (SvelteKit + MySQL). CYD talks to the site over four channels:

| Channel | Direction | Purpose |
|---|---|---|
| HTTP (REST) | device → server | `GET /api/my/*` — character at boot, expertise and implants when those screens open |
| WebSocket (`/connections`) | bidirectional | status/link events out, screen-navigation commands in |
| UART (serial) | external peripheral → device | receives tokens (e.g. from an RFID/NFC reader), relayed as "link" events |
| SD card | local | loads `/config.json` at boot (WiFi creds, API/WS URLs, `deviceUid`, `sessionToken`) and the expertise icon pack; stores the last answer per `api/my` path for offline use |

The admin-facing `manage/sessions` dashboard in the site connects to the **same** WebSocket
endpoint as every CYD device, so admins can see which devices are connected live and trigger
screen changes (e.g. "send virus") on a specific device.

---

## 2. System context

```mermaid
flowchart LR
    subgraph Table["Tabletop prop"]
        UART[UART peripheral\ntoken/RFID reader]
        SD[(SD card\nconfig.json + api cache\n+ icon pack)]
        CYD["CYD device\nESP32 + LVGL UI"]
        UART -- "serial tokens" --> CYD
        SD -- "WiFi/API/WS config" --> CYD
        CYD -- "last api/my answers" --> SD
    end

    subgraph Site["terra-prime site (SvelteKit)"]
        API["/api/* REST routes"]
        WS["websocket-server\n(Express + ws, path /connections)"]
        DB[(MySQL\nSessions, Characters, ...)]
        API --> DB
        WS -.-> API
    end

    Admin["Admin browser\nmanage/sessions"]

    CYD -- "HTTP GET /api/my/* (X-Device-Uid)" --> API
    CYD <-- "WebSocket: status, link ⇄ goTo" --> WS
    Admin <-- "WebSocket: session list ⇄ goTo" --> WS
    Admin -- "HTTP (session/char mgmt)" --> API
```

---

## 3. CYD firmware components

```mermaid
flowchart TB
    main["main.cpp\nsetup() / loop()"]
    globals["globals.h/.cpp\nWiFi creds, domain, api_url,\ndeviceUid, sessionToken"]
    sd["sd-reader.h/.cpp\nreads /config.json → globals"]
    cache["cache.h/.cpp\nlast answer per path,\non the SD card"]
    conn["connection.cpp\nconnectToWifi()"]
    ws["web-socket.h/.cpp\nconnect, sendStatus(),\nsendLink(), handleMessage()"]
    api["api.h/.cpp\napiGet() — REST reads with\nthis device's credentials"]
    char["character.h/.cpp\nCharacter struct,\nfetchCharacter()"]
    uart["uart-interface.h/.cpp\nreads serial tokens,\ncalls sendLink(token, true)"]
    ui["ui-implementation.h/.cpp\nLVGL init, display flush,\ntouch read, uiSetup()/uiLoop()"]
    screens["ui/*\nSquareLine Studio screens:\nHome, DownloadScreen, LootScreen,\nVirusScreen, Expertise, Implants, Messages"]
    xition["ui-downloading.cpp / ui-loot.cpp / ui-virus.cpp\nscreen-transition logic"]
    data["ui-expertise.cpp / ui-implants.cpp\nscreen contents from api/my/*"]

    main --> sd
    main --> conn
    main --> ws
    main --> char
    main --> uart
    main --> ui
    sd --> globals
    conn --> globals
    ws --> globals
    api --> globals
    api -- "store / fall back" --> cache
    char --> api
    data --> api
    ws -- "goTo command" --> xition
    xition --> screens
    ui --> screens
    ui --> data
    data --> screens
    uart --> ws
```

> Note: as of the current firmware, `main.cpp` boots directly into the UI with SD/WiFi/
> character-fetch/WebSocket init **commented out** (dev-mode state) — see `cyd/CLAUDE.md`.

---

## 4. Site-side realtime layer

```mermaid
flowchart LR
    entry["websocket-server/index.ts\nExpress entry point,\nwraps SvelteKit adapter-node handler"]
    mid["socket-server.ts\nWebSocketMidiator:\nintercepts HTTP 'upgrade',\nroutes path=/connections"]
    csock["connection-socket.ts\nConnectionSocketServer:\n- Map<WebSocket, StatusCommandInfo>\n- Map<token, Date> pending links\n- handleCommand() dispatch\n- broadcast session list"]
    handler["build/handler.js\nSvelteKit adapter-node handler\n(all normal HTTP routes)"]

    entry --> mid
    entry --> handler
    mid -- "upgrade on /connections" --> csock
    csock -- "status / link / goTo" --> Clients(["Connected clients\n(CYD devices + admin browsers)"])
```

**Discriminated connection types** (`connection-socket.ts`):
- `WebStatusCommandInfo` — `connectionType: 'Web'` (admin dashboard)
- `CYDStatusCommandInfo` — `connectionType: 'CYD'`, includes `wifiStrength`

`site/src/lib/components/session-row.svelte` renders a Wifi icon for `'CYD'` connections and
an EthernetPort icon for `'Web'` connections in the admin list.

---

## 5. Sequence diagrams

### 5.1 Boot / status handshake

```mermaid
sequenceDiagram
    participant D as CYD device
    participant WS as websocket-server\n(/connections)
    participant A as Admin browser\n(manage/sessions)

    D->>D: load /config.json from SD
    D->>WS: connect ws://{domain}:{port}/connections
    D->>WS: {"status": {"sessionToken": "...", "connectionType": "CYD"}}
    WS->>WS: store in connection Map
    WS->>A: broadcast updated session list
    A->>A: render device row (Wifi icon)
```

### 5.2 Character fetch, and the device's own reads

```mermaid
sequenceDiagram
    participant D as CYD device
    participant API as SvelteKit /api/my/*
    participant DB as MySQL

    D->>API: GET /api/my/character (X-Device-Uid: <uid>)
    API->>DB: Devices WHERE Uid = <uid>
    DB-->>API: device + roles
    API->>API: require the aguesguard role
    API->>DB: Character_Versions / Characters for that role's CharacterVersion
    DB-->>API: character + version
    API-->>D: JSON {id, name, versionId, versionName, companyId}
    D->>D: render Home screen

    Note over D,API: later, when a screen opens
    D->>API: GET /api/my/expertise (same header)
    API-->>D: expertise values + group colours (no SVG icons for a device)
    D->>D: one progress bar per expertise
```

The device asserts nothing about which character it is showing: it presents the UID it is
registered under in `Devices`, and the server reads the bound character version from that device's
`aguesguard` role. Re-binding a handheld is an admin edit of that role — nothing to reflash, no SD
card to rewrite. `/api/my/**` serves a player's browser over the session cookie by the same route.

Every answer is also written to the SD card, and every failed request falls back to the last one
stored for that path, so a prop that loses WiFi mid-event keeps showing the player their own sheet.
Each stored body records the character version it belongs to and is refused if that no longer
matches, so a re-bound handheld never falls back to the previous player's numbers. Whether an answer
came from the card is reported back to the caller but not drawn on the screens: the header's WiFi
icon is where "these values are old" belongs, and nothing drives it yet — see
[§7.4](#7-known-architecture-gaps).

### 5.3 Link / loot mini-game

```mermaid
sequenceDiagram
    participant P as UART peripheral (reader)
    participant D as CYD device
    participant WS as websocket-server

    P->>D: serial token (newline-delimited)
    D->>WS: {"link": {"origin": sessionToken, "linkTarget": token, "isLinked": true}}
    WS->>WS: start timer for token (first link)
    WS-->>D: {"goTo": {"screen": "loading"}}
    D->>D: UiDownloadScreenSetup()
    Note over P,WS: 3–4.8s later, second link for same token
    P->>D: serial token (again)
    D->>WS: {"link": {...}}
    WS->>WS: timer elapsed within window
    WS-->>D: {"goTo": {"screen": "loot"}}
    D->>D: UiLootScreenSetup()
```

### 5.4 Admin-triggered screen push

```mermaid
sequenceDiagram
    participant A as Admin browser\n(manage/sessions)
    participant WS as websocket-server
    participant D as CYD device

    A->>WS: click "send virus" action
    WS-->>D: {"goTo": {"screen": "virus", "targetToken": "..."}}
    D->>D: handleMessage() matches screen="virus"
    D->>D: UiVirusSetup()
```

---

## 6. Data model touchpoints

| Table | CYD reads | CYD writes | Notes |
|---|---|---|---|
| `Sessions` / `Session_Roles` | `sessionToken` is provisioned into `/config.json` on the SD card out-of-band | — (no direct writes) | Identity on the WS channel is self-asserted via `sessionToken` in the `status` message; there is no per-message auth check on the socket itself |
| `Devices` / `Device_AguesGuard` | indirectly: the device sends its `Uid`, the server resolves the role's `CharacterVersion` | — | The device's identity on the REST channel. A UID is a bearer credential sent in the clear — see [§7.3](#7-known-architecture-gaps) |
| `Characters` / `Character_Versions` | via `GET /api/my/character` (`name`, `versionId`, `versionName`) | — | Fetched once at boot (when enabled) to populate the Home screen |
| `Character_Version_Expertise` / `Expertise` / `Expertise_Groups` | via `GET /api/my/expertise` (value, name, group id, group name and colour) | — | Re-read every time the Expertise screen opens, and cached on the SD card for when that read fails. Drawn as bars only — the screen shows no numbers — with a per-group bar holding the mean of the character's entries in it. The SVG icons are withheld from device callers; the device draws 24px A8 copies from its card instead, exported from `manage/expertise` and tinted at draw time with the group colour |
| `Character_Version_Implants` / `Implants` | via `GET /api/my/implants` (name, description, slot) | — | Re-read every time the Implants screen opens, and cached on the SD card for when that read fails |

Full schema reference: `site/CLAUDE.md`. Full REST endpoint reference: `site/src/routes/api/CLAUDE.md`.

---

## 7. Known architecture gaps

These are real, current gaps found while tracing the CYD ⇄ site integration — documented here
so they're visible, not silently worked around.

1. **Production entrypoint skips the WebSocket server.** `site/package.json` defines two start
   scripts: `start` (`node ./build/index.js`, plain SvelteKit adapter-node) and
   `start:websocket` (`node ./websocket-server`, the Express+`ws` wrapper that mounts
   `/connections`). `site/dockerfile`'s final stage runs `pnpm start`, and `site/railway.toml`
   does not override the command — so, as configured, the deployed container does **not**
   expose `/connections`, meaning CYD devices and the `manage/sessions` live dashboard cannot
   connect in production.

2. **Hardcoded local WebSocket URL.** `site/src/routes/manage/sessions/+page.svelte` connects
   to a hardcoded `ws://localhost:5173/connections`, which will not resolve against a deployed
   domain and does not use `wss://` for TLS.

3. **Device identity is a bearer UID.** The firmware's REST reads now authenticate — as the
   device, not as a player — but `X-Device-Uid` is a plain identifier sent in the clear, so
   anyone who can read one off the wire can replay it and read that character. This is the same
   self-asserted identity the WebSocket channel has, where `sessionToken` in the `status` message
   is taken at face value. Closing it means a per-device secret on `Devices` and signing or
   presenting it per request; nothing does that yet.

4. **Nothing tells the player the values are old.** The device falls back to the copy on its SD
   card when a request fails, and `ApiResult.stale` marks that body as stored rather than live, but
   no screen shows it. The header's WiFi icon is the intended home for it and is a static image
   today, as is the header's clock. Until one of them is driven, a player cannot tell a cached
   sheet from a current one.

---

## 8. File / reference index

| Diagram element | File(s) |
|---|---|
| Firmware entry / lifecycle | `cyd/src/main.cpp` |
| Firmware shared state | `cyd/src/globals.h`, `cyd/src/globals.cpp` |
| SD config loading | `cyd/src/sd-reader.h`, `cyd/src/sd-reader.cpp` |
| Offline cache on the card | `cyd/src/cache.h`, `cyd/src/cache.cpp` |
| Icon pack export | `site/src/lib/utils/icon-export.ts`, `.../lvgl-image.ts`, `.../zip.ts`, `.../rasterize-svg.ts` |
| WiFi connect | `cyd/src/connection.cpp` |
| WebSocket client | `cyd/src/web-socket.h`, `cyd/src/web-socket.cpp` |
| REST client / credentials | `cyd/src/api.h`, `cyd/src/api.cpp` |
| Character fetch | `cyd/src/character.h`, `cyd/src/character.cpp` |
| UART token input | `cyd/src/uart-interface.h`, `cyd/src/uart-interface.cpp` |
| LVGL/display glue | `cyd/src/ui-implementation.h`, `cyd/src/ui-implementation.cpp` |
| Screen-transition logic | `cyd/src/ui-downloading.cpp`, `cyd/src/ui-loot.cpp`, `cyd/src/ui-virus.cpp` |
| Screen contents from the API | `cyd/src/ui-expertise.cpp`, `cyd/src/ui-implants.cpp` |
| SquareLine-generated screens | `cyd/src/ui/*` |
| SquareLine project source | `cyd/ui-project/cyd-interface.spj` |
| Firmware architecture notes | `cyd/CLAUDE.md` |
| WS Express entry point | `site/websocket-server/index.ts` |
| WS upgrade routing | `site/websocket-server/socket-server.ts` |
| Connection/link state + broadcast | `site/websocket-server/connection-socket.ts` |
| Admin live dashboard | `site/src/routes/manage/sessions/+page.svelte`, `site/src/lib/components/session-row.svelte` |
| Player/device read paths | `site/src/routes/api/my/character/`, `.../my/expertise/`, `.../my/implants/` |
| Caller → character version | `site/src/lib/server/my-character.service.ts` |
| Device registry | `site/src/lib/db/device.repo.ts`, `site/src/lib/db/schema/devices.ts` |
| Site schema reference | `site/CLAUDE.md` |
| Site API reference | `site/src/routes/api/CLAUDE.md` |
| Deployment config | `site/dockerfile`, `site/railway.toml`, `site/package.json` |
