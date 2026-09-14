# The MQTT broker, as its own Railway service.
#
# Mosquitto rather than a broker with an HTTP auth backend: the dashboard talks to the site over
# SSE and never connects here, so the only principals are the site bridge, the light rig, and the
# props themselves — a fixed list that a password file and an ACL file cover completely. Nothing
# in this image needs to call back into the site to decide who may publish what.
FROM eclipse-mosquitto:2

# `jq` parses `MQTT_DEVICE_CREDENTIALS`; the base image has neither it nor a shell JSON parser.
RUN apk add --no-cache jq

COPY mosquitto.conf /mosquitto/config/mosquitto.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Root, because the entrypoint writes the password and ACL files into /mosquitto/config before
# starting; mosquitto drops to its own user itself once it has read them.
USER root

EXPOSE 1883
ENTRYPOINT ["/entrypoint.sh"]
