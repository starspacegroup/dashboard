<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import type { Theme } from '$lib/stores/theme';
	import { onMount, onDestroy } from 'svelte';

	const LONG_PRESS_MS = 500;
	const OPTIONS: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'auto', label: 'System' }
	];

	let currentResolvedTheme: 'light' | 'dark' = 'dark';
	let currentTheme: Theme = 'auto';
	let menuOpen = false;
	let root: HTMLDivElement;
	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let longPressed = false;

	// Subscribe to theme changes to update the resolved theme
	const unsubscribe = theme.subscribe((t) => {
		currentTheme = t;
		if (typeof window !== 'undefined') {
			currentResolvedTheme = theme.getCurrentResolvedTheme();
		}
	});

	onMount(() => {
		currentResolvedTheme = theme.getCurrentResolvedTheme();
	});

	onDestroy(() => {
		unsubscribe();
		clearTimeout(pressTimer);
	});

	function startPress() {
		longPressed = false;
		clearTimeout(pressTimer);
		pressTimer = setTimeout(() => {
			longPressed = true;
			menuOpen = true;
		}, LONG_PRESS_MS);
	}

	function endPress() {
		clearTimeout(pressTimer);
	}

	function handleClick() {
		// The click that ends a long press must not also flip the theme
		if (longPressed) {
			longPressed = false;
			return;
		}
		theme.toggleTheme();
	}

	function handleContextMenu(event: MouseEvent) {
		// Touch long-press fires contextmenu; keep it from covering our own menu
		event.preventDefault();
		if (!menuOpen) {
			longPressed = true;
			menuOpen = true;
		}
	}

	function choose(value: Theme) {
		theme.setThemeWithAuto(value);
		menuOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (menuOpen && root && !root.contains(event.target as Node)) {
			menuOpen = false;
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && menuOpen) {
			menuOpen = false;
			event.stopPropagation();
		}
	}
</script>

<svelte:window on:click={handleWindowClick} on:keydown|capture={handleWindowKeydown} />

<div class="theme-toggle-wrap" bind:this={root}>
	<button
		class="theme-toggle"
		on:click={handleClick}
		on:pointerdown={startPress}
		on:pointerup={endPress}
		on:pointerleave={endPress}
		on:pointercancel={endPress}
		on:contextmenu={handleContextMenu}
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		title={(currentResolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode') +
			' (hold for more options)'}
	>
		<span class="theme-icon">
			{#if currentResolvedTheme === 'light'}
				🌙
			{:else}
				☀️
			{/if}
		</span>
	</button>

	{#if menuOpen}
		<div class="theme-menu" role="menu">
			{#each OPTIONS as option}
				<button
					class="theme-option"
					class:active={currentTheme === option.value}
					role="menuitemradio"
					aria-checked={currentTheme === option.value}
					on:click={() => choose(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.theme-toggle-wrap {
		position: relative;
		display: flex;
	}

	/* The button wears the opposite theme's colours: it shows what a click gives you */
	.theme-toggle {
		border-radius: 0;
		padding: 0;
		cursor: pointer;
		transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		line-height: 1;
		width: 40px;
		height: 40px;
		position: relative;
		box-shadow: 3px 3px 0 var(--shadow-hover);
		background-color: var(--toggle-bg);
		color: var(--toggle-text);
		border: 3px solid var(--toggle-border);
		user-select: none;
		-webkit-touch-callout: none;
	}

	.theme-toggle:hover {
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 var(--shadow-hover);
		background-color: var(--toggle-hover-bg);
		border-color: var(--primary-color);
	}

	.theme-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 0;
		position: relative;
		z-index: 1;
	}

	.theme-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 140px;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		background-color: var(--surface);
		border: 3px solid var(--border);
		box-shadow: 3px 3px 0 var(--shadow-hover);
	}

	.theme-option {
		border: none;
		border-radius: 0;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
		padding: 0.6rem 0.85rem;
		cursor: pointer;
		box-shadow: none;
	}

	.theme-option:hover {
		background-color: var(--surface-hover);
	}

	.theme-option.active {
		color: var(--primary-color);
		font-weight: 700;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.theme-toggle {
			width: 44px;
			height: 44px;
		}
	}
</style>
