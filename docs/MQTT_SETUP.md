# MQTT Broker Setup (Railway)

> How to run the AguesGuard **MQTT server** as its own Railway service. This is
> the broker referenced in the design doc's data infrastructure
> (`docs/agues-guard_DESIGN.md` §3): `AguesGuard ⇄ MQTT ⇄ broker` and
> `Site/dashboard ⇄ websockets ⇄ broker`. It is the target realtime transport
> that replaces the current WebSocket `/connections` mediator (see
> `docs/agues-guard_DESIGN.md` §7).

## Why a separate service

The broker is a standalone process ([Eclipse Mosquitto](https://mosquitto.org/)),
not part of the SvelteKit app, so it gets its own Railway service in the **same
project** as the site and MySQL. Being in one project means:

- the SvelteKit **server** reaches the broker over Railway's **private network**
  (`<service>.railway.internal`) — no public exposure for server ⇄ broker;
- shared variables (username/password) can be referenced across services.

The broker exposes **two listeners**, because its clients speak MQTT two
different ways:

| Listener | Port | Protocol | Client |
|---|---|---|---|
| Devices | `1883` | MQTT over TCP | CYD / ESP32 firmware (e.g. PubSubClient) |
| Dashboard | `9001` | MQTT over **WebSockets** | Browser (`manage/sessions` uses MQTT.js) — browsers cannot open raw TCP |

The SvelteKit server can use either; over the private network it uses the TCP
listener (`1883`).

---

## 1. Broker files (`mqtt/`)

Create an `mqtt/` directory at the repo root with the three files below. This
mirrors how the app service uses `site/` as its root directory.

**`mqtt/mosquitto.conf`**

```conf
persistence true
persistence_location /mosquitto/data/

# Devices: raw MQTT over TCP
listener 1883
protocol mqtt

# Dashboard: MQTT over WebSockets (browser)
listener 9001
protocol websockets

# No anonymous access; accounts come from the password file
allow_anonymous false
password_file /mosquitto/config/passwords
```

**`mqtt/docker-entrypoint.sh`** — rebuilds the password file from env vars on
every boot, so credentials live in Railway variables, not in the repo:

```sh
#!/bin/sh
set -e

: "${MQTT_USERNAME:?MQTT_USERNAME is required}"
: "${MQTT_PASSWORD:?MQTT_PASSWORD is required}"

# Server/dashboard account
mosquitto_passwd -b -c /mosquitto/config/passwords "$MQTT_USERNAME" "$MQTT_PASSWORD"

# Optional separate, least-privilege device account
if [ -n "$MQTT_DEVICE_USERNAME" ] && [ -n "$MQTT_DEVICE_PASSWORD" ]; then
  mosquitto_passwd -b /mosquitto/config/passwords "$MQTT_DEVICE_USERNAME" "$MQTT_DEVICE_PASSWORD"
fi

chmod 0700 /mosquitto/config/passwords
exec "$@"
```

**`mqtt/Dockerfile`**

```dockerfile
FROM eclipse-mosquitto:2

COPY mosquitto.conf /mosquitto/config/mosquitto.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]
```

Optionally add **`mqtt/railway.toml`** (mirrors `site/railway.toml`):

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./mqtt/Dockerfile"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

---

## 2. Create the Railway service

1. In the **same** Railway project as the site (see `docs/RAILWAY_SETUP.md`),
   click **+ New** → **GitHub Repo** and pick this repository again (a second
   service off the same repo).
2. Open the new service → **Settings** → **Source** → set **Root Directory** to
   `mqtt/`. Railway will build `mqtt/Dockerfile`.
3. Name the service something stable like `mqtt` — its private hostname becomes
   `mqtt.railway.internal`.

---

## 3. Authentication (variables)

On the **mqtt** service → **Variables**, set:

| Variable | Purpose |
|---|---|
| `MQTT_USERNAME` | Server + dashboard account |
| `MQTT_PASSWORD` | …its password |
| `MQTT_DEVICE_USERNAME` | *(optional)* separate device account |
| `MQTT_DEVICE_PASSWORD` | …its password |

The entrypoint writes these into the Mosquitto password file at startup. Keep the
dashboard account least-privilege (see the note in [§5](#5-wire-up-the-site)),
because browser env vars are shipped to the client.

---

## 4. Networking

Under the **mqtt** service → **Settings** → **Networking**:

- **Dashboard (WebSockets over WSS).** Add a **public domain**. Set its **target
  port** to `9001` (the WebSocket listener). Railway's HTTP edge upgrades
  WebSocket connections, so the browser connects to `wss://<your-mqtt-domain>`.
- **Devices (raw TCP).** Add a **TCP Proxy** targeting container port `1883`.
  Railway returns a public `host:port` (e.g. `mainline.proxy.rlwy.net:23456`) —
  that is what the firmware connects to.
- **Server (private).** No exposure needed: the SvelteKit server dials
  `mqtt.railway.internal:1883` on the private network.

---

## 5. Wire up the site

On the **site** service → **Variables** (these follow the repo's existing env
conventions — `process.env.*` server-side, SvelteKit `PUBLIC_*` for the browser,
see `PUBLIC_BASE_URL` in `site/src/lib/server/verification.service.ts`):

| Variable | Example | Used by |
|---|---|---|
| `MQTT_URL` | `mqtt://mqtt.railway.internal:1883` | SvelteKit **server** (publish commands / subscribe to telemetry) |
| `MQTT_USERNAME` | *(reference the mqtt service's `MQTT_USERNAME`)* | server |
| `MQTT_PASSWORD` | *(reference the mqtt service's `MQTT_PASSWORD`)* | server |
| `PUBLIC_MQTT_URL` | `wss://<your-mqtt-domain>` | **browser** dashboard (`manage/sessions`) |
| `PUBLIC_MQTT_USERNAME` | dashboard account | browser |
| `PUBLIC_MQTT_PASSWORD` | dashboard account | browser |

> ⚠️ Anything with the `PUBLIC_` prefix is bundled into the client and visible to
> anyone who loads the page. Give the dashboard a **subscribe-only** account, or
> move to token-based auth, before relying on this in production.

This replaces the hardcoded `ws://localhost:5173/connections` in
`site/src/routes/manage/sessions/+page.svelte:22` (design-doc gap §7) with an
MQTT.js client pointed at `PUBLIC_MQTT_URL`.

---

## 6. Wire up the firmware

The device reads its broker settings from the SD card `/config.json`
(`cyd/src/sd-reader.cpp` → globals), alongside the existing WiFi/session fields:

```json
{
  "mqttHost": "mainline.proxy.rlwy.net",
  "mqttPort": 23456,
  "mqttUsername": "device",
  "mqttPassword": "..."
}
```

Use the TCP Proxy `host:port` from [§4](#4-networking). An ESP32 MQTT client
(e.g. PubSubClient) connects with these; for TLS, front it with the WSS domain or
Mosquitto's `8883` listener instead (out of scope here).

---

## 7. Local development

Add a broker service to `compose.yml` so local dev matches production:

```yaml
  mqtt:
    container_name: terra-prime-mqtt
    build:
      context: ./mqtt
    ports:
      - 1883:1883
      - 9001:9001
    environment:
      - MQTT_USERNAME=dev
      - MQTT_PASSWORD=dev
```

Then point the site at `mqtt://mqtt:1883` (server) and `ws://localhost:9001`
(browser) via `site/.env`.

---

## 8. Verify

From any machine with the Mosquitto clients installed
(`mosquitto-clients` package):

```sh
# Subscribe (leave running)
mosquitto_sub -h <tcp-proxy-host> -p <tcp-proxy-port> \
  -u "$MQTT_USERNAME" -P "$MQTT_PASSWORD" -t 'aguesguard/#' -v

# Publish from another terminal
mosquitto_pub -h <tcp-proxy-host> -p <tcp-proxy-port> \
  -u "$MQTT_USERNAME" -P "$MQTT_PASSWORD" -t 'aguesguard/test' -m 'hello'
```

The subscriber should print `aguesguard/test hello`. For the WebSocket listener,
test with a browser MQTT tool (e.g. MQTT Explorer or an MQTT.js snippet) against
`wss://<your-mqtt-domain>`.

Check the Railway **mqtt** service logs to confirm the listeners came up:

```
mosquitto version 2.x starting
Opening ipv4 listen socket on port 1883.
Opening websockets listen socket on port 9001.
```
