<script lang="ts">
	import { onMount } from 'svelte';

	let currentTime = '';
	let temperature = 72;
	let humidity = 65;
	let location = 'Lewiston, ME';
	let condition = 'partly-cloudy'; // sunny, cloudy, partly-cloudy, rainy, night

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
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
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

	// Calculate sun/moon position (CSS custom property will be set)
	function getSunPosition() {
		const now = new Date();
		const hours = now.getHours() + now.getMinutes() / 60;
		
		if (hours >= 6 && hours < 18) {
			// Daytime: sun rises at 6am, sets at 6pm
			const dayProgress = (hours - 6) / 12;
			const angle = Math.PI * dayProgress;
			return {
				x: 50 + Math.sin(angle) * 35,
				y: 15 + (1 - Math.cos(angle)) * 30
			};
		} else {
			// Nighttime: moon
			const nightHours = hours >= 18 ? hours - 18 : hours + 6;
			const nightProgress = nightHours / 12;
			const angle = Math.PI * nightProgress;
			return {
				x: 50 + Math.sin(angle) * 35,
				y: 15 + (1 - Math.cos(angle)) * 30
			};
		}
	}

	$: sunPosition = getSunPosition();
	$: isNight = new Date().getHours() < 6 || new Date().getHours() >= 18;
</script>

<div class="weather-widget">
	<div class="weather-circle" class:night={isNight}>
		<!-- Sun or Moon -->
		<div 
			class="celestial-body" 
			class:sun={!isNight}
			class:moon={isNight}
			style="left: {sunPosition.x}%; top: {sunPosition.y}%"
		>
			{#if isNight}
				<div class="moon-crescent"></div>
			{/if}
		</div>

		<!-- Time -->
		<div class="time">{currentTime}</div>
		
		<!-- Location -->
		<div class="location">{location}</div>
		
		<!-- Temperature -->
		<div class="temperature">{temperature}°</div>
		
		<!-- Humidity -->
		<div class="humidity">
			<div class="humidity-wave"></div>
			<div class="humidity-text">{humidity}%</div>
		</div>
	</div>
</div>

<style>
	.weather-widget {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		min-height: 400px;
	}

	.weather-circle {
		position: relative;
		width: 320px;
		height: 320px;
		border-radius: 50%;
		background: linear-gradient(135deg, 
			#d4a373 0%,
			#b08968 30%,
			#9c7a62 60%,
			#8b6f5e 100%
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
			#4a3f5e 0%,
			#3d3552 30%,
			#342d47 60%,
			#2a253c 100%
		);
	}

	.celestial-body {
		position: absolute;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		transition: all 1s ease;
		z-index: 1;
		mix-blend-mode: difference;
		filter: invert(1);
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

	.time {
		font-size: 1.75rem;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.95);
		margin-top: 3rem;
		letter-spacing: 0.5px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		font-variant-numeric: tabular-nums;
	}

	.location {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 0.5rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.temperature {
		font-size: 5rem;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.98);
		margin-top: 1rem;
		line-height: 1;
		text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.humidity {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 1.5rem;
		width: 100%;
		height: 60px;
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

	.humidity-text {
		position: relative;
		font-size: 2rem;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.95);
		z-index: 2;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.weather-circle {
			width: 280px;
			height: 280px;
		}

		.time {
			font-size: 1.5rem;
			margin-top: 2.5rem;
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
