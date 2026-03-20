<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';
	import { analyticsConnection } from '$lib/stores/analyticsConnection';

	export let widget: Widget;

	// ─── Portal action (moves element to body to escape stacking contexts) ───
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) node.parentNode.removeChild(node);
			}
		};
	}

	// ─── Config ──────────────────────────────────────────
	const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min auto-refresh
	const REALTIME_POLL_INTERVAL = 30 * 1000; // 30s realtime polling
	const REALTIME_HISTORY_MAX = 60; // keep last 60 data points (~30 min)

	const METRIC_OPTIONS: { id: string; label: string; shortLabel: string; format: 'number' | 'percent' | 'duration' }[] = [
		{ id: 'sessions', label: 'Sessions', shortLabel: 'Sessions', format: 'number' },
		{ id: 'totalUsers', label: 'Total Users', shortLabel: 'Users', format: 'number' },
		{ id: 'newUsers', label: 'New Users', shortLabel: 'New', format: 'number' },
		{ id: 'activeUsers', label: 'Active Users', shortLabel: 'Active', format: 'number' },
		{ id: 'screenPageViews', label: 'Page Views', shortLabel: 'Views', format: 'number' },
		{ id: 'bounceRate', label: 'Bounce Rate', shortLabel: 'Bounce', format: 'percent' },
		{ id: 'averageSessionDuration', label: 'Avg Session Duration', shortLabel: 'Duration', format: 'duration' },
		{ id: 'engagementRate', label: 'Engagement Rate', shortLabel: 'Engage', format: 'percent' },
		{ id: 'eventsPerSession', label: 'Events / Session', shortLabel: 'Events', format: 'number' },
		{ id: 'sessionsPerUser', label: 'Sessions / User', shortLabel: 'Sess/User', format: 'number' },
		{ id: 'conversions', label: 'Conversions', shortLabel: 'Conv', format: 'number' }
	];

	const TIMEFRAME_OPTIONS = [
		{ days: 7, label: '7D' },
		{ days: 14, label: '14D' },
		{ days: 30, label: '30D' },
		{ days: 90, label: '90D' }
	];

	const CHART_COLORS = [
		'#7c3aed',
		'#22c55e',
		'#f97316',
		'#3b82f6',
		'#ef4444'
	];

	// ─── State ───────────────────────────────────────────
	let propertyId = widget.config?.analytics?.propertyId ?? '';
	let propertyName = widget.config?.analytics?.propertyName ?? '';
	let selectedMetrics: string[] = widget.config?.analytics?.metrics ?? ['sessions', 'totalUsers'];
	let days = widget.config?.analytics?.days ?? 7;
	let refreshToken = '';

	// Subscribe to the shared analytics connection store
	const unsubConnection = analyticsConnection.subscribe((conn) => {
		refreshToken = conn.refreshToken;
	});

	let isLoading = false;
	let error = '';
	let refreshTimer: ReturnType<typeof setInterval> | null = null;

	let showSettings = false;
	let settingsMetrics = [...selectedMetrics];

	// OAuth / property picker state
	let gaProperties: { propertyId: string; displayName: string; accountDisplayName: string }[] = [];
	let loadingProperties = false;
	let propertiesError = '';
	let selectedPropertyId = propertyId;

	// Report data
	let rows: Record<string, string | number>[] = [];
	let totals: Record<string, number> = {};
	let realtimeUsers = 0;

	// Live graph state
	let viewMode: 'history' | 'live' = 'history';
	let realtimeHistory: { time: Date; value: number }[] = [];
	let realtimeTimer: ReturnType<typeof setInterval> | null = null;
	let liveChartContainer: HTMLDivElement;
	let liveChartWidth = 0;
	let liveChartHeight = 0;
	let liveHovering = false;
	let liveHoverIndex = -1;

	// Chart interaction
	let chartContainer: HTMLDivElement;
	let isHovering = false;
	let hoverIndex = -1;
	let chartWidth = 0;
	let chartHeight = 0;

	// Active metric for the main chart line (first selected by default)
	let activeChartMetric = selectedMetrics[0] ?? 'sessions';

	$: if (selectedMetrics.length > 0 && !selectedMetrics.includes(activeChartMetric)) {
		activeChartMetric = selectedMetrics[0];
	}

	// ─── Y-axis data for active metric ────
	$: activeMetricValues = rows.map(r => Number(r[activeChartMetric] || 0));
	$: yMin = activeMetricValues.length > 0 ? Math.min(...activeMetricValues) : 0;
	$: yMax = activeMetricValues.length > 0 ? Math.max(...activeMetricValues) : 0;
	$: yMid = (yMin + yMax) / 2;

	// ─── Chart SVG computation (reactive, pixel-based like CryptoWidget) ────
	$: chartPoints = computeChartPoints(activeChartMetric, rows, chartWidth, chartHeight);
	$: chartLinePath = chartPoints.length > 0
		? 'M' + chartPoints.map(p => `${p.x},${p.y}`).join(' L')
		: '';
	$: chartAreaPath = chartLinePath && chartPoints.length > 0
		? `${chartLinePath} L${chartPoints[chartPoints.length - 1].x},${chartHeight} L${chartPoints[0].x},${chartHeight} Z`
		: '';

	// Compute secondary metric paths
	function getSecondaryPaths(metricId: string): { line: string; area: string } {
		const pts = computeChartPoints(metricId, rows, chartWidth, chartHeight);
		if (pts.length === 0) return { line: '', area: '' };
		const line = 'M' + pts.map(p => `${p.x},${p.y}`).join(' L');
		const area = `${line} L${pts[pts.length - 1].x},${chartHeight} L${pts[0].x},${chartHeight} Z`;
		return { line, area };
	}

	function computeChartPoints(metricId: string, data: Record<string, string | number>[], w: number, h: number) {
		if (!data.length || w <= 0 || h <= 0) return [];
		const vals = data.map(r => (r[metricId] as number) || 0);
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const range = max - min || 1;
		const padding = 6;
		const usableH = h - padding * 2;
		return vals.map((v, i) => ({
			x: (i / (vals.length - 1)) * w,
			y: padding + usableH - ((v - min) / range) * usableH,
			value: v,
			date: String(data[i].date)
		}));
	}

	function getHoverY(metricId: string, idx: number): number {
		const pts = computeChartPoints(metricId, rows, chartWidth, chartHeight);
		return pts[idx]?.y ?? 0;
	}

	// ─── Live chart SVG computation ─────────────────────
	$: liveChartPoints = computeLiveChartPoints(realtimeHistory, liveChartWidth, liveChartHeight);
	$: liveLinePath = liveChartPoints.length > 1
		? 'M' + liveChartPoints.map(p => `${p.x},${p.y}`).join(' L')
		: '';
	$: liveAreaPath = liveLinePath && liveChartPoints.length > 1
		? `${liveLinePath} L${liveChartPoints[liveChartPoints.length - 1].x},${liveChartHeight} L${liveChartPoints[0].x},${liveChartHeight} Z`
		: '';

	function computeLiveChartPoints(data: { time: Date; value: number }[], w: number, h: number) {
		if (data.length < 2 || w <= 0 || h <= 0) return [];
		const vals = data.map(d => d.value);
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const range = max - min || 1;
		const padding = 6;
		const usableH = h - padding * 2;
		return vals.map((v, i) => ({
			x: (i / (vals.length - 1)) * w,
			y: padding + usableH - ((v - min) / range) * usableH,
			value: v,
			time: data[i].time
		}));
	}

	function measureLiveChart() {
		if (!liveChartContainer) return;
		const rect = liveChartContainer.getBoundingClientRect();
		liveChartWidth = rect.width;
		liveChartHeight = rect.height;
	}

	function handleLiveChartMouseMove(e: MouseEvent) {
		if (!liveChartContainer || realtimeHistory.length < 2) return;
		measureLiveChart();
		const rect = liveChartContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const idx = Math.round((x / liveChartWidth) * (realtimeHistory.length - 1));
		liveHoverIndex = Math.max(0, Math.min(realtimeHistory.length - 1, idx));
		liveHovering = true;
	}

	function handleLiveChartTouchMove(e: TouchEvent) {
		if (!liveChartContainer || realtimeHistory.length < 2 || !e.touches[0]) return;
		measureLiveChart();
		const rect = liveChartContainer.getBoundingClientRect();
		const x = e.touches[0].clientX - rect.left;
		const idx = Math.round((x / liveChartWidth) * (realtimeHistory.length - 1));
		liveHoverIndex = Math.max(0, Math.min(realtimeHistory.length - 1, idx));
		liveHovering = true;
	}

	function handleLiveChartLeave() {
		liveHovering = false;
		liveHoverIndex = -1;
	}

	function formatLiveTime(date: Date): string {
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
	}

	function pushRealtimeHistory(value: number) {
		realtimeHistory = [...realtimeHistory, { time: new Date(), value }].slice(-REALTIME_HISTORY_MAX);
	}

	async function fetchRealtimeHistory() {
		if (!propertyId || !refreshToken) return;
		try {
			const params = new URLSearchParams({ action: 'realtime-history', propertyId });
			const res = await fetch(`/api/analytics?${params}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});
			if (res.ok) {
				const data = await res.json();
				if (data.history && data.history.length > 0) {
					realtimeHistory = data.history.map((h: { timestamp: string; activeUsers: number }) => ({
						time: new Date(h.timestamp),
						value: h.activeUsers
					}));
					// Update current realtime users to the latest value
					realtimeUsers = realtimeHistory[realtimeHistory.length - 1].value;
					await tick();
					measureLiveChart();
				}
			}
		} catch {
			// Silently ignore - will fall back to incremental polling
		}
	}

	function startRealtimePolling() {
		stopRealtimePolling();
		realtimeTimer = setInterval(async () => {
			await fetchRealtime();
			pushRealtimeHistory(realtimeUsers);
			measureLiveChart();
		}, REALTIME_POLL_INTERVAL);
	}

	function stopRealtimePolling() {
		if (realtimeTimer) {
			clearInterval(realtimeTimer);
			realtimeTimer = null;
		}
	}

	// ─── Data fetching ──────────────────────────────────

	async function fetchReport(skipCache = false) {
		if (!propertyId || !refreshToken) return;
		isLoading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				action: 'report',
				propertyId,
				metrics: selectedMetrics.join(','),
				days: String(days)
			});
			if (skipCache) params.set('skipCache', '1');

			const res = await fetch(`/api/analytics?${params}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || `HTTP ${res.status}`);
			}

			const data = await res.json();
			rows = data.rows ?? [];
			totals = data.totals ?? {};
			await tick();
			measureChart();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch analytics data';
		} finally {
			isLoading = false;
		}
	}

	async function fetchRealtime() {
		if (!propertyId || !refreshToken) return;
		try {
			const params = new URLSearchParams({ action: 'realtime', propertyId });
			const res = await fetch(`/api/analytics?${params}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});
			if (res.ok) {
				const data = await res.json();
				realtimeUsers = data.activeUsers ?? 0;
			}
		} catch {
			// Silently ignore realtime errors
		}
	}

	async function refresh() {
		await Promise.all([fetchReport(true), fetchRealtime()]);
	}

	function startAutoRefresh() {
		stopAutoRefresh();
		refreshTimer = setInterval(() => {
			fetchReport();
			fetchRealtime();
		}, REFRESH_INTERVAL);
	}

	function stopAutoRefresh() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}

	// Persist config (no longer stores refreshToken per widget)
	function saveConfig() {
		widgets.updateWidgetConfig(widget.id, {
			analytics: { propertyId, propertyName, metrics: selectedMetrics, days }
		});
	}

	// ─── Settings ────────────────────────────────────────

	function openSettings() {
		settingsMetrics = [...selectedMetrics];
		selectedPropertyId = propertyId;
		showSettings = true;
		if (refreshToken && gaProperties.length === 0) {
			fetchProperties();
		}
	}

	function applySettings() {
		selectedMetrics = settingsMetrics.length > 0 ? settingsMetrics : ['sessions'];
		if (selectedPropertyId !== propertyId) {
			propertyId = selectedPropertyId;
			const prop = gaProperties.find((p) => p.propertyId === propertyId);
			propertyName = prop ? prop.displayName : '';
		}
		showSettings = false;
		saveConfig();
		fetchReport(true);
		fetchRealtime();
	}

	// ─── OAuth (removed – connection is managed in Settings) ───

	function handleAnalyticsDisconnected() {
		propertyId = '';
		propertyName = '';
		gaProperties = [];
		rows = [];
		totals = {};
		realtimeUsers = 0;
		selectedPropertyId = '';
		saveConfig();
	}

	async function fetchProperties() {
		if (!refreshToken) return;
		loadingProperties = true;
		propertiesError = '';
		try {
			const params = new URLSearchParams({ action: 'properties' });
			const res = await fetch(`/api/analytics?${params}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});
			const data = await res.json();
			if (res.ok) {
				gaProperties = data.properties ?? [];
				if (gaProperties.length === 0) {
					propertiesError = 'No GA4 properties found for this account.';
				}
			} else {
				propertiesError = data.error || `Failed to load properties (HTTP ${res.status})`;
			}
		} catch (e) {
			propertiesError = e instanceof Error ? e.message : 'Failed to fetch properties';
		} finally {
			loadingProperties = false;
		}
	}

	function toggleSettingsMetric(metricId: string) {
		if (settingsMetrics.includes(metricId)) {
			if (settingsMetrics.length > 1) {
				settingsMetrics = settingsMetrics.filter((m) => m !== metricId);
			}
		} else if (settingsMetrics.length < 5) {
			settingsMetrics = [...settingsMetrics, metricId];
		}
	}

	// ─── Formatters ─────────────────────────────────────

	function getMetricInfo(metricId: string) {
		return METRIC_OPTIONS.find((m) => m.id === metricId);
	}

	function formatValue(metricId: string, value: number): string {
		const info = getMetricInfo(metricId);
		if (!info) return String(Math.round(value));

		switch (info.format) {
			case 'percent':
				return `${(value * 100).toFixed(1)}%`;
			case 'duration': {
				const mins = Math.floor(value / 60);
				const secs = Math.round(value % 60);
				return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
			}
			default:
				return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
		}
	}

	function formatChartDate(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatYAxisValue(metricId: string, value: number): string {
		const info = getMetricInfo(metricId);
		if (!info) return String(Math.round(value));
		switch (info.format) {
			case 'percent':
				return `${(value * 100).toFixed(0)}%`;
			case 'duration': {
				const mins = Math.floor(value / 60);
				return mins > 0 ? `${mins}m` : `${Math.round(value)}s`;
			}
			default:
				if (value >= 10000) return `${(value / 1000).toFixed(0)}k`;
				if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
				return String(Math.round(value));
		}
	}

	function computeXAxisLabels(data: Record<string, string | number>[]): { label: string; position: number; align: 'left' | 'center' | 'right' }[] {
		if (data.length === 0) return [];
		if (data.length === 1) {
			return [{ label: formatChartDate(String(data[0].date)), position: 50, align: 'center' }];
		}
		// Show every day when 7 or fewer data points; otherwise sample evenly
		const maxLabels = data.length <= 7 ? data.length : data.length <= 14 ? 7 : 7;
		const result: { label: string; position: number; align: 'left' | 'center' | 'right' }[] = [];
		for (let i = 0; i < maxLabels; i++) {
			const dataIdx = Math.round(i * (data.length - 1) / (maxLabels - 1));
			const position = (dataIdx / (data.length - 1)) * 100;
			// First label aligns left, last aligns right, rest center
			const align = i === 0 ? 'left' : i === maxLabels - 1 ? 'right' : 'center';
			result.push({
				label: formatChartDate(String(data[dataIdx].date)),
				position,
				align
			});
		}
		return result;
	}

	$: xAxisLabels = computeXAxisLabels(rows);

	function getMetricColor(metricId: string): string {
		const idx = selectedMetrics.indexOf(metricId);
		return CHART_COLORS[idx >= 0 ? idx % CHART_COLORS.length : 0];
	}

	// ─── Chart Interaction ──────────────────────────────

	function measureChart() {
		if (!chartContainer) return;
		const rect = chartContainer.getBoundingClientRect();
		chartWidth = rect.width;
		chartHeight = rect.height;
	}

	function handleChartMouseMove(e: MouseEvent) {
		if (!chartContainer || rows.length === 0) return;
		measureChart();
		const rect = chartContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const idx = Math.round((x / chartWidth) * (rows.length - 1));
		hoverIndex = Math.max(0, Math.min(rows.length - 1, idx));
		isHovering = true;
	}

	function handleChartTouchMove(e: TouchEvent) {
		if (!chartContainer || rows.length === 0 || !e.touches[0]) return;
		measureChart();
		const rect = chartContainer.getBoundingClientRect();
		const x = e.touches[0].clientX - rect.left;
		const idx = Math.round((x / chartWidth) * (rows.length - 1));
		hoverIndex = Math.max(0, Math.min(rows.length - 1, idx));
		isHovering = true;
	}

	function handleChartLeave() {
		isHovering = false;
		hoverIndex = -1;
	}

	// ─── Live Mode ─────────────────────────────────────

	async function switchToLive() {
		viewMode = 'live';
		if (realtimeHistory.length < 2) {
			await fetchRealtimeHistory();
		}
		startRealtimePolling();
	}

	// ─── Lifecycle ──────────────────────────────────────

	onMount(() => {
		if (browser) {
			// Migrate: if widget had a stored refreshToken, move it to the shared store
			const legacyToken = widget.config?.analytics?.refreshToken;
			if (legacyToken && !refreshToken) {
				analyticsConnection.connect(legacyToken);
				// Clear the per-widget token
				widgets.updateWidgetConfig(widget.id, {
					analytics: { ...widget.config?.analytics, refreshToken: undefined }
				});
			}
		}
		if (browser && propertyId && refreshToken) {
			fetchReport();
			fetchRealtimeHistory().then(() => {
				startRealtimePolling();
			});
			startAutoRefresh();
		}
		if (browser) {
			window.addEventListener('analytics-disconnected', handleAnalyticsDisconnected);
			const ro = new ResizeObserver(() => {
				measureChart();
				measureLiveChart();
			});
			if (chartContainer) ro.observe(chartContainer);
			if (liveChartContainer) ro.observe(liveChartContainer);
			return () => {
				ro.disconnect();
			};
		}
	});

	onDestroy(() => {
		stopAutoRefresh();
		stopRealtimePolling();
		unsubConnection();
		if (browser) {
			window.removeEventListener('analytics-disconnected', handleAnalyticsDisconnected);
		}
	});

	// React to timeframe changes
	$: if (browser && propertyId && days && refreshToken) {
		saveConfig();
		fetchReport(true);
	}

	// Dynamically update widget title with URL and live count
	$: if (browser && propertyName && realtimeUsers !== undefined) {
		widgets.updateTitle(widget.id, `${propertyName} · ${realtimeUsers} live`);
	}
</script>

<div class="analytics-widget">
	{#if !propertyId}
		<div class="empty-state">
			<svg class="empty-icon-svg" viewBox="0 0 48 48" fill="none">
				<rect x="6" y="24" width="8" height="18" rx="2" fill="var(--primary-color)" opacity="0.3" />
				<rect x="20" y="16" width="8" height="26" rx="2" fill="var(--primary-color)" opacity="0.5" />
				<rect x="34" y="8" width="8" height="34" rx="2" fill="var(--primary-color)" opacity="0.8" />
			</svg>
			<p class="empty-title">Select a Property</p>
			<p class="empty-hint">Choose which GA4 property to display</p>
			<button class="setup-button" on:click={openSettings}>Select Property</button>
		</div>
	{:else if isLoading && rows.length === 0}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading analytics…</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>⚠️ {error}</p>
			<button class="retry-button" on:click={() => fetchReport(true)}>Retry</button>
		</div>
	{:else}
		<!-- Top bar: actions -->
		<div class="top-bar">
			<div></div>
			<div class="top-bar-right">
				<button class="icon-btn" on:click={openSettings} title="Settings">
					<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
						<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
					</svg>
				</button>
				<button class="icon-btn" on:click={refresh} title="Refresh data" class:spinning={isLoading}>
					<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
						<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Timeframe + Live pills -->
		<div class="timeframe-bar">
			<button
				class="tf-pill live-pill"
				class:active={viewMode === 'live'}
				on:click={switchToLive}
			>
				<span class="live-dot"></span>
				Live
			</button>
			{#each TIMEFRAME_OPTIONS as tf}
				<button
					class="tf-pill"
					class:active={viewMode === 'history' && days === tf.days}
					on:click={() => { viewMode = 'history'; days = tf.days; }}
				>
					{tf.label}
				</button>
			{/each}
		</div>

		{#if viewMode === 'history'}
			<!-- Metric cards -->
			<div class="metric-cards">
				{#each selectedMetrics as metricId, idx}
					{@const info = getMetricInfo(metricId)}
					{@const value = totals[metricId] ?? 0}
					{@const color = CHART_COLORS[idx % CHART_COLORS.length]}
					<div
						class="metric-card"
						style="--card-color: {color};"
					>
						<div class="metric-card-bar" style="background: {color};"></div>
						<span class="metric-card-value">{formatValue(metricId, value)}</span>
						<span class="metric-card-label">{info?.shortLabel ?? metricId}</span>
					</div>
				{/each}
			</div>

			<!-- Chart -->
			{#if rows.length > 1}
				<div class="chart-area">
					<div class="y-axis-labels">
						<span>{formatYAxisValue(activeChartMetric, yMax)}</span>
						<span>{formatYAxisValue(activeChartMetric, yMid)}</span>
						<span>{formatYAxisValue(activeChartMetric, yMin)}</span>
					</div>
					<div class="chart-inner">
						<div
							class="chart-wrap"
							bind:this={chartContainer}
							on:mousemove={handleChartMouseMove}
							on:mouseleave={handleChartLeave}
							on:touchmove|preventDefault={handleChartTouchMove}
							on:touchend={handleChartLeave}
							role="img"
							aria-label="Analytics chart for {getMetricInfo(activeChartMetric)?.label}"
						>
					<svg width="100%" height="100%" class="chart-svg">
						<!-- Gradient defs -->
						{#each selectedMetrics as metricId, idx}
							{@const color = CHART_COLORS[idx % CHART_COLORS.length]}
							<defs>
								<linearGradient id="grad-{metricId}" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color={color} stop-opacity="0.2" />
									<stop offset="100%" stop-color={color} stop-opacity="0" />
								</linearGradient>
							</defs>
						{/each}

						<!-- Horizontal grid -->
						{#each [0.25, 0.5, 0.75] as frac}
							<line
								x1="0" y1={chartHeight * frac}
								x2={chartWidth} y2={chartHeight * frac}
								class="grid-line"
							/>
						{/each}

						<!-- All metric areas and lines (rendered equally) -->
						{#each selectedMetrics as metricId, idx}
							{@const paths = metricId === activeChartMetric ? { line: chartLinePath, area: chartAreaPath } : getSecondaryPaths(metricId)}
							<path d={paths.area} fill="url(#grad-{metricId})" />
							<path
								d={paths.line}
								fill="none"
								stroke={CHART_COLORS[idx % CHART_COLORS.length]}
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/each}

						<!-- Hover crosshair & dots -->
						{#if isHovering && hoverIndex >= 0}
							{@const xPos = rows.length > 1 ? (hoverIndex / (rows.length - 1)) * chartWidth : 0}
							<line x1={xPos} y1="0" x2={xPos} y2={chartHeight} class="crosshair" />
							{#each selectedMetrics as metricId, idx}
								{@const yPos = getHoverY(metricId, hoverIndex)}
								<circle
									cx={xPos} cy={yPos} r="4.5"
									fill={CHART_COLORS[idx % CHART_COLORS.length]}
									stroke="var(--surface)"
									stroke-width="2"
								/>
							{/each}
						{/if}
					</svg>

					<!-- Hover tooltip -->
					{#if isHovering && hoverIndex >= 0 && rows[hoverIndex]}
						{@const hoverRow = rows[hoverIndex]}
						{@const pct = rows.length > 1 ? (hoverIndex / (rows.length - 1)) * 100 : 50}
						<div
							class="chart-tooltip"
							style="left: {pct}%; transform: translateX({pct > 75 ? '-90%' : pct < 25 ? '-10%' : '-50%'});"
						>
							<div class="tooltip-date">{formatChartDate(String(hoverRow.date))}</div>
							{#each selectedMetrics as metricId, idx}
								{@const metricVal = Number(hoverRow[metricId] || 0)}
								<div class="tooltip-row">
									<span class="tooltip-dot" style="background: {CHART_COLORS[idx % CHART_COLORS.length]};"></span>
									<span class="tooltip-metric-label">{getMetricInfo(metricId)?.shortLabel}</span>
									<span class="tooltip-metric-value">{formatValue(metricId, metricVal)}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- X-axis labels -->
				<div class="x-axis">
					{#each xAxisLabels as tick}
						<span
							class="x-label"
							style="left: {tick.position}%; {tick.align === 'left' ? 'transform: none;' : tick.align === 'right' ? 'transform: translateX(-100%);' : 'transform: translateX(-50%);'}"
						>{tick.label}</span>
					{/each}
				</div>
					</div>
				</div>
			{:else}
				<div class="empty-chart">
					<p>Not enough data to display</p>
				</div>
			{/if}

			<!-- Legend -->
			{#if selectedMetrics.length > 1}
				<div class="legend">
					{#each selectedMetrics as metricId, idx}
						<span class="legend-item">
							<span class="legend-dot" style="background: {CHART_COLORS[idx % CHART_COLORS.length]};"></span>
							{getMetricInfo(metricId)?.shortLabel}
						</span>
					{/each}
				</div>
			{/if}
		{:else}
			<!-- ─── Live View ─── -->
			<div class="live-section">
				<div class="live-header">
					<div class="live-current">
						<span class="live-current-value">{realtimeUsers}</span>
						<span class="live-current-label">active users</span>
					</div>
					<span class="live-interval-hint">Updates every 30s</span>
				</div>

				{#if realtimeHistory.length > 1}
					<div
						class="chart-wrap"
						bind:this={liveChartContainer}
						on:mousemove={handleLiveChartMouseMove}
						on:mouseleave={handleLiveChartLeave}
						on:touchmove|preventDefault={handleLiveChartTouchMove}
						on:touchend={handleLiveChartLeave}
						role="img"
						aria-label="Live active users chart"
					>
						<svg width="100%" height="100%" class="chart-svg">
							<defs>
								<linearGradient id="grad-live" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="var(--success)" stop-opacity="0.3" />
									<stop offset="100%" stop-color="var(--success)" stop-opacity="0" />
								</linearGradient>
							</defs>

							<!-- Horizontal grid -->
							{#each [0.25, 0.5, 0.75] as frac}
								<line
									x1="0" y1={liveChartHeight * frac}
									x2={liveChartWidth} y2={liveChartHeight * frac}
									class="grid-line"
								/>
							{/each}

							<!-- Area & line -->
							<path d={liveAreaPath} fill="url(#grad-live)" />
							<path
								d={liveLinePath}
								fill="none"
								stroke="var(--success)"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>

							<!-- Pulsing dot at latest point -->
							{#if liveChartPoints.length > 0}
								{@const lastPt = liveChartPoints[liveChartPoints.length - 1]}
								<circle cx={lastPt.x} cy={lastPt.y} r="6" fill="var(--success)" opacity="0.3" class="pulse-ring" />
								<circle cx={lastPt.x} cy={lastPt.y} r="4" fill="var(--success)" stroke="var(--surface)" stroke-width="2" />
							{/if}

							<!-- Hover crosshair & dot -->
							{#if liveHovering && liveHoverIndex >= 0 && liveChartPoints[liveHoverIndex]}
								{@const pt = liveChartPoints[liveHoverIndex]}
								<line x1={pt.x} y1="0" x2={pt.x} y2={liveChartHeight} class="crosshair" />
								<circle cx={pt.x} cy={pt.y} r="4.5" fill="var(--success)" stroke="var(--surface)" stroke-width="2" />
							{/if}
						</svg>

						<!-- Hover tooltip -->
						{#if liveHovering && liveHoverIndex >= 0 && realtimeHistory[liveHoverIndex]}
							{@const entry = realtimeHistory[liveHoverIndex]}
							{@const pct = realtimeHistory.length > 1 ? (liveHoverIndex / (realtimeHistory.length - 1)) * 100 : 50}
							<div
								class="chart-tooltip"
								style="left: {pct}%; transform: translateX({pct > 75 ? '-90%' : pct < 25 ? '-10%' : '-50%'});"
							>
								<div class="tooltip-date">{formatLiveTime(entry.time)}</div>
								<div class="tooltip-row">
									<span class="tooltip-dot" style="background: var(--success);"></span>
									<span class="tooltip-metric-label">Active</span>
									<span class="tooltip-metric-value">{entry.value}</span>
								</div>
							</div>
						{/if}
					</div>

					<!-- X-axis time labels -->
					<div class="x-axis">
						<span>{formatLiveTime(realtimeHistory[0].time)}</span>
						{#if realtimeHistory.length > 4}
							<span>{formatLiveTime(realtimeHistory[Math.floor(realtimeHistory.length / 2)].time)}</span>
						{/if}
						<span>{formatLiveTime(realtimeHistory[realtimeHistory.length - 1].time)}</span>
					</div>
				{:else}
					<div class="empty-chart">
						<div class="live-waiting">
							<div class="spinner small"></div>
							<p>Loading live data…</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Settings Modal -->
	{#if showSettings}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="settings-overlay" use:portal on:click={() => (showSettings = false)}>
			<div class="settings-panel" on:click|stopPropagation>
				<div class="settings-header">
					<h3>Analytics Settings</h3>
					<button class="settings-close" on:click={() => (showSettings = false)}>✕</button>
				</div>

				<div class="settings-section">
					<span class="settings-section-title">GA4 Property</span>
					{#if loadingProperties}
						<div class="prop-loading">
							<div class="spinner small"></div>
							Loading properties…
						</div>
					{:else if gaProperties.length > 0}
						<select class="settings-select" bind:value={selectedPropertyId}>
							<option value="">— Select a property —</option>
							{#each gaProperties as prop}
								<option value={prop.propertyId}>
									{prop.displayName} ({prop.accountDisplayName})
								</option>
							{/each}
						</select>
					{:else}
						{#if propertiesError}
							<span class="settings-error">{propertiesError}</span>
						{:else}
							<span class="settings-hint">No properties found. Make sure your Google account has access to GA4 properties.</span>
						{/if}
						<button class="refresh-props-btn" on:click={fetchProperties}>Retry</button>
					{/if}
				</div>

				<div class="settings-section">
					<span class="settings-section-title">Metrics <span class="settings-meta">(up to 5)</span></span>
					<div class="metrics-grid">
						{#each METRIC_OPTIONS as metric}
							<button
								class="metric-chip"
								class:selected={settingsMetrics.includes(metric.id)}
								on:click={() => toggleSettingsMetric(metric.id)}
							>
								{metric.label}
							</button>
						{/each}
					</div>
				</div>

				<div class="settings-actions">
					<button class="cancel-btn" on:click={() => (showSettings = false)}>Cancel</button>
					<button class="apply-btn" on:click={applySettings} disabled={!selectedPropertyId}>Apply</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.analytics-widget {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		min-height: 0;
		height: 100%;
	}

	/* ─── Empty / Loading / Error states ─── */
	.empty-state,
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		text-align: center;
		color: var(--text-secondary);
		flex: 1;
	}

	.empty-icon-svg {
		width: 56px;
		height: 56px;
		margin-bottom: 0.25rem;
	}

	.empty-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		opacity: 0.7;
		margin: 0;
	}

	.setup-button,
	.retry-button {
		margin-top: 0.5rem;
		padding: 0.55rem 1.25rem;
		background: var(--primary-color);
		color: var(--primary-color-text, #fff);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.15s, transform 0.1s;
	}

	.setup-button:hover,
	.retry-button:hover {
		background: var(--primary-color-hover);
	}

	.setup-button:active,
	.retry-button:active {
		transform: scale(0.97);
	}

	.spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--border);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner.small {
		width: 1rem;
		height: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ─── Top bar ─── */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* ─── Live section ─── */
	.live-section {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		flex: 1;
	}

	.live-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.live-current {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.live-current-value {
		font-size: 2rem;
		font-weight: 800;
		color: var(--success);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.live-current-label {
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.live-interval-hint {
		font-size: 0.6rem;
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.live-waiting {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	.live-waiting p {
		margin: 0;
	}

	.pulse-ring {
		animation: pulse-ring-anim 2s ease-in-out infinite;
	}

	@keyframes pulse-ring-anim {
		0%, 100% { r: 6; opacity: 0.3; }
		50% { r: 10; opacity: 0; }
	}

	.top-bar-right {
		display: flex;
		gap: 0.15rem;
		flex-shrink: 0;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 0.375rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s, background 0.15s;
	}

	.icon-btn:hover {
		color: var(--text-primary);
		background: var(--surface-variant);
	}

	.icon-btn.spinning {
		animation: spin 0.8s linear infinite;
	}

	/* ─── Metric cards ─── */
	.metric-cards {
		display: flex;
		gap: 0.4rem;
	}

	.metric-card {
		flex: 1 1 0;
		min-width: 0;
		padding: 0.5rem 0.55rem 0.4rem;
		border-radius: 0.5rem;
		background: var(--surface-variant);
		border: 1.5px solid transparent;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		position: relative;
		overflow: hidden;
	}

	.metric-card:hover {
		background: var(--surface);
		box-shadow: 0 1px 4px var(--shadow);
	}

	.metric-card-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		border-radius: 2px 2px 0 0;
	}

	.metric-card-value {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.metric-card-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ─── Timeframe pills ─── */
	.timeframe-bar {
		display: flex;
		gap: 0.2rem;
		background: var(--surface-variant);
		border-radius: 0.5rem;
		padding: 0.15rem;
	}

	.tf-pill {
		flex: 1;
		padding: 0.25rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tf-pill:hover {
		color: var(--text-primary);
	}

	.tf-pill.active {
		background: var(--primary-color);
		color: var(--primary-color-text, #fff);
		box-shadow: 0 1px 3px var(--shadow);
	}

	.live-pill {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.live-pill.active {
		background: var(--success);
	}

	.live-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--success);
		animation: pulse-dot 2s ease-in-out infinite;
	}

	.live-pill.active .live-dot {
		background: var(--primary-color-text, #fff);
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	/* ─── Chart ─── */
	.chart-area {
		display: flex;
		gap: 0.35rem;
		flex-shrink: 0;
	}

	.y-axis-labels {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-end;
		font-size: 0.55rem;
		color: var(--text-secondary);
		opacity: 0.7;
		padding: 6px 0;
		min-width: 2.2rem;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.chart-inner {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.chart-wrap {
		position: relative;
		width: 100%;
		height: 180px;
		cursor: crosshair;
		border-radius: 0.5rem;
		overflow: hidden;
		flex-shrink: 0;
	}

	.chart-svg {
		display: block;
	}

	.grid-line {
		stroke: var(--border);
		stroke-width: 0.5;
		stroke-dasharray: 4 4;
		opacity: 0.5;
	}

	.crosshair {
		stroke: var(--text-secondary);
		stroke-width: 0.75;
		stroke-dasharray: 3 3;
		opacity: 0.4;
	}

	/* ─── Tooltip ─── */
	.chart-tooltip {
		position: absolute;
		top: 4px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.45rem 0.6rem;
		font-size: 0.7rem;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 4px 16px var(--shadow-strong);
		z-index: 10;
	}

	.tooltip-date {
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.2rem;
		font-size: 0.65rem;
	}

	.tooltip-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.tooltip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tooltip-metric-label {
		opacity: 0.8;
		font-size: 0.65rem;
	}

	.tooltip-metric-value {
		font-weight: 600;
		color: var(--text-primary);
		margin-left: auto;
		padding-left: 0.5rem;
		font-variant-numeric: tabular-nums;
	}

	/* ─── X-axis ─── */
	.x-axis {
		position: relative;
		height: 1.1rem;
		font-size: 0.6rem;
		color: var(--text-secondary);
		opacity: 0.7;
		margin-top: 0.15rem;
	}

	.x-label {
		position: absolute;
		white-space: nowrap;
	}

	/* ─── Legend ─── */
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		justify-content: center;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: var(--text-primary);
		background: none;
		border: none;
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
	}

	.legend-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.empty-chart {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	/* ─── Settings overlay ─── */
	.settings-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100000;
	}

	.settings-panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 1rem;
		padding: 1.25rem;
		width: min(420px, 90vw);
		max-height: 80vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		box-shadow: 0 12px 48px var(--shadow-strong);
	}

	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.settings-panel h3 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1rem;
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

	.settings-close:hover {
		color: var(--text-primary);
		background: var(--surface-variant);
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	.settings-meta {
		font-weight: 400;
		color: var(--text-secondary);
		font-size: 0.7rem;
	}

	.settings-hint {
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-weight: 400;
	}

	.settings-error {
		font-size: 0.7rem;
		color: var(--error);
		font-weight: 400;
	}

	.settings-select {
		padding: 0.5rem 0.75rem;
		background: var(--surface-variant);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-size: 0.8rem;
		appearance: none;
		cursor: pointer;
	}

	.settings-select:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: 2px;
	}

	.prop-loading {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.25rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.refresh-props-btn {
		align-self: flex-start;
		padding: 0.3rem 0.65rem;
		background: var(--surface-variant);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
	}

	.refresh-props-btn:hover {
		border-color: var(--primary-color);
	}

	.metrics-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.15rem;
	}

	.metric-chip {
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: var(--surface-variant);
		color: var(--text-secondary);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s;
		font-weight: 500;
	}

	.metric-chip:hover {
		border-color: var(--primary-color);
		color: var(--text-primary);
	}

	.metric-chip.selected {
		background: var(--primary-color);
		color: var(--primary-color-text, #fff);
		border-color: var(--primary-color);
	}

	.settings-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.cancel-btn,
	.apply-btn {
		padding: 0.45rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.cancel-btn {
		background: var(--surface-variant);
		color: var(--text-primary);
	}

	.cancel-btn:hover {
		background: var(--border);
	}

	.apply-btn {
		background: var(--primary-color);
		color: var(--primary-color-text, #fff);
	}

	.apply-btn:hover:not(:disabled) {
		background: var(--primary-color-hover);
	}

	.apply-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
