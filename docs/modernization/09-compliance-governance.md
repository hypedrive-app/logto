# 09 — Compliance & Governance

The most-overlooked axis — and arguably the most important for an **enterprise IdP**.
These are differentiators in sales/security review, not cosmetics.

## Snapshot

| Area | Today | Target |
|------|-------|--------|
| SBOM | (none) | CycloneDX SBOM in release pipeline |
| Standards profile | Core OIDC/OAuth | **FAPI 2.0** compliance profile |
| Data rights | (manual?) | GDPR data-export + erasure APIs |
| Audit trail | DB logs | SIEM-exportable structured events ([08](08-observability.md)) |
| Cert evidence | (none surfaced) | OIDC conformance certificate ([07](07-testing.md)) |

## 1. SBOM (CycloneDX) in release

Generate a Software Bill of Materials on every release.
- **Action:** add CycloneDX generation (`@cyclonedx/cyclonedx-npm`) to the release
  workflow; publish the SBOM as a release artifact.
- **Why:** enterprise procurement + vulnerability response increasingly require it;
  pairs with the supply-chain forks audit ([05](05-supply-chain.md)).
- **Effort:** S · **Risk:** Low.

## 2. FAPI 2.0 compliance profile 🟢

**Financial-grade API** (FAPI 2.0) is the bar for fintech/banking/high-assurance IdPs.
If Logto wants enterprise/regulated customers, this is a real differentiator.
- **Requires** (much already in flight via [04](04-security-crypto.md)):
  - **PAR** (RFC 9126) — see [04](04-security-crypto.md).
  - **DPoP** or **mTLS** sender-constraining — see [04](04-security-crypto.md).
  - **PKCE** enforced.
  - Strict redirect-URI exact-match (no wildcards) — see [10](10-oidc-fork-shrink.md).
- **Action:** assemble a FAPI 2.0 client profile + run the FAPI conformance suite
  ([07](07-testing.md)).
- **Effort:** L · **Risk:** Med · **Value:** 🟢 High (enterprise unlock).

> Note: the security work in [04](04-security-crypto.md) and the wildcard-drop in
> [10](10-oidc-fork-shrink.md) are *also the FAPI building blocks*. Doing them buys both
> baseline security **and** the FAPI profile.

## 3. GDPR data-export & erasure APIs

Build data-subject rights in as **product features**, not manual ops:
- **Export** — machine-readable dump of a user's data (profile, sessions, consents, logs).
- **Erasure** — right-to-be-forgotten flow with cascade + audit (log the erasure itself).
- Tenant-scoped, admin-triggerable + optionally end-user self-serve.
- **Effort:** M · **Risk:** Low.

## 4. Governance hygiene

| Item | What |
|------|------|
| **License compliance** | Scan deps for license conflicts (pairs with SBOM) |
| **Security policy** | `SECURITY.md` + coordinated disclosure process |
| **Cert evidence** | Publish OIDC conformance certificate ([07](07-testing.md)) |
| **Data residency** | Multi-region story for regulated tenants (infra) |

## Sequence

1. **SBOM** (S) — cheap, immediate procurement value.
2. **GDPR export/erasure** (M) — table-stakes for EU customers.
3. **FAPI 2.0** (L) — after the [04](04-security-crypto.md) building blocks land; gates on
   PAR + DPoP/mTLS + conformance.
