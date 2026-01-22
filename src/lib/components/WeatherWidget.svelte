<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';
	import { weatherSettings } from '$lib/stores/weatherSettings';

	export let widget: Widget;

	// Make cache key unique per widget instance
	$: WEATHER_CACHE_KEY = `dashboard-weather-data-${widget.id}`;
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
	const GLOBAL_UNIT_PREFERENCE_KEY = 'dashboard-temp-unit-global';
	const ZIP_CODE_KEY = 'dashboard-zip-code';

	interface WeatherData {
		temperature: number;
		humidity: number;
		dewPoint: number;
		pressure?: number;
		pressureTrend?: { direction: string; change: number };
		windSpeed?: number;
		windDirection?: number;
		windGust?: number;
		condition: string;
		description: string;
		location: string;
		icon: string;
		hourly: HourlyData[];
		timestamp: number;
		sunrise?: number;
		sunset?: number;
		solarNoon?: number;
		dayLength?: number;
		civilTwilightBegin?: number;
		civilTwilightEnd?: number;
		nauticalTwilightBegin?: number;
		nauticalTwilightEnd?: number;
		astronomicalTwilightBegin?: number;
		astronomicalTwilightEnd?: number;
		moonrise?: number;
		moonset?: number;
		moonPhase?: number;
		moonIllumination?: number;
		timezone?: string;
		timezoneOffset?: number;
	}

	interface HourlyData {
		time: number;
		temperature: number;
		feelsLike: number;
		humidity: number;
		dewPoint: number;
		pressure?: number;
		condition: string;
		icon: string;
	}

	let currentTime = '';
	let currentDate = '';
	let temperature = 72;
	let humidity = 65;
	let dewPoint = 50;
	let pressure = 1013.25; // Default sea level pressure in hPa
	let pressureTrend: { direction: string; change: number } = { direction: 'steady', change: 0 };
	let windSpeed = 0; // mph
	let windDirection = 0; // degrees (0=N, 90=E, 180=S, 270=W)
	let windGust = 0; // mph
	let location = 'Lewiston, ME';
	let condition = 'partly-cloudy';
	let weatherCondition = 'clear'; // Raw condition from API for animations: clear, clouds, fog, drizzle, rain, snow, thunderstorm
	
	// Calculate wind effect on animations
	// Wind direction: 0=N, 90=E, 180=S, 270=W (where wind comes FROM)
	// Particles travel in the direction the wind BLOWS (opposite of where it comes from)
	$: windDirectionRadians = (windDirection * Math.PI) / 180;
	
	// Direction wind BLOWS TO in degrees (add 180° to flip from FROM to TO)
	$: windBlowsToAngle = (windDirection + 180) % 360;
	
	// Calculate X and Y components of wind direction (for where wind BLOWS TO)
	// Using standard math coordinates: 0° = up, 90° = right, 180° = down, 270° = left
	// But CSS rotation: 0° = up (north), positive = clockwise
	$: windBlowsX = Math.sin(windDirectionRadians + Math.PI); // -1 to 1 (positive = blows east/right)
	$: windBlowsY = Math.cos(windDirectionRadians + Math.PI); // -1 to 1 (positive = blows north/up, negative = south/down)
	
	// Scale by wind speed (0-2 range at 50mph)
	$: windEffectBase = Math.min(windSpeed, 50) / 25;
	$: windEffectGust = Math.min(windGust || windSpeed, 50) / 25;
	
	// Horizontal travel distance for particles (in pixels)
	$: windTravelX = windBlowsX * windEffectGust * 60;
	
	// Starting position offset (particles start from where wind comes FROM)
	$: windStartOffset = -windBlowsX * windEffectGust * 30;
	
	// Wind intensity ranges (for CSS custom properties)
	$: windIntensityBase = Math.min(windSpeed / 40, 1);
	$: windIntensityGust = Math.min((windGust || windSpeed) / 40, 1);
	
	// Rain angle follows wind direction (tilts in direction wind blows)
	$: rainAngleBase = windBlowsX * windEffectBase * 30;
	$: rainAngleGust = windBlowsX * windEffectGust * 40;
	
	// Snow drift (pixels)
	$: snowDriftBase = windBlowsX * windEffectBase * 50;
	$: snowDriftGust = windBlowsX * windEffectGust * 80;
	
	// Gust cycle duration (faster gusts = faster oscillation, 2-6 seconds)
	$: gustCycleDuration = Math.max(2, 6 - windIntensityGust * 4);
	
	// Generate weather particle data reactively
	interface WeatherParticle {
		id: number;
		left: number;
		delay: number;
		duration: number;
		opacity: number;
		size: number;
	}
	
	function generateParticles(count: number, config: { delayMax: number; durationMin: number; durationRange: number; opacityMin: number; opacityRange: number; sizeMin: number; sizeRange: number }): WeatherParticle[] {
		return Array.from({ length: count }, (_, i) => ({
			id: i,
			left: Math.random() * 100,
			delay: Math.random() * config.delayMax,
			duration: config.durationMin + Math.random() * config.durationRange,
			opacity: config.opacityMin + Math.random() * config.opacityRange,
			size: config.sizeMin + Math.random() * config.sizeRange
		}));
	}
	
	$: rainParticles = weatherCondition === 'rain' 
		? generateParticles(40, { delayMax: 0.8, durationMin: 0.4, durationRange: 0.2, opacityMin: 0.5, opacityRange: 0.3, sizeMin: 15, sizeRange: 10 })
		: weatherCondition === 'drizzle'
		? generateParticles(20, { delayMax: 1, durationMin: 0.6, durationRange: 0.3, opacityMin: 0.3, opacityRange: 0.2, sizeMin: 8, sizeRange: 6 })
		: [];
	
	$: snowParticles = weatherCondition === 'snow'
		? generateParticles(30, { delayMax: 1.5, durationMin: 1.2, durationRange: 1, opacityMin: 0.6, opacityRange: 0.3, sizeMin: 10, sizeRange: 8 })
		: [];
	
	$: stormParticles = weatherCondition === 'thunderstorm'
		? generateParticles(50, { delayMax: 0.5, durationMin: 0.3, durationRange: 0.15, opacityMin: 0.6, opacityRange: 0.3, sizeMin: 18, sizeRange: 12 })
		: [];
	
	let hourlyData: HourlyData[] = [];
	let isLoading = true;
	let hasLocationData = false;
	let sunrise = 0;
	let sunset = 0;
	let solarNoon = 0;
	let dayLength = 0;
	let civilTwilightBegin = 0;
	let civilTwilightEnd = 0;
	let nauticalTwilightBegin = 0;
	let nauticalTwilightEnd = 0;
	let astronomicalTwilightBegin = 0;
	let astronomicalTwilightEnd = 0;
	let moonrise = 0;
	let moonset = 0;
	let moonIllumination = 0;
	let timezone = '';
	let timezoneOffset = 0; // Offset in seconds from UTC
	let isCelsius = true;
	let isNight = false;
	let sunPosition = { x: -100, y: -100 };
	let moonPosition = { x: -100, y: -100 };
	let earthGradient = '';
	let textColor = 'var(--text-primary)';
	let moonPhase = 0; // 0 = new moon, 0.5 = full moon, 1 = new moon again
	let moonScale = 1; // Scale factor for moon size (1.0 to 1.9)
	let currentTimestamp = Date.now(); // Track current time for reactive updates
	let moonShadowPath = ''; // SVG path for accurate moon shadow
	
	// Responsive earth size (updated based on container size)
	let earthSize = 320;
	let padding = 90; // Padding to prevent sun/moon clipping
	let containerElement: HTMLDivElement;
	
	// Calculate scale factors for text based on earth size
	// Base size is 320px, minimum is 200px
	$: textScale = earthSize / 320;
	$: timeSize = Math.max(1.2, 1.75 * textScale); // 1.75rem base, min 1.2rem
	$: dateSize = Math.max(0.625, 0.75 * textScale); // 0.75rem base, min 0.625rem
	$: locationSize = Math.max(0.8, 1 * textScale); // 1rem base, min 0.8rem
	$: topSpacing = Math.max(0.5, 0.9 * textScale); // 0.9rem base, min 0.5rem
	$: dateMargin = Math.max(0.15, 0.25 * textScale); // 0.25rem base, min 0.15rem
	$: locationMargin = Math.max(0.25, 0.5 * textScale); // 0.5rem base, min 0.25rem
	$: pressureSize = Math.max(0.9, 1.8 * textScale); // 1.8rem base, min 0.9rem
	$: pressureUnitSize = Math.max(0.5, 0.8 * textScale); // 0.8rem base, min 0.5rem
	$: pressureTrendSize = Math.max(0.7, 1.4 * textScale); // 1.4rem base, min 0.7rem
	$: pressureGraphWidth = Math.max(80, 120 * textScale); // Graph width scales with widget
	$: pressureGraphHeight = Math.max(24, 36 * textScale); // Graph height scales with widget
	
	// Wind info sizing
	$: windValueSize = Math.max(0.9, 1.4 * textScale); // Wind speed value size
	$: windUnitSize = Math.max(0.5, 0.7 * textScale); // Unit size
	$: windLabelSize = Math.max(0.45, 0.55 * textScale); // Label size
	
	// Convert wind direction degrees to compass direction
	function getWindDirection(degrees: number): string {
		const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
		const index = Math.round(degrees / 22.5) % 16;
		return directions[index];
	}
	
	$: windDirectionText = getWindDirection(windDirection);
	
	// Compute pressure forecast for next 24 hours (for graph)
	$: pressureForecast = (() => {
		const nowTimestamp = Math.floor(Date.now() / 1000);
		// Filter to only future hours (next 24 hours)
		const futureData = hourlyData.filter(h => h.time >= nowTimestamp && h.time <= nowTimestamp + 24 * 3600);
		if (futureData.length < 2) return { path: '', minPressure: 0, maxPressure: 0, dropWarning: false, points: [], segments: [], severityColor: '#3b82f6', rateOfChange: 0 };
		
		const pressures = futureData.map(h => h.pressure || 1013);
		const minP = Math.min(...pressures);
		const maxP = Math.max(...pressures);
		const range = maxP - minP || 1; // Avoid division by zero
		
		// Create SVG path points - normalize to graph dimensions
		const width = pressureGraphWidth;
		const height = pressureGraphHeight;
		const padding = 2;
		
		const points = futureData.map((h, i) => {
			const x = padding + (i / (futureData.length - 1)) * (width - padding * 2);
			const pressureVal = h.pressure ?? 1013;
			const y = padding + (1 - (pressureVal - minP) / range) * (height - padding * 2);
			return { x, y, pressure: pressureVal, time: h.time };
		});
		
		// Helper to get color based on rate of change
		const getSegmentColor = (rate: number): string => {
			// Rate is hPa per hour (positive = dropping)
			// Thresholds: 
			// <= 0: Rising or stable - blue
			// 0-0.5: Slight drop - blue to cyan
			// 0.5-1: Moderate drop - cyan to orange
			// 1-2: Significant drop - orange to red
			// 2+: Rapid drop - red
			if (rate <= 0) {
				return '#3b82f6'; // Blue - stable/rising
			} else if (rate <= 0.5) {
				const t = rate / 0.5;
				return interpolateColor('#3b82f6', '#06b6d4', t); // Blue to cyan
			} else if (rate <= 1) {
				const t = (rate - 0.5) / 0.5;
				return interpolateColor('#06b6d4', '#f59e0b', t); // Cyan to orange
			} else if (rate <= 2) {
				const t = (rate - 1) / 1;
				return interpolateColor('#f59e0b', '#ef4444', t); // Orange to red
			} else {
				return '#ef4444'; // Red - rapid drop
			}
		};
		
		// Calculate segments with colors based on local rate of change
		const segments: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; rate: number }> = [];
		let maxDropRate = 0;
		
		for (let i = 1; i < points.length; i++) {
			const prevPressure = points[i - 1].pressure;
			const currPressure = points[i].pressure;
			const rate = prevPressure - currPressure; // Positive = pressure dropping
			
			if (rate > maxDropRate) maxDropRate = rate;
			
			segments.push({
				x1: points[i - 1].x,
				y1: points[i - 1].y,
				x2: points[i].x,
				y2: points[i].y,
				color: getSegmentColor(rate),
				rate
			});
		}
		
		// Calculate overall severity for the warning badge
		const firstPressure = pressures[0];
		const lowestPressure = minP;
		const totalDrop = firstPressure - lowestPressure;
		const dropWarning = totalDrop > 4;
		
		// Overall severity color (for the dot and warning)
		const severityColor = getSegmentColor(maxDropRate);
		
		const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
		
		return { path: pathData, minPressure: minP, maxPressure: maxP, dropWarning, points, segments, severityColor, rateOfChange: maxDropRate };
	})();
	
	// Coordinates (if available)
	let latitude: number | null = null;
	let longitude: number | null = null;
	let lastUpdate = 0;
	let description = '';
	
	// Zip code override
	let savedZipCode = '';
	let zipCodeInput = '';
	
	// Time test mode
	let testDateOffset = 0; // Minutes offset from current time (negative = past)

	// Loading animation state - uses astronomical data from Feb 22, 2042 at Giza Pyramids, Egypt
	// Coordinates: 29.9792° N, 31.1342° E (Egypt Standard Time UTC+2)
	let loadingAnimationTime = 0; // Seconds since midnight, accelerated
	let loadingSunPosition = { x: -100, y: -100 };
	let loadingMoonPosition = { x: -100, y: -100 };
	let loadingMoonScale = 1;
	let loadingEarthGradient = '';
	let loadingIsNight = false;
	
	// Fixed astronomical data for loading animation (Feb 22, 2042 at Giza, Egypt)
	// Sunrise: 06:23 AM, Sunset: 17:52 PM (5:52 PM)
	// Moonrise: 05:12 AM, Moonset: 15:47 PM (waning crescent ~3% illuminated)
	const LOADING_SUNRISE = 6 * 3600 + 23 * 60; // 6:23 AM in seconds
	const LOADING_SUNSET = 17 * 3600 + 52 * 60; // 5:52 PM in seconds
	const LOADING_MOONRISE = 5 * 3600 + 12 * 60; // 5:12 AM in seconds
	const LOADING_MOONSET = 15 * 3600 + 47 * 60; // 3:47 PM in seconds
	const LOADING_MOON_PHASE = 0.03; // Waning crescent, ~3% illuminated

	// Track if initial weather load has occurred (to avoid duplicate loads)
	let hasInitiallyLoaded = false;
	
	// Track the current widget location config to detect changes during hydration
	let lastWidgetLocationKey: string | null = null;
	
	// Helper to generate a unique key for the widget's location config
	function getLocationKey(loc: { lat: number; lon: number } | undefined | null): string | null {
		if (!loc) return null;
		return `${loc.lat},${loc.lon}`;
	}
	
	// Reactive statement to detect widget config changes (handles SSR -> client hydration)
	$: if (browser && hasInitiallyLoaded) {
		const currentLocationKey = getLocationKey(widget.config?.location);
		if (currentLocationKey !== lastWidgetLocationKey) {
			lastWidgetLocationKey = currentLocationKey;
			// Widget config changed after initial load - reload weather data
			if (widget.config?.location) {
				fetchWeatherFromAPI(widget.config.location.lat, widget.config.location.lon);
			}
		}
	}

	// Load temperature unit preference (widget-specific or global)
	if (browser) {
		if (widget.config?.temperatureUnit) {
			// Use widget-specific setting
			isCelsius = widget.config.temperatureUnit === 'celsius';
		} else {
			// Fall back to global setting
			const savedUnit = localStorage.getItem(GLOBAL_UNIT_PREFERENCE_KEY);
			if (savedUnit !== null) {
				isCelsius = savedUnit === 'celsius';
			}
		}
	}

	// Reactively load timezone from widget config (for accurate time before weather loads)
	// This ensures the time is correct immediately when the widget renders
	$: if (browser && widget.config?.location) {
		// Only update if we don't already have weather data (avoid overwriting API data)
		if (!hasLocationData) {
			if (widget.config.location.timezone) {
				timezone = widget.config.location.timezone;
			}
			if (widget.config.location.timezoneOffset !== undefined) {
				timezoneOffset = widget.config.location.timezoneOffset;
			}
		}
	}

	// Listen for global temperature unit changes
	if (browser) {
		window.addEventListener('temperature-unit-changed', ((event: CustomEvent) => {
			// Only update if this widget doesn't have a specific unit set
			if (!widget.config?.temperatureUnit) {
				isCelsius = event.detail.unit === 'celsius';
			}
		}) as EventListener);
	}

	// Find the weather data for the current time offset from hourly data
	// testDateOffset is in minutes (negative = past), hourly data has Unix timestamps
	$: timeOffsetData = (() => {
		if (!hourlyData || hourlyData.length === 0 || testDateOffset === 0) {
			return { temperature, humidity, dewPoint, condition };
		}
		
		// Calculate the target timestamp
		const now = Date.now();
		const targetTime = now + testDateOffset * 60 * 1000; // Convert minutes to milliseconds
		const targetTimestamp = Math.floor(targetTime / 1000); // Convert to Unix timestamp (seconds)
		
		// Find the closest hourly data point
		let closest = hourlyData[0];
		let closestDiff = Math.abs(hourlyData[0].time - targetTimestamp);
		
		for (const hour of hourlyData) {
			const diff = Math.abs(hour.time - targetTimestamp);
			if (diff < closestDiff) {
				closest = hour;
				closestDiff = diff;
			}
		}
		
		return {
			temperature: closest.temperature,
			humidity: closest.humidity,
			dewPoint: closest.dewPoint || dewPoint,
			condition: closest.condition || condition
		};
	})();

	// Reactive temperature display - uses time offset data when time traveling
	$: displayTemp = isCelsius 
		? Math.round((timeOffsetData.temperature - 32) * 5 / 9) 
		: timeOffsetData.temperature;
	
	// Reactive humidity display - uses time offset data when time traveling
	$: displayHumidity = timeOffsetData.humidity;

	// Save unit preference and toggle
	function setUnit(useCelsius: boolean) {
		isCelsius = useCelsius;
		// Note: This updates the visual display only
		// To persist, user should use widget settings
	}

	// Settings handlers
	export function openSettings() {
		weatherSettings.open(
			widget.id,
			widget.config?.location || null,
			widget.config?.temperatureUnit,
			handleSettingsSave
		);
	}

	function handleSettingsSave(location: any, temperatureUnit?: 'celsius' | 'fahrenheit') {
		// Prepare config update
		const configUpdate: any = {};
		
		if (location) {
			configUpdate.location = location;
		} else {
			// Explicitly clear location
			configUpdate.location = undefined;
		}
		
		// Update temperature unit (or clear it to use global)
		configUpdate.temperatureUnit = temperatureUnit;
		
		// Apply config update
		widgets.updateWidgetConfig(widget.id, configUpdate);
		
		// Update temperature display
		if (temperatureUnit) {
			isCelsius = temperatureUnit === 'celsius';
		} else {
			// Fall back to global
			const savedUnit = localStorage.getItem(GLOBAL_UNIT_PREFERENCE_KEY);
			if (savedUnit !== null) {
				isCelsius = savedUnit === 'celsius';
			}
		}
		
		// Reload weather with appropriate location
		localStorage.removeItem(WEATHER_CACHE_KEY);
		hasLocationData = false;
		if (location) {
			fetchWeatherFromAPI(location.lat, location.lon);
		} else {
			loadWeatherData();
		}
	}

	// Load weather data from cache or API
	async function loadWeatherData() {
		if (!browser) return;

		// Track the location we're loading for (to detect hydration changes)
		lastWidgetLocationKey = getLocationKey(widget.config?.location);
		hasInitiallyLoaded = true;

		// Priority 1: Check widget-specific location
		if (widget.config?.location) {
			await fetchWeatherFromAPI(widget.config.location.lat, widget.config.location.lon);
			return;
		}

		// Priority 2: Check if there's a saved global location from settings
		const savedLocationStr = localStorage.getItem('dashboard-location');
		if (savedLocationStr) {
			try {
				const savedLocation = JSON.parse(savedLocationStr);
				await fetchWeatherFromAPI(savedLocation.lat, savedLocation.lon);
				return;
			} catch (e) {
				console.error('Failed to parse saved location:', e);
			}
		}

		// Fall back to browser location
		await fetchWeatherData();
	}

	async function fetchWeatherData() {
		try {
			// Try to get user's location
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					async (position) => {
						const { latitude, longitude } = position.coords;
						await fetchWeatherFromAPI(latitude, longitude);
					},
					async (error) => {
						// Geolocation failed or denied - don't load any weather data
						isLoading = false;
						// Don't set hasLocationData = true
					}
				);
			} else {
				// Geolocation not supported - don't load any weather data
				isLoading = false;
			}
		} catch (error) {
			console.error('Error fetching weather:', error);
			isLoading = false;
		}
	}

	async function fetchWeatherFromAPI(lat?: number, lon?: number) {
		try {
			const url = lat && lon 
				? `/api/weather?lat=${lat}&lon=${lon}`
				: '/api/weather';
			
			const response = await fetch(url);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Weather API error:', errorText);
				throw new Error(`Failed to fetch weather: ${response.status}`);
			}

			const data: WeatherData = await response.json();
			
			// Save coordinates if provided
			if (lat && lon) {
				latitude = lat;
				longitude = lon;
			}
			
			// Save to localStorage
			localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
			
			// Apply the data
			applyWeatherData(data);
			isLoading = false;
		} catch (error) {
			console.error('Error fetching weather from API:', error);
			isLoading = false;
		}
	}

	// Handle location changed event from settings
	function handleLocationChanged(event: CustomEvent) {
		const location = event.detail;
		if (location && location.lat && location.lon) {
			// Clear cache and reload with new location
			localStorage.removeItem(WEATHER_CACHE_KEY);
			hasLocationData = false;
			fetchWeatherFromAPI(location.lat, location.lon);
		}
	}

	// Handle location cleared event from settings
	function handleLocationCleared() {
		// Clear cache and use browser location
		localStorage.removeItem(WEATHER_CACHE_KEY);
		hasLocationData = false;
		fetchWeatherData();
	}

	function applyWeatherData(data: WeatherData) {
		temperature = data.temperature;
		humidity = data.humidity;
		dewPoint = data.dewPoint || 0;
		pressure = data.pressure || 1013.25;
		pressureTrend = data.pressureTrend || { direction: 'steady', change: 0 };
		windSpeed = data.windSpeed || 0;
		windDirection = data.windDirection || 0;
		windGust = data.windGust || 0;
		location = data.location;
		description = data.description || '';
		hourlyData = data.hourly || [];
		
		// Sun data from sunrise-sunset.org API
		sunrise = data.sunrise || 0;
		sunset = data.sunset || 0;
		solarNoon = data.solarNoon || 0;
		dayLength = data.dayLength || 0;
		civilTwilightBegin = data.civilTwilightBegin || 0;
		civilTwilightEnd = data.civilTwilightEnd || 0;
		nauticalTwilightBegin = data.nauticalTwilightBegin || 0;
		nauticalTwilightEnd = data.nauticalTwilightEnd || 0;
		astronomicalTwilightBegin = data.astronomicalTwilightBegin || 0;
		astronomicalTwilightEnd = data.astronomicalTwilightEnd || 0;
		
		// Moon data from astronomical calculations
		moonrise = data.moonrise || 0;
		moonset = data.moonset || 0;
		if (data.moonPhase !== undefined) {
			moonPhase = data.moonPhase;
		}
		if (data.moonIllumination !== undefined) {
			moonIllumination = data.moonIllumination;
		}
		
		timezone = data.timezone || '';
		timezoneOffset = data.timezoneOffset || 0;
		lastUpdate = data.timestamp || Date.now();
		
		// Save timezone to widget config for immediate time display on future loads
		if (widget.config?.location && (data.timezone || data.timezoneOffset)) {
			const updatedLocation = {
				...widget.config.location,
				timezone: data.timezone || widget.config.location.timezone,
				timezoneOffset: data.timezoneOffset ?? widget.config.location.timezoneOffset
			};
			widgets.updateWidgetConfig(widget.id, { location: updatedLocation });
		}
		
		// Mark that we have location data
		hasLocationData = true;
		
		// Update widget title to include city name
		if (data.location) {
			const cityName = data.location.split(',')[0].trim(); // Get just the city name
			widgets.updateTitle(widget.id, `Weather - ${cityName}`);
		}
		
		// Store raw condition for weather animations
		const rawCondition = data.condition.toLowerCase();
		weatherCondition = rawCondition;
		
		// Map weather conditions to our display conditions
		if (rawCondition.includes('clear')) {
			condition = 'sunny';
		} else if (rawCondition.includes('cloud')) {
			condition = 'partly-cloudy';
		} else if (rawCondition.includes('rain')) {
			condition = 'rainy';
		} else {
			condition = 'partly-cloudy';
		}
	}

	// Helper function to generate SVG path from data points
	function generateGraphPath(
		data: number[],
		width: number,
		height: number,
		padding = 0
	): string {
		if (data.length === 0) return '';

		// Find min and max values for scaling
		const minValue = Math.min(...data);
		const maxValue = Math.max(...data);
		const valueRange = maxValue - minValue || 10; // Avoid division by zero

		// Generate path points - simple line connecting all points
		const points = data.map((value, index) => {
			const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
			const normalizedValue = (value - minValue) / valueRange;
			const y = height - padding - normalizedValue * (height - 2 * padding);
			return `${x},${y}`;
		});

		// Create simple polyline path
		return `M ${points.join(' L ')}`;
	}

	// Generate SVG path for temperature graph (scales with earth size)
	$: temperaturePath = hourlyData.length > 0
		? generateGraphPath(hourlyData.map(h => h.temperature), earthSize, 80)
		: '';

	// Generate SVG path for dew point graph (scales with earth size)
	$: dewPointPath = hourlyData.length > 0 && hourlyData.some(h => h.dewPoint !== undefined && h.dewPoint !== 0)
		? generateGraphPath(hourlyData.map(h => h.dewPoint || 0), earthSize, 60)
		: '';

	function formatHour(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
	}

	function getTemperatureColor(temp: number): string {
		// 32°F or lower = white
		if (temp <= 32) return '#ffffff';
		// 32-77°F = white to blue gradient
		if (temp < 77) {
			const ratio = (temp - 32) / (77 - 32);
			return interpolateColor('#ffffff', '#3b82f6', ratio);
		}
		// 77-80°F = blue to orange gradient
		if (temp < 80) {
			const ratio = (temp - 77) / (80 - 77);
			return interpolateColor('#3b82f6', '#f97316', ratio);
		}
		// 80-100°F = orange to red gradient
		if (temp < 100) {
			const ratio = (temp - 80) / (100 - 80);
			return interpolateColor('#f97316', '#ef4444', ratio);
		}
		// 100°F+ = red
		return '#ef4444';
	}

	function interpolateColor(color1: string, color2: string, ratio: number): string {
		const hex = (c: string) => parseInt(c.slice(1), 16);
		const r1 = (hex(color1) >> 16) & 255;
		const g1 = (hex(color1) >> 8) & 255;
		const b1 = hex(color1) & 255;
		const r2 = (hex(color2) >> 16) & 255;
		const g2 = (hex(color2) >> 8) & 255;
		const b2 = hex(color2) & 255;
		
		const r = Math.round(r1 + (r2 - r1) * ratio);
		const g = Math.round(g1 + (g2 - g1) * ratio);
		const b = Math.round(b1 + (b2 - b1) * ratio);
		
		return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
	}

	// Update earth size based on available container width
	function updateEarthSize() {
		if (!browser || !containerElement) return;
		
		// Get the available width of the parent container
		const availableWidth = containerElement.clientWidth;
		
		// Calculate optimal earth size
		// We want: earthSize + 2*padding = availableWidth
		// padding should be approximately 28% of earthSize for proper sun/moon visibility
		// So: earthSize + 2*(0.28*earthSize) = availableWidth
		// earthSize * 1.56 = availableWidth
		// earthSize = availableWidth / 1.56
		
		const calculatedEarthSize = Math.floor(availableWidth / 1.56);
		
		// Set minimum and maximum earth sizes for usability
		const minEarthSize = 200; // Minimum for readability
		const maxEarthSize = 500; // Maximum for aesthetics
		
		earthSize = Math.max(minEarthSize, Math.min(maxEarthSize, calculatedEarthSize));
		padding = Math.floor(earthSize * 0.28); // 28% padding
	}

	// Calculate loading animation positions using the same logic as real positions
	function updateLoadingPositions() {
		const secondsSinceMidnight = loadingAnimationTime;
		
		// Calculate sun position for loading animation
		loadingSunPosition = getLoadingSunPosition(secondsSinceMidnight);
		
		// Calculate moon position for loading animation
		const moonData = getLoadingMoonPosition(secondsSinceMidnight);
		loadingMoonPosition = { x: moonData.x, y: moonData.y };
		loadingMoonScale = moonData.scale;
		
		// Determine day/night for earth gradient
		const displayHour = Math.floor(secondsSinceMidnight / 3600);
		loadingIsNight = displayHour < 6 || displayHour >= 18;
		
		// Update earth gradient
		const colorData = calculateEarthColor(displayHour, loadingIsNight ? 'night' : 'partly-cloudy');
		loadingEarthGradient = colorData.gradient;
	}

	// Sun position calculation for loading animation (uses fixed Giza data)
	function getLoadingSunPosition(secondsSinceMidnight: number) {
		const sunriseTime = LOADING_SUNRISE;
		const sunsetTime = LOADING_SUNSET;
		
		const earthRadius = earthSize / 2;
		const sunRadius = earthSize * 0.09375;
		
		let angle;
		let orbitRadius;
		
		if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight <= sunsetTime) {
			// Sun is visible - daylight hours
			const dayDuration = sunsetTime - sunriseTime;
			const dayProgress = (secondsSinceMidnight - sunriseTime) / dayDuration;
			
			angle = Math.PI + (dayProgress * Math.PI);
			
			const elevationProgress = Math.sin(dayProgress * Math.PI);
			const minOrbitRadius = earthRadius + (sunRadius * 0.1);
			const maxOrbitRadius = earthRadius + sunRadius;
			orbitRadius = minOrbitRadius + (elevationProgress * (maxOrbitRadius - minOrbitRadius));
		} else {
			// Sun is hidden - nighttime hours
			const nightOrbitRadius = earthRadius - (sunRadius * 1.5);
			orbitRadius = nightOrbitRadius;
			
			const nightDuration = (86400 - sunsetTime) + sunriseTime;
			
			if (secondsSinceMidnight > sunsetTime) {
				const timeSinceSunset = secondsSinceMidnight - sunsetTime;
				const nightProgress = timeSinceSunset / nightDuration;
				angle = 0 + (nightProgress * Math.PI);
			} else {
				const timeBeforeSunrise = sunriseTime - secondsSinceMidnight;
				const nightProgress = 1 - (timeBeforeSunrise / nightDuration);
				angle = 0 + (nightProgress * Math.PI);
			}
		}
		
		const x = padding + (earthSize / 2) + Math.cos(angle) * orbitRadius;
		const y = padding + (earthSize / 2) + Math.sin(angle) * orbitRadius;
		
		return { x, y };
	}

	// Moon position calculation for loading animation (uses fixed Giza data)
	function getLoadingMoonPosition(secondsSinceMidnight: number): { x: number; y: number; scale: number } {
		const moonriseTime = LOADING_MOONRISE;
		const moonsetTime = LOADING_MOONSET;
		
		const earthRadius = earthSize / 2;
		const moonRadius = earthSize * 0.09375;
		
		const visibleOrbitRadius = earthRadius + moonRadius;
		const hiddenOrbitRadius = earthRadius + (moonRadius * 0.5);
		
		const horizonScaleDuration = 30 * 60;
		const maxScale = 1.9;
		const normalScale = 1.0;
		const hiddenScale = 0.7;
		let scale = normalScale;
		
		let angle;
		let orbitRadius;
		
		// Moon rises before it sets (same day case for this data)
		if (secondsSinceMidnight >= moonriseTime && secondsSinceMidnight <= moonsetTime) {
			// Moon is visible
			const visibleDuration = moonsetTime - moonriseTime;
			const visibleProgress = (secondsSinceMidnight - moonriseTime) / visibleDuration;
			
			angle = -Math.PI/2 + (visibleProgress * Math.PI);
			orbitRadius = visibleOrbitRadius;
			
			const timeSinceRise = secondsSinceMidnight - moonriseTime;
			const timeBeforeSet = moonsetTime - secondsSinceMidnight;
			
			if (timeSinceRise <= horizonScaleDuration) {
				const scaleProgress = timeSinceRise / horizonScaleDuration;
				scale = maxScale - (scaleProgress * (maxScale - normalScale));
			} else if (timeBeforeSet <= horizonScaleDuration) {
				const scaleProgress = timeBeforeSet / horizonScaleDuration;
				scale = maxScale - (scaleProgress * (maxScale - normalScale));
			}
		} else {
			// Moon is hidden
			const hiddenDuration = (86400 - moonsetTime) + moonriseTime;
			let hiddenProgress;
			if (secondsSinceMidnight > moonsetTime) {
				hiddenProgress = (secondsSinceMidnight - moonsetTime) / hiddenDuration;
			} else {
				hiddenProgress = ((86400 - moonsetTime) + secondsSinceMidnight) / hiddenDuration;
			}
			
			angle = Math.PI/2 + (hiddenProgress * Math.PI);
			orbitRadius = hiddenOrbitRadius;
			scale = hiddenScale;
		}
		
		const x = padding + (earthSize / 2) + Math.cos(angle) * orbitRadius;
		const y = padding + (earthSize / 2) + Math.sin(angle) * orbitRadius;
		
		return { x, y, scale };
	}

	// Function to compute current time based on widget's timezone
	function computeCurrentTime() {
		const now = new Date();
		
		// Apply time travel offset
		const adjustedTime = new Date(now.getTime() + testDateOffset * 60 * 1000);
		
		// Use the location's IANA timezone if available, otherwise fall back to offset calculation
		if (timezone) {
			// Use Intl API with the location's timezone for accurate local time
			try {
				currentTime = adjustedTime.toLocaleTimeString('en-US', { 
					hour: '2-digit', 
					minute: '2-digit', 
					...(hasLocationData ? {} : { second: '2-digit' }),
					hour12: true,
					timeZone: timezone
				});
				
				// Format date with the location's timezone
				const year = adjustedTime.toLocaleString('en-US', { year: 'numeric', timeZone: timezone });
				const month = adjustedTime.toLocaleString('en-US', { month: 'long', timeZone: timezone });
				const day = adjustedTime.toLocaleString('en-US', { day: 'numeric', timeZone: timezone });
				const weekday = adjustedTime.toLocaleString('en-US', { weekday: 'long', timeZone: timezone });
				currentDate = `${year} ${month} ${day} (${weekday})`;
				return;
			} catch (e) {
				// Fall back to offset calculation if timezone string is invalid
				console.warn('Invalid timezone string, falling back to offset:', timezone);
			}
		}
		
		// Fall back to manual offset calculation if timezone string not available
		if (timezoneOffset !== 0 || hasLocationData) {
			// Apply location's timezone offset
			const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
			const locationTime = utcTime + (timezoneOffset * 1000) + (testDateOffset * 60 * 1000);
			const displayDate = new Date(locationTime);
			
			currentTime = displayDate.toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit', 
				...(hasLocationData ? {} : { second: '2-digit' }),
				hour12: true 
			});
			
			const year = displayDate.getFullYear();
			const month = displayDate.toLocaleString('en-US', { month: 'long' });
			const day = displayDate.getDate();
			const weekday = displayDate.toLocaleString('en-US', { weekday: 'long' });
			currentDate = `${year} ${month} ${day} (${weekday})`;
		} else {
			// No location data yet - show local time with seconds
			currentTime = adjustedTime.toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit', 
				second: '2-digit',
				hour12: true 
			});
			
			const year = adjustedTime.getFullYear();
			const month = adjustedTime.toLocaleString('en-US', { month: 'long' });
			const day = adjustedTime.getDate();
			const weekday = adjustedTime.toLocaleString('en-US', { weekday: 'long' });
			currentDate = `${year} ${month} ${day} (${weekday})`;
		}
	}

	// Reactive statement to update time when dependencies change
	$: if (browser) {
		// This will re-run whenever currentTimestamp, timezone, timezoneOffset, hasLocationData, or testDateOffset changes
		currentTimestamp; // Trigger on timestamp update
		timezone; // Trigger when timezone changes
		timezoneOffset; // Trigger when offset changes
		hasLocationData; // Trigger when location data arrives
		testDateOffset; // Trigger when time travel offset changes
		computeCurrentTime();
	}

	// Update time every second
	onMount(() => {
		// Set initial earth size after a brief delay to ensure container is rendered
		setTimeout(updateEarthSize, 0);
		
		// Use ResizeObserver to watch for container size changes
		const resizeObserver = new ResizeObserver(() => {
			updateEarthSize();
		});
		
		if (containerElement) {
			resizeObserver.observe(containerElement);
		}
		
		// Listen for window resize as fallback
		const handleResize = () => {
			updateEarthSize();
		};
		window.addEventListener('resize', handleResize);
		
		// Listen for location changes from settings
		window.addEventListener('location-changed', handleLocationChanged as EventListener);
		window.addEventListener('location-cleared', handleLocationCleared);
		
		// Update the timestamp every second to trigger the reactive time computation
		const interval = setInterval(() => {
			currentTimestamp = Date.now();
		}, 1000);
		
		// Loading animation - accelerated day cycle (full day in ~40 seconds)
		// Start at 05:23 AM as specified
		loadingAnimationTime = 5 * 3600 + 23 * 60; // 05:23 AM in seconds
		const loadingInterval = setInterval(() => {
			if (!hasLocationData) {
				// Advance time by ~36 minutes per frame at 60fps = full day in ~40 seconds
				loadingAnimationTime = (loadingAnimationTime + 360) % 86400; // 360 seconds = 6 minutes real time per frame
				updateLoadingPositions();
			}
		}, 50); // 20fps for smooth animation
		
		// Initial loading position calculation
		updateLoadingPositions();
		
		// Initial time computation
		computeCurrentTime();
		
		// Load weather data
		loadWeatherData();
		
		// Refresh weather data every 5 minutes (use loadWeatherData to respect widget config)
		const weatherInterval = setInterval(() => {
			loadWeatherData();
		}, CACHE_DURATION);
		
		return () => {
			clearInterval(interval);
			clearInterval(loadingInterval);
			clearInterval(weatherInterval);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('location-changed', handleLocationChanged as EventListener);
			window.removeEventListener('location-cleared', handleLocationCleared);
			resizeObserver.disconnect();
		};
	});

	// Get sun/moon position based on time (0-1, where 0.5 is noon)
	$: {
		const now = new Date();
		const hours = now.getHours() + now.getMinutes() / 60;
		const timeRatio = hours / 24;
		
		// Determine if it's day or night
		if (hours >= 6 && hours < 18) {
			condition = temperature > 80 ? 'sunny' : 'partly-cloudy';
		} else {
			condition = 'night';
		}
	}

	// Helper to get seconds since midnight in the widget's location timezone
	function getSecondsSinceMidnightInLocationTime(date: Date): number {
		if (timezone) {
			// Use Intl API with the location's timezone
			try {
				const hours = parseInt(date.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }));
				const minutes = parseInt(date.toLocaleString('en-US', { minute: 'numeric', timeZone: timezone }));
				const seconds = parseInt(date.toLocaleString('en-US', { second: 'numeric', timeZone: timezone }));
				return hours * 3600 + minutes * 60 + seconds;
			} catch (e) {
				// Fall through to offset calculation
			}
		}
		
		if (timezoneOffset !== 0 || hasLocationData) {
			// Manual offset calculation
			const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
			const locationTime = new Date(utcTime + (timezoneOffset * 1000));
			return locationTime.getHours() * 3600 + locationTime.getMinutes() * 60 + locationTime.getSeconds();
		}
		
		// Fall back to local time
		return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
	}

	// Helper to convert a Unix timestamp to seconds since midnight in the widget's location timezone
	function unixToSecondsSinceMidnightInLocationTime(unixTimestamp: number): number {
		const date = new Date(unixTimestamp * 1000);
		return getSecondsSinceMidnightInLocationTime(date);
	}

	// Calculate sun position based on sunrise/sunset
	function getSunPosition(testDate: Date) {
		// Convert Unix timestamps to seconds since midnight in location's timezone
		let sunriseTime = 6 * 3600; // Default 6am
		let sunsetTime = 18 * 3600; // Default 6pm
		
		if (sunrise) {
			sunriseTime = unixToSecondsSinceMidnightInLocationTime(sunrise);
		}
		if (sunset) {
			sunsetTime = unixToSecondsSinceMidnightInLocationTime(sunset);
		}
		
		// Get current time in seconds since midnight (in location's timezone)
		const secondsSinceMidnight = getSecondsSinceMidnightInLocationTime(testDate);
		
		// Constants for orbit calculation - use reactive values
		const earthRadius = earthSize / 2;
		const sunRadius = earthSize * 0.09375; // Proportional to earth size (30/320 = 0.09375)
		
		// Calculate the angle based on time
		// In screen coordinates: 0°=right, 90°=down, 180°=left, 270°=up
		// We want: sunrise=left(180°), noon=up(270°), sunset=right(0°), midnight=down(90°)
		let angle;
		let orbitRadius;
		
		if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight <= sunsetTime) {
			// Sun is visible - daylight hours
			// Calculate solar noon as the midpoint between sunrise and sunset
			const solarNoonTime = (sunriseTime + sunsetTime) / 2;
			const dayDuration = sunsetTime - sunriseTime;
			const dayProgress = (secondsSinceMidnight - sunriseTime) / dayDuration;
			
			// Progress from sunrise (180°) → noon (270°) → sunset (360°/0°)
			// That's 180° total arc
			angle = Math.PI + (dayProgress * Math.PI); // 180° to 360°
			
			// Orbit radius varies: smaller at horizon, larger at peak
			// Use sine curve for smooth expansion/contraction
			const elevationProgress = Math.sin(dayProgress * Math.PI); // 0 → 1 → 0
			const minOrbitRadius = earthRadius + (sunRadius * 0.1);
			const maxOrbitRadius = earthRadius + sunRadius;
			orbitRadius = minOrbitRadius + (elevationProgress * (maxOrbitRadius - minOrbitRadius));
		} else {
			// Sun is hidden - nighttime hours
			// Use smaller orbit radius to keep sun behind Earth
			const nightOrbitRadius = earthRadius - (sunRadius * 1.5);
			orbitRadius = nightOrbitRadius;
			
			// Calculate total night duration
			const nightDuration = (86400 - sunsetTime) + sunriseTime;
			
			if (secondsSinceMidnight > sunsetTime) {
				// Evening after sunset
				// Progress from sunset (0°) to midnight to sunrise (180°)
				const timeSinceSunset = secondsSinceMidnight - sunsetTime;
				const nightProgress = timeSinceSunset / nightDuration;
				angle = 0 + (nightProgress * Math.PI); // 0° to 180°
			} else {
				// Early morning before sunrise
				// Continue from midnight through to sunrise
				// We're in the second half of the night arc
				const timeBeforeSunrise = sunriseTime - secondsSinceMidnight;
				const nightProgress = 1 - (timeBeforeSunrise / nightDuration);
				angle = 0 + (nightProgress * Math.PI); // Continue 0° to 180°
			}
		}
		
		// Calculate position in pixels from Earth's center (including padding offset)
		const x = padding + (earthSize / 2) + Math.cos(angle) * orbitRadius;
		const y = padding + (earthSize / 2) + Math.sin(angle) * orbitRadius;
		
		return { x, y };
	}

	// Calculate moon position based on moonrise/moonset
	function getMoonPosition(testDate: Date): { x: number; y: number; scale: number } {
		// Get current time in seconds since midnight (in location's timezone)
		const secondsSinceMidnight = getSecondsSinceMidnightInLocationTime(testDate);
		
		// Convert Unix timestamps to seconds since midnight (in location's timezone)
		let moonriseTime = 18 * 3600; // Default 6pm
		let moonsetTime = 6 * 3600; // Default 6am
		
		if (moonrise) {
			moonriseTime = unixToSecondsSinceMidnightInLocationTime(moonrise);
		}
		if (moonset) {
			moonsetTime = unixToSecondsSinceMidnightInLocationTime(moonset);
		}
		
		// Constants for orbit calculation - use reactive values
		const earthRadius = earthSize / 2;
		const moonRadius = earthSize * 0.09375; // Proportional to earth size (30/320 = 0.09375)
		
		// Orbit radii - smaller when hidden, larger when visible
		const visibleOrbitRadius = earthRadius + moonRadius; // 190px - moon visible around Earth
		const hiddenOrbitRadius = earthRadius + (moonRadius * 0.5); // Moon stays ~50% visible behind Earth so phase is always visible
		
		// Calculate moon scale (moon illusion near horizon)
		const horizonScaleDuration = 30 * 60; // 30 minutes in seconds
		const maxScale = 1.9;
		const normalScale = 1.0;
		const hiddenScale = 0.7;
		let scale = normalScale;
		
		let angle;
		let orbitRadius;
		
		// Determine if moon is in its visible arc (rise to set) or hidden arc (set to rise)
		if (moonriseTime < moonsetTime) {
			// Normal case: moon rises before it sets (same day)
			// e.g., rises at 18:00, sets at 23:59
			if (secondsSinceMidnight >= moonriseTime && secondsSinceMidnight <= moonsetTime) {
				// Moon is visible - rises from left, peaks at top, sets at right
				const visibleDuration = moonsetTime - moonriseTime;
				const visibleProgress = (secondsSinceMidnight - moonriseTime) / visibleDuration;
				// Progress from 0 (rise/left) to 0.5 (peak/top) to 1 (set/right)
				// Map to angles: left (270°/-90°) -> top (0°/360°) -> right (90°)
				angle = -Math.PI/2 + (visibleProgress * Math.PI); // -90° to 90° (left to top to right)
				
				// Use larger orbit radius when visible
				orbitRadius = visibleOrbitRadius;
				
				// Calculate scale - large near rise and set
				const timeSinceRise = secondsSinceMidnight - moonriseTime;
				const timeBeforeSet = moonsetTime - secondsSinceMidnight;
				
				if (timeSinceRise <= horizonScaleDuration) {
					// 30 mins after moonrise - scale from max to normal
					const scaleProgress = timeSinceRise / horizonScaleDuration;
					scale = maxScale - (scaleProgress * (maxScale - normalScale));
				} else if (timeBeforeSet <= horizonScaleDuration) {
					// 30 mins before moonset - scale from normal to max
					const scaleProgress = timeBeforeSet / horizonScaleDuration;
					scale = maxScale - (scaleProgress * (maxScale - normalScale));
				}
			} else {
				// Moon is hidden - right to bottom to left on the far side
				const hiddenDuration = (86400 - moonsetTime) + moonriseTime;
				let hiddenProgress;
				if (secondsSinceMidnight > moonsetTime) {
					hiddenProgress = (secondsSinceMidnight - moonsetTime) / hiddenDuration;
				} else {
					hiddenProgress = ((86400 - moonsetTime) + secondsSinceMidnight) / hiddenDuration;
				}
				// Progress from right (90°) -> bottom (180°) -> left (270°)
				angle = Math.PI/2 + (hiddenProgress * Math.PI); // 90° to 270° (right to bottom to left)
				
				// Use smaller orbit radius when hidden
				orbitRadius = hiddenOrbitRadius;
				
				// Moon is smaller when hidden
				scale = hiddenScale;
			}
		} else {
			// Moon rises late and sets early next day (crosses midnight)
			// e.g., rises at 22:00, sets at 08:00
			if (secondsSinceMidnight >= moonriseTime || secondsSinceMidnight <= moonsetTime) {
				// Moon is visible
				const visibleDuration = (86400 - moonriseTime) + moonsetTime;
				let visibleProgress;
				let timeSinceRise, timeBeforeSet;
				
				if (secondsSinceMidnight >= moonriseTime) {
					visibleProgress = (secondsSinceMidnight - moonriseTime) / visibleDuration;
					timeSinceRise = secondsSinceMidnight - moonriseTime;
					timeBeforeSet = (86400 - secondsSinceMidnight) + moonsetTime;
				} else {
					visibleProgress = ((86400 - moonriseTime) + secondsSinceMidnight) / visibleDuration;
					timeSinceRise = (86400 - moonriseTime) + secondsSinceMidnight;
					timeBeforeSet = moonsetTime - secondsSinceMidnight;
				}
				// Map to angles: left (270°/-90°) -> top (0°/360°) -> right (90°)
				angle = -Math.PI/2 + (visibleProgress * Math.PI); // -90° to 90° (left to top to right)
				
				// Use larger orbit radius when visible
				orbitRadius = visibleOrbitRadius;
				
				// Calculate scale - large near rise and set
				if (timeSinceRise <= horizonScaleDuration) {
					// 30 mins after moonrise - scale from max to normal
					const scaleProgress = timeSinceRise / horizonScaleDuration;
					scale = maxScale - (scaleProgress * (maxScale - normalScale));
				} else if (timeBeforeSet <= horizonScaleDuration) {
					// 30 mins before moonset - scale from normal to max
					const scaleProgress = timeBeforeSet / horizonScaleDuration;
					scale = maxScale - (scaleProgress * (maxScale - normalScale));
				}
			} else {
				// Moon is hidden
				const hiddenDuration = moonriseTime - moonsetTime;
				const hiddenProgress = (secondsSinceMidnight - moonsetTime) / hiddenDuration;
				// Progress from right (90°) -> bottom (180°) -> left (270°)
				angle = Math.PI/2 + (hiddenProgress * Math.PI); // 90° to 270° (right to bottom to left)
				
				// Use smaller orbit radius when hidden
				orbitRadius = hiddenOrbitRadius;
				
				// Moon is smaller when hidden
				scale = hiddenScale;
			}
		}
		
		// Rotate all angles by -90° to align 0° with top instead of right
		angle = angle - Math.PI/2;
		
		const x = padding + (earthSize / 2) + Math.cos(angle) * orbitRadius;
		const y = padding + (earthSize / 2) + Math.sin(angle) * orbitRadius;
		
		return { x, y, scale };
	}

	// Calculate Earth's color based on time of day and weather
	function calculateEarthColor(hour: number, weatherCondition: string): { gradient: string; textColor: string } {
		// Calculate brightness based on time of day (0 = midnight, 12 = noon)
		// Use a smooth curve: darkest at midnight (0/24), brightest at noon (12)
		const hoursFromNoon = Math.abs(12 - hour);
		const dayBrightness = 1 - (hoursFromNoon / 12); // 0 at midnight, 1 at noon
		
		// Base colors for different times of day
		let baseColor1, baseColor2, baseColor3, baseColor4;
		
		if (dayBrightness > 0.8) {
			// Noon - very bright
			baseColor1 = { r: 245, g: 240, b: 235 };
			baseColor2 = { r: 230, g: 220, b: 210 };
			baseColor3 = { r: 215, g: 205, b: 195 };
			baseColor4 = { r: 200, g: 190, b: 180 };
		} else if (dayBrightness > 0.6) {
			// Morning/Afternoon - bright
			baseColor1 = { r: 212, g: 180, b: 140 };
			baseColor2 = { r: 195, g: 165, b: 125 };
			baseColor3 = { r: 180, g: 150, b: 115 };
			baseColor4 = { r: 165, g: 140, b: 105 };
		} else if (dayBrightness > 0.4) {
			// Early morning/Evening - moderate
			baseColor1 = { r: 150, g: 120, b: 100 };
			baseColor2 = { r: 130, g: 105, b: 90 };
			baseColor3 = { r: 115, g: 95, b: 80 };
			baseColor4 = { r: 100, g: 85, b: 70 };
		} else if (dayBrightness > 0.2) {
			// Dusk/Dawn - dim
			baseColor1 = { r: 90, g: 75, b: 85 };
			baseColor2 = { r: 75, g: 65, b: 75 };
			baseColor3 = { r: 65, g: 55, b: 65 };
			baseColor4 = { r: 55, g: 48, b: 58 };
		} else {
			// Night - very dark
			baseColor1 = { r: 45, g: 40, b: 55 };
			baseColor2 = { r: 38, g: 35, b: 48 };
			baseColor3 = { r: 32, g: 30, b: 42 };
			baseColor4 = { r: 25, g: 23, b: 35 };
		}
		
		// Adjust colors based on weather conditions
		if (weatherCondition.includes('cloud') || weatherCondition === 'partly-cloudy') {
			// Add gray/reduce saturation
			const grayFactor = 0.7;
			baseColor1 = mixWithGray(baseColor1, grayFactor);
			baseColor2 = mixWithGray(baseColor2, grayFactor);
			baseColor3 = mixWithGray(baseColor3, grayFactor);
			baseColor4 = mixWithGray(baseColor4, grayFactor);
		} else if (weatherCondition.includes('rain')) {
			// Add blue tint and more gray
			const blueTint = { r: 0, g: 20, b: 40 };
			baseColor1 = mixColors(baseColor1, blueTint, 0.3);
			baseColor2 = mixColors(baseColor2, blueTint, 0.35);
			baseColor3 = mixColors(baseColor3, blueTint, 0.4);
			baseColor4 = mixColors(baseColor4, blueTint, 0.45);
			
			const grayFactor = 0.6;
			baseColor1 = mixWithGray(baseColor1, grayFactor);
			baseColor2 = mixWithGray(baseColor2, grayFactor);
			baseColor3 = mixWithGray(baseColor3, grayFactor);
			baseColor4 = mixWithGray(baseColor4, grayFactor);
		}
		
		// Create gradient string
		const gradient = `linear-gradient(135deg, 
			rgba(${baseColor1.r}, ${baseColor1.g}, ${baseColor1.b}, 0.95) 0%,
			rgba(${baseColor2.r}, ${baseColor2.g}, ${baseColor2.b}, 0.95) 30%,
			rgba(${baseColor3.r}, ${baseColor3.g}, ${baseColor3.b}, 0.95) 60%,
			rgba(${baseColor4.r}, ${baseColor4.g}, ${baseColor4.b}, 0.95) 100%
		)`;
		
		// Calculate text color for visibility
		// Use average brightness to determine if we need dark or light text
		const avgBrightness = (baseColor1.r + baseColor1.g + baseColor1.b + 
		                        baseColor2.r + baseColor2.g + baseColor2.b) / 6;
		
		const textColor = avgBrightness > 160 
			? 'rgba(40, 40, 40, 0.95)' // Dark text for bright backgrounds
			: 'var(--text-primary)'; // Use theme text color
		
		return { gradient, textColor };
	}
	
	function mixWithGray(color: { r: number; g: number; b: number }, factor: number) {
		const avg = (color.r + color.g + color.b) / 3;
		return {
			r: Math.round(color.r * (1 - factor) + avg * factor),
			g: Math.round(color.g * (1 - factor) + avg * factor),
			b: Math.round(color.b * (1 - factor) + avg * factor)
		};
	}
	
	function mixColors(
		color1: { r: number; g: number; b: number }, 
		color2: { r: number; g: number; b: number }, 
		ratio: number
	) {
		return {
			r: Math.round(color1.r * (1 - ratio) + color2.r * ratio),
			g: Math.round(color1.g * (1 - ratio) + color2.g * ratio),
			b: Math.round(color1.b * (1 - ratio) + color2.b * ratio)
		};
	}

	// Calculate moon phase based on date
	// Returns a value from 0 to 1 representing the lunar cycle
	// 0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter, 1 = New Moon
	function calculateMoonPhase(date: Date): number {
		// Known new moon: January 6, 2000, 18:14 UTC
		const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
		const lunarCycle = 29.53058770576; // days
		
		const currentTime = date.getTime();
		const daysSinceNewMoon = (currentTime - knownNewMoon) / (1000 * 60 * 60 * 24);
		const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
		
		return phase;
	}

	function getMoonPhaseName(phase: number): string {
		// Phase is 0 to 1:
		// 0 and 1 = new moon
		// 0.25 = first quarter moon
		// 0.5 = full moon
		// 0.75 = last quarter moon
		// Periods in between are waxing crescent, waxing gibbous, waning gibbous, and waning crescent
		if (phase === 0 || phase === 1) return 'New Moon';
		if (phase < 0.25) return 'Waxing Crescent';
		if (phase === 0.25) return 'First Quarter';
		if (phase < 0.5) return 'Waxing Gibbous';
		if (phase === 0.5) return 'Full Moon';
		if (phase < 0.75) return 'Waning Gibbous';
		if (phase === 0.75) return 'Last Quarter';
		if (phase < 1) return 'Waning Crescent';
		return 'New Moon';
	}

	function getMoonIllumination(phase: number): number {
		// Calculate approximate illumination percentage
		// 0 = 0% (new moon)
		// 0.25 = 50% (first quarter)
		// 0.5 = 100% (full moon)
		// 0.75 = 50% (last quarter)
		// 1 = 0% (new moon)
		if (phase <= 0.5) {
			// Waxing: 0 to 100%
			return phase * 2 * 100;
		} else {
			// Waning: 100% to 0
			return (1 - phase) * 2 * 100;
		}
	}

	function calculateMoonShadowPath(phase: number): string {
		// Create an accurate moon phase visualization using SVG path
		// The terminator (day/night boundary) is an ellipse that shifts across the moon
		const size = 100; // Use viewBox size of 100x100 for easy percentage calculations
		const radius = 50;
		const centerX = 50;
		const centerY = 50;
		
		// Calculate illumination (0 to 1)
		const illumination = getMoonIllumination(phase) / 100;
		
		// For waxing phases (0 to 0.5), light comes from the right
		// For waning phases (0.5 to 1), light comes from the left
		const isWaxing = phase < 0.5;
		
		// Calculate the x-offset of the terminator ellipse
		// At 0% illumination: offset = -radius (fully left, showing nothing)
		// At 50% illumination: offset = 0 (center, showing half)
		// At 100% illumination: offset = radius (fully right, showing everything)
		const offset = (illumination - 0.5) * 2 * radius;
		
		// Create the shadow path using an ellipse for the terminator
		// The shadow covers everything from the dark side
		let path: string;
		
		if (illumination < 0.01) {
			// New moon - fully dark
			path = `M ${centerX - radius},${centerY} 
					A ${radius},${radius} 0 1,1 ${centerX - radius},${centerY + 0.01} Z`;
		} else if (illumination > 0.99) {
			// Full moon - no shadow
			path = '';
		} else {
			// Calculate the ellipse semi-minor axis based on illumination
			// This creates the curved terminator line
			const ellipseWidth = Math.abs(offset);
			
			if (isWaxing) {
				// Waxing: shadow on the left, light on the right
				if (illumination < 0.5) {
					// Less than half lit - shadow is convex
					path = `M ${centerX},${centerY - radius}
							A ${radius},${radius} 0 0,0 ${centerX},${centerY + radius}
							A ${ellipseWidth},${radius} 0 0,1 ${centerX},${centerY - radius} Z`;
				} else {
					// More than half lit - shadow is concave
					path = `M ${centerX},${centerY - radius}
							A ${radius},${radius} 0 0,0 ${centerX},${centerY + radius}
							A ${ellipseWidth},${radius} 0 0,0 ${centerX},${centerY - radius} Z`;
				}
			} else {
				// Waning: shadow on the right, light on the left
				if (illumination < 0.5) {
					// Less than half lit - shadow is convex
					path = `M ${centerX},${centerY - radius}
							A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
							A ${ellipseWidth},${radius} 0 0,1 ${centerX},${centerY - radius} Z`;
				} else {
					// More than half lit - shadow is concave
					path = `M ${centerX},${centerY - radius}
							A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
							A ${ellipseWidth},${radius} 0 0,0 ${centerX},${centerY - radius} Z`;
				}
			}
		}
		
		return path;
	}

	// Reactive calculations for sun/moon positions and night mode
	// Track testDateOffset, currentTimestamp, and timezone to trigger recalculation
	$: if (currentTimestamp && testDateOffset !== undefined) {
		// Reference timezone-related variables to ensure reactivity
		timezone;
		timezoneOffset;
		hasLocationData;
		sunrise;
		sunset;
		moonrise;
		moonset;
		
		const now = new Date(currentTimestamp);
		
		// For sun/moon positions, we need to work with the actual moment in time
		// The sunrise/sunset/moonrise/moonset are Unix timestamps (absolute moments)
		// Apply time offset for time travel
		const testDate = new Date(now.getTime() + testDateOffset * 60 * 1000);
		
		sunPosition = getSunPosition(testDate);
		const moonData = getMoonPosition(testDate);
		moonPosition = { x: moonData.x, y: moonData.y };
		moonScale = moonData.scale;
		moonPhase = calculateMoonPhase(testDate);
		moonShadowPath = calculateMoonShadowPath(moonPhase);
		
		// For determining day/night, use the location's hour via the helper
		const locationSeconds = getSecondsSinceMidnightInLocationTime(testDate);
		const displayHour = Math.floor(locationSeconds / 3600);
		isNight = displayHour < 6 || displayHour >= 18;
		
		// Update Earth colors based on time and weather
		const colorData = calculateEarthColor(displayHour, condition);
		earthGradient = colorData.gradient;
		textColor = colorData.textColor;
	}
</script>

<div class="weather-widget" class:loaded={hasLocationData} bind:this={containerElement}>
	{#if hasLocationData}
	<!-- Temperature Unit Toggle Switch -->
	<!-- Celestial System Container (centers everything together) -->
	<div class="celestial-container" class:loaded={hasLocationData} style="--earth-size: {earthSize}px; --padding: {padding}px;">
		<!-- Sun (Behind Earth) -->
		<div
			class="sun"
			style="left: {sunPosition.x}px; top: {sunPosition.y}px"
		></div>

		<!-- Moon (Behind Earth) -->
		<div
			class="moon"
			style="
				left: {moonPosition.x}px;
				top: {moonPosition.y}px;
				transform: translate(-50%, -50%) scale({moonScale});
			"
		>
			<svg class="moon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<!-- Moon surface (full circle) -->
				<circle cx="50" cy="50" r="50" fill="#d4c5b0" />

				<!-- Moon shadow (accurate phase) -->
				{#if moonShadowPath}
					<path d={moonShadowPath} fill="rgba(20, 15, 25, 0.95)" />
				{/if}
			</svg>
		</div>

		<!-- Time and Date Section (above earth) -->
		<div class="time-date-section" style="--text-color: {textColor}; --time-size: {timeSize}; --date-size: {dateSize}; --date-margin: {dateMargin}">
			<div class="time">{currentTime}</div>
			<div class="date">{currentDate}</div>
		</div>

		<div 
			class="earth weather-{weatherCondition}" 
			style="background: {earthGradient}; --text-color: {textColor}; --time-size: {timeSize}; --date-size: {dateSize}; --location-size: {locationSize}; --top-spacing: {topSpacing}; --date-margin: {dateMargin}; --location-margin: {locationMargin}"
		>
		<!-- Weather Animation Overlay -->
		<div class="weather-animation-container" style="
			--wind-travel-x: {windTravelX}px;
			--wind-start-offset: {windStartOffset}%;
			--wind-blows-x: {windBlowsX};
			--wind-intensity-base: {windIntensityBase};
			--wind-intensity-gust: {windIntensityGust};
			--rain-angle-base: {rainAngleBase}deg;
			--rain-angle-gust: {rainAngleGust}deg;
			--snow-drift-base: {snowDriftBase}px;
			--snow-drift-gust: {snowDriftGust}px;
			--gust-cycle: {gustCycleDuration}s;
		">
			<!-- Rain Animation -->
			{#if weatherCondition === 'rain' || weatherCondition === 'drizzle'}
				<div class="rain-container">
					{#each rainParticles as p (p.id)}
						<div 
							class="raindrop" 
							style="
								left: calc({p.left}% + var(--wind-start-offset, 0%));
								animation-delay: {p.delay}s;
								--base-duration: {p.duration}s;
								opacity: {p.opacity};
								height: {p.size}px;
							"
						></div>
					{/each}
				</div>
			{/if}

			<!-- Snow Animation -->
			{#if weatherCondition === 'snow'}
				<div class="snow-container">
					{#each snowParticles as p (p.id)}
						<div 
							class="snowflake" 
							style="
								left: calc({p.left}% + var(--wind-start-offset, 0%));
								animation-delay: {p.delay}s;
								--base-duration: {p.duration}s;
								opacity: {p.opacity};
								font-size: {p.size}px;
							"
						>❄</div>
					{/each}
				</div>
			{/if}

			<!-- Clouds Animation -->
			<!-- Clouds Animation -->
			{#if weatherCondition === 'clouds'}
				<div class="clouds-container" style="
					--wind-x: {windBlowsX};
					--wind-y: {windBlowsY};
				">
					<div class="cloud cloud-1"></div>
					<div class="cloud cloud-2"></div>
					<div class="cloud cloud-3"></div>
				</div>
			{/if}

			<!-- Fog Animation -->
			{#if weatherCondition === 'fog'}
				<div class="fog-container" style="
					--wind-x: {windBlowsX};
					--wind-y: {windBlowsY};
				">
					<div class="fog-layer fog-1"></div>
					<div class="fog-layer fog-2"></div>
					<div class="fog-layer fog-3"></div>
				</div>
			{/if}

			<!-- Thunderstorm Animation -->
			{#if weatherCondition === 'thunderstorm'}
				<div class="thunderstorm-container">
					<div class="rain-container storm-rain">
						{#each stormParticles as p (p.id)}
							<div 
								class="raindrop heavy" 
								style="
									left: calc({p.left}% + var(--wind-start-offset, 0%));
									animation-delay: {p.delay}s;
									--base-duration: {p.duration}s;
									opacity: {p.opacity};
									height: {p.size}px;
								"
							></div>
						{/each}
					</div>
					<div class="lightning"></div>
					<div class="lightning lightning-2"></div>
				</div>
			{/if}

			<!-- Clear/Sunny Animation -->
			{#if weatherCondition === 'clear'}
				<div class="clear-container">
					<div class="sun-rays"></div>
				</div>
			{/if}
		</div>

		<!-- Location inside earth -->
		<div class="location-section">
			<div class="location">{location}</div>
			<div class="condition-text">{description}</div>
		</div>

		<!-- 24-Hour Temperature Graph (layered behind temperature) -->
		{#if hourlyData.length > 0}
			<svg class="temp-graph-svg" width="{earthSize}" height="80" viewBox="0 0 {earthSize} 80">
				<!-- Define gradient for temperature colors -->
				<defs>
					<linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
						{#each hourlyData.slice(0, 24) as hour, index}
							{@const offset = (index / 23) * 100}
							{@const color = getTemperatureColor(hour.temperature)}
							<stop offset="{offset}%" stop-color={color} />
						{/each}
					</linearGradient>
				</defs>

				<!-- Temperature line with gradient -->
				<path
					d={temperaturePath}
					fill="none"
					stroke="url(#tempGradient)"
					stroke-width="8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}

		<!-- Temperature - Dead Center -->
		<div class="temperature">
			<span class="temp-number">{displayTemp}</span><span class="degree-symbol">°{isCelsius ? 'C' : 'F'}</span>
		</div>
		</div>
	</div>

	<!-- Bottom Info Row - Wind and Pressure side by side -->
	<div class="bottom-info-row">
		<!-- Wind Info Section -->
		<div class="wind-section" style="--wind-value-size: {windValueSize}rem; --wind-unit-size: {windUnitSize}rem; --wind-label-size: {windLabelSize}rem;">
			<div class="wind-header">
				<span class="wind-icon">💨</span>
				<span class="wind-label">Wind</span>
			</div>
			<div class="wind-stats">
				<div class="wind-stat">
					<span class="wind-stat-value">{Math.round(windSpeed)}</span>
					<span class="wind-stat-unit">mph</span>
					<span class="wind-stat-label">speed</span>
				</div>
				<div class="wind-stat direction">
					<div class="wind-compass" style="--wind-direction: {windDirection}deg;">
						<svg viewBox="0 0 40 40" class="compass-arrow">
							<!-- Compass circle -->
							<circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-width="1"/>
							<!-- Arrow pointing in wind direction (where wind is coming FROM) -->
							<path 
								d="M20 6 L24 18 L20 15 L16 18 Z" 
								fill="currentColor"
								class="arrow-head"
							/>
							<line x1="20" y1="15" x2="20" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						</svg>
					</div>
					<span class="wind-stat-dir-text">{windDirectionText}</span>
					<span class="wind-stat-label">direction</span>
				</div>
				{#if windGust > windSpeed}
					<div class="wind-stat gust">
						<span class="wind-stat-value">{Math.round(windGust)}</span>
						<span class="wind-stat-unit">mph</span>
						<span class="wind-stat-label">gusts</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Barometric Pressure with 24-hour forecast graph -->
		<div class="pressure-section" style="--pressure-size: {pressureSize}rem; --pressure-unit-size: {pressureUnitSize}rem; --pressure-trend-size: {pressureTrendSize}rem">
		<div class="pressure-header">
			<span class="pressure-value">{pressure.toFixed(1)}</span>
			<span class="pressure-unit">hPa</span>
		</div>
		
		<!-- 24-hour pressure forecast graph -->
		{#if pressureForecast.path}
			<div class="pressure-graph" class:drop-warning={pressureForecast.dropWarning}>
				<svg 
					width="{pressureGraphWidth}" 
					height="{pressureGraphHeight}" 
					viewBox="0 0 {pressureGraphWidth} {pressureGraphHeight}"
					class="pressure-sparkline"
				>
					<!-- Gradient definitions for fill areas -->
					<defs>
						{#each pressureForecast.segments as segment, i}
							<linearGradient id="segGrad-{widget.id}-{i}" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" stop-color="{segment.color}" stop-opacity="0.25"/>
								<stop offset="100%" stop-color="{segment.color}" stop-opacity="0"/>
							</linearGradient>
						{/each}
					</defs>
					
					<!-- Fill areas for each segment -->
					{#each pressureForecast.segments as segment, i}
						<path 
							d="M {segment.x1.toFixed(1)} {segment.y1.toFixed(1)} L {segment.x2.toFixed(1)} {segment.y2.toFixed(1)} L {segment.x2.toFixed(1)} {pressureGraphHeight - 2} L {segment.x1.toFixed(1)} {pressureGraphHeight - 2} Z" 
							fill="url(#segGrad-{widget.id}-{i})"
						/>
					{/each}
					
					<!-- Colored line segments -->
					{#each pressureForecast.segments as segment}
						<line 
							x1="{segment.x1.toFixed(1)}" 
							y1="{segment.y1.toFixed(1)}" 
							x2="{segment.x2.toFixed(1)}" 
							y2="{segment.y2.toFixed(1)}" 
							stroke="{segment.color}" 
							stroke-width="2.5"
							stroke-linecap="round"
						/>
					{/each}
					
					<!-- Current point indicator -->
					{#if pressureForecast.points.length > 0}
						<circle 
							cx="{pressureForecast.points[0].x}" 
							cy="{pressureForecast.points[0].y}" 
							r="3" 
							fill="{pressureForecast.segments[0]?.color || '#3b82f6'}"
						/>
					{/if}
				</svg>
				<div class="pressure-graph-labels">
					<span class="graph-label-now">Now</span>
					<span class="graph-label-24h">+24h</span>
				</div>
				{#if pressureForecast.dropWarning}
					<div class="pressure-warning" style="color: {pressureForecast.severityColor}; background: color-mix(in srgb, {pressureForecast.severityColor} 15%, transparent);">Pressure drop ahead</div>
				{/if}
			</div>
		{/if}
	</div>

		<!-- Humidity Section -->
		<div class="humidity-section">
			<div class="humidity-header">
				<span class="humidity-icon">💧</span>
				<span class="humidity-label">Humidity</span>
			</div>
			<div class="humidity-stats">
				<span class="humidity-value-large">{displayHumidity}</span>
				<span class="humidity-unit">%</span>
			</div>
		</div>
	</div>
	{:else}
		<!-- Loading State - Animated Earth with orbiting Sun and Moon (Feb 22, 2042 at Giza, Egypt) -->
		<div class="celestial-container loading" style="--earth-size: {earthSize}px; --padding: {padding}px;">
			<!-- Sun (using calculated position) -->
			<div
				class="sun loading-fade-in"
				style="left: {loadingSunPosition.x}px; top: {loadingSunPosition.y}px"
			></div>
			
			<!-- Moon (using calculated position with waning crescent phase) -->
			<div
				class="moon loading-fade-in"
				style="
					left: {loadingMoonPosition.x}px;
					top: {loadingMoonPosition.y}px;
					transform: translate(-50%, -50%) scale({loadingMoonScale});
				"
			>
				<svg class="moon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
					<circle cx="50" cy="50" r="50" fill="#d4c5b0" />
					<!-- Waning crescent shadow (~97% shadow for 3% illumination) -->
					<path d="M 50,0 A 47,50 0 0,0 50,100 A 50,50 0 0,1 50,0 Z" fill="rgba(20, 15, 25, 0.95)" />
				</svg>
			</div>
			
			<div class="earth loading-earth loading-fade-in" style="background: {loadingEarthGradient}; --text-color: {loadingIsNight ? 'var(--foreground)' : 'var(--background)'}; --time-size: {timeSize}; --date-size: {dateSize}; --top-spacing: {topSpacing}; --date-margin: {dateMargin};">
				<!-- Time display while loading (centered) -->
				<div class="loading-time-section">
					<div class="time">{currentTime}</div>
					<div class="date">{currentDate}</div>
					<div class="loading-indicator">Loading weather...</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.weather-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		min-height: 400px;
		position: relative;
		overflow: visible;
	}

	/* Debug Weather Condition Dropdown */
	.celestial-container {
		position: relative;
		width: var(--earth-size, 320px);
		height: var(--earth-size, 320px);
		flex-shrink: 0;
		padding: var(--padding, 90px);
		box-sizing: content-box;
		opacity: 0;
		transition: opacity 0.8s ease-in-out;
		overflow: visible;
	}

	.celestial-container.loaded {
		opacity: 1;
	}

	.earth {
		position: relative;
		width: var(--earth-size, 320px);
		height: var(--earth-size, 320px);
		border-radius: 50%;
		box-shadow: 0 8px 32px var(--shadow);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transition: background 1s ease, color 1s ease;
		overflow: hidden;
		flex-shrink: 0;
		aspect-ratio: 1 / 1;
	}

	.sun,
	.moon {
		position: absolute;
		width: calc(var(--earth-size, 320px) * 0.1875); /* 60px / 320px = 0.1875 */
		height: calc(var(--earth-size, 320px) * 0.1875);
		border-radius: 50%;
		transition: all 0.3s ease;
		z-index: 0;
	}

	.sun {
		transform: translate(-50%, -50%); /* Center the celestial body on its position */
		background: radial-gradient(circle, #ff9d5c 0%, #e8754a 100%);
		box-shadow: 0 0 30px rgba(255, 157, 92, 0.6);
	}

	.moon {
		overflow: visible;
	}

	.moon-svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.time {
		position: relative;
		z-index: 3;
		font-size: calc(var(--time-size, 1.75) * 1rem);
		font-weight: 300;
		color: var(--text-color, var(--text-primary));
		letter-spacing: 0.5px;
		text-shadow: 0 2px 4px var(--shadow);
		font-variant-numeric: tabular-nums;
	}

	.date {
		position: relative;
		z-index: 3;
		font-size: calc(var(--date-size, 0.75) * 1rem);
		color: var(--text-color, var(--text-secondary));
		opacity: 0.7;
		margin-top: calc(var(--date-margin, 0.25) * 1rem);
		text-shadow: 0 1px 2px var(--shadow);
	}

	.location {
		position: relative;
		z-index: 3;
		font-size: calc(var(--location-size, 1) * 1rem);
		color: var(--text-color, var(--text-primary));
		opacity: 0.8;
		margin-top: 0;
		text-shadow: 0 1px 2px var(--shadow);
	}

	.condition-text {
		position: relative;
		z-index: 3;
		font-size: calc(var(--location-size, 1) * 0.75rem);
		color: var(--text-color, var(--text-primary));
		opacity: 0.6;
		margin-top: 0.15rem;
		text-shadow: 0 1px 2px var(--shadow);
		font-style: italic;
	}

	.time-date-section {
		position: absolute;
		bottom: calc(100% - var(--padding, 90px) + 1rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
		text-align: center;
		width: 100%;
	}

	.location-section {
		position: absolute;
		top: 18%;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
		text-align: center;
		width: 100%;
	}

	.temperature {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
		font-size: 5rem;
		font-weight: 600;
		color: var(--text-color, var(--text-primary));
		line-height: 1;
		text-shadow:
			0 2px 4px var(--shadow),
			0 4px 8px var(--shadow),
			0 0 20px var(--shadow);
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.degree-symbol {
		font-size: 2.5rem;
		margin-left: 0.25rem;
		margin-top: 0.5rem;
	}

	/* ======== HUMIDITY SECTION ======== */
	.humidity-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.humidity-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		opacity: 0.8;
	}

	.humidity-icon {
		font-size: 1.2rem;
	}

	.humidity-label {
		font-size: 0.55rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.7;
	}

	.humidity-stats {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.humidity-value-large {
		font-weight: 100;
		font-size: 1.8rem;
	}

	.humidity-unit {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	/* ======== BOTTOM INFO ROW ======== */
	.bottom-info-row {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		gap: 2rem;
		margin-top: -0.5rem;
		width: 100%;
	}

	/* ======== WIND SECTION ======== */
	.wind-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.wind-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		opacity: 0.8;
	}

	.wind-icon {
		font-size: var(--wind-value-size, 1.2rem);
	}

	.wind-label {
		font-size: var(--wind-label-size, 0.55rem);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.7;
	}

	.wind-stats {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.wind-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
	}

	.wind-stat-value {
		font-weight: 200;
		font-size: var(--wind-value-size, 1.4rem);
		line-height: 1;
	}

	.wind-stat-unit {
		font-size: var(--wind-unit-size, 0.7rem);
		opacity: 0.6;
	}

	.wind-stat-degrees {
		font-size: var(--wind-unit-size, 0.7rem);
		opacity: 0.5;
	}

	.wind-stat-label {
		font-size: var(--wind-label-size, 0.5rem);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		opacity: 0.5;
	}

	.wind-stat.gust .wind-stat-value {
		color: var(--warning, #f59e0b);
	}

	.wind-stat.direction {
		gap: 0.15rem;
	}

	.wind-compass {
		width: calc(var(--wind-value-size, 1.4rem) * 1.8);
		height: calc(var(--wind-value-size, 1.4rem) * 1.8);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.compass-arrow {
		width: 100%;
		height: 100%;
		transform: rotate(var(--wind-direction, 0deg));
		transition: transform 0.5s ease-out;
		color: var(--foreground);
	}

	.compass-arrow .arrow-head {
		opacity: 0.9;
	}

	.wind-stat-dir-text {
		font-size: var(--wind-unit-size, 0.7rem);
		font-weight: 500;
		opacity: 0.8;
	}

	/* ======== PRESSURE SECTION ======== */
	.pressure-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.pressure-header {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.pressure-value {
		font-weight: 100;
		font-size: var(--pressure-size, 1.8rem);
	}

	.pressure-unit {
		font-size: var(--pressure-unit-size, 0.8rem);
		opacity: 0.7;
	}

	.pressure-graph {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 0.3rem;
		gap: 0.15rem;
	}

	.pressure-sparkline {
		overflow: visible;
	}

	.pressure-graph-labels {
		display: flex;
		justify-content: space-between;
		width: 100%;
		font-size: 0.5rem;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.pressure-warning {
		font-size: 0.55rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 0.1rem;
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}

	.temp-graph-svg {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1;
		opacity: 0.7;
	}

	.humidity {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 60px;
		z-index: 0;
	}

	/* No Location Message */
	.no-location-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 400px;
		width: 100%;
	}

	.no-location-message p {
		font-size: 1.125rem;
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
	}

	/* Loading State Styles */
	.celestial-container.loading {
		opacity: 1;
	}

	.loading-fade-in {
		opacity: 0;
		animation: fadeIn 0.3s ease-out forwards;
	}

	@keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	.loading-earth {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.loading-time-section {
		text-align: center;
	}

	.loading-indicator {
		font-size: 0.875rem;
		opacity: 0.6;
		margin-top: 1rem;
		color: var(--text-color, var(--text-secondary));
		text-shadow: 0 1px 2px var(--shadow);
	}

	/* ========================================
	   Weather Condition Animations
	   Visual effects overlay on the earth sphere
	   ======================================== */

	/* Weather Animation Container */
	.weather-animation-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 50%;
		overflow: visible; /* Allow particles to start outside */
		pointer-events: none;
		z-index: 50; /* High z-index to appear above other content */
	}

	/* ======== RAIN & DRIZZLE ======== */
	.rain-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 100;
	}

	.raindrop {
		position: absolute;
		top: 0;
		width: 2px;
		background: linear-gradient(to bottom, transparent, rgba(174, 194, 224, 0.8));
		border-radius: 0 0 2px 2px;
		animation: rainFall var(--base-duration, 0.5s) linear infinite, rainGust var(--gust-cycle, 3s) ease-in-out infinite;
		z-index: 100;
	}

	.raindrop.heavy {
		width: 3px;
		background: linear-gradient(to bottom, transparent, rgba(150, 180, 220, 0.9));
	}

	@keyframes rainFall {
		0% {
			transform: translateY(0) translateX(0);
			opacity: 1;
		}
		100% {
			transform: translateY(350px) translateX(var(--wind-travel-x, 0px));
			opacity: 0;
		}
	}

	/* Gust animation oscillates the rain angle */
	@keyframes rainGust {
		0%, 100% {
			/* Base wind */
		}
		50% {
			/* Gust peak - extra travel during gusts */
		}
	}

	/* Apply rotation via a wrapper approach - rain container tilts with wind */
	.rain-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 100;
		animation: rainContainerGust var(--gust-cycle, 3s) ease-in-out infinite;
	}

	@keyframes rainContainerGust {
		0%, 100% {
			transform: rotate(var(--rain-angle-base, 0deg));
		}
		50% {
			transform: rotate(var(--rain-angle-gust, 0deg));
		}
	}

	/* ======== SNOW ======== */
	.snow-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 100;
		animation: snowContainerGust var(--gust-cycle, 3s) ease-in-out infinite;
	}

	@keyframes snowContainerGust {
		0%, 100% {
			transform: translateX(var(--snow-drift-base, 0px));
		}
		50% {
			transform: translateX(var(--snow-drift-gust, 0px));
		}
	}

	.snowflake {
		position: absolute;
		top: 0;
		color: #fff;
		text-shadow: 
			0 0 4px rgba(255, 255, 255, 0.9),
			0 0 8px rgba(200, 220, 255, 0.6),
			1px 1px 2px rgba(100, 150, 200, 0.4);
		animation: snowFall var(--base-duration, 1.5s) linear infinite;
		filter: drop-shadow(0 0 3px rgba(180, 200, 255, 0.7));
		z-index: 100;
	}

	@keyframes snowFall {
		0% {
			transform: translateY(0) rotate(0deg) translateX(0);
			opacity: 1;
		}
		10% {
			opacity: 1;
		}
		50% {
			transform: translateY(160px) rotate(180deg) translateX(calc(var(--wind-travel-x, 0px) * 0.4));
		}
		90% {
			opacity: 0.8;
		}
		100% {
			transform: translateY(350px) rotate(360deg) translateX(calc(var(--wind-travel-x, 0px) * 0.8));
			opacity: 0;
		}
	}

	/* ======== CLOUDS ======== */
	.clouds-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 100;
	}

	.cloud {
		position: absolute;
		background: radial-gradient(ellipse at center, rgba(180, 180, 200, 0.7) 0%, rgba(150, 150, 170, 0.3) 50%, transparent 70%);
		border-radius: 50%;
		filter: blur(8px);
		z-index: 100;
	}

	.cloud-1 {
		width: 120px;
		height: 60px;
		/* Start from center, animation moves it from windward edge */
		top: calc(50% - 30px);
		left: calc(50% - 60px);
		animation: cloudFloat 8s linear infinite;
	}

	.cloud-2 {
		width: 100px;
		height: 50px;
		top: calc(50% - 25px);
		left: calc(50% - 50px);
		animation: cloudFloat 10s linear infinite;
		animation-delay: -3s;
	}

	.cloud-3 {
		width: 80px;
		height: 40px;
		top: calc(50% - 20px);
		left: calc(50% - 40px);
		animation: cloudFloat 7s linear infinite;
		animation-delay: -5s;
	}

	/* Clouds move in full 360° wind direction */
	/* --wind-x: -1 to 1 (positive = blows right/east) */
	/* --wind-y: -1 to 1 (positive = blows up/north, negative = down/south) */
	@keyframes cloudFloat {
		0% {
			/* Start from windward edge (opposite of wind direction) */
			transform: translate(
				calc(var(--wind-x, 0.5) * 200px),
				calc(var(--wind-y, 0) * -100px)
			);
			opacity: 0;
		}
		10% {
			opacity: 0.6;
		}
		90% {
			opacity: 0.6;
		}
		100% {
			/* End at leeward edge (in wind direction) */
			transform: translate(
				calc(var(--wind-x, 0.5) * -200px),
				calc(var(--wind-y, 0) * 100px)
			);
			opacity: 0;
		}
	}

	/* ======== FOG ======== */
	.fog-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 100;
	}

	.fog-layer {
		position: absolute;
		width: 200%;
		height: 40%;
		left: -50%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(180, 180, 195, 0.5) 20%,
			rgba(200, 200, 215, 0.6) 50%,
			rgba(180, 180, 195, 0.5) 80%,
			transparent 100%
		);
		filter: blur(12px);
		z-index: 100;
	}

	.fog-1 {
		top: 15%;
		animation: fogDrift 4s ease-in-out infinite;
	}

	.fog-2 {
		top: 40%;
		animation: fogDrift 5s ease-in-out infinite;
		animation-delay: -2s;
	}

	.fog-3 {
		top: 65%;
		animation: fogDrift 6s ease-in-out infinite;
		animation-delay: -3s;
	}

	/* Fog drifts in 360° wind direction */
	@keyframes fogDrift {
		0%, 100% {
			transform: translate(
				calc(var(--wind-x, 0.3) * 60px),
				calc(var(--wind-y, 0) * -30px)
			);
			opacity: 0.5;
		}
		50% {
			transform: translate(
				calc(var(--wind-x, 0.3) * -60px),
				calc(var(--wind-y, 0) * 30px)
			);
			opacity: 0.7;
		}
	}

	/* ======== THUNDERSTORM ======== */
	.thunderstorm-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 100;
		/* Apply gust effect to storm container for rain angle oscillation */
		animation: rainContainerGust var(--gust-cycle, 3s) ease-in-out infinite;
	}

	.storm-rain .raindrop {
		animation: rainFall var(--base-duration, 0.3s) linear infinite;
	}

	.lightning {
		position: absolute;
		top: 10%;
		left: 30%;
		width: 4px;
		height: 80px;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 200, 0.9),
			rgba(200, 200, 255, 0.7),
			transparent
		);
		opacity: 0;
		animation: lightningFlash 2s ease-in-out infinite;
		z-index: 100;
		clip-path: polygon(
			50% 0%,
			60% 30%,
			80% 30%,
			45% 55%,
			65% 55%,
			30% 100%,
			40% 60%,
			20% 60%,
			55% 35%,
			35% 35%
		);
		transform: scaleX(2) scaleY(1.5);
		filter: blur(1px);
	}

	.lightning-2 {
		left: 60%;
		top: 15%;
		animation-delay: 3s;
		transform: scaleX(-2) scaleY(1.3);
	}

	@keyframes lightningFlash {
		0%, 100% {
			opacity: 0;
		}
		2% {
			opacity: 1;
		}
		4% {
			opacity: 0.3;
		}
		6% {
			opacity: 0.9;
		}
		8% {
			opacity: 0;
		}
		50% {
			opacity: 0;
		}
		52% {
			opacity: 0.8;
		}
		54% {
			opacity: 0;
		}
	}

	/* ======== CLEAR/SUNNY ======== */
	.clear-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.sun-rays {
		position: absolute;
		width: 100%;
		height: 100%;
		background: radial-gradient(
			circle at center,
			rgba(255, 220, 150, 0.15) 0%,
			rgba(255, 200, 100, 0.08) 30%,
			transparent 60%
		);
		animation: sunPulse 2s ease-in-out infinite;
		z-index: 100;
	}

	@keyframes sunPulse {
		0%, 100% {
			transform: scale(1);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.15);
			opacity: 1;
		}
	}

	/* Box shadow effects for weather (subtle enhancement) */
	.earth.weather-clear {
		animation: clearGlow 8s ease-in-out infinite;
	}

	@keyframes clearGlow {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 0 60px rgba(255, 200, 100, 0.03);
		}
		50% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 0 80px rgba(255, 220, 120, 0.06);
		}
	}

	.earth.weather-clouds {
		animation: cloudDrift 12s ease-in-out infinite;
	}

	@keyframes cloudDrift {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 20px -10px 60px rgba(100, 100, 120, 0.06);
		}
		33% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset -15px 5px 70px rgba(90, 90, 110, 0.08);
		}
		66% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 10px 15px 50px rgba(110, 110, 130, 0.06);
		}
	}

	.earth.weather-fog {
		animation: fogHaze 10s ease-in-out infinite;
	}

	@keyframes fogHaze {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 0 80px rgba(180, 180, 190, 0.08);
		}
		50% {
			box-shadow: 
				0 8px 40px var(--shadow),
				inset 0 0 100px rgba(200, 200, 210, 0.12);
		}
	}

	.earth.weather-drizzle {
		animation: drizzleShimmer 6s ease-in-out infinite;
	}

	@keyframes drizzleShimmer {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 -20px 40px rgba(130, 170, 200, 0.06);
		}
		50% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 -30px 50px rgba(140, 180, 210, 0.10);
		}
	}

	.earth.weather-rain {
		animation: rainRipple 4s ease-in-out infinite;
	}

	@keyframes rainRipple {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 -30px 50px rgba(100, 150, 200, 0.08);
		}
		50% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 -40px 60px rgba(110, 160, 210, 0.12);
		}
	}

	.earth.weather-snow {
		animation: snowGlow 7s ease-in-out infinite;
	}

	@keyframes snowGlow {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 0 50px rgba(220, 230, 250, 0.06);
		}
		50% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 0 70px rgba(235, 245, 255, 0.10);
		}
	}

	.earth.weather-thunderstorm {
		animation: thunderFlash 8s ease-in-out infinite;
	}

	@keyframes thunderFlash {
		0%, 100% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 -30px 50px rgba(80, 100, 140, 0.08);
		}
		11%, 13% {
			box-shadow: 
				0 8px 40px var(--shadow),
				inset 0 0 100px rgba(200, 210, 255, 0.25);
		}
		12%, 14% {
			box-shadow: 
				0 8px 32px var(--shadow),
				inset 0 -30px 50px rgba(80, 100, 140, 0.08);
		}
		51%, 53% {
			box-shadow: 
				0 8px 36px var(--shadow),
				inset 0 0 80px rgba(180, 190, 240, 0.20);
		}
	}

	/* Reduce motion for users who prefer it - temporarily disabled for testing */
	/*
	@media (prefers-reduced-motion: reduce) {
		.earth.weather-clear,
		.earth.weather-clouds,
		.earth.weather-fog,
		.earth.weather-drizzle,
		.earth.weather-rain,
		.earth.weather-snow,
		.earth.weather-thunderstorm {
			animation: none;
		}
		
		.raindrop,
		.snowflake,
		.cloud,
		.fog-layer,
		.lightning,
		.sun-rays {
			animation: none !important;
			opacity: 0.3;
		}
	}
	*/

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.time {
			font-size: 1.5rem;
		}

		.temperature {
			font-size: 4rem;
		}
	}
</style>
