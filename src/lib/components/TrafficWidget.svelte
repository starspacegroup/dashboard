<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/theme';

	const ZIP_CODE_KEY = 'dashboard-zip-code';
	const WEATHER_CACHE_KEY = 'dashboard-weather-data';
	
	let hasLocation = false;
	let mapCenter = { lat: 0, lng: 0 };
	let isLoading = true;
	let mapContainer: HTMLElement;
	let map: google.maps.Map | null = null;
	let trafficLayer: google.maps.TrafficLayer | null = null;
	let googleMapsApiKey = '';
	let apiKeyError = false;
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
	
	// Load location data from localStorage
	async function loadLocationData() {
		if (!browser) return;
		
		// First, check for saved zip code
		const savedZip = localStorage.getItem(ZIP_CODE_KEY);
		if (savedZip) {
			// Use geocoding to get coordinates from zip code
			await getCoordinatesFromZipCode(savedZip);
			return;
		}
		
		// Check for cached weather data which might have coordinates
		const cachedWeather = localStorage.getItem(WEATHER_CACHE_KEY);
		if (cachedWeather) {
			try {
				const data = JSON.parse(cachedWeather);
				// If weather widget has location, extract it
				if (data.location) {
					// Try to get coordinates from browser geolocation
					if (navigator.geolocation) {
						navigator.geolocation.getCurrentPosition(
							(position) => {
								mapCenter = {
									lat: position.coords.latitude,
									lng: position.coords.longitude
								};
								hasLocation = true;
								isLoading = false;
							},
							() => {
								isLoading = false;
							}
						);
					} else {
						isLoading = false;
					}
					return;
				}
			} catch (e) {
				console.log('Could not parse cached weather data');
			}
		}
		
		// Try to get browser location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					mapCenter = {
						lat: position.coords.latitude,
						lng: position.coords.longitude
					};
					hasLocation = true;
					isLoading = false;
				},
				() => {
					isLoading = false;
				}
			);
		} else {
			isLoading = false;
		}
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
	{:else if hasLocation}
		<div class="map-container" bind:this={mapContainer}></div>
	{:else}
		<div class="placeholder">
			<div class="placeholder-text">Set location to see traffic map</div>
			<div class="placeholder-hint">Configure location in Weather widget</div>
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
		background-color: rgba(0, 0, 0, 0.2);
	}

	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: 300px;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		border: 2px dashed rgba(255, 255, 255, 0.2);
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

	.loading-text {
		font-size: 1rem;
		color: var(--text-secondary);
	}
</style>
