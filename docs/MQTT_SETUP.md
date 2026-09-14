# MQTT Setup

How the broker is deployed, who is allowed to say what on it, and what has to be on a device's SD
card before it can join.

The transport itself — the topic tree, the payloads, the bridge — is described in
[`CYD_DESIGN.md`](./CYD_DESIGN.md) §3. This document is the operational half: the Railway service,
the credentials, and the order to do things in.

---

## What runs where

| Piece | Where | Talks to |
|---|---|---|
| Broker (Mosquitto) | Railway service, built from `mqtt/Dockerfile` | everything below |
| Site bridge | inside the `site` service, started by `realtime/index.ts` | broker, over Railway's private network |
| Dashboard | a browser on `manage/devices` | the **site**, over SSE — never the broker |
| Props (AguesGuard, Game, light rig) | the room | broker, over Railway's TCP proxy |

The dashboard not connecting to the broker is the reason this setup has no HTTP auth backend, no
WebSocket listener and no ticket-minting endpoint: the only principals are the bridge, the light
rig, and the props, and a password file covers all of them.

---

## 1. Create the broker service

1. In the Railway project, **+ New** → **GitHub Repo** → this repository.
2. **Settings** → **Source** → **Root Directory**: leave it at the repository root. `mqtt/railway.toml`
   points the builder at `mqtt/Dockerfile`.
3. **Settings** → **Config-as-code**: `mqtt/railway.toml`.

### Volume

**+ New** → **Volume**, mounted at **`/mosquitto/data`**.

Without it the broker forgets its retained messages on every redeploy, and every prop in the
building reads as "never seen" until it next speaks. With it, the bridge recovers the whole fleet's
state seconds after a restart without waking a single device.

### TCP proxy

**Settings** → **Networking** → **TCP Proxy**, target port **1883**. That address and port are what
goes on each device's SD card.

Railway does not terminate TLS on a TCP proxy, so this is plaintext MQTT. The props are on a
local network for the length of an event and the traffic is screen changes and dock events, so
that is an accepted trade for now — the credential, not the payload, is the thing worth
protecting, and each one is scoped to a single prop. Moving to `mqtts://` means the broker holding
its own certificate, and a check that the ESP32 has the RAM for mbedTLS next to LVGL's display
buffers.

The **site** service reaches the broker over the private network instead —
`mqtt://mqtt.railway.internal:1883` — and never through the proxy.

---

## 2. Set the broker's variables

On the **broker** service:

| Variable | Value |
|---|---|
| `MQTT_BRIDGE_USERNAME` | anything, e.g. `tp-bridge` |
| `MQTT_BRIDGE_PASSWORD` | a long random string |
| `MQTT_LIGHT_USERNAME` | optional, e.g. `tp-light` |
| `MQTT_LIGHT_PASSWORD` | required if the username is set |
| `MQTT_DEVICE_CREDENTIALS` | JSON, from step 3 |
| `MQTT_PORT` | optional; defaults to `PORT`, then `1883` |

`mqtt/entrypoint.sh` turns these into a mosquitto password file and an ACL file at container
start. Nothing is baked into the image — props get handed to players, and a credential in an image
layer is a credential that leaks the first time anyone pulls it.

The resulting ACL, per principal:

| Principal | May publish | May subscribe |
|---|---|---|
| bridge | `tp/device/+/cmd`, `tp/cue/light`, `tp/broadcast/notify` | `tp/event/#`, `tp/device/+/status` |
| light rig | — | `tp/cue/light` |
| a device | `tp/device/<its uid>/status`, plus the event topics its roles justify | `tp/device/<its uid>/cmd`, `tp/broadcast/notify` |

A device may **not** publish a command, on its own topic or anyone else's. A prop that walks out of
the room in someone's pocket cannot drive the screens that are still in it.

Event permissions follow the device's roles in the registry:

| Role | May publish |
|---|---|
| `aguesguard` | `tp/event/port/connected`, `tp/event/port/disconnected`, `tp/event/printer/connected`, `tp/event/print/taken` |
| `game` | `tp/event/game/won` |
| `light` | (subscribes `tp/cue/light`) |
| `port`, `printer` | nothing — these are UID-carrying boards with no network of their own |

`port/*` belongs to the AguesGuard rather than to the Port because the handheld is the networked
half of a docking: it reads the Port's UID over UART and reports the pairing.

---

## 3. Issue per-device credentials

From `site/`, with the usual `MYSQL*` variables set:

```sh
pnpm mqtt:credentials
```

It reads the device registry, so the UIDs and roles it emits are the ones that actually exist. It
prints two things: the JSON for `MQTT_DEVICE_CREDENTIALS`, and the `mqtt` block to put on each
device's card.

Passwords are not stored server-side — the broker keeps a hash and the device keeps the plaintext
on its card. A rotation therefore means a trip to every affected card, so pass the current list
back in when adding a prop and the existing ones are preserved:

```sh
MQTT_DEVICE_CREDENTIALS="$(current value from Railway)" pnpm mqtt:credentials
```

Devices whose UID is not topic-safe (`A-Z a-z 0-9 . _ : -`) are named and skipped: a UID with a
`/`, `+` or `#` in it cannot be given an ACL, because its topics would collide with a wildcard.

---

## 4. Point the site at the broker

On the **site** service:

| Variable | Value |
|---|---|
| `MQTT_URL` | `mqtt://mqtt.railway.internal:1883` (the private address of the broker service) |
| `MQTT_USERNAME` | `MQTT_BRIDGE_USERNAME` from step 2 |
| `MQTT_PASSWORD` | `MQTT_BRIDGE_PASSWORD` from step 2 |
| `MQTT_CLIENT_ID` | optional; defaults to a per-process id |

Leave `MQTT_URL` unset and the site still runs — the bridge logs that it has no broker, the
dashboard shows "broker unreachable", and every command is refused with a 502. That is deliberate:
the site is far more than its realtime layer, and a broker outage must not take the website down
with it.

The site service also has to run the realtime entrypoint, or there is no bridge at all. That is
`startCommand` in `site/railway.toml` and the `CMD` in `site/dockerfile`; both say
`pnpm migrate && pnpm start:realtime`. A **Deploy Command** set in the Railway dashboard silently
replaces the image's `CMD`, which is how this service previously ended up serving plain
adapter-node with no realtime layer in it — leave that field empty and let the repo decide.

---

## 5. Configure a device

`/config.json` on the card root gains an `mqtt` block:

```json
{
  "wifi": { "ssid": "...", "password": "..." },
  "apiUrl": "https://host/api/",
  "domain": "host",
  "deviceUid": "agues-01",
  "sessionToken": "...",
  "mqtt": {
    "host": "tcp-proxy-host.railway.app",
    "port": 12345,
    "username": "agues-01",
    "password": "..."
  }
}
```

`host` and `port` are the TCP proxy from step 1. `username` may be omitted — it defaults to
`deviceUid`, which is what the ACL is written against. `webSocketPort` is gone; nothing reads it.

---

## 6. Verify

1. **The bridge is up.** The site's deploy log shows `[realtime] connected to broker`. If it says
   `MQTT_URL is not set`, step 4 did not take.
2. **A device is up.** Power one on; the broker log shows `New client connected` for its UID, and
   `manage/devices` shows it online with its charge and signal.
3. **Commands reach it.** Press **send virus** on `manage/devices`. The prop switches screen.
4. **Presence is real.** Pull the device's power — do not shut it down. Within the keepalive
   window it flips to offline on the dashboard, published by the broker from the last will with no
   server-side heartbeat involved.
5. **Retained state recovers.** Redeploy the site. The dashboard repopulates within a second or
   two, without any device being touched — that is the retained status topics being replayed.

---

## Troubleshooting

**Every device shows "never seen".** The bridge is connected but nothing has published. Check the
broker log for `Denied PUBLISH` — most likely the UID in `MQTT_DEVICE_CREDENTIALS` does not match
the `deviceUid` on the card, so the ACL is written for a device that never connects.

**A device connects and is immediately dropped.** Two props sharing a UID. MQTT client ids are
unique per broker: the second connection kicks the first off, and they take turns forever. It
looks exactly like a flapping network.

**Commands return 502.** The bridge has no broker. The site is fine; `MQTT_URL` or the credential
is wrong, or the broker is down.

**The dashboard shows nothing and `/api/realtime` returns 503.** The site is running `pnpm start`
rather than `pnpm start:realtime` — check for a Deploy Command set in the Railway dashboard.
