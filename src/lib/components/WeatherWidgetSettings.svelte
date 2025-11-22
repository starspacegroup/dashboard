<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import LocationPicker from './LocationPicker.svelte';

	export let isOpen = false;
	export let onClose: () => void;
	export let onSave: (location: Location | null, temperatureUnit?: 'celsius' | 'fahrenheit') => void;
	export let initialLocation: Location | null = null;
	export let initialTemperatureUnit: 'celsius' | 'fahrenheit' | undefined = undefined;

	interface Location {
		name: string;
		state: string;
		country: string;
		lat: number;
		lon: number;
		displayName: string;
	}

	let selectedLocation: Location | null = null;
	let selectedTemperatureUnit: 'celsius' | 'fahrenheit' | 'global' = 'global';
	let modalElement: HTMLDivElement;
	let isDragging = false;
	let startY = 0;
	let currentY = 0;
	let translateY = 0;

	// Load initial location and temperature unit
	onMount(() => {
		if (initialLocation) {
			selectedLocation = initialLocation;
		}
		if (initialTemperatureUnit) {
			selectedTemperatureUnit = initialTemperatureUnit;
		} else {
			selectedTemperatureUnit = 'global';
		}
	});

	// Handle location selection from picker - auto-save
	function handleLocationSelect(location: Location | null) {
		selectedLocation = location;
		const tempUnit = selectedTemperatureUnit === 'global' ? undefined : selectedTemperatureUnit;
		onSave(selectedLocation, tempUnit);
	}

	// Handle temperature unit change - auto-save
	function handleTemperatureUnitChange(unit: 'celsius' | 'fahrenheit' | 'global') {
		selectedTemperatureUnit = unit;
		const tempUnit = unit === 'global' ? undefined : unit;
		onSave(selectedLocation, tempUnit);
	}

	// Clear widget settings and use global
	function clearAndUseGlobal() {
		selectedLocation = null;
		selectedTemperatureUnit = 'global';
		onSave(null, undefined);
	}

	// Handle modal backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle touch/drag to dismiss (mobile)
	function handleTouchStart(event: TouchEvent) {
		isDragging = true;
		startY = event.touches[0].clientY;
		currentY = startY;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;
		currentY = event.touches[0].clientY;
		const diff = currentY - startY;
		
		// Only allow dragging down
		if (diff > 0) {
			translateY = diff;
		}
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;

		// If dragged more than 100px, close modal
		if (translateY > 100) {
			onClose();
		}

		// Reset
		translateY = 0;
		startY = 0;
		currentY = 0;
	}

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			onClose();
		}
	}

	// Prevent body scroll when modal is open
	$: if (browser && isOpen) {
		document.body.style.overflow = 'hidden';
	} else if (browser) {
		document.body.style.overflow = '';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div 
		class="modal-backdrop" 
		role="presentation"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
	>
		<div 
			class="modal-container"
			class:dragging={isDragging}
			style="transform: translateY({translateY}px)"
			bind:this={modalElement}
		>
			<!-- Drag handle (mobile) -->
			<div class="drag-handle">
				<div class="drag-bar"></div>
			</div>

			<!-- Header -->
			<div class="modal-header">
				<h2 class="modal-title">Weather Widget Settings</h2>
				<button class="close-button" on:click={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="modal-content">
				<!-- Temperature Unit Section -->
				<div class="settings-section">
					<h3 class="section-title">Temperature Unit</h3>
					<p class="section-description">
						Override the global temperature unit for this widget.
					</p>

					<div class="temperature-unit-selector">
						<button 
							class="unit-button" 
							class:active={selectedTemperatureUnit === 'global'}
							on:click={() => handleTemperatureUnitChange('global')}
						>
							Use Global
						</button>
						<button 
							class="unit-button" 
							class:active={selectedTemperatureUnit === 'fahrenheit'}
							on:click={() => handleTemperatureUnitChange('fahrenheit')}
						>
							°F
						</button>
						<button 
							class="unit-button" 
							class:active={selectedTemperatureUnit === 'celsius'}
							on:click={() => handleTemperatureUnitChange('celsius')}
						>
							°C
						</button>
					</div>
				</div>

				<!-- Widget Location Section -->
				<div class="settings-section">
					<h3 class="section-title">Custom Location</h3>
					<p class="section-description">
						Override the global location for this widget. Changes save automatically.
					</p>

					<LocationPicker
						bind:selectedLocation
						onLocationSelect={handleLocationSelect}
						savedLocation={initialLocation}
						showClearButton={false}
					/>

					{#if initialLocation || selectedTemperatureUnit !== 'global'}
						<div class="reset-section">
							<button class="button button-text" on:click={clearAndUseGlobal}>
								Reset to Global Settings
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--overlay);
		backdrop-filter: blur(4px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-container {
		background: var(--surface);
		border: 3px solid var(--border);
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		animation: slideUp 0.3s ease-out;
		box-shadow: 0 0 20px var(--shadow);
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-container.dragging {
		transition: none;
	}

	.drag-handle {
		display: none;
		padding: 0.75rem;
		cursor: grab;
		touch-action: none;
	}

	.drag-bar {
		width: 40px;
		height: 4px;
		background: var(--border);
		border-radius: 2px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.modal-backdrop {
			padding: 0;
			align-items: flex-end;
		}

		.modal-container {
			max-width: 100%;
			max-height: 85vh;
			border: none;
			border-top: 3px solid var(--border);
			animation: slideUpMobile 0.3s ease-out;
		}

		@keyframes slideUpMobile {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}

		.drag-handle {
			display: block;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 3px solid var(--border);
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	.close-button {
		background: none;
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.close-button:hover {
		color: var(--primary-color);
		border-color: var(--primary-color);
	}

	.modal-content {
		padding: 1.5rem;
	}

	.settings-section {
		margin-bottom: 2rem;
	}

	.settings-section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
	}

	.section-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.temperature-unit-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.unit-button {
		flex: 1;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: var(--surface-variant);
		color: var(--text-secondary);
		border: 2px solid var(--border);
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.unit-button:hover {
		border-color: var(--primary-color);
		color: var(--text-primary);
	}

	.unit-button.active {
		background: var(--primary-color);
		color: var(--background);
		border-color: var(--primary-color);
	}

	@media (max-width: 768px) {
		.modal-header,
		.modal-content {
			padding: 1rem;
		}
	}
</style>
