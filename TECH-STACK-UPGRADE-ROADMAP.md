# Tech Stack Upgrade Roadmap — `packages/experience`

> Feasibility map for modernising Logto's auth-experience package. This is a **fork** of
> `logto-io/logto`, so every upgrade is weighed against **fork-divergence cost** (future
> `git merge upstream/master` pain) in addition to technical risk.
> Scale: ~36k LOC · 382 src files · 101 SCSS modules · 64 test files · 31 pages · 11 providers.

Legend: 🟢 unblocked & low-risk · 🟡 unblocked but heavy/coordinated · 🔴 blocked

---

## ✅ Already shipped this effort (the "aggressive" stack is ~40% done)

| Upgrade | From → To | Notes |
|---|---|---|
| Vite + Rolldown | 6 → **8.0.16** | Build 8s → ~3s |
| @vitejs/plugin-react | 4 → **6** (Oxc, no Babel) | Needed TS 5.6+ |
| TypeScript | 5.5 → **5.9.3** | Unblocked plugin-react 6 d.ts |
| React Router | 6 → **7.18** | Zero code change (BrowserRouter API stable) |
| TanStack Query | added **5.101** | Consent + PasskeySetup migrated |
| @simplewebauthn | 10 → **13** (browser + server/core) | credential-shape rename handled |
| ky | 1 → **2.0.2** | hook signature + error.data + TextEncoder polyfill |
| react-hook-form / react-modal / react-spring | bumped | minor/major within range |
| @swc/core, @swc/jest, prettier, superstruct | bumped | patch/minor |
| State-machine foundation | added | `useSignInFlow` typed reducer + tests |

---

## 🟢 UNBLOCKED — clean, fork-safe-ish wins (do these)

| Item | Effort | Blast radius | Verdict |
|---|---|---|---|
| **Vitest** (jest → vitest) | Medium | 64 test files + jest.config (8 directives) → vitest.config. Mechanical port; Vite 8 already present. | Best ROI. Vite-native, ESM, 5-10x faster. |
| **react-helmet → react-helmet-async** | Low | react-helmet **unmaintained since 2022**. helmet-async is drop-in. Used in `Providers/AppBoundary/AppMeta` + a few. | Do it — removes a dead dependency. |
| **superstruct → Zod 4** | Medium | 26 files use superstruct. Both Standard-Schema-ish; incremental file-by-file. | Worthwhile (bigger ecosystem, RHF/TanStack native). |
| **XState v5 flow machine** | Medium | Additive — `useSignInFlow` hook already exists; wire one flow. No removal. | Makes implicit auth flow explicit. |
| **`erasableSyntaxOnly` (TS)** | Low | tsconfig flag flip → fix a handful of enum/namespace usages. TS 5.9 already present. | Strictness win, self-contained. |
| **Container queries (targeted)** | Low | Additive per-component; does NOT remove the device-class system. | Modern responsive where space-driven adapt is strictly better. |

## 🟡 UNBLOCKED but heavy / coordinated (decision + fork-cost)

| Item | Why heavy |
|---|---|
| **React 19** | No hard peer-block (react-modal & react-top-loading-bar declare `^19`; others open-range). BUT monorepo-wide (console+account+experience must move together to avoid 2 React copies) + fork-divergence. |
| **TanStack Router** | No external block, but a full rewrite of 31-page routing, replacing the just-done Router 7. High effort + fork-divergent. |
| **Tailwind v4 / Panda CSS** | Technically supported by Vite, but a **101-file** SCSS-module rewrite + the worst fork-merge-hell (every upstream style change conflicts). "Feasible but shouldn't" for a fork. |

## 🔴 BLOCKED — genuine blockers

| Item | Blocker |
|---|---|
| **ESLint 10 (flat config)** | `@silverhand/eslint-config@6.0.1` peer-deps `eslint ^8.57.0` + `@typescript-eslint/parser ^7`. Must bump the shared config package first. |
| **Biome (replace ESLint+Prettier)** | Repo's custom lint rules live in `@silverhand/eslint-config` (`@silverhand/fp/no-mutation`, import ordering, etc.). Biome can't replicate them → lose rules or maintain both. Toolchain-coupled. |
| **Paraglide / Lingui i18n** | i18n keys come from the shared `@logto/phrases-experience` workspace package (console/account/admin also consume it). Migrating = cross-package, 20+ locale files, fork-wide. |
| **stylelint removal** | Only possible once SCSS is gone (coupled to the Tailwind/Panda decision above). |

## 🟢 Keep as-is (already good)
CSS-variable per-tenant theming · i18n type-safety concept · TanStack Query · Vite 8/Rolldown · Router 7 · simplewebauthn 13 · passkey conditional-UI (already built) · Layout component separation.

---

## Recommended execution order
1. **react-helmet-async** (low risk, removes unmaintained dep)
2. **erasableSyntaxOnly** (flag + small fixes)
3. **Vitest** (highest ROI, but biggest of the "clean" set)
4. **superstruct → Zod** (incremental)
5. **XState wiring** (additive)
6. Decide later: React 19 (repo-wide), TanStack Router, Tailwind/Panda — all fork-cost heavy.

> Note: items are validated for **blast radius before** doing them — see commit history / per-item notes.
