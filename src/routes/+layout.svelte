<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import WeatherWidgetSettings from '$lib/components/WeatherWidgetSettings.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import UserDropdown from '$lib/components/UserDropdown.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { weatherSettings } from '$lib/stores/weatherSettings';
	import { onMount } from 'svelte';
	import type { Theme } from '$lib/stores/theme';

	export let data;

	let commandPaletteOpen = false;

	// Check if we're on a page that should hide the main chrome (header/footer)
	$: isMinimalLayout = $page.url.pathname === '/signin';

	onMount(() => {
		theme.initialize();

		// Global keyboard handler for Esc key
		function handleGlobalKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				// Only open the palette if it's not already open
				// Let the CommandPalette component handle closing itself
				if (!commandPaletteOpen) {
					event.preventDefault();
					commandPaletteOpen = true;
				}
			}
		}

		window.addEventListener('keydown', handleGlobalKeyDown);

		return () => {
			window.removeEventListener('keydown', handleGlobalKeyDown);
		};
	});

	function handleCommandPaletteClose() {
		commandPaletteOpen = false;
	}

	function openCommandPalette() {
		commandPaletteOpen = true;
	}
</script>

<CommandPalette isOpen={commandPaletteOpen} onClose={handleCommandPaletteClose} />

<WeatherWidgetSettings
	isOpen={$weatherSettings.isOpen}
	onClose={() => weatherSettings.close()}
	onSave={(location, temperatureUnit) => {
		if ($weatherSettings.onSave) {
			$weatherSettings.onSave(location, temperatureUnit);
		}
	}}
	initialLocation={$weatherSettings.initialLocation}
	initialTemperatureUnit={$weatherSettings.initialTemperatureUnit}
/>

<div class="app">
	{#if !isMinimalLayout}
	<header>
		<h1>Dashboard</h1>
		<nav>
			<button class="command-palette-button" on:click={openCommandPalette} title="Command Palette (ESC)">
				⌘
			</button>
			{#if data.user}
				<UserDropdown user={data.user} />
			{:else}
				<ThemeToggle />
				<form method="POST" action="/auth/signin/github">
					<button type="submit" class="github-signin-button">
						<svg class="github-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
							<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
						</svg>
						<span>Sign in with GitHub</span>
					</button>
				</form>
			{/if}
		</nav>
	</header>
	{/if}

	<main class:minimal={isMinimalLayout}>
		<slot />
	</main>

	{#if !isMinimalLayout}
	<Footer />
	{/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		width: 100%;
		max-width: 100vw;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	header {
		background-color: var(--surface);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 4px solid var(--primary-color);
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 4px 4px 0 var(--shadow);
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: 0.05em;
		color: var(--primary-color);
		text-transform: uppercase;
	}

	nav {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	button {
		background-color: var(--primary-color);
		color: var(--surface);
		border: 3px solid var(--primary-color);
		padding: 0.5rem 1rem;
		border-radius: 0;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all var(--transition-fast) var(--ease-out);
		box-shadow: 3px 3px 0 var(--shadow-hover);
	}

	button:hover {
		background-color: var(--surface);
		color: var(--primary-color);
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 var(--shadow-hover);
	}

	button:active {
		transform: translate(3px, 3px);
		box-shadow: none;
	}

	.github-signin-button {
		background-color: var(--surface-variant);
		color: var(--text-primary);
		border: 1px solid var(--border);
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		transition: all var(--transition-fast) var(--ease-out);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: relative;
		overflow: hidden;
	}

	.github-signin-button:hover {
		background-color: var(--surface-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--shadow-strong);
	}

	.github-signin-button:active {
		transform: translateY(0);
	}

	.github-icon {
		flex-shrink: 0;
		transition: transform var(--transition-normal) var(--ease-spring);
	}

	.github-signin-button:hover .github-icon {
		transform: scale(1.1) rotate(5deg);
	}

	.command-palette-button {
		background-color: var(--surface);
		color: var(--primary-color);
		border: 3px solid var(--primary-color);
		padding: 0.5rem 0.75rem;
		font-size: 1.25rem;
		line-height: 1;
		border-radius: 0;
		box-shadow: 3px 3px 0 var(--shadow-hover);
		transition: all var(--transition-fast) var(--ease-out);
	}

	.command-palette-button:hover {
		background-color: var(--primary-color);
		color: var(--surface);
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 var(--shadow-hover);
	}

	main {
		flex: 1;
		padding: 2rem;
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
		overflow-x: hidden;
		animation: fadeIn 0.4s var(--ease-out);
	}

	main.minimal {
		padding: 0;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		header {
			padding: 0.75rem 1rem;
			border-bottom-width: 3px;
		}

		h1 {
			font-size: 1.1rem;
		}

		nav {
			gap: 0.5rem;
		}

		button {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
			min-height: 44px;
		}

		.github-signin-button span {
			display: none;
		}

		.github-signin-button {
			padding: 0.5rem;
			min-width: 44px;
			justify-content: center;
		}

		.command-palette-button {
			font-size: 1rem;
			padding: 0.5rem;
			min-width: 44px;
			min-height: 44px;
		}

		main {
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1rem;
		}

		button {
			padding: 0.5rem;
			font-size: 0.7rem;
		}
	}
</style>
