<script lang="ts">
	import { browser } from '$app/environment';

	export let selectedLocation: Location | null = null;
	export let onLocationSelect: (location: Location | null) => void;
	export let savedLocation: Location | null = null;
	export let showClearButton = true;

	interface Location {
		name: string;
		state: string;
		country: string;
		lat: number;
		lon: number;
		displayName: string;
	}

	let searchQuery = '';
	let searchResults: Location[] = [];
	let isSearching = false;
	let hoveredLocation: Location | null = null;
	let searchTimeout: number;

	// Initialize search query if there's a selected location
	$: if (selectedLocation && !searchQuery) {
		searchQuery = selectedLocation.displayName;
	}

	// Search for locations with debounce
	async function searchLocations() {
		if (!searchQuery || searchQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		isSearching = true;

		try {
			const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
			const data = await response.json();

			if (data.results) {
				searchResults = data.results;
			}
		} catch (error) {
			console.error('Search error:', error);
		} finally {
			isSearching = false;
		}
	}

	// Debounced search
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(searchLocations, 300) as unknown as number;
	}

	// Handle location selection
	function selectLocation(location: Location) {
		selectedLocation = location;
		searchQuery = location.displayName;
		searchResults = [];
		onLocationSelect(location);
	}

	// Clear location
	function clearLocation() {
		selectedLocation = null;
		searchQuery = '';
		onLocationSelect(null);
	}

	// Get display location for map
	$: displayLocation = hoveredLocation || selectedLocation || savedLocation;
</script>

<div class="location-picker">
	<!-- Current Saved Location -->
	{#if savedLocation && showClearButton}
		<div class="saved-location">
			<div class="saved-location-info">
				<span class="location-icon">📍</span>
				<div class="location-details">
					<div class="location-name">{savedLocation.displayName}</div>
					<div class="location-coords">
						{savedLocation.lat.toFixed(4)}°, {savedLocation.lon.toFixed(4)}°
					</div>
				</div>
			</div>
			<button class="clear-button" on:click={clearLocation} type="button">
				Clear
			</button>
		</div>
	{/if}

	<!-- Search Input -->
	<div class="search-container">
		<div class="search-input-wrapper">
			<span class="search-icon">🔍</span>
			<input
				type="text"
				class="search-input"
				placeholder="Search by city, zip code..."
				bind:value={searchQuery}
				on:input={handleSearchInput}
				autocomplete="off"
			/>
			{#if isSearching}
				<span class="loading-spinner">⟳</span>
			{/if}
		</div>

		<!-- Search Results -->
		{#if searchResults.length > 0}
			<div class="search-results">
				{#each searchResults as result}
					<button
						class="search-result-item"
						class:selected={selectedLocation?.lat === result.lat && selectedLocation?.lon === result.lon}
						on:click={() => selectLocation(result)}
						on:mouseenter={() => hoveredLocation = result}
						on:mouseleave={() => hoveredLocation = null}
						type="button"
					>
						<span class="result-icon">📍</span>
						<div class="result-info">
							<div class="result-name">{result.displayName}</div>
							<div class="result-coords">
								{result.lat.toFixed(4)}°, {result.lon.toFixed(4)}°
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Map Preview -->
	<div class="map-container">
		<svg class="map-svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
			<!-- World map (simplified) -->
			<rect width="800" height="400" fill="var(--surface-variant)" />
			
			<!-- Crude continents -->
			<g class="continents" fill="var(--surface-container-high)" stroke="var(--border)" stroke-width="1">
				<!-- North America -->
				<path d="M 150 80 Q 120 60 100 50 Q 80 45 60 50 Q 40 60 35 80 Q 30 100 40 120 Q 50 140 70 150 Q 90 160 110 165 L 130 170 L 150 175 L 170 178 L 190 180 L 210 178 L 230 175 L 250 170 Q 260 165 265 155 Q 270 145 268 135 Q 265 125 260 115 L 250 100 L 240 85 L 230 75 Q 220 68 210 65 L 190 60 Q 170 62 160 70 Q 155 75 152 78 Z" />
				
				<!-- South America -->
				<path d="M 200 200 Q 190 195 185 200 L 180 220 L 175 240 Q 172 260 175 280 Q 180 300 190 315 Q 200 330 215 340 Q 230 348 245 345 Q 260 342 270 330 Q 278 318 280 300 L 282 280 L 280 260 Q 278 240 270 225 Q 262 210 250 205 L 235 200 Q 220 198 210 200 Z" />
				
				<!-- Europe -->
				<path d="M 380 60 Q 370 55 360 58 L 350 65 L 345 75 Q 342 85 345 95 Q 348 105 355 112 Q 365 120 380 122 L 400 120 Q 415 115 425 105 Q 432 95 430 85 L 425 75 Q 420 68 410 63 Q 400 58 390 60 Z" />
				
				<!-- Africa -->
				<path d="M 360 130 Q 350 128 345 135 L 340 150 L 338 170 Q 337 190 340 210 Q 345 230 355 248 Q 365 265 380 278 Q 395 290 415 295 Q 435 298 450 290 Q 462 282 468 265 L 470 245 L 468 225 Q 465 205 458 188 L 448 170 Q 438 155 425 145 L 410 135 Q 395 128 380 130 L 370 132 Z" />
				
				<!-- Asia -->
				<path d="M 440 50 Q 430 48 425 55 L 420 70 Q 418 85 422 100 L 430 115 Q 440 128 455 135 L 475 140 L 500 142 L 525 140 Q 545 135 560 125 Q 575 115 585 100 L 595 80 Q 600 65 598 50 L 590 35 Q 580 25 565 20 L 545 18 Q 525 20 510 28 L 490 40 Q 475 48 465 52 L 450 54 Z" />
				
				<!-- Australia -->
				<path d="M 620 260 Q 610 258 605 265 L 602 280 Q 600 295 605 308 Q 612 320 625 328 Q 640 335 660 332 Q 678 328 688 315 L 693 300 Q 695 285 690 272 L 680 262 Q 668 258 655 260 L 640 262 Z" />
			</g>
			
			<!-- Grid lines -->
			<g class="grid-lines" stroke="var(--border)" stroke-width="0.5" opacity="0.3">
				{#each Array(9) as _, i}
					<line x1="0" y1={i * 50} x2="800" y2={i * 50} />
				{/each}
				{#each Array(17) as _, i}
					<line x1={i * 50} y1="0" x2={i * 50} y2="400" />
				{/each}
			</g>
			
			<!-- Location marker -->
			{#if displayLocation}
				{@const x = ((displayLocation.lon + 180) / 360) * 800}
				{@const y = ((90 - displayLocation.lat) / 180) * 400}
				
				<!-- Pulse animation -->
				<circle 
					cx={x} 
					cy={y} 
					r="20" 
					fill="var(--primary-color)" 
					opacity="0.3"
					class="location-pulse"
				/>
				
				<!-- Marker -->
				<g transform="translate({x}, {y})">
					<circle r="8" fill="var(--primary-color)" stroke="var(--surface)" stroke-width="2" />
					<circle r="3" fill="var(--surface)" />
				</g>
				
				<!-- Label -->
				<text 
					x={x} 
					y={y - 20} 
					text-anchor="middle" 
					class="location-label"
					fill="var(--text-primary)"
					font-size="12"
					font-weight="600"
				>
					{displayLocation.name}
				</text>
			{/if}
		</svg>
	</div>
</div>

<style>
	.location-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.saved-location {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		background: var(--surface);
		border: 2px solid var(--border);
		transition: border-color var(--transition-fast) var(--ease-out);
	}

	.saved-location:hover {
		border-color: var(--primary-color);
	}

	.saved-location-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.location-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.location-details {
		flex: 1;
	}

	.location-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.location-coords {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: monospace;
	}

	.clear-button {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: transparent;
		color: var(--text-secondary);
		border: 2px solid var(--border);
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.clear-button:hover {
		color: var(--error);
		border-color: var(--error);
	}

	.search-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		font-size: 1rem;
		pointer-events: none;
		color: var(--text-secondary);
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		background: var(--background);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all var(--transition-fast) var(--ease-out);
		appearance: none;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.search-input::placeholder {
		color: var(--text-secondary);
	}

	.search-input:-webkit-autofill,
	.search-input:-webkit-autofill:hover,
	.search-input:-webkit-autofill:focus,
	.search-input:-webkit-autofill:active {
		-webkit-box-shadow: 0 0 0 30px var(--background) inset !important;
		-webkit-text-fill-color: var(--text-primary) !important;
		caret-color: var(--text-primary);
	}

	.loading-spinner {
		position: absolute;
		right: 1rem;
		font-size: 1.25rem;
		animation: spin 1s linear infinite;
		color: var(--primary-color);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.search-results {
		border: 2px solid var(--border);
		max-height: 240px;
		overflow-y: auto;
		background: var(--surface);
	}

	.search-result-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: var(--surface);
		border: none;
		border-bottom: 1px solid var(--border);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
		color: var(--text-primary);
	}

	.search-result-item:last-child {
		border-bottom: none;
	}

	.search-result-item:hover,
	.search-result-item.selected {
		background: var(--background);
		color: var(--primary-color);
	}

	.result-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.result-info {
		flex: 1;
	}

	.result-name {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.result-coords {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: monospace;
	}

	.map-container {
		width: 100%;
		border: 2px solid var(--border);
		background: var(--surface-variant);
		overflow: hidden;
	}

	.map-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.location-pulse {
		animation: pulse 2s ease-out infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
			r: 10;
		}
		50% {
			opacity: 0.3;
			r: 20;
		}
		100% {
			opacity: 0;
			r: 30;
		}
	}

	.location-label {
		text-shadow: 
			-1px -1px 0 var(--surface),
			1px -1px 0 var(--surface),
			-1px 1px 0 var(--surface),
			1px 1px 0 var(--surface),
			0 0 4px var(--surface);
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.saved-location {
			flex-direction: column;
			align-items: stretch;
		}

		.clear-button {
			width: 100%;
		}

		.search-results {
			max-height: 180px;
		}
	}
</style>
