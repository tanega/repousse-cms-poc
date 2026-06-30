# Repousse — Platform

Plateforme de gestion des distributions végétales et des projets de plantation pour l'association Repousse.

**Stack:** Phoenix 1.8 (Elixir) · Next.js 15 · PostgreSQL 16 · Hanko (passwordless auth) · Docker Compose

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.x+
- [Elixir](https://elixir-lang.org/install.html) 1.17+ (for local dev only)
- [Node.js](https://nodejs.org/) 22+ (for local dev only)
- `make`

---

## Installation

### 1. Clone and enter the project

```sh
git clone <repo-url>
cd repousse-poc-cms
```

### 2. First-time setup

```sh
make setup
```

This command:
- Fetches Elixir dependencies (`mix deps.get`)
- Installs Node.js dependencies (`npm install`)
- Creates `.env` from `.env.example`
- Starts PostgreSQL via Docker
- Creates `repousse_dev` and `hanko` databases
- Runs all 19 Ecto migrations
- Runs Hanko schema migrations (48 tables)

### 3. Configure environment

Open `.env` and set the required values:

```env
# Already generated during setup:
SECRET_KEY_BASE=<generated>

# Leave as-is for local dev:
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=repousse_dev
NEXT_PUBLIC_HANKO_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000

# Optional — for HelloAsso sync:
HELLOASSO_API_URL=
HELLOASSO_API_KEY=
```

> `SECRET_KEY_BASE` is auto-generated on first `make setup`. You can also generate one manually: `cd backend && mix phx.gen.secret`

---

## Getting Started

### Start the full stack

```sh
make dev
```

Starts 5 Docker services:

| Service    | URL                       | Role                          |
|------------|---------------------------|-------------------------------|
| Frontend   | http://localhost:3000     | Next.js app                   |
| Backend    | http://localhost:4000     | Phoenix JSON API              |
| Hanko      | http://localhost:8000     | Passwordless auth server      |
| PostgreSQL | localhost:5432            | Primary database              |
| Redis      | localhost:6379            | Cache / Oban job queue        |

### Stop

```sh
make stop
```

### Full reset (wipes database)

```sh
make reset
```

---

## Architecture

```
repousse-poc-cms/
├── backend/          # Phoenix 1.8 API (Elixir)
│   ├── lib/repousse/
│   │   ├── accounts/     # Users, profiles, membership
│   │   ├── distributions/ # Events, slots, stocks, reservations
│   │   ├── projects/     # Planting projects, journal, media
│   │   ├── taxa/         # Taxon catalogue, versions
│   │   └── integrations/ # HelloAsso sync (Oban worker)
│   └── lib/repousse_web/
│       ├── controllers/  # JSON API controllers
│       └── plugs/        # Auth (Hanko JWT), role checks
├── frontend/         # Next.js 15 app
│   └── src/
│       ├── app/
│       │   ├── (external)/   # Public pages (landing)
│       │   └── (main)/       # Authenticated app
│       │       ├── auth/login/
│       │       └── dashboard/
│       ├── lib/      # api.ts, auth.ts, utils.ts
│       ├── providers/ # React Query + theme
│       └── types/    # TypeScript types
├── docs/
│   ├── roadmap/      # Epic specifications (Markdown)
│   └── site/         # Starlight documentation site
├── hanko/            # Hanko auth configuration
├── postgres/         # PostgreSQL init scripts
└── docker-compose.yml
```

## Authentication flow

1. User visits `/auth/login` → sees the Hanko auth widget (passkey / passcode / magic link)
2. On success, Hanko sets a `hanko` JWT cookie
3. Next.js middleware (`src/middleware.ts`) validates the JWT against Hanko's JWKS on every protected route
4. Phoenix API validates the same JWT via `AuthPlug` → resolves the user via `LoadCurrentUserPlug`

Users are provisioned in the application database on first login via `Accounts.find_or_create_by_hanko_id!/2`.

---

## API

Base URL: `http://localhost:4000/api/v1`

All routes require `Authorization: Bearer <hanko-jwt>` except webhooks.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user |
| GET | `/distributions` | List published distributions |
| POST | `/distributions/:id/reservations` | Create reservation |
| GET | `/projects` | List projects (member's own) |
| POST | `/projects` | Create project |
| GET | `/taxa` | List taxa (with `?q=` search) |
| GET | `/dashboard/indicators` | Aggregated KPIs |
| GET | `/dashboard/map/projects` | Project locations |
| POST | `/webhooks/helloasso` | HelloAsso webhook (no auth) |

Admin routes are under `/api/v1/admin/*` and require the `admin` profile type.

---

## Development

### Backend only (without Docker)

```sh
# Requires local PostgreSQL running on localhost:5432
make deps
cd backend && mix phx.server
```

### Frontend only (without Docker)

```sh
cd frontend
cp .env.local.example .env.local
npm run dev   # http://localhost:3000 with Turbopack
```

### Create the first superadmin

Run this after `make dev` (Hanko and postgres must be up):

```sh
make create-admin EMAIL=you@example.com
```

This calls the Hanko Admin API (:8001) to provision the user, then assigns the `admin` profile type in the Repousse DB. Safe to run multiple times — idempotent.

### Run backend tests

```sh
make test
```

### Format & lint

```sh
make format   # mix format + biome format
make lint     # biome check
```

### Run migrations manually

```sh
make migrate
```

---

## Docs site

The Starlight documentation site (epics, roadmap) lives in `docs/site/`:

```sh
cd docs/site
npm install
npm run dev   # http://localhost:4321
```
