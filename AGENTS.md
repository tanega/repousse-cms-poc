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

## TanStack DB (client-side reactive store)

Explored on `feat-frontend-tanstackdb`, applied first to the Espèces végétales
admin page (`webapp/src/app/(main)/admin/especes-vegetales/`). Packages:
`@tanstack/react-db`, `@tanstack/db`, `@tanstack/query-db-collection`,
`@tanstack/query-core`.

Two non-obvious gotchas if you extend this pattern to another page:

- **SSR crash with `useLiveQuery`.** It's built on `useSyncExternalStore`
  without a server snapshot, so any page tree that calls it 500s during SSR
  ("Missing getServerSnapshot..."). Fix: split the route into a thin
  `page.tsx` (parses params, no TanStack DB calls) plus a `*-view.tsx` client
  component holding the actual `useLiveQuery` logic, dynamically imported with
  `next/dynamic(() => import(...), { ssr: false })` — same pattern already
  used for the maplibre map on the Carte page. Next's App Router disallows
  `ssr: false` from a Server Component, so the file doing the `dynamic()`
  call must itself be `"use client"` (see `[especeId]/page.tsx`).
- **Collection type matters when there's no backend yet.**
  `queryCollectionOptions` treats its `queryFn` as the ultimate source of
  truth: optimistic insert/update/delete get silently dropped whenever the
  collection's sync pauses and resumes (e.g. across route navigation),
  because nothing ever "confirms" them server-side. For a mock/demo phase
  with no real API, use `localOnlyCollectionOptions` instead — its loopback
  sync makes optimistic writes permanent. Swap to `queryCollectionOptions` +
  real `fetch`/`onInsert`/`onUpdate`/`onDelete` once the backend REST
  endpoint for a resource actually exists (`collection.ts` per feature is the
  only file that needs to change — `useLiveQuery`/insert/update/delete calls
  in consumers stay the same).

## E2E testing (Playwright)

`webapp/playwright.config.ts` + `webapp/e2e/*.spec.ts`, run with
`npm run test:e2e` from `webapp/` (auto-starts `next dev` if not already
running). `middleware.ts` only checks that a `hanko` cookie is *present*, not
that it's a valid JWT, so specs set a dummy cookie value to get past the
`/auth/v2/login` redirect — see the `beforeEach` in
`especes-vegetales.spec.ts`.

<!-- gitbutler-agent-setup:start -->
## Version control

- Use GitButler (`but`) for version-control inspection and write operations, including status, diffs, branching, committing, pushing, and history edits.
- Assume multiple agents may be working in this repository. Do not move, amend, squash, discard, commit, push, or otherwise modify another agent's work unless the user asks.
- For commit just/only/specific changes on a new branch (selected-change requests), use the two-command fast path from the GitButler skill: `but diff`, then `but commit <branch> -c -m "message" --changes <id>,<id>`.
- For that fast path, after the commit succeeds, stop and summarize; do not run separate branch, staging, status, or diff commands unless the commit output is missing information you need.
- Use the installed GitButler skill for command recipes and syntax before guessing flags, using `--help`, or translating Git habits directly.
- After a successful GitButler write command, use the workspace state it returns. Rerun status or diff only when that output lacks information you need or files changed since.
- Use a dedicated GitButler branch for each agent session, unless the user asks for a different branch structure. Commit only changes that belong to that session.
- Do not push or open pull requests unless the user asks.
- Keep commit messages and pull request descriptions succinct: explain what changed, why it changed, and any important decision.

### Amend local fixes into the right commits

- For small cleanup or follow-up fixes, amend an unpublished local commit when the change clearly belongs with that commit's intent.
- Do not create tiny fixup commits unless the user asks.
- Use GitButler to move the relevant changes into the commit where they belong.
- Ask before rewriting pushed, reviewed, shared, or ambiguous history.

### Split unrelated changes into separate commits

- If one file contains unrelated changes, split them by hunk instead of committing the whole file.
- Keep tests with the behavior they verify.
- Split generated output, docs-only edits, or mechanical cleanup into separate commits when each commit remains coherent on its own.
- If the split is ambiguous, summarize the options before committing.

### Create stacked pull requests

- If this session depends on another in-flight branch, stack its branch on top of that dependency instead of mixing the changes.
- If this session is working in a stack, put commits on the branch where they belong.
- Ask before moving commits onto lower, pushed, reviewed, or shared branches.
- Use `but move` for branch stacking and restacking. Do not recreate branches to simulate stacking.
- For stacked branches, create pull requests with `but pr`, not `gh`, so GitButler keeps the right PR base branches and stack metadata.

### Update from the target branch automatically

- When GitButler status shows new changes on the target branch, run `but pull --check`.
- If the check is clean and the update affects only this session's branches, update the workspace with `but pull`.
- If the check reports conflicts or the update would affect another agent's branch, ask before updating.
- If the user asks you to handle update conflicts, use GitButler's conflict tools. Ask before resolving semantic conflicts, dependency updates, generated files, or conflicts involving another person's work.

### Publish on a shortcut phrase

- When the user says `ship it`, commit this session's changes on its dedicated GitButler branch, creating one if needed.
- Push the branch and open or update its pull request with GitButler.
- Reuse the existing branch or pull request for this session when one already exists.
- Treat this phrase as approval to commit, push, and open or update a pull request without asking again, unless something risky or surprising changed.

### Branch naming

- When creating a GitButler branch for an agent session, use `<scope>-<short-description>'`.

### Commit message convention

- Follow the `type(scope): summary` commit-message convention when writing commit messages.

### Commit checkpoints after each turn

- Commit after a working checkpoint, when the requested change is complete and relevant checks have passed or been reported.
- Treat checkpoint commits as local savepoints, not final review history.
- When the user asks you to tidy the history, use GitButler to squash commits, reword commits, and move changes between commits where appropriate.
- Only tidy unpublished local history unless the user explicitly authorizes changing pushed or shared history.
<!-- gitbutler-agent-setup:end -->
