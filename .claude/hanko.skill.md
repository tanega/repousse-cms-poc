# Hanko Auth — Project Skill Reference

Self-hosted Hanko (`ghcr.io/teamhanko/hanko:latest`) via Docker Compose.
Public API: `:8000`, Admin API: `:8001`.
Frontend env var: `NEXT_PUBLIC_HANKO_API_URL=http://localhost:8000`.
Backend env var: `HANKO_API_URL=http://hanko:8000` (internal Docker network).

---

## Architecture

```
Browser
  ├── <hanko-auth /> web component  →  Hanko :8000  (login / register)
  ├── Cookie "hanko" (JWT, httpOnly, SameSite=Lax)
  ├── Next.js middleware  →  verifies JWT via JWKS
  └── API calls to Phoenix :4000  →  Bearer <jwt>

Phoenix
  ├── AuthPlug  →  verify JWT with JwksCache (ETS, 5 min TTL)
  └── LoadCurrentUserPlug  →  find_or_create user by hanko_id (sub claim)
```

---

## Hanko Config (`hanko/config.yaml`)

```yaml
server:
  public:  { address: ":8000", cors: { allow_origins: ["http://localhost:3000"], allow_credentials: true } }
  admin:   { address: ":8001" }

webauthn:
  relying_party: { id: "localhost", display_name: "Repousse", origins: ["http://localhost:3000"] }

session:
  lifespan: "1h"
  enable_auth_token_header: true   # also sends token as X-Auth-Token header
  cookie: { http_only: true, same_site: "lax", secure: false }  # secure: true in prod

password:  { enabled: true, min_length: 8 }
passcode:  { ttl: 120 }

secrets:
  keys: ["<32-char-secret>"]   # rotate via array; first key used to sign
```

**Production checklist:**
- `secure: true` on cookie
- `allow_origins` → real domain
- `relying_party.id` + `origins` → real domain
- `webauthn.relying_party.origins` must include protocol+host (no trailing slash)
- Custom domain in Hanko Cloud (if Cloud) fixes 3rd-party OAuth + cookie scoping

---

## Frontend (`@teamhanko/hanko-elements`)

### Installation
```bash
npm install @teamhanko/hanko-elements @teamhanko/hanko-frontend-sdk
```

### Register components (client component)
```tsx
"use client";
import { register } from "@teamhanko/hanko-elements";
const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL!;

useEffect(() => { register(HANKO_API_URL).catch(console.error); }, []);
```

### Web components
```tsx
<hanko-auth />         {/* combined login + registration */}
<hanko-login />        {/* login only */}
<hanko-registration /> {/* registration only */}
<hanko-profile />      {/* credential management */}
```

TypeScript — add to `src/custom.d.ts`:
```ts
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "hanko-auth": HankoAuthElementProps;
      "hanko-profile": HankoProfileElementProps;
      "hanko-events": HankoEventsElementProps;
    }
  }
}
```

### Events
```ts
// DOM event (used in this project)
document.addEventListener("hankoAuthSuccess", handler);

// SDK event
import { Hanko } from "@teamhanko/hanko-frontend-sdk";
const hanko = new Hanko(HANKO_API_URL);
hanko.onSessionCreated(() => router.push("/dashboard"));
```

### Register options
```ts
register(url, {
  shadow: true,                    // default true — shadow DOM
  injectStyles: true,              // default true
  enablePasskeys: true,            // default true
  sessionCheckInterval: 3000,      // ms minimum
  sessionTokenLocation: "cookie",  // "cookie" | "sessionStorage"
  cookieDomain: "example.com",
  cookieSameSite: "lax",
  fallbackLanguage: "fr",
});
```

### Frontend SDK (`@teamhanko/hanko-frontend-sdk`)
```ts
import { Hanko } from "@teamhanko/hanko-frontend-sdk";
const hanko = new Hanko(HANKO_API_URL);

// Current user
const user = await hanko.user.getCurrent();
// { id, email, ... }

// Logout
await hanko.user.logout();
```

### Logout pattern (this project)
```ts
// lib/auth.ts
export async function logout() {
  const hanko = getHanko();
  await hanko.user.logout();
}
```

---

## Next.js Middleware (JWT via JWKS)

Cookie name: `hanko` — contains a signed JWT (RS256).

```ts
// middleware.ts
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`${HANKO_API_URL}/.well-known/jwks.json`)
);

const token = request.cookies.get("hanko")?.value;
await jwtVerify(token, JWKS);  // throws on invalid/expired
```

JWKS endpoint: `GET {HANKO_API_URL}/.well-known/jwks.json`

Public paths in this project: `["/", "/auth/login", "/auth/register", "/api/webhooks"]`

Matcher (excludes Next.js internals):
```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
```

---

## Phoenix/Elixir — JWT Validation

### Flow
1. Frontend sends `Authorization: Bearer <jwt>` on all API calls
2. `AuthPlug` extracts token, calls `JwksCache.get_keys/0`, verifies via `Joken`
3. On success: `conn.assigns.hanko_claims` = `%{"sub" => hanko_user_id, "exp" => ..., "email" => ...}`
4. `LoadCurrentUserPlug` finds or creates `Repousse.Accounts.User` by `hanko_id`
5. `conn.assigns.current_user` available in controllers

### JWT claims
```elixir
%{
  "sub" => "uuid-string",    # Hanko user ID — used as hanko_id FK
  "email" => "user@ex.com",  # present on first login
  "exp" => 1234567890,       # unix timestamp
  "iss" => "http://localhost:8000"
}
```

### JwksCache (`Repousse.Auth.JwksCache`)
- GenServer, ETS table `:hanko_jwks`
- Refreshes every 5 min
- Config: `Application.get_env(:repousse, :hanko)[:jwks_url]`
  → should be `http://hanko:8000/.well-known/jwks.json` (internal Docker URL)
- Start in `application.ex` supervision tree

### Router pipeline
```elixir
pipeline :authenticated do
  plug RepousseWeb.Plugs.AuthPlug
  plug RepousseWeb.Plugs.LoadCurrentUserPlug
end

pipeline :admin do
  plug RepousseWeb.Plugs.RequireRolePlug, role: :admin
end
```

### Alternative: POST /sessions/validate (simpler, no JWT lib)
```elixir
# Not used in this project but available:
Req.post("#{hanko_url}/sessions/validate",
  json: %{session_token: token}
)
# Response: %{"is_valid" => true, "user_id" => "..."}
```

---

## Hanko Admin API (`:8001`)

No auth required from same network (internal only — never expose to internet).

### Key endpoints
```
GET    /users                    # list users (supports ?email=, ?page=, ?per_page=)
POST   /users                    # create user
GET    /users/:id                # get user by Hanko ID
DELETE /users/:id                # delete user
PATCH  /users/:id                # update user

GET    /users/:id/credentials    # list credentials (passkeys, passwords, OTPs)
DELETE /users/:id/credentials/:cred_id

GET    /users/:id/emails         # list emails
POST   /users/:id/emails         # add email
DELETE /users/:id/emails/:email_id
POST   /users/:id/emails/:email_id/set_primary

GET    /users/:id/sessions       # active sessions
DELETE /users/:id/sessions/:session_id  # revoke session

GET    /audit_logs               # audit trail
GET    /webhooks                 # list configured webhooks
POST   /webhooks                 # create webhook
```

Usage from Elixir (internal Docker network):
```elixir
base = Application.get_env(:repousse, :hanko)[:admin_url]
# e.g. http://hanko:8001

Req.get("#{base}/users/#{hanko_id}")
Req.delete("#{base}/users/#{hanko_id}")
```

---

## Webhooks

Requires Pro/Enterprise plan on Hanko Cloud. Self-hosted: configure in `config.yaml`.

### Payload structure
```json
{
  "event": "user.login",
  "token": "<JWT — decode to get data>"
}
```

JWT payload (after decode + JWKS verify):
```json
{
  "sub": "hanko webhooks",
  "evt": "user.login",
  "data": { /* full user object */ },
  "iat": 1234567890,
  "exp": 1234567890,
  "aud": ["..."]
}
```

### Event types
```
user.create               # new registration
user.delete               # account deleted
user.login                # authentication event
user.update.email.create  # email added
user.update.email.delete  # email removed
user.update.email.primary # primary email changed
user.update.password.update
user.update.username.create / .delete / .update
```

### Verification (Phoenix)
```elixir
# 1. Fetch JWKS from {HANKO_API_URL}/.well-known/jwks.json
# 2. Verify token with JWKS (same JwksCache can be reused)
# 3. Decode payload → extract data.evt + data.data
# 4. Return 200 within 30 seconds
```

---

## Passkey API (separate product — not used in this project)

Use only if adding passkeys to an *existing* auth system (not replacing it).
This project uses full Hanko (auth + user management), so Passkey API is not relevant.

If ever needed:
- Hanko Cloud → create "Passkey API" project type
- Two endpoint tiers: frontend (no secret) for login, backend (secret key) for registration
- JS SDK: `@teamhanko/passkeys-sdk`

---

## Common Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| Cookie not sent to Phoenix | `Authorization: Bearer` not set | Frontend must read cookie and send as header |
| JWKS fetch fails | Wrong URL in JwksCache config | Use Docker-internal URL `http://hanko:8000` not `localhost` |
| WebAuthn fails locally | `relying_party.id` mismatch | Must match origin hostname exactly |
| Session not created event | Using wrong event name | DOM: `hankoAuthSuccess`, SDK: `onSessionCreated` |
| CORS error on login | Missing `allow_credentials: true` | Set in `hanko/config.yaml` + Phoenix CORSPlug |
| Token expired (1h) | Default lifespan | Extend in config or implement refresh |
| Admin API 404 | Wrong port | Admin is `:8001`, Public is `:8000` |
| Passkey not offered | `enablePasskeys: false` | Remove option or set to `true` |

---

## Relevant Files (this project)

| File | Purpose |
|------|---------|
| `hanko/config.yaml` | Hanko server config |
| `docker-compose.yml` | Hanko service + env vars |
| `frontend/src/middleware.ts` | Next.js route protection (JWKS verify) |
| `frontend/src/lib/auth.ts` | Hanko SDK singleton + logout |
| `frontend/src/app/(main)/auth/login/page.tsx` | `<hanko-auth />` component + post-login redirect |
| `backend/lib/repousse/auth/jwks_cache.ex` | ETS-cached JWKS keys, 5 min refresh |
| `backend/lib/repousse_web/plugs/auth_plug.ex` | JWT verification via Joken |
| `backend/lib/repousse_web/plugs/load_current_user_plug.ex` | Hanko ID → DB user |
| `backend/lib/repousse_web/router.ex` | Pipeline composition |
