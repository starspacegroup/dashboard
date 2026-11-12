<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Widget } from '$lib/types/widget';

	// Nothing per-widget is configurable yet; the prop keeps the widget API uniform.
	export let widget: Widget;
	// Read once so svelte-check sees the prop as used.
	$: _widgetId = widget?.id;

	// Radar aggregates are not second-by-second; 10 minutes is plenty.
	const REFRESH_INTERVAL = 10 * 60 * 1000;

	interface Outage {
		description: string;
		locations: string[];
		startDate: string | null;
		ongoing: boolean;
	}

	let loading = true;
	let configured = true;
	let error = '';
	let outages: Outage[] | null = null;
	let ipv6Share: number | null = null;
	let http3Share: number | null = null;
	let timer: ReturnType<typeof setInterval>;

	async function load() {
		try {
			const res = await fetch('/api/radar');
			const body = await res.json();
			configured = body.configured !== false;
			error = res.ok ? '' : body.error || 'Cloudflare Radar is unavailable';
			outages = body.outages ?? null;
			ipv6Share = body.ipv6Share ?? null;
			http3Share = body.http3Share ?? null;
		} catch {
			error = 'Cloudflare Radar is unreachable';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		timer = setInterval(() => {
			if (document.visibilityState === 'visible') load();
		}, REFRESH_INTERVAL);
	});
	onDestroy(() => clearInterval(timer));
</script>

<div class="health-widget">
	{#if loading}
		<p class="muted">Loading…</p>
	{:else if !configured}
		<p class="state">Internet Health is not configured.</p>
		<p class="muted">Set CLOUDFLARE_RADAR_TOKEN (a Radar read token) on the server.</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<div class="stats">
			<div class="stat">
				<span class="value">{outages === null ? '–' : outages.length}</span>
				<span class="label">Outages, last 24h</span>
			</div>
			<div class="stat">
				<span class="value">{ipv6Share === null ? '–' : ipv6Share.toFixed(1) + '%'}</span>
				<span class="label">IPv6 share</span>
			</div>
			<div class="stat">
				<span class="value">{http3Share === null ? '–' : http3Share.toFixed(1) + '%'}</span>
				<span class="label">HTTP/3 share</span>
			</div>
		</div>
		{#if outages && outages.length}
			<ul>
				{#each outages as o}
					<li>
						<span class:ongoing={o.ongoing}>{o.ongoing ? 'Ongoing' : 'Ended'}</span>
						{o.description}{o.locations.length ? ' (' + o.locations.join(', ') + ')' : ''}
					</li>
				{/each}
			</ul>
		{:else if outages}
			<p class="muted">No outages reported.</p>
		{/if}
	{/if}
</div>

<style>
	.health-widget {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}
	.stats {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.stat {
		display: flex;
		flex-direction: column;
	}
	.value {
		color: var(--text-primary);
		font-size: 1.4rem;
		font-weight: 600;
	}
	.label,
	.muted {
		color: var(--text-secondary);
		font-size: 0.8rem;
		margin: 0;
	}
	.state {
		color: var(--text-primary);
		margin: 0;
	}
	.error {
		color: var(--error);
		margin: 0;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.85rem;
		color: var(--text-primary);
	}
	li span {
		color: var(--text-secondary);
	}
	li span.ongoing {
		color: var(--warning);
	}
</style>
