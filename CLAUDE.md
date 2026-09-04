# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit 2 dashboard application with draggable widgets (weather, traffic, calendar, GitHub repos/PRs, GA4 analytics, Cloudflare). Deployed to Cloudflare Pages using `@sveltejs/adapter-cloudflare`. Authentication via Auth.js with GitHub OAuth.

## Commands

```bash
npm run dev          # Start dev server on port 4200 (0.0.0.0:4200)
npm run dev:tunnel   # Dev server + Cloudflare tunnel at dev-dashboard-<hash>.starspace.group
npm run build        # Production build
npm run preview      # Preview production build on port 4200
npm run check        # Run svelte-kit sync + svelte-check
npm run lint         # Run ESLint
```

### Dev tunnel
`scripts/dev-tunnel.sh` provisions a named Cloudflare tunnel + proxied CNAME on
first run (hash is stable per machine+checkout, so the URL persists). DNS is
created via the Cloudflare API using `~/.cloudflared/dns-edit-token` — NOT
`cloudflared tunnel route dns`, which infers the zone from the local origin
cert and lands in the wrong zone. Vite allows the tunnel Host via
`server.allowedHosts` in `vite.config.ts`. GitHub sign-in through the tunnel
requires a dev OAuth app whose callback is
`https://dev-dashboard-<hash>.starspace.group/auth/callback/github`.

## Architecture

### Widget System
- **Store**: `src/lib/stores/widgets.ts` - Manages widget state with localStorage persistence
- **Types**: `src/lib/types/widget.ts` - Widget and Section interfaces
- **Layout**: `src/lib/components/ColumnLayout.svelte` - Grid-based layout with draggable sections
- Widgets have `type`, `section` (which column), `order` (position within section), and optional `config`
- Sections define a flexible grid layout (1-4 columns, spanning supported)
- Widget positions are stored per-layout fingerprint to remember arrangements
- Grid width is `GRID_COLUMNS` in the widgets store — the packer, the resize
  clamp and `ColumnLayout` all read it. Don't hardcode a column count; the two
  places that did disagreed with the layout and stranded every column-4 section
  in one cell.

### GitHub pull requests
`+page.server.ts` runs four PR searches per (cache-missing) load: assigned,
authored, review-requested, and **one** query covering every org — repeated
`org:` qualifiers are OR'd by GitHub search, so N orgs cost one request, not N.
The search API allows 30/min and a dashboard load already spends several, so
keep it that way; the org list is capped at `MAX_ORGS_IN_PR_QUERY` because the
query string has a length limit.

All filtering in `GithubPullRequestsWidget` is client-side over that preloaded
set — scope, owner, repo, author, draft state, free text, sort, page size. That
keeps filtering instant and free, at the cost of only seeing what was fetched.
Filter choices live in `widget.config.pullRequests`, so they survive reload and
sync across devices; the write is debounced because the search box fires on
every keystroke. Dropdown options are derived from the PRs actually in scope,
and a filter that no longer matches anything in a newly-chosen scope is cleared
rather than silently emptying the list.

### Authentication
- `src/hooks.server.ts` - SvelteKitAuth configuration with GitHub provider
- Session includes `accessToken` and GitHub `login` username
- Scopes: `read:user user:email read:org repo read:project manage_billing:copilot`

### API Routes
- `/api/weather` - Weather data from Open-Meteo with server-side caching (`src/lib/server/weatherCache.ts`)
- `/api/geocode` - Location geocoding
- `/api/maps-config` - Google Maps configuration
- `/api/dashboard-state` - GET/PUT per-user dashboard state (Cloudflare KV, `DASHBOARD_KV` binding). PUT rejects snapshots over 512 KB (413), returns `{ ok: false, conflict: true }` when the stored state is newer, and `{ ok: true, unchanged: true }` without writing when the incoming state is byte-identical — the conflict check already reads the existing value, so the comparison is free and it catches the redundant pushes a per-tab client guard can't
- `/api/analytics` - GA4 reports proxy; returns `{ code: 'reconnect_required' }` with 401 when the Google refresh token is dead (widget shows a Reconnect button)
- `/api/cloudflare` - Cloudflare API proxy (`?action=verify|accounts|overview|zones|zone-analytics|pages|workers|kv|r2|d1|queues|security|web-analytics|durable-objects`). Auth is a user-supplied, read-only Cloudflare **API token** (no server-side OAuth app / no env var needed) passed in the POST body and forwarded as a Bearer credential; tokens don't expire, so the connection persists until revoked. The widget's connect screen deep-links to Cloudflare's Create-Token page with `permissionGroupKeys` pre-filled (`account_analytics`, `analytics`, `zone`, `page` [Pages], `workers_scripts`, `workers_kv_storage`, `workers_r2`, `d1`, `queues`, `waf` [firewall/WAF events], `rum` [Web Analytics]) + `accountId=*&zoneId=all` — one click, no manual scope picking. REST for accounts/zones/pages/workers-scripts/KV-namespaces/R2-buckets/D1-databases/queues/RUM-sites; the GraphQL Analytics API for stats (`httpRequests1dGroups` + `httpRequestsAdaptiveGroups` [status codes/countries/cache], `workersInvocationsAdaptive`, `kvOperationsAdaptiveGroups`, `kvStorageAdaptiveGroups`, `r2OperationsAdaptiveGroups`, `r2StorageAdaptiveGroups`, `d1AnalyticsAdaptiveGroups`, `firewallEventsAdaptiveGroups`, `queueBacklogAdaptiveGroups`, `rumPageloadEventsAdaptiveGroups`/`rumPerformanceEventsAdaptiveGroups`, `durableObjects*AdaptiveGroups`). **Usage endpoints return raw "current window" numbers** (today for daily limits, month-to-date for monthly, snapshot for storage); the client turns these into limit meters via `src/lib/cloudflare/limits.ts` (`FREE_LIMITS`/`PAID_LIMITS` + `computeMeter` run-rate projection), so the Free/Paid toggle is client-side with no server round-trip. In-memory 5-min response cache scoped by token suffix. Returns `{ code: 'reconnect_required' }` with 401 on 401/403 or auth error codes (1000/9109/10000), which flips the widget to its Connect screen. Every analytics/list call is best-effort (isolated try/catch), so an under-scoped token still shows what it can — including graceful empty states for Durable Objects (Workers-Paid only), Web Analytics (no RUM sites) and WAF events (`firewallEventsAdaptiveGroups` is zone-plan gated: free zones answer "does not have access to the path").
  - ⚠️ **GraphQL gotchas that silently look like missing token scopes** (see `planning/cloudflare-graphql-dimensions-bug.md`):
    1. `dimensions` is a **selection field, not an argument**. `foo(filter: {...}, dimensions: { date, actionType })` is a *syntax error* — group by selecting `dimensions { date actionType }` in the body. Cloudflare's GraphQL schema is also permission-scoped, so a genuinely under-scoped token fails the same way (unknown field), which is why failures must never be reported to the user as "add Account Analytics: Read" without checking the message — `classifyAnalyticsError()` splits `permission` / `plan` / `query` and the KV banner renders the real reason.
    2. Any field in `orderBy` must be selected in `dimensions` (`orderBy: [date_DESC]` needs `dimensions { … date }`).
    3. Aggregations differ per dataset: `queueBacklogAdaptiveGroups` exposes **`avg`** only (no `max`).
    4. Free zones cap `httpRequestsAdaptiveGroups` at a **1-day** range; `fetchZoneBreakdown` retries with a 24h window and returns `windowDays` so the client can say so.
  - Verify query changes against the live schema before shipping — the datasets are introspectable (`{ __schema { types { name } } }`, `AccountKvStorageAdaptiveGroupsDimensions`, …).

### Cross-Instance Sync
- `src/lib/stores/sync.ts` - Snapshots a fixed set of localStorage keys (widgets, sections, layouts, location, analytics connection, Cloudflare connection) and persists them to KV via `/api/dashboard-state`, keyed by the logged-in user
- Connection secrets (GA refresh token in `dashboard-analytics-connection`, Cloudflare API tokens in `dashboard-cloudflare-credentials`) live client-side and ride the same sync channel, so a connection made on one device follows the user everywhere. New connection stores must be added to `SYNCED_KEYS` and reloaded in both `applySnapshot` and `clearLocalState`.
- **Cloudflare uses a named key pool, not a single token.** `src/lib/stores/cloudflareCredentials.ts` holds `{ id, label, token }[]` (persisted to `dashboard-cloudflare-credentials`); each Cloudflare widget's `config.cloudflare.credentialId` selects which key it uses (unset → first/"Default" key for back-compat), and its `accountId` picks the account — so multiple widgets can share a key or each use a different one. Key + account are managed in `CloudflareWidgetSettings.svelte` (a standard widget-frame gear panel driven by the `cloudflareSettings` store + a global instance in `+layout.svelte`, mirroring the Weather widget), NOT an in-widget modal. The legacy single-token store `dashboard-cloudflare-connection` (`cloudflareConnection`) is kept only for one-time migration into the pool.
- Pulls on load / tab focus / 60s interval; pushes debounced (2s) after changes; last-write-wins by timestamp. Both the sync pull and the page's 5-min `invalidateAll` only run while the tab is visible — a backgrounded tab must not spend GitHub rate limit or KV writes on data nobody is looking at
- Stores dispatch a `dashboard-state-changed` window event after writing synced localStorage keys — anything that writes those keys must dispatch it
- KV binding is defined in `wrangler.toml`; `platformProxy` in `svelte.config.js` emulates it during `npm run dev` (data persisted under `.wrangler/`)
- ⚠️ **KV write budget:** this sync path (plus the GitHub cache below) makes Dashboard ~88% of the account's KV writes and the trigger for Cloudflare's "approaching KV daily operation limit" alerts — free KV allows only **1,000 writes/day**. Keep pushes coalesced/change-gated; prefer D1 for frequently-mutated per-user state. See `ROADMAP.md` → "KV write-quota pressure".

### GitHub Data Caching
- `+page.server.ts` caches the assembled GitHub payload in KV per user (fresh window 3 min, stale kept 24h)
- The KV write is skipped when the payload is unchanged, so `cached.timestamp` only advances on a *change*. A module-level `lastVerifiedAt` map supplies the fresh window in that case — without it, stable data fell outside the window on every load and re-ran the whole fan-out. Freshness = `max(cached.timestamp, lastVerifiedAt)`; anything that talks to GitHub successfully must call `markVerified()`
- On GitHub rate limiting (403/429 — the search API allows only 30 req/min and each load uses 3) or total failure, the stale cache is served instead of empty widgets
- `hooks.server.ts` dedupes concurrent OAuth token refreshes (GitHub refresh tokens are single-use) and only sets a session error once the access token is actually expired

### State Management
- `src/lib/stores/theme.ts` - Theme toggle (light/dark)
- `src/lib/stores/widgets.ts` - Widget/section state
- `src/lib/stores/commands.ts` - Command palette actions
- `src/lib/stores/weatherSettings.ts` - Weather widget configuration modal

### Global Styles
- `src/app.css` - Theme CSS custom properties, browser default overrides, form styling

## Local dev preview

`npm run dev` skips GitHub sign-in: `src/lib/server/devPreview.ts` hands out a
fake session, `devHandle.ts` answers the credential-gated APIs from
`devFixtures.ts`, and the dashboard opens on a seeded layout with one widget of
every type — **all thirteen carrying sample data**. A `DEV PREVIEW · SAMPLE DATA`
badge sits in the header the whole time.

- **Getting in:** on a loopback host the preview is just on, no click. Anywhere
  else the dev server is reachable (a LAN address, or the `npm run dev:tunnel`
  hostname) the sign-in page offers **Continue as Dev Preview** beside the GitHub
  button; it posts to `/dev-login`, which sets the `dev-preview` cookie that
  carries the fake session. Signing out sets that cookie to `off` — which beats
  the loopback default, so the real GitHub flow is one sign-out away on any host.
- ⚠️ **The host is not a gate any more.** It used to be (loopback only), so the
  tunnel always exercised real OAuth. That was traded away deliberately (David,
  2026-09-04) so the dashboard can be opened from a phone without registering a
  tunnel OAuth callback. While `dev:tunnel` is up, anyone with the URL can click
  into the sample dashboard — take the tunnel down when you're done.
- **What is faked:** the session, the GitHub payload behind the page load,
  Google Analytics, Cloudflare, and the Traffic map (a drawn stand-in, since a
  real map needs a billable Google key — a configured `GOOGLE_MAPS_API_KEY` still
  wins and you get the real map). **What is real:** weather, geocoding and crypto
  are keyless, so those widgets show live data.
- The Analytics and Cloudflare fixtures answer **only** for the placeholder
  credentials the preview seeds. Paste a real token into a widget and the request
  goes to the real provider, so the preview never hides your own data.
- Two gates keep it out of production: `dev` from `$app/environment` (false in
  any build, so the code is tree-shaken away and `/dev-login` answers 404) and
  `DEV_AUTH_BYPASS=false` to turn it off entirely. There is deliberately no way
  to enable it in a build.
- Sign-out is intercepted in `withDevPreview`, which builds its own `Response` —
  so it must write the `set-cookie` header itself via `cookies.serialize()`.
  `cookies.set()` only reaches a response that came back from `resolve()`; using
  it there makes sign-out silently do nothing.
- The seed layout arrives through the normal sync path with a fixed old
  `updatedAt`, so it lands once and your later edits win. Preview dashboard state
  lives in the dev server's memory — a restart drops back to the seed.

## Theme System (CRITICAL)

**All colors MUST use CSS custom properties. Never use hardcoded colors like `#fff`, `black`, `rgb()`, `hsl()`.**

Key variables defined in `src/app.css`:
- `--primary-color`, `--background`, `--surface`, `--surface-variant`
- `--text-primary`, `--text-secondary`, `--border`
- Status: `--success`, `--error`, `--warning`, `--info`
- Chart series: `--series-1` … `--series-8`

Dark mode: Applied via `.dark` class on root element.

### Chart colors (analytics widgets)

**Never colour a chart series by its position in a list.** Series colour is keyed
to the *data type*, via `src/lib/utils/metricColors.ts` — call
`metricColor(metricId)` and it returns the right `var(--series-N)`. That is what
keeps "Page Views" the same colour in the Analytics widget and the Cloudflare
widget, and stops a metric changing colour when the user adds or removes another
one. Adding a metric to a widget means adding it to `METRIC_DATA_TYPES` there;
the id-hash fallback is a safety net, not the design.

The eight `--series-*` steps are a validated categorical palette (fixed order,
per-mode steps, checked for colourblind separation and contrast against this
app's own surfaces). Don't add a ninth or nudge a step by eye — re-run the
`dataviz` skill's `validate_palette.js` for **both** modes first. Three of the
light-mode steps sit under 3:1, which is allowed only because every chart also
carries a legend and labelled tooltip rows, so identity is never colour-alone;
keep that relief in place.

Status colours (`--success`/`--warning`/`--error`) are reserved for state — a
meter running hot, an error rate — and are never used as a series colour. In SVG,
set series colour through `style="stroke: …"` / `style="fill: …"` /
`style="stop-color: …"`, not the bare presentation attribute.

**Colour by value only where the value has a direction.** Most metrics have no
good or bad, and those keep their fixed data-type colour. A metric everyone
already reads as better-or-worse — bounce rate — is drawn on a green-to-red ramp
mixed from `--success`/`--warning`/`--error`, via a per-point SVG gradient along
the line (`QUALITY_SCALES` in the Analytics widget). A line that spends its
colour this way can no longer use colour to say *which* metric it is, so it is
drawn heavier and its legend entry shows the ramp instead of a dot; the value is
always in the tooltip, so the judgement is never colour-alone.

**One set of axes means one scale.** Never normalise each series to its own
min/max and draw them together — the lines stop being comparable and only the
one the axis is labelled for can be read at all. Series of different magnitude
or unit go on a shared indexed axis (each series as a % of its own period
average, with a 100% rule), and the absolute numbers live in the tooltip and the
stat cards. The Analytics widget does this; it's the pattern to copy.

**Autofill handling is critical** - use `-webkit-box-shadow` inset trick to prevent white flash:
```css
input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px var(--surface) inset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
}
```

## Environment Variables

Required in `.env` (see `.env.example`):
- `GITHUB_ID`, `GITHUB_SECRET` - GitHub OAuth app credentials
- `AUTH_SECRET` - Auth.js secret (generate with `openssl rand -base64 32`)
- `AUTH_TRUST_HOST=true` - Required for local dev
- `GOOGLE_MAPS_API_KEY` - For Traffic Widget (optional)

## Svelte Component Structure

```svelte
<script lang="ts">
  // 1. Imports (Svelte/SvelteKit → third-party → local → stores → types → utils)
  // 2. Props (export let)
  // 3. Stores
  // 4. State variables
  // 5. Reactive statements ($:)
  // 6. Functions
  // 7. Lifecycle hooks
</script>

<!-- Template -->

<style>
  /* Scoped styles - use CSS variables for colors */
</style>
```

## Deployment

Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `.svelte-kit/cloudflare`
- Set environment variables in Cloudflare Pages settings
- KV namespace `DASHBOARD_KV` (id in `wrangler.toml`, account "David Monaghan") powers per-user state sync and GitHub data caching; the app degrades gracefully to localStorage-only if the binding is missing
