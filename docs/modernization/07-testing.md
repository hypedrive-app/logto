# 07 — Testing Depth

A runner swap (Jest→Vitest) is the *easy* part. The high-value move is **conformance +
contract testing** — appropriate for an auth product.

## Snapshot (verified)

| Area | Today | Target |
|------|-------|--------|
| Unit (core) | `jest` `29.7` | Vitest 4 (libs already there) |
| Unit (libs) | `vitest` `4.1` | (already done) |
| Integration | `packages/integration-tests` | Keep + expand |
| Pen-test | `.github/workflows/pen-tests.yml` (exists) | Expand (ZAP/Burp automation) |
| Conformance | (none) | **OIDC certified conformance suite** |
| Visual | (none) | Playwright/Chromatic |
| Security scan | `.github/workflows/codeql-analysis.yml` (exists) | Keep + add SAST depth |

## 1. Vitest unification (Wave 3 — finish what's started)

Core is on **Jest 29**; the libraries are already on **Vitest 4**. Two runners = two
configs, two mocking APIs, slower aggregate CI.
- **Action:** migrate `packages/core` (and any other Jest holdouts) to Vitest. Mostly
  mechanical (`jest.fn`→`vi.fn`, config consolidation). Effort: M · Risk: Low.

## 2. OIDC conformance suite (Wave 1 — highest value) 🟢

**This is the safety net for every auth-critical rewrite** (Koa→Hono, OIDC mainline,
EdDSA/DPoP/PAR). The OpenID Foundation publishes a **certified conformance test suite**.

- **Action:** run the conformance suite against a test Logto instance in CI (or nightly).
  Gate the scariest changes on it staying green.
- **Why it matters:** the OIDC dependency is a SHA-pinned fork ([10](10-oidc-fork-shrink.md)).
  Conformance tests turn "we *think* the fork still behaves" into "CI proves it conforms."
- **Bonus:** passing certified conformance is a **marketing/sales asset** for an IdP.
- Effort: M · Risk: Low · Value: 🟢 High.

## 3. Contract testing for OIDC endpoints

Pin the request/response contract of `/oidc/*` endpoints (token, userinfo, introspection,
authorization, PAR). Catches accidental breaking changes from fork bumps or refactors.

## 4. Expand pen-tests (Wave 1/2)

`pen-tests.yml` already exists — build on it:
- **OWASP ZAP** automated baseline scan in CI against a running instance.
- DAST on the auth flows specifically (the highest-risk surface).

## 5. Visual regression (Wave 3)

Pairs with the `@logto/ui` design-system extraction ([01](01-frontend.md)). Past work in
this org held a high visual-polish bar (screenshot-verify icons/animations) — automate it:
- **Playwright** screenshots or **Chromatic** (if Storybook is adopted for the design system).
- Catches unintended UI ripples — exactly the `@experience/*` coupling bug class ([01](01-frontend.md)).

## Sequence

1. **OIDC conformance suite** (Wave 1) — the safety net, do before any auth rewrite.
2. **Vitest unification** (Wave 3) — so backend refactors share one runner.
3. **Contract + expanded pen-tests** — regression-proof the protocol surface.
4. **Visual regression** — alongside the design-system work.
