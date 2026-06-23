# 01 — Frontend Architecture

The biggest surface area. Three SPAs (`experience`, `console`, `account`) plus the
`elements` Lit package.

## Snapshot (verified)

| Area | Today | Target |
|------|-------|--------|
| Framework | React `18.3`, 3 separate SPAs | React 19 + Actions/`useFormStatus` |
| Styling | 100+ SCSS modules/app + JS `body.mobile` class-swap | Panda CSS (zero-runtime, typed tokens, RTL) **or** Tailwind v4 |
| Routing | `react-router-dom` `7.18` | TanStack Router (type-safe routes + search params) |
| State | nested Context providers | XState v5 (auth flows) + TanStack Store (app state) |
| Data | `swr` `2.2` (console) **+** `@tanstack/react-query` `5.101` (experience) | TanStack Query **everywhere** |
| Forms | `react-hook-form` `7.80` + `zod` `3.24` + `superstruct` `2.0` | RHF + Zod 4 (Standard Schema) everywhere |
| i18n | `i18next` `22.4` (4 majors behind) | Paraglide (compile-time, tree-shakeable) |
| Shared UI | `@experience/*` **source-aliased** into account | Real `@logto/ui` design-system package |

## Convergence wins (Wave 3 — do these first, low risk)

### Unify data layer → TanStack Query
The repo runs **two** data libraries. `console` uses `swr`; `experience` uses
`@tanstack/react-query`. This is real, observable inconsistency — different cache
semantics, different retry/dedupe behavior, two mental models.

- **Action:** migrate `console`'s `swr` hooks + any manual `ky` fetch-hooks to
  TanStack Query. One cache, one devtools, one set of patterns.
- **Effort:** M · **Risk:** Low (incremental, hook-by-hook).

### Zod everywhere (drop superstruct)
Validation is split between `zod` `3.24` and `superstruct` `2.0`. Pick one.
- **Action:** migrate `superstruct` schemas to Zod; bump to **Zod 4** (Standard
  Schema interop, faster, smaller). RHF already integrates via `@hookform/resolvers`.
- **Effort:** M · **Risk:** Low.

### Real `@logto/ui` design system — fixes `@experience/*` source-alias
**This is the most important structural fix.** Today `account` imports
`experience`'s `src/` directly via source-alias. That's fragile cross-package
coupling — a change in experience's internals can silently ripple into account
(observed in past work: a helmet/ripple regression traced to exactly this).

- **Action:** extract shared components into a proper published-shape `@logto/ui`
  package (the `elements` Lit package is a seed but is web-components, not React —
  decide: grow `elements`, or new React `ui` package). Consume via package
  boundary, **not** source-alias.
- **Effort:** L · **Risk:** Med · **Value:** 🟢 High (kills a whole bug class).

## Big bets (Wave 4 — transform, real rewrites)

### React 19 repo-wide
Auth UI is form-heavy → Actions + `useFormStatus` + `useActionState` remove a lot of
manual loading/error/pending boilerplate. RSC-where-possible for console's static shells.
- **Sequence:** bump to React 19 *first* (mostly compatible), then refactor forms to
  Actions incrementally.

### Styling — kill SCSS sprawl
100+ SCSS modules per app + a JS `body.mobile` class-swap (runtime layout hack).
- **Panda CSS:** zero-runtime, type-safe tokens, RTL built-in (Logto ships 20+
  locales incl. RTL) — strong fit. Kills `stylelint` entirely.
- **Tailwind v4:** simpler migration, larger ecosystem.
- **Decide by:** does the team want design-token rigor (Panda) or velocity (Tailwind)?

### TanStack Router
Type-safe routes + typed search params. Auth flows pass many params through URLs
(state, interaction id, error codes) → typed params eliminate a real bug class.

### Paraglide i18n
`i18next` `22` is 4 majors behind. Paraglide compiles each message → tree-shakeable,
zero-runtime. With 20+ locales this is a meaningful bundle win and removes the custom
typed-keys layer.

## Console — full ground-up rebuild stack (committed 2026 pick)

If `console` is rebuilt from scratch (Wave 4, XL, high-risk — **after** the security wins in
[04](04-security-crypto.md)), this is the target stack. Verified against the actual repo first:
`console` today is React 18, react-router 7, **SWR (154 files)**, **SCSS modules (468 files)**,
i18next 22, Vite, Vitest, ky.

| Layer | Pick | Reason |
|-------|------|--------|
| UI | **React 19** | Actions / `use()` / ref-as-prop; SDK + ecosystem fit |
| Perf | **React Compiler** | auto-memoization — kills manual `useMemo`/`useCallback` in a tables/forms-heavy app |
| Router | **TanStack Router** | type-safe routes + Zod-validated search params (deep nested routes + filters) |
| Server state | **TanStack Query v5** | replaces SWR (154 files); same family as the router (loaders prefetch queries) |
| Client state | **Zustand** | local global state, zero boilerplate |
| HTTP | **ofetch** | `error.data` built-in (the ky-2 bug class), retry/interceptors, fetch-based |
| Styling | **Tailwind v4** | replaces 468 SCSS modules; matches the experience/account migration → monorepo consistency |
| Components | **Base UI** (headless) | accessible primitives (dialog/combobox) — a11y for free |
| Forms | **React Hook Form** + React 19 Actions | keep RHF; Actions for cleaner mutations |
| Validation | **Zod 4** | already done; shared FE+BE |
| i18n | **Paraglide JS** | i18next 22 is 4 majors behind; compile-time, tree-shakeable, typed keys |
| Bundler | **Vite 7 + Rolldown** | much faster builds for a large app |
| Test | **Vitest** (+ browser mode) **· Playwright** (E2E + visual snapshots) | already on Vitest |
| Lint/format | **Biome** | ESLint + Prettier + stylelint (3 tools) → one Rust tool |

**Top leverage (ROI order):** (1) TanStack Router + Query — type-safe routes + kill SWR-sprawl;
(2) Tailwind v4 — 468 SCSS gone, monorepo-consistent; (3) React 19 + Compiler; (4) Biome.

### Why React, not Svelte — decision record

Svelte 5 was seriously evaluated and is **technically stronger** (runes / fine-grained reactivity,
no VDOM, smaller bundle, less boilerplate; SvelteKit unifies routing+data). Two assumed blockers were
**checked against reality and found false**, so this was a genuine close call, not a default:

- ✅ **`@logto/sveltekit` exists** and is officially maintained (npm, ~v0.3.21, 2025) — there *is* a
  first-class Svelte auth SDK.
- ✅ `console` is **standalone UI** — it imports **0** components from `experience`/`account` (verified);
  shared deps are only `@logto/shared/universal` (React-free utils) + `@logto/phrases` (strings). Its
  only React coupling is **`@logto/react` in ~25 files** (swappable).

React still wins on **pragmatics**, not capability:
1. `@logto/sveltekit` is **SSR-oriented**, but `console` is a **pure client-side SPA** → Svelte means
   adopting a SvelteKit/SSR architecture (or hand-wrapping `@logto/browser`), i.e. an *architecture*
   shift on top of the framework swap.
2. Team + the other two apps are React → velocity, hiring, and **library maturity**
   (Base UI / RHF / TanStack vs. Svelte equivalents).
3. React 19 + Compiler captures ~80% of Svelte's reactivity/perf wins without those costs.

**Reverse only if** `console` is spun out as a standalone full-stack product (decoupled from the
monorepo) — then SvelteKit + `@logto/sveltekit` + Paraglide (SvelteKit-native) becomes the better pick.

## Risks & sequencing

1. Do **convergence wins first** (data, validation, design-system) — they reduce the
   surface the big rewrites touch.
2. React 19 bump before any Actions refactor.
3. Styling migration is the longest pole — pilot on `account` (smallest app) first.
4. Don't do Router + i18n + styling simultaneously; one transform per app at a time.
