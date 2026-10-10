<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';
	import type { Widget } from '$lib/types/widget';
	import { widgets, pendingSetupWidgetId } from '$lib/stores/widgets';
	import { setLiveTitle, clearLiveTitle } from '$lib/stores/liveTitles';
	import { nebulakitSites, resolveSite } from '$lib/stores/nebulakitSites';
	import { nebulakitSettings } from '$lib/stores/nebulakitSettings';
	import { revealWidget } from '$lib/utils/revealWidget';
	import { metricColor } from '$lib/utils/metricColors';
	import { computeMeter, type Meter } from '$lib/cloudflare/limits';
	import CloudflareMeters from './CloudflareMeters.svelte';

	export let widget: Widget;

	const REFRESH_INTERVAL = 5 * 60 * 1000;

	type View = 'overview' | 'traffic' | 'audience' | 'usage';
	const TABS: { id: View; label: string; icon: string }[] = [
		{ id: 'overview', label: 'Overview', icon: '◈' },
		{ id: 'traffic', label: 'Traffic', icon: '🌐' },
		{ id: 'audience', label: 'Audience', icon: '👥' },
		{ id: 'usage', label: 'Usage', icon: '⚡' }
	];
	// The windows a NebulaKit site's own /admin offers — the API accepts no others.
	const TIMEFRAMES = [
		{ days: 1, label: '24H' },
		{ days: 7, label: '7D' },
		{ days: 30, label: '30D' },
		{ days: 90, label: '90D' }
	];
	// Workers Free: 100k requests per UTC day; Workers Paid: 10M included a month.
	// Mirrors FREE_DAILY_REQUESTS / PAID_MONTHLY_REQUESTS in NebulaKit's usage.ts.
	const FREE_DAILY_REQUESTS = 100_000;
	const PAID_MONTHLY_REQUESTS = 10_000_000;

	// ─── What /api/stats/summary returns ────────────────
	interface Summary {
		site: { name: string; url: string };
		generatedAt: string;
		trafficWindow: number;
		trafficNowHour: string;
		stats: {
			totalUsers: number;
			totalAdmins: number;
			totalContent: number;
			totalContactSubmissions: number;
			totalChatMessages: number;
			contentByStatus: { draft: number; published: number; archived: number };
			usersByMonth: { ym: string; count: number; cumulative: number }[];
			contentByMonth: { ym: string; count: number; cumulative: number }[];
		};
		traffic: {
			daily: { day: string; views: number; signedIn: number }[];
			hourly: { hourKey: string; views: number; signedIn: number }[];
			byPath: { pathKey: string; views: number; signedIn: number }[];
			topContent: { contentId: string; views: number; title: string; path: string }[];
			referrers: { referrerHost: string; views: number }[];
			countries: { country: string; views: number }[];
			audience: Record<'os' | 'browsers' | 'devices' | 'languages' | 'viewports', { value: string; views: number }[]>;
		} | null;
		usage: {
			today: number;
			todayBot: number;
			todayNotFound: number;
			monthToDate: number;
			peakDay: number;
			peakDayOn: string | null;
			days: { day: string; requests: number }[];
			projection: {
				percentUsed: number;
				projectedToday: number;
				hoursToLimit: number;
				hoursToReset: number;
				willExhaustToday: boolean;
				estimatedPaidOverageUsd: number;
				monthPercentOfPaidAllowance: number;
			};
		} | null;
	}

	// ─── Connection (resolved from the shared site pool) ─
	$: nkConfig = widget.config?.nebulakit ?? {};
	$: site = resolveSite($nebulakitSites.sites, nkConfig.siteId);

	// ─── Config-backed state ────────────────────────────
	let view: View = widget.config?.nebulakit?.view ?? 'overview';
	let days = widget.config?.nebulakit?.days ?? 7;

	let summary: Summary | null = null;
	let loading = false;
	let error = '';
	let needsReconnect = false;
	let refreshTimer: ReturnType<typeof setInterval> | null = null;

	// ─── Derived numbers ────────────────────────────────
	$: traffic = summary?.traffic ?? null;
	$: stats = summary?.stats ?? null;
	$: usage = summary?.usage ?? null;
	$: hourly = days === 1;
	$: viewRows = traffic ? (hourly ? traffic.hourly : traffic.daily) : [];
	$: totalViews = viewRows.reduce((sum, r) => sum + r.views, 0);
	$: signedInViews = viewRows.reduce((sum, r) => sum + r.signedIn, 0);
	$: signedInPct = totalViews > 0 ? Math.round((signedInViews / totalViews) * 100) : 0;
	$: usersThisMonth = stats?.usersByMonth.length ? stats.usersByMonth[stats.usersByMonth.length - 1].count : 0;
	$: contentThisMonth = stats?.contentByMonth.length ? stats.contentByMonth[stats.contentByMonth.length - 1].count : 0;

	// ─── Usage meters (same meter component the Cloudflare widget uses) ───
	interface UiMeter { key: string; label: string; meter: Meter }
	$: usageMeters = (() => {
		if (!usage) return [] as UiMeter[];
		return [
			{ key: 'free-day', label: 'Requests today · Free', meter: computeMeter({ used: usage.today, limit: FREE_DAILY_REQUESTS, window: 'day' }) },
			{ key: 'paid-month', label: 'Requests this month · Paid', meter: computeMeter({ used: usage.monthToDate, limit: PAID_MONTHLY_REQUESTS, window: 'month' }) }
		];
	})();
	$: freeMeter = usageMeters[0]?.meter ?? null;
	$: usageTone = usage?.projection.willExhaustToday ? 'crit' : (freeMeter?.tone ?? 'ok');

	// ─── Chart (one visible chart, tab-driven) ──────────
	// Views keep the colour "page views" has in every other widget; requests
	// keep the colour "requests" has in the Cloudflare widget. Brand purple
	// stays on the chrome.
	$: chartColor = metricColor(view === 'usage' ? 'requests' : 'views');
	$: chartData = (() => {
		if (view === 'usage' && usage) {
			return fillDays(usage.days.map((d) => ({ key: d.day, value: d.requests })), 30);
		}
		if ((view === 'overview' || view === 'traffic') && traffic) {
			if (hourly) return fillHours(traffic.hourly.map((h) => ({ key: h.hourKey, value: h.views })), summary?.trafficNowHour ?? '');
			return fillDays(traffic.daily.map((d) => ({ key: d.day, value: d.views })), days);
		}
		return [] as { label: string; value: number }[];
	})();

	/** Dense daily series ending today: quiet days draw as zero, not as a gap. */
	function fillDays(rows: { key: string; value: number }[], n: number) {
		const byKey = new Map(rows.map((r) => [r.key, r.value]));
		const out: { label: string; value: number }[] = [];
		for (let i = n - 1; i >= 0; i--) {
			const key = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
			out.push({ label: key, value: byKey.get(key) ?? 0 });
		}
		return out;
	}
	/** Dense 24-hour series ending at the site's own clock (`trafficNowHour`). */
	function fillHours(rows: { key: string; value: number }[], nowHour: string) {
		const byKey = new Map(rows.map((r) => [r.key, r.value]));
		const end = nowHour ? new Date(nowHour + ':00:00Z') : new Date();
		const out: { label: string; value: number }[] = [];
		for (let i = 23; i >= 0; i--) {
			const key = new Date(end.getTime() - i * 3_600_000).toISOString().slice(0, 13);
			out.push({ label: key, value: byKey.get(key) ?? 0 });
		}
		return out;
	}

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
		if (!chartData.length || chartWidth <= 0 || chartHeight <= 0) return [] as { x: number; y: number }[];
		const max = Math.max(...chartData.map((d) => d.value), 1);
		const pad = 6;
		const usableH = chartHeight - pad * 2;
		return chartData.map((d, i) => ({
			x: chartData.length > 1 ? (i / (chartData.length - 1)) * chartWidth : chartWidth / 2,
			y: pad + usableH - (d.value / max) * usableH
		}));
	})();
	$: chartLine = chartPoints.length ? 'M' + chartPoints.map((p) => `${p.x},${p.y}`).join(' L') : '';
	$: chartArea = chartLine && chartPoints.length ? `${chartLine} L${chartPoints[chartPoints.length - 1].x},${chartHeight} L${chartPoints[0].x},${chartHeight} Z` : '';
	$: yMax = chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0;
	$: xLabels = (() => {
		if (chartData.length === 0) return [] as { label: string; pos: number; align: string }[];
		// Short series get fewer labels: 6 across 7 points lands "Oct 9" on "Oct 10".
		const count = Math.min(chartData.length, chartData.length <= 8 ? 4 : 6);
		const out: { label: string; pos: number; align: string }[] = [];
		for (let i = 0; i < count; i++) {
			const idx = Math.round((i * (chartData.length - 1)) / (count - 1));
			out.push({
				label: formatLabel(chartData[idx].label),
				pos: (idx / (chartData.length - 1)) * 100,
				align: i === 0 ? 'left' : i === count - 1 ? 'right' : 'center'
			});
		}
		return out;
	})();

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
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
		if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
		return n.toLocaleString('en-US');
	}
	function formatLabel(key: string): string {
		if (key.length === 13) {
			// YYYY-MM-DDTHH → local hour
			const d = new Date(key + ':00:00Z');
			return d.toLocaleTimeString('en-US', { hour: 'numeric' });
		}
		return new Date(key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
	function formatHours(h: number): string {
		if (!Number.isFinite(h)) return '—';
		if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
		return `${h.toFixed(1)}h`;
	}
	function prettyDimension(key: string, value: string): string {
		if (key === 'viewports') {
			return { 'under-640': '< 640px', '640-1023': '640–1023px', '1024-1535': '1024–1535px', '1536-plus': '≥ 1536px' }[value] ?? value;
		}
		return value;
	}
	/** Share of the biggest row, so every list doubles as a bar chart. */
	function share(value: number, rows: { views: number }[]): number {
		const max = Math.max(1, ...rows.map((r) => r.views));
		return (value / max) * 100;
	}

	const AUDIENCE_PANELS: { key: 'os' | 'browsers' | 'devices' | 'languages' | 'viewports'; label: string }[] = [
		{ key: 'devices', label: 'Device' },
		{ key: 'os', label: 'OS' },
		{ key: 'browsers', label: 'Browser' },
		{ key: 'languages', label: 'Language' },
		{ key: 'viewports', label: 'Viewport' }
	];

	// ─── API ────────────────────────────────────────────
	async function api(skipCache = false): Promise<Summary> {
		if (!site) throw new Error('No site selected.');
		const search = new URLSearchParams({ action: 'summary', days: String(days) });
		if (skipCache) search.set('skipCache', '1');
		const res = await fetch(`/api/nebulakit?${search}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: site.url, token: site.token })
		});
		const data = await res.json();
		if (!res.ok) {
			if (data.code === 'reconnect_required' || res.status === 401) needsReconnect = true;
			throw new Error(data.error || `HTTP ${res.status}`);
		}
		return data as Summary;
	}

	async function load(skipCache = false) {
		if (!site) return;
		loading = true;
		error = '';
		needsReconnect = false;
		try {
			summary = await api(skipCache);
			await tick();
			measureChart();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load stats.';
		} finally {
			loading = false;
		}
	}

	// ─── Settings panel (external, shared) ──────────────
	export function openSettings() {
		nebulakitSettings.open(widget.id);
	}

	// ─── Connection sync ────────────────────────────────
	// Re-bootstrap whenever the resolved site (or its token) changes — driven
	// by the settings panel writing widget config or the site pool.
	let connSig = '__init__';
	function applyConnection(sig: string) {
		if (sig === connSig) return;
		connSig = sig;
		stopAutoRefresh();
		summary = null;
		error = '';
		needsReconnect = false;
		if (!site) {
			clearLiveTitle(widget.id);
			return;
		}
		startAutoRefresh();
		load();
	}
	$: if (browser) applyConnection(site ? `${site.id}|${site.url}|${site.token}` : '');

	function switchTab(next: View) {
		if (view === next) return;
		view = next;
		hoverIndex = -1;
		isHovering = false;
		saveConfig();
		tick().then(measureChart);
	}
	function setDays(d: number) {
		if (days === d) return;
		days = d;
		saveConfig();
		load();
	}
	function refresh() {
		load(true);
	}
	function saveConfig() {
		widgets.updateWidgetConfig(widget.id, { nebulakit: { siteId: nkConfig.siteId, view, days } });
	}

	function startAutoRefresh() {
		stopAutoRefresh();
		refreshTimer = setInterval(() => load(), REFRESH_INTERVAL);
	}
	function stopAutoRefresh() {
		if (refreshTimer) clearInterval(refreshTimer);
		refreshTimer = null;
	}

	onMount(() => {
		if (!browser) return;
		// Freshly added from the picker: with no site to show, open the settings
		// panel to gather one; otherwise it connects to the first saved site —
		// just reveal it.
		if (get(pendingSetupWidgetId) === widget.id) {
			pendingSetupWidgetId.set(null);
			if (!site) {
				setTimeout(() => nebulakitSettings.open(widget.id, true), 150);
			} else {
				revealWidget(widget.id, 300);
			}
		}
		chartResizeObserver = new ResizeObserver(() => measureChart());
		if (chartContainer) chartResizeObserver.observe(chartContainer);
	});
	onDestroy(() => {
		chartResizeObserver?.disconnect();
		stopAutoRefresh();
	});

	$: if (browser && site) setLiveTitle(widget.id, `${site.label}`);
</script>

<div class="nk-widget">
	{#if !site}
		<!-- ─── Not connected (prompt → settings panel) ─── -->
		<div class="not-connected">
			<div class="nk-logo" aria-hidden="true">
				<svg viewBox="0 0 48 48" width="44" height="44">
					<circle cx="24" cy="24" r="21" fill="none" stroke="#7c4dff" stroke-width="2.5" />
					<ellipse cx="24" cy="24" rx="17" ry="7" fill="none" stroke="#b39dff" stroke-width="1.5" transform="rotate(-25 24 24)" />
					<circle cx="24" cy="24" r="5" fill="#7c4dff" />
					<circle cx="36" cy="14" r="1.6" fill="#b39dff" />
					<circle cx="11" cy="33" r="1.2" fill="#b39dff" />
				</svg>
			</div>
			<p class="nc-text">Connect a site built on NebulaKit to see its traffic, audience, growth and plan usage here.</p>
			<button class="connect-btn" on:click={openSettings}>Connect a site</button>
		</div>
	{:else}
		<!-- ─── Header ─── -->
		<div class="nk-header">
			<button class="site-pill" on:click={openSettings} title="NebulaKit settings">
				<span class="site-dot"></span>
				<span class="site-name">{site.label}</span>
				{#if $nebulakitSites.sites.length > 1}<span class="chev">▾</span>{/if}
			</button>
			{#if usage && usageTone !== 'ok'}
				<button class="limit-chip" class:crit={usageTone === 'crit'} on:click={() => switchTab('usage')} title="Requests today: {Math.round(usage.projection.percentUsed)}% of the free daily allowance">
					{usageTone === 'crit' ? '🔴' : '🟠'} Requests {Math.round(usage.projection.percentUsed)}%
				</button>
			{/if}
			<div class="header-actions">
				<a class="icon-btn" href="{site.url}/admin" target="_blank" rel="noopener noreferrer" title="Open the site's admin">
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
				</a>
				<button class="icon-btn" on:click={refresh} title="Refresh" class:spinning={loading}>
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg>
				</button>
				<button class="icon-btn" on:click={openSettings} title="Settings">
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
				</button>
			</div>
		</div>

		<!-- ─── Tabs ─── -->
		<div class="nk-tabs">
			{#each TABS as tab}
				<button class="nk-tab" class:active={view === tab.id} on:click={() => switchTab(tab.id)}>
					<span class="tab-icon">{tab.icon}</span>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</div>

		<!-- ─── Timeframe (traffic tabs) ─── -->
		{#if view !== 'usage'}
			<div class="timeframe-bar">
				{#each TIMEFRAMES as tf}
					<button class="tf-pill" class:active={days === tf.days} on:click={() => setDays(tf.days)}>{tf.label}</button>
				{/each}
			</div>
		{/if}

		<!-- ─── Body ─── -->
		<div class="nk-body">
			{#if error}
				<div class="state-msg">
					<p>⚠️ {error}</p>
					{#if needsReconnect}
						<button class="retry-btn" on:click={openSettings}>Update token</button>
					{:else}
						<button class="retry-btn" on:click={() => load(true)}>Retry</button>
					{/if}
				</div>
			{:else if loading && !summary}
				<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>
			{:else if !summary}
				<div class="state-msg"><p>No data yet.</p></div>
			{:else if view === 'overview'}
				<!-- OVERVIEW -->
				<div class="stat-grid">
					<div class="stat">
						<span class="stat-val">{formatNumber(totalViews)}</span>
						<span class="stat-lbl">Views · {hourly ? '24h' : `${days}d`}</span>
					</div>
					<div class="stat">
						<span class="stat-val">{signedInPct}%</span>
						<span class="stat-lbl">Signed-in views</span>
					</div>
					<div class="stat">
						<span class="stat-val">{formatNumber(stats?.totalUsers ?? 0)}</span>
						<span class="stat-lbl">Users{usersThisMonth > 0 ? ` · +${formatNumber(usersThisMonth)} this month` : ''}</span>
					</div>
					<div class="stat">
						<span class="stat-val">{formatNumber(stats?.contentByStatus.published ?? 0)}<span class="stat-of">/{formatNumber(stats?.totalContent ?? 0)}</span></span>
						<span class="stat-lbl">Published{contentThisMonth > 0 ? ` · +${contentThisMonth} this month` : ''}</span>
					</div>
				</div>
				{#if traffic}
					<div class="chart-block">
						<div class="chart-yaxis">
							<span>{formatNumber(yMax)}</span>
							<span>0</span>
						</div>
						<div class="chart-col">
							<div class="chart-wrap" bind:this={chartContainer} on:mousemove={handleChartMove} on:mouseleave={handleChartLeave} role="img" aria-label="Page views over time">
								<svg width="100%" height="100%" class="chart-svg">
									<defs>
										<linearGradient id="nk-grad-{widget.id}" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" style="stop-color: {chartColor}" stop-opacity="0.28" />
											<stop offset="100%" style="stop-color: {chartColor}" stop-opacity="0" />
										</linearGradient>
									</defs>
									{#each [0.25, 0.5, 0.75] as frac}
										<line x1="0" y1={chartHeight * frac} x2={chartWidth} y2={chartHeight * frac} class="grid-line" />
									{/each}
									<path d={chartArea} fill="url(#nk-grad-{widget.id})" />
									<path d={chartLine} fill="none" style="stroke: {chartColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									{#if isHovering && hoverIndex >= 0 && chartPoints[hoverIndex]}
										{@const pt = chartPoints[hoverIndex]}
										<line x1={pt.x} y1="0" x2={pt.x} y2={chartHeight} class="crosshair" />
										<circle cx={pt.x} cy={pt.y} r="4.5" style="fill: {chartColor}" stroke="var(--surface)" stroke-width="2" />
									{/if}
								</svg>
								{#if isHovering && hoverIndex >= 0 && chartData[hoverIndex]}
									{@const pct = (hoverIndex / Math.max(1, chartData.length - 1)) * 100}
									<div class="chart-tooltip" style="left: {pct}%; transform: translateX({pct > 75 ? '-90%' : pct < 25 ? '-10%' : '-50%'});">
										<div class="tt-date">{formatLabel(chartData[hoverIndex].label)}</div>
										<div class="tt-val">{formatNumber(chartData[hoverIndex].value)} views</div>
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
				{:else}
					<p class="hint-line">No traffic counters yet — the site has not applied the page-view migrations, or nobody has visited since.</p>
				{/if}
				<div class="resource-row">
					<span class="resource-chip" title="Admins"><b>{formatNumber(stats?.totalAdmins ?? 0)}</b> Admins</span>
					<span class="resource-chip" title="Contact form submissions"><b>{formatNumber(stats?.totalContactSubmissions ?? 0)}</b> Forms</span>
					<span class="resource-chip" title="Chat messages"><b>{formatNumber(stats?.totalChatMessages ?? 0)}</b> Chats</span>
				</div>
			{:else if view === 'traffic'}
				<!-- TRAFFIC -->
				{#if !traffic}
					<div class="state-msg"><p>No traffic counters on this site yet.</p></div>
				{:else}
					<div class="panel">
						<div class="panel-title">Top routes <span class="panel-sub">{formatNumber(totalViews)} views</span></div>
						{#each traffic.byPath.slice(0, 6) as r (r.pathKey)}
							<div class="row">
								<div class="row-bar" style="width: {share(r.views, traffic.byPath)}%; background: {chartColor}"></div>
								<span class="row-label mono">{r.pathKey}</span>
								<span class="row-val">{formatNumber(r.views)}</span>
							</div>
						{:else}
							<p class="empty">No views in this window.</p>
						{/each}
					</div>
					{#if traffic.topContent.length}
						<div class="panel">
							<div class="panel-title">Top content</div>
							{#each traffic.topContent.slice(0, 5) as c (c.contentId)}
								<div class="row">
									<div class="row-bar" style="width: {share(c.views, traffic.topContent)}%; background: {chartColor}"></div>
									<a class="row-label" href="{site.url}{c.path}" target="_blank" rel="noopener noreferrer" title={c.title}>{c.title}</a>
									<span class="row-val">{formatNumber(c.views)}</span>
								</div>
							{/each}
						</div>
					{/if}
					<div class="panel-grid">
						<div class="panel">
							<div class="panel-title">Referrers</div>
							{#each traffic.referrers.slice(0, 5) as r (r.referrerHost)}
								<div class="row">
									<div class="row-bar" style="width: {share(r.views, traffic.referrers)}%; background: {chartColor}"></div>
									<span class="row-label">{r.referrerHost}</span>
									<span class="row-val">{formatNumber(r.views)}</span>
								</div>
							{:else}
								<p class="empty">None yet.</p>
							{/each}
						</div>
						<div class="panel">
							<div class="panel-title">Countries</div>
							{#each traffic.countries.slice(0, 5) as c (c.country)}
								<div class="row">
									<div class="row-bar" style="width: {share(c.views, traffic.countries)}%; background: {chartColor}"></div>
									<span class="row-label">{c.country}</span>
									<span class="row-val">{formatNumber(c.views)}</span>
								</div>
							{:else}
								<p class="empty">None yet.</p>
							{/each}
						</div>
					</div>
				{/if}
			{:else if view === 'audience'}
				<!-- AUDIENCE -->
				{#if !traffic}
					<div class="state-msg"><p>No audience counters on this site yet.</p></div>
				{:else}
					<div class="panel-grid">
						{#each AUDIENCE_PANELS as p (p.key)}
							{@const rows = traffic.audience[p.key] ?? []}
							<div class="panel">
								<div class="panel-title">{p.label}</div>
								{#each rows.slice(0, 4) as r (r.value)}
									<div class="row">
										<div class="row-bar" style="width: {share(r.views, rows)}%; background: {chartColor}"></div>
										<span class="row-label">{prettyDimension(p.key, r.value)}</span>
										<span class="row-val">{formatNumber(r.views)}</span>
									</div>
								{:else}
									<p class="empty">None yet.</p>
								{/each}
							</div>
						{/each}
					</div>
					<p class="footnote">Coarse buckets only — the site never stores a raw User-Agent, IP or identifier.</p>
				{/if}
			{:else if view === 'usage'}
				<!-- USAGE -->
				{#if !usage}
					<div class="state-msg"><p>No platform-usage counters on this site yet.</p></div>
				{:else}
					<div class="verdict" class:crit={usageTone === 'crit'} class:warn={usageTone === 'warn'}>
						{#if usage.projection.willExhaustToday}
							🔴 On track to exhaust the free daily allowance in {formatHours(usage.projection.hoursToLimit)}
						{:else if usageTone === 'warn'}
							🟠 {Math.round(usage.projection.percentUsed)}% of the free daily allowance used · resets in {formatHours(usage.projection.hoursToReset)}
						{:else}
							🟢 {Math.round(usage.projection.percentUsed)}% of the free daily allowance used · resets in {formatHours(usage.projection.hoursToReset)}
						{/if}
					</div>
					<CloudflareMeters meters={usageMeters} />
					<div class="stat-grid">
						<div class="stat"><span class="stat-val">{formatNumber(usage.today)}</span><span class="stat-lbl">Requests today</span></div>
						<div class="stat"><span class="stat-val">{formatNumber(usage.projection.projectedToday)}</span><span class="stat-lbl">Projected today</span></div>
						<div class="stat"><span class="stat-val">{usage.today > 0 ? Math.round((usage.todayBot / usage.today) * 100) : 0}%</span><span class="stat-lbl">Bots today</span></div>
						<div class="stat"><span class="stat-val">{formatNumber(usage.todayNotFound)}</span><span class="stat-lbl">404s today</span></div>
					</div>
					<div class="chart-block">
						<div class="chart-yaxis">
							<span>{formatNumber(yMax)}</span>
							<span>0</span>
						</div>
						<div class="chart-col">
							<div class="chart-wrap" bind:this={chartContainer} on:mousemove={handleChartMove} on:mouseleave={handleChartLeave} role="img" aria-label="Requests per day, last 30 days">
								<svg width="100%" height="100%" class="chart-svg">
									<defs>
										<linearGradient id="nk-ugrad-{widget.id}" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" style="stop-color: {chartColor}" stop-opacity="0.28" />
											<stop offset="100%" style="stop-color: {chartColor}" stop-opacity="0" />
										</linearGradient>
									</defs>
									{#each [0.25, 0.5, 0.75] as frac}
										<line x1="0" y1={chartHeight * frac} x2={chartWidth} y2={chartHeight * frac} class="grid-line" />
									{/each}
									<path d={chartArea} fill="url(#nk-ugrad-{widget.id})" />
									<path d={chartLine} fill="none" style="stroke: {chartColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									{#if isHovering && hoverIndex >= 0 && chartPoints[hoverIndex]}
										{@const pt = chartPoints[hoverIndex]}
										<line x1={pt.x} y1="0" x2={pt.x} y2={chartHeight} class="crosshair" />
										<circle cx={pt.x} cy={pt.y} r="4.5" style="fill: {chartColor}" stroke="var(--surface)" stroke-width="2" />
									{/if}
								</svg>
								{#if isHovering && hoverIndex >= 0 && chartData[hoverIndex]}
									{@const pct = (hoverIndex / Math.max(1, chartData.length - 1)) * 100}
									<div class="chart-tooltip" style="left: {pct}%; transform: translateX({pct > 75 ? '-90%' : pct < 25 ? '-10%' : '-50%'});">
										<div class="tt-date">{formatLabel(chartData[hoverIndex].label)}</div>
										<div class="tt-val">{formatNumber(chartData[hoverIndex].value)} requests</div>
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
					<div class="mini-stats">
						<span>Month to date <b>{formatNumber(usage.monthToDate)}</b></span>
						<span>Peak day <b>{formatNumber(usage.peakDay)}</b>{#if usage.peakDayOn} · {formatLabel(usage.peakDayOn)}{/if}</span>
					</div>
					<p class="footnote">Counted by the site itself — a floor, not a bill. Cloudflare's dashboard stays the source of truth.</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Brand purple is NebulaKit's chrome colour here, the way Cloudflare orange is
	   the Cloudflare widget's. Data series take their colour from metricColors. */
	.nk-widget {
		--nk: #7c4dff;
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		gap: 0.55rem;
		padding: 0.75rem;
	}

	/* ─── Not connected ─── */
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
	.nk-logo { line-height: 0; }
	.nc-text {
		margin: 0;
		font-size: 0.78rem;
		color: var(--text-secondary);
		line-height: 1.45;
		max-width: 28ch;
	}
	.connect-btn {
		margin-top: 0.15rem;
		padding: 0.55rem 1.5rem;
		background: var(--nk);
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
		transition: filter 0.15s, transform 0.1s;
	}
	.connect-btn:hover { filter: brightness(1.08); }
	.connect-btn:active { transform: scale(0.97); }

	/* ─── Header ─── */
	.nk-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.site-pill {
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
		max-width: 60%;
		min-width: 0;
	}
	.site-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--nk); flex-shrink: 0; }
	.site-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
		text-decoration: none;
	}
	.icon-btn:hover { color: var(--text-primary); background: var(--surface-variant); }
	.icon-btn.spinning { animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
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

	/* ─── Tabs ─── */
	.nk-tabs {
		display: flex;
		gap: 0.15rem;
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.15rem;
	}
	.nk-tab {
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
	.nk-tab:hover { color: var(--text-primary); }
	.nk-tab.active { background: var(--surface); color: var(--nk); box-shadow: 0 1px 3px var(--shadow); }
	.tab-icon { font-size: 0.8rem; }

	/* ─── Timeframe ─── */
	.timeframe-bar { display: flex; gap: 0.2rem; }
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
	.tf-pill:hover { color: var(--text-primary); border-color: var(--nk); }
	.tf-pill.active { background: var(--nk); color: #fff; border-color: var(--nk); }

	/* ─── Body ─── */
	.nk-body {
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
	.state-msg p { margin: 0; }
	.spinner {
		width: 1.4rem;
		height: 1.4rem;
		border: 2px solid var(--border);
		border-top-color: var(--nk);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	.retry-btn {
		padding: 0.4rem 1rem;
		background: var(--nk);
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.75rem;
		cursor: pointer;
	}

	/* ─── Stats ─── */
	.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; }
	.stat {
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.5rem 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.stat-val {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}
	.stat-of { font-size: 0.72rem; font-weight: 600; color: var(--text-secondary); }
	.stat-lbl {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.resource-row { display: flex; gap: 0.35rem; }
	.resource-chip {
		flex: 1;
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.4rem;
		font-size: 0.66rem;
		color: var(--text-secondary);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.resource-chip b { color: var(--text-primary); font-size: 0.9rem; margin-right: 0.15rem; }
	.mini-stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.68rem;
		color: var(--text-secondary);
		padding: 0 0.1rem;
	}
	.mini-stats b { color: var(--text-primary); }
	.hint-line {
		margin: 0;
		font-size: 0.66rem;
		color: var(--text-secondary);
		background: var(--warning-bg);
		border-radius: 0.4rem;
		padding: 0.35rem 0.5rem;
	}
	.footnote { margin: 0; font-size: 0.62rem; line-height: 1.35; color: var(--text-secondary); }
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

	/* ─── Ranked rows (every list doubles as a bar chart) ─── */
	.panel { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
	.panel-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem 0.6rem; }
	.panel-title {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.1rem;
	}
	.panel-sub { font-weight: 600; text-transform: none; letter-spacing: 0; }
	.row {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.22rem 0.4rem;
		border-radius: 0.3rem;
		overflow: hidden;
		font-size: 0.72rem;
		min-width: 0;
	}
	.row-bar {
		position: absolute;
		inset: 0 auto 0 0;
		opacity: 0.14;
		border-radius: 0.3rem;
		pointer-events: none;
	}
	.row-label {
		position: relative;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
		text-decoration: none;
	}
	a.row-label:hover { text-decoration: underline; }
	.row-label.mono { font-family: ui-monospace, monospace; font-size: 0.68rem; }
	.row-val {
		position: relative;
		color: var(--text-primary);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.empty { margin: 0; font-size: 0.68rem; color: var(--text-secondary); padding: 0.2rem 0.4rem; }

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
		height: 120px;
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
	.tt-val { color: var(--text-primary); font-weight: 700; font-variant-numeric: tabular-nums; }
	.chart-xaxis {
		position: relative;
		height: 1.1rem;
		font-size: 0.58rem;
		color: var(--text-secondary);
		opacity: 0.7;
		margin-top: 0.1rem;
	}
	.x-label { position: absolute; white-space: nowrap; }
</style>
