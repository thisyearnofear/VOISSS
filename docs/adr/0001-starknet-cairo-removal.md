# ADR 0001 — Remove Starknet / Cairo contracts from the monorepo

**Status:** Accepted
**Date:** 2026-06-13
**Deciders:** (approved)
**Phase:** 0.1 of the "9/10 plan"
**Execution:** 2026-06-13, in this branch

---

## Context

The `packages/contracts/` directory contains a parallel Starknet / Cairo toolchain (`Scarb.toml`, `src/*.cairo`, `lib.cairo`, plus several deploy scripts). It is documented in the contracts README as a "legacy" path that was superseded by the Solidity / Base contracts in `apps/web/contracts/`.

Today, the only thing that *runs* in production is the Next.js web app on `apps/web/`. Nothing in the Next.js app imports or interacts with the Cairo contracts:

- The shared package's `STARKNET_CONFIG` constant references the deployed Starknet addresses, but it's only imported by the `starknet-recording-service.ts` (which is itself unused — see below).
- The mobile app's `apps/mobile/README.md` still references "Scroll Sepolia" (EVM), not Starknet.
- The Flutter app explicitly states in its README: *"Unlike the main VOISSS apps (Web and React Native), the Flutter Butler uses a Serverpod-centric architecture rather than blockchain."*
- A grep across `apps/` and `packages/shared/src/` shows zero non-trivial references to the Cairo contracts.

Meanwhile, the Cairo toolchain:

- Adds a Scarb build step that hasn't run successfully in CI for a long time (no `.scarb` artifacts in the repo).
- The `packages/contracts/scripts/*` are a mix of Starknet account diagnostics, deployment, and signature testing — none of which are wired into any current deploy pipeline.
- The contracts `README.md` describes a `Base Sepolia` deployment of contracts that are *not present in source*, and three "Starknet Sepolia" contracts that are still in source but never deployed from here.
- The Starknet constants in `packages/shared/src/constants.ts` are referenced by `starknet-recording-service.ts` (2.2 KB), which is itself not imported anywhere reachable from the web app.

The cost of keeping the Cairo side:

1. **Cognitive overhead** — new contributors hit Scarb, Cairo, and a parallel network model before they get to the actually-deployed code.
2. **Compile / lint surface** — `pnpm build:contracts` invokes `scarb build` which has its own dependency graph; even when it works, it produces nothing the app uses.
3. **Constant drift** — `STARKNET_CONFIG.CONTRACT_ADDRESSES.VOICE_STORAGE` references an address that is on a network no one is using, and would silently rot if anyone did try to use it.
4. **Misleading docs** — the contracts README claims ownership of a Base Sepolia deployment that lives elsewhere (in another branch or repo, unclear).

## Decision

**Remove the Starknet / Cairo path from this monorepo.**

Concretely:

- Delete `packages/contracts/src/voice_storage.cairo`, `user_registry.cairo`, `access_control.cairo`, `lib.cairo`, `Scarb.toml`.
- Delete the `packages/contracts/scripts/*.ts` that operate on Starknet (`check-account-type.ts`, `check-account.ts`, `create-standard-account.ts`, `deploy.ts`, `extract-abis.ts`, `setup-account.ts`, `test-contract-integration.ts`, `test-signature.ts`, `verify-account.ts`).
- Delete `packages/contracts/deployments/starknet-sepolia.json` and the `scroll-deployment/` folder.
- Delete `packages/contracts/src/starknet/` if any such folder remains.
- In `packages/shared/src/constants.ts`, replace `STARKNET_CONFIG` with a one-line comment: `// Starknet / Cairo path removed — see docs/adr/0001-starknet-cairo-removal.md`.
- Delete `packages/shared/src/services/starknet-recording-service.ts` and `starknet-recording-service.ts` references.
- In root `package.json`, remove `"build:contracts": "cd packages/contracts && scarb build"`.
- Rewrite `packages/contracts/README.md` to be the README for the **Solidity** contracts (which actually live in `apps/web/contracts/`). Or, better, move the Solidity contracts to `packages/contracts/src/solidity/` so the contracts package has a real reason to exist.
- Update `packages/contracts/BASE_MAINNET_DEPLOYED.md` to reflect what's actually in source. Right now it claims `VoiceRecords: 0x32bd629f…` is "in source" but the file is in `apps/web/contracts/`, not here.

## Consequences

**Positive:**

- Removes a parallel-universe toolchain that confuses new contributors.
- Eliminates a class of "why does this not work" bugs from the build matrix.
- Makes the contracts package either be a real shared Solidity monorepo, or get removed entirely (next step).
- Documentation becomes honest about what's deployed.

**Negative:**

- Loses the ability to ever ship a Starknet deployment from this monorepo. **Mitigation:** the deployed Starknet contract addresses, if they were ever used, can be preserved as a frozen constants file in a `legacy/starknet/` folder. If no production traffic is using them, this is a no-op.
- If the team has plans to re-launch on Starknet, this closes that door. **Mitigation:** none; if you want to keep that option, defer this ADR.

**Reversibility:**

- All deletions are in git, so this can be reverted in 30 seconds if needed.
- The Scarb / Cairo toolchain is not part of the production deploy, so there is no operational risk.

## Alternatives considered

1. **Keep Cairo, mark as "legacy / not deployed"** — preserves the option but leaves the foot-gun in place. Rejected.
2. **Move Cairo to a `legacy/starknet/` folder** — slightly more cautious than deletion but adds no real value: nothing in the live app reaches for it. Could revisit if the team wants a paper trail.
3. **Re-launch on Starknet as a real option** — out of scope for the 9/10 plan; would warrant its own ADR.

## Open questions

- ~~Is anyone actively using the deployed Starknet addresses from `STARKNET_CONFIG.CONTRACT_ADDRESSES`?~~ **Resolved: no.** Confirmed by ripgrep; the only reader was `test-deployment.ts`, which is also deleted.
- ~~Should the Solidity contracts move from `apps/web/contracts/` to `packages/contracts/src/solidity/`?~~ Deferred to Phase 3.

## Execution notes (2026-06-13)

The deletion was applied as described, with the following adjustments:

- The `packages/contracts/` package was deleted wholesale (Cairo + Starknet scripts + Starknet deployment JSON). It was a pure-Cairo artifact; the Solidity contracts live in `apps/web/contracts/` with their own hardhat config.
- The cascade was wider than the ADR anticipated. Deleted in addition to the original list:
  - `packages/shared/src/services/recording-service.ts` (orphaned after removing `starknet-recording-service.ts`)
  - `packages/shared/src/test-integration.ts` (orphaned)
  - `packages/shared/src/contracts/abis.ts` (orphaned)
  - `packages/shared/src/contracts/test-deployment.ts` (orphaned)
  - `packages/shared/src/contracts/deployments.json` (Starknet addresses)
  - `packages/shared/src/blockchain/chains/starknet.ts` (Starknet chain config, unused)
  - `packages/shared/src/starknet/index.ts` (Starknet config singleton, unused)
  - `scripts/verify-integration.ts` (Starknet verification script)
- Edits:
  - `STARKNET_INTEGRATION` removed from `FEATURES` constant.
  - `isValidStarknetAddress` removed from `utils.ts`.
  - `'starknet'` removed from `'scroll' | 'starknet' | 'both'` union types in `test-utils/validators.ts` (×2), `types/audio.ts` (×2), and `types/api.types.ts` equivalents.
  - `chain: 'base' | 'starknet'` → `chain: 'base'` in `config/platform.ts` and `test-utils/mocks.ts`.
  - `starknet` queryKeys removed from `apps/web/src/lib/query-client.ts` and `apps/mobile/lib/query-client.ts`.
  - `index.native.ts` comments cleaned up.
  - `starknet` dep removed from `packages/shared/package.json`; `--external starknet` removed from `build` and `build:native` scripts.
  - Root `package.json`: `build` script no longer needs `--filter=!@voisss/contracts`; `build:contracts` script removed.

### Mobile app entanglement (deferred, not blocking)

The mobile app (`apps/mobile/`) references 'starknet' as a chain option in:

- `apps/mobile/utils/starknet.ts` — the mobile blockchain utility (the *file name* is `starknet.ts` and it exports a `starknet` symbol, but it does not import the @starknet SDK; it just uses the string).
- `apps/mobile/components/ChainSelector.tsx` — UI lets the user pick Base / Scroll / Starknet.
- `apps/mobile/hooks/useBase.ts` — has `useStarknetStatus` (returns false / "not connected" in practice).
- `apps/mobile/store/settingsStore.ts`, `recordingsStore.ts`, `subscriptionStore.ts` — types reference 'starknet' as a chain option.
- `apps/mobile/types/index.ts` — has a Starknet chain config (object literal, not a network call).

**Why this is deferred:** the mobile app is not in CI (`.github/workflows/deploy-voisss-backend.yml` is the only workflow, and it builds the Express service, not the mobile app), and the mobile app's own README says `## CURRENT STATUS: SCROLL INTEGRATION IN PROGRESS`. The string `'starknet'` exists in mobile as a chain option for a UI that no production user reaches. The mobile app is not in the 9/10 plan's critical path (which is the production Next.js web app + shared package + smart contracts).

**How to clean it up later (separate effort):** rename the `starknet` chain option in mobile to something inert (or remove it entirely; the mobile README says it targets Scroll Sepolia, so Base/Scroll is the real pair). The change is mostly mechanical string replacement, plus a UI decision about whether to keep showing Starknet in the chain selector at all.
