# Testing authenticated endpoints via Swagger UI

Swagger UI (`/api/v1/swaggerui`) can send real requests with "Try it out", but
every endpoint except the public ones (`/api/v1/public/accounts`,
`/api/v1/distributions`, `/api/v1/taxa`, the HelloAsso webhook) requires a
Bearer token. That token has to be a real JWT issued by Hanko — the backend
verifies it against Hanko's live JWKS
(`http://hanko:8000/.well-known/jwks.json`), so nothing can be hand-signed or
faked against the running stack (the test suite's `Repousse.AuthHelper` can
only do that because it swaps in its own throwaway JWKS inside the test
process).

## 1. Make sure you're hitting the right server

The Servers dropdown at the top of Swagger UI must read `http://api.localhost`
(no `https`, no bare `localhost`). If it doesn't, "Try it out" will fail with
a network error even with a valid token.

This is controlled by `PHX_HOST` / `PHX_URL_SCHEME` / `PHX_URL_PORT` in
`docker-compose.yml`'s `backend` service — it feeds
`Server.from_endpoint/1` in `RepousseWeb.ApiSpec`. If you ever see the wrong
host/scheme here after touching endpoint config, rebuild the backend image
(`docker compose build backend && docker compose up -d backend`); these are
runtime env vars but Phoenix reads them once at boot.

## 2. Register (or log in) through the real webapp UI

There is no working curl-scriptable shortcut for this — Hanko's Flow API
(`POST /login?action=...`) is a CSRF-protected state machine, and scripting it
by hand is exactly the pain the project's `docs/hanko-v2-migration.md` already
warns about. Driving the actual widget is faster and is what the app does
anyway.

1. Go to `http://www.localhost/auth/v2/login`.
2. Click **S'inscrire** (Register) under the email field — this switches the
   widget into signup mode. (The `/auth/v2/register` *page* is currently a
   disconnected UI mockup that only toasts your input; don't use it. The
   `hanko-auth` widget embedded on the **login** page is the real thing and
   handles both login and signup.)
3. Enter an email address (anything — no verification of the domain, only of
   your inbox access) and click **Continuer**.
4. Hanko emails a 6-digit access code. Locally it goes through Mailpit, not a
   real inbox — open `http://mail.localhost` (or `http://localhost:8025`) and
   read the code from the latest message, or fetch it without leaving the
   terminal:
   ```bash
   curl -s "http://localhost:8025/api/v1/messages?limit=1" | \
     python3 -c "import json,sys; print(json.load(sys.stdin)['messages'][0]['ID'])" | \
     xargs -I{} curl -s "http://localhost:8025/api/v1/message/{}" | \
     python3 -c "import json,sys,re; print(re.search(r'(\d{6})', json.load(sys.stdin)['Text'])[1])"
   ```
5. Enter the code in the 6 boxes.
6. You'll be asked to set a password ("Doit contenir entre 8 et 72
   caractères.") — set one, doesn't matter what for local testing.
7. You'll land on "Créer une clé d'identification" (passkey setup) — click
   **Passer** (Skip). This screen can reappear once; click **Passer** again
   if so.
8. You're now redirected into the app (`/dashboard/...`), fully authenticated.

## 3. Grab the token

The session lives in a cookie named `hanko` (domain `www.localhost`,
`httpOnly: false` by design — see `hanko/config.yaml`'s `session.cookie`
block — so it's readable from JS/DevTools, not just sent automatically).

In DevTools: **Application → Cookies → `http://www.localhost`** → copy the
`hanko` cookie's value. That value *is* the JWT — no "Bearer " prefix, no
further decoding needed.

## 4. Authorize in Swagger UI

1. Open `http://api.localhost/api/v1/swaggerui` (rebuilt image only —
   see `README.md` / this backend's `config/prod.exs` for why `/swaggerui`
   needs `dev_routes: true` there too).
2. Click **Authorize** (top right).
3. Paste the raw token into the `bearerAuth` value field, click **Authorize**,
   then **Close**.
4. Expand any protected endpoint (e.g. `GET /api/v1/me`), **Try it out**,
   **Execute**. You should get your freshly-registered user back.

Tokens expire after `session.lifespan` (`1h` in `hanko/config.yaml`) — just
repeat steps 2–3 above with a fresh cookie value when it stops working, no
need to re-register.

## Known gaps this surfaced

- **`/auth/v2/register` is a non-functional mockup** — it renders a form but
  only shows a "you submitted" toast; it never calls Hanko. Only the login
  page's embedded widget actually drives registration. Worth fixing or
  removing before this gets confused for the real flow.
- **Real Hanko JWTs nest `email` as an object** —
  `{"address": "...", "is_primary": true, "is_verified": true}` — not a plain
  string. `RepousseWeb.Plugs.LoadCurrentUserPlug` assumed a flat string and
  500'd (`Ecto.Changeset` cast error) on every real login until this was
  fixed; `Repousse.AuthHelper` (used by the test suite) was updated to match
  the same shape so the tests actually reflect reality.
