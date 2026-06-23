# Logto Modernization Blueprint

A drastic-but-honest modernization plan for the Logto monorepo, ground-truthed
against the actual repo state (June 2026).

These docs are **planning artifacts**, not committed decisions. Each upgrade is
tagged with effort / risk / value so you can sequence them.

## Current repo state (verified)

| Area | Today (verified in repo) |
|------|--------------------------|
| Frontend | React `18.3`, 3 SPAs (experience/console/account), SCSS modules |
| Routing | `react-router-dom` `7.18` |
| Data | `swr` `2.2` (console) **+** `@tanstack/react-query` `5.101` (experience) — mixed |
| Forms/validation | `react-hook-form` `7.80` + `zod` `3.24` **+** `superstruct` `2.0` — mixed |
| i18n | `i18next` `22.4` (4 majors behind) |
| Backend | Koa `2.16`, `@silverhand/slonik` `31-beta.2` (forked) |
| OIDC | `github:logto-io/node-oidc-provider#5570006…` (SHA-pinned fork) |
| Tests | `jest` `29.7` (core) **+** `vitest` `4.1` (libs) — mixed |
| Lint | `eslint` `8.56` (+ `@silverhand/eslint-config`) |
| TS | `5.9.3` |
| Build | `vite` `8.0` / `6.2` (mixed) |
| Node | `^22.14` |
| Observability | `app-insights` package (Azure-specific) |
| `@silverhand` forks | eslint-config (34), ts-config (17), essentials (14), slonik (3), react (3) |

## The documents

| # | File | Scope |
|---|------|-------|
| 1 | [01-frontend.md](01-frontend.md) | React 19, styling, routing, state, data, forms, i18n, shared UI |
| 2 | [02-backend.md](02-backend.md) | Koa→Hono, Slonik→Drizzle, validation, runtime |
| 3 | [03-toolchain-dx.md](03-toolchain-dx.md) | Biome, TS 6, Rolldown, Turborepo, pnpm catalog |
| 4 | [04-security-crypto.md](04-security-crypto.md) | **EdDSA, DPoP, PAR, secret mgmt** — highest value |
| 5 | [05-supply-chain.md](05-supply-chain.md) | `@silverhand` fork audit, provenance, Renovate |
| 6 | [06-database.md](06-database.md) | Migrations, pooling, replicas, audit-log partitioning |
| 7 | [07-testing.md](07-testing.md) | Vitest unify, **OIDC conformance**, visual regression, pen-tests |
| 8 | [08-observability.md](08-observability.md) | app-insights → **OTel/SigNoz**, structured audit events |
| 9 | [09-compliance-governance.md](09-compliance-governance.md) | SBOM, FAPI 2.0, GDPR export/erasure |
| 10 | [10-oidc-fork-shrink.md](10-oidc-fork-shrink.md) | **Shrink the SHA-pinned fork** (research-backed) |
| 11 | [11-user-facing-features.md](11-user-facing-features.md) | **Product** gaps, not tech-stack: security-event notifications, self-service delete/export, trusted devices |
| 12 | [12-stack-health.md](12-stack-health.md) | **Current-vs-target table** for every dep (internet-validated) + the phased modernization roadmap |
| — | [00-roadmap.md](00-roadmap.md) | Single prioritized, sequenced roadmap across all axes |

## Reading order

Start with [00-roadmap.md](00-roadmap.md) for the prioritized sequence, then dive
into the per-axis files for detail.

## Guiding principle

> Logto is an **auth product**. Its moat is security + standards-compliance, not
> bundle size. Prioritize accordingly: standards/security wins (docs 4, 7, 10)
> rank above pure perf/DX wins (docs 1–3) even though the latter feel more
> "drastic". A faster build does not differentiate an IdP; FAPI/DPoP/conformance do.

## Progress tracker

### ✅ Done
- **Tooling/build**: pnpm catalog, Turborepo, Renovate, audit-gate, SBOM, `.nvmrc`, SECURITY.md
- **Dep modernization**: Zod 3→4 (repo-wide incl. 55 connectors), superstruct→Zod, Vite 6→8,
  TypeScript 5.5→5.9, ky 1→2, nodemailer 8→9, samlify 2.10→2.13, koa-body 6→8, dayjs/nanoid/
  essentials/@logto-react bumps
- **Backend dep batch** (researched per-dep): **jose 5→6** (`KeyLike`→`CryptoKey|KeyObject`; pure-ESM,
  needed a Jest `node:crypto`-mock + `mockEsm` fix), `@aws-sdk/client-s3`, `libphonenumber-js`,
  `@simplewebauthn` 13, `chalk`, `iconv-lite`, `fast-xml-parser` 5, `semver`
- **Migration-regression fixes** (from the bumps above):
  - **Zod 4 `deepPartial()` removal** broke `passwordPolicy` back-fill → rebuilt `partialPasswordPolicyGuard`
  - **koa-body 6→8** single-file shape change broke 3 upload routes → `buildUploadFilesGuard` normalizer
  - **ky 1→2** auto-consumes the HTTP error body onto `error.data` → `error.response.json()`/`.text()`
    now throws "Body has already been read". Fixed **35 sites**: 33 in integration-tests + **2 in
    production** (`core/src/libraries/hook` webhook error path + hook-test endpoint). `got`-based and
    already-`error.data` sites were left alone. See "HTTP client" under Next.
- **Runtime**: Node 22→24, pnpm 10→11, `pnpm dedupe`, 3 high-severity vuln fixes (samlify/
  nodemailer/http-proxy-middleware)
- **Testing**: Jest→Vitest (console), StepUp feature debugged/completed + 17 tests
- **EdDSA signing** ✅ — enabled & verified across all layers (enum + `ed25519` key-gen + provider
  `supportedSigningAlgs` + the load-bearing `kty:OKP→EdDSA` maps in both `env-set/oidc.ts` (sign) and
  `libraries/logto-config.ts` (display) + CLI allowlist; Console UI auto-handles via `Object.values`).
  Verified live: rotate→Ed25519 key→M2M token→JWKS verify→`alg==='EdDSA'` (new integration test) +
  unit test (RSA/EC/EdDSA→correct JWK `kty`). Default stays EC (opt-in, backward-compatible).

### 🔜 Next (highest-value pending)
- **OIDC standards (Wave 1)** — PAR, DPoP, wildcard-drop, conformance CI (EdDSA ✅ done). Cross-layer
  feasibility audited: all feasible, none fork-blocked. See [04-security-crypto.md](04-security-crypto.md#-cross-layer-feasibility-audit-verified-against-the-installed-fork).
- **Security-event notifications (Phase 1)** — *product* gap, not a dep. Logto sends only transactional
  verification emails; **zero** proactive alerts (new-device / password-changed / MFA-added) that every
  competitor ships. Feasibility audited: ~80% infra reuse (email connector + templates + existing
  `User.Data.Updated` events), ~1 week for the account-change subset, no migration. Best product ROI.
  See [11-user-facing-features.md](11-user-facing-features.md#1-security-event-notifications--best-roi--recommended-first).
- **HTTP client — reconsider `ky`** (S–M). `ky` v2 already cost us a silent runtime regression (the
  `error.data` body-consume break, 35 sites). It's pure-ESM (same Jest friction as `jose`) and
  surprises us on majors. Two better targets:
  - **`ofetch`** (unjs) — closest drop-in: `error.data` is *built-in* (kills this whole bug class),
    plus retry/interceptors, fetch-based. Best DX-for-effort.
  - **native `fetch` + a ~40-line wrapper** (throw-on-non-2xx + retry + timeout + JSON) — zero-dep,
    future-proof, aligns with supply-chain minimization ([05](05-supply-chain.md)). Most control.
  - Avoid **axios** (popular but heavy, non-fetch adapter, against the lean-stack goal).
  - *Recommendation:* not urgent (ky works now); when touched, prefer `ofetch` for the drop-in, or
    native-fetch-wrapper for the zero-dep purist path. ~100+ call sites — do as one focused sweep.
- **Convergence (Wave 3)** — SWR→TanStack Query (144 files, console), Jest→Vitest (core, XL)
- **Big bets (Wave 4/5)** — React 18→19, i18next 22→26, Koa 2→3, Slonik→Drizzle, OIDC fork-shrink
- **Console full rebuild** (Wave 4, XL) — committed target stack + the React-vs-Svelte decision record
  (Svelte 5 evaluated, both assumed blockers proven false; React wins on pragmatics, not capability).
  See [01-frontend.md](01-frontend.md#console--full-ground-up-rebuild-stack-committed-2026-pick).
