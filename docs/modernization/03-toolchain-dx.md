# 03 — Toolchain & Developer Experience

Pure DX wins — low app-risk, high daily-velocity payoff.

## Snapshot (verified)

| Area | Today | Target |
|------|-------|--------|
| Lint + format | `eslint` `8.56` + `@silverhand/eslint-config` + Prettier + stylelint | Biome (Rust; lint+format in one) |
| TypeScript | `5.9.3` | TS 6.0 + `erasableSyntaxOnly` + project references |
| Build | `vite` `8.0` / `6.2` (mixed) + Rolldown | Rolldown everywhere + Turborepo |
| Monorepo | pnpm workspaces, manual `generate.sh`/`generate.ts` per pkg | Turborepo task graph + remote cache |
| Package mgmt | pnpm 9/10 | pnpm 10 + **catalog** (single-version policy) |

## Turborepo (Wave 3 — do early, biggest DX win)

The monorepo has 21 packages with manual per-package generate steps and no task-graph
caching. Turborepo (or Nx) gives:
- **Cached builds** — unchanged packages skip rebuild/retest.
- **Remote cache** — CI shares cache across runs → 10× faster CI on warm cache.
- **Explicit task graph** — `build`/`test`/`lint` dependencies declared once.

Effort: M · Risk: Low · Value: 🟢 High. **No app code changes** — pure orchestration.

## pnpm catalog (Wave 2 — kills version drift)

Verified drift in the repo: `vite` at both `8.0` and `6.2`; `eslint` at `8.56` and
`8.57`; multiple TS pins. `pnpm catalog` enforces a **single version per dependency**
across all packages from one place.

- **Action:** define a `catalog:` in `pnpm-workspace.yaml`, point packages at it.
- Effort: S · Risk: Low.

## Biome (Wave 4 — drastic, has a catch)

Biome replaces ESLint 8 + Prettier + stylelint with **one Rust tool**, ~20× faster.
- **The catch:** the repo depends heavily on `@silverhand/eslint-config` (34 usages) +
  `@silverhand/eslint-config-react` (10). Those custom rules must be reimplemented as
  Biome rules or dropped. That's the real cost — not the tool swap itself.
- **Decide:** is the team willing to give up the `@silverhand` rule set? If those rules
  encode real conventions, partial migration (Biome for format, keep ESLint for the
  custom rules) is a pragmatic middle ground.
- Effort: L · Risk: Med.

## TypeScript 6.0 (Wave 4)

- `erasableSyntaxOnly` — aligns with Node's native type-stripping, future-proofs.
- **Project references** — faster incremental builds across the 21 packages (pairs well
  with Turborepo).
- Effort: M · Risk: Med (6.0 may surface new strictness errors).

## Build — Rolldown everywhere

`experience`/`console`/`account` already moved to Vite 8/Rolldown. Finish: align the
remaining packages (some on Vite 6.2) and any tsup/rollup leftovers onto Rolldown for
one bundler story.

## Sequence

1. **pnpm catalog** (S, immediate drift fix).
2. **Turborepo** (M, biggest velocity win, zero app risk).
3. **Rolldown alignment** (finish what's started).
4. **TS 6.0** (after Turborepo project-references land).
5. **Biome** last — only after deciding the `@silverhand` rules question.
