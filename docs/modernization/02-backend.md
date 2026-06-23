# 02 — Backend (core)

The engine: `packages/core` plus `cloud`, `cli`, `connectors`.

## Snapshot (verified)

| Area | Today | Target |
|------|-------|--------|
| HTTP framework | Koa `2.16` (maintenance-mode, callback-era) | Hono (Web-standard, edge-ready) **or** Fastify |
| DB layer | `@silverhand/slonik` `31.0.0-beta.2` (**forked** slonik) | Drizzle ORM **or** mainline slonik |
| Validation | `zod` `3.24` | Zod 4 |
| OIDC | `github:logto-io/node-oidc-provider#5570006…` (SHA-pinned fork) | Shrink/mainline — see [10](10-oidc-fork-shrink.md) |
| Tests | `jest` `29.7` | Vitest (libs already on Vitest 4) — see [07](07-testing.md) |
| Runtime | Node `^22.14` | Node 22 (fine). Bun = **skip** (immature for prod auth) |

## The two scariest dependencies

### 1. SHA-pinned `node-oidc-provider` fork 🔴
```
"oidc-provider": "github:logto-io/node-oidc-provider#5570006785b44e0f125ee4cb6bf540338721b1f3"
```
Auth-protocol code, frozen at a commit SHA. Security patches in upstream do **not**
flow in. This is the single highest-value-highest-risk backend item.

- **Don't** attempt a blind mainline. **Do** (in order):
  1. Shrink the fork — see [10-oidc-fork-shrink.md](10-oidc-fork-shrink.md). Research
     shows ~2 of 3 fork reasons (wildcard, custom metadata) are removable via config;
     only multi-tenant dynamic-issuer genuinely needs the fork.
  2. Stand up an **OIDC conformance suite** ([07](07-testing.md)) as the safety net.
  3. Only then evaluate mainline-with-patches or migration.
- **CI guard now:** add a job watching `panva/node-oidc-provider` releases so the
  team sees when the fork drifts behind a security release.

### 2. `@silverhand/slonik` beta fork
```
"@silverhand/slonik": "31.0.0-beta.2"
```
A forked, beta-versioned DB driver. Two paths:
- **Conservative:** mainline onto upstream slonik (if the fork's deltas are upstreamed
  or droppable). Lowest rewrite cost.
- **Drastic:** migrate to **Drizzle ORM** — type-safe queries, first-class migrations
  (replaces the home-grown `alteration` system, see [06](06-database.md)), no fork
  dependency. But: **every query is rewritten** → XL effort, do behind tests.

## HTTP framework — Koa → Hono (Wave 5, high risk)

Koa 2 is in maintenance mode and is callback/middleware-era. Hono is Web-standard
(Request/Response), ~10× lighter, and **edge-ready** — which unlocks running the auth
experience on CDN edge (see [01](01-frontend.md) + infra notes below).

- **Reality check:** this is an auth-critical rewrite of the entire request pipeline
  (middleware, session, error handling, the OIDC mount point). **XL effort, High risk.**
- **Pre-req:** conformance suite green first. Migrate route-group by route-group behind
  a compatibility shim if possible.
- **Alternative:** Fastify — less of a paradigm shift than Hono, still a big win over Koa.

## Validation — Zod 4

Bump `zod` `3.24` → 4 across core (and frontend, see [01](01-frontend.md)) for a single
validation story. Standard Schema interop + perf.

## Runtime

Node 22 is current and fine. **Do not** move prod auth to Bun yet — runtime maturity
for the OIDC/crypto stack is not worth the risk. Revisit later.

## Suggested sequence

1. Fork-shrink ([10](10-oidc-fork-shrink.md)) + conformance suite ([07](07-testing.md)).
2. Vitest unify ([07](07-testing.md)) — so backend refactors are testable.
3. slonik decision (mainline vs Drizzle).
4. **Only after** 1–3: evaluate Koa→Hono and OIDC mainline.
