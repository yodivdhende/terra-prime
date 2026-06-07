FROM eclipse-mosquitto:2

# Build context is this directory (set the Railway service's Root Directory to `mqtt`).
COPY mosquitto.conf /mosquitto/config/mosquitto.conf

# 1883 = MQTT/TCP (CYD devices, via Railway TCP Proxy)
# 9001 = MQTT/WebSocket (browser, via the service's public domain)
EXPOSE 1883 9001
