
## packages/console jest config (Jest→Vitest migration, 2026-06-23)
- `jest.config.ts`, `jest.setup.ts` — replaced by `vitest.config.ts` + `vitest.setup.ts` when console moved to Vitest. Kept for reference; safe to delete.

- `packages/shared/src/esm/jose-mock.ts` (+ built `lib/esm/jose-mock.{js,d.ts}`) — was an abandoned approach to the jose-6/jest-ESM issue (a global `jose` moduleNameMapper stub). Wrong fix: it broke suites that exercise real `jose` (e.g. `koa-auth/utils`, `oidc-private-key`). The real fix was test-local (complete the `node:crypto` mock + full-mock `jwks.js`); jose 6 loads natively under jest. Safe to delete.
- docker-compose.integration.altports.yml — temporary alt-port (3011/3012) override used to run the step-up integration suite alongside an existing Logto on 3001; scaffolding only, safe to delete.
- _bodytype.test.ts — throwaway jest probe used to root-cause the oidc client-auth charset 400 (ky duplicate content-type header casing); safe to delete.
- packages/experience/src/shared/components/LogtoSignature/ + logto-logo-{light,dark,shadow}.svg — 'Powered by Logto' signature (anti-tamper) removed per user request (self-hosted rebrand to Hypedrive). 2026-06-24.
- (memory) admin-uses-blue-not-indigo.md — deleted per user request 2026-06-24

## packages/console/src/components/Topbar/InkeepAskAi + hooks/use-inkeep-configs.ts (2026-06-24)
The Inkeep AI assistant widget (Logto Cloud feature). On the self-hosted OSS console it
crashed with React #130 ("element type invalid") from inside @inkeep/cxkit-react. It's a
cloud-only feature (gated on isCloud, which is false here), so removed entirely from the
Topbar. Delete from archive/ when ready, or restore if Inkeep is ever wanted on cloud.
