import { sql } from '@silverhand/slonik';

import type { AlterationScript } from '../lib/types/alteration.js';

/**
 * Step-up (RFC 9470): declare the required / default ACR on the RBAC entities so step-up becomes
 * a scope-level concern rather than a hardcoded backend gate.
 *
 * - `scopes.required_acr`: the minimum ACR before a scope may be granted into a token (primary).
 * - `resources.default_acr`: the resource-wide fallback when a scope leaves `required_acr` null.
 *
 * Both nullable with no default → zero-downtime, no backfill (null = "inherit / none").
 */
const alteration: AlterationScript = {
  up: async (pool) => {
    await pool.query(sql`
      alter table scopes
        add column if not exists required_acr varchar(64);
    `);
    await pool.query(sql`
      alter table resources
        add column if not exists default_acr varchar(64);
    `);
  },
  down: async (pool) => {
    await pool.query(sql`
      alter table resources drop column if exists default_acr;
    `);
    await pool.query(sql`
      alter table scopes drop column if exists required_acr;
    `);
  },
};

export default alteration;
