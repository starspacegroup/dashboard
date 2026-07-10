<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';
	import type { Widget } from '$lib/types/widget';
	import { widgets, pendingSetupWidgetId } from '$lib/stores/widgets';
	import { cloudflareConnection } from '$lib/stores/cloudflareConnection';
	import { revealWidget } from '$lib/utils/revealWidget';

	export let widget: Widget;

	// Deep-link that opens Cloudflare's "Create Token" page with everything
	// pre-filled: a read-only permission set covering every widget tab, scoped
	// to all accounts + all zones, and a token name. The user just clicks
	// Continue to summary → Create Token → Copy. Verified against the live
	// dashboard — `page` is Cloudflare Pages, `analytics` is Zone Analytics.
	const TOKEN_PERMISSION_KEYS = [
		{ key: 'account_analytics', type: 'read' }, // Overview + Workers invocation stats
		{ key: 'analytics', type: 'read' }, // Zone (domain) traffic analytics
		{ key: 'zone', type: 'read' }, // List domains
		{ key: 'page', type: 'read' }, // Cloudflare Pages projects
		{ key: 'workers_scripts', type: 'read' } // Workers scripts
	];
	const CREATE_TOKEN_URL =
		'https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=' +
		encodeURIComponent(JSON.stringify(TOKEN_PERMISSION_KEYS)) +
		'&accountId=*&zoneId=all&name=' +
		encodeURIComponent('Dashboard (read-only)');
	// Plain tokens page, in case the user wants to manage tokens directly.
	const TOKEN_URL = 'https://dash.cloudflare.com/profile/api-tokens';
	const REFRESH_INTERVAL = 5 * 60 * 1000;

	type View = 'overview' | 'domains' | 'pages' | 'workers';
	const TABS: { id: View; label: string; icon: string }[] = [
		{ id: 'overview', label: 'Overview', icon: '◈' },
		{ id: 'domains', label: 'Domains', icon: '🌐' },
		{ id: 'pages', label: 'Pages', icon: '📄' },
		{ id: 'workers', label: 'Workers', icon: '⚡' }
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

	// ─── Connect-screen state ───────────────────────────
	let tokenInput = '';
	let connecting = false;
	let connectError = '';

	// ─── Account picker ─────────────────────────────────
	let accounts: { id: string; name: string }[] = [];
	let showAccountMenu = false;

	// ─── Per-view data ──────────────────────────────────
	let overview: { zonesCount: number; pagesCount: number; workersCount: number; totals: { requests: number; bytes: number; threats: number; cachedRequests: number }; series: { date: string; requests: number; bytes: number }[] } | null = null;
	let zones: { id: string; name: string; status: string; plan: string }[] = [];
	let zoneAnalytics: { series: { date: string; requests: number; bytes: number; cachedRequests: number; threats: number; pageViews: number; uniques: number }[]; totals: { requests: number; bytes: number; cachedRequests: number; threats: number; pageViews: number; uniques: number } } | null = null;
	let pages: { name: string; subdomain: string; domains: string[]; deployment: { environment: string; createdOn: string; url: string; status: string; stage: string; branch: string; message: string } | null }[] = [];
	let workers: { scripts: { name: string; modifiedOn: string; createdOn: string; requests: number | null; errors: number | null; cpuP50: number | null; cpuP99: number | null }[]; analyticsAvailable: boolean } | null = null;

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
			await loadAccounts();
		} catch (e) {
			connectError = e instanceof Error ? e.message : 'Failed to verify token.';
		} finally {
			connecting = false;
		}
	}

	function disconnect() {
		cloudflareConnection.disconnect();
		stopAutoRefresh();
		bootstrapped = false;
		accounts = [];
		accountId = '';
		accountName = '';
		overview = null;
		zones = [];
		zoneAnalytics = null;
		pages = [];
		workers = null;
		showAccountMenu = false;
		saveConfig();
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
		showAccountMenu = false;
		saveConfig();
		zones = [];
		selectedZoneId = '';
		overview = null;
		zoneAnalytics = null;
		pages = [];
		workers = null;
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
			} else if (view === 'workers') {
				workers = await api('workers', { accountId, days: String(days) }, skipCache);
			}
			await tick();
			measureChart();
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
			cloudflare: { accountId, accountName, view, zoneId: selectedZoneId, days }
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
		disconnect();
	}

	onMount(() => {
		if (!browser) return;

		if (get(pendingSetupWidgetId) === widget.id) {
			pendingSetupWidgetId.set(null);
			isFirstTimeSetup = true;
			// Reveal once the connect screen (or data) is in place
			setTimeout(() => {
				if (isFirstTimeSetup) {
					isFirstTimeSetup = false;
					revealWidget(widget.id, 300);
				}
			}, 200);
		}

		chartResizeObserver = new ResizeObserver(() => measureChart());
		if (chartContainer) chartResizeObserver.observe(chartContainer);

		window.addEventListener('cloudflare-disconnected', handleDisconnectedEvent);

		// Update title with account name
		if (accountName) widgets.updateTitle(widget.id, `Cloudflare · ${accountName}`);
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
	$: if (browser && accountName) widgets.updateTitle(widget.id, `Cloudflare · ${accountName}`);

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
		<!-- ─── Connect screen ─── -->
		<div class="connect">
			<div class="cf-logo" aria-hidden="true">
				<svg viewBox="0 0 48 32" width="52" height="35">
					<path fill="#f6821f" d="M35.9 20.2c.3-1 .2-1.9-.3-2.6-.4-.6-1.2-1-2.1-1l-17-.2c-.1 0-.2-.1-.3-.2 0-.1 0-.2.1-.2 0-.1.1-.2.3-.2l17.1-.2c2-.1 4.2-1.7 5-3.7l1-2.6c0-.1.1-.2 0-.3C35.6 3.3 30.9 0 25.4 0c-5.1 0-9.4 3.3-11 7.8-1-.8-2.4-1.2-3.8-1-2.6.3-4.6 2.4-4.9 5 0 .7 0 1.3.2 1.9C1.7 13.8 0 15.6 0 17.9c0 .2 0 .4.1.6 0 .1.1.2.2.2h31.4c.1 0 .2-.1.3-.2l.9-2.6z"/>
					<path fill="#fbad41" d="M40.6 9.3h-.5c-.1 0-.2.1-.2.2l-.6 2.1c-.3 1-.2 1.9.3 2.6.4.6 1.2 1 2.1 1l3.6.2c.1 0 .2.1.3.2 0 .1 0 .2-.1.2 0 .1-.1.2-.3.2l-3.8.2c-2 .1-4.2 1.7-5 3.7l-.2.7c-.1.1 0 .3.2.3h13c.1 0 .2-.1.2-.2.2-.8.4-1.7.4-2.6 0-4.9-4-8.9-9-8.9z"/>
				</svg>
			</div>
			<h3 class="connect-title">Connect Cloudflare</h3>
			<p class="connect-sub">See stats for your domains, Pages &amp; Workers. The button below opens Cloudflare with a read-only token already scoped for you — tokens don't expire, so you stay connected on every device.</p>

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
			<button class="connect-btn" on:click={connect} disabled={connecting || !tokenInput.trim()}>
				{connecting ? 'Verifying…' : 'Connect'}
			</button>
			<a class="manual-link" href={TOKEN_URL} target="_blank" rel="noopener noreferrer">or create a token manually</a>
		</div>
	{:else}
		<!-- ─── Header ─── -->
		<div class="cf-header">
			<button
				class="account-pill"
				on:click={() => (showAccountMenu = !showAccountMenu)}
				disabled={accounts.length <= 1}
				title={accounts.length > 1 ? 'Switch account' : accountName}
			>
				<span class="account-dot"></span>
				<span class="account-name">{accountName || 'Loading…'}</span>
				{#if accounts.length > 1}<span class="chev">▾</span>{/if}
			</button>
			<div class="header-actions">
				<button class="icon-btn" on:click={refresh} title="Refresh" class:spinning={loading}>
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg>
				</button>
				<button class="icon-btn" on:click={() => (showAccountMenu = !showAccountMenu)} title="Options">
					<svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
				</button>
			</div>
		</div>

		{#if showAccountMenu}
			<div class="account-menu">
				{#if accounts.length > 1}
					<div class="menu-label">Account</div>
					{#each accounts as acc}
						<button class="menu-item" class:active={acc.id === accountId} on:click={() => selectAccount(acc.id, acc.name)}>
							{acc.name}
						</button>
					{/each}
					<div class="menu-divider"></div>
				{/if}
				<button class="menu-item danger" on:click={disconnect}>Disconnect Cloudflare</button>
			</div>
		{/if}

		<!-- ─── Tabs ─── -->
		<div class="cf-tabs">
			{#each TABS as tab}
				<button class="cf-tab" class:active={view === tab.id} on:click={() => switchTab(tab.id)}>
					<span class="tab-icon">{tab.icon}</span>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</div>

		<!-- ─── Timeframe (analytics tabs) ─── -->
		{#if view === 'overview' || view === 'domains' || view === 'workers'}
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
			{:else if loading && !overview && !zones.length && !pages.length && !workers}
				<div class="state-msg"><div class="spinner"></div><p>Loading…</p></div>
			{:else if view === 'overview'}
				<!-- OVERVIEW -->
				{#if overview}
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
					{:else}
						<div class="state-msg small"><div class="spinner"></div></div>
					{/if}
				{/if}
			{:else if view === 'pages'}
				<!-- PAGES -->
				{#if pages.length === 0}
					<div class="state-msg"><p>No Pages projects found.</p></div>
				{:else}
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
				{#if !workers || workers.scripts.length === 0}
					<div class="state-msg"><p>No Workers found.</p></div>
				{:else}
					{#if !workers.analyticsAvailable}
						<p class="hint-line">Add <b>Account Analytics: Read</b> to your token to see invocation stats.</p>
					{/if}
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
			{/if}

			<!-- Shared analytics chart (overview + domains) -->
			{#if (view === 'overview' || view === 'domains') && chartData.length > 1 && !error}
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

	/* ─── Connect ─── */
	.connect {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.55rem;
		padding: 1rem 0.5rem;
		flex: 1;
		justify-content: center;
	}
	.cf-logo { line-height: 0; }
	.connect-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	.connect-sub {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.45;
		max-width: 34ch;
	}
	.create-token-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 320px;
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
		max-width: 32ch;
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
	.token-input {
		width: 100%;
		max-width: 320px;
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

	.account-menu {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.3rem;
		box-shadow: 0 6px 20px var(--shadow-strong);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.menu-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem 0.1rem;
	}
	.menu-item {
		text-align: left;
		background: none;
		border: none;
		padding: 0.4rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.78rem;
		color: var(--text-primary);
		cursor: pointer;
	}
	.menu-item:hover { background: var(--surface-variant); }
	.menu-item.active { color: #f6821f; font-weight: 700; }
	.menu-item.danger { color: var(--error); }
	.menu-divider { height: 1px; background: var(--border); margin: 0.2rem 0; }

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
</style>
