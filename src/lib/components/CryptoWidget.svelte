<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';

	export let widget: Widget;

	// ─── Config ──────────────────────────────────────────
	const DEFAULT_COIN = 'bitcoin';
	const DEFAULT_VS = 'usd';
	const DEFAULT_DAYS = 7;
	const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min (matches server cache)
	const POPULAR_COINS = [
		{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
		{ id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
		{ id: 'solana', symbol: 'SOL', name: 'Solana' },
		{ id: 'cardano', symbol: 'ADA', name: 'Cardano' },
		{ id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
		{ id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
		{ id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
		{ id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' }
	];

	const VS_CURRENCIES = [
		{ id: 'usd', symbol: '$', name: 'US Dollar' },
		{ id: 'eur', symbol: '€', name: 'Euro' },
		{ id: 'gbp', symbol: '£', name: 'British Pound' },
		{ id: 'jpy', symbol: '¥', name: 'Japanese Yen' },
		{ id: 'btc', symbol: '₿', name: 'Bitcoin' },
		{ id: 'eth', symbol: 'Ξ', name: 'Ethereum' }
	];

	const TIMEFRAME_OPTIONS = [
		{ days: 1, label: '24H' },
		{ days: 7, label: '7D' },
		{ days: 30, label: '1M' },
		{ days: 90, label: '3M' },
		{ days: 365, label: '1Y' }
	];

	// ─── State ───────────────────────────────────────────
	let coinId = widget.config?.crypto?.coinId || DEFAULT_COIN;
	let vsCurrency = widget.config?.crypto?.vsCurrency || DEFAULT_VS;
	let days = widget.config?.crypto?.days || DEFAULT_DAYS;

	let isLoading = true;
	let error = '';
	let showCoinSearch = false;
	let searchQuery = '';
	let searchResults: Array<{ id: string; name: string; symbol: string; thumb: string; marketCapRank: number }> = [];
	let isSearching = false;
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let refreshTimer: ReturnType<typeof setInterval> | null = null;

	// Price data — all derived from chart series
	let currentPrice = 0;
	let priceChangePercent = 0;
	let high = 0;
	let low = 0;
	let coinName = '';
	let coinSymbol = '';

	// Chart data
	let chartPrices: [number, number][] = [];
	let chartMin = 0;
	let chartMax = 0;

	// Interactive chart state
	let chartContainer: HTMLDivElement;
	let isHovering = false;
	let hoverIndex = -1;
	let hoverPrice = 0;
	let hoverTime = '';
	let hoverX = 0;
	let hoverY = 0;
	let chartWidth = 0;
	let chartHeight = 0;

	// Reactive: derive change labels from selected timeframe
	$: displayChangeLabel = days <= 1 ? '24h'
		: days <= 7 ? '7d'
		: days <= 30 ? '30d'
		: days <= 90 ? '3m'
		: '1y';

	// Displayed price reacts to chart hover
	$: displayPrice = isHovering && hoverIndex >= 0 ? hoverPrice : currentPrice;
	$: displayChangePercent = isHovering && hoverIndex >= 0 && chartPrices.length > 1
		? (chartPrices[0][1] !== 0 ? ((hoverPrice - chartPrices[0][1]) / chartPrices[0][1]) * 100 : 0)
		: priceChangePercent;

	$: isPositive = displayChangePercent >= 0;

	$: vsSymbol = VS_CURRENCIES.find(c => c.id === vsCurrency)?.symbol || '$';

	// ─── Chart SVG computation ───────────────────────────
	$: chartPoints = computeChartPoints(chartPrices, chartWidth, chartHeight);
	$: chartLinePath = chartPoints.length > 0
		? 'M' + chartPoints.map(p => `${p.x},${p.y}`).join(' L')
		: '';
	$: chartAreaPath = chartLinePath && chartPoints.length > 0
		? `${chartLinePath} L${chartPoints[chartPoints.length - 1].x},${chartHeight} L${chartPoints[0].x},${chartHeight} Z`
		: '';

	function computeChartPoints(prices: [number, number][], w: number, h: number) {
		if (!prices.length || w <= 0 || h <= 0) return [];
		const vals = prices.map(p => p[1]);
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const range = max - min || 1;
		const padding = 2;
		const usableH = h - padding * 2;
		return prices.map((p, i) => ({
			x: (i / (prices.length - 1)) * w,
			y: padding + usableH - ((p[1] - min) / range) * usableH,
			price: p[1],
			time: p[0]
		}));
	}

	// ─── Data Fetching — single API call per refresh ────
	async function fetchData() {
		isLoading = true;
		error = '';
		try {
			const res = await fetch(`/api/crypto?action=chart&coinId=${encodeURIComponent(coinId)}&vs=${encodeURIComponent(vsCurrency)}&days=${days}`);
			if (!res.ok) throw new Error('Failed to fetch chart');
			const data = await res.json();
			chartPrices = data.prices || [];
			if (chartPrices.length > 1) {
				const vals = chartPrices.map((p: [number, number]) => p[1]);
				chartMin = Math.min(...vals);
				chartMax = Math.max(...vals);
				// Derive displayed values from the price series
				currentPrice = vals[vals.length - 1];
				high = chartMax;
				low = chartMin;
				const startPrice = vals[0];
				priceChangePercent = startPrice !== 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
			}
			// Coin name/symbol from selected popular coin or config
			const match = POPULAR_COINS.find(c => c.id === coinId);
			if (match) {
				coinName = match.name;
				coinSymbol = match.symbol;
			} else if (!coinName) {
				// Use coinId as fallback until a search result sets it
				coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1);
				coinSymbol = coinId.toUpperCase().slice(0, 5);
			}
		} catch (err) {
			console.error('Error fetching crypto data:', err);
			error = 'Failed to load data';
		}
		isLoading = false;
	}

	async function searchCoins(query: string) {
		if (!query.trim()) {
			searchResults = [];
			return;
		}
		isSearching = true;
		try {
			const res = await fetch(`/api/crypto?action=search&q=${encodeURIComponent(query)}`);
			if (!res.ok) throw new Error('Search failed');
			const data = await res.json();
			searchResults = data.coins || [];
		} catch {
			searchResults = [];
		}
		isSearching = false;
	}

	function handleSearchInput() {
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => searchCoins(searchQuery), 350);
	}

	function selectCoin(id: string) {
		// Set name/symbol from search results if available
		const fromSearch = searchResults.find(c => c.id === id);
		if (fromSearch) {
			coinName = fromSearch.name;
			coinSymbol = fromSearch.symbol?.toUpperCase() || '';
		}
		coinId = id;
		showCoinSearch = false;
		searchQuery = '';
		searchResults = [];
		saveConfig();
		fetchData();
	}

	function selectTimeframe(d: number) {
		days = d;
		saveConfig();
		fetchData();
	}

	function selectCurrency(vs: string) {
		vsCurrency = vs;
		saveConfig();
		fetchData();
	}

	function saveConfig() {
		widgets.updateWidgetConfig(widget.id, {
			crypto: { coinId, vsCurrency, days }
		});
	}

	// ─── Chart Interaction ───────────────────────────────
	function handleChartMouseMove(e: MouseEvent) {
		if (!chartContainer || chartPoints.length === 0) return;
		const rect = chartContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const idx = Math.round((x / rect.width) * (chartPoints.length - 1));
		const clamped = Math.max(0, Math.min(chartPoints.length - 1, idx));
		isHovering = true;
		hoverIndex = clamped;
		hoverPrice = chartPoints[clamped].price;
		hoverTime = formatChartTime(chartPrices[clamped][0]);
		hoverX = chartPoints[clamped].x;
		hoverY = chartPoints[clamped].y;
	}

	function handleChartTouchMove(e: TouchEvent) {
		if (!chartContainer || chartPoints.length === 0 || !e.touches.length) return;
		const rect = chartContainer.getBoundingClientRect();
		const x = e.touches[0].clientX - rect.left;
		const idx = Math.round((x / rect.width) * (chartPoints.length - 1));
		const clamped = Math.max(0, Math.min(chartPoints.length - 1, idx));
		isHovering = true;
		hoverIndex = clamped;
		hoverPrice = chartPoints[clamped].price;
		hoverTime = formatChartTime(chartPrices[clamped][0]);
		hoverX = chartPoints[clamped].x;
		hoverY = chartPoints[clamped].y;
	}

	function handleChartMouseLeave() {
		isHovering = false;
		hoverIndex = -1;
	}

	function handleChartTouchEnd() {
		isHovering = false;
		hoverIndex = -1;
	}

	// ─── Formatters ──────────────────────────────────────
	function formatPrice(price: number): string {
		if (vsCurrency === 'btc' || vsCurrency === 'eth') {
			return price < 0.0001 ? price.toExponential(2) : price.toFixed(6);
		}
		if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		if (price >= 1) return price.toFixed(2);
		if (price >= 0.01) return price.toFixed(4);
		return price.toFixed(6);
	}

	function formatCompact(num: number): string {
		if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
		if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
		if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
		if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
		return num.toFixed(2);
	}

	function formatPercent(pct: number): string {
		return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
	}

	function formatChartTime(timestamp: number): string {
		const d = new Date(timestamp);
		if (days <= 1) {
			return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
		}
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// ─── ResizeObserver for chart ────────────────────────
	let resizeObserver: ResizeObserver | null = null;

	function observeChart(node: HTMLDivElement) {
		chartContainer = node;
		resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				chartWidth = entry.contentRect.width;
				chartHeight = entry.contentRect.height;
			}
		});
		resizeObserver.observe(node);
	}

	// ─── Lifecycle ───────────────────────────────────────
	onMount(() => {
		if (browser) {
			fetchData();
			refreshTimer = setInterval(fetchData, REFRESH_INTERVAL);
		}
	});

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
		if (searchTimeout) clearTimeout(searchTimeout);
		if (resizeObserver) resizeObserver.disconnect();
	});
</script>

<div class="crypto-widget" class:loading={isLoading}>
	{#if isLoading && !coinName}
		<!-- Initial skeleton loader -->
		<div class="skeleton-wrap">
			<div class="skeleton-header">
				<div class="skeleton-circle" />
				<div class="skeleton-lines">
					<div class="skeleton-line w60" />
					<div class="skeleton-line w40" />
				</div>
			</div>
			<div class="skeleton-chart" />
			<div class="skeleton-row">
				<div class="skeleton-line w30" />
				<div class="skeleton-line w30" />
				<div class="skeleton-line w30" />
			</div>
		</div>
	{:else if error && !coinName}
		<div class="error-state">
			<span class="error-icon">⚠</span>
			<p>{error}</p>
			<button class="retry-btn" on:click={fetchData}>Retry</button>
		</div>
	{:else}
		<!-- ─── Header ─────────────────────────────────── -->
		<div class="header">
			<button class="coin-selector" on:click={() => (showCoinSearch = !showCoinSearch)} aria-label="Select cryptocurrency">
				<span class="coin-icon-placeholder">₿</span>
				<div class="coin-info">
					<span class="coin-name">{coinName}</span>
					<span class="coin-symbol">{coinSymbol}</span>
				</div>
				<svg class="chevron" class:open={showCoinSearch} width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
					<path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>

			<div class="price-block">
				<span class="current-price" class:hovering={isHovering && hoverIndex >= 0}>{vsSymbol}{formatPrice(displayPrice)}</span>
				<span class="price-change" class:positive={isPositive} class:negative={!isPositive}>
					{formatPercent(displayChangePercent)}
					<span class="change-label">{isHovering && hoverIndex >= 0 ? hoverTime : displayChangeLabel}</span>
				</span>
			</div>
		</div>

		<!-- ─── Coin Search Dropdown ───────────────────── -->
		{#if showCoinSearch}
			<div class="coin-search-dropdown">
				<input
					type="text"
					placeholder="Search coins..."
					bind:value={searchQuery}
					on:input={handleSearchInput}
					class="coin-search-input"
					autocomplete="off"
					spellcheck="false"
				/>
				<div class="coin-list">
					{#if isSearching}
						<div class="search-status">Searching...</div>
					{:else if searchQuery && searchResults.length === 0}
						<div class="search-status">No results found</div>
					{:else if searchResults.length > 0}
						{#each searchResults as coin (coin.id)}
							<button class="coin-option" on:click={() => selectCoin(coin.id)}>
								{#if coin.thumb}
									<img src={coin.thumb} alt={coin.name} class="coin-option-img" />
								{/if}
								<span class="coin-option-name">{coin.name}</span>
								<span class="coin-option-symbol">{coin.symbol?.toUpperCase()}</span>
								{#if coin.marketCapRank}
									<span class="coin-option-rank">#{coin.marketCapRank}</span>
								{/if}
							</button>
						{/each}
					{:else}
						<!-- Popular coins when no search -->
						<div class="popular-label">Popular</div>
						{#each POPULAR_COINS as coin (coin.id)}
							<button class="coin-option" class:active={coin.id === coinId} on:click={() => selectCoin(coin.id)}>
								<span class="coin-option-emoji">●</span>
								<span class="coin-option-name">{coin.name}</span>
								<span class="coin-option-symbol">{coin.symbol}</span>
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- ─── Chart Area ─────────────────────────────── -->
		<div
			class="chart-wrap"
			use:observeChart
			on:mousemove={handleChartMouseMove}
			on:mouseleave={handleChartMouseLeave}
			on:touchmove|preventDefault={handleChartTouchMove}
			on:touchend={handleChartTouchEnd}
			role="img"
			aria-label="Price chart for {coinName}"
		>
			{#if chartPrices.length > 0 && chartWidth > 0}
				<svg
					class="chart-svg"
					viewBox="0 0 {chartWidth} {chartHeight}"
					preserveAspectRatio="none"
				>
					<defs>
						<linearGradient id="chartGrad-{widget.id}" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color={isPositive ? 'var(--success)' : 'var(--error)'} stop-opacity="0.3" />
							<stop offset="100%" stop-color={isPositive ? 'var(--success)' : 'var(--error)'} stop-opacity="0.02" />
						</linearGradient>
					</defs>
					<!-- Area fill -->
					{#if chartAreaPath}
						<path d={chartAreaPath} fill="url(#chartGrad-{widget.id})" />
					{/if}
					<!-- Line -->
					{#if chartLinePath}
						<path
							d={chartLinePath}
							fill="none"
							stroke={isPositive ? 'var(--success)' : 'var(--error)'}
							stroke-width="2"
							stroke-linejoin="round"
							stroke-linecap="round"
							vector-effect="non-scaling-stroke"
						/>
					{/if}
					<!-- Hover crosshair -->
					{#if isHovering && hoverIndex >= 0}
						<line
							x1={hoverX} y1="0"
							x2={hoverX} y2={chartHeight}
							stroke="var(--text-secondary)"
							stroke-width="1"
							stroke-dasharray="3,3"
							opacity="0.5"
							vector-effect="non-scaling-stroke"
						/>
						<circle
							cx={hoverX}
							cy={hoverY}
							r="4"
							fill={isPositive ? 'var(--success)' : 'var(--error)'}
							stroke="var(--surface)"
							stroke-width="2"
							vector-effect="non-scaling-stroke"
						/>
					{/if}
				</svg>

				<!-- Hover tooltip -->
				{#if isHovering && hoverIndex >= 0}
					<div
						class="chart-tooltip"
						style="left: {Math.min(Math.max(hoverX, 50), chartWidth - 50)}px;"
					>
						<span class="tooltip-price">{vsSymbol}{formatPrice(hoverPrice)}</span>
						<span class="tooltip-time">{hoverTime}</span>
					</div>
				{/if}

				<!-- Y-axis labels -->
				<div class="chart-label chart-label-max">{vsSymbol}{formatCompact(chartMax)}</div>
				<div class="chart-label chart-label-min">{vsSymbol}{formatCompact(chartMin)}</div>
			{:else}
				<div class="chart-empty">
					<span>No chart data</span>
				</div>
			{/if}
		</div>

		<!-- ─── Timeframe Selector ─────────────────────── -->
		<div class="timeframe-bar">
			{#each TIMEFRAME_OPTIONS as opt (opt.days)}
				<button
					class="tf-btn"
					class:active={days === opt.days}
					on:click={() => selectTimeframe(opt.days)}
				>
					{opt.label}
				</button>
			{/each}

			<!-- Currency selector -->
			<div class="vs-selector">
				<select
					value={vsCurrency}
					on:change={(e) => selectCurrency(e.currentTarget.value)}
					aria-label="Select currency"
				>
					{#each VS_CURRENCIES as cur (cur.id)}
						<option value={cur.id}>{cur.symbol} {cur.id.toUpperCase()}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- ─── Stats Grid ─────────────────────────────── -->
		<div class="stats-grid">
			<div class="stat">
				<span class="stat-label">High</span>
				<span class="stat-value">{vsSymbol}{formatPrice(high)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Low</span>
				<span class="stat-value">{vsSymbol}{formatPrice(low)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Change</span>
				<span class="stat-value" class:positive={isPositive} class:negative={!isPositive}>{formatPercent(priceChangePercent)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Open</span>
				<span class="stat-value">{vsSymbol}{formatPrice(chartPrices.length > 0 ? chartPrices[0][1] : 0)}</span>
			</div>
		</div>

		<!-- ─── Price Range Bar ──────────────────────────── -->
		{#if high > low}
			<div class="range-bar-wrap">
				<div class="range-bar">
					<div
						class="range-fill"
						style="width: {((currentPrice - low) / (high - low)) * 100}%"
					/>
					<div
						class="range-indicator"
						style="left: {((currentPrice - low) / (high - low)) * 100}%"
					/>
				</div>
				<div class="range-labels">
					<span>Low</span>
					<span>{displayChangeLabel} Range</span>
					<span>High</span>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* ═══════════════════════════════════════════════════
	   Crypto Widget — Mobile-first, Brutalist Theme
	   ═══════════════════════════════════════════════════ */
	.crypto-widget {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		position: relative;
		font-variant-numeric: tabular-nums;
	}

	/* ─── Skeleton Loader ─────────────────────────────── */
	.skeleton-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.25rem;
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.skeleton-circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--surface-variant);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-lines {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
	}

	.skeleton-line {
		height: 12px;
		border-radius: 6px;
		background: var(--surface-variant);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-line.w60 { width: 60%; }
	.skeleton-line.w40 { width: 40%; }
	.skeleton-line.w30 { width: 30%; }

	.skeleton-chart {
		height: 140px;
		border-radius: 8px;
		background: var(--surface-variant);
		animation: shimmer 1.5s ease-in-out infinite;
		animation-delay: 0.2s;
	}

	.skeleton-row {
		display: flex;
		gap: 0.5rem;
	}

	@keyframes shimmer {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.7; }
	}

	/* ─── Error State ─────────────────────────────────── */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		text-align: center;
		color: var(--text-secondary);
	}

	.error-icon {
		font-size: 1.5rem;
	}

	.retry-btn {
		padding: 0.4rem 1rem;
		background: var(--primary-color);
		color: var(--surface);
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.8rem;
		transition: background var(--transition-fast) var(--ease-out);
	}

	.retry-btn:hover {
		background: var(--primary-color-hover);
	}

	/* ─── Header ──────────────────────────────────────── */
	.header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.coin-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface);
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
		min-height: 0;
		min-width: 0;
	}

	.coin-selector:hover {
		border-color: var(--primary-color);
		background: var(--surface-hover);
	}

	.coin-icon-placeholder {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		background: var(--primary-color-light);
		border-radius: 50%;
		color: var(--primary-color);
	}

	.coin-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		line-height: 1.2;
	}

	.coin-name {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.coin-symbol {
		font-size: 0.65rem;
		color: var(--text-secondary);
		font-weight: 500;
		letter-spacing: 0.03em;
	}

	.chevron {
		color: var(--text-secondary);
		transition: transform var(--transition-fast) var(--ease-out);
		flex-shrink: 0;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.price-block {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		line-height: 1.2;
	}

	.current-price {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		transition: opacity 0.15s ease;
	}
	.current-price.hovering {
		opacity: 0.85;
	}

	.price-change {
		font-size: 0.75rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.price-change.positive { color: var(--success); }
	.price-change.negative { color: var(--error); }

	.stat-value.positive { color: var(--success); }
	.stat-value.negative { color: var(--error); }

	.change-label {
		font-weight: 500;
		opacity: 0.7;
		font-size: 0.65rem;
	}

	/* ─── Coin Search Dropdown ────────────────────────── */
	.coin-search-dropdown {
		position: absolute;
		top: 3rem;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 8px 32px var(--shadow-strong);
		overflow: hidden;
		max-height: 300px;
		display: flex;
		flex-direction: column;
	}

	.coin-search-input {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: none;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		font-size: 0.85rem;
		outline: none;
		min-height: 0;
		min-width: 0;
	}

	.coin-search-input:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.coin-search-input::placeholder {
		color: var(--text-secondary);
	}

	.coin-list {
		overflow-y: auto;
		max-height: 240px;
		padding: 0.25rem;
	}

	.search-status {
		padding: 0.75rem;
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	.popular-label {
		padding: 0.35rem 0.65rem;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.coin-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.65rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 6px;
		transition: background var(--transition-fast) var(--ease-out);
		min-height: 0;
		min-width: 0;
	}

	.coin-option:hover {
		background: var(--surface-hover);
	}

	.coin-option.active {
		background: var(--primary-color-light);
	}

	.coin-option-img {
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.coin-option-emoji {
		width: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--primary-color);
		font-size: 0.5rem;
	}

	.coin-option-name {
		flex: 1;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.coin-option-symbol {
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.coin-option-rank {
		font-size: 0.65rem;
		color: var(--text-secondary);
		background: var(--surface-variant);
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		font-weight: 600;
	}

	/* ─── Chart ───────────────────────────────────────── */
	.chart-wrap {
		position: relative;
		width: 100%;
		height: 160px;
		border-radius: 8px;
		overflow: hidden;
		cursor: crosshair;
		touch-action: none;
		background: var(--surface-variant);
		border: 1px solid var(--border);
	}

	.chart-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.chart-tooltip {
		position: absolute;
		top: 6px;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		pointer-events: none;
		box-shadow: 0 2px 8px var(--shadow);
		z-index: 10;
	}

	.tooltip-price {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.tooltip-time {
		font-size: 0.6rem;
		color: var(--text-secondary);
	}

	.chart-label {
		position: absolute;
		right: 6px;
		font-size: 0.55rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--surface);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		opacity: 0.8;
		pointer-events: none;
	}

	.chart-label-max { top: 4px; }
	.chart-label-min { bottom: 4px; }

	.chart-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	/* ─── Timeframe Bar ───────────────────────────────── */
	.timeframe-bar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.tf-btn {
		flex: 1;
		padding: 0.35rem 0.25rem;
		font-size: 0.7rem;
		font-weight: 700;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-secondary);
		border-radius: 6px;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
		text-align: center;
		min-height: 0;
		min-width: 0;
	}

	.tf-btn:hover {
		border-color: var(--primary-color);
		color: var(--primary-color);
	}

	.tf-btn.active {
		background: var(--primary-color);
		color: var(--surface);
		border-color: var(--primary-color);
	}

	.vs-selector {
		margin-left: auto;
	}

	.vs-selector select {
		padding: 0.3rem 0.45rem;
		font-size: 0.65rem;
		font-weight: 600;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		border-radius: 6px;
		cursor: pointer;
		background-image: none;
		padding-right: 0.45rem;
		min-height: 0;
		min-width: 0;
	}

	.vs-selector select:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: 1px;
	}

	/* ─── Stats Grid ──────────────────────────────────── */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.35rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.4rem 0.25rem;
		background: var(--surface-variant);
		border-radius: 6px;
		gap: 0.15rem;
	}

	.stat-label {
		font-size: 0.55rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.stat-value {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--text-primary);
		white-space: nowrap;
	}

	/* ─── Range Bar ───────────────────────────────────── */
	.range-bar-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.range-bar {
		position: relative;
		height: 4px;
		border-radius: 2px;
		background: var(--surface-variant);
		overflow: visible;
	}

	.range-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		border-radius: 2px;
		background: linear-gradient(
			90deg,
			var(--error) 0%,
			var(--warning) 40%,
			var(--success) 100%
		);
		transition: width var(--transition-normal) var(--ease-out);
	}

	.range-indicator {
		position: absolute;
		top: 50%;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-primary);
		border: 2px solid var(--surface);
		transform: translate(-50%, -50%);
		box-shadow: 0 1px 3px var(--shadow);
		transition: left var(--transition-normal) var(--ease-out);
	}

	.range-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.5rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	/* ─── Responsive — Tablet+ ────────────────────────── */
	@media (min-width: 769px) {
		.chart-wrap {
			height: 180px;
		}

		.stats-grid {
			gap: 0.5rem;
		}

		.stat {
			padding: 0.5rem;
		}

		.stat-label {
			font-size: 0.6rem;
		}

		.stat-value {
			font-size: 0.75rem;
		}

		.current-price {
			font-size: 1.4rem;
		}
	}

	/* ─── Responsive — Desktop ────────────────────────── */
	@media (min-width: 1200px) {
		.chart-wrap {
			height: 200px;
		}

		.current-price {
			font-size: 1.5rem;
		}
	}

	/* ─── Responsive — Small Mobile ───────────────────── */
	@media (max-width: 380px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.header {
			flex-direction: column;
			gap: 0.35rem;
		}

		.price-block {
			align-items: flex-start;
		}

		.tf-btn {
			padding: 0.3rem 0.15rem;
			font-size: 0.65rem;
		}
	}
</style>
