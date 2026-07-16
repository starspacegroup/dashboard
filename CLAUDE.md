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

### Authentication
- `src/hooks.server.ts` - SvelteKitAuth configuration with GitHub provider
- Session includes `accessToken` and GitHub `login` username
- Scopes: `read:user user:email read:org repo read:project manage_billing:copilot`

### API Routes
- `/api/weather` - Weather data from Open-Meteo with server-side caching (`src/lib/server/weatherCache.ts`)
- `/api/geocode` - Location geocoding
- `/api/maps-config` - Google Maps configuration
- `/api/dashboard-state` - GET/PUT per-user dashboard state (Cloudflare KV, `DASHBOARD_KV` binding)
- `/api/analytics` - GA4 reports proxy; returns `{ code: 'reconnect_required' }` with 401 when the Google refresh token is dead (widget shows a Reconnect button)
- `/api/cloudflare` - Cloudflare API proxy (`?action=verify|accounts|overview|zones|zone-analytics|pages|workers|kv|r2|d1|queues|security|web-analytics|durable-objects`). Auth is a user-supplied, read-only Cloudflare **API token** (no server-side OAuth app / no env var needed) passed in the POST body and forwarded as a Bearer credential; tokens don't expire, so the connection persists until revoked. The widget's connect screen deep-links to Cloudflare's Create-Token page with `permissionGroupKeys` pre-filled (`account_analytics`, `analytics`, `zone`, `page` [Pages], `workers_scripts`, `workers_kv_storage`, `workers_r2`, `d1`, `queues`, `waf` [firewall/WAF events], `rum` [Web Analytics]) + `accountId=*&zoneId=all` — one click, no manual scope picking. REST for accounts/zones/pages/workers-scripts/KV-namespaces/R2-buckets/D1-databases/queues/RUM-sites; the GraphQL Analytics API for stats (`httpRequests1dGroups` + `httpRequestsAdaptiveGroups` [status codes/countries/cache], `workersInvocationsAdaptive`, `kvOperationsAdaptiveGroups`, `kvStorageAdaptiveGroups`, `r2OperationsAdaptiveGroups`, `r2StorageAdaptiveGroups`, `d1AnalyticsAdaptiveGroups`, `firewallEventsAdaptiveGroups`, `queueBacklogAdaptiveGroups`, `rumPageloadEventsAdaptiveGroups`/`rumPerformanceEventsAdaptiveGroups`, `durableObjects*AdaptiveGroups`). **Usage endpoints return raw "current window" numbers** (today for daily limits, month-to-date for monthly, snapshot for storage); the client turns these into limit meters via `src/lib/cloudflare/limits.ts` (`FREE_LIMITS`/`PAID_LIMITS` + `computeMeter` run-rate projection), so the Free/Paid toggle is client-side with no server round-trip. In-memory 5-min response cache scoped by token suffix. Returns `{ code: 'reconnect_required' }` with 401 on 401/403 or auth error codes (1000/9109/10000), which flips the widget to its Connect screen. Every analytics/list call is best-effort (isolated try/catch), so an under-scoped token still shows what it can — including graceful empty states for Durable Objects (Workers-Paid only) and Web Analytics (no RUM sites).

### Cross-Instance Sync
- `src/lib/stores/sync.ts` - Snapshots a fixed set of localStorage keys (widgets, sections, layouts, location, analytics connection, Cloudflare connection) and persists them to KV via `/api/dashboard-state`, keyed by the logged-in user
- Connection secrets (GA refresh token in `dashboard-analytics-connection`, Cloudflare API tokens in `dashboard-cloudflare-credentials`) live client-side and ride the same sync channel, so a connection made on one device follows the user everywhere. New connection stores must be added to `SYNCED_KEYS` and reloaded in both `applySnapshot` and `clearLocalState`.
- **Cloudflare uses a named key pool, not a single token.** `src/lib/stores/cloudflareCredentials.ts` holds `{ id, label, token }[]` (persisted to `dashboard-cloudflare-credentials`); each Cloudflare widget's `config.cloudflare.credentialId` selects which key it uses (unset → first/"Default" key for back-compat), and its `accountId` picks the account — so multiple widgets can share a key or each use a different one. Key + account are managed in `CloudflareWidgetSettings.svelte` (a standard widget-frame gear panel driven by the `cloudflareSettings` store + a global instance in `+layout.svelte`, mirroring the Weather widget), NOT an in-widget modal. The legacy single-token store `dashboard-cloudflare-connection` (`cloudflareConnection`) is kept only for one-time migration into the pool.
- Pulls on load / tab focus / 60s interval; pushes debounced (2s) after changes; last-write-wins by timestamp
- Stores dispatch a `dashboard-state-changed` window event after writing synced localStorage keys — anything that writes those keys must dispatch it
- KV binding is defined in `wrangler.toml`; `platformProxy` in `svelte.config.js` emulates it during `npm run dev` (data persisted under `.wrangler/`)
- ⚠️ **KV write budget:** this sync path (plus the GitHub cache below) makes Dashboard ~88% of the account's KV writes and the trigger for Cloudflare's "approaching KV daily operation limit" alerts — free KV allows only **1,000 writes/day**. Keep pushes coalesced/change-gated; prefer D1 for frequently-mutated per-user state. See `ROADMAP.md` → "KV write-quota pressure".

### GitHub Data Caching
- `+page.server.ts` caches the assembled GitHub payload in KV per user (fresh window 3 min, stale kept 24h)
- On GitHub rate limiting (403/429 — the search API allows only 30 req/min and each load uses 3) or total failure, the stale cache is served instead of empty widgets
- `hooks.server.ts` dedupes concurrent OAuth token refreshes (GitHub refresh tokens are single-use) and only sets a session error once the access token is actually expired

### State Management
- `src/lib/stores/theme.ts` - Theme toggle (light/dark)
- `src/lib/stores/widgets.ts` - Widget/section state
- `src/lib/stores/commands.ts` - Command palette actions
- `src/lib/stores/weatherSettings.ts` - Weather widget configuration modal

### Global Styles
- `src/app.css` - Theme CSS custom properties, browser default overrides, form styling

## Theme System (CRITICAL)

**All colors MUST use CSS custom properties. Never use hardcoded colors like `#fff`, `black`, `rgb()`, `hsl()`.**

Key variables defined in `src/app.css`:
- `--primary-color`, `--background`, `--surface`, `--surface-variant`
- `--text-primary`, `--text-secondary`, `--border`
- Status: `--success`, `--error`, `--warning`, `--info`

Dark mode: Applied via `.dark` class on root element.

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
