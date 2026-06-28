# VOISSS — Agent Execution Logs (Product Evidence)

Compiled: 2026-06-28 13:12:26 UTC
Source: https://voisss.famile.xyz

---

## Live Endpoint Status

| Section | Status |
|---|---|
| Platform Statistics | ⏳ Not deployed
| Agent Themes / Offerings | ⏳ Not deployed
| ACP Listener Status | ❌ Check key
| Voice Generation API — Quote | ⏳ Not deployed
| Stripe Credit Packs | ⏳ Not deployed
| On-Chain Contracts (Base) | ✅ Deployed
| Agent Discovery Manifest | ⏳ Not deployed

> _Status updated below as each section compiles._


---

## 📊 Platform Statistics | ⏳ Not deployed

```json
{"status":"unauthorized","message":"Requires ADMIN_API_KEY — set it before running this script"}
```


---

## 🎨 Agent Themes / Offerings | ⏳ Not deployed

```json
{"status":"unauthorized","message":"Requires ADMIN_API_KEY — set it before running this script"}
```


---

## 🔌 ACP Listener Status | ❌ Check key

```json
{"status":"not_deployed","message":"This endpoint is not yet deployed to production. Deploy the latest code and try again."}
```


---

## 🎤 Voice Generation API — Quote | ⏳ Not deployed

GET https://voisss.famile.xyz/api/agents/vocalize?agentAddress=0xDEMO0000000000000000000000000000000000001

```json
{"status":"unauthorized","message":"Requires ADMIN_API_KEY — set it before running this script"}
```


---

## 💳 Stripe Credit Packs | ⏳ Not deployed

```json
{"status":"unauthorized","message":"Requires ADMIN_API_KEY — set it before running this script"}
```


---

## ⛓️ On-Chain Contracts (Base) | ✅ Deployed

| Contract | Address | Basescan |
|---|---|---|
| AgentRegistry v2 | `0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c` | [View](https://basescan.org/address/0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c) |
| ReputationRegistry | `0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127` | [View](https://basescan.org/address/0xA09094Cc126166deC8800a7Ada7a3BbDAA32B127) |
| VoiceRecords | `0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D` | [View](https://basescan.org/address/0x32bd629fBD5096b37f1cAee011A7E481A09Ac54D) |
| $VOISSS Token | `0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07` | [View](https://basescan.org/address/0x1c3174c2aea455f1efb088e4ca4ecb4ab52d1b07) |

---

## 🤖 Agent Discovery Manifest | ⏳ Not deployed

```json
{"status":"not_deployed","message":"This endpoint is not yet deployed to production. Deploy the latest code and try again."}
```


---

*Logs compiled automatically by scripts/compile-agent-logs.sh*

---

**How to re-run:**

```bash
# Basic run:
bash scripts/compile-agent-logs.sh

# With admin key (for ACP listener status):
ADMIN_API_KEY=your_key bash scripts/compile-agent-logs.sh

# Custom URL:
NEXT_PUBLIC_APP_URL=http://localhost:3000 bash scripts/compile-agent-logs.sh
```
