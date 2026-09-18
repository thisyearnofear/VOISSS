# Runtime — Dynamic + Bankr Integration

**Status:** production-ready, graceful degradation, zero breaking changes. Web build
passes without Dynamic/Bankr keys or packages installed (CI stays green).

**Handbook:** https://runtime.nyc/handbook (Sep 13–19, 2026 · NYC + Online)
**Submit by:** Sat Sep 19 4 PM EDT · Demos 5 PM EDT
Every submission is auto-eligible for **Bankr $20k grand prize**; sponsor tracks
are opt-in and stackable on the same project.

## Wedge fit

`VOISSS` is `financial infrastructure for voice IP` — not a marketplace skin.
The Runtime story is `tokenized RWAs + agent-to-agent settlement + 70/30 programmatic
royalty on Base`. Only two integrations compound:

- **Bankr Grand $20k** — product-first, onchain potential + token design. Integration
  optional but the `if you launch a token, use Bankr` rule is judged.
- **Dynamic $2k “Best Agentic Wallet / Payment Experience”** — the agent *decides
  which voice fits the brief* and **pays itself** without a human in the loop.
  This is the exact track brief (`API buyers, delegated assistants`).

Everything else (Definitive Flash `DCA/Limit/TWAP/Bracket`, Blackbird Flynet) is
a distraction for this thesis — only add if trivial.

## What shipped

### 1. `packages/shared/src/services/payment/DynamicWalletService.ts`
Server-wallet pattern (backend-owned, API-token auth, MPC):

- `GET /api/agents/dynamic-wallet?agentAddress=0x...` → status + wallet (read)
- `POST /api/agents/dynamic-wallet` `{ agentAddress, action?: "create"|"sign" }` → provision / sign
- `payment/dynamic` availability in `PaymentRouter.getQuote()`; `processDynamicPayment()` proves the pattern
- `POST /api/agents/vocalize` with `X-DYNAMIC-WALLET: 1` triggers server-signed x402:
  `typedData via X402Client.createTypedData` → `DynamicWalletService.signX402Authorization`
  → `X402Client.verifyPayment` (CDP facilitator on `api.cdp.coinbase.com/platform/v2/x402`).
- Graceful fallback: `DYNAMIC_WALLET_PRIVATE_KEY=0x…` signs via `viem/accounts` so the
  `agent decides → pays → gets voice` loop demos even before MPC onboarding.
- MPC path uses `@dynamic-labs-wallet/node-evm` + `@dynamic-labs-wallet/core`
  with `ThresholdSignatureScheme.TWO_OF_TWO`, `backUpToDynamic:true`, Node 18+,
  non-edge (`runtime="nodejs"`). Packages are optional (see `.env.example`).

References:
- https://www.dynamic.xyz/docs/overview/agents/overview (wallet patterns)
- https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview (create/sign, persistence)
- https://www.dynamic.xyz/docs/overview/agents/agent-payments (x402/MPP wiring)
- https://www.dynamic.xyz/docs/node/quickstart (env + ThresholdSignatureScheme)

### 2. `apps/web/src/lib/bankr.ts` + `apps/web/src/app/api/bankr/route.ts`
Thin, typed client for:
- Wallet API: `GET /wallet/me`, `GET /wallet/portfolio` (also portfolio pnl/nfts, swap/transfer/sign/submit)
- Agent API: `POST /agent/prompt` → `GET /agent/job/:id` (poll with `bankrAgentPromptAndPoll`)
- LLM Gateway: `POST https://llm.bankr.bot/v1/chat/completions` and `/v1/messages` (OpenAI + Anthropic compat)
- Token launch preview (simulate) — full wizard lives in `@bankr/cli`

Route:
- `GET /api/bankr?view=status|wallet|portfolio|llm-models` → status without key, or proxied data with `BANKR_API_KEY`
- `POST /api/bankr` `{ action:"prompt"|"chat"|"token-preview", ... }` → proxies

Never exposes keys to the browser.

References:
- https://docs.bankr.bot/cli/ (login, `bankr login email ... --llm`, `bankr whoami`)
- https://github.com/BankrBot/skills/blob/main/bankr/SKILL.md (Wallet + Agent + LLM Gateway contract)
- https://docs.bankr.bot/llm-gateway/overview (unified gateway, credits funded from launch fees)
- https://docs.bankr.bot/token-launching/overview (token launch)

### 3. `PaymentRouter` extensions (`types.ts` + `PaymentRouter.ts`)
- `PaymentMethod` adds `"dynamic"`, `PaymentPreference` adds `"dynamic_first"`.
- `getQuote()` advertises `"dynamic"` when `DYNAMIC_API_TOKEN`+`DYNAMIC_ENVIRONMENT_ID` or `DYNAMIC_WALLET_PRIVATE_KEY` exists (try/catch so missing package doesn't break quotes).
- `processDynamicPayment()` exists alongside existing `process()` / `processX402Payment()`.
- `selectBestMethod()` respects `dynamic_first` → `credits_first` → `tier_if_available` → `x402_only`.
- `X402Client` unchanged — Dynamic reuses its `createRequirements` / `createTypedData` / `verifyPayment`.

### 4. Build fix
- `@dynamic-labs-wallet/*` marked external in `packages/shared` tsup (server build) and
  aliased to `false` + `webpackIgnore` dynamic `import()` in `DynamicWalletService`
  so `next build` passes when the native addon isn't installed.

### 5. Vocalize wiring (`apps/web/src/app/api/agents/vocalize/route.ts`)
Opt-in via `X-DYNAMIC-WALLET: 1` (or `X-DYNAMIC-AGENT-PAY: 1`) header:
- If present alongside a body `agentAddress`, the handler creates/looks up the Dynamic
  server wallet, signs the `TransferWithAuthorization`, verifies via the facilitator,
  then streams `generateAndReturnVoice()` with `paymentMethod: "dynamic"`.
- Falls through to the normal `credits → tier → x402 402` flow on failure, so existing
  clients break nothing.
- Calls `paymentRouter.processDynamicPayment(...)` — the verifiable line judges check.

### 6. Env
```bash
# .env.example (root) + apps/web/.env.example
BANKR_API_KEY=bk_...
BANKR_LLM_KEY=bk_...  # may equal BANKR_API_KEY
DYNAMIC_API_TOKEN=…
DYNAMIC_ENVIRONMENT_ID=…
DYNAMIC_WALLET_PASSWORD=…
DYNAMIC_WALLET_PRIVATE_KEY=0x… # demo EOA fallback only
CDP_API_KEY_ID=… CDP_API_KEY_SECRET=… CDP_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
```

## How to demo (90s)

1. Create / look up the wallet:
   ```bash
   curl -X POST https://your-app/api/agents/dynamic-wallet \
     -H "Content-Type: application/json" \
     -d '{"agentAddress":"0xYourAgentAddress"}'
   ```
2. Agent picks a voice (Gemini) and calls vocalize with the Dynamic header:
   ```bash
   curl -X POST https://your-app/api/agents/vocalize \
     -H "Content-Type: application/json" \
     -H "X-DYNAMIC-WALLET: 1" \
     -d '{"text":"warm female ad for NYC coffee shop, 15s","voiceId":"21m00Tcm4TlvDq8ikWAM","agentAddress":"0xYourAgentAddress"}'
   ```
   Response contains `paymentMethod:"dynamic"`, `txHash`, `audioUrl`, `ipfsHash`.
3. Show Bankr alongside (optional narrative):
   ```bash
   curl https://your-app/api/bankr?view=portfolio | jq
   # or via CLI
   bankr wallet portfolio --json
   bankr llm credits   # funding source for Bankr LLM Gateway
   ```

Judges verify: `DynamicWalletService.ts:signX402Authorization` +
`PaymentRouter.ts:processDynamicPayment` + `apps/web/src/app/api/agents/dynamic-wallet/route.ts`.

## Bankr token story (for submission)

In the Runtime submission's `summary` (≤2000 chars), state:
- `Voice IP as tokenized real-world assets on Base, trading on the same rails
  as other equities — VOISSS uses Bankr to launch, fund, and distribute the
  project token when a token is introduced (Bankr handbook § challenge).`
- During the week, run a simulate:
  `bankr launch --name "VOISSS Voice Share" --symbol VVOISS --chain base --simulate --yes`
  — or POST `/api/bankr { action:"token-preview", name:"VOISSS Voice Share" }`.
  Keep it simulated on stage; real launch post-Runtime via `SKILL.md` / `docs.bankr.bot`.

## Validation traps (from `validation.js`)
- Links must be `https://` with a dot, no `localhost/10.x/192.168/127.x`, no `user:pass@`.
- `demoFormat: recorded` ⇒ `videoUrl` required (Loom/YouTube/**X post with video** — text-only X fails).
- `xHandle` lowercased `@`-optional 15-char `[a-z0-9_]`, `xUrl` must be `x.com/.../status/123...`.
- If you also enter Uniswap: public repo + `FEEDBACK.md` + `developers.uniswap.org/hackathon-feedback` form + README deep links.
- If you also enter Definitive Flash: `tag @DefinitiveFi on X + description`.

## What NOT to add
- No new chain prototypes (contracts stay `Base 8453: 0xBE85..., 0x32bd..., 0x1c31…`).
- No Flynet/Restaurant wrappers — zero post-hackathon leverage.
- No client-side Dynamic SDK — all signing is server-side (keeps keys out of the bundle).
