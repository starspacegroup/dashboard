<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';
	import type { Widget } from '$lib/types/widget';
	import { widgets, pendingSetupWidgetId } from '$lib/stores/widgets';
	import { weatherSettings } from '$lib/stores/weatherSettings';
	import { revealWidget } from '$lib/utils/revealWidget';
	import { getSavedLocation, saveResolvedCoords, getPositionIfGranted } from '$lib/utils/geolocation';

	export let widget: Widget | undefined = undefined;

	// First-time setup flow: settings open on add, reveal after they close
	let isFirstTimeSetup = false;
	let setupSettingsWereOpen = false;

	const unsubSetupWatch = weatherSettings.subscribe((state) => {
		if (!isFirstTimeSetup || !widget) return;
		if (state.isOpen && state.widgetId === widget.id) {
			setupSettingsWereOpen = true;
		} else if (!state.isOpen && setupSettingsWereOpen) {
			isFirstTimeSetup = false;
			setupSettingsWereOpen = false;
			revealWidget(widget.id, 350);
		}
	});

	const ZIP_CODE_KEY = 'dashboard-zip-code';
	
	let hasLocation = false;
	let mapCenter = { lat: 0, lng: 0 };
	let isLoading = true;
	let mapContainer: HTMLElement;
	let map: google.maps.Map | null = null;
	let trafficLayer: google.maps.TrafficLayer | null = null;
	let googleMapsApiKey = '';
	let apiKeyError = false;
	/** Dev preview, no Google key: render the drawn stand-in below. */
	let devPreviewMap = false;

	// A sample board, not a map. Fixed values so it is stable across SSR,
	// hydration and reloads — a preview that reshuffles on every render is
	// worse than no preview for spotting a real layout change.
	const SAMPLE_ROADS = [
		{ d: 'M 0 26 H 200', level: 'clear' },
		{ d: 'M 0 62 H 200', level: 'heavy' },
		{ d: 'M 0 104 H 200', level: 'slow' },
		{ d: 'M 34 0 V 130', level: 'slow' },
		{ d: 'M 96 0 V 130', level: 'stopped' },
		{ d: 'M 158 0 V 130', level: 'clear' },
		{ d: 'M 0 130 L 200 0', level: 'heavy' }
	] as const;

	const SAMPLE_ROUTES = [
		{ name: 'Downtown', minutes: 12, delta: 0, level: 'clear' },
		{ name: 'Airport', minutes: 27, delta: 9, level: 'heavy' },
		{ name: 'Riverside', minutes: 18, delta: 3, level: 'slow' }
	] as const;
	let currentTheme: 'light' | 'dark' = 'dark';
	
	// Dark mode map styles (night mode)
	const darkMapStyles: google.maps.MapTypeStyle[] = [
		{ elementType: "geometry", stylers: [{ color: "#242f3e" }] },
		{ elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
		{ elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
		{
			featureType: "administrative.locality",
			elementType: "labels.text.fill",
			stylers: [{ color: "#d59563" }],
		},
		{
			featureType: "poi",
			elementType: "labels.text.fill",
			stylers: [{ color: "#d59563" }],
		},
		{
			featureType: "poi.park",
			elementType: "geometry",
			stylers: [{ color: "#263c3f" }],
		},
		{
			featureType: "poi.park",
			elementType: "labels.text.fill",
			stylers: [{ color: "#6b9a76" }],
		},
		{
			featureType: "road",
			elementType: "geometry",
			stylers: [{ color: "#38414e" }],
		},
		{
			featureType: "road",
			elementType: "geometry.stroke",
			stylers: [{ color: "#212a37" }],
		},
		{
			featureType: "road",
			elementType: "labels.text.fill",
			stylers: [{ color: "#9ca5b3" }],
		},
		{
			featureType: "road.highway",
			elementType: "geometry",
			stylers: [{ color: "#746855" }],
		},
		{
			featureType: "road.highway",
			elementType: "geometry.stroke",
			stylers: [{ color: "#1f2835" }],
		},
		{
			featureType: "road.highway",
			elementType: "labels.text.fill",
			stylers: [{ color: "#f3d19c" }],
		},
		{
			featureType: "transit",
			elementType: "geometry",
			stylers: [{ color: "#2f3948" }],
		},
		{
			featureType: "transit.station",
			elementType: "labels.text.fill",
			stylers: [{ color: "#d59563" }],
		},
		{
			featureType: "water",
			elementType: "geometry",
			stylers: [{ color: "#17263c" }],
		},
		{
			featureType: "water",
			elementType: "labels.text.fill",
			stylers: [{ color: "#515c6d" }],
		},
		{
			featureType: "water",
			elementType: "labels.text.stroke",
			stylers: [{ color: "#17263c" }],
		},
	];
	
	// Light mode map styles (default)
	const lightMapStyles: google.maps.MapTypeStyle[] = [];
	
	// Determine current theme (resolve 'auto' to light/dark)
	function getCurrentTheme(): 'light' | 'dark' {
		if (!browser) return 'dark';
		
		const isDark = document.documentElement.classList.contains('dark');
		return isDark ? 'dark' : 'light';
	}
	
	// Update theme when it changes
	$: if (browser) {
		currentTheme = getCurrentTheme();
	}
	
	// Load Google Maps API key from server
	async function loadGoogleMapsApiKey() {
		try {
			const response = await fetch('/api/maps-config');
			const data = await response.json();
			
			// Dev preview with no Google key: draw the sample board instead of the
			// not-configured message, so the widget is not the one empty tile on
			// an otherwise populated preview dashboard.
			if (data.devPreview) {
				devPreviewMap = true;
				return false;
			}

			if (data.error) {
				console.error('Google Maps API key error:', data.error);
				apiKeyError = true;
				return false;
			}

			googleMapsApiKey = data.apiKey;
			return true;
		} catch (error) {
			console.error('Error loading Google Maps API key:', error);
			apiKeyError = true;
			return false;
		}
	}
	
	// Load Google Maps JavaScript API
	function loadGoogleMapsScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (typeof google !== 'undefined' && google.maps) {
				resolve();
				return;
			}
			
			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&v=weekly`;
			script.async = true;
			script.defer = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Google Maps API'));
			document.head.appendChild(script);
		});
	}
	
	// Initialize Google Maps with traffic layer
	function initMap() {
		if (!mapContainer || !hasLocation) return;
		
		const mapStyles = currentTheme === 'dark' ? darkMapStyles : lightMapStyles;
		
		map = new google.maps.Map(mapContainer, {
			zoom: 13,
			center: mapCenter,
			mapTypeControl: true,
			streetViewControl: false,
			fullscreenControl: true,
			styles: mapStyles,
		});
		
		trafficLayer = new google.maps.TrafficLayer();
		trafficLayer.setMap(map);
	}
	
	// Update map styles when theme changes
	function updateMapTheme() {
		if (!map) return;
		
		const mapStyles = currentTheme === 'dark' ? darkMapStyles : lightMapStyles;
		map.setOptions({ styles: mapStyles });
	}
	
	// Settings modal — same interface as the weather widget, minus the
	// temperature unit. Saves a per-widget location override to config.
	export function openSettings() {
		if (!widget) return;
		weatherSettings.open(
			widget.id,
			widget.config?.location ?? null,
			undefined,
			handleSettingsSave,
			'traffic'
		);
	}

	function handleSettingsSave(location: { lat: number; lon: number } | null) {
		if (!widget) return;
		widgets.updateWidgetConfig(widget.id, { location: location ?? undefined });

		if (location) {
			mapCenter = { lat: location.lat, lng: location.lon };
			hasLocation = true;
			isLoading = false;
			if (map) map.setCenter(mapCenter);
		} else {
			// Override cleared — fall back to the default location chain
			loadLocationData().then(() => {
				if (map && hasLocation) map.setCenter(mapCenter);
			});
		}
	}

	// Load location data from saved settings, only falling back to the browser
	// geolocation prompt when nothing has been configured anywhere.
	async function loadLocationData() {
		if (!browser) return;

		// 0) Per-widget location override from this widget's settings
		if (widget?.config?.location && typeof widget.config.location.lat === 'number') {
			mapCenter = { lat: widget.config.location.lat, lng: widget.config.location.lon };
			hasLocation = true;
			isLoading = false;
			return;
		}

		// 1) Saved zip code
		const savedZip = localStorage.getItem(ZIP_CODE_KEY);
		if (savedZip) {
			// Use geocoding to get coordinates from zip code
			await getCoordinatesFromZipCode(savedZip);
			return;
		}

		// 2) Global location from the settings modal — show it instantly, then
		// silently refresh to a live fix only if permission is already granted
		// (never prompts on reload).
		const saved = getSavedLocation();
		if (saved) {
			mapCenter = { lat: saved.lat, lng: saved.lon };
			hasLocation = true;
			isLoading = false;
			void refreshTrafficLocationSilently();
			return;
		}

		// 3) A weather widget with a configured location
		const weatherWithLocation = get(widgets).find(
			(w) => w.type === 'weather' && typeof w.config?.location?.lat === 'number'
		);
		if (weatherWithLocation?.config?.location) {
			const loc = weatherWithLocation.config.location;
			mapCenter = { lat: loc.lat, lng: loc.lon };
			hasLocation = true;
			isLoading = false;
			return;
		}

		// 4) Last resort: a live fix — but ONLY if permission is already granted,
		// so this never prompts on load. Otherwise leave the widget in its
		// no-location state; the user grants location deliberately in Settings.
		const pos = await getPositionIfGranted();
		if (pos) {
			mapCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
			hasLocation = true;
			saveResolvedCoords(pos.coords.latitude, pos.coords.longitude);
		}
		isLoading = false;
	}

	/** Silent, prompt-free live refresh (only acts when permission is granted). */
	async function refreshTrafficLocationSilently() {
		const pos = await getPositionIfGranted();
		if (!pos) return;
		const { latitude, longitude } = pos.coords;
		saveResolvedCoords(latitude, longitude);
		mapCenter = { lat: latitude, lng: longitude };
		hasLocation = true;
		if (map) map.setCenter(mapCenter);
	}
	
	async function getCoordinatesFromZipCode(zipCode: string) {
		try {
			// Use OpenStreetMap Nominatim API for geocoding (free, no API key required)
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=us&format=json&limit=1`
			);
			const data = await response.json();
			
			if (data && data.length > 0) {
				mapCenter = {
					lat: parseFloat(data[0].lat),
					lng: parseFloat(data[0].lon)
				};
				hasLocation = true;
			}
		} catch (error) {
			console.error('Error geocoding zip code:', error);
		} finally {
			isLoading = false;
		}
	}
	
	let themeObserver: MutationObserver | null = null;
	
	onMount(() => {
		if (!browser) return;

		// Newly added via the widget picker? Open settings for initial setup.
		if (widget && get(pendingSetupWidgetId) === widget.id) {
			pendingSetupWidgetId.set(null);
			isFirstTimeSetup = true;
			setTimeout(() => openSettings(), 150);
		}

		// Initialize current theme
		currentTheme = getCurrentTheme();
		
		// Async initialization
		(async () => {
			// Load API key first
			const hasApiKey = await loadGoogleMapsApiKey();
			if (!hasApiKey) {
				isLoading = false;
				return;
			}
			
			// Load location data
			await loadLocationData();
			
			// If we have a location, initialize the map
			if (hasLocation) {
				try {
					await loadGoogleMapsScript();
					initMap();
				} catch (error) {
					console.error('Error initializing Google Maps:', error);
					apiKeyError = true;
				}
			}
		})();
		
		// Listen for theme changes via MutationObserver
		themeObserver = new MutationObserver(() => {
			const newTheme = getCurrentTheme();
			if (newTheme !== currentTheme) {
				currentTheme = newTheme;
				updateMapTheme();
			}
		});
		
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		
		return () => {
			if (themeObserver) {
				themeObserver.disconnect();
			}
		};
	});
	
	onDestroy(() => {
		if (trafficLayer) {
			trafficLayer.setMap(null);
		}
		if (themeObserver) {
			themeObserver.disconnect();
		}
		unsubSetupWatch();
	});
	
	// Reinitialize map when location changes
	$: if (hasLocation && googleMapsApiKey && mapContainer && !map) {
		loadGoogleMapsScript().then(() => {
			initMap();
		}).catch(error => {
			console.error('Error loading Google Maps:', error);
			apiKeyError = true;
		});
	}
	
	// Update map theme when currentTheme changes
	$: if (map && currentTheme) {
		updateMapTheme();
	}
</script>

<div class="traffic-widget">
	{#if isLoading}
		<div class="placeholder">
			<div class="loading-text">Loading...</div>
		</div>
	{:else if apiKeyError}
		<div class="placeholder">
			<div class="placeholder-text">Google Maps API key not configured</div>
			<div class="placeholder-hint">Add GOOGLE_MAPS_API_KEY to your .env file</div>
		</div>
	{:else if devPreviewMap}
		<div class="sample-map">
			<svg class="sample-board" viewBox="0 0 200 130" preserveAspectRatio="none" aria-hidden="true">
				{#each SAMPLE_ROADS as road}
					<path class="sample-road" data-level={road.level} d={road.d} />
				{/each}
			</svg>
			<ul class="sample-routes">
				{#each SAMPLE_ROUTES as route}
					<li class="sample-route">
						<span class="sample-dot" data-level={route.level}></span>
						<span class="sample-name">{route.name}</span>
						<span class="sample-time">{route.minutes} min</span>
						<span class="sample-delta" data-level={route.level}>
							{route.delta ? `+${route.delta}` : 'on time'}
						</span>
					</li>
				{/each}
			</ul>
			<p class="sample-caption">Sample traffic — set GOOGLE_MAPS_API_KEY for the live map</p>
		</div>
	{:else if hasLocation}
		<div class="map-container" bind:this={mapContainer}></div>
	{:else}
		<div class="placeholder">
			<div class="placeholder-text">Set location to see traffic map</div>
			{#if widget}
				<button class="placeholder-action" on:click={openSettings}>Set location</button>
			{:else}
				<div class="placeholder-hint">Open this widget's settings (⚙) to set a location</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.traffic-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 300px;
	}

	.map-container {
		width: 100%;
		height: 100%;
		min-height: 300px;
		border-radius: 0.5rem;
		overflow: hidden;
		background-color: var(--surface-overlay-medium);
	}

	/* ─── Dev-preview stand-in for the map ───
	   Congestion is the one thing on this dashboard where colour genuinely
	   means good-or-bad, so the status colours are the right vocabulary here. */
	.sample-map {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		height: 100%;
		min-height: 300px;
	}

	.sample-board {
		width: 100%;
		flex: 1 1 auto;
		min-height: 120px;
		border-radius: 0.5rem;
		background-color: var(--surface-overlay-medium);
	}

	.sample-road {
		fill: none;
		stroke-width: 5;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
		opacity: 0.85;
	}

	.sample-road[data-level='clear'] {
		stroke: var(--success);
	}
	.sample-road[data-level='slow'] {
		stroke: var(--warning);
	}
	.sample-road[data-level='heavy'],
	.sample-road[data-level='stopped'] {
		stroke: var(--error);
	}
	.sample-road[data-level='stopped'] {
		stroke-dasharray: 6 5;
	}

	.sample-routes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.sample-route {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: var(--text-primary);
	}

	.sample-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.sample-dot[data-level='clear'] {
		background-color: var(--success);
	}
	.sample-dot[data-level='slow'] {
		background-color: var(--warning);
	}
	.sample-dot[data-level='heavy'] {
		background-color: var(--error);
	}

	.sample-name {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sample-time {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.sample-delta {
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		min-width: 3.5rem;
		text-align: right;
	}

	.sample-delta[data-level='heavy'] {
		color: var(--error);
	}
	.sample-delta[data-level='slow'] {
		color: var(--warning);
	}

	.sample-caption {
		margin: 0;
		font-size: 0.7rem;
		color: var(--text-secondary);
		opacity: 0.8;
	}

	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: 300px;
		background-color: var(--surface-overlay-medium);
		border-radius: 0.5rem;
		border: 2px dashed var(--border-subtle);
	}

	.placeholder-text {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.placeholder-hint {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.placeholder-action {
		padding: 0.5rem 1.25rem;
		background: var(--primary-color);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.placeholder-action:hover {
		background: var(--primary-color-hover);
	}

	.placeholder-action:focus-visible {
		outline: 2px solid var(--primary-color);
		outline-offset: 2px;
	}

	.loading-text {
		font-size: 1rem;
		color: var(--text-secondary);
	}
</style>
