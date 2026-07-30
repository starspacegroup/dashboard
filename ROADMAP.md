# Dashboard Development Roadmap

Future enhancements and known operational issues for the Dashboard app.

## Priority: High

### KV write-quota pressure (account-wide alerts) — 2026-07-10

**Problem.** Dashboard is the dominant Workers KV *writer* on the Cloudflare
account (`David Monaghan`, `7170285216…`) and is what triggers the recurring
"[Alert] Approaching your KV daily operation limit" emails. Free-tier KV allows
**100k reads/day but only 1,000 writes/day** — writes are the scarce resource.

Evidence (Cloudflare GraphQL analytics, sampled, early July 2026):
- KV writes by namespace over 4 days: **`DASHBOARD_KV` 1,904** vs the shared
  NebulaKit `KV` namespace 253 → Dashboard is ~**88%** of all account KV writes.
- Per-day writes ran **45–60% of the 1,000/day cap** (Jul 10 = 596 = 60%);
  a busy day would exceed it and start returning 429s until 00:00 UTC reset.
- Reads are a non-issue here (<4% of the 100k/day cap).

**Two write sources in this app:**
1. **Cross-instance sync** — `src/lib/stores/sync.ts` → `POST /api/dashboard-state`
   → `KV.put(userKey, …)`. Debounced 2s after any `dashboard-state-changed`
   event, so a session that changes settings/widgets/connections repeatedly can
   emit a write every 2s.
2. **GitHub payload cache** — `src/routes/+page.server.ts` writes the assembled
   GitHub payload to KV per user (3-min fresh window). This is a *per-load* write
   whenever the 3-min window has lapsed; at Dashboard's ~11k requests/day that is
   a steady write stream.

**Root cause found (2026-07-11).** The sync-push stream isn't user edits — it's
widgets embedding *live data in their titles*: `CryptoWidget` puts the current
price in the title (60s refresh) and `GoogleAnalyticsWidget` puts the realtime
user count (30s poll). Every tick → `widgets.updateTitle()` → `saveWidgets()` →
`dashboard-state-changed` → sync push → KV get+put. ~1 write/min per open tab;
~650 writes measured on Jul 10–11 ≈ 65% of the daily cap from one open tab.
Full diagnosis and implementation plan: **`../planning/kv-write-amplification.md`**.

**Fixes (in order):**
- [x] Make dynamic widget titles display-only (non-persisted `liveTitles` store);
      `updateTitle` now only fires on deliberate renames (Weather location).
      This is the real fix — see the planning doc. *(2026-07-11)*
- [x] Only push when the snapshot actually changed — `push()` skips the PUT when
      the serialized snapshot matches the last pushed/pulled state.
      *(Not done: the ≤1-write/30–60s cap and `beforeunload` flush — deferred;
      the diff guard + title fix already remove the churn.)*
- [x] GitHub cache: gate `kv.put` behind an actual-change check so identical
      payloads don't rewrite. *(2026-07-11)*
- [ ] **Structural:** move mutable per-user dashboard state off KV entirely.
      Dashboard already binds a D1 `DB`; D1 (or a Durable Object) has far higher
      write limits and is the right home for frequently-mutated per-user state.
      KV is for read-heavy, rarely-written data — the opposite of this workload.

> See `CLAUDE.md` → "Cross-Instance Sync" and "GitHub Data Caching" for the
> mechanisms. Note: SpaceBot drives the separate Workers *request* limit — that
> is not a KV problem and is tracked in SpaceBot's roadmap.

### Cloudflare widget: CPU-unit bug + misleading Workers error badge — 2026-07-12

The widget renders Cloudflare's `cpuTimeP50/P99` (returned in **microseconds**)
with an `ms` label — "CPU p99 11386.0ms / 10ms" is really 11.4ms
(`CloudflareWidget.svelte:944,961`; raw pass-through in
`api/cloudflare/+server.ts`). Separately, the per-script ERR badge counts
Cloudflare Workflows engine-teardown exceptions as errors, so a healthy
`spacebot-ai-orchestrator` shows 27.1K ERR / 35%.
Plan: **`../planning/cloudflare-widget-fixes.md`**.

- [x] Convert `cpuTimeP50/P99` µs → ms in the API handler (both
      `fetchWorkersByDay` and `handleWorkers`) — 2026-07-23.
- [x] Label the ERR badge caveat — per-badge tooltip + a footnote under the
      Workers stats explaining the Workflows engine-teardown over-report; no
      fabricated "corrected" count — 2026-07-23.

## Priority: Medium

### TODO: Internet Health widget (Cloudflare Radar) — 2026-07-29

Add a new widget showing **realtime global internet health** from
[Cloudflare Radar](https://radar.cloudflare.com/). Unlike the existing
Cloudflare widget (which reports *David's own account*), this one reports the
state of the internet at large — a genuinely different widget, not a tab on the
existing one.

**API.** Base `https://api.cloudflare.com/client/v4/radar/`, Bearer token.
Requires an API token with **Account → Radar → Read** (that permission alone —
it does not need any of the analytics/Workers scopes the current Cloudflare
widget asks for). Free to use. Most endpoints take `dateRange` (`1d`, `7d`, …),
optional `location=<ISO country>`/`asn=`, and `format=json`.

Candidate panels (pick a few — the widget should read at a glance, not be a
wall of numbers):
- **Traffic trend** — `/http/timeseries` (or `/netflows/timeseries`) as a
  sparkline: is global traffic normal vs. the prior period?
- **Outages** — `/annotations/outages` — active/recent internet outages by
  country/ASN. This is the headline "is the internet broken" signal.
- **Attack activity** — `/attacks/layer3/timeseries` and
  `/attacks/layer7/timeseries` for DDoS trend.
- **Connection quality** — `/quality/speed/summary` (median down/up/latency),
  optionally scoped to `location=US`.
- **Protocol/adoption mix** — `/http/summary/http_protocol` (HTTP/3 share),
  `/http/summary/ip_version` (IPv6 share), `/http/summary/device_type`.
- Optional **local scope** — reuse the Weather widget's saved location to pass
  `location=` so it shows *your* country alongside global.

**Open decisions:**
- **Whose token?** Radar data is public/global, so a single server-side token in
  env (`CLOUDFLARE_RADAR_TOKEN`) is likely better than making every user create
  one — it makes the widget zero-config with no connect screen. Alternative:
  reuse `cloudflareCredentials` key pool, which means adding the Radar
  permission-group key to the Create-Token deep link in
  `CloudflareWidget.svelte` (verify the exact `permissionGroupKeys` value — the
  existing list is in `CLAUDE.md` → API Routes).
- **Refresh cadence:** Radar aggregates are not second-by-second; a 5–15 min
  poll is plenty. Do **not** put live values in the widget title — that was the
  KV write-amplification bug above (`liveTitles` store exists for exactly this).
- **Caching:** proxy through a `/api/radar` route with the same in-memory 5-min
  cache pattern as `/api/cloudflare/+server.ts`; keep each panel's fetch in an
  isolated try/catch so one failing endpoint doesn't blank the widget.
