#!/bin/bash
# compile-agent-logs.sh
#
# Compiles agent execution logs, API usage records, and platform stats
# into a single hackathon submission evidence file.
#
# Usage: bash scripts/compile-agent-logs.sh
#   ADMIN_API_KEY=... bash scripts/compile-agent-logs.sh  (for authenticated endpoints)
# Output: docs/AGENT_EXECUTION_LOGS.md

set -e

OUTPUT_FILE="docs/AGENT_EXECUTION_LOGS.md"
APP_URL="${NEXT_PUBLIC_APP_URL:-https://voisss.netlify.app}"

# ─── Helpers ──────────────────────────────────────────────────────────────────

# fetch_json <url> [auth_header]
#   Makes a GET request, inspects HTTP status, and outputs a clean JSON string
#   (or a descriptive error message) — never raw HTML.
fetch_json() {
  local url="$1"
  local auth="$2"

  if ! command -v curl &> /dev/null; then
    echo '{"error":"curl not available"}'
    return
  fi

  local headers=()
  if [ -n "$auth" ]; then
    headers+=(-H "Authorization: Bearer $auth")
  fi

  # Use a temp file for body so we can capture status separately
  local tmp_body
  tmp_body=$(mktemp /tmp/voisss-logs.XXXXXX)
  local http_code
  http_code=$(curl -s -o "$tmp_body" -w "%{http_code}" --max-time 10 "${headers[@]}" "$url" 2>/dev/null || echo "000")

  case "$http_code" in
    000)
      echo '{"error":"Request timed out or failed to connect"}'
      ;;
    200|201)
      # Valid response — try to pretty-print JSON
      local content
      content=$(cat "$tmp_body")
      if echo "$content" | python3 -m json.tool 2>/dev/null; then
        :  # already printed by python3
      elif echo "$content" | jq . 2>/dev/null; then
        :  # already printed by jq
      else
        echo "$content"
      fi
      ;;
    302|307|308)
      echo '{"status":"redirect","message":"Endpoint redirected — may need reconfiguration"}'
      ;;
    401)
      echo '{"status":"unauthorized","message":"Requires ADMIN_API_KEY — set it before running this script"}'
      ;;
    403)
      echo '{"status":"forbidden","message":"Access denied"}'
      ;;
    404)
      echo '{"status":"not_deployed","message":"This endpoint is not yet deployed to production. Deploy the latest code and try again."}'
      ;;
    502)
      echo '{"status":"backend_down","message":"Backend server unreachable (502 Bad Gateway). The Hetzner backend may be down. SSH in and check: pm2 status"}'
      ;;
    503)
      echo '{"status":"service_unavailable","message":"Service temporarily unavailable (503)"}'
      ;;
    *)
      echo "{\"status\":\"error\",\"http_code\":\"$http_code\",\"message\":\"Unexpected HTTP $http_code response\"}"
      ;;
  esac

  rm -f "$tmp_body"
}

# section <emoji> <title>
section() {
  local emoji="$1"
  local title="$2"
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "## $emoji $title" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
}

# codeblock <lang> <content>
codeblock() {
  local lang="$1"
  local content="$2"
  if [ "$lang" = "json" ]; then
    echo '```json' >> "$OUTPUT_FILE"
  else
    echo '```' >> "$OUTPUT_FILE"
  fi
  echo "$content" >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
}

# ─── Header ───────────────────────────────────────────────────────────────────

cat > "$OUTPUT_FILE" <<EOF
# VOISSS — Agent Execution Logs (Product Evidence)

Compiled: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Source: $APP_URL

---

## Live Endpoint Status

| Section | Status |
|---|---|
EOF

echo "| Platform Statistics | — |" >> "$OUTPUT_FILE"
echo "| Agent Themes / Offerings | — |" >> "$OUTPUT_FILE"
echo "| ACP Listener Status | — |" >> "$OUTPUT_FILE"
echo "| Voice Generation API — Quote | — |" >> "$OUTPUT_FILE"
echo "| Stripe Credit Packs | — |" >> "$OUTPUT_FILE"
echo "| On-Chain Contracts (Base) | ✅ Deployed |" >> "$OUTPUT_FILE"
echo "| Agent Discovery Manifest | — |" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "> _Status updated below as each section compiles._" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# ─── 1. Platform Statistics ───────────────────────────────────────────────────

section "📊" "Platform Statistics"

RESULT=$(fetch_json "$APP_URL/api/tools/platform-stats")
codeblock "json" "$RESULT"

# Update status table
if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status') is None else 1)" 2>/dev/null; then
  sed -i '' 's/Platform Statistics.*$/Platform Statistics | ✅ Online/' "$OUTPUT_FILE" || true
else
  sed -i '' 's/Platform Statistics.*$/Platform Statistics | ⏳ Not deployed/' "$OUTPUT_FILE" || true
fi

# ─── 2. Available Themes ─────────────────────────────────────────────────────

section "🎨" "Agent Themes / Offerings"

RESULT=$(fetch_json "$APP_URL/api/agents/themes")
codeblock "json" "$RESULT"

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status') is None else 1)" 2>/dev/null; then
  sed -i '' 's/Agent Themes.*$/Agent Themes \/ Offerings | ✅ Online/' "$OUTPUT_FILE" || true
else
  sed -i '' 's/Agent Themes.*$/Agent Themes \/ Offerings | ⏳ Not deployed/' "$OUTPUT_FILE" || true
fi

# ─── 3. ACP Listener Status ──────────────────────────────────────────────────

section "🔌" "ACP Listener Status"

if [ -n "$ADMIN_API_KEY" ]; then
  RESULT=$(fetch_json "$APP_URL/api/acp/listener" "$ADMIN_API_KEY")
  if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status') is None else 1)" 2>/dev/null; then
    sed -i '' 's/ACP Listener.*$/ACP Listener Status | ✅ Authenticated/' "$OUTPUT_FILE" || true
  else
    sed -i '' 's/ACP Listener.*$/ACP Listener Status | ❌ Check key/' "$OUTPUT_FILE" || true
  fi
else
  RESULT='{"status":"skipped","message":"ADMIN_API_KEY not set in environment. Run: ADMIN_API_KEY=your_key bash scripts/compile-agent-logs.sh"}'
  sed -i '' 's/ACP Listener.*$/ACP Listener Status | ⏳ Needs ADMIN_API_KEY/' "$OUTPUT_FILE" || true
fi
codeblock "json" "$RESULT"

# ─── 4. Voice Generation Sample ──────────────────────────────────────────────

section "🎤" "Voice Generation API — Sample Quote"

echo "GET $APP_URL/api/agents/vocalize?agentAddress=0xDEMO0000000000000000000000000000000000001" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

RESULT=$(fetch_json "$APP_URL/api/agents/vocalize?agentAddress=0xDEMO0000000000000000000000000000000000001")
codeblock "json" "$RESULT"

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status') is None and d.get('error') is None else 1)" 2>/dev/null; then
  sed -i '' 's/Voice Generation.*$/Voice Generation API — Quote | ✅ Online/' "$OUTPUT_FILE" || true
elif echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status')=='backend_down' else 1)" 2>/dev/null; then
  sed -i '' 's/Voice Generation.*$/Voice Generation API — Quote | ❌ Backend down/' "$OUTPUT_FILE" || true
else
  sed -i '' 's/Voice Generation.*$/Voice Generation API — Quote | ⏳ Not deployed/' "$OUTPUT_FILE" || true
fi

# ─── 5. Stripe Credit Packs ──────────────────────────────────────────────────

section "💳" "Stripe Credit Packs (Fiat → USDC Credits)"

RESULT=$(fetch_json "$APP_URL/api/payments/stripe")
codeblock "json" "$RESULT"

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status') is None and d.get('error') is None else 1)" 2>/dev/null; then
  sed -i '' 's/Stripe Credit.*$/Stripe Credit Packs | ✅ Online/' "$OUTPUT_FILE" || true
elif echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status')=='backend_down' else 1)" 2>/dev/null; then
  sed -i '' 's/Stripe Credit.*$/Stripe Credit Packs | ❌ Backend down/' "$OUTPUT_FILE" || true
else
  sed -i '' 's/Stripe Credit.*$/Stripe Credit Packs | ⏳ Not deployed/' "$OUTPUT_FILE" || true
fi

# ─── 6. Smart Contract Verification ──────────────────────────────────────────

section "⛓️" "On-Chain Contracts (Base Mainnet)"

cat >> "$OUTPUT_FILE" <<TABLE
| Contract | Address | Basescan |
|---|---|---|
| AgentRegistry v2 | \`0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c\` | [View](https://basescan.org/address/0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c) |
| ReputationRegistry | \`0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127\` | [View](https://basescan.org/address/0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127) |
| VoiceRecords | \`0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D\` | [View](https://basescan.org/address/0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D) |
| \$VOISSS Token | \`0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07\` | [View](https://basescan.org/address/0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07) |
TABLE

sed -i '' 's/On-Chain Contracts.*$/On-Chain Contracts (Base) | ✅ Deployed/' "$OUTPUT_FILE" || true

# ─── 7. AI Plugin Manifest ──────────────────────────────────────────────────

section "🤖" "Agent Discovery Manifest"

RESULT=$(fetch_json "$APP_URL/.well-known/ai-plugin.json")
codeblock "json" "$RESULT"

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('status') is None and d.get('error') is None else 1)" 2>/dev/null; then
  sed -i '' 's/Agent Discovery.*$/Agent Discovery Manifest | ✅ Online/' "$OUTPUT_FILE" || true
else
  sed -i '' 's/Agent Discovery.*$/Agent Discovery Manifest | ⏳ Not deployed/' "$OUTPUT_FILE" || true
fi

# ─── Footer ──────────────────────────────────────────────────────────────────

echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "*Logs compiled automatically by scripts/compile-agent-logs.sh*" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**How to re-run:**" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo '```bash' >> "$OUTPUT_FILE"
echo "# Basic run:" >> "$OUTPUT_FILE"
echo "bash scripts/compile-agent-logs.sh" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "# With admin key (for ACP listener status):" >> "$OUTPUT_FILE"
echo "ADMIN_API_KEY=your_key bash scripts/compile-agent-logs.sh" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "# Custom URL:" >> "$OUTPUT_FILE"
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000 bash scripts/compile-agent-logs.sh" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

echo ""
echo "✅ Agent execution logs compiled to $OUTPUT_FILE"
echo ""
echo "   Summary:"
grep '^|' "$OUTPUT_FILE" | grep -v '^|---' | head -8 | while read -r line; do
  echo "     $line"
done
echo ""
echo "   Run with ADMIN_API_KEY to include ACP listener status:"
echo "     ADMIN_API_KEY=your_key bash scripts/compile-agent-logs.sh"
