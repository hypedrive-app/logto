# 10 — OIDC Fork Shrink

The scariest dependency, with a concrete plan to shrink it. **Research-backed**
(web-verified June 2026 against upstream docs + RFC 9700).

## The dependency

```
packages/core/package.json
"oidc-provider": "github:logto-io/node-oidc-provider#5570006785b44e0f125ee4cb6bf540338721b1f3"
```

A fork of `panva/node-oidc-provider`, **pinned to a commit SHA**. Upstream security
patches do not flow in. This is auth-protocol code — the highest-risk thing to leave frozen.

## Why the fork exists — three reasons, verified separately

### 1. Wildcard redirect URIs — ❌ fork NOT needed (and should be *dropped*)
- Upstream maintainer (panva) **documents a non-forking recipe**: validate `redirect_uris`
  via `extraClientMetadata` + override `Client.prototype.redirectUriAllowed`. Pure
  config/prototype-override — no fork required.
  ([Discussion #1305](https://github.com/panva/node-oidc-provider/discussions/1305))
- **But the bigger point:** **RFC 9700** (OAuth 2.0 Security BCP, now a finalized RFC),
  §4.1.1, **forbids wildcards** — `redirect_uri` MUST use exact string match (except
  localhost port for native apps). Wildcards enable open-redirect / subdomain-takeover
  attacks. ([RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700))
- **→ Action:** don't port wildcards to a plugin — **drop the feature** and enforce
  exact-match. This is *also* a FAPI 2.0 building block ([09](09-compliance-governance.md)).

### 2. Custom client metadata / app-level access — ❌ fork NOT needed
- `extraClientMetadata` is a **built-in upstream config**. App-level metadata and access
  control can live there without a fork.
- **→ Action:** move these deltas to `extraClientMetadata` configuration.

### 3. Multi-tenant dynamic issuer (single process) — ✅ fork genuinely needed
- Upstream API is `new Provider(issuer, configuration)` — **issuer is fixed at
  construction time**. One instance = one issuer. There is **no built-in support** for
  multiple/dynamic issuers in a single instance (deliberate single-issuer design).
- Logto Cloud's model (verified in `packages/core/src/tenants/Tenant.ts` →
  `initOidc(tenantId, …)` → `new Provider(envSet.oidc.issuer, …)`, with the issuer URL
  carrying the tenant id via subdomain or path in `src/env-set/utils.ts`) needs **dynamic
  issuer per tenant in one process** at scale.
- The standard no-fork workaround — a separate `Provider` instance mounted per tenant —
  is heavy at Logto Cloud's tenant count. **This is the real, still-unsolved reason the
  fork exists in 2026.**

> ⚠️ Important distinction (verified in code): this is **Cloud infra multi-tenancy**, NOT
> the **Organizations** product feature. Organizations works via standard
> `organization_id` params + `extraTokenClaims` (`init.ts:212`) and needs **no fork**.

## Shrink plan

| Fork reason | Removable? | How |
|-------------|:----------:|-----|
| Wildcard redirects | ✅ Yes | **Drop** (RFC 9700) or plugin/config |
| Custom client metadata | ✅ Yes | `extraClientMetadata` config |
| Multi-tenant dynamic issuer | ❌ No | Keep — fork's hard core |

**~2 of 3 reasons can be eliminated today without forking.** The fork can shrink to
*just the multi-tenancy patches* — which makes upstream-tracking and security-patch
adoption dramatically easier.

## Recommended sequence

1. **Drop wildcard redirects** (S) — enforce exact-match per RFC 9700. Removes a chunk of
   the fork *and* advances FAPI 2.0.
2. **Move custom metadata → `extraClientMetadata`** (M) — removes another chunk.
3. **Stand up the OIDC conformance suite** ([07](07-testing.md)) — the safety net.
4. **Rebase the slimmed fork** onto a *current* upstream tag; the remaining diff should be
   only multi-tenant issuer handling → much smaller, much easier to track.
5. **Add a Renovate watch** ([05](05-supply-chain.md)) on `panva/node-oidc-provider`
   releases so security drift is visible.
6. **Long-term:** evaluate whether the multi-tenant patch can be upstreamed (a
   `mountable`/dynamic-issuer feature request) or kept as a minimal, well-documented patch.

## Verification notes

- Code facts checked in this repo: the SHA pin, `Tenant.ts`/`init.ts` per-tenant
  `Provider`, `env-set/utils.ts` issuer construction, the stale EdDSA comment
  (`init.ts:71`), and `organization_id` handling (`init.ts:212`).
- Standards/upstream facts web-verified June 2026: RFC 9700 wildcard prohibition;
  panva's `extraClientMetadata` + `redirectUriAllowed` recipe; upstream's
  single-issuer-per-instance design.

## Sources

- [panva/node-oidc-provider — Wildcard redirect Discussion #1305](https://github.com/panva/node-oidc-provider/discussions/1305)
- [node-oidc-provider docs (extraClientMetadata)](https://github.com/panva/node-oidc-provider/blob/main/docs/README.md)
- [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://datatracker.ietf.org/doc/html/rfc9700)
- [WorkOS — We read RFC 9700 so you don't have to](https://workos.com/blog/oauth-best-practices)
