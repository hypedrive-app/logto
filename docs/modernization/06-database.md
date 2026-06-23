# 06 — Database Modernization

Beyond "swap the query lib" — the data layer, migrations, and scale story.

## Snapshot (verified)

| Area | Today | Target |
|------|-------|--------|
| Driver | `@silverhand/slonik` `31.0.0-beta.2` (forked) | Mainline slonik **or** Drizzle ([02](02-backend.md)) |
| Migrations | Home-grown `alteration` system (CI: `alteration-compatibility-integration-test.yml`) | Drizzle/Atlas migrations |
| Pooling | App-level (slonik pool) | PgBouncer / RDS Proxy for multi-tenant |
| Audit logs | Single growing table | Partitioned + retention policy |
| Replicas | (none evident) | Read replicas for read-heavy paths |

## Migrations — the home-grown `alteration` system

Logto ships a custom migration framework (`alterations/`) with a dedicated CI job
(`.github/workflows/alteration-compatibility-integration-test.yml`) that tests
forward/backward compatibility. It works, but it's bespoke code to maintain.

- **If migrating to Drizzle** ([02](02-backend.md)): Drizzle Kit migrations replace the
  home-grown system — generated from schema, with a standard up/down model. Big
  simplification, but couples to the Drizzle decision.
- **If staying on slonik:** keep `alteration` but consider **Atlas** (declarative schema
  migrations) layered on top for safer diffs and CI verification.
- **Either way:** the compatibility-integration-test discipline is good — preserve it.

## Scale story (multi-tenant Cloud)

Logto Cloud is multi-tenant with **per-tenant dynamic issuers** (see [10](10-oidc-fork-shrink.md)).
That shapes the DB needs:

### Connection pooling
Many tenants → many short-lived connections. App-level pooling alone won't scale.
- **PgBouncer** (transaction pooling) or **RDS Proxy** in front of Postgres.
- Effort: M · Risk: Med (transaction-mode pooling interacts with prepared statements /
  session state — verify slonik/Drizzle compatibility).

### Read replicas
Audit-log reads, dashboard analytics, and JWKS lookups are read-heavy. Route reads to
replicas; keep writes on primary.
- Effort: M · Risk: Med.

### Audit-log partitioning
Audit logs grow unbounded and dominate table size over time.
- **Postgres native partitioning** by time (monthly/weekly) → cheap drops for retention,
  faster queries on recent data.
- Add a **retention policy** (drop/archive partitions older than N days per plan tier).
- Pairs with structured audit events ([08](08-observability.md)) — export to SIEM before drop.
- Effort: M · Risk: Med · Value: 🟡 Med (becomes High at scale).

## Sequence

1. Resolve the **slonik vs Drizzle** decision first ([02](02-backend.md)) — it gates the
   migration-tooling choice.
2. **Audit-log partitioning + retention** — independent of the driver decision, high
   value at scale, do early.
3. **PgBouncer/RDS Proxy** + **read replicas** as Cloud load grows.
