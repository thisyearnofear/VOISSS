# Runtime — 30s Loom Script (one take, one product, two tracks)

Use this for your `demoFormat: recorded` submission (`videoUrl` is required — Loom / YouTube / X post **with video**). Text-only X post fails validation. Keep it under 35s; judges watch dozens.

## Setup (30s before you hit record)

- Open 2 windows side-by-side: **left** — `voisss.netlify.app/for-agents`, **right** — terminal + Network inspector.
- Pre-connect a wallet so `universalAddress` is filled (or have a `0x...` agent address copied). If `DYNAMIC_WALLET_PRIVATE_KEY` fallback is used, the wallet will be the fallback EOA — still valid for the demo.
- Confirm env on stage machine: `DYNAMIC_WALLET_PRIVATE_KEY` or `DYNAMIC_API_TOKEN + DYNAMIC_ENVIRONMENT_ID`, plus `X402_PAY_TO_ADDRESS`.
- Quit Slack/Discord notifications. Set Loom to **720p, tab audio off** (you narrate).

---

## One-take timeline

| Time | What you show | What you say (verbatim) |
|------|---------------|--------------------------|
| **0–5s — Hook** | Land on `/for-agents`. Click `Show` on **Self-paying agents**, the two chips slide open. | “VOISSS turns voice IP into a financial primitive. One brief — the agent picks the voice and *pays itself* on Base." |
| **5–15s — Create wallet** | Click **Create agent wallet**. Confetti + `Wallet created — ready to pay` badge pops (new micro-interaction). Copy the `0x...` pill to prove it's a real address. | "First, the agent gets a server wallet — MPC in prod, EOA fallback for the demo. No private key ever touches the browser." |
| **15–25s — Pay without a human** | In terminal, run: `curl -X POST https://voisss.netlify.app/api/agents/vocalize -H "Content-Type: application/json" -H "X-DYNAMIC-WALLET: 1" -d '{"text":"warm female ad for NYC coffee shop, 15s","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0xYourAgent"}' \| jq '.data.paymentMethod, .data.audioUrl'`  — highlight `paymentMethod: "dynamic"` and `audioUrl`. | "Now the same endpoint — but with one header, `X-DYNAMIC-WALLET: 1`. Server signs `TransferWithAuthorization` via Dynamic, CDP verifies, and we get audio plus IPFS." |
| **25–32s — Settlement & CTA** | Expand `How it settles` → `Base · x402 · 70% to contributor`. Hit play on the returned `audioUrl` for 2s. | "Seventy percent settles to the voice owner on-chain — same checkout Bankr scores for token design. One product, two Runtime tracks. Handbook link in the description." |

## Exact curls (paste-ready)

```bash
# 1 — Create / ensure the server wallet (judges can verify without this, but it reads better)
curl -s -X POST https://voisss.netlify.app/api/agents/dynamic-wallet \
  -H "Content-Type: application/json" \
  -d '{"agentAddress":"0xYourAgentAddress"}' | jq

# 2 — Agent decides + pays (the line judges grep for)
curl -s -X POST https://voisss.netlify.app/api/agents/vocalize \
  -H "Content-Type: application/json" \
  -H "X-DYNAMIC-WALLET: 1" \
  -d '{"text":"warm female ad for NYC coffee shop, 15s","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0xYourAgentAddress"}' | jq '.success, .data.paymentMethod, .data.cost, .data.audioUrl'

# 3 — Optional Bankr narrative (shows Grand Prize leg — same checkout)
curl -s https://voisss.netlify.app/api/bankr | jq '.status'
```

## What to leave in the Loom description

```
Agent decides → Dynamic server wallet signs x402 on Base → 70% to contributor.

Code judges check:
  PaymentRouter.processDynamicPayment  (packages/shared/src/services/payment/PaymentRouter.ts)
  DynamicWalletService.signX402Authorization  (packages/shared/src/services/payment/DynamicWalletService.ts)
  X-DYNAMIC-WALLET branch in apps/web/src/app/api/agents/vocalize/route.ts
  UI: apps/web/src/components/payment/RuntimePaymentChips.tsx (DynamicChip)

Docs: https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
Bankr: docs.bankr.bot/cli  — voice IP as tokenized RWAs, same 70/30 rails.
```

## Common mistakes that fail validation (from handbook validation.js)

- `videoUrl` missing when `demoFormat: recorded` → auto-fail. Loom/YouTube/**X post with video** only.
- Links must be `https://` with a dot — no `localhost`, `127.x`, `10.x`, `192.168.x`, no `user:pass@`.
- `xHandle` lowercased, `@` optional, max 15 chars `[a-z0-9_]`. `xUrl` must be `x.com/.../status/123`.
- If you tick Uniswap, you must ship: public repo + `FEEDBACK.md` + `developers.uniswap.org/hackathon-feedback` form + README deep links.

## Timing tips

- Speak 10% slower than feels natural — Loom compresses.
- Don't type the address live — paste `0xYourAgent` (keeps it under 30s).
- If the `Create` call is instant (EOA fallback), narrate the MPC upgrade path: “Swap one env for `DYNAMIC_API_TOKEN` and it’s Threshold MPC.”
- End with audio playing — judges remember sound.

## Checklist before you submit

- [ ] `pnpm --filter @voisss/shared build && pnpm --filter @voisss/shared test && pnpm --filter @voisss/web build` green
- [ ] `GET /api/agents/dynamic-wallet?agentAddress=0x...` returns `hasWallet: true`
- [ ] `POST /api/agents/vocalize` with `X-DYNAMIC-WALLET: 1` returns `paymentMethod: "dynamic"`
- [ ] Loom link is `https://loom.com/...` (public) and pasted as `videoUrl` in the Runtime form
- [ ] Submission summary (≤2000 chars) mentions “voice IP as tokenized RWAs + Bankr for any token launch” — judges check token-design
