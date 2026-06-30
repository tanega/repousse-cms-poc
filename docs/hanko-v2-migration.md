# Hanko v2 Migration Notes

Starting point for migrating from `@teamhanko/hanko-elements@^1.0.3` + `hanko:latest` (v1) to Hanko v2.

## Current state (v1)

- **Server**: `ghcr.io/teamhanko/hanko:latest` (v1 line)
- **Frontend SDK**: `@teamhanko/hanko-elements@^1.0.3` + `@teamhanko/hanko-frontend-sdk@^1.0.3`
- **Auth flow**: Hanko Flow API (`/login?action=...`) — state-machine driven, CSRF token in request body
- **Session**: `hanko` cookie (JWT) set server-side, readable via JS when `http_only: false`
- **JWT verification**: backend fetches JWKS from `http://hanko:8000/.well-known/jwks.json` and verifies with `Joken`

## Why we didn't migrate yet

Auth debugging (CORS, JWKS compile-time bake, Jason encoding, CSRF) was complex enough on v1. Introducing v2 API changes mid-session would have layered new breakage on top of unresolved issues.

## Known v1 pain points that v2 may address

- Flow API CSRF: token must be sent in request body (not header) — easy to get wrong when scripting
- `http_only: false` required to read the session cookie from JS — a security trade-off
- `onSessionCreated` fires before the cookie is guaranteed to be readable — potential race condition
- JWKS config must be in `runtime.exs` (not `config.exs`) to pick up Docker env vars

## Things to verify before migrating

1. **SDK package names** — check if `hanko-elements` and `hanko-frontend-sdk` still exist at v2 or have been renamed/merged
2. **Flow API** — determine if the `/login?action=...` state machine is still the same or replaced
3. **`onSessionCreated`** — verify the callback still exists and its signature in v2
4. **Cookie behavior** — check if `http_only: false` is still required or if v2 exposes the token differently
5. **JWKS endpoint** — confirm `/.well-known/jwks.json` is still the JWT verification path
6. **Config keys** — `email_delivery`, `password`, `session.cookie` may have changed in v2 YAML schema
7. **`/sessions/validate`** — used in the middleware as an alternative to JWKS; verify it still exists

## Migration checklist

- [ ] Read the Hanko v2 changelog and migration guide on GitHub
- [ ] Pin server image to a specific v2 tag (avoid `latest` during migration)
- [ ] Update `hanko/config.yaml` against the v2 JSON schema (`hanko schema generate config`)
- [ ] Update frontend SDK packages and adapt `LoginPage` (`onSessionCreated`, cookie read, logout method)
- [ ] Update `middleware.ts` if session validation approach changes
- [ ] Re-validate backend: JWKS URL, JWT claims format (`sub`, `email` fields), `LoadCurrentUserPlug`
- [ ] Re-test CORS preflight — `CorsController` calling `CORSPlug.init([])` should still work but verify
- [ ] Update `hanko_session.md` memory file with v2 patterns

## References

- Hanko releases: https://github.com/teamhanko/hanko/releases
- Hanko v2 migration guide (if available): https://docs.hanko.io/migration
- Current v1 patterns: see `memory/hanko_session.md` in this project's Claude memory
