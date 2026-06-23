# 00 — Prioritized Modernization Roadmap

A single sequenced view across all axes. Legend:
**Value** = product/security impact · **Effort** = eng cost · **Risk** = chance of
breaking auth-critical behavior.

## Re-prioritization rationale

The original blueprint optimized **perf/DX**. But Logto is an auth product — its
differentiators are **security + standards-compliance**, not build speed. So the
sequence below front-loads standards/security wins that are *small effort, high
value* and de-risk the scariest dependency (the OIDC fork), before the big
framework rewrites.

---

## Wave 1 — Standards & security quick-wins (do first)

Small effort, high value, mostly already-available upstream features just not enabled.

| Item | Doc | Value | Effort | Risk |
|------|-----|:-----:|:------:|:----:|
| Enable **EdDSA** signing (stale "browser unsupported" comment) | [04](04-security-crypto.md) | 🟢 High | S | Low |
| **DPoP** (RFC 9449) sender-constrained tokens | [04](04-security-crypto.md) | 🟢 High | M | Med |
| **PAR** (RFC 9126) pushed auth requests | [04](04-security-crypto.md) | 🟢 High | M | Low |
| **OIDC conformance suite** in CI (protect the fork) | [07](07-testing.md) | 🟢 High | M | Low |
| `app-insights` → **OTel/SigNoz** (already use SigNoz) | [08](08-observability.md) | 🟢 High | M | Low |
| **Secret hygiene** — vault/SOPS, rotate leaked secrets | [04](04-security-crypto.md) | 🟢 High | M | Low |

## Wave 2 — Fork-shrink + dependency hygiene

Directly reduces the scariest maintenance liability.

| Item | Doc | Value | Effort | Risk |
|------|-----|:-----:|:------:|:----:|
| **Drop wildcard redirects** (RFC 9700 bans them) | [10](10-oidc-fork-shrink.md) | 🟢 High | S | Low |
| Move custom metadata → `extraClientMetadata` config | [10](10-oidc-fork-shrink.md) | 🟡 Med | M | Low |
| Shrink fork to **multi-tenancy-only** patches | [10](10-oidc-fork-shrink.md) | 🟢 High | L | Med |
| **`@silverhand` fork audit** — mainline what can be | [05](05-supply-chain.md) | 🟡 Med | M | Low |
| **`pnpm catalog`** single-version policy | [05](05-supply-chain.md) | 🟡 Med | S | Low |
| **Renovate** grouped PRs + `pnpm audit` CI gate | [05](05-supply-chain.md) | 🟡 Med | S | Low |

## Wave 3 — Convergence wins (kill inconsistency)

Repo is already half-way on each — finish the job.

| Item | Doc | Value | Effort | Risk |
|------|-----|:-----:|:------:|:----:|
| **TanStack Query everywhere** (drop SWR/ky-hooks) | [01](01-frontend.md) | 🟢 High | M | Low |
| **Zod everywhere** (drop superstruct) | [01](01-frontend.md) | 🟡 Med | M | Low |
| **Vitest everywhere** (drop Jest in core) | [07](07-testing.md) | 🟡 Med | M | Low |
| Real **`@logto/ui` design system** (kill `@experience/*` source-alias) | [01](01-frontend.md) | 🟢 High | L | Med |
| **Turborepo** task graph + remote cache | [03](03-toolchain-dx.md) | 🟢 High | M | Low |
| **Visual regression** (Playwright/Chromatic) | [07](07-testing.md) | 🟡 Med | M | Low |

## Wave 4 — Big bets (transform, but real rewrites)

High value, high effort. Sequence after the foundation is clean.

| Item | Doc | Value | Effort | Risk |
|------|-----|:-----:|:------:|:----:|
| **React 19** repo-wide + Actions/`useFormStatus` | [01](01-frontend.md) | 🟢 High | L | Med |
| **Panda CSS / Tailwind v4** (kill SCSS sprawl) | [01](01-frontend.md) | 🟡 Med | L | Med |
| **TanStack Router** (type-safe routes) | [01](01-frontend.md) | 🟡 Med | L | Med |
| **Paraglide i18n** (compile-time, tree-shakeable) | [01](01-frontend.md) | 🟡 Med | L | Med |
| **Biome** (replace ESLint 8 + Prettier + stylelint) | [03](03-toolchain-dx.md) | 🟡 Med | L | Med |
| **TS 6.0** + project references | [03](03-toolchain-dx.md) | 🟡 Med | M | Med |
| **Drizzle migrations** (replace home-grown alterations) | [06](06-database.md) | 🟡 Med | L | Med |

## Wave 5 — Compliance & scale (enterprise unlock)

| Item | Doc | Value | Effort | Risk |
|------|-----|:-----:|:------:|:----:|
| **OIDC fork mainline** OR migrate (auth-protocol surgery) | [02](02-backend.md), [10](10-oidc-fork-shrink.md) | 🟢 High | XL | High |
| **Koa → Hono** (edge-ready) | [02](02-backend.md) | 🟡 Med | XL | High |
| **FAPI 2.0** compliance profile | [09](09-compliance-governance.md) | 🟢 High | L | Med |
| **SBOM** (CycloneDX) in release | [09](09-compliance-governance.md) | 🟡 Med | S | Low |
| **GDPR** data-export/erasure APIs | [09](09-compliance-governance.md) | 🟡 Med | M | Low |
| **Audit-log partitioning** + read replicas | [06](06-database.md) | 🟡 Med | M | Med |
| **PgBouncer / RDS Proxy** pooling for multi-tenant | [06](06-database.md) | 🟡 Med | M | Med |

---

## The honest filter (carried over + refined)

🔴 **Highest-risk for a fork** — approach with conformance tests in place first:
- Koa → Hono (auth-critical backend rewrite)
- OIDC fork → mainline (auth-protocol surgery — the scariest move)
- Slonik → Drizzle (every query rewritten)
- Bun runtime (immature for prod auth — **skip for now**)

🟢 **Do these regardless** — they de-risk everything above:
- OIDC conformance suite (Wave 1) makes the 🔴 items *testable*
- Fork-shrink (Wave 2) makes the OIDC mainline *smaller*
- Design-system extraction (Wave 3) fixes the fragile `@experience/*` coupling

**Rule of thumb:** never attempt a 🔴 item until Wave 1's conformance suite is green
in CI. That suite is the safety net for all auth-critical rewrites.
