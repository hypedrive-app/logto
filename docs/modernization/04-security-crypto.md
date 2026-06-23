# 04 — Security & Crypto Modernization

**Highest-value axis.** Logto is an IdP — its moat is security + standards. Most of
these are *small effort* because they're already-available upstream OIDC features,
just not enabled in the fork's config.

## 1. Enable EdDSA signing 🟢 ✅ DONE

**Shipped.** The "browser unsupported" comment was doubly stale: Ed25519 is in WebCrypto across
modern browsers now *and*, more to the point, Logto verifies its own tokens via `jose` (server-side
+ the `@logto/js` SDK), never browser WebCrypto — so the concern never applied here.

Implemented across every layer (additive, default stays EC, fully backward-compatible):
- `SupportedSigningKeyAlgorithm` enum gains `EdDSA` (`packages/schemas/.../logto-config/index.ts`).
- `ed25519` key-gen branch (`packages/cli/.../database/utils.ts`) + CLI rotate allowlist.
- `'EdDSA'` added to `supportedSigningAlgs` (`init.ts`) → feeds all four `*SigningAlgValues`.
- **Load-bearing alg maps** (`kty:'OKP'→'EdDSA'`): `env-set/oidc.ts` (signing — without it the
  provider falls back to its `RS256` default and tokens fail to verify) and `libraries/logto-config.ts`
  (display — the JWKS `kty` is `OKP`, but the API/Console must report `EdDSA`).
- Console UI auto-handles via `Object.values(SupportedSigningKeyAlgorithm)`.

**Verified:** new integration test (rotate→Ed25519→M2M token→JWKS verify→`alg==='EdDSA'`) ran green
on an isolated instance; unit test asserts RSA/EC/EdDSA→correct JWK `kty`.

> Remaining EdDSA follow-up: fold an EdDSA case into the **OIDC conformance suite** once that lands
> ([07](07-testing.md)).

## 2. DPoP — sender-constrained tokens (RFC 9449) 🟢

Bearer tokens can be replayed if stolen. **DPoP** binds a token to a client-held key →
a stolen token is useless without the key. `node-oidc-provider` supports DPoP upstream.

- **Action:** enable the DPoP feature in the provider config; expose per-client/resource
  policy; document client integration.
- **Effort:** M · **Risk:** Med (token-handling path) · **Value:** 🟢 High.

## 3. PAR — Pushed Authorization Requests (RFC 9126) 🟢

Authorization params are pushed to the AS over a back-channel and referenced by a
`request_uri`, instead of riding in the front-channel URL. **RFC 9700** (the OAuth
Security BCP — the same doc that bans wildcards, see [10](10-oidc-fork-shrink.md))
strongly recommends PAR.

- **Action:** enable `pushedAuthorizationRequests` feature; optionally `require` it for
  confidential clients.
- **Effort:** M · **Risk:** Low · **Value:** 🟢 High.

## 4. Secret management & hygiene 🟢

Project memory records a pending action: **"ROTATE leaked WhatsApp + signoz secrets"** —
evidence that secret hygiene is a real, current gap, not hypothetical.

- **Immediate:** rotate the known-leaked secrets; scrub from git history (`git filter-repo`
  / BFG); confirm no live credentials remain in the repo.
- **Structural:** move from raw env vars to a vault pattern — **SOPS + age** (git-friendly,
  encrypted-at-rest secrets) or a managed vault. CI injects at deploy, never in repo.
- **Preventive:** add **gitleaks/trufflehog** as a pre-commit hook + CI gate so the next
  leak is blocked at commit time.
- **Effort:** M · **Risk:** Low · **Value:** 🟢 High.

## 5. Additional hardening (standards alignment)

| Item | What | Why |
|------|------|-----|
| **mTLS / `tls_client_auth`** | Certificate-bound client auth | FAPI 2.0 ([09](09-compliance-governance.md)) |
| **JAR/JARM** (RFC 9101 / JWT-secured auth response) | Signed request/response objects | Integrity of auth messages |
| **`helmet` review** | Currently `helmet` `7.1` | Confirm CSP/HSTS headers are tight per-app |
| **Step-up MFA on anomaly** | Risk-based re-auth | Passkey conditional UI already exists — make step-up automatic on suspicious login |
| **Rotate signing keys** | Automated JWKS rotation | Limit blast radius of key compromise |

## Sequence

1. **EdDSA** (S) — quick, additive, high signal.
2. **Secret rotation** (immediate) + gitleaks gate.
3. **PAR** then **DPoP** (enable upstream features behind conformance tests).
4. mTLS / JAR-JARM as part of the FAPI 2.0 push ([09](09-compliance-governance.md)).

> Every change here should land **with a conformance test** ([07](07-testing.md)) so the
> security posture is regression-proof across future fork bumps.

---

## ✅ Cross-Layer Feasibility Audit (verified against the installed fork)

> Audited against `node-oidc-provider@8.6.1` (the SHA-pinned `logto-io` fork) by tracing each
> standard across every layer: provider-config → key-gen → schema → client-metadata → rotation →
> Console-UI → DB-migration → tests. **All 5 are feasible — none are fork-blocked.** Logto's existing
> scaffolding (`signingKeyAlgorithm` param, UI alg-dropdown, rotation flow, `extraClientMetadata`)
> already does much of the heavy lifting, so several "medium" items are smaller than they look.

### Ranked by ROI (benefit ÷ effort)

| # | Item | Effort | Fork status | Benefit |
|---|------|:------:|-------------|---------|
| 1 | **PAR** (RFC 9126) | **S** | ✅ already `enabled: true` in fork (`defaults.js`) — just surface in Logto config | Request-tampering prevention, no URL-length limits, no param leakage in browser history. **FAPI 2.0 building block** → fintech/enterprise unlock. |
| 2 | **DPoP** (RFC 9449) | **M** | ✅ `dPoP` knob exists, `enabled: false` → flip + nonceSecret + per-client `dpop_bound_access_tokens` | **Biggest practical security win** — a stolen access token is useless without the client-held key. Kills the bearer-token replay risk (XSS/log/network leaks). |
| 3 | **OIDC Conformance CI** | **M** (infra) | n/a — external OpenID Foundation Docker suite, not fork-blocked | **Safety-net for the SHA-pinned fork** — proves every auth change (incl. these 4) still conforms. Plus an "OpenID Certified®" sales/trust asset. |
| 4 | **EdDSA** signing | **M** | ✅ `'EdDSA'` in `consts/jwa.js`; half-scaffolded in Logto | Smaller (~64B vs ~256B) + faster tokens; deterministic → eliminates the ECDSA/RSA nonce-reuse key-leak bug class. |
| 5 | **Wildcard-redirect DROP** (RFC 9700) | **S** code / **M** validation | ✅ `allowWildcardRedirectUris: true → false` (1 line) | Eliminates a whole **account-takeover** attack class (subdomain-takeover → redirect hijack). ⚠️ Deployment-gated: audit production apps using `*.domain` redirects first. |

### Layer-by-layer notes (where the work actually is)

- **PAR** — provider config only. Expose in `init.ts` `features` block; optional `require_par` per app via `extraClientMetadata`. No UI/DB/migration. **~2–3 hrs.**
- **DPoP** — config flip + nonce secret; per-client `dpop_bound_access_tokens` (JSONB client metadata, no migration); optional Console toggle; token-path test. **~1 day.**
- **EdDSA** — add `'EdDSA'` to `supportedSigningAlgs` (`init.ts:73`); add `ed25519` branch to key-gen (`packages/cli/src/commands/database/utils.ts` — Node `crypto` supports it natively); add `EdDSA`/`OKP` to `SupportedSigningKeyAlgorithm` enum (`packages/schemas/.../logto-config/index.ts:41`). **Console UI auto-updates** (it maps the enum → dropdown), rotation flow already threads `signingKeyAlgorithm`, keys are JSONB (likely no DB migration). Extend `index.rotation.test.ts` (already EdDSA-aware). **~1 day.**
- **Wildcard-drop** — flip the config; the custom wildcard-pattern logic in `oidc/utils.ts:208` + the `redirectUriAllowed` override become dead code. **Gate on a production audit** of apps relying on wildcard redirects. **Code S, validation M.**
- **Conformance** — new CI workflow running a Logto instance (DB + provider) against the OpenID Docker suite. Highest infra effort, zero code risk. **~1–2 days.**

### Combined payoff
**PAR + DPoP (+ mTLS) = the FAPI 2.0 profile** ([09](09-compliance-governance.md)) → unlocks regulated/fintech customers (a real revenue tier that *gates* on these). **DPoP + wildcard-drop** close the two most common real-world OAuth breach vectors. **Conformance** is the net that makes all of it (and Koa→Hono / fork-shrink later) safe to ship.

### Recommended order
**PAR** (best ROI, fork-ready) → **DPoP** (biggest security payoff) → **Conformance** (protects the rest) → **EdDSA** (scaffolded) → **Wildcard-drop** (after app audit).
