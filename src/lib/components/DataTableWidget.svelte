<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	const WEATHER_CACHE_KEY = 'dashboard-weather-data';

	interface WeatherData {
		temperature: number;
		humidity: number;
		dewPoint: number;
		condition: string;
		description: string;
		location: string;
		icon: string;
		hourly: HourlyData[];
		timestamp: number;
		sunrise?: number;
		sunset?: number;
		moonrise?: number;
		moonset?: number;
		moonPhase?: number;
		timezone?: string;
		timezoneOffset?: number;
	}

	interface HourlyData {
		time: number;
		temperature: number;
		feelsLike: number;
		humidity: number;
		dewPoint: number;
		condition: string;
		icon: string;
	}

	let currentTime = '';
	let currentDate = '';
	let temperature = 72;
	let humidity = 65;
	let dewPoint = 50;
	let location = 'Lewiston, ME';
	let hourlyData: HourlyData[] = [];
	let sunrise = 0;
	let sunset = 0;
	let moonrise = 0;
	let moonset = 0;
	let timezone = '';
	let timezoneOffset = 0;
	let moonPhase = 0;
	let moonScale = 1;
	let currentTimestamp = Date.now();
	let sunPosition = { x: -100, y: -100 };
	let moonPosition = { x: -100, y: -100 };
	let latitude: number | null = null;
	let longitude: number | null = null;
	let lastUpdate = 0;
	
	// Read coordinates from cached data
	$: {
		if (browser) {
			const cachedData = localStorage.getItem(WEATHER_CACHE_KEY);
			if (cachedData) {
				try {
					const data = JSON.parse(cachedData);
					if (data.latitude !== undefined) latitude = data.latitude;
					if (data.longitude !== undefined) longitude = data.longitude;
				} catch (e) {
					// Ignore parse errors
				}
			}
		}
	}
	let savedZipCode = '';
	let timeTestMode = false;
	let testDateOffset = 0;

	// Update current time and date every second
	onMount(() => {
		if (browser) {
			// Load cached weather data
			const cachedData = localStorage.getItem(WEATHER_CACHE_KEY);
			if (cachedData) {
				try {
					const data: WeatherData = JSON.parse(cachedData);
					temperature = data.temperature;
					humidity = data.humidity;
					dewPoint = data.dewPoint;
					location = data.location;
					hourlyData = data.hourly || [];
					lastUpdate = data.timestamp;
					sunrise = data.sunrise || 0;
					sunset = data.sunset || 0;
					moonrise = data.moonrise || 0;
					moonset = data.moonset || 0;
					moonPhase = data.moonPhase || 0;
					timezone = data.timezone || '';
					timezoneOffset = data.timezoneOffset || 0;
				} catch (error) {
					console.error('Failed to parse cached weather data:', error);
				}
			}

			// Load saved ZIP code
			savedZipCode = localStorage.getItem('dashboard-zip-code') || '';

			// Check for time test mode
			timeTestMode = $page.url.searchParams.get('timeTest') === 'true';

			// Update time
			updateTime();
			const timeInterval = setInterval(updateTime, 1000);

			return () => {
				clearInterval(timeInterval);
			};
		}
	});

	function updateTime() {
		const now = new Date(Date.now() + testDateOffset * 60 * 1000);
		currentTimestamp = now.getTime();
		currentTime = now.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		});
		currentDate = now.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getMoonPhaseName(phase: number): string {
		if (phase < 0.03 || phase > 0.97) return 'New Moon';
		if (phase < 0.22) return 'Waxing Crescent';
		if (phase < 0.28) return 'First Quarter';
		if (phase < 0.47) return 'Waxing Gibbous';
		if (phase < 0.53) return 'Full Moon';
		if (phase < 0.72) return 'Waning Gibbous';
		if (phase < 0.78) return 'Last Quarter';
		return 'Waning Crescent';
	}

	function getMoonIllumination(phase: number): number {
		return Math.abs(Math.cos(Math.PI * 2 * phase)) * 100;
	}

	// Calculate dew point trend path for SVG
	$: dewPointPath = (() => {
		if (hourlyData.length === 0) return '';
		
		const data = hourlyData.slice(0, 24);
		const minDewPoint = Math.min(...data.map(d => d.dewPoint));
		const maxDewPoint = Math.max(...data.map(d => d.dewPoint));
		const range = maxDewPoint - minDewPoint || 1;
		
		const width = 320;
		const height = 60;
		const padding = 10;
		
		const points = data.map((d, i) => {
			const x = (i / (data.length - 1)) * width;
			const normalized = (d.dewPoint - minDewPoint) / range;
			const y = height - padding - (normalized * (height - padding * 2));
			return `${x},${y}`;
		});
		
		return `M ${points.join(' L ')}`;
	})();
</script>

<div class="data-table-widget">
	<table>
			<tbody>
				<!-- Time Data -->
				<tr class="section-header">
					<td colspan="2">Time Information</td>
				</tr>
				<tr>
					<td>Current Time</td>
					<td>{currentTime}</td>
				</tr>
				<tr>
					<td>Current Date</td>
					<td>{currentDate}</td>
				</tr>
				<tr>
					<td>Timezone</td>
					<td>{timezone || 'N/A'}</td>
				</tr>
				<tr>
					<td>UTC Offset</td>
					<td>{timezoneOffset ? `${timezoneOffset > 0 ? '+' : ''}${Math.round(timezoneOffset / 3600)} hours` : 'N/A'}</td>
				</tr>
				{#if timeTestMode}
				<tr>
					<td>Time Travel Offset</td>
					<td>{testDateOffset === 0 ? 'None (Now)' : `${Math.abs(testDateOffset)} minutes ago`}</td>
				</tr>
				{/if}
				
				<!-- Location Data -->
				<tr class="section-header">
					<td colspan="2">Location Information</td>
				</tr>
				<tr>
					<td>Location</td>
					<td>{location}</td>
				</tr>
				{#if latitude !== null && longitude !== null}
				<tr>
					<td>Coordinates</td>
					<td>{latitude?.toFixed(4)}°, {longitude?.toFixed(4)}°</td>
				</tr>
				{/if}
				<tr>
					<td>Data Source</td>
					<td>{savedZipCode ? `ZIP Code (${savedZipCode})` : 'Browser Location'}</td>
				</tr>
				
				<!-- Weather Data -->
				<tr class="section-header">
					<td colspan="2">Weather Information</td>
				</tr>
				<tr>
					<td>Temperature</td>
					<td>{temperature}°F</td>
				</tr>
				<tr>
					<td>Humidity</td>
					<td>{humidity}%</td>
				</tr>
				<tr>
					<td>Dew Point</td>
					<td>{dewPoint}°F</td>
				</tr>
				{#if hourlyData.length > 0}
				<tr>
					<td colspan="2" style="padding: 0.75rem 0.5rem;">
						<div style="display: flex; flex-direction: column; gap: 0.25rem;">
							<span style="font-weight: 500; color: var(--text-secondary); font-size: 0.8125rem;">Dew Point (24h Trend)</span>
							<svg width="320" height="60" viewBox="0 0 320 60" style="width: 100%; height: auto;">
								<defs>
									<linearGradient id="dewPointGradient" x1="0%" y1="0%" x2="100%" y2="0%">
										<stop offset="0%" style="stop-color: var(--info)" />
										<stop offset="50%" style="stop-color: var(--info)" />
										<stop offset="100%" style="stop-color: var(--primary-color)" />
									</linearGradient>
								</defs>
								<path
									d={dewPointPath}
									fill="none"
									stroke="url(#dewPointGradient)"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
					</td>
				</tr>
				{/if}
				
				<!-- Celestial Data -->
				<tr class="section-header">
					<td colspan="2">Celestial Information</td>
				</tr>
				{#if sunrise}
				<tr>
					<td>Sunrise</td>
					<td>{new Date(sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
				</tr>
				{/if}
				{#if sunset}
				<tr>
					<td>Sunset</td>
					<td>{new Date(sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
				</tr>
				{/if}
				{#if moonrise}
				<tr>
					<td>Moonrise</td>
					<td>{new Date(moonrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
				</tr>
				{/if}
				{#if moonset}
				<tr>
					<td>Moonset</td>
					<td>{new Date(moonset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
				</tr>
				{/if}
				<tr>
					<td>Moon Phase</td>
					<td>{getMoonPhaseName(moonPhase)} - {getMoonIllumination(moonPhase).toFixed(0)}% illuminated</td>
				</tr>
				<tr>
					<td>Moon Scale</td>
					<td>{moonScale.toFixed(2)}x</td>
				</tr>
				<tr>
					<td>Sun Position</td>
					<td>X: {sunPosition.x.toFixed(1)}px, Y: {sunPosition.y.toFixed(1)}px</td>
				</tr>
				<tr>
					<td>Moon Position</td>
					<td>X: {moonPosition.x.toFixed(1)}px, Y: {moonPosition.y.toFixed(1)}px</td>
				</tr>
				
				<!-- System Data -->
				<tr class="section-header">
					<td colspan="2">System Information</td>
				</tr>
				<tr>
					<td>Last Update</td>
					<td>{new Date(lastUpdate).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</td>
				</tr>
				<tr>
					<td>Current Timestamp</td>
					<td>{currentTimestamp}</td>
				</tr>
				<tr>
					<td>Hourly Data Points</td>
					<td>{hourlyData.length} hours</td>
				</tr>
			</tbody>
	</table>
</div>

<style>
	.data-table-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		width: 100%;
	}

	.data-table-widget table {
		width: 100%;
		max-width: 600px;
		border-collapse: collapse;
		font-size: 0.8125rem;
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 12px;
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	.data-table-widget tbody tr {
		border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
	}

	.data-table-widget tbody tr:last-child {
		border-bottom: none;
	}

	.data-table-widget tbody tr.section-header {
		border-bottom: 1px solid var(--border);
	}

	.data-table-widget tbody tr.section-header td {
		padding: 0.75rem 0.5rem 0.5rem;
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		text-align: left;
	}

	.data-table-widget tbody tr.section-header:first-child td {
		padding-top: 0.75rem;
	}

	.data-table-widget td {
		padding: 0.5rem;
		color: var(--on-surface);
	}

	.data-table-widget td:first-child {
		font-weight: 500;
		color: var(--text-secondary);
		width: 45%;
	}

	.data-table-widget td:last-child {
		text-align: right;
		color: var(--text-primary);
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.data-table-widget table {
			max-width: 100%;
			font-size: 0.75rem;
		}

		.data-table-widget td {
			padding: 0.4rem;
		}
	}
</style>
