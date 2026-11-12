<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Widget } from '$lib/types/widget';

	// Nothing per-widget is configurable yet; the prop keeps the widget API uniform.
	export let widget: Widget;
	// Read once so svelte-check sees the prop as used.
	$: _widgetId = widget?.id;

	const REFRESH_INTERVAL = 15 * 1000;

	interface Track {
		name: string;
		artists: string;
		album: string;
		image: string | null;
		url: string | null;
	}

	interface Playlist {
		name: string;
		image: string | null;
		url: string | null;
	}

	let playlists: Playlist[] = [];
	let loading = true;
	let configured = true;
	let playing = false;
	let track: Track | null = null;
	let error = '';
	let timer: ReturnType<typeof setInterval>;

	async function load() {
		try {
			const res = await fetch('/api/spotify');
			const body = await res.json();
			configured = body.configured !== false;
			error = res.ok ? '' : body.error || 'Spotify is unavailable';
			playing = !!body.playing;
			track = body.track ?? null;
			playlists = Array.isArray(body.playlists) ? body.playlists : [];
		} catch {
			error = 'Spotify is unreachable';
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

<div class="spotify-widget">
	{#if loading}
		<p class="muted">Loading…</p>
	{:else if !configured}
		<p class="state">Spotify is not configured.</p>
		<p class="muted">Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN on the server.</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if track}
		<div class="card">
			{#if track.image}
				<img src={track.image} alt={track.album} width="64" height="64" />
			{/if}
			<div class="meta">
				<span class="label">{playing ? 'Now playing' : 'Paused'}</span>
				{#if track.url}
					<a class="title" href={track.url} target="_blank" rel="noopener noreferrer">{track.name}</a>
				{:else}
					<span class="title">{track.name}</span>
				{/if}
				<span class="muted">{track.artists}</span>
				<span class="muted">{track.album}</span>
			</div>
		</div>
	{:else}
		<p class="muted">Nothing is playing.</p>
	{/if}
	{#if !loading && configured && !error && playlists.length}
		<div class="recents">
			<span class="label">Recent playlists</span>
			<ul>
				{#each playlists as pl}
					<li>
						{#if pl.url}
							<a href={pl.url} target="_blank" rel="noopener noreferrer">{pl.name}</a>
						{:else}
							<span>{pl.name}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.spotify-widget {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}
	.card {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	img {
		border: 1px solid var(--border);
		flex-shrink: 0;
	}
	.meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 0.15rem;
	}
	.label {
		color: var(--success);
		font-size: 0.75rem;
		text-transform: uppercase;
	}
	.title {
		color: var(--text-primary);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.recents {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.recents ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.recents li {
		font-size: 0.85rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.recents a {
		color: var(--text-primary);
	}
	.state {
		color: var(--text-primary);
		margin: 0;
	}
	.muted {
		color: var(--text-secondary);
		font-size: 0.85rem;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.error {
		color: var(--error);
		margin: 0;
	}
</style>
