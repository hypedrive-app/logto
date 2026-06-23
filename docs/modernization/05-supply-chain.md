# 05 — Dependency Supply-Chain

The repo carries **multiple forks** and has version drift. Each fork = maintenance debt
and a security-patch blind spot.

## The fork inventory (verified counts across packages)

| Fork | Usages | Mainline-able? |
|------|:------:|----------------|
| `@silverhand/eslint-config` | 34 | Tied to Biome decision ([03](03-toolchain-dx.md)) |
| `@silverhand/ts-config` | 17 | Likely — thin tsconfig wrapper |
| `@silverhand/essentials` | 14 | Utility lib — audit if still needed |
| `@silverhand/eslint-config-react` | 10 | With eslint-config |
| `@silverhand/ts-config-react` | 5 | With ts-config |
| `@silverhand/slonik` | 3 | See [02](02-backend.md) — mainline or Drizzle |
| `@silverhand/react` | 3 | Audit usage |
| `oidc-provider` (SHA-pinned) | core | See [10](10-oidc-fork-shrink.md) — shrink first |

> `@silverhand/*` are the maintainers' own re-publishes — lower risk than the OIDC fork,
> but still version-pinned config you maintain instead of consuming upstream.

## Actions

### Fork audit (Wave 2)
For each `@silverhand/*` package, answer: *does it still encode a real delta from
upstream, or is it inertia?* Mainline the ones that are just wrappers (likely
`ts-config`, `ts-config-react`). Effort: M · Risk: Low.

### `pnpm catalog` — single-version policy (Wave 2)
Verified drift: `vite` `8.0` vs `6.2`, `eslint` `8.56` vs `8.57`. Catalog pins one
version per dep across all 21 packages. Effort: S · Risk: Low.
(Cross-ref [03](03-toolchain-dx.md).)

### Automated dependency PRs
No Renovate/Dependabot config seen in `.github/workflows`. Add **Renovate** with:
- Grouped PRs (e.g. all `@tanstack/*` together).
- Auto-merge for patch-level dev deps after CI.
- A **dedicated rule watching `panva/node-oidc-provider`** releases → alerts when the
  fork drifts behind a security release.
- Effort: S · Risk: Low.

### Supply-chain integrity (Wave 2/5)
- **`pnpm audit` CI gate** — fail the build on high/critical advisories.
- **npm provenance / Sigstore** on published packages — verifiable build origin.
- **SBOM** (CycloneDX) in the release pipeline — see [09](09-compliance-governance.md).
- **`pnpm` lockfile integrity** + frozen-lockfile in CI (likely already on — confirm).

## Sequence

1. `pnpm catalog` (S) — immediate drift fix.
2. Renovate + `pnpm audit` gate (S) — stop the bleeding.
3. `@silverhand` fork audit (M) — mainline the wrappers.
4. OIDC + slonik forks handled in their own docs ([10](10-oidc-fork-shrink.md), [02](02-backend.md)).
