#!/bin/sh
# Build mosquitto's password and ACL files from the environment, then hand over to the broker.
#
# Everything here exists because props are physically handed to players. A prop that walks out of
# the room in someone's pocket is a credential in someone's pocket, so each device gets its own
# username and password, and an ACL that lets it speak for itself and nothing else. A shared
# broker login would make one lost handheld enough to drive every screen in the building.
set -eu

MQTT_PORT="${MQTT_PORT:-${PORT:-1883}}"

CONFIG_DIR=/mosquitto/config
PASSWD_FILE="$CONFIG_DIR/passwd"
ACL_FILE="$CONFIG_DIR/acl"

require() {
	# shellcheck disable=SC2016
	eval "value=\${$1:-}"
	if [ -z "$value" ]; then
		echo "mqtt: $1 is required" >&2
		exit 1
	fi
}

require MQTT_BRIDGE_USERNAME
require MQTT_BRIDGE_PASSWORD

: > "$PASSWD_FILE"
: > "$ACL_FILE"
chmod 600 "$PASSWD_FILE" "$ACL_FILE"

add_user() {
	mosquitto_passwd -b "$PASSWD_FILE" "$1" "$2"
}

# The site bridge. The only principal allowed to address a device or fire a cue: every command in
# the system is published by the server, on behalf of the control room or a server-side rule.
add_user "$MQTT_BRIDGE_USERNAME" "$MQTT_BRIDGE_PASSWORD"
cat >> "$ACL_FILE" <<EOF
user $MQTT_BRIDGE_USERNAME
topic read tp/event/#
topic read tp/device/+/status
topic write tp/device/+/cmd
topic write tp/cue/light
topic write tp/broadcast/notify

EOF

# The light rig: one subscription, nothing else. It needs to understand no part of this system
# beyond the cue payload, and the ACL is what keeps it that way.
if [ -n "${MQTT_LIGHT_USERNAME:-}" ]; then
	require MQTT_LIGHT_PASSWORD
	add_user "$MQTT_LIGHT_USERNAME" "$MQTT_LIGHT_PASSWORD"
	cat >> "$ACL_FILE" <<EOF
user $MQTT_LIGHT_USERNAME
topic read tp/cue/light

EOF
fi

# Per-device credentials, as `[{"uid":"agues-01","password":"...","roles":["aguesguard"]}]`.
# Generate it with `pnpm mqtt:credentials` in `site/`, which reads the device registry so the
# roles here match what the device actually is.
if [ -n "${MQTT_DEVICE_CREDENTIALS:-}" ]; then
	echo "$MQTT_DEVICE_CREDENTIALS" | jq -r '.[] | [.uid, .password, ((.roles // []) | join(","))] | @tsv' |
		while IFS="$(printf '\t')" read -r uid password roles; do
			if [ -z "$uid" ] || [ -z "$password" ]; then
				echo "mqtt: skipping a credential entry with no uid or password" >&2
				continue
			fi
			add_user "$uid" "$password"

			# Its own subtree, and the one broadcast every prop listens on. Note `read` on its own
			# command topic and `write` on its own status topic: a device may never publish a command,
			# so a compromised prop cannot drive its neighbours.
			cat >> "$ACL_FILE" <<EOF
user $uid
topic write tp/device/$uid/status
topic read tp/device/$uid/cmd
topic read tp/broadcast/notify
EOF

			# Event topics follow the device's role, because that is what the hardware can actually
			# witness. The handheld is the networked prop in a docking: it reads the Port's UID over
			# UART and reports the pairing, so `port/*` belongs to the AguesGuard, not to the Port.
			for role in $(echo "$roles" | tr ',' ' '); do
				case "$role" in
				aguesguard)
					cat >> "$ACL_FILE" <<EOF
topic write tp/event/port/connected
topic write tp/event/port/disconnected
topic write tp/event/printer/connected
topic write tp/event/print/taken
EOF
					;;
				game)
					echo "topic write tp/event/game/won" >> "$ACL_FILE"
					;;
				light)
					echo "topic read tp/cue/light" >> "$ACL_FILE"
					;;
				port | printer)
					# Standardised boards that carry a UID and no network of their own. They hold a
					# role in the registry but never connect to the broker; if one ever does, it
					# starts with no event permissions rather than inheriting someone else's.
					;;
				esac
			done
			echo "" >> "$ACL_FILE"
		done
fi

sed "s/__MQTT_PORT__/$MQTT_PORT/" "$CONFIG_DIR/mosquitto.conf.template" > "$CONFIG_DIR/mosquitto.conf"

echo "mqtt: listening on $MQTT_PORT with $(grep -c '^user ' "$ACL_FILE") principals"
exec mosquitto -c "$CONFIG_DIR/mosquitto.conf"
