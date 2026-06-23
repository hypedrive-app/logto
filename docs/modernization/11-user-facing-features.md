# 11 — User-Facing Feature Gaps

The other docs cover *tech-stack* modernization (deps, infra, standards). This one is different:
**product gaps** — end-user / account-holder features a competitor (Auth0, Clerk, WorkOS, Google)
ships that Logto does not. Audited against the actual codebase (2026-06).

## Where Logto is already strong (verified, no work needed)

Don't rebuild these — they exist:

- **Auth methods (8/8):** password, email/SMS verification code, social, **passkeys/WebAuthn**,
  enterprise SSO (SAML/OIDC), Google One Tap, one-time-token magic-link.
- **MFA (7/7):** TOTP, email/SMS OTP, backup codes, WebAuthn-as-MFA, **step-up auth (RFC 9470)**,
  adaptive-MFA toggle.
- **Account self-service:** profile edit, change password, change email/phone, link/unlink social,
  **view/revoke active sessions**, MFA enrollment UI, custom profile fields, org invitations/consent.

## What's actually missing (ranked by ROI)

| # | Gap | User value | Effort | ROI |
|---|-----|-----------|:------:|:---:|
| 1 | **Security event notifications** (emails) | 🟢 High | **S** (Phase 1) | 🥇 Best |
| 2 | **Self-service account deletion** (real API) | 🟡 Med (legal) | S | 🥈 |
| 3 | **Self-service data export** (GDPR) | 🟡 Med | M | 🥈 |
| 4 | **Trusted devices** ("remember this device") | 🟡 Med (UX) | M | 🥉 |
| 5 | **Risk-based / suspicious-activity detection** | 🟡 Med | L | low |

---

## 1. Security event notifications 🥇 (best ROI — recommended first)

**The gap (verified):** Logto today sends **only transactional verification emails** — every template
(`SignIn`, `Register`, `ForgotPassword`, `OrganizationInvitation`, `BindNewIdentifier`,
`UserPermissionValidation`, `Generic`) is *"you requested X → here's your code/link"*. There is **not a
single proactive security alert** — no *"you signed in from a new device"*, *"your password was
changed"*, *"MFA was added"*. Every major auth product ships these. Webhooks (`PostSignIn`,
`User.Data.Updated`) fire, but they go to the **customer's server** for automation — the **end user**
gets nothing.

### Feasibility: ✅ HIGH — ~80% of infra already exists

Reuse, don't rebuild:
- **Email send path:** `libraries/connector.ts:155` (`getMessageConnector`) + `libraries/passcode.ts:104`
  (`sendMessage`) — a generic templated-email sender; not coupled to passcodes.
- **Template storage:** `routes/email-template/` full CRUD; new types just extend the
  `TemplateType` enum in `@logto/connector-kit` (`types/passwordless.ts:22`) — **no DB migration**.
- **Account-change events already fire** (`User.Data.Updated`): `email-and-phone.ts:70,105,151,186`
  and `mfa-verifications.ts` (6 sites).
- **User prefs + admin toggle:** ride on existing JSONB (`user-logto-config.ts`,
  `sign-in-experience`) — **no migration**.

Two real gaps to close:
- **Password change fires no hook** — `routes-me/user.ts:159` updates the user but never signals it.
- New **alert-type** email templates + the wiring to trigger them.

> ⚠️ **Design note:** `User.Data.Updated` is a customer-facing *data hook* — it says "the user
> changed", not *what* changed. Don't drive internal emails off it (you'd have to diff old/new state).
> Instead, call a `sendSecurityEmail(userId, 'password_changed')` helper **explicitly** right after
> each `updateUserById` site. Explicit, no diffing, leaves the webhook system untouched.

### Phased plan

**Phase 1 — account-change alerts (password / email / phone / MFA added/removed)** 🟢 ~1 week
- New `libraries/security-notification.ts` (mirrors the `passcode.ts` send pattern).
- ~5 new `TemplateType`s (`PasswordChanged`, `MfaFactorAdded`, …) in connector-kit.
- ~5 explicit `sendSecurityEmail(...)` call-sites (incl. the missing password-change one).
- 1 admin toggle (sign-in-experience) + 1 per-user pref (user-logto-config).
- **No device tracking, no migration.** High visibility (every user sees these), low risk.

**Phase 2 — new-device sign-in alert** 🔴 ~3–4 weeks (defer)
- Net-new `user_devices` table + migration, device-fingerprint library (UA+IP hash), sign-in
  context capture, and a "trust this device" UX.
- **Biggest blocker:** fingerprint accuracy — UA changes on every browser update, IPs roam, so naive
  hashing causes false positives → alert fatigue. Needs a trust model + tolerance tuning.
- Lower ROI than Phase 1; treat as a separate project.

**Recommendation:** ship **Phase 1 only** now (small, infra-ready, competitor-parity). Defer Phase 2.

---

## 2–5. The rest (briefly)

- **Account deletion (self-service):** today only an admin-configured `deleteAccountUrl` redirect —
  no actual self-serve delete endpoint. **GDPR/CCPA** often requires it. Small backend endpoint.
- **Data export (GDPR):** only an "export-user-data" reference in onboarding types; no user-facing
  endpoint. "Download my data" in account-center. Medium.
- **Trusted devices:** step-up exists but no *persistent* device trust → users re-MFA every time. A
  friction-reducer (shares the Phase-2 device table above).
- **Risk-based auth:** `adaptiveMfa` is only an `enabled: boolean` today — no real risk scoring /
  anomaly detection. Impactful but L effort; low ROI for now.
