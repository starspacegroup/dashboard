#!/usr/bin/env bash
# Run the dev server behind a Cloudflare tunnel at
#   dev-dashboard-<hash>.starspace.group
#
# The hash is stable per machine+checkout, so the URL survives restarts
# (useful for OAuth callback registration). First run provisions the named
# tunnel and its DNS route; later runs reuse them.
#
# Requires cloudflared authenticated for the starspace.group zone
# (~/.cloudflared/cert.pem — created once via `cloudflared tunnel login`).
set -euo pipefail

PORT="${DEV_PORT:-4200}"
ZONE="starspace.group"

# Stable per machine + checkout; override with DEV_TUNNEL_HASH=abc123
HASH="${DEV_TUNNEL_HASH:-$(printf '%s:%s' "$(cat /etc/machine-id)" "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" | md5sum | cut -c1-6)}"
TUNNEL_NAME="dashboard-dev-${HASH}"
HOSTNAME="dev-dashboard-${HASH}.${ZONE}"
CONFIG="$HOME/.cloudflared/${TUNNEL_NAME}.yml"

if [[ ! -f "$HOME/.cloudflared/cert.pem" ]]; then
	echo "cloudflared is not authenticated. Run: cloudflared tunnel login" >&2
	exit 1
fi

# Provision the tunnel on first run
if ! cloudflared tunnel list --output json 2>/dev/null | grep -q "\"name\": *\"${TUNNEL_NAME}\""; then
	echo "Creating tunnel ${TUNNEL_NAME}..."
	cloudflared tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID=$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "
import json, sys
for t in json.load(sys.stdin):
    if t['name'] == '${TUNNEL_NAME}':
        print(t['id']); break
")

if [[ -z "$TUNNEL_ID" ]]; then
	echo "Failed to resolve tunnel id for ${TUNNEL_NAME}" >&2
	exit 1
fi

# Route DNS via the Cloudflare API. Deliberately NOT `cloudflared tunnel
# route dns` — that infers the zone from the local origin cert (currently
# agapeverse.app) and would create the record in the wrong zone.
DNS_TOKEN="${CLOUDFLARE_DNS_API_TOKEN:-$(cat "$HOME/.cloudflared/dns-edit-token" 2>/dev/null || true)}"
if [[ -z "$DNS_TOKEN" ]]; then
	echo "No DNS token: set CLOUDFLARE_DNS_API_TOKEN or put one in ~/.cloudflared/dns-edit-token" >&2
	exit 1
fi

cf_api() {
	curl -s -H "Authorization: Bearer $DNS_TOKEN" -H "Content-Type: application/json" "$@"
}

ZONE_ID=$(cf_api "https://api.cloudflare.com/client/v4/zones?name=${ZONE}" | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(r[0]['id'] if r else '')")
if [[ -z "$ZONE_ID" ]]; then
	echo "Zone ${ZONE} not accessible with the DNS token" >&2
	exit 1
fi

TARGET="${TUNNEL_ID}.cfargotunnel.com"
EXISTING=$(cf_api "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${HOSTNAME}" | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(r[0]['id'] if r else '')")
RECORD_BODY="{\"type\":\"CNAME\",\"name\":\"${HOSTNAME}\",\"content\":\"${TARGET}\",\"proxied\":true}"
if [[ -n "$EXISTING" ]]; then
	cf_api -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${EXISTING}" -d "$RECORD_BODY" > /dev/null
else
	cf_api -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" -d "$RECORD_BODY" > /dev/null
fi

# (Re)write the ingress config so the port always matches
cat > "$CONFIG" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: $HOME/.cloudflared/${TUNNEL_ID}.json
ingress:
  - hostname: ${HOSTNAME}
    service: http://localhost:${PORT}
  - service: http_status:404
EOF

echo ""
echo "  ➜  Dev tunnel: https://${HOSTNAME}"
echo "     (GitHub OAuth for sign-in needs this callback registered on your"
echo "      dev OAuth app: https://${HOSTNAME}/auth/callback/github)"
echo ""

# Run tunnel in the background, dev server in the foreground;
# tear the tunnel down when the dev server exits.
cloudflared tunnel --config "$CONFIG" run "$TUNNEL_NAME" &
TUNNEL_PID=$!
trap 'kill "$TUNNEL_PID" 2>/dev/null || true' EXIT

npm run dev
