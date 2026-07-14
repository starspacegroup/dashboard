<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';
	import type { Widget } from '$lib/types/widget';
	import { widgets, pendingSetupWidgetId } from '$lib/stores/widgets';
	import { setLiveTitle, clearLiveTitle } from '$lib/stores/liveTitles';
	import { cloudflareConnection } from '$lib/stores/cloudflareConnection';
	import { revealWidget } from '$lib/utils/revealWidget';
	import { computeMeter, limitsFor, WORKERS_CPU_MS_FREE, WORKERS_CPU_MS_PAID, type Meter, type PlanTier } from '$lib/cloudflare/limits';
	import CloudflareMeters from './CloudflareMeters.svelte';

	export let widget: Widget;

	// Deep-link that opens Cloudflare's "Create Token" page with everything
	// pre-filled: a read-only permission set covering every widget tab, scoped
	// to all accounts + all zones, and a token name. The user just clicks
	// Continue to summary → Create Token → Copy. Verified against the live
	// dashboard — `page` is Cloudflare Pages, `analytics` is Zone Analytics.
	const TOKEN_PERMISSION_KEYS = [
		{ key: 'account_analytics', type: 'read' }, // Overview + Workers/KV/R2/D1/DO stats
		{ key: 'analytics', type: 'read' }, // Zone (domain) traffic analytics
		{ key: 'zone', type: 'read' }, // List domains
		{ key: 'page', type: 'read' }, // Cloudflare Pages projects
		{ key: 'workers_scripts', type: 'read' }, // Workers scripts
		{ key: 'workers_kv_storage', type: 'read' }, // KV namespaces + usage
		{ key: 'workers_r2', type: 'read' }, // R2 buckets + usage
		{ key: 'd1', type: 'read' }, // D1 databases + query analytics
		{ key: 'queues', type: 'read' }, // Queues
		{ key: 'waf', type: 'read' }, // Firewall / WAF security events
		{ key: 'rum', type: 'read' } // Web Analytics (Core Web Vitals)
	];
	const CREATE_TOKEN_URL =
		'https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=' +
		encodeURIComponent(JSON.stringify(TOKEN_PERMISSION_KEYS)) +
		'&accountId=*&zoneId=all&name=' +
		encodeURIComponent('Dashboard (read-only)');
	// Plain tokens page, in case the user wants to manage tokens directly.
	const TOKEN_URL = 'https://dash.cloudflare.com/profile/api-tokens';
	const REFRESH_INTERVAL = 5 * 60 * 1000;

	type View = 'overview' | 'domains' | 'pages' | 'workers' | 'storage' | 'vitals';
	const TABS: { id: View; label: string; icon: string }[] = [
		{ id: 'overview', label: 'Overview', icon: '◈' },
		{ id: 'domains', label: 'Domains', icon: '🌐' },
		{ id: 'pages', label: 'Pages', icon: '📄' },
		{ id: 'workers', label: 'Workers', icon: '⚡' },
		{ id: 'storage', label: 'Storage', icon: '🗄️' },
		{ id: 'vitals', label: 'Vitals', icon: '📊' }
	];

	// Storage sub-products (each its own dataset)
	type StorageKind = 'kv' | 'r2' | 'd1' | 'queues' | 'do';
	const STORAGE_TABS: { id: StorageKind; label: string }[] = [
		{ id: 'kv', label: 'KV' },
		{ id: 'r2', label: 'R2' },
		{ id: 'd1', label: 'D1' },
		{ id: 'queues', label: 'Queues' },
		{ id: 'do', label: 'DO' }
	];

	const TIMEFRAMES = [
		{ days: 1, label: '24H' },
		{ days: 7, label: '7D' },
		{ days: 14, label: '14D' },
		{ days: 30, label: '30D' }
	];

	// ─── Connection ─────────────────────────────────────
	let apiToken = '';
	const unsubConn = cloudflareConnection.subscribe((c) => {
		apiToken = c.apiToken;
	});

	// ─── Config-backed state ────────────────────────────
	let accountId = widget.config?.cloudflare?.accountId ?? '';
	let accountName = widget.config?.cloudflare?.accountName ?? '';
	let view: View = widget.config?.cloudflare?.view ?? 'overview';
	let days = widget.config?.cloudflare?.days ?? 7;
	let selectedZoneId = widget.config?.cloudflare?.zoneId ?? '';
	let planTier: PlanTier = widget.config?.cloudflare?.plan ?? 'free';

	// ─── Connect-screen state ───────────────────────────
	let tokenInput = '';
	let connecting = false;
	let connectError = '';
	// True when the settings modal should show the token-gathering flow even
	// though we're already connected — i.e. the user wants to swap in a new,
	// broader-scoped token to unlock more data.
	let rekeying = false;

	// ─── Account picker ─────────────────────────────────
	let accounts: { id: string; name: string }[] = [];
	// Connect / manage settings live in a modal (like the Weather widget),
	// not inline in the widget body.
	let showSettingsModal = false;

	// Moves an element to <body> so the modal overlay escapes the widget's
	// transformed/clipped stacking context.
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) node.parentNode.removeChild(node);
			}
		};
	}

	// ─── Per-view data ──────────────────────────────────
	interface OverviewUsage {
		workers: { requests: number; errors: number } | null;
		kv: { read: number | null; write: number | null; delete: number | null; list: number | null; storageBytes: number | null; keys: number | null } | null;
		d1: { rowsRead: number; rowsWritten: number } | null;
		r2: { classA: number | null; classB: number | null; storageBytes: number | null } | null;
		pages: { builds: number } | null;
	}
	let overview: { zonesCount: number; pagesCount: number; workersCount: number; totals: { requests: number; bytes: number; threats: number; cachedRequests: number }; series: { date: string; requests: number; bytes: number }[]; usage: OverviewUsage } | null = null;
	let zones: { id: string; name: string; status: string; plan: string }[] = [];
	let zoneAnalytics: {
		series: { date: string; requests: number; bytes: number; cachedRequests: number; threats: number; pageViews: number; uniques: number }[];
		totals: { requests: number; bytes: number; cachedRequests: number; threats: number; pageViews: number; uniques: number };
		breakdown: { statusBuckets: Record<string, number>; topCountries: { country: string; requests: number }[]; cacheStatus: { status: string; requests: number }[] } | null;
	} | null = null;
	let security: { total: number; byAction: { action: string; count: number }[]; topCountries: { country: string; count: number }[]; topRules: { source: string; ruleId: string; count: number }[] } | null = null;
	let pages: { name: string; subdomain: string; domains: string[]; deployment: { environment: string; createdOn: string; url: string; status: string; stage: string; branch: string; message: string } | null }[] = [];
	let pagesBuilds: number | null = null;
	let workers: { scripts: { name: string; modifiedOn: string; createdOn: string; requests: number | null; errors: number | null; subrequests: number | null; cpuP50: number | null; cpuP99: number | null }[]; analyticsAvailable: boolean; daily: { date: string; requests: number; errors: number; subrequests: number }[]; today: { requests: number; errors: number; subrequests: number } | null; windowTotals: { requests: number; errors: number; subrequests: number }; cpuP50: number | null; cpuP99: number | null } | null = null;
	let vitals: { available: boolean; sites: { siteTag: string; host: string }[]; pageLoads: number; visits: number; vitals: { lcpP75: number | null; inpP75: number | null; clsP75: number | null } | null } | null = null;

	// ─── Storage sub-views ──────────────────────────────
	let storageKind: StorageKind = (widget.config?.cloudflare?.storageKind as StorageKind) ?? 'kv';
	let kv: { namespaces: { id: string; title: string; keys: number | null; bytes: number | null }[]; today: { read: number; write: number; delete: number; list: number } | null; windowOps: { read: number; write: number; delete: number; list: number }; daily: { date: string; read: number; write: number; delete: number; list: number }[]; storage: { keys: number; bytes: number }; analyticsAvailable: boolean } | null = null;
	let r2: { buckets: { name: string; createdOn: string; objects: number | null; bytes: number | null }[]; month: { classA: number; classB: number } | null; storage: { objects: number; bytes: number }; analyticsAvailable: boolean } | null = null;
	let d1: { databases: { id: string; name: string; version: string; tables: number | null; bytes: number | null; readQueries: number | null; writeQueries: number | null; rowsRead: number | null; rowsWritten: number | null; rowsReadToday: number | null; rowsWrittenToday: number | null }[]; windowTotals: { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number }; today: { rowsRead: number; rowsWritten: number }; analyticsAvailable: boolean } | null = null;
	let queues: { queues: { id: string; name: string; createdOn: string; producers: number; consumers: number; backlogMessages: number | null; backlogBytes: number | null }[]; analyticsAvailable: boolean } | null = null;
	let durableObjects: { available: boolean; requests: number | null; responseBytes: number | null; cpuTime: number | null; storedBytes: number | null } | null = null;

	let loading = false;
	let error = '';
	let needsReconnect = false;
	let refreshTimer: ReturnType<typeof setInterval> | null = null;
	// True once we've kicked off the initial account/data load for the current
	// token. Guards against loading twice when the token arrives via both mount
	// and the reactive cross-device-sync path. Reset in disconnect().
	let bootstrapped = false;

	// First-time setup reveal
	let isFirstTimeSetup = false;

	// ─── Domains: which metric drives the chart ─────────
	const ZONE_METRICS: { id: 'requests' | 'bytes' | 'threats' | 'pageViews'; label: string; format: 'number' | 'bytes' }[] = [
		{ id: 'requests', label: 'Requests', format: 'number' },
		{ id: 'bytes', label: 'Bandwidth', format: 'bytes' },
		{ id: 'pageViews', label: 'Page Views', format: 'number' },
		{ id: 'threats', label: 'Threats', format: 'number' }
	];
	let zoneMetric: 'requests' | 'bytes' | 'threats' | 'pageViews' = 'requests';

	// ─── Chart data (single visible chart, tab-driven) ──
	$: chartFormat = view === 'domains' && zoneMetric === 'bytes' ? 'bytes' : 'number';
	$: chartData = (() => {
		if (view === 'overview' && overview) {
			return overview.series.map((s) => ({ label: s.date, value: s.requests }));
		}
		if (view === 'domains' && zoneAnalytics) {
			return zoneAnalytics.series.map((s) => ({ label: s.date, value: Number(s[zoneMetric] || 0) }));
		}
		if (view === 'workers' && workers) {
			return workers.daily.map((d) => ({ label: d.date, value: d.requests }));
		}
		return [] as { label: string; value: number }[];
	})();

	// ─── Chart geometry ─────────────────────────────────
	let chartContainer: HTMLDivElement | undefined;
	let chartWidth = 0;
	let chartHeight = 0;
	let hoverIndex = -1;
	let isHovering = false;
	let chartResizeObserver: ResizeObserver | null = null;

	$: if (browser && chartContainer && chartResizeObserver) {
		chartResizeObserver.observe(chartContainer);
		measureChart();
	}

	function measureChart() {
		if (!chartContainer) return;
		const rect = chartContainer.getBoundingClientRect();
		chartWidth = rect.width;
		chartHeight = rect.height;
	}

	$: chartPoints = (() => {
		if (!chartData.length || chartWidth <= 0 || chartHeight <= 0) return [] as { x: number; y: number; value: number; label: string }[];
		const vals = chartData.map((d) => d.value);
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const range = max - min || 1;
		const pad = 6;
		const usableH = chartHeight - pad * 2;
		return chartData.map((d, i) => ({
			x: chartData.length > 1 ? (i / (chartData.length - 1)) * chartWidth : chartWidth / 2,
			y: pad + usableH - ((d.value - min) / range) * usableH,
			value: d.value,
			label: d.label
		}));
	})();
	$: chartLine = chartPoints.length ? 'M' + chartPoints.map((p) => `${p.x},${p.y}`).join(' L') : '';
	$: chartArea = chartLine && chartPoints.length ? `${chartLine} L${chartPoints[chartPoints.length - 1].x},${chartHeight} L${chartPoints[0].x},${chartHeight} Z` : '';
	$: yMax = chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0;
	$: yMin = chartData.length ? Math.min(...chartData.map((d) => d.value)) : 0;

	function handleChartMove(e: MouseEvent) {
		if (!chartContainer || chartData.length === 0) return;
		measureChart();
		const rect = chartContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		hoverIndex = Math.max(0, Math.min(chartData.length - 1, Math.round((x / chartWidth) * (chartData.length - 1))));
		isHovering = true;
	}
	function handleChartLeave() {
		isHovering = false;
		hoverIndex = -1;
	}

	// ─── Formatters ─────────────────────────────────────
	function formatNumber(n: number): string {
		if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
		return String(Math.round(n));
	}
	function formatBytes(n: number): string {
		if (n >= 1e12) return `${(n / 1e12).toFixed(2)} TB`;
		if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
		if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
		if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`;
		return `${Math.round(n)} B`;
	}
	function formatValue(v: number, fmt: string): string {
		return fmt === 'bytes' ? formatBytes(v) : formatNumber(v);
	}
	function formatDate(dateStr: string): string {
		const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
	function formatRelative(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const d = Math.floor(hrs / 24);
		return `${d}d ago`;
	}
	$: cacheHitRate = zoneAnalytics && zoneAnalytics.totals.requests > 0
		? (zoneAnalytics.totals.cachedRequests / zoneAnalytics.totals.requests) * 100
		: 0;

	// ─── Limits / meters ────────────────────────────────
	interface UiMeter { key: string; label: string; meter: Meter }

	/** Build a meter for one product/metric, or null if usage is unavailable. */
	function mkMeter(key: string, product: string, metric: string, used: number | null | undefined): UiMeter | null {
		if (used == null) return null;
		const def = limitsFor(planTier)[product]?.[metric];
		if (!def) return null;
		return { key, label: def.label, meter: computeMeter({ used, limit: def.limit, window: def.window, unit: def.unit }) };
	}

	/** Overall severity for sorting: worst of current + projected fill. */
	function severity(m: Meter): number {
		return Math.max(m.pct, m.projectedPct ?? 0);
	}

	// Overview "Plan Health" — every quota-bound metric with usage, worst first.
	$: healthMeters = (() => {
		const u = overview?.usage;
		if (!u) return [] as UiMeter[];
		const out: (UiMeter | null)[] = [];
		if (u.workers) out.push(mkMeter('workers-req', 'workers', 'requests', u.workers.requests));
		if (u.kv) {
			out.push(mkMeter('kv-read', 'kv', 'read', u.kv.read));
			out.push(mkMeter('kv-write', 'kv', 'write', u.kv.write));
			out.push(mkMeter('kv-delete', 'kv', 'delete', u.kv.delete));
			out.push(mkMeter('kv-list', 'kv', 'list', u.kv.list));
			out.push(mkMeter('kv-storage', 'kv', 'storage', u.kv.storageBytes));
		}
		if (u.d1) {
			out.push(mkMeter('d1-read', 'd1', 'rowsRead', u.d1.rowsRead));
			out.push(mkMeter('d1-write', 'd1', 'rowsWritten', u.d1.rowsWritten));
		}
		if (u.r2) {
			out.push(mkMeter('r2-a', 'r2', 'classA', u.r2.classA));
			out.push(mkMeter('r2-b', 'r2', 'classB', u.r2.classB));
			out.push(mkMeter('r2-storage', 'r2', 'storage', u.r2.storageBytes));
		}
		if (u.pages) out.push(mkMeter('pages-builds', 'pages', 'builds', u.pages.builds));
		return (out.filter(Boolean) as UiMeter[]).sort((a, b) => severity(b.meter) - severity(a.meter));
	})();

	// Worst meter that has crossed into warn/crit — drives the header chip + verdict.
	$: worstMeter = healthMeters.find((m) => m.meter.tone !== 'ok') ?? null;
	$: critCount = healthMeters.filter((m) => m.meter.tone === 'crit').length;
	$: warnCount = healthMeters.filter((m) => m.meter.tone === 'warn').length;

	// Per-tab meters (current-window usage against the active plan tier).
	$: workerMeters = workers?.today ? ([mkMeter('w-req', 'workers', 'requests', workers.today.requests)].filter(Boolean) as UiMeter[]) : [];
	$: kvMeters = (() => {
		if (!kv) return [] as UiMeter[];
		const out = [
			mkMeter('kv-read', 'kv', 'read', kv.today?.read ?? null),
			mkMeter('kv-write', 'kv', 'write', kv.today?.write ?? null),
			mkMeter('kv-delete', 'kv', 'delete', kv.today?.delete ?? null),
			mkMeter('kv-list', 'kv', 'list', kv.today?.list ?? null),
			mkMeter('kv-storage', 'kv', 'storage', kv.storage.bytes || null)
		];
		return out.filter(Boolean) as UiMeter[];
	})();
	$: d1Meters = (() => {
		if (!d1) return [] as UiMeter[];
		const bytes = d1.databases.reduce((a, db) => a + (db.bytes ?? 0), 0);
		const out = [
			mkMeter('d1-read', 'd1', 'rowsRead', d1.today.rowsRead),
			mkMeter('d1-write', 'd1', 'rowsWritten', d1.today.rowsWritten),
			mkMeter('d1-storage', 'd1', 'storage', bytes || null)
		];
		return out.filter(Boolean) as UiMeter[];
	})();
	$: r2Meters = (() => {
		if (!r2) return [] as UiMeter[];
		const out = [
			mkMeter('r2-a', 'r2', 'classA', r2.month?.classA ?? null),
			mkMeter('r2-b', 'r2', 'classB', r2.month?.classB ?? null),
			mkMeter('r2-storage', 'r2', 'storage', r2.storage.bytes || null)
		];
		return out.filter(Boolean) as UiMeter[];
	})();

	$: pagesMeters = pagesBuilds !== null ? ([mkMeter('pages-builds', 'pages', 'builds', pagesBuilds)].filter(Boolean) as UiMeter[]) : [];

	$: cpuCeilingMs = planTier === 'paid' ? WORKERS_CPU_MS_PAID : WORKERS_CPU_MS_FREE;
	$: workersErrorRate = workers?.windowTotals && workers.windowTotals.requests > 0
		? (workers.windowTotals.errors / workers.windowTotals.requests) * 100
		: 0;
	$: zoneErrorRate = (() => {
		const b = zoneAnalytics?.breakdown?.statusBuckets;
		if (!b) return null;
		const total = (b['2xx'] || 0) + (b['3xx'] || 0) + (b['4xx'] || 0) + (b['5xx'] || 0);
		if (total === 0) return null;
		return (((b['4xx'] || 0) + (b['5xx'] || 0)) / total) * 100;
	})();

	// ─── API ────────────────────────────────────────────
	async function api(action: string, params: Record<string, string> = {}, skipCache = false) {
		const search = new URLSearchParams({ action, ...params });
		if (skipCache) search.set('skipCache', '1');
		const res = await fetch(`/api/cloudflare?${search}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ apiToken })
		});
		const data = await res.json();
		if (!res.ok) {
			if (data.code === 'reconnect_required' || res.status === 401) needsReconnect = true;
			throw new Error(data.error || `HTTP ${res.status}`);
		}
		return data;
	}

	// ─── Connect flow ───────────────────────────────────
	async function connect() {
		const token = tokenInput.trim();
		if (!token) return;
		connecting = true;
		connectError = '';
		try {
			const res = await fetch('/api/cloudflare?action=verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiToken: token })
			});
			const data = await res.json();
			if (!res.ok || !data.valid) {
				connectError = data.error || 'That token could not be verified.';
				return;
			}
			// Claim the bootstrap synchronously so the reactive block that also
			// watches apiToken doesn't fire a duplicate load for this token.
			bootstrapped = true;
			cloudflareConnection.connect(token);
			apiToken = token;
			tokenInput = '';
			needsReconnect = false;
			error = '';
			startAutoRefresh();
			closeSettings();
			await loadAccounts();
		} catch (e) {
			connectError = e instanceof Error ? e.message : 'Failed to verify token.';
		} finally {
			connecting = false;
		}
	}

	// Clear this widget instance's cached data + refresh loop. Does NOT touch the
	// shared connection store, so it's safe to call from the `cloudflare-disconnected`
	// event handler without re-triggering another disconnect (which used to recurse
	// infinitely and make the Disconnect button appear dead).
	function resetLocalState() {
		stopAutoRefresh();
		clearLiveTitle(widget.id);
		bootstrapped = false;
		accounts = [];
		accountId = '';
		accountName = '';
		overview = null;
		zones = [];
		zoneAnalytics = null;
		security = null;
		pages = [];
		pagesBuilds = null;
		workers = null;
		vitals = null;
		kv = null;
		r2 = null;
		d1 = null;
		queues = null;
		durableObjects = null;
	}

	function disconnect() {
		// Flips apiToken='' for every widget instance (shared store) and fires the
		// `cloudflare-disconnected` event so the others reset their local caches.
		cloudflareConnection.disconnect();
		resetLocalState();
		rekeying = false;
		saveConfig();
	}

	function setPlan(tier: PlanTier) {
		if (planTier === tier) return;
		planTier = tier;
		saveConfig();
	}

	// ─── Settings / connect modal ───────────────────────
	function openSettings() {
		showSettingsModal = true;
	}
	// Open the settings modal straight into the token-gathering flow so the user
	// can paste a broader-scoped token. Invoked from the settings panel and from
	// the inline "add this scope" hints scattered through the widget.
	function beginRekey() {
		rekeying = true;
		tokenInput = '';
		connectError = '';
		showSettingsModal = true;
	}
	function cancelRekey() {
		rekeying = false;
		tokenInput = '';
		connectError = '';
	}
	function closeSettings() {
		showSettingsModal = false;
		connectError = '';
		rekeying = false;
		tokenInput = '';
		// First-time-setup reveal, mirroring the Weather/Analytics widgets.
		if (isFirstTimeSetup) {
			isFirstTimeSetup = false;
			revealWidget(widget.id, 300);
		}
	}

	async function loadAccounts() {
		try {
			const data = await api('accounts');
			accounts = data.accounts ?? [];
			if (accounts.length === 0) {
				error = 'This token has no accessible accounts.';
				return;
			}
			// Restore saved account or auto-pick the only/first one
			const saved = accounts.find((a) => a.id === accountId);
			const chosen = saved ?? accounts[0];
			await selectAccount(chosen.id, chosen.name);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load accounts.';
		}
	}

	async function selectAccount(id: string, name: string) {
		accountId = id;
		accountName = name;
		saveConfig();
		zones = [];
		selectedZoneId = '';
		overview = null;
		zoneAnalytics = null;
		security = null;
		pages = [];
		pagesBuilds = null;
		workers = null;
		vitals = null;
		kv = null;
		r2 = null;
		d1 = null;
		queues = null;
		durableObjects = null;
		await loadView();
	}

	// ─── Load data for the active tab ───────────────────
	async function loadView(skipCache = false) {
		if (!apiToken || !accountId) return;
		loading = true;
		error = '';
		needsReconnect = false;
		try {
			if (view === 'overview') {
				overview = await api('overview', { accountId, days: String(days) }, skipCache);
			} else if (view === 'domains') {
				const z = await api('zones', { accountId }, skipCache);
				zones = z.zones ?? [];
				if (zones.length > 0) {
					const found = zones.find((zz) => zz.id === selectedZoneId);
					selectedZoneId = found ? found.id : zones[0].id;
					await loadZoneAnalytics(skipCache);
				}
			} else if (view === 'pages') {
				const p = await api('pages', { accountId }, skipCache);
				pages = p.projects ?? [];
				pagesBuilds = p.builds ?? null;
			} else if (view === 'workers') {
				workers = await api('workers', { accountId, days: String(days) }, skipCache);
			} else if (view === 'vitals') {
				vitals = await api('web-analytics', { accountId, days: String(days) }, skipCache);
			} else if (view === 'storage') {
				await loadStorage(skipCache);
			}
			await tick();
			measureChart();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data.';
		} finally {
			loading = false;
		}
	}

	async function loadStorage(skipCache = false) {
		if (storageKind === 'kv') {
			kv = await api('kv', { accountId, days: String(days) }, skipCache);
		} else if (storageKind === 'r2') {
			r2 = await api('r2', { accountId, days: String(days) }, skipCache);
		} else if (storageKind === 'd1') {
			d1 = await api('d1', { accountId, days: String(days) }, skipCache);
		} else if (storageKind === 'queues') {
			queues = await api('queues', { accountId }, skipCache);
		} else if (storageKind === 'do') {
			durableObjects = await api('durable-objects', { accountId, days: String(days) }, skipCache);
		}
	}

	async function selectStorageKind(kind: StorageKind) {
		if (storageKind === kind) return;
		storageKind = kind;
		saveConfig();
		loading = true;
		error = '';
		needsReconnect = false;
		try {
			await loadStorage();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data.';
		} finally {
			loading = false;
		}
	}

	async function loadZoneAnalytics(skipCache = false) {
		if (!selectedZoneId) return;
		try {
			zoneAnalytics = await api('zone-analytics', { zoneId: selectedZoneId, days: String(days) }, skipCache);
			await tick();
			measureChart();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load zone analytics.';
		}
		// Security is best-effort and must never block the traffic view.
		loadSecurity(skipCache);
	}

	async function loadSecurity(skipCache = false) {
		if (!selectedZoneId) return;
		security = null;
		try {
			security = await api('security', { zoneId: selectedZoneId, days: String(days) }, skipCache);
		} catch {
			security = null; // token may lack WAF scope — degrade silently
		}
	}

	async function selectZone(id: string) {
		selectedZoneId = id;
		zoneAnalytics = null;
		saveConfig();
		await loadZoneAnalytics();
	}

	function switchTab(next: View) {
		if (view === next) return;
		view = next;
		hoverIndex = -1;
		isHovering = false;
		saveConfig();
		loadView();
	}

	function setDays(d: number) {
		if (days === d) return;
		days = d;
		saveConfig();
		loadView(true);
	}

	async function refresh() {
		await loadView(true);
	}

	function saveConfig() {
		widgets.updateWidgetConfig(widget.id, {
			cloudflare: { accountId, accountName, view, storageKind, zoneId: selectedZoneId, days, plan: planTier }
		});
	}

	// ─── Reconnect (token died) ─────────────────────────
	function beginReconnect() {
		disconnect();
	}

	// ─── Lifecycle ──────────────────────────────────────
	function startAutoRefresh() {
		stopAutoRefresh();
		refreshTimer = setInterval(() => loadView(), REFRESH_INTERVAL);
	}
	function stopAutoRefresh() {
		if (refreshTimer) clearInterval(refreshTimer);
		refreshTimer = null;
	}

	function handleDisconnectedEvent() {
		// Another widget instance (or this one) already emptied the shared store;
		// just drop our local cache. Must NOT call disconnect() — that re-emits the
		// event and recurses until the stack overflows.
		resetLocalState();
	}

	onMount(() => {
		if (!browser) return;

		// Freshly added from the picker with no connection yet: open the connect
		// modal right away (like the Weather widget opens its settings on add).
		if (get(pendingSetupWidgetId) === widget.id) {
			pendingSetupWidgetId.set(null);
			if (!apiToken) {
				isFirstTimeSetup = true;
				setTimeout(() => openSettings(), 150);
			} else {
				revealWidget(widget.id, 300);
			}
		}

		chartResizeObserver = new ResizeObserver(() => measureChart());
		if (chartContainer) chartResizeObserver.observe(chartContainer);

		window.addEventListener('cloudflare-disconnected', handleDisconnectedEvent);

		// Update title with account name
		if (accountName) setLiveTitle(widget.id, `Cloudflare · ${accountName}`);
	});

	// Bootstrap as soon as a token is available — whether it was already in
	// localStorage at mount, or it arrives later via a cross-device KV sync
	// pull (fresh browser / other device). This is what guarantees the widget
	// never shows the Connect screen again once the account is connected
	// anywhere, without a manual page reload.
	$: if (browser && apiToken && !bootstrapped) {
		bootstrapped = true;
		loadAccounts();
		startAutoRefresh();
	}

	onDestroy(() => {
		chartResizeObserver?.disconnect();
		stopAutoRefresh();
		unsubConn();
		if (browser) window.removeEventListener('cloudflare-disconnected', handleDisconnectedEvent);
	});

	// Keep title in sync
	$: if (browser && accountName) setLiveTitle(widget.id, `Cloudflare · ${accountName}`);

	// x-axis labels
	$: xLabels = (() => {
		if (chartData.length === 0) return [] as { label: string; pos: number; align: string }[];
		if (chartData.length === 1) return [{ label: formatDate(chartData[0].label), pos: 50, align: 'center' }];
		const count = Math.min(chartData.length, 6);
		const out: { label: string; pos: number; align: string }[] = [];
		for (let i = 0; i < count; i++) {
			const idx = Math.round((i * (chartData.length - 1)) / (count - 1));
			out.push({
				label: formatDate(chartData[idx].label),
				pos: (idx / (chartData.length - 1)) * 100,
				align: i === 0 ? 'left' : i === count - 1 ? 'right' : 'center'
			});
		}
		return out;
	})();

	function statusColor(status: string): string {
		const s = status.toLowerCase();
		if (s === 'success' || s === 'active') return 'var(--success)';
		if (s === 'failure' || s === 'failed') return 'var(--error)';
		if (s === 'building' || s === 'deploying' || s === 'queued' || s === 'initializing') return 'var(--warning)';
		return 'var(--text-secondary)';
	}
</script>

<div class="cf-widget">
	{#if !apiToken}
		<!-- ─── Not connected (prompt → modal) ─── -->
		<div class="not-connected">
			<div class="cf-logo" aria-hidden="true">
				<svg viewBox="0 0 48 32" width="46" height="31">
					<path fill="#f6821f" d="M35.9 20.2c.3-1 .2-1.9-.3-2.6-.4-.6-1.2-1-2.1-1l-17-.2c-.1 0-.2-.1-.3-.2 0-.1 0-.2.1-.2 0-.1.1-.2.3-.2l17.1-.2c2-.1 4.2-1.7 5-3.7l1-2.6c0-.1.1-.2 0-.3C35.6 3.3 30.9 0 25.4 0c-5.1 0-9.4 3.3-11 7.8-1-.8-2.4-1.2-3.8-1-2.6.3-4.6 2.4-4.9 5 0 .7 0 1.3.2 1.9C1.7 13.8 0 15.6 0 17.9c0 .2 0 .4.1.6 0 .1.1.2.2.2h31.4c.1 0 .2-.1.3-.2l.9-2.6z"/>
					<path fill="#fbad41" d="M40.6 9.3h-.5c-.1 0-.2.1-.2.2l-.6 2.1c-.3 1-.2 1.9.3 2.6.4.6 1.2 1 2.1 1l3.6.2c.1 0 .2.1.3.2 0 .1 0 .2-.1.2 0 .1-.1.2-.3.2l-3.8.2c-2 .1-4.2 1.7-5 3.7l-.2.7c-.1.1 0 .3.2.3h13c.1 0 .2-.1.2-.2.2-.8.4-1.7.4-2.6 0-4.9-4-8.9-9-8.9z"/>
				</svg>
			</div>
			<p class="nc-text">Connect your Cloudflare account to see domains, Pages, Workers, KV, R2, D1 &amp; Queues.</p>
			<button class="connect-btn" on:click={openSettings}>Connect Cloudflare</button>
		</div>
	{:else}
		<!-- ─── Header ─── -->
		<div class="cf-header">
			<button
				class="account-pill"
				on:click={openSettings}
				title="Cloudflare settings"
			>
				<span class="account-dot"></span>
				<span class="account-name">{accountName || 'Loading…'}</span>
				{#if accounts.length > 1}<span class="chev">▾</span>{/if}
			</button>
			{#if worstMeter}
				<button
					class="limit-chip"
					class:crit={worstMeter.meter.tone === 'crit'}
					on:click={() => switchTab('overview')}
					title="{worstMeter.label}: {Math.round(worstMeter.meter.pct)}% of limit"
				>
					{worstMeter.meter.tone === 'crit' ? '🔴' : '🟠'} {worstMeter.label} {Math.round(worstMeter.meter.pct)}%
				</button>
			{/if}
			<div class="header-actions">
				<button class="icon-btn" on:click={refresh} title="Refresh" class:spinning={loading}>
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg>
				</button>
				<button class="icon-btn" on:click={openSettings} title="Settings">
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
				</button>
			</div>
		</div>

		<!-- ─── Tabs ─── -->
		<div class="cf-tabs">
			{#each TABS as tab}
				<button class="cf-tab" class:active={view === tab.id} on:click={() => switchTab(tab.id)}>
					<span class="tab-icon">{tab.icon}</span>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</div>

		<!-- ─── Storage sub-tabs ─── -->
		{#if view === 'storage'}
			<div class="substorage-bar">
				{#each STORAGE_TABS as st}
					<button class="tf-pill" class:active={storageKind === st.id} on:click={() => selectStorageKind(st.id)}>{st.label}</button>
				{/each}
			</div>
		{/if}

		<!-- ─── Timeframe (analytics tabs) ─── -->
		{#if view === 'overview' || view === 'domains' || view === 'workers' || view === 'vitals' || (view === 'storage' && storageKind !== 'queues')}
			<div class="timeframe-bar">
				{#each TIMEFRAMES as tf}
					<button class="tf-pill" class:active={days === tf.days} on:click={() => setDays(tf.days)}>{tf.label}</button>
				{/each}
			</div>
		{/if}

		<!-- ─── Body ─── -->
		<div class="cf-body">
			{#if error}
				<div class="state-msg">
					<p>⚠️ {error}</p>
					{#if needsReconnect}
						<button class="retry-btn" on:click={beginReconnect}>Reconnect</button>
					{:else}
						<button class="retry-btn" on:click={() => loadView(true)}>Retry</button>
					{/if}
				</div>
			{:else if loading && !overview && !zones.length && !pages.length && !workers && !kv && !r2 && !d1 && !queues && !durableObjects && !vitals}
				<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>
			{:else if view === 'overview'}
				<!-- OVERVIEW -->
				{#if overview}
					<!-- Plan health verdict -->
					<div class="verdict" class:crit={critCount > 0} class:warn={critCount === 0 && warnCount > 0}>
						{#if critCount > 0}
							🔴 {critCount} metric{critCount > 1 ? 's' : ''} over 90% of the {planTier} limit
						{:else if warnCount > 0}
							🟠 {warnCount} metric{warnCount > 1 ? 's' : ''} approaching the {planTier} limit
						{:else if healthMeters.length > 0}
							🟢 All usage within {planTier}-tier limits
						{:else}
							No metered usage yet
						{/if}
					</div>

					{#if healthMeters.length > 0}
						<CloudflareMeters meters={healthMeters} />
					{:else}
						<p class="hint-line">No usage analytics on this token yet. Add <b>Account Analytics: Read</b> to see limit meters. <button class="hint-cta" on:click={beginRekey}>Update token</button></p>
					{/if}

					<div class="stat-grid">
						<div class="stat"><span class="stat-val">{formatNumber(overview.totals.requests)}</span><span class="stat-lbl">Requests</span></div>
						<div class="stat"><span class="stat-val">{formatBytes(overview.totals.bytes)}</span><span class="stat-lbl">Bandwidth</span></div>
						<div class="stat"><span class="stat-val">{formatNumber(overview.totals.threats)}</span><span class="stat-lbl">Threats</span></div>
						<div class="stat"><span class="stat-val">{overview.totals.requests > 0 ? Math.round((overview.totals.cachedRequests / overview.totals.requests) * 100) : 0}%</span><span class="stat-lbl">Cached</span></div>
					</div>
					<div class="resource-row">
						<button class="resource-chip" on:click={() => switchTab('domains')}><b>{overview.zonesCount}</b> Domains</button>
						<button class="resource-chip" on:click={() => switchTab('pages')}><b>{overview.pagesCount}</b> Pages</button>
						<button class="resource-chip" on:click={() => switchTab('workers')}><b>{overview.workersCount}</b> Workers</button>
					</div>
				{/if}
			{:else if view === 'domains'}
				<!-- DOMAINS -->
				{#if zones.length === 0}
					<div class="state-msg"><p>No domains in this account.</p></div>
				{:else}
					<div class="zone-selector">
						<select bind:value={selectedZoneId} on:change={() => selectZone(selectedZoneId)}>
							{#each zones as z}
								<option value={z.id}>{z.name}</option>
							{/each}
						</select>
						{#if zones.find((z) => z.id === selectedZoneId)}
							<span class="zone-plan">{zones.find((z) => z.id === selectedZoneId)?.plan}</span>
						{/if}
					</div>
					{#if zoneAnalytics}
						<div class="metric-chips">
							{#each ZONE_METRICS as m}
								<button class="metric-chip" class:active={zoneMetric === m.id} on:click={() => (zoneMetric = m.id)}>
									<span class="chip-val">{formatValue(zoneAnalytics.totals[m.id], m.format)}</span>
									<span class="chip-lbl">{m.label}</span>
								</button>
							{/each}
						</div>
						<div class="mini-stats">
							<span><b>{formatNumber(zoneAnalytics.totals.uniques)}</b> unique visitors</span>
							<span><b>{Math.round(cacheHitRate)}%</b> cache hit rate</span>
						</div>

						{#if zoneAnalytics.breakdown}
							<!-- Response health: status-code mix + error rate -->
							{@const b = zoneAnalytics.breakdown.statusBuckets}
							<div class="section-label">Response codes {#if zoneErrorRate !== null}<span class="err-rate" class:bad={zoneErrorRate >= 5}>{zoneErrorRate.toFixed(1)}% errors</span>{/if}</div>
							<div class="status-bar" role="img" aria-label="HTTP status code distribution">
								{#each [['2xx', 'var(--success)'], ['3xx', 'var(--info)'], ['4xx', 'var(--warning)'], ['5xx', 'var(--error)']] as [code, color]}
									{@const total = (b['2xx'] || 0) + (b['3xx'] || 0) + (b['4xx'] || 0) + (b['5xx'] || 0)}
									{#if total > 0 && (b[code] || 0) > 0}
										<div class="status-seg" style="flex: {b[code]}; background: {color};" title="{code}: {formatNumber(b[code])}"></div>
									{/if}
								{/each}
							</div>
							<div class="status-legend">
								{#each [['2xx', 'var(--success)'], ['3xx', 'var(--info)'], ['4xx', 'var(--warning)'], ['5xx', 'var(--error)']] as [code, color]}
									{#if (b[code] || 0) > 0}
										<span><span class="dot" style="background: {color};"></span>{code} {formatNumber(b[code])}</span>
									{/if}
								{/each}
							</div>

							{#if zoneAnalytics.breakdown.topCountries.length > 0}
								<div class="section-label">Top countries</div>
								<div class="chip-row">
									{#each zoneAnalytics.breakdown.topCountries.slice(0, 6) as c}
										<span class="mini-chip">{c.country || '—'} <b>{formatNumber(c.requests)}</b></span>
									{/each}
								</div>
							{/if}
						{/if}

						{#if security && security.total > 0}
							<div class="section-label">🛡 Security events <span class="err-rate">{formatNumber(security.total)}</span></div>
							<div class="chip-row">
								{#each security.byAction.slice(0, 5) as a}
									<span class="mini-chip">{a.action} <b>{formatNumber(a.count)}</b></span>
								{/each}
							</div>
							{#if security.topCountries.length > 0}
								<div class="chip-row">
									{#each security.topCountries.slice(0, 5) as c}
										<span class="mini-chip subtle">{c.country || '—'} <b>{formatNumber(c.count)}</b></span>
									{/each}
								</div>
							{/if}
						{/if}
					{:else}
						<div class="state-msg small"><div class="spinner"></div></div>
					{/if}
				{/if}
			{:else if view === 'pages'}
				<!-- PAGES -->
				{#if loading && !pages.length}
					<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>
				{:else if pages.length === 0}
					<div class="state-msg"><p>No Pages projects found.</p></div>
				{:else}
					{#if pagesBuilds !== null}
						<CloudflareMeters meters={pagesMeters} />
					{/if}
					<div class="list">
						{#each pages as project}
							<div class="list-item">
								<div class="li-main">
									<div class="li-title-row">
										<span class="li-title">{project.name}</span>
										{#if project.deployment}
											<span class="badge" style="color: {statusColor(project.deployment.status)}; border-color: {statusColor(project.deployment.status)};">
												{project.deployment.status}
											</span>
										{/if}
									</div>
									<a class="li-sub" href={`https://${project.subdomain}`} target="_blank" rel="noopener noreferrer">{project.subdomain} ↗</a>
									{#if project.deployment}
										<div class="li-meta">
											{#if project.deployment.branch}<span class="tag">{project.deployment.branch}</span>{/if}
											<span>{project.deployment.environment}</span>
											<span>· {formatRelative(project.deployment.createdOn)}</span>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else if view === 'workers'}
				<!-- WORKERS -->
				{#if loading && !workers}
					<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>
				{:else if !workers || workers.scripts.length === 0}
					<div class="state-msg"><p>No Workers found.</p></div>
				{:else}
					{#if !workers.analyticsAvailable}
						<p class="hint-line">Add <b>Account Analytics: Read</b> to your token to see invocation stats. <button class="hint-cta" on:click={beginRekey}>Update token</button></p>
					{/if}
					{#if workers.today}<CloudflareMeters meters={workerMeters} />{/if}
					<div class="wk-stats">
						{#if workers.cpuP99 !== null}<span>CPU p99 <b>{workers.cpuP99.toFixed(1)}ms</b> / {cpuCeilingMs}ms</span>{/if}
						<span>· <b>{workersErrorRate.toFixed(2)}%</b> errors</span>
						{#if workers.today}<span>· <b>{formatNumber(workers.today.subrequests)}</b> subreq</span>{/if}
					</div>
					<div class="list">
						{#each workers.scripts as w}
							<div class="list-item">
								<div class="li-main">
									<div class="li-title-row">
										<span class="li-title">{w.name}</span>
										{#if w.errors !== null && w.errors > 0}
											<span class="badge" style="color: var(--error); border-color: var(--error);">{formatNumber(w.errors)} err</span>
										{/if}
									</div>
									<div class="li-meta">
										{#if w.requests !== null}
											<span><b>{formatNumber(w.requests)}</b> req</span>
											{#if w.cpuP50 !== null}<span>· {w.cpuP50.toFixed(1)}ms p50</span>{/if}
										{:else}
											<span>updated {formatRelative(w.modifiedOn)}</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				{:else if view === 'storage'}
					<!-- STORAGE -->
					{#if storageKind === 'kv'}
						{#if loading && !kv}
							<div class="state-msg small"><div class="spinner"></div></div>
						{:else if kv}
							{#if !kv.analyticsAvailable && kv.namespaces.length > 0}
								<p class="hint-line">Reconnect with <b>Account Analytics: Read</b> to see KV usage. <button class="hint-cta" on:click={beginRekey}>Update token</button></p>
							{/if}
							<CloudflareMeters meters={kvMeters} />
							{#if kv.namespaces.length === 0}
								<div class="state-msg small"><p>No KV namespaces.</p></div>
							{:else}
								<div class="list">
									{#each kv.namespaces as ns}
										<div class="list-item">
											<div class="li-main">
												<div class="li-title-row"><span class="li-title">{ns.title}</span></div>
												<div class="li-meta">
													{#if ns.keys !== null}<span><b>{formatNumber(ns.keys)}</b> keys</span>{/if}
													{#if ns.bytes !== null}<span>· {formatBytes(ns.bytes)}</span>{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					{:else if storageKind === 'r2'}
						{#if loading && !r2}
							<div class="state-msg small"><div class="spinner"></div></div>
						{:else if r2}
							<CloudflareMeters meters={r2Meters} />
							<div class="wk-stats"><span><b>{formatNumber(r2.storage.objects)}</b> objects</span><span>· <b>{r2.buckets.length}</b> buckets</span></div>
							{#if r2.buckets.length === 0}
								<div class="state-msg small"><p>No R2 buckets.</p></div>
							{:else}
								<div class="list">
									{#each r2.buckets as bucket}
										<div class="list-item">
											<div class="li-main">
												<div class="li-title-row"><span class="li-title">{bucket.name}</span></div>
												<div class="li-meta">
													{#if bucket.objects !== null}<span><b>{formatNumber(bucket.objects)}</b> objects</span>{/if}
													{#if bucket.bytes !== null}<span>· {formatBytes(bucket.bytes)}</span>{/if}
													<span>· {formatRelative(bucket.createdOn)}</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					{:else if storageKind === 'd1'}
						{#if loading && !d1}
							<div class="state-msg small"><div class="spinner"></div></div>
						{:else if d1}
							<CloudflareMeters meters={d1Meters} />
							<div class="wk-stats"><span><b>{formatNumber(d1.windowTotals.readQueries)}</b> read q</span><span>· <b>{formatNumber(d1.windowTotals.writeQueries)}</b> write q</span></div>
							{#if d1.databases.length === 0}
								<div class="state-msg small"><p>No D1 databases.</p></div>
							{:else}
								<div class="list">
									{#each d1.databases as db}
										<div class="list-item">
											<div class="li-main">
												<div class="li-title-row"><span class="li-title">{db.name}</span></div>
												<div class="li-meta">
													{#if db.bytes !== null}<span><b>{formatBytes(db.bytes)}</b></span>{/if}
													{#if db.tables !== null}<span>· {db.tables} tables</span>{/if}
													{#if db.readQueries !== null}<span>· {formatNumber(db.readQueries)} reads</span>{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					{:else if storageKind === 'queues'}
						{#if loading && !queues}
							<div class="state-msg small"><div class="spinner"></div></div>
						{:else if queues}
							{#if queues.queues.length === 0}
								<div class="state-msg small"><p>No Queues.</p></div>
							{:else}
								<div class="list">
									{#each queues.queues as q}
										<div class="list-item">
											<div class="li-main">
												<div class="li-title-row"><span class="li-title">{q.name}</span></div>
												<div class="li-meta">
													<span><b>{q.producers}</b> producers</span>
													<span>· <b>{q.consumers}</b> consumers</span>
											{#if q.backlogMessages !== null}<span>· <b>{formatNumber(q.backlogMessages)}</b> backlog</span>{/if}
													<span>· {formatRelative(q.createdOn)}</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					{:else if storageKind === 'do'}
						{#if loading && !durableObjects}
							<div class="state-msg small"><div class="spinner"></div></div>
						{:else if !durableObjects || !durableObjects.available}
							<div class="state-msg small"><p>No Durable Objects.<br />DO requires the Workers Paid plan.</p></div>
						{:else}
							<div class="stat-grid">
								<div class="stat"><span class="stat-val">{formatNumber(durableObjects.requests ?? 0)}</span><span class="stat-lbl">Requests</span></div>
								<div class="stat"><span class="stat-val">{durableObjects.cpuTime != null ? formatNumber(durableObjects.cpuTime) : '—'}</span><span class="stat-lbl">CPU (ms)</span></div>
								<div class="stat"><span class="stat-val">{durableObjects.storedBytes != null ? formatBytes(durableObjects.storedBytes) : '—'}</span><span class="stat-lbl">Stored</span></div>
								<div class="stat"><span class="stat-val">{durableObjects.responseBytes != null ? formatBytes(durableObjects.responseBytes) : '—'}</span><span class="stat-lbl">Resp Bytes</span></div>
							</div>
						{/if}
					{/if}
				{:else if view === 'vitals'}
					{#if loading && !vitals}
						<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>
					{:else if !vitals || !vitals.available}
						<div class="state-msg"><p>No Web Analytics sites.<br />Enable Web Analytics in Cloudflare to see Core Web Vitals.</p></div>
					{:else}
						<div class="stat-grid">
							<div class="stat"><span class="stat-val">{formatNumber(vitals.pageLoads)}</span><span class="stat-lbl">Page Loads</span></div>
							<div class="stat"><span class="stat-val">{formatNumber(vitals.visits)}</span><span class="stat-lbl">Visits</span></div>
							<div class="stat"><span class="stat-val">{vitals.vitals?.lcpP75 != null ? (vitals.vitals.lcpP75 / 1000).toFixed(2) + 's' : '—'}</span><span class="stat-lbl">LCP p75</span></div>
							<div class="stat"><span class="stat-val">{vitals.vitals?.inpP75 != null ? Math.round(vitals.vitals.inpP75) + 'ms' : '—'}</span><span class="stat-lbl">INP p75</span></div>
						</div>
						{#if vitals.vitals?.clsP75 != null}
							<div class="mini-stats"><span><b>{vitals.vitals.clsP75.toFixed(3)}</b> CLS p75</span></div>
						{/if}
						{#if vitals.sites.length > 0}
							<div class="list">
								{#each vitals.sites as site}
									<div class="list-item"><div class="li-main"><div class="li-title-row"><span class="li-title">{site.host}</span></div></div></div>
								{/each}
							</div>
						{/if}
					{/if}
				{/if}

			<!-- Shared analytics chart (overview + domains + workers) -->
			{#if (view === 'overview' || view === 'domains' || view === 'workers') && chartData.length > 1 && !error}
				<div class="chart-block">
					<div class="chart-yaxis">
						<span>{formatValue(yMax, chartFormat)}</span>
						<span>{formatValue(yMin, chartFormat)}</span>
					</div>
					<div class="chart-col">
						<div
							class="chart-wrap"
							bind:this={chartContainer}
							on:mousemove={handleChartMove}
							on:mouseleave={handleChartLeave}
							role="img"
							aria-label="Cloudflare traffic chart"
						>
							<svg width="100%" height="100%" class="chart-svg">
								<defs>
									<linearGradient id="cf-grad-{widget.id}" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="#f6821f" stop-opacity="0.28" />
										<stop offset="100%" stop-color="#f6821f" stop-opacity="0" />
									</linearGradient>
								</defs>
								{#each [0.25, 0.5, 0.75] as frac}
									<line x1="0" y1={chartHeight * frac} x2={chartWidth} y2={chartHeight * frac} class="grid-line" />
								{/each}
								<path d={chartArea} fill="url(#cf-grad-{widget.id})" />
								<path d={chartLine} fill="none" stroke="#f6821f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								{#if isHovering && hoverIndex >= 0 && chartPoints[hoverIndex]}
									{@const pt = chartPoints[hoverIndex]}
									<line x1={pt.x} y1="0" x2={pt.x} y2={chartHeight} class="crosshair" />
									<circle cx={pt.x} cy={pt.y} r="4.5" fill="#f6821f" stroke="var(--surface)" stroke-width="2" />
								{/if}
							</svg>
							{#if isHovering && hoverIndex >= 0 && chartData[hoverIndex]}
								{@const pct = (hoverIndex / (chartData.length - 1)) * 100}
								<div class="chart-tooltip" style="left: {pct}%; transform: translateX({pct > 75 ? '-90%' : pct < 25 ? '-10%' : '-50%'});">
									<div class="tt-date">{formatDate(chartData[hoverIndex].label)}</div>
									<div class="tt-val">{formatValue(chartData[hoverIndex].value, chartFormat)}</div>
								</div>
							{/if}
						</div>
						<div class="chart-xaxis">
							{#each xLabels as t}
								<span class="x-label" style="left: {t.pos}%; transform: {t.align === 'left' ? 'none' : t.align === 'right' ? 'translateX(-100%)' : 'translateX(-50%)'};">{t.label}</span>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ─── Settings / Connect modal ─── -->
	{#if showSettingsModal}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="settings-overlay" use:portal on:click={closeSettings}>
			<div class="settings-panel" on:click|stopPropagation>
				<div class="settings-header">
					<div class="settings-title">
						<svg viewBox="0 0 48 32" width="26" height="18" aria-hidden="true">
							<path fill="#f6821f" d="M35.9 20.2c.3-1 .2-1.9-.3-2.6-.4-.6-1.2-1-2.1-1l-17-.2c-.1 0-.2-.1-.3-.2 0-.1 0-.2.1-.2 0-.1.1-.2.3-.2l17.1-.2c2-.1 4.2-1.7 5-3.7l1-2.6c0-.1.1-.2 0-.3C35.6 3.3 30.9 0 25.4 0c-5.1 0-9.4 3.3-11 7.8-1-.8-2.4-1.2-3.8-1-2.6.3-4.6 2.4-4.9 5 0 .7 0 1.3.2 1.9C1.7 13.8 0 15.6 0 17.9c0 .2 0 .4.1.6 0 .1.1.2.2.2h31.4c.1 0 .2-.1.3-.2l.9-2.6z"/>
							<path fill="#fbad41" d="M40.6 9.3h-.5c-.1 0-.2.1-.2.2l-.6 2.1c-.3 1-.2 1.9.3 2.6.4.6 1.2 1 2.1 1l3.6.2c.1 0 .2.1.3.2 0 .1 0 .2-.1.2 0 .1-.1.2-.3.2l-3.8.2c-2 .1-4.2 1.7-5 3.7l-.2.7c-.1.1 0 .3.2.3h13c.1 0 .2-.1.2-.2.2-.8.4-1.7.4-2.6 0-4.9-4-8.9-9-8.9z"/>
						</svg>
						<h3>{rekeying ? 'Update Cloudflare token' : apiToken ? 'Cloudflare Settings' : 'Connect Cloudflare'}</h3>
					</div>
					<button class="settings-close" on:click={closeSettings} aria-label="Close">✕</button>
				</div>

				{#if !apiToken || rekeying}
					<!-- Connect / re-key flow -->
					{#if rekeying}
						<p class="connect-sub">Create a fresh token with the permissions you're missing, then paste it below. It replaces your current token everywhere.</p>
					{:else}
						<p class="connect-sub">The button below opens Cloudflare with a read-only token already scoped for you. Tokens don't expire, so you stay connected on every device.</p>
					{/if}

					<a class="create-token-btn" href={CREATE_TOKEN_URL} target="_blank" rel="noopener noreferrer">
						<span class="step-num">1</span>
						Create token on Cloudflare
						<span class="ext">↗</span>
					</a>
					<p class="connect-hint">Permissions are pre-selected — just click <strong>Continue to summary</strong> → <strong>Create Token</strong> → <strong>Copy</strong>.</p>

					<div class="connect-divider"><span class="step-num">2</span> Paste it here</div>
					<input
						class="token-input"
						type="password"
						bind:value={tokenInput}
						placeholder="Paste API token"
						autocomplete="off"
						spellcheck="false"
						on:keydown={(e) => e.key === 'Enter' && connect()}
					/>
					{#if connectError}
						<p class="connect-error">⚠️ {connectError}</p>
					{/if}
					<button class="connect-btn wide" on:click={connect} disabled={connecting || !tokenInput.trim()}>
						{connecting ? 'Verifying…' : rekeying ? 'Update token' : 'Connect'}
					</button>
					{#if rekeying}
						<button class="link-btn" on:click={cancelRekey}>Cancel</button>
					{:else}
						<a class="manual-link" href={TOKEN_URL} target="_blank" rel="noopener noreferrer">or create a token manually</a>
					{/if}
				{:else}
					<!-- Manage connection -->
					<div class="settings-section">
						<span class="settings-section-title">Connected</span>
						<span class="settings-hint">You're connected with a read-only API token.</span>
					</div>

					<div class="settings-section">
						<span class="settings-section-title">API token</span>
						<span class="settings-hint">Missing a tab or usage meter? Swap in a token with broader permissions.</span>
						<button class="rekey-btn" on:click={beginRekey}>Update token…</button>
					</div>

					<div class="settings-section">
						<span class="settings-section-title">Plan tier</span>
						<span class="settings-hint">Usage meters compare against this tier's limits.</span>
						<div class="plan-toggle">
							<button class="plan-opt" class:active={planTier === 'free'} on:click={() => setPlan('free')}>Free</button>
							<button class="plan-opt" class:active={planTier === 'paid'} on:click={() => setPlan('paid')}>Workers Paid</button>
						</div>
					</div>

					{#if accounts.length > 1}
						<div class="settings-section">
							<span class="settings-section-title">Account</span>
							<select class="settings-select" value={accountId} on:change={(e) => { const a = accounts.find((x) => x.id === e.currentTarget.value); if (a) selectAccount(a.id, a.name); }}>
								{#each accounts as acc}
									<option value={acc.id}>{acc.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<div class="settings-actions">
						<button class="disconnect-btn" on:click={disconnect}>Disconnect Cloudflare</button>
						<button class="done-btn" on:click={closeSettings}>Done</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.cf-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		gap: 0.55rem;
		padding: 0.75rem;
	}

	/* ─── Not connected (in-widget prompt) ─── */
	.not-connected {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.7rem;
		padding: 1.25rem 0.75rem;
		flex: 1;
		justify-content: center;
	}
	.cf-logo { line-height: 0; }
	.nc-text {
		margin: 0;
		font-size: 0.78rem;
		color: var(--text-secondary);
		line-height: 1.45;
		max-width: 26ch;
	}

	/* ─── Connect (modal) ─── */
	.connect-sub {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.45;
	}
	.create-token-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0.35rem;
		padding: 0.6rem 0.9rem;
		background: #f6821f;
		color: #fff;
		border-radius: 0.5rem;
		font-weight: 700;
		font-size: 0.82rem;
		text-decoration: none;
		justify-content: center;
		transition: filter 0.15s, transform 0.1s;
	}
	.create-token-btn:hover { filter: brightness(1.08); }
	.create-token-btn:active { transform: scale(0.98); }
	.create-token-btn .ext { font-weight: 400; opacity: 0.9; }
	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		font-size: 0.7rem;
		font-weight: 800;
		flex-shrink: 0;
	}
	.connect-hint {
		margin: 0;
		font-size: 0.68rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	.connect-hint strong { color: var(--text-primary); }
	.connect-divider {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.35rem;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-secondary);
	}
	.connect-divider .step-num {
		background: var(--surface-variant);
		color: var(--text-secondary);
	}
	.manual-link {
		font-size: 0.66rem;
		color: var(--text-secondary);
		text-decoration: none;
		opacity: 0.75;
	}
	.manual-link:hover { text-decoration: underline; opacity: 1; }
	.link-btn {
		align-self: center;
		background: none;
		border: none;
		padding: 0.2rem;
		font-size: 0.72rem;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.link-btn:hover { color: var(--text-primary); text-decoration: underline; }
	.token-input {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border: 2px solid var(--border);
		border-radius: 0.5rem;
		background: var(--surface-variant);
		color: var(--text-primary);
		font-size: 0.8rem;
		font-family: ui-monospace, monospace;
	}
	.token-input:focus {
		outline: none;
		border-color: #f6821f;
	}
	.connect-error {
		margin: 0;
		font-size: 0.72rem;
		color: var(--error);
	}
	.connect-btn {
		margin-top: 0.15rem;
		padding: 0.55rem 1.5rem;
		background: #f6821f;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
		transition: filter 0.15s, transform 0.1s;
	}
	.connect-btn.wide { width: 100%; }
	.connect-btn:hover:not(:disabled) { filter: brightness(1.08); }
	.connect-btn:active:not(:disabled) { transform: scale(0.97); }
	.connect-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	/* ─── Header ─── */
	.cf-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.account-pill {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 1rem;
		padding: 0.28rem 0.7rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		max-width: 70%;
	}
	.account-pill:disabled { cursor: default; }
	.account-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #f6821f;
		flex-shrink: 0;
	}
	.account-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chev { font-size: 0.6rem; color: var(--text-secondary); }
	.header-actions { display: flex; gap: 0.1rem; }
	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.32rem;
		border-radius: 0.375rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
	}
	.icon-btn:hover { color: var(--text-primary); background: var(--surface-variant); }
	.icon-btn.spinning { animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ─── Settings / Connect modal ─── */
	.settings-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100000;
		padding: 1rem;
	}
	.settings-panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 1rem;
		padding: 1.25rem;
		width: min(400px, 92vw);
		max-height: 85vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.7rem;
		box-shadow: 0 12px 48px var(--shadow-strong);
	}
	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.settings-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.settings-title h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	.settings-close {
		background: none;
		border: none;
		font-size: 1.1rem;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		line-height: 1;
	}
	.settings-close:hover { color: var(--text-primary); background: var(--surface-variant); }
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--background);
	}
	.settings-section-title {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.settings-hint {
		font-size: 0.7rem;
		color: var(--text-secondary);
	}
	.settings-select {
		padding: 0.5rem 0.7rem;
		background: var(--surface-variant);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.settings-select:focus { outline: 2px solid #f6821f; outline-offset: 1px; }
	.settings-actions {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.1rem;
	}
	.disconnect-btn {
		padding: 0.5rem 1rem;
		background: var(--surface-variant);
		color: var(--error);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.78rem;
		cursor: pointer;
	}
	.disconnect-btn:hover { border-color: var(--error); }
	.done-btn {
		padding: 0.5rem 1.25rem;
		background: #f6821f;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		font-size: 0.78rem;
		cursor: pointer;
	}
	.done-btn:hover { filter: brightness(1.08); }
	.rekey-btn {
		align-self: flex-start;
		margin-top: 0.15rem;
		padding: 0.4rem 0.85rem;
		background: var(--surface-variant);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.rekey-btn:hover { border-color: #f6821f; }

	/* ─── Tabs ─── */
	.cf-tabs {
		display: flex;
		gap: 0.15rem;
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.15rem;
	}
	.cf-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.35rem 0.3rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.cf-tab:hover { color: var(--text-primary); }
	.cf-tab.active {
		background: var(--surface);
		color: #f6821f;
		box-shadow: 0 1px 3px var(--shadow);
	}
	.tab-icon { font-size: 0.8rem; }

	/* ─── Timeframe ─── */
	.timeframe-bar { display: flex; gap: 0.2rem; }
	.substorage-bar { display: flex; gap: 0.2rem; }
	.tf-pill {
		flex: 1;
		padding: 0.2rem 0.4rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.66rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.tf-pill:hover { color: var(--text-primary); border-color: #f6821f; }
	.tf-pill.active { background: #f6821f; color: #fff; border-color: #f6821f; }

	/* ─── Body ─── */
	.cf-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.state-msg {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
		text-align: center;
		flex: 1;
	}
	.state-msg.small { padding: 1rem; }
	.state-msg p { margin: 0; }
	.spinner {
		width: 1.4rem;
		height: 1.4rem;
		border: 2px solid var(--border);
		border-top-color: #f6821f;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	.retry-btn {
		padding: 0.4rem 1rem;
		background: #f6821f;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.75rem;
		cursor: pointer;
	}

	/* ─── Overview stats ─── */
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.4rem;
	}
	.stat {
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.5rem 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.stat-val {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}
	.stat-lbl {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
	}
	.resource-row { display: flex; gap: 0.35rem; }
	.resource-chip {
		flex: 1;
		background: var(--surface-variant);
		border: 1px solid transparent;
		border-radius: 0.5rem;
		padding: 0.4rem;
		font-size: 0.68rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
	}
	.resource-chip b { color: var(--text-primary); font-size: 0.9rem; margin-right: 0.15rem; }
	.resource-chip:hover { border-color: #f6821f; }

	/* ─── Domains ─── */
	.zone-selector { display: flex; align-items: center; gap: 0.4rem; }
	.zone-selector select {
		flex: 1;
		padding: 0.4rem 0.5rem;
		background: var(--surface-variant);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		appearance: none;
	}
	.zone-selector select:focus { outline: 2px solid #f6821f; outline-offset: 1px; }
	.zone-plan {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
		background: var(--surface-variant);
		padding: 0.2rem 0.4rem;
		border-radius: 0.3rem;
		flex-shrink: 0;
	}
	.metric-chips { display: flex; gap: 0.35rem; }
	.metric-chip {
		flex: 1;
		background: var(--surface-variant);
		border: 1.5px solid transparent;
		border-radius: 0.5rem;
		padding: 0.4rem 0.3rem;
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		cursor: pointer;
		transition: all 0.15s;
		min-width: 0;
	}
	.metric-chip:hover { background: var(--surface); }
	.metric-chip.active { border-color: #f6821f; }
	.chip-val {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.chip-lbl {
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
	}
	.mini-stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.68rem;
		color: var(--text-secondary);
		padding: 0 0.1rem;
	}
	.mini-stats b { color: var(--text-primary); }

	/* ─── Lists (pages / workers) ─── */
	.list { display: flex; flex-direction: column; gap: 0.35rem; }
	.list-item {
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.5rem 0.6rem;
	}
	.li-main { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
	.li-title-row { display: flex; align-items: center; gap: 0.4rem; }
	.li-title {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.badge {
		font-size: 0.58rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border: 1px solid;
		border-radius: 0.3rem;
		padding: 0.05rem 0.3rem;
		flex-shrink: 0;
	}
	.li-sub {
		font-size: 0.68rem;
		color: #f6821f;
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.li-sub:hover { text-decoration: underline; }
	.li-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.66rem;
		color: var(--text-secondary);
	}
	.li-meta b { color: var(--text-primary); }
	.tag {
		background: var(--surface);
		border-radius: 0.25rem;
		padding: 0.05rem 0.3rem;
		font-family: ui-monospace, monospace;
		font-size: 0.62rem;
	}
	.hint-line {
		margin: 0;
		font-size: 0.66rem;
		color: var(--text-secondary);
		background: var(--warning-bg);
		border-radius: 0.4rem;
		padding: 0.35rem 0.5rem;
	}
	.hint-line b { color: var(--text-primary); }
	.hint-cta {
		display: inline;
		margin-left: 0.15rem;
		padding: 0;
		background: none;
		border: none;
		font-size: inherit;
		font-weight: 700;
		color: #f6821f;
		cursor: pointer;
		text-decoration: underline;
	}
	.hint-cta:hover { filter: brightness(1.1); }

	/* ─── Chart ─── */
	.chart-block { display: flex; gap: 0.35rem; }
	.chart-yaxis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-end;
		font-size: 0.55rem;
		color: var(--text-secondary);
		opacity: 0.7;
		padding: 6px 0 1.1rem;
		min-width: 2.4rem;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.chart-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.chart-wrap {
		position: relative;
		width: 100%;
		height: 130px;
		cursor: crosshair;
		border-radius: 0.5rem;
		overflow: hidden;
	}
	.chart-svg { display: block; }
	.grid-line { stroke: var(--border); stroke-width: 0.5; stroke-dasharray: 4 4; opacity: 0.5; }
	.crosshair { stroke: var(--text-secondary); stroke-width: 0.75; stroke-dasharray: 3 3; opacity: 0.4; }
	.chart-tooltip {
		position: absolute;
		top: 4px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		padding: 0.3rem 0.5rem;
		font-size: 0.66rem;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 4px 14px var(--shadow-strong);
		z-index: 10;
	}
	.tt-date { font-weight: 700; color: var(--text-primary); font-size: 0.6rem; margin-bottom: 0.1rem; }
	.tt-val { color: #f6821f; font-weight: 700; font-variant-numeric: tabular-nums; }
	.chart-xaxis {
		position: relative;
		height: 1.1rem;
		font-size: 0.58rem;
		color: var(--text-secondary);
		opacity: 0.7;
		margin-top: 0.1rem;
	}
	.x-label { position: absolute; white-space: nowrap; }
	/* ─── Limits: header chip + verdict + diagnostics ─── */
	.limit-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.5rem;
		border-radius: 1rem;
		border: 1px solid var(--warning);
		background: var(--warning-bg);
		color: var(--text-primary);
		font-size: 0.66rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
		max-width: 45%;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.limit-chip.crit { border-color: var(--error); background: var(--error-bg); }

	.verdict {
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--text-primary);
		padding: 0.4rem 0.55rem;
		border-radius: 0.45rem;
		background: var(--surface-variant);
	}
	.verdict.warn { background: var(--warning-bg); }
	.verdict.crit { background: var(--error-bg); }

	.wk-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		font-size: 0.68rem;
		color: var(--text-secondary);
	}
	.wk-stats b { color: var(--text-primary); font-variant-numeric: tabular-nums; }

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 700;
		color: var(--text-secondary);
		margin-top: 0.15rem;
	}
	.err-rate {
		font-size: 0.64rem;
		font-weight: 700;
		color: var(--text-secondary);
		text-transform: none;
		letter-spacing: 0;
	}
	.err-rate.bad { color: var(--error); }

	.status-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: var(--surface-variant);
		gap: 1px;
	}
	.status-seg { min-width: 2px; }
	.status-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.64rem;
		color: var(--text-secondary);
	}
	.status-legend .dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		margin-right: 0.25rem;
		vertical-align: middle;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.mini-chip {
		padding: 0.2rem 0.45rem;
		border-radius: 0.35rem;
		background: var(--surface-variant);
		font-size: 0.66rem;
		color: var(--text-secondary);
	}
	.mini-chip b { color: var(--text-primary); font-variant-numeric: tabular-nums; }
	.mini-chip.subtle { opacity: 0.75; }

	/* ─── Settings: plan tier toggle ─── */
	.plan-toggle {
		display: flex;
		gap: 0.3rem;
	}
	.plan-opt {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		background: var(--surface-variant);
		color: var(--text-secondary);
		font-size: 0.72rem;
		font-weight: 600;
		cursor: pointer;
	}
	.plan-opt.active { background: #f6821f; color: #fff; border-color: #f6821f; }
</style>
