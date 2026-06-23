# 12 — Stack Health & Modernization Roadmap

A single living view of **what each dependency is today vs. the best-in-class target**, and the
**phased plan** to close the gap. Versions verified against the repo and validated against upstream
release channels (2026-06). This complements [00-roadmap.md](00-roadmap.md) (which sequences *all*
axes incl. standards/security); this doc is the **dependency/tech-stack** lens specifically.

> Guiding rule (carried from [00](00-roadmap.md)): Logto is an **auth product** — security/standards
> wins rank above pure perf/DX. So the dated-but-risky **forks** (Slonik, OIDC) and **standards**
> matter more than chasing the newest React.

---

## Current vs. target — the full table

Legend: 🟢 current · 🟡 minor gap · 🟠 dated (1 major) · 🔴 significantly dated / fragile fork

| Area | Today | Best-in-class target | Gap |
|------|-------|----------------------|:---:|
| **Language** | TypeScript 5.9 | **TS 6.0** (7 in beta) | 🟡 1 major |
| **UI lib** | React 18.3 | **React 19.2** + Compiler | 🟠 1 major |
| **Bundler** | Vite 8 | Vite 8 (Rolldown) | 🟢 |
| **Unit test** | Vitest 4 *(core still Jest 29)* | **Vitest everywhere** | 🟡 mixed |
| **Validation** | Zod 4 | Zod 4 | 🟢 |
| **Crypto** | jose 6 | jose 6 | 🟢 |
| **HTTP client** | ky 2 | **ofetch** / native-fetch | 🟡 pure-ESM, surprise majors |
| **Data fetching** | SWR 2 + TanStack Query 5 *(mixed)* | **TanStack Query everywhere** | 🟡 mixed (SWR 154 files) |
| **Router** | react-router 7 | **TanStack Router** (type-safe) | 🟡 |
| **Styling** | Tailwind 4 *(console still 468 SCSS modules)* | **Tailwind 4 everywhere** | 🟡 mixed |
| **i18n** | **i18next 22** | i18next 26 / **Paraglide** | 🔴 **4 majors behind** |
| **Lint/format** | ESLint 8 + Prettier + stylelint 15 | **Biome** (or ESLint 9 flat) | 🟠 1 major + 3-tool sprawl |
| **Runtime** | Node 24, pnpm 11 | Node 24, pnpm 11 | 🟢 |
| **Backend framework** | **Koa 2.16** | **Koa 3** / Hono | 🔴 1 major (async-only rewrite) |
| **DB client** | **@silverhand/slonik 31.0-beta** (fork) | mainline Slonik 48/49 / **Drizzle** | 🔴 **~17 majors behind + beta fork** |
| **OIDC provider** | **node-oidc-provider 8.6 (SHA-pinned fork)** | mainline 9.8 / shrink fork | 🔴 1 major + fork liability |
| **Observability** | app-insights (Azure) | **OTel / SigNoz** | 🔴 vendor lock-in |

**Health summary:** ~60% of the stack is 🟢 current (much of it from recent work — Zod 4, jose 6,
Vite 8, Vitest 4, Tailwind 4, Node 24). The real debt is concentrated in **four fragile/forked or
far-behind items**: **Slonik-beta-fork (worst version gap), the OIDC fork, i18next (4 majors), and
Koa 2** — plus convergence cleanups (mixed SWR/Query, mixed Jest/Vitest, console SCSS).

---

## The modernization roadmap (phased)

Phases are sequenced so each one **de-risks the next**. The cardinal rule: **don't attempt a 🔴
backend rewrite until the OIDC conformance suite is green in CI** (it's the safety net).

### ✅ Phase 0 — Done (this + prior work)
Zod 3→4 (repo-wide), jose 5→6, Vite 6→8, TS 5.5→5.9, ky 1→2, koa-body 6→8, samlify/nodemailer/
libphonenumber/aws-sdk/etc. bumps, Node 22→24, pnpm 10→11, Turborepo, Renovate, SBOM, pnpm-catalog,
console Jest→Vitest, **EdDSA enabled (all layers + live test)**, and the migration-regression fixes
(Zod-4 passwordPolicy, koa-body uploads, **ky-2 `error.data` — 35 sites incl. 2 production**).

### 🥇 Phase 1 — Standards & security quick-wins (do next)
Small effort, high value, mostly upstream features just not enabled. Detail in [04](04-security-crypto.md).
- **PAR** (RFC 9126) — fork already `enabled:true`, just surface in config (~2-3 h). FAPI building block.
- **Wildcard-redirect drop** (RFC 9700) — 1-line flip, gate on a prod-app audit. Kills a takeover class.
- **DPoP** (RFC 9449) — flip the fork knob + nonce + per-client metadata. Biggest practical security win.
- **OIDC conformance CI** — the safety net that makes every 🔴 rewrite below testable. **Do before any backend rewrite.**

### 🥈 Phase 2 — Quick dep/DX wins (low risk, isolated)
- **TS 5.9 → 6.0** — strict, project-references for incremental.
- **ESLint 8 → 9 flat config**, or jump straight to **Biome** (collapses ESLint+Prettier+stylelint → 1 Rust tool).
- **i18next 22 → 26** (or start the **Paraglide** migration) — the single most-behind runtime dep.
- **ky → ofetch** — kills the `error.data` bug class (see [README](README.md)); ~100 call sites, one sweep.
- **app-insights → OTel/SigNoz** — you already run SigNoz; removes Azure lock-in.
- **Secret hygiene** — rotate the known-leaked secrets + gitleaks CI gate.

### 🥉 Phase 3 — Convergence (finish half-done migrations)
- **SWR → TanStack Query everywhere** (console, 154 files) — kill the dual data-layer.
- **Jest → Vitest in core** (XL but unifies the test runner).
- **Console → Tailwind** (468 SCSS modules) — matches experience/account; see [01](01-frontend.md).
- **Real `@logto/ui` design system** — extract shared primitives, kill the `@experience/*` source-alias.

### 🏗️ Phase 4 — Big bets (real rewrites; only after Phase 1's conformance CI)
- **React 18 → 19** + Compiler + Actions (repo-wide).
- **TanStack Router** (type-safe routes/search-params).
- **Koa 2 → 3** (async-only middleware rewrite) — backend, auth-critical.
- **Console full ground-up rebuild** — committed stack + the React-vs-Svelte decision in [01](01-frontend.md).

### 🚀 Phase 5 — Highest-risk / scale (the scariest forks)
- **@silverhand/slonik beta-fork → Drizzle** (or mainline Slonik) — **worst version gap**, every query rewritten.
- **node-oidc-provider fork → mainline / shrink** — auth-protocol surgery; the scariest single move.
- **FAPI 2.0 profile** (PAR + DPoP + mTLS) — unlocks regulated/fintech customers.
- Audit-log partitioning, read replicas, PgBouncer pooling.

---

## ROI shortlist (if you only do a few)

| Rank | Item | Phase | Why |
|:---:|------|:-----:|-----|
| 1 | **PAR** | 1 | Fork-ready, ~hours, FAPI building block |
| 2 | **Wildcard-drop** | 1 | 1 line, kills a takeover class |
| 3 | **Conformance CI** | 1 | Unblocks *all* the risky rewrites safely |
| 4 | **Biome** | 2 | 3 lint tools → 1, big CI speedup |
| 5 | **SWR → TanStack Query** | 3 | Kills dual data-layer, 154 files |

> The two highest-**risk** debts (Slonik-beta-fork, OIDC-fork) are deliberately **last** — they're
> XL/high-risk and must wait for the conformance net. The highest-**ROI** wins (PAR, wildcard-drop)
> are tiny config flips that ship now.
