<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';
	import WeatherWidgetSettings from './WeatherWidgetSettings.svelte';

	export let widget: Widget;

	const WEATHER_CACHE_KEY = 'dashboard-weather-data';
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
	const GLOBAL_UNIT_PREFERENCE_KEY = 'dashboard-temp-unit-global';
	const ZIP_CODE_KEY = 'dashboard-zip-code';

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
	let condition = 'partly-cloudy';
	let hourlyData: HourlyData[] = [];
	let isLoading = true;
	let hasLocationData = false;
	let sunrise = 0;
	let sunset = 0;
	let moonrise = 0;
	let moonset = 0;
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
	
	// Coordinates (if available)
	let latitude: number | null = null;
	let longitude: number | null = null;
	let lastUpdate = 0;
	let description = '';
	
	// Zip code override
	let savedZipCode = '';
	let zipCodeInput = '';
	
	// Settings modal
	let isSettingsOpen = false;
	
	// Time test mode
	let testDateOffset = 0; // Minutes offset from current time (negative = past)

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

	// Listen for global temperature unit changes
	if (browser) {
		window.addEventListener('temperature-unit-changed', ((event: CustomEvent) => {
			// Only update if this widget doesn't have a specific unit set
			if (!widget.config?.temperatureUnit) {
				isCelsius = event.detail.unit === 'celsius';
			}
		}) as EventListener);
	}

	// Reactive temperature display - explicitly depends on both temperature and isCelsius
	$: displayTemp = isCelsius ? Math.round((temperature - 32) * 5 / 9) : temperature;

	// Save unit preference and toggle
	function setUnit(useCelsius: boolean) {
		isCelsius = useCelsius;
		// Note: This updates the visual display only
		// To persist, user should use widget settings
	}

	// Settings handlers
	export function openSettings() {
		isSettingsOpen = true;
	}

	function closeSettings() {
		isSettingsOpen = false;
	}

	function handleSettingsSave(location: any, temperatureUnit?: 'celsius' | 'fahrenheit') {
		if (location) {
			// Update widget config with the new location and temperature unit
			widgets.updateWidgetConfig(widget.id, {
				location: location,
				temperatureUnit: temperatureUnit
			});
			
			// Update temperature display
			if (temperatureUnit) {
				isCelsius = temperatureUnit === 'celsius';
			}
			
			// Reload weather with new location
			localStorage.removeItem(WEATHER_CACHE_KEY);
			hasLocationData = false;
			fetchWeatherFromAPI(location.lat, location.lon);
		} else {
			// Clear widget-specific location, update temperature unit
			widgets.updateWidgetConfig(widget.id, {
				temperatureUnit: temperatureUnit
			});
			
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
			
			// Clear widget-specific location, use global
			widgets.updateWidgetConfig(widget.id, {
				location: undefined
			});
			
			// Reload weather with global location
			localStorage.removeItem(WEATHER_CACHE_KEY);
			hasLocationData = false;
			loadWeatherData();
		}
	}

	// Load weather data from cache or API
	async function loadWeatherData() {
		if (!browser) return;

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
		location = data.location;
		description = data.description || '';
		hourlyData = data.hourly || [];
		sunrise = data.sunrise || 0;
		sunset = data.sunset || 0;
		moonrise = data.moonrise || 0;
		moonset = data.moonset || 0;
		if (data.moonPhase !== undefined) {
			moonPhase = data.moonPhase;
		}
		timezone = data.timezone || '';
		timezoneOffset = data.timezoneOffset || 0;
		lastUpdate = data.timestamp || Date.now();
		
		// Mark that we have location data
		hasLocationData = true;
		
		// Map OpenWeather conditions to our conditions
		const weatherCondition = data.condition.toLowerCase();
		if (weatherCondition.includes('clear')) {
			condition = 'sunny';
		} else if (weatherCondition.includes('cloud')) {
			condition = 'partly-cloudy';
		} else if (weatherCondition.includes('rain')) {
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
		
		const updateTime = () => {
			const now = new Date();
			currentTimestamp = now.getTime(); // Update timestamp to trigger reactive statements
			
			// Calculate the display date based on timezone offset and time travel offset
			let displayDate: Date;
			if (timezoneOffset !== 0) {
				// Apply both location's timezone offset and time travel offset
				const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
				const locationTime = utcTime + (timezoneOffset * 1000);
				displayDate = new Date(locationTime + testDateOffset * 60 * 1000);
			} else {
				// Apply time travel offset to local time
				displayDate = new Date(now.getTime() + testDateOffset * 60 * 1000);
			}
				
			currentTime = displayDate.toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit', 
				second: '2-digit',
				hour12: true 
			});
			
			// Format date as "2025 October 22 (Wednesday)"
			const year = displayDate.getFullYear();
			const month = displayDate.toLocaleString('en-US', { month: 'long' });
			const day = displayDate.getDate();
			const weekday = displayDate.toLocaleString('en-US', { weekday: 'long' });
			currentDate = `${year} ${month} ${day} (${weekday})`;
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		
		// Load weather data
		loadWeatherData();
		
		// Refresh weather data every 5 minutes
		const weatherInterval = setInterval(() => {
			fetchWeatherData();
		}, CACHE_DURATION);
		
		return () => {
			clearInterval(interval);
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

	// Calculate sun position based on sunrise/sunset
	function getSunPosition(testDate: Date) {
		// Convert Unix timestamps to seconds since midnight (local time)
		let sunriseTime = 6 * 3600; // Default 6am
		let sunsetTime = 18 * 3600; // Default 6pm
		
		if (sunrise) {
			const sunriseDate = new Date(sunrise * 1000);
			sunriseTime = sunriseDate.getHours() * 3600 + sunriseDate.getMinutes() * 60 + sunriseDate.getSeconds();
		}
		if (sunset) {
			const sunsetDate = new Date(sunset * 1000);
			sunsetTime = sunsetDate.getHours() * 3600 + sunsetDate.getMinutes() * 60 + sunsetDate.getSeconds();
		}
		
		// Get current time in seconds since midnight
		const secondsSinceMidnight = testDate.getHours() * 3600 + testDate.getMinutes() * 60 + testDate.getSeconds();
		
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
		const secondsSinceMidnight = testDate.getHours() * 3600 + testDate.getMinutes() * 60 + testDate.getSeconds();
		
		// Convert Unix timestamps to seconds since midnight (local time)
		let moonriseTime = 18 * 3600; // Default 6pm
		let moonsetTime = 6 * 3600; // Default 6am
		
		if (moonrise) {
			const moonriseDate = new Date(moonrise * 1000);
			moonriseTime = moonriseDate.getHours() * 3600 + moonriseDate.getMinutes() * 60 + moonriseDate.getSeconds();
		}
		if (moonset) {
			const moonsetDate = new Date(moonset * 1000);
			moonsetTime = moonsetDate.getHours() * 3600 + moonsetDate.getMinutes() * 60 + moonsetDate.getSeconds();
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
	// Track testDateOffset and currentTimestamp to trigger recalculation
	$: if (currentTimestamp && testDateOffset !== undefined) {
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
		
		// For determining day/night, use the location's hour
		let displayHour: number;
		if (timezoneOffset !== 0) {
			const utcTime = testDate.getTime() + (testDate.getTimezoneOffset() * 60 * 1000);
			const locationTime = new Date(utcTime + (timezoneOffset * 1000));
			displayHour = locationTime.getHours();
		} else {
			displayHour = testDate.getHours();
		}
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

		<div class="earth" style="background: {earthGradient}; --text-color: {textColor}; --time-size: {timeSize}; --date-size: {dateSize}; --location-size: {locationSize}; --top-spacing: {topSpacing}; --date-margin: {dateMargin}; --location-margin: {locationMargin}">
		<!-- Time and Date Section -->
		<div class="time-date-section">
			<div class="time">{currentTime}</div>
			<div class="date">{currentDate}</div>
			<div class="location">{location}</div>
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

		<!-- Humidity - Below Temperature -->
		<div class="humidity-center">
			<span class="humidity-value">{humidity}</span>
			<span class="humidity-symbols">
				<span class="symbol-phi">φ</span>
				<span class="symbol-percent">%</span>
				<span class="symbol-drop">💧</span>
			</span>
		</div>

			<!-- Humidity Wave (at bottom) -->
			<div class="humidity">
				<div class="humidity-wave"></div>
			</div>
		</div>
	</div>

	<!-- Time Test Slider (always shown) -->
	<div class="time-test-slider">
		<label for="time-offset">
			Time: {testDateOffset === 0 ? 'Now' : `${Math.abs(testDateOffset)} mins ago`}
		</label>
		<input 
			id="time-offset"
			type="range" 
			min="-1440" 
			max="0" 
			step="10"
			bind:value={testDateOffset}
		/>
		<div class="slider-labels">
			<span>24h ago</span>
			<span>12h ago</span>
			<span>Now</span>
		</div>
		<div class="time-test-info">
			ℹ️ Time travel currently changes the time but not the weather data (YET!)
		</div>
	</div>
	{:else}
		<!-- No Location Message -->
		<div class="no-location-message">
			<p>Set location in Settings to view weather</p>
		</div>
	{/if}
</div>

<!-- Widget Settings Modal -->
<WeatherWidgetSettings
	isOpen={isSettingsOpen}
	onClose={closeSettings}
	onSave={handleSettingsSave}
	initialLocation={widget.config?.location}
	initialTemperatureUnit={widget.config?.temperatureUnit}
/>

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

	.time-date-section {
		position: absolute;
		top: calc(var(--top-spacing, 0.9) * 1rem);
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

	.humidity-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 3rem;
		z-index: 2;
		font-size: 1.5rem;
		font-weight: 300;
		color: var(--text-color, var(--text-primary));
		text-shadow: 0 2px 4px var(--shadow);
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.humidity-value {
		font-weight: 600;
		font-size: 1.5rem;
	}

	.humidity-symbols {
		display: grid;
		grid-template-columns: auto auto;
		grid-template-rows: auto auto;
		gap: 0.1rem;
		font-size: 0.7rem;
		opacity: 0.8;
		align-items: center;
		justify-items: center;
	}

	.symbol-phi {
		grid-column: 1 / 3;
		grid-row: 1;
		font-size: 0.7rem;
	}

	.symbol-percent {
		grid-column: 1;
		grid-row: 2;
		font-size: 0.7rem;
	}

	.symbol-drop {
		grid-column: 2;
		grid-row: 2;
		font-size: 0.7rem;
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

	.humidity-wave {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40px;
		background: linear-gradient(180deg,
			rgba(100, 150, 200, 0.3) 0%,
			rgba(80, 130, 180, 0.4) 50%,
			rgba(60, 110, 160, 0.5) 100%
		);
		border-radius: 0 0 160px 160px;
		clip-path: ellipse(160px 40px at 50% 100%);
	}

	/* Time Test Slider */
	.time-test-slider {
		width: 100%;
		max-width: 320px;
		padding: 1rem;
		background: var(--surface-variant);
		border-radius: 12px;
		border: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.time-test-info {
		padding: 0.625rem 0.75rem;
		background: color-mix(in srgb, var(--primary-color) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
		border-radius: 6px;
		color: var(--primary-color);
		font-size: 0.75rem;
		text-align: center;
		margin-top: 0.25rem;
	}

	.time-test-slider label {
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
	}

	.time-test-slider input[type="range"] {
		width: 100%;
		height: 6px;
		background: var(--surface-container-high);
		border-radius: 3px;
		outline: none;
		appearance: none;
		-webkit-appearance: none;
	}

	.time-test-slider input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background: var(--text-primary);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px var(--shadow);
	}

	.time-test-slider input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: var(--text-primary);
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px var(--shadow);
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		color: var(--text-secondary);
		font-size: 0.75rem;
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
