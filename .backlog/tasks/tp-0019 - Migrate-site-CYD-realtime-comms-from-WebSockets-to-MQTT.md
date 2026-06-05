---
id: TP-0019
title: Migrate site ↔ CYD realtime comms from WebSockets to MQTT
status: To Do
assignee: []
created_date: '2026-06-05 12:46'
updated_date: '2026-06-05 12:46'
labels: []
dependencies: []
priority: medium
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move all realtime messaging between the web admin (`site/`, SvelteKit + Express) and the CYD
ESP32 firmware (`cyd/`) off WebSockets and onto an **MQTT broker**. Today a Node `ws` server
(`site/websocket-server/`) accepts `/connections`, keeps a `Map<WebSocket, StatusCommandInfo>`,
broadcasts the full connection list, and routes `status` / `goTo` / `link`. The browser uses a
raw `WebSocket`, the CYD uses `arduinoWebSockets`. This couples realtime traffic to the
SvelteKit server, has a dev/prod port mismatch (browser → 5173, server → 3000), and has no
clean presence model.

After this work, devices and the browser are decoupled pub/sub clients on a Mosquitto broker.
Presence is handled by **retained** status messages + **Last Will (LWT)**, `goTo` is published
directly to the target device, and the only stateful piece — the time-windowed **link
rendezvous** — lives in a tiny link-only Node MQTT coordinator.

### Topic design (JSON payloads; `{token}` = session token)

| Topic | Pub | Sub | Retain | Payload |
|---|---|---|---|---|
| `terra/status/{token}` | Web, CYD | Web (`terra/status/+`) | yes | `StatusCommandInfo` (empty string = offline / LWT) |
| `terra/goto/{token}` | Web, Coordinator | CYD (own token) | no | `{ screen, data? }` |
| `terra/link` | CYD | Coordinator | no | `{ origin, linkTarget, isLinked }` |

No `terra/connections` topic — the admin browser aggregates `terra/status/+` itself.

### Decisions
- Broker: Eclipse Mosquitto in `compose.yml` (TCP 1883 + WebSocket 9001).
- Web client: MQTT.js over the broker's WS listener (leaves the SvelteKit WS path entirely).
- Coordinator: tiny, link-only Node MQTT client; status + `goTo` are peer-to-peer.

Implemented across five subtasks (TP-0019.01 … .05).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Mosquitto broker runs via `compose.yml` with both an MQTT/TCP (1883) and MQTT/WebSocket (9001) listener
- [ ] #2 The web admin `/manage/sessions` page shows live connections sourced from retained `terra/status/+` messages, and a row disappears when that client disconnects (LWT clears the retained status)
- [ ] #3 "Send virus" from the admin publishes `terra/goto/{token}` and reaches the target device directly (no server relay)
- [ ] #4 The link-rendezvous logic (first link → `loading`; a second link to the same target 3–4.8 s later → `loot`) still works, driven by the tiny coordinator over `terra/link` → `terra/goto/{origin}`
- [ ] #5 The CYD firmware compiles with PubSubClient (`pio run`) and publishes/subscribes on the new topics
- [ ] #6 No `ws` / `@types/ws` (site) or `arduinoWebSockets` (cyd) remain in the realtime path
<!-- AC:END -->
