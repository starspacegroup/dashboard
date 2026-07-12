<script lang="ts">
	// Presentational list of usage meters (used / limit bars) for the Cloudflare
	// widget. Reuses the CryptoWidget fill-bar recipe with a solid tone color.
	import type { Meter } from '$lib/cloudflare/limits';

	export let meters: { key: string; label: string; meter: Meter }[] = [];

	function fmtNumber(n: number): string {
		if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
		return String(Math.round(n));
	}
	function fmtBytes(n: number): string {
		if (n >= 1e12) return `${(n / 1e12).toFixed(2)} TB`;
		if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
		if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
		if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`;
		return `${Math.round(n)} B`;
	}
	function used(m: Meter): string {
		const f = m.unit === 'bytes' ? fmtBytes : fmtNumber;
		return `${f(m.used)} / ${f(m.limit)}`;
	}
	function tone(m: Meter): string {
		return m.tone === 'crit' ? 'var(--error)' : m.tone === 'warn' ? 'var(--warning)' : 'var(--success)';
	}
	function note(m: Meter): string {
		if (m.window === 'storage') return m.etaLabel === 'over' ? 'over limit' : '';
		if (m.etaLabel === 'reached') return 'limit reached';
		if (m.etaLabel) return `hits limit ~${m.etaLabel}`;
		if (m.projectedPct != null && m.projectedPct >= 60) return `~${Math.round(m.projectedPct)}% projected`;
		return '';
	}
</script>

{#if meters.length > 0}
	<div class="meter-list">
		{#each meters as m (m.key)}
			<div class="meter">
				<div class="meter-top">
					<span class="meter-label">{m.label}</span>
					<span class="meter-used">{used(m.meter)}</span>
				</div>
				<div class="meter-track">
					<div class="meter-fill" style="width: {Math.min(100, m.meter.pct)}%; background: {tone(m.meter)};"></div>
				</div>
				{#if note(m.meter)}<span class="meter-note" style="color: {tone(m.meter)};">{note(m.meter)}</span>{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.meter-list {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.meter {
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
	}
	.meter-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.meter-label {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.meter-used {
		font-size: 0.68rem;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.meter-track {
		height: 5px;
		border-radius: 3px;
		background: var(--surface-variant);
		overflow: hidden;
	}
	.meter-fill {
		height: 100%;
		border-radius: 3px;
		transition: width var(--transition-normal, 0.3s) var(--ease-out, ease);
		min-width: 2px;
	}
	.meter-note {
		font-size: 0.63rem;
		font-weight: 600;
	}
</style>
