<script lang="ts">
	import { onMount } from 'svelte';
	import { signIn } from '@auth/sveltekit/client';
	import { browser } from '$app/environment';

	interface SpotifyPlayerState {
		is_playing: boolean;
		item?: {
			name: string;
			artists: Array<{ name: string }>;
			album: {
				name: string;
				images: Array<{ url: string }>;
			};
			duration_ms: number;
		};
		progress_ms?: number;
	}

	interface SpotifyPlaylist {
		id: string;
		name: string;
		images: Array<{ url: string }>;
		tracks: { total: number };
		external_urls: { spotify: string };
	}

	interface RecentlyPlayedTrack {
		track: {
			name: string;
			artists: Array<{ name: string }>;
			album: {
				images: Array<{ url: string }>;
			};
		};
		played_at: string;
	}

	export let isAuthenticated = false;

	let playerState: SpotifyPlayerState | null = null;
	let playlists: SpotifyPlaylist[] = [];
	let recentlyPlayed: RecentlyPlayedTrack[] = [];
	let isLoading = false;
	let error: string | null = null;

	async function fetchSpotifyData() {
		if (!isAuthenticated || !browser) return;

		isLoading = true;
		error = null;

		try {
			const response = await fetch('/api/spotify');
			
			if (!response.ok) {
				if (response.status === 401) {
					error = 'Please connect your Spotify account';
					isAuthenticated = false;
				} else {
					throw new Error('Failed to fetch Spotify data');
				}
				return;
			}

			const data = await response.json();
			playerState = data.playerState;
			playlists = data.playlists;
			recentlyPlayed = data.recentlyPlayed;
		} catch (err) {
			console.error('Error fetching Spotify data:', err);
			error = 'Failed to load Spotify data';
		} finally {
			isLoading = false;
		}
	}

	function handleSpotifyLogin() {
		signIn('spotify');
	}

	function formatDuration(ms: number): string {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function formatPlayedAt(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return 'Just now';
	}

	onMount(() => {
		if (isAuthenticated) {
			fetchSpotifyData();
			// Refresh player state every 10 seconds
			const interval = setInterval(fetchSpotifyData, 10000);
			return () => clearInterval(interval);
		}
	});
</script>

<div class="spotify-widget">
{#if !isAuthenticated}
<!-- Login/Connect Prompt -->
<div class="connect-prompt">
<div class="spotify-icon">🎵</div>
<h3>Connect Spotify</h3>
<p>Connect your Spotify account to see your current player and playlists</p>
<button class="connect-button" on:click={handleSpotifyLogin}>
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
</svg>
Connect with Spotify
</button>
</div>
{:else if isLoading && !playerState && playlists.length === 0}
<!-- Loading State -->
<div class="loading-state">
<div class="spinner"></div>
<p>Loading Spotify data...</p>
</div>
{:else if error}
<!-- Error State -->
<div class="error-state">
<p>{error}</p>
<button class="retry-button" on:click={fetchSpotifyData}>Retry</button>
</div>
{:else}
<!-- Connected - Show Player and Playlists -->
<div class="spotify-content">
<!-- Current Player -->
{#if playerState?.item}
<div class="now-playing">
<h4>Now Playing</h4>
<div class="track-info">
{#if playerState.item.album.images[0]}
<img 
src={playerState.item.album.images[0].url} 
alt={playerState.item.album.name}
class="album-art"
/>
{/if}
<div class="track-details">
<div class="track-name">{playerState.item.name}</div>
<div class="track-artist">
{playerState.item.artists.map(a => a.name).join(', ')}
</div>
<div class="track-album">{playerState.item.album.name}</div>
<div class="playback-status">
{playerState.is_playing ? '▶️ Playing' : '⏸️ Paused'}
{#if playerState.progress_ms && playerState.item.duration_ms}
<span class="track-time">
{formatDuration(playerState.progress_ms)} / {formatDuration(playerState.item.duration_ms)}
</span>
{/if}
</div>
</div>
</div>
</div>
{:else if recentlyPlayed.length > 0}
<!-- Recently Played if nothing is currently playing -->
<div class="recently-played-section">
<h4>Recently Played</h4>
<div class="recent-track">
{#if recentlyPlayed[0].track.album.images[0]}
<img 
src={recentlyPlayed[0].track.album.images[0].url} 
alt="Album art"
class="album-art-small"
/>
{/if}
<div class="track-details-small">
<div class="track-name-small">{recentlyPlayed[0].track.name}</div>
<div class="track-artist-small">
{recentlyPlayed[0].track.artists.map(a => a.name).join(', ')}
</div>
<div class="played-time">{formatPlayedAt(recentlyPlayed[0].played_at)}</div>
</div>
</div>
</div>
{/if}

<!-- Playlists -->
{#if playlists.length > 0}
<div class="playlists-section">
<h4>Your Playlists</h4>
<div class="playlists-grid">
{#each playlists.slice(0, 6) as playlist}
<a 
href={playlist.external_urls.spotify} 
target="_blank" 
rel="noopener noreferrer"
class="playlist-card"
>
{#if playlist.images[0]}
<img 
src={playlist.images[0].url} 
alt={playlist.name}
class="playlist-image"
/>
{:else}
<div class="playlist-placeholder">🎵</div>
{/if}
<div class="playlist-info">
<div class="playlist-name">{playlist.name}</div>
<div class="playlist-tracks">{playlist.tracks.total} tracks</div>
</div>
</a>
{/each}
</div>
</div>
{/if}
</div>
{/if}
</div>

<style>
.spotify-widget {
min-height: 200px;
display: flex;
flex-direction: column;
}

/* Connect Prompt */
.connect-prompt {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 2rem;
text-align: center;
gap: 1rem;
}

.spotify-icon {
font-size: 3rem;
}

.connect-prompt h3 {
margin: 0;
font-size: 1.25rem;
color: var(--text-primary);
}

.connect-prompt p {
margin: 0;
color: var(--text-secondary);
font-size: 0.875rem;
max-width: 300px;
}

.connect-button {
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.75rem 1.5rem;
background-color: #1DB954;
color: white;
border: none;
border-radius: 24px;
font-size: 0.9375rem;
font-weight: 600;
cursor: pointer;
transition: all 0.2s ease;
box-shadow: 0 2px 8px rgba(29, 185, 84, 0.3);
}

.connect-button:hover {
background-color: #1ed760;
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(29, 185, 84, 0.4);
}

.connect-button:active {
transform: translateY(0);
}

/* Loading State */
.loading-state {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 2rem;
gap: 1rem;
}

.spinner {
width: 40px;
height: 40px;
border: 3px solid var(--border);
border-top-color: var(--primary-color);
border-radius: 50%;
animation: spin 0.8s linear infinite;
}

@keyframes spin {
to { transform: rotate(360deg); }
}

.loading-state p {
color: var(--text-secondary);
font-size: 0.875rem;
}

/* Error State */
.error-state {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 2rem;
gap: 1rem;
}

.error-state p {
color: #ef4444;
font-size: 0.875rem;
}

.retry-button {
padding: 0.5rem 1rem;
background-color: var(--surface-variant);
border: 1px solid var(--border);
border-radius: 6px;
color: var(--text-primary);
cursor: pointer;
transition: all 0.2s ease;
}

.retry-button:hover {
background-color: var(--surface-container-high);
}

/* Content */
.spotify-content {
display: flex;
flex-direction: column;
gap: 1.5rem;
}

/* Now Playing */
.now-playing h4,
.recently-played-section h4,
.playlists-section h4 {
margin: 0 0 0.75rem 0;
font-size: 0.875rem;
font-weight: 600;
color: var(--text-secondary);
text-transform: uppercase;
letter-spacing: 0.05em;
}

.track-info {
display: flex;
gap: 1rem;
align-items: flex-start;
}

.album-art {
width: 120px;
height: 120px;
border-radius: 8px;
object-fit: cover;
box-shadow: 0 4px 12px var(--shadow);
flex-shrink: 0;
}

.track-details {
flex: 1;
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.track-name {
font-size: 1.125rem;
font-weight: 600;
color: var(--text-primary);
}

.track-artist {
font-size: 0.9375rem;
color: var(--text-secondary);
}

.track-album {
font-size: 0.8125rem;
color: var(--text-secondary);
opacity: 0.8;
}

.playback-status {
display: flex;
align-items: center;
gap: 0.5rem;
font-size: 0.8125rem;
color: var(--text-secondary);
margin-top: 0.5rem;
padding-top: 0.5rem;
border-top: 1px solid var(--border);
}

.track-time {
margin-left: auto;
font-family: monospace;
}

/* Recently Played */
.recent-track {
display: flex;
gap: 0.75rem;
align-items: center;
}

.album-art-small {
width: 60px;
height: 60px;
border-radius: 6px;
object-fit: cover;
flex-shrink: 0;
}

.track-details-small {
flex: 1;
display: flex;
flex-direction: column;
gap: 0.25rem;
}

.track-name-small {
font-size: 0.9375rem;
font-weight: 600;
color: var(--text-primary);
}

.track-artist-small {
font-size: 0.8125rem;
color: var(--text-secondary);
}

.played-time {
font-size: 0.75rem;
color: var(--text-secondary);
opacity: 0.7;
}

/* Playlists */
.playlists-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
gap: 0.75rem;
}

.playlist-card {
display: flex;
flex-direction: column;
text-decoration: none;
color: inherit;
border-radius: 8px;
overflow: hidden;
transition: all 0.2s ease;
background-color: var(--surface-variant);
}

.playlist-card:hover {
transform: translateY(-2px);
box-shadow: 0 4px 12px var(--shadow-hover);
}

.playlist-image {
width: 100%;
aspect-ratio: 1;
object-fit: cover;
}

.playlist-placeholder {
width: 100%;
aspect-ratio: 1;
display: flex;
align-items: center;
justify-content: center;
background-color: var(--surface-container-high);
font-size: 2rem;
}

.playlist-info {
padding: 0.5rem;
}

.playlist-name {
font-size: 0.8125rem;
font-weight: 600;
color: var(--text-primary);
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}

.playlist-tracks {
font-size: 0.75rem;
color: var(--text-secondary);
margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
.album-art {
width: 80px;
height: 80px;
}

.track-name {
font-size: 1rem;
}

.playlists-grid {
grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}
}
</style>
