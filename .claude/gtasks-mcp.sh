#!/bin/bash
set -a
source /home/yodi/repos/terraprime/.env
set +a
export CLIENT_ID="$GOOGLE_CLIENT_ID"
export CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
export REFRESH_TOKEN="$GOOGLE_REFRESH_TOKEN"
exec npx -y @alvincrave/gtasks-mcp
