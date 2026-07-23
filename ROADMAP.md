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
