<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const WEATHER_CACHE_KEY = 'dashboard-weather-data';
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
	const UNIT_PREFERENCE_KEY = 'dashboard-temp-unit';

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
	let sunrise = 0;
	let sunset = 0;
	let moonrise = 0;
	let moonset = 0;
	let isCelsius = true;

	// Load user's unit preference from localStorage
	if (browser) {
		const savedUnit = localStorage.getItem(UNIT_PREFERENCE_KEY);
		if (savedUnit !== null) {
			isCelsius = savedUnit === 'celsius';
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

	function applyWeatherData(data: WeatherData) {
		temperature = data.temperature;
		humidity = data.humidity;
		location = data.location;
		hourlyData = data.hourly || [];
		sunrise = data.sunrise || 0;
		sunset = data.sunset || 0;
		moonrise = data.moonrise || 0;
		moonset = data.moonset || 0;
		
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
			currentTime = now.toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit', 
				second: '2-digit',
				hour12: true 
			});
			
			// Format date as "2025 October 22 (Wednesday)"
			const year = now.getFullYear();
			const month = now.toLocaleString('en-US', { month: 'long' });
			const day = now.getDate();
			const weekday = now.toLocaleString('en-US', { weekday: 'long' });
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
	function getSunPosition() {
		const now = new Date();
		const currentTime = now.getTime() / 1000; // Convert to seconds
		
		// Use actual sunrise/sunset if available, otherwise use defaults
		const sunriseTime = sunrise || (6 * 3600); // Default 6am
		const sunsetTime = sunset || (18 * 3600); // Default 6pm
		
		// Get current time in seconds since midnight
		const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		
		if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight < sunsetTime) {
			// Daytime: sun rises and sets based on actual times
			const dayProgress = (secondsSinceMidnight - sunriseTime) / (sunsetTime - sunriseTime);
			const angle = Math.PI * dayProgress;
			return {
				x: 50 + Math.sin(angle) * 35,
				y: 15 + (1 - Math.cos(angle)) * 30
			};
		} else {
			// Return position off-screen when sun is not visible
			return { x: -100, y: -100 };
		}
	}

	// Calculate moon position based on moonrise/moonset
	function getMoonPosition() {
		const now = new Date();
		const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		
		// Use actual moonrise/moonset if available, otherwise use defaults
		const moonriseTime = moonrise || (18 * 3600); // Default 6pm
		const moonsetTime = moonset || (6 * 3600); // Default 6am
		
		// Handle moon crossing midnight
		let isVisible = false;
		let moonProgress = 0;
		
		if (moonriseTime < moonsetTime) {
			// Moon doesn't cross midnight (rises and sets same day)
			isVisible = secondsSinceMidnight >= moonriseTime && secondsSinceMidnight < moonsetTime;
			moonProgress = (secondsSinceMidnight - moonriseTime) / (moonsetTime - moonriseTime);
		} else {
			// Moon crosses midnight
			isVisible = secondsSinceMidnight >= moonriseTime || secondsSinceMidnight < moonsetTime;
			if (secondsSinceMidnight >= moonriseTime) {
				moonProgress = (secondsSinceMidnight - moonriseTime) / (86400 - moonriseTime + moonsetTime);
			} else {
				moonProgress = (86400 - moonriseTime + secondsSinceMidnight) / (86400 - moonriseTime + moonsetTime);
			}
		}
		
		if (isVisible) {
			const angle = Math.PI * moonProgress;
			return {
				x: 50 + Math.sin(angle) * 35,
				y: 15 + (1 - Math.cos(angle)) * 30
			};
		} else {
			// Return position off-screen when moon is not visible
			return { x: -100, y: -100 };
		}
	}

	$: sunPosition = getSunPosition();
	$: moonPosition = getMoonPosition();
	$: isNight = new Date().getHours() < 6 || new Date().getHours() >= 18;
</script>

<div class="weather-widget">
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

	<!-- Sun (Behind the circle) -->
	<div 
		class="celestial-body sun" 
		style="left: {sunPosition.x}%; top: {sunPosition.y}%"
	></div>
	
	<!-- Moon (Behind the circle) -->
	<div 
		class="celestial-body moon" 
		style="left: {moonPosition.x}%; top: {moonPosition.y}%"
	>
		<div class="moon-crescent"></div>
	</div>
	
	<div class="weather-circle" class:night={isNight}>

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

<style>
	.weather-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		min-height: 400px;
		position: relative;
	}

	.weather-circle {
		position: relative;
		width: 320px;
		height: 320px;
		border-radius: 50%;
		background: linear-gradient(135deg, 
			rgba(212, 163, 115, 0.91) 0%,
			rgba(176, 137, 104, 0.91) 30%,
			rgba(156, 122, 98, 0.91) 60%,
			rgba(139, 111, 94, 0.91) 100%
		);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transition: background 0.5s ease;
		overflow: hidden;
		flex-shrink: 0;
		aspect-ratio: 1 / 1;
	}

	.weather-circle.night {
		background: linear-gradient(135deg, 
			rgba(74, 63, 94, 0.91) 0%,
			rgba(61, 53, 82, 0.91) 30%,
			rgba(52, 45, 71, 0.91) 60%,
			rgba(42, 37, 60, 0.91) 100%
		);
	}

	.celestial-body {
		position: absolute;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		transition: all 1s ease;
		z-index: 0;
	}

	.celestial-body.sun {
		background: radial-gradient(circle, #ff9d5c 0%, #e8754a 100%);
		box-shadow: 0 0 30px rgba(255, 157, 92, 0.6);
	}

	.celestial-body.moon {
		background: radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);
		box-shadow: 0 0 20px rgba(245, 230, 211, 0.4);
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
		color: rgba(255, 255, 255, 0.95);
		letter-spacing: 0.5px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		font-variant-numeric: tabular-nums;
	}

	.date {
		position: relative;
		z-index: 3;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 0.25rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.location {
		position: relative;
		z-index: 3;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.8);
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
		color: rgba(255, 255, 255, 0.98);
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
		color: rgba(255, 255, 255, 0.9);
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

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.weather-circle {
			width: 280px;
			height: 280px;
		}

		.time {
			font-size: 1.5rem;
		}

		.temperature {
			font-size: 4rem;
		}

		.celestial-body {
			width: 50px;
			height: 50px;
		}
	}
</style>
