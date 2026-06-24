# Native Step-Up / ACR — Cross-Layer Design Map

> **Build status:** **Phase 1 (schemas layer) — DONE.** Shipped in `packages/schemas`:
> `acrRank` / `acrSatisfies` / `acrMax` / `isLogtoAcrValue` helpers (`consts/oidc.ts`);
> `scopes.required_acr` + `resources.default_acr` columns (`.sql` + regenerated
> `db-entries`); `resolveRequiredAcr` / `evaluateAcr` / `AcrShortfallReason` pure resolver
> (`types/acr.ts`); Sentinel `StepUpChallenged` / `StepUpPassed` / `StepUpFailed` actions;
> zero-downtime migration (`alterations/next-1781700000-*`). 108 schemas tests + 14 new
> ACR tests pass; `core` typechecks (downstream `Scope`/`Resource` mocks patched).
> **Next: Phase 2 — core resolution (`extra-token-claims.ts` + rewrite `init.ts` detection).**
>
> **Goal:** evolve step-up from a hardcoded *protocol gate* (today) into a
> declarative, **scope-level**, Console-configurable, Sentinel-integrated feature —
> the way Logto would build it as a first-class product.
>
> **Today (fork):** ACR ladder + OIDC detection + experience guard + per-app
> `defaultAcrValues`. Enforcement is a hardcoded backend gate; "what needs step-up"
> is not declarative.
>
> **Target:** an admin ticks **"require MFA"** on the `wallet:withdraw` *scope* in
> Console. No backend code, no `X-Id-Token` plumbing, no popup wiring. Logto
> enforces it at token issuance and challenges automatically. RFC 9470 native.

---

## 0. The one-sentence reframe

> **Step-up is an RBAC concern, not an auth-protocol concern.**
> Required-ACR lives on the **scope** (and is overridable per resource / app / org).
> Everything else — detection, challenge, token claim, audit — *derives* from that.

---

## 1. Layer map (data → enforcement → UX → observability)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ L1  DATA MODEL        scopes.required_acr, resources.default_acr,          │
│  (schemas/)           orgs.step_up_override, tenant acr_registry,          │
│                       per-acr freshness TTL                                │
├──────────────────────────────────────────────────────────────────────────┤
│ L2  RESOLUTION        "effective required ACR" = max( scope, resource,     │
│  (core/oidc + libraries)  app default, org override ) — one resolver       │
├──────────────────────────────────────────────────────────────────────────┤
│ L3  ENFORCEMENT       token issuance checks session acr+auth_time vs       │
│  (core/oidc grants)   required; if short → step-up challenge (RFC 9470)    │
├──────────────────────────────────────────────────────────────────────────┤
│ L4  CHALLENGE/UX      experience "Confirm it's you" screen (2nd factor     │
│  (experience/)        only, action context shown) — not full re-login      │
├──────────────────────────────────────────────────────────────────────────┤
│ L5  ADMIN CONTROLS    Console: per-scope toggle, resource default,         │
│  (console/ + phrases) Authentication Contexts page, freshness, org         │
├──────────────────────────────────────────────────────────────────────────┤
│ L6  OBSERVABILITY     Sentinel step-up actions, audit log, dashboards      │
│  (core + schemas)     "last elevated at", risk rules                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Package-by-package build map

### `packages/schemas` — the source of truth (build this FIRST)

Everything downstream is typed off here. Order matters: schema → DB migration → resolver.

| Artifact | Path | Change |
| --- | --- | --- |
| ACR ladder (exists) | `src/consts/oidc.ts` | Keep `LogtoAcrValues` as the *built-in* ladder; add an `acrRank()` helper so `max(a,b)` comparisons are total (`pwd=0 < mfa=1 < phr=2`). This single helper is reused by every layer's "is the session strong enough?" check. |
| Scope `required_acr` | `tables/scopes.sql` + `src/db-entries/scope.ts` | `add column required_acr varchar(64)` (nullable; null = inherit). The natural home for step-up. |
| Resource `default_acr` | `tables/resources.sql` + `src/db-entries/resource.ts` | Resource-wide fallback when a scope is null. |
| Tenant ACR registry + freshness | `tables/sign_in_experiences.sql` *or* a new `acr_settings` jsonb on the tenant config | `{ registry: { urn → {factors[]} }, freshnessTtl: {acr → seconds} }`. Lets a tenant define custom ACRs beyond the 3 built-ins, and the elevation window. |
| Org override | `tables/organizations.sql` jsonb | Extend the existing `OrganizationRequiredMfaPolicy` pattern → `stepUpOverride: { minAcr, scopes? }`. |
| App default (exists) | `src/foundations/jsonb-types/oidc-module.ts` | `DefaultAcrValues` already present. Keep — it becomes the *lowest-priority* input to the resolver. |
| Sentinel actions | `src/foundations/jsonb-types/sentinel.ts` | Add `StepUpChallenged`, `StepUpPassed`, `StepUpFailed` to `SentinelActivityAction`. |
| Resolver guard | `src/types/` (new `acr.ts`) | Zod guards + the pure `resolveRequiredAcr(inputs)` function (no I/O) so core *and* tests *and* console share it. |

**Migration:** `packages/schemas/alterations/` — one timestamped file adding the 3
columns + jsonb defaults. All nullable/defaulted → zero-downtime, no backfill.

> **sqlc-equivalent gotcha for Logto:** schemas are the generator input here.
> After editing `tables/*.sql` + `db-entries/*.ts`, run the schema build
> (`pnpm -F @logto/schemas build`) so `lib/` regenerates before core typechecks.

---

### `packages/core` — resolution + enforcement (the brain)

**L2 Resolution** — one function, called wherever scopes are materialized for a token:

```
effectiveRequiredAcr(scopes, resource, app, org) =
  acrMax(
    max(scope.required_acr for granted scopes),   // primary signal
    resource.default_acr,
    app.defaultAcrValues,
    org.stepUpOverride.minAcr,
  )
```

| Touchpoint | Path | Change |
| --- | --- | --- |
| Token claim plumbing | `src/oidc/extra-token-claims.ts` | Already the place `acr`/scopes meet the token. Compute `effectiveRequiredAcr` here from the granted scopes. |
| Authz-time detection (exists) | `src/oidc/init.ts` (the `interactions.url` block, L283-320) | **Replace** the "read `acr_values` param / app default" logic with the resolver: derive required ACR from the *requested scopes* too, not just the param. Same `step_up_acr` injection downstream — UX layer untouched. |
| **Grant-time enforcement (NEW — the real upgrade)** | `src/oidc/grants/*.ts` (`refresh-token`, `token-exchange`) | On token request for a resource, if any granted scope's required ACR **>** session `acr`, **drop those scopes** from the issued token (or reject per policy) instead of silently issuing. This is what removes the Go-backend `X-Id-Token` manual check — the access token simply won't carry the privileged scope unless elevated. |
| Freshness | grants + `extra-token-claims` | Compare `auth_time` (or per-session `acr_ts`) against the tenant/per-acr `freshnessTtl`. Stale strong-acr → treat as un-elevated → re-challenge. |
| Experience guard (exists) | `src/routes/experience/classes/experience-interaction.ts` (`guardStepUpAcr`, L762) | Keep. Generalize from the 3 built-ins to "lookup required factors for ACR from the tenant registry" so custom ACRs work. |
| Scope CRUD API | `src/routes/resource.scope.ts`, `role.scope.ts` | Accept/return `requiredAcr` on create/update. Validate against the tenant registry. |
| Resource API | `src/routes/resource.ts` | Accept/return `defaultAcr`. |
| Sentinel writes | wherever step-up passes/fails | Emit the new `SentinelActivityAction.StepUp*` so lockout + risk scoring see step-up traffic isolated from primary sign-in (mirrors how MFA actions were isolated). |

> **Key architectural win:** enforcement moves from *"backend reads X-Id-Token and
> decides"* to *"Logto won't even mint the privileged scope into the access token
> without sufficient acr."* The resource server trusts the token, full stop.

---

### `packages/experience` — the challenge UX (mostly exists, polish to "confirm" UX)

| Artifact | Path | Change |
| --- | --- | --- |
| Step-up page (exists) | `src/pages/StepUpVerification/index.tsx` | Evolve from "verify" to **"Confirm it's you"**: show *what's being approved* (passed via a new `step_up_context` param — e.g. "Approving: withdraw ₹5,000"), offer only the 2nd factor, never ask password again. |
| ACR hook (exists) | `src/hooks/use-step-up-acr.ts` | Keep. Extend to also read `step_up_context`. |
| Verification hook (exists) | `src/hooks/use-step-up-verification.ts` | Keep. Factor list comes from the ACR→factors registry (custom-ACR aware). |
| Factor filtering | step-up page | For `phr`, show only WebAuthn; for custom ACRs, show only registry-listed factors. |

---

### `packages/console` — admin controls (the declarative surface — biggest net-new UX)

| Control | Page | Change |
| --- | --- | --- |
| **Per-scope required ACR** (the headline) | `src/pages/ApiResourceDetails/ApiResourcePermissions/` | Each permission row gets a "Step-up" dropdown: *None / MFA / Phishing-resistant / <custom>*. This is where `wallet:withdraw → require MFA` is set. |
| Resource default ACR | `src/pages/ApiResourceDetails/ApiResourceSettings/` | "Default step-up for this API" field. |
| **Authentication Contexts page** (NEW) | `src/pages/` (new route, near MFA) | Tenant defines custom ACR ladder (urn → factors from the existing MFA factor set) + the elevation/freshness TTL. |
| App default (exists) | `src/pages/ApplicationDetails/.../Settings.tsx` | `defaultAcrValues` UI already wired. Re-label as "baseline, overridden by scope rules." |
| Org override | `src/pages/OrganizationDetails/` | Extend the existing required-MFA UI → "require step-up for money actions." |
| Step-up dashboard | `src/pages/` (analytics) | Success/fail rates, per-user "last elevated at." |
| Phrases | `packages/phrases` + `packages/phrases-experience` | New i18n keys for every label above (en first; `pnpm translate` for the rest). |

---

### `packages/integration-tests` — proof it works end-to-end

Build alongside, not after (existing `step-up.test.ts` is the seed):

| Test | Path |
| --- | --- |
| Scope-level: scope with `requiredAcr=mfa` → token request without elevation drops the scope; after step-up, scope present | extend `tests/api/experience-api/sign-in-interaction/step-up.test.ts` |
| Resolver precedence: scope > resource > app > org `max` | new unit-ish test in core |
| Freshness: elevated, wait past TTL, re-challenge | new |
| Custom ACR from registry resolves to the right factors | new |
| Phishing-resistant: TOTP rejected, WebAuthn accepted (exists, keep) | existing |

---

## 3. Resolver precedence (the one rule to remember)

```
required_acr(token request) =
  acrMax(
     scope.required_acr,        ← per-permission, the primary control  (Console: permission row)
     resource.default_acr,      ← per-API fallback                     (Console: resource settings)
     application.defaultAcr,    ← per-app baseline (exists today)       (Console: app settings)
     org.stepUpOverride.minAcr  ← per-tenant-org floor                  (Console: org)
  )

session satisfies it IFF:
     acrRank(session.acr) >= acrRank(required)   AND
     now - session.acr_ts  <= freshnessTtl(required)
```

`acrMax` / `acrRank` live once in `schemas/consts/oidc.ts` and are imported everywhere.

---

## 4. Build order (dependency-correct)

1. **schemas**: `acrRank` helper + columns + migration + Sentinel actions + resolver fn + guards. *(everything compiles off this)*
2. **core resolution**: `effectiveRequiredAcr` in `extra-token-claims.ts`; rewrite `init.ts` detection to use it.
3. **core enforcement**: grant-time scope drop + freshness in `grants/*`.
4. **core APIs**: scope/resource CRUD accept `requiredAcr`/`defaultAcr`.
5. **experience**: "Confirm it's you" + context param.
6. **console + phrases**: per-scope dropdown → resource default → Auth Contexts page → org → dashboard.
7. **integration-tests** at each step; Sentinel wiring last.

Each step is independently shippable: after (1)+(2)+(3) you already have scope-level
enforcement working via API; Console (6) is pure UX on top.

---

## 5. What this removes from the Go backend

Today the Hypedrive Go backend manually verifies `X-Id-Token` and checks `acr` per
sensitive endpoint. With native scope-level step-up:

- **Delete** the per-endpoint manual acr gate.
- The privileged **scope simply isn't in the access token** unless the session is
  elevated → standard scope check (which the backend already does) *is* the step-up check.
- No `X-Id-Token` forwarding, no popup-vs-redirect wiring in each SPA — the SDK/OIDC
  challenge handles it.

> Net: step-up becomes *declarative config in Console* + *standard scope enforcement*,
> exactly like every other permission in Logto.
