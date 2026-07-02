# Repousse — Agent orientation

Plant association management platform. Phoenix API + Next.js frontend.

## Directory layout

```
backend/    Phoenix 1.8.8 API-only (Elixir 1.20.2)
webapp/     Next.js 16 — ACTIVE FRONTEND
frontend/   DEPRECATED — do not modify
docs/       Roadmap epics (epic-01 to epic-06) + Starlight site
```

## Frontend: always use `webapp/`

`frontend/` is archived. All new UI work goes in `webapp/`.

Key files in `webapp/src/`:
- `navigation/sidebar/sidebar-items.ts` — sidebar nav groups & items
- `app/(main)/dashboard/<slug>/page.tsx` — dashboard pages
- `app/(main)/dashboard/<slug>/_components/` — co-located components + data mocks
- `components/ui/chart.tsx` — shadcn ChartContainer / ChartTooltip / ChartLegend
- `styles/presets/repousse.css` — Repousse green theme (--chart-1…5 palette)

## Dashboard conventions

Page wrapper: `<div className="@container/main flex flex-col gap-6">`.
Data: co-located `_components/data.ts` with typed mock arrays.
Charts: shadcn `ChartContainer` + recharts v3 primitives. Color tokens `var(--chart-1)` → `var(--chart-5)`.
Map pages: `maplibre-gl` + `"use client"` + `dynamic(..., { ssr: false })`.

## Sidebar nav structure

Group 1 — "Tableau de bord": Vie associative · CRM · Carte  
Group 2 — "Coordination": Calendar · Tasks · Roles  
Group 3 — "Administration": Adhérents · Espèces végétales · Distributions · Projets · Automatisations  

## Backend conventions

- All PKs: binary_id (UUID)
- Auth: Hanko JWT → JwksCache GenServer → AuthPlug
- Jobs: Oban (queues: default 10, helloasso 2, email 5)
- CORS: CorsPlug, configured in config.exs

## Epics reference

- EP-01 Distributions · EP-02 Auth · EP-03 Profils · EP-04 Projets plantation
- EP-05 Taxons · EP-06 Tableau de bord (dashboards)

See `docs/roadmap/epic-0N-*.md` for user stories and acceptance criteria.
