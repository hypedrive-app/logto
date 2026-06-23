# 08 — Observability

Today's telemetry is **Azure-specific** (`app-insights` package). Modernize to a
vendor-neutral stack — and notably, **the team already uses SigNoz** (referenced in
project memory), so this is a natural convergence, not a new vendor.

## Snapshot (verified)

| Area | Today | Target |
|------|-------|--------|
| Telemetry | `packages/app-insights` (Azure Application Insights) | OpenTelemetry (vendor-neutral) → **SigNoz** |
| Tracing | (implicit / vendor SDK) | OTel distributed tracing across OIDC flows |
| Audit events | DB audit logs | Structured, SIEM-exportable first-class events |
| Metrics | (vendor-specific) | OTel metrics → SigNoz dashboards |

## 1. app-insights → OpenTelemetry / SigNoz 🟢

`app-insights` couples telemetry to Azure. **OpenTelemetry** is the vendor-neutral
standard; **SigNoz** is an OTel-native backend the team already operates.

- **Action:** replace the Azure App Insights SDK with the **OTel Node SDK**; export OTLP
  to SigNoz. Keep a thin shim so call-sites don't all change at once.
- **Why:** removes vendor lock-in, unifies on the stack you already run, gives traces +
  metrics + logs in one place.
- **Effort:** M · **Risk:** Low · **Value:** 🟢 High.

## 2. Distributed tracing across OIDC flows

Auth flows span multiple hops (authorize → interaction → consent → token). Trace them
end-to-end with OTel context propagation:
- Span the full authorization-code + token-exchange + refresh lifecycle.
- Tag spans with `tenantId`, `clientId`, grant type (no PII/secrets in span attributes).
- Makes latency regressions and stuck flows debuggable in production.

## 3. Structured audit events as first-class 🟢

Today audit data lives in DB logs aimed at debugging. Promote it to **structured,
SIEM-exportable events**:
- Stable schema (actor, action, resource, tenant, result, timestamp, correlation id).
- Export to SIEM (Splunk/Elastic/SigNoz) — required for **SOC 2 / ISO 27001**, not just
  debugging.
- Pairs with audit-log partitioning ([06](06-database.md)): export before partition drop
  so retention policy doesn't lose compliance data.
- Feeds anomaly detection → step-up MFA ([04](04-security-crypto.md)).

## 4. Health & SLO instrumentation

- RED metrics (Rate/Errors/Duration) per endpoint group.
- SLO dashboards for the auth-critical paths (token issuance, JWKS, authorize).
- Alerting on OIDC error-rate spikes (early signal of a fork-bump regression).

## Sequence

1. **app-insights → OTel/SigNoz** (Wave 1) — foundation, low risk, you already run SigNoz.
2. **OIDC flow tracing** — once OTel SDK is in.
3. **Structured audit events** — pairs with [06](06-database.md) partitioning and
   [09](09-compliance-governance.md) compliance needs.
