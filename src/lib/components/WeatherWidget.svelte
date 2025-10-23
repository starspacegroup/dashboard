<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	const WEATHER_CACHE_KEY = 'dashboard-weather-data';
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
	const UNIT_PREFERENCE_KEY = 'dashboard-temp-unit';
	const ZIP_CODE_KEY = 'dashboard-zip-code';

	interface WeatherData {
		temperature: number;
		humidity: number;
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
		timezone?: string;
		timezoneOffset?: number;
	}

	interface HourlyData {
		time: number;
		temperature: number;
		feelsLike: number;
		humidity: number;
		condition: string;
		icon: string;
	}

	let currentTime = '';
	let currentDate = '';
	let temperature = 72;
	let humidity = 65;
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
	let textColor = 'rgba(255, 255, 255, 0.95)';
	let moonPhase = 0; // 0 = new moon, 0.5 = full moon, 1 = new moon again
	let moonScale = 1; // Scale factor for moon size (1.0 to 1.9)
	let currentTimestamp = Date.now(); // Track current time for reactive updates
	
	// Zip code override
	let savedZipCode = '';
	let zipCodeInput = '';
	
	// Time test mode
	let timeTestMode = false;
	let testDateOffset = 0; // Minutes offset from current time (negative = past)

	// Check for timeTest URL parameter
	if (browser) {
		const urlParams = new URLSearchParams(window.location.search);
		timeTestMode = urlParams.get('timeTest') === 'true';
	}

	// Load user's unit preference from localStorage
	if (browser) {
		const savedUnit = localStorage.getItem(UNIT_PREFERENCE_KEY);
		if (savedUnit !== null) {
			isCelsius = savedUnit === 'celsius';
		}
		
		// Load saved zip code
		const savedZip = localStorage.getItem(ZIP_CODE_KEY);
		if (savedZip) {
			savedZipCode = savedZip;
			zipCodeInput = savedZip;
		}
	}

	// Convert temperature based on unit preference
	function convertTemp(temp: number): number {
		if (isCelsius) {
			return Math.round((temp - 32) * 5 / 9);
		}
		return temp;
	}

	// Reactive temperature display - explicitly depends on both temperature and isCelsius
	$: displayTemp = isCelsius ? Math.round((temperature - 32) * 5 / 9) : temperature;

	// Save unit preference and toggle
	function setUnit(useCelsius: boolean) {
		isCelsius = useCelsius;
		if (browser) {
			localStorage.setItem(UNIT_PREFERENCE_KEY, useCelsius ? 'celsius' : 'fahrenheit');
		}
	}

	// Load weather data from cache or API
	async function loadWeatherData() {
		if (!browser) return;

		// Check if there's a saved zip code override
		if (savedZipCode) {
			await fetchWeatherByZipCode(savedZipCode);
			return;
		}

		// Try to load from localStorage first
		const cached = localStorage.getItem(WEATHER_CACHE_KEY);
		if (cached) {
			try {
				const data: WeatherData = JSON.parse(cached);
				const age = Date.now() - data.timestamp;
				
				// If cache is less than 5 minutes old, use it
				if (age < CACHE_DURATION) {
					applyWeatherData(data);
					isLoading = false;
					return;
				}
			} catch (error) {
				console.error('Error parsing cached weather data:', error);
			}
		}

		// Cache is stale or doesn't exist, fetch new data
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
					async () => {
						// Geolocation failed, use default city
						await fetchWeatherFromAPI();
					}
				);
			} else {
				// Geolocation not supported, use default city
				await fetchWeatherFromAPI();
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
			
			console.log('Fetching weather from:', url);
			
			const response = await fetch(url);
			
			console.log('Weather API response status:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Weather API error:', errorText);
				throw new Error(`Failed to fetch weather: ${response.status}`);
			}

			const data: WeatherData = await response.json();
			
			console.log('Weather data received:', data);
			
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

	async function fetchWeatherByZipCode(zipCode: string) {
		try {
			const url = `/api/weather?zip=${zipCode}`;
			
			console.log('Fetching weather by zip code:', url);
			
			const response = await fetch(url);
			
			console.log('Weather API response status:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Weather API error:', errorText);
				throw new Error(`Failed to fetch weather: ${response.status}`);
			}

			const data: WeatherData = await response.json();
			
			console.log('Weather data received:', data);
			
			// Save to localStorage
			localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
			
			// Apply the data
			applyWeatherData(data);
			isLoading = false;
		} catch (error) {
			console.error('Error fetching weather by zip code:', error);
			isLoading = false;
		}
	}

	function handleZipCodeSubmit() {
		const trimmedZip = zipCodeInput.trim();
		
		// Validate zip code format (5 digits)
		if (!trimmedZip || !/^\d{5}$/.test(trimmedZip)) {
			alert('Please enter a valid 5-digit ZIP code');
			return;
		}
		
		// Save zip code to localStorage
		savedZipCode = trimmedZip;
		localStorage.setItem(ZIP_CODE_KEY, savedZipCode);
		
		// Clear cached weather data to force fresh fetch
		localStorage.removeItem(WEATHER_CACHE_KEY);
		
		// Reset location flag to trigger fade effect
		hasLocationData = false;
		
		// Immediately fetch weather with new zip code
		fetchWeatherByZipCode(savedZipCode);
	}

	function handleResetLocation() {
		// Clear zip code
		savedZipCode = '';
		zipCodeInput = '';
		localStorage.removeItem(ZIP_CODE_KEY);
		
		// Clear cached weather data
		localStorage.removeItem(WEATHER_CACHE_KEY);
		
		// Reset location flag to trigger fade-out/in
		hasLocationData = false;
		
		// Fetch weather data using browser location
		fetchWeatherData();
	}

	function applyWeatherData(data: WeatherData) {
		temperature = data.temperature;
		humidity = data.humidity;
		location = data.location;
		hourlyData = data.hourly || [];
		sunrise = data.sunrise || 0;
		sunset = data.sunset || 0;
		moonrise = data.moonrise || 0;
		moonset = data.moonset || 0;
		timezone = data.timezone || '';
		timezoneOffset = data.timezoneOffset || 0;
		
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

	// Generate SVG path for temperature graph
	$: temperaturePath = generateTemperaturePath(hourlyData);

	function generateTemperaturePath(hourly: HourlyData[]): string {
		if (hourly.length === 0) return '';

		const width = 320;
		const height = 80;
		const padding = 0;

		// Find min and max temperatures for scaling (always use Fahrenheit for graph)
		const temps = hourly.map(h => h.temperature);
		const minTemp = Math.min(...temps);
		const maxTemp = Math.max(...temps);
		const tempRange = maxTemp - minTemp || 10; // Avoid division by zero

		// Generate path points - simple line connecting all 24 points
		const points = hourly.map((hour, index) => {
			const x = padding + (index / (hourly.length - 1)) * (width - 2 * padding);
			const normalizedTemp = (hour.temperature - minTemp) / tempRange;
			const y = height - padding - normalizedTemp * (height - 2 * padding);
			return `${x},${y}`;
		});

		// Create simple polyline path
		return `M ${points.join(' L ')}`;
	}

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

	// Update time every second
	onMount(() => {
		const updateTime = () => {
			const now = new Date();
			currentTimestamp = now.getTime(); // Update timestamp to trigger reactive statements
			
			// Calculate the display date based on timezone offset
			let displayDate: Date;
			if (timeTestMode) {
				// In time test mode, start from location's time and apply offset
				if (timezoneOffset !== 0) {
					const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
					const locationTime = utcTime + (timezoneOffset * 1000);
					displayDate = new Date(locationTime + testDateOffset * 60 * 1000);
				} else {
					displayDate = new Date(now.getTime() + testDateOffset * 60 * 1000);
				}
			} else if (timezoneOffset !== 0) {
				// Apply location's timezone offset
				// Get UTC time, then add the location's offset
				const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
				displayDate = new Date(utcTime + (timezoneOffset * 1000));
			} else {
				displayDate = now;
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
		
		// Constants for orbit calculation
		const padding = 40; // Container padding
		const earthSize = 320;
		const earthRadius = earthSize / 2; // 160px
		const sunRadius = 30; // Half of sun's 60px width
		
		// Calculate the angle based on time
		// The sun should be behind the Earth (bottom) from sunset to sunrise
		// And visible (rising to top to setting) from sunrise to sunset
		let angle;
		let orbitRadius;
		
		if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight <= sunsetTime) {
			// Sun is visible - daylight hours
			// Calculate solar noon as the midpoint between sunrise and sunset
			const solarNoonTime = (sunriseTime + sunsetTime) / 2;
			
			// Split into two phases: sunrise → noon, and noon → sunset
			if (secondsSinceMidnight <= solarNoonTime) {
				// Morning: sunrise to solar noon
				// Map from left (270° = -90°) to top (0° = -90° + 90° = 0° adjusted)
				const morningDuration = solarNoonTime - sunriseTime;
				const morningProgress = (secondsSinceMidnight - sunriseTime) / morningDuration;
				// Progress from 270° to 360° (or -90° to 0° in radians)
				angle = -Math.PI/2 + (morningProgress * Math.PI/2); // -90° to 0°
				
				// Orbit expands from minimum to maximum
				const expansionProgress = Math.sin(morningProgress * Math.PI/2); // 0 → 1
				const minOrbitRadius = earthRadius + (sunRadius * 0.1); // 166px
				const maxOrbitRadius = earthRadius + sunRadius; // 190px
				orbitRadius = minOrbitRadius + (expansionProgress * (maxOrbitRadius - minOrbitRadius));
			} else {
				// Afternoon: solar noon to sunset
				// Map from top (0°) to right (90°)
				const afternoonDuration = sunsetTime - solarNoonTime;
				const afternoonProgress = (secondsSinceMidnight - solarNoonTime) / afternoonDuration;
				angle = 0 + (afternoonProgress * Math.PI/2); // 0° to 90°
				
				// Orbit contracts from maximum to minimum
				const contractionProgress = Math.cos(afternoonProgress * Math.PI/2); // 1 → 0
				const minOrbitRadius = earthRadius + (sunRadius * 0.1); // 166px
				const maxOrbitRadius = earthRadius + sunRadius; // 190px
				orbitRadius = minOrbitRadius + (contractionProgress * (maxOrbitRadius - minOrbitRadius));
			}
		} else {
			// Sun is hidden - nighttime hours (sunset to sunrise on the opposite side)
			// Calculate solar midnight as the midpoint between sunset and next sunrise
			const solarMidnightTime = (sunsetTime + sunriseTime + 86400) / 2; // Add 86400 to get next sunrise
			
			// Use smaller orbit radius to keep sun completely hidden behind Earth during night
			const nightOrbitRadius = earthRadius - (sunRadius * 1.5); // Sun stays well behind Earth
			
			// Split night into two phases: sunset → midnight, and midnight → sunrise
			if (secondsSinceMidnight <= sunriseTime) {
				// Early morning before sunrise (after midnight)
				// Calculate night duration and progress
				const nightDuration = (86400 - sunsetTime) + sunriseTime; // Total night duration
				const effectiveMidnight = solarMidnightTime > 86400 ? solarMidnightTime - 86400 : solarMidnightTime;
				
				// From midnight to sunrise
				const preSunriseDuration = sunriseTime - effectiveMidnight;
				const preSunriseProgress = (secondsSinceMidnight - effectiveMidnight) / preSunriseDuration;
				
				// Progress from bottom (180°) to left (270°)
				angle = Math.PI + (preSunriseProgress * Math.PI/2); // 180° to 270°
				
				// Keep orbit small and constant during night
				orbitRadius = nightOrbitRadius;
			} else {
				// Evening after sunset (before midnight)
				const nightDuration = (86400 - sunsetTime) + sunriseTime;
				const effectiveMidnight = solarMidnightTime > 86400 ? solarMidnightTime - 86400 : solarMidnightTime;
				
				// From sunset to midnight
				const postSunsetDuration = (effectiveMidnight + (solarMidnightTime > 86400 ? 86400 : 0)) - sunsetTime;
				const postSunsetProgress = (secondsSinceMidnight - sunsetTime) / postSunsetDuration;
				
				// Progress from right (90°) to bottom (180°)
				angle = Math.PI/2 + (postSunsetProgress * Math.PI/2); // 90° to 180°
				
				// Keep orbit small and constant during night
				orbitRadius = nightOrbitRadius;
			}
		}
		
		// Rotate all angles by -90° to align 0° with top instead of right
		// In standard math: 0° = right, 90° = top, 180° = left, 270° = bottom
		// We want: 0° = top, 90° = right, 180° = bottom, 270° = left
		angle = angle - Math.PI/2; // Subtract 90° to rotate coordinate system
		
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
		
		// Constants for orbit calculation
		const padding = 40; // Container padding
		const earthSize = 320;
		const earthRadius = earthSize / 2; // 160px
		const moonRadius = 30; // Half of moon's 60px width
		
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
			: 'rgba(255, 255, 255, 0.95)'; // Light text for dark backgrounds
		
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

	// Reactive calculations for sun/moon positions and night mode
	// Track testDateOffset and currentTimestamp to trigger recalculation
	$: if (currentTimestamp && testDateOffset !== undefined) {
		const now = new Date(currentTimestamp);
		
		// For sun/moon positions, we need to work with the actual moment in time
		// The sunrise/sunset/moonrise/moonset are Unix timestamps (absolute moments)
		let testDate: Date;
		if (timeTestMode) {
			// In time test mode, just apply the offset to current time
			// Don't convert to location timezone - that's only for display
			testDate = new Date(now.getTime() + testDateOffset * 60 * 1000);
		} else {
			// Use current time - sun/moon calculations use Unix timestamps which are absolute
			testDate = now;
		}
		
		sunPosition = getSunPosition(testDate);
		const moonData = getMoonPosition(testDate);
		moonPosition = { x: moonData.x, y: moonData.y };
		moonScale = moonData.scale;
		moonPhase = calculateMoonPhase(testDate);
		
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

<div class="weather-widget" class:loaded={hasLocationData}>
	<!-- Temperature Unit Toggle Switch -->
	<div class="unit-switch-container">
		<button 
			class="unit-option" 
			class:active={!isCelsius}
			on:click={() => setUnit(false)}
		>
			°F
		</button>
		<button 
			class="unit-option" 
			class:active={isCelsius}
			on:click={() => setUnit(true)}
		>
			°C
		</button>
	</div>

	<!-- Celestial System Container (centers everything together) -->
	<div class="celestial-container">
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
			<div class="moon-surface"></div>
			<div 
				class="moon-shadow" 
				style="
					transform: translateX({moonPhase < 0.5 ? (1 - moonPhase * 2) * 30 : (moonPhase - 0.5) * 2 * -30}px) scaleX({moonPhase < 0.5 ? 1 : -1});
					opacity: {Math.abs(moonPhase - 0.5) * 2};
				"
			></div>
			<div class="moon-crescent"></div>
		</div>
		
		<div class="earth" style="background: {earthGradient}; --text-color: {textColor}">

		<!-- Time and Date Section -->
		<div class="time-date-section">
			<div class="time">{currentTime}</div>
			<div class="date">{currentDate}</div>
			<div class="location">{location}</div>
		</div>
		
		<!-- 24-Hour Temperature Graph (layered behind temperature) -->
		{#if hourlyData.length > 0}
			<svg class="temp-graph-svg" width="320" height="80" viewBox="0 0 320 80">
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
	
	<!-- Time Test Slider (only shown when ?timeTest=true) -->
	{#if timeTestMode}
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
		</div>
	{/if}
	
	<!-- Zip Code Entry Form -->
	<div class="location-controls">
		<form on:submit|preventDefault={handleZipCodeSubmit} class="zip-form">
			<input 
				type="text" 
				bind:value={zipCodeInput}
				placeholder="Enter ZIP code"
				inputmode="numeric"
				maxlength="5"
				class="zip-input"
			/>
			<button type="submit" class="zip-submit">
				Set Location
			</button>
		</form>
		{#if savedZipCode}
			<button on:click={handleResetLocation} class="reset-button">
				Reset to Browser Location
			</button>
		{/if}
	</div>
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
		opacity: 0;
		transition: opacity 0.8s ease-in-out;
	}

	.weather-widget.loaded {
		opacity: 1;
	}

	.celestial-container {
		position: relative;
		width: 320px;
		height: 320px;
		flex-shrink: 0;
		padding: 40px;
		box-sizing: content-box;
	}

	.earth {
		position: relative;
		width: 320px;
		height: 320px;
		border-radius: 50%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
		width: 60px;
		height: 60px;
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
		background: radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);
		box-shadow: 0 0 20px rgba(245, 230, 211, 0.4);
		overflow: hidden;
	}

	.moon-surface {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);
		z-index: 1;
	}

	.moon-shadow {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(20, 15, 25, 0.95) 0%, rgba(40, 35, 45, 0.9) 100%);
		z-index: 2;
		transition: transform 0.3s ease, opacity 0.3s ease;
	}

	.moon-crescent {
		position: absolute;
		top: 5px;
		right: 8px;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(180, 150, 130, 0.3) 0%, rgba(140, 120, 100, 0.5) 100%);
		box-shadow: inset -4px -2px 8px rgba(0, 0, 0, 0.2);
		z-index: 3;
	}

	.unit-switch-container {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px var(--shadow);
	}

	.unit-option {
		padding: 0.4rem 0.8rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 40px;
	}

	.unit-option:hover {
		background: var(--hover-bg);
	}

	.unit-option.active {
		background: var(--primary);
		color: white;
	}

	.time {
		position: relative;
		z-index: 3;
		font-size: 1.75rem;
		font-weight: 300;
		color: var(--text-color, rgba(255, 255, 255, 0.95));
		letter-spacing: 0.5px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		font-variant-numeric: tabular-nums;
	}

	.date {
		position: relative;
		z-index: 3;
		font-size: 0.75rem;
		color: var(--text-color, rgba(255, 255, 255, 0.7));
		opacity: 0.7;
		margin-top: 0.25rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.location {
		position: relative;
		z-index: 3;
		font-size: 1rem;
		color: var(--text-color, rgba(255, 255, 255, 0.8));
		opacity: 0.8;
		margin-top: 0.5rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.time-date-section {
		position: absolute;
		top: 0.9rem;
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
		color: var(--text-color, rgba(255, 255, 255, 0.98));
		line-height: 1;
		text-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.4),
			0 4px 8px rgba(0, 0, 0, 0.3),
			0 0 20px rgba(0, 0, 0, 0.2);
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
		color: var(--text-color, rgba(255, 255, 255, 0.9));
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.time-test-slider label {
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
	}

	.time-test-slider input[type="range"] {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
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
		background: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.time-test-slider input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.75rem;
	}

	/* Location Controls */
	.location-controls {
		width: 100%;
		max-width: 320px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.zip-form {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	.zip-input {
		flex: 1;
		padding: 0.6rem 0.875rem;
		font-size: 0.875rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.95);
		outline: none;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.zip-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.zip-input:focus {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.4);
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
	}

	.zip-submit {
		padding: 0.6rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.95);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.zip-submit:hover {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.zip-submit:active {
		transform: scale(0.98);
	}

	.reset-button {
		width: 100%;
		padding: 0.6rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: rgba(255, 100, 100, 0.15);
		border: 1px solid rgba(255, 100, 100, 0.3);
		border-radius: 8px;
		color: rgba(255, 150, 150, 0.95);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.reset-button:hover {
		background: rgba(255, 100, 100, 0.25);
		border-color: rgba(255, 100, 100, 0.4);
	}

	.reset-button:active {
		transform: scale(0.98);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.celestial-container {
			width: 280px;
			height: 280px;
		}

		.earth {
			width: 280px;
			height: 280px;
		}

		.time {
			font-size: 1.5rem;
		}

		.temperature {
			font-size: 4rem;
		}

		.sun,
		.moon {
			width: 50px;
			height: 50px;
		}
	}
</style>
