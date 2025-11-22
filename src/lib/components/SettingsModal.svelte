<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import LocationPicker from './LocationPicker.svelte';

	export let isOpen = false;
	export let onClose: () => void;

	interface Location {
		name: string;
		state: string;
		country: string;
		lat: number;
		lon: number;
		displayName: string;
	}

	let selectedLocation: Location | null = null;
	let savedLocation: Location | null = null;
	let modalElement: HTMLDivElement;
	let isDragging = false;
	let startY = 0;
	let currentY = 0;
	let translateY = 0;
	let locationPermission: PermissionState | null = null;
	let isRequestingLocation = false;
	let globalTemperatureUnit: 'celsius' | 'fahrenheit' = 'fahrenheit';

	// Load saved location and temperature unit on mount
	onMount(() => {
		if (browser) {
			const saved = localStorage.getItem('dashboard-location');
			if (saved) {
				try {
					savedLocation = JSON.parse(saved);
					selectedLocation = savedLocation;
				} catch (e) {
					console.error('Failed to parse saved location:', e);
				}
			}
			
			// Load global temperature unit
			const savedUnit = localStorage.getItem('dashboard-temp-unit-global');
			if (savedUnit === 'celsius' || savedUnit === 'fahrenheit') {
				globalTemperatureUnit = savedUnit;
			}
			
			checkLocationPermission();
		}
	});

	// Check current location permission status
	async function checkLocationPermission() {
		if (!browser || !navigator.permissions) {
			return;
		}

		try {
			const result = await navigator.permissions.query({ name: 'geolocation' });
			locationPermission = result.state;
			
			// Listen for permission changes
			result.addEventListener('change', () => {
				locationPermission = result.state;
			});
		} catch (error) {
			console.error('Failed to check location permission:', error);
		}
	}

	// Request location access
	async function requestLocationAccess() {
		if (!browser || !navigator.geolocation) {
			return;
		}

		isRequestingLocation = true;

		navigator.geolocation.getCurrentPosition(
			(position) => {
				isRequestingLocation = false;
				locationPermission = 'granted';
				
				// Trigger event with browser location
				window.dispatchEvent(new CustomEvent('browser-location-granted', {
					detail: {
						lat: position.coords.latitude,
						lon: position.coords.longitude
					}
				}));
			},
			(error) => {
				isRequestingLocation = false;
				console.error('Location access denied:', error);
				checkLocationPermission(); // Update permission status
			},
			{
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: 0
			}
		);
	}

	// Clear location permission (guide user)
	function revokeLocationAccess() {
		if (!browser) return;
		
		// Clear any stored browser location preference
		localStorage.removeItem('browser-location-granted');
		
		// Dispatch event to notify widgets
		window.dispatchEvent(new CustomEvent('browser-location-revoked'));
		
		// We can't programmatically revoke browser permissions, so guide the user
		alert(
			'To revoke location access:\n\n' +
			'1. Click the lock icon (🔒) in your browser\'s address bar\n' +
			'2. Find "Location" in the permissions list\n' +
			'3. Change it to "Block" or "Ask"\n\n' +
			'Then refresh this page.'
		);
	}

	// Handle location selection from picker - auto-save
	function handleLocationSelect(location: Location | null) {
		selectedLocation = location;
		
		if (browser) {
			if (location === null) {
				// Clear was clicked
				localStorage.removeItem('dashboard-location');
				savedLocation = null;
				window.dispatchEvent(new CustomEvent('location-cleared'));
			} else {
				// Save location immediately
				localStorage.setItem('dashboard-location', JSON.stringify(location));
				savedLocation = location;
				window.dispatchEvent(new CustomEvent('location-changed', { 
					detail: location 
				}));
			}
		}
	}

	// Save temperature unit - auto-save
	function saveTemperatureUnit(unit: 'celsius' | 'fahrenheit') {
		globalTemperatureUnit = unit;
		
		if (browser) {
			localStorage.setItem('dashboard-temp-unit-global', unit);
			
			// Trigger event for widgets to update
			window.dispatchEvent(new CustomEvent('temperature-unit-changed', {
				detail: { unit }
			}));
		}
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
				<h2 class="modal-title">Settings</h2>
				<button class="close-button" on:click={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="modal-content">
				<!-- Browser Location Access Section -->
				<div class="settings-section">
					<h3 class="section-title">Browser Location Access</h3>
					<p class="section-description">
						Allow this app to use your device's location services for automatic location detection.
					</p>

					<!-- Permission Status & Controls -->
					<div class="permission-controls">
						{#if locationPermission === 'granted'}
							<div class="permission-status permission-granted">
								<span class="status-icon">✓</span>
								<div class="status-info">
									<div class="status-label">Location Access Granted</div>
									<div class="status-description">Your browser is sharing location with this app</div>
								</div>
							</div>
							<button class="button button-danger" on:click={revokeLocationAccess}>
								Revoke Access
							</button>
						{:else if locationPermission === 'denied'}
							<div class="permission-status permission-denied">
								<span class="status-icon">✕</span>
								<div class="status-info">
									<div class="status-label">Location Access Denied</div>
									<div class="status-description">You've blocked location access for this app</div>
								</div>
							</div>
							<button class="button button-secondary" on:click={revokeLocationAccess}>
								How to Enable
							</button>
						{:else if locationPermission === 'prompt'}
							<div class="permission-status permission-prompt">
								<span class="status-icon">?</span>
								<div class="status-info">
									<div class="status-label">Location Access Not Requested</div>
									<div class="status-description">Click to allow location access</div>
								</div>
							</div>
							<button 
								class="button button-primary" 
								on:click={requestLocationAccess}
								disabled={isRequestingLocation}
							>
								{isRequestingLocation ? 'Requesting...' : 'Request Access'}
							</button>
						{:else}
							<div class="permission-status permission-unknown">
								<span class="status-icon">⚠</span>
								<div class="status-info">
									<div class="status-label">Checking Permission...</div>
									<div class="status-description">Loading location permission status</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Temperature Unit Section -->
				<div class="settings-section">
					<h3 class="section-title">Temperature Unit</h3>
					<p class="section-description">
						Default temperature display for all weather widgets.
					</p>

					<div class="temperature-unit-selector">
						<button 
							class="unit-button" 
							class:active={globalTemperatureUnit === 'fahrenheit'}
							on:click={() => saveTemperatureUnit('fahrenheit')}
						>
							°F
						</button>
						<button 
							class="unit-button" 
							class:active={globalTemperatureUnit === 'celsius'}
							on:click={() => saveTemperatureUnit('celsius')}
						>
							°C
						</button>
					</div>
				</div>

				<!-- Location Section -->
				<div class="settings-section">
					<h3 class="section-title">Default Location</h3>
					<p class="section-description">
						Set your default location. Changes save automatically.
					</p>

					<LocationPicker
						bind:selectedLocation
						onLocationSelect={handleLocationSelect}
						{savedLocation}
						showClearButton={true}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay);
		backdrop-filter: blur(4px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.2s var(--ease-out);
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
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
		border-radius: 1rem;
		box-shadow: 0 20px 60px var(--modal-shadow);
		width: 100%;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s var(--ease-out);
		position: relative;
		transition: transform 0.1s ease-out;
	}

	.modal-container.dragging {
		transition: none;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.drag-handle {
		display: none;
		padding: 0.75rem 0;
		cursor: grab;
		touch-action: none;
	}

	.drag-bar {
		width: 40px;
		height: 4px;
		background: var(--surface-container-high);
		border-radius: 2px;
		margin: 0 auto;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.close-button {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.close-button:hover {
		background: var(--surface-variant);
		color: var(--text-primary);
		transform: rotate(90deg);
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		-webkit-overflow-scrolling: touch;
	}

	.settings-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.section-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.permission-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
	}

	.permission-status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.status-icon {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.permission-granted .status-icon {
		background: var(--success-bg);
		color: var(--success);
	}

	.permission-denied .status-icon {
		background: var(--error-bg);
		color: var(--error);
	}

	.permission-prompt .status-icon {
		background: var(--warning-bg);
		color: var(--warning);
	}

	.permission-unknown .status-icon {
		background: var(--surface-container-high);
		color: var(--text-secondary);
	}

	.status-info {
		flex: 1;
		min-width: 0;
	}

	.status-label {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.button-danger {
		background: var(--error-bg);
		color: var(--error);
		border: 1px solid var(--error);
	}

	.button-danger:hover {
		background: var(--error);
		color: white;
	}

	.temperature-unit-selector {
		display: flex;
		gap: 0.75rem;
	}

	.unit-button {
		flex: 1;
		padding: 0.875rem 1.25rem;
		font-size: 0.95rem;
		font-weight: 600;
		background: var(--surface-variant);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.unit-button:hover {
		background: var(--surface-hover);
		border-color: var(--primary-color);
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	.unit-button.active {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px var(--shadow-strong);
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.modal-backdrop {
			padding: 0;
			align-items: flex-end;
		}

		.modal-container {
			max-width: 100%;
			max-height: 95vh;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			animation: slideUpMobile 0.3s var(--ease-out);
		}

		.permission-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.permission-status {
			width: 100%;
		}

		.permission-controls .button {
			width: 100%;
			justify-content: center;
		}

		.temperature-unit-selector {
			flex-direction: column;
		}

		.unit-button {
			width: 100%;
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

		.modal-header {
			padding: 1rem 1.25rem;
		}

		.modal-title {
			font-size: 1.25rem;
		}

		.modal-content {
			padding: 1.25rem;
		}
	}

	/* Tablet optimizations */
	@media (min-width: 769px) and (max-width: 1024px) {
		.modal-container {
			max-width: 600px;
		}
	}
</style>
