# Logto Auth UI Revamp — Plan & Mockups

Scope: `packages/experience` (the end-user sign-in / sign-up / reset / MFA / social experience).
Goals (chosen): **(1) Modern visual redesign · (2) Motion & micro-interactions · (3) UX/conversion (passkey, social, forms).**
Constraint: keep Logto's design-token system (CSS variables), SCSS modules, react-spring, and i18n. No framework swap. Everything below is additive/opt-in so it can't break tenant branding.

---

## 0. Current state (verified from source)

| Surface | File | Today |
|---|---|---|
| Desktop card | `Layout/AppLayout/index.module.scss` | 540px white card, `border-radius: 16px`, `box-shadow: var(--color-shadow-2)` (very faint: `rgba(0,0,0,2%)`), flat `--color-bg-body-base` page behind it. **No split-screen.** |
| Page shell | `Layout/FirstScreenLayout` | Single column, `placeholderTop flex:3 / placeholderBottom flex:5` to vertically bias the card upward. |
| Buttons | `shared/components/Button/index.module.scss` | Solid `--color-brand-default`, `radius: var(--radius)` = 8px, `transition: background .2s`. No press-scale, no shadow. |
| Social | `components/Button/SocialLinkButton.tsx` | Reuses `.secondary` button, full-width stacked list, logo + "Sign in with X". Works, but visually heavy when 3+ providers. |
| Passkey | `components/Button/PasskeySignInButton` | Exists, rendered as just another button in `pages/SignIn`. **Not promoted, no conditional-UI autofill.** |
| Motion | `react-spring` 9.6 | Used only for the phone-prefix input width. **No page/step transitions.** |
| Tokens | `shared/scss/_colors.scss`, `_fonts.scss`, `normalized.scss` | Solid token system already. `--radius: 8px`. Brand = `#5d34f2`. |
| Responsive | `body.mobile/.desktop` via JS `react-device-detect` | Class-swap, not media queries → SSR/first-paint can mismatch; not fluid. (Out of scope for these 3 goals, noted for later.) |

The bones are good. The wins are **depth, motion, hierarchy, and passkey-forward UX** — not a rewrite.

---

## PHASE 1 — Modern visual redesign

### 1.1 Split-screen desktop layout (the biggest "wow")
New optional layout `Layout/SplitAuthLayout/` that renders a **brand panel** (left) + **form column** (right) on desktop, collapses to form-only on mobile. Driven by existing `experienceSettings` (logo, brand color, optional `slogan`/illustration). Falls back to today's centered card if no brand panel content — zero risk to existing tenants.

```
┌─────────────────────────────────────────────────────────────┐
│                          │                                    │
│   [logo]                 │        Welcome back                │
│                          │   Sign in to continue to Acme      │
│   ╱╱ gradient mesh ╱╱    │                                    │
│   using --color-brand    │   ┌──────────────────────────┐     │
│                          │   │ Email or phone           │     │
│   "Ship auth in a day,   │   └──────────────────────────┘     │
│    not a quarter."       │   ┌──────────────────────────┐     │
│                          │   │ Continue            →    │     │
│      — testimonial /     │   └──────────────────────────┘     │
│        feature bullets   │   ──────────  or  ──────────       │
│                          │    G  GitHub   Apple               │
│   • secured by Logto     │                                    │
└─────────────────────────────────────────────────────────────┘
        45% brand panel              55% form (max 400px)
```

- Brand panel background: gradient mesh built from the tenant's `--color-brand-default` (e.g. `radial-gradient` blobs + subtle noise), so it auto-themes per tenant. Dark-mode aware.
- Mobile: brand panel hidden; logo moves inline above the form (today's behavior preserved).
- Implementation: new layout component + `*.module.scss`; opt-in via a settings flag (default off → existing behavior untouched).

### 1.2 Elevate the card & background (low-risk, applies even without split-screen)
In `_colors.scss` add richer shadow tokens and use them in `AppLayout`:
```scss
--color-shadow-float: 0 1px 2px rgba(0,0,0,4%), 0 8px 24px rgba(0,0,0,6%);
--color-bg-mesh: radial-gradient(...);   /* subtle, brand-tinted */
```
- Card: `box-shadow: var(--color-shadow-float)` + 1px hairline border for definition.
- Page behind card: faint brand-tinted mesh instead of flat fill.
- Bump card `border-radius` 16px → 20px for a softer, current feel.

### 1.3 Token refresh
- `normalized.scss`: introduce `--radius-sm: 8px`, `--radius: 12px`, `--radius-lg: 16px` (inputs/buttons feel more modern at 12px; keep 8 available). **This is the one change that touches many components — gate it behind review.**
- Inputs/buttons → `--radius` (12px). Card → `--radius-lg`.

```
 Before            After
 ┌──────────┐      ╭──────────╮
 │ Email    │  →   │ Email    │   (8px → 12px corners, hairline + focus glow)
 └──────────┘      ╰──────────╯
```

**Files:** `Layout/SplitAuthLayout/*` (new), `Layout/AppLayout/index.module.scss`, `shared/scss/_colors.scss`, `shared/scss/normalized.scss`.

---

## PHASE 2 — Motion & micro-interactions (react-spring, already a dep)

### 2.1 Step transitions
Sign-in is multi-step (`SignIn → IdentifierSignIn → SignInPassword`). Today each is a hard cut. Add a shared `<AuthTransition>` wrapper (react-spring `useTransition`) that slides/fades between steps — forward = slide-left, back = slide-right. Respects `prefers-reduced-motion` (instant when set).

```
 Step 1: identifier        Step 2: password
 ┌────────────┐            ┌────────────┐
 │ Email      │   slide →  │ Password    │
 │ [Continue] │            │ [Sign in]   │
 └────────────┘            └────────────┘
```

### 2.2 Button press + loading polish
In `Button/index.module.scss`:
- `:active { transform: scale(.985) }` press feedback.
- Hover lift on primary (desktop): subtle `box-shadow` + brightness.
- The existing icon/loading spinner stays; just add the spring on press. (Loading already handled via `useDebouncedLoader`.)

### 2.3 Input focus glow
Inputs currently rely on border color. Add a focus ring using the existing `--color-overlay-brand-focused` token:
`box-shadow: 0 0 0 3px var(--color-overlay-brand-focused)` on `:focus-within` + border → brand. Animated 150ms.

### 2.4 Staggered social entrance + success state
- Social buttons fade/translate in with a 40ms stagger (react-spring `useTrail`).
- On successful auth before redirect: brief animated check (reuse success token color) instead of a blank flash.

**Files:** new `components/AuthTransition/`, `shared/components/Button/index.module.scss`, `shared/components/InputFields/*.module.scss`, `containers/SocialSignInList/`.

---

## PHASE 3 — UX / conversion

### 3.1 Passkey-first
- Promote `PasskeySignInButton` to the **top** of the sign-in options (above social), with a distinct "fingerprint/passkey" treatment, when `passkeySignIn` is enabled in `useSieMethods()`.
- Add **conditional UI (autofill)**: `@simplewebauthn/browser` is already a dep — set `autocomplete="username webauthn"` on the identifier field and call `startAuthentication({ mediation: 'conditional' })` so the browser offers the passkey inline in the email field. Big conversion + security win, near-zero UI cost.

```
 ┌──────────────────────────────┐
 │ 🔑  Sign in with a passkey   │   ← promoted, primary-ish styling
 └──────────────────────────────┘
 ───────────── or ─────────────
  G Google    GitHub    Apple
```

### 3.2 Password field upgrades (`pages/SignInPassword`, `RegisterPassword`, `ResetPassword`)
- **Show/hide toggle** (eye icon) inside the field.
- **Caps-lock warning** inline ("Caps Lock is on").
- **Strength meter** on register/reset (segmented bar, brand→success), driven by existing password-policy data Logto already enforces server-side — surface it client-side for instant feedback.

```
 Password           ┌─────────────────────┐ 👁
                    └─────────────────────┘
 Strength  ▓▓▓▓▓▓▓▓▓░░░░  Good
 ⚠ Caps Lock is on
```

### 3.3 Social button density
When ≥3 social providers: switch the stacked list to a **2-up icon grid** (logo + short name), with a "more" expander if many. Fewer providers → keep full-width labeled buttons (clearer). Logic in `containers/SocialSignInList`.

### 3.4 Inline validation timing
Switch error display to **on-blur + on-submit** (not on every keystroke) with a gentle shake on submit-fail, and keep `ErrorMessage` ARIA-live so SR users hear it. Reduces "yelling at you while typing".

**Files:** `pages/SignIn/*`, `components/Button/PasskeySignInButton/*`, identifier field + `Providers/WebAuthnContextProvider`, password pages, `containers/SocialSignInList`, `components/ErrorMessage`.

---

## Risk / safety notes
- **Tenant branding is sacred.** Everything keys off existing `--color-brand-*` tokens and `experienceSettings`, so each tenant's color/logo flows through automatically. Split-screen + mesh are opt-in.
- **`prefers-reduced-motion`** honored everywhere in Phase 2.
- The only broad-touch change is the **radius token (3.1.3)** — review carefully or skip.
- No new heavy deps: react-spring, classnames, @simplewebauthn/browser are all already installed.

---

## Suggested build order (incremental, each shippable)
1. **Phase 2.2 + 2.3** (button/input polish) — tiny, instant perceived-quality lift, lowest risk. *Good first PR.*
2. **Phase 1.2** (card elevation + mesh bg) — visual depth without layout change.
3. **Phase 3.2** (password show/caps/strength) — high user value, self-contained.
4. **Phase 3.1** (passkey-first + conditional UI) — conversion + security.
5. **Phase 2.1** (step transitions) — needs the AuthTransition wrapper.
6. **Phase 1.1** (split-screen) — biggest change, do last with the polish already in place.
7. **Phase 3.3 / 3.4 / 2.4** — refinements.

> Out of scope for now (noted for a later pass): replacing JS `react-device-detect` class-swap with real CSS media/container queries for fluid + SSR-correct responsiveness.
