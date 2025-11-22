<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let currentResolvedTheme: 'light' | 'dark' = 'dark';

	// Subscribe to theme changes to update the resolved theme
	theme.subscribe(() => {
		if (typeof window !== 'undefined') {
			currentResolvedTheme = theme.getCurrentResolvedTheme();
		}
	});

	onMount(() => {
		currentResolvedTheme = theme.getCurrentResolvedTheme();
	});

	function handleToggle() {
		theme.toggleTheme();
	}
</script>

<button
	class="theme-toggle"
	class:light={currentResolvedTheme === 'light'}
	class:dark={currentResolvedTheme === 'dark'}
	on:click={handleToggle}
	title={currentResolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
	<span class="theme-icon">
		{#if currentResolvedTheme === 'light'}
			🌙
		{:else}
			☀️
		{/if}
	</span>
</button>

<style>
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
	}

	.theme-toggle:hover {
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 var(--shadow-hover);
	}

	/* When in light mode, button should have dark styling */
	.theme-toggle.light {
		background-color: var(--surface-variant);
		color: var(--text-primary);
		border: 3px solid var(--border);
	}

	/* When in dark mode, button should have light styling */
	.theme-toggle.dark {
		background-color: var(--surface-variant);
		color: var(--text-primary);
		border: 3px solid var(--border);
	}

	.theme-toggle.light:hover {
		background-color: var(--surface-hover);
		border-color: var(--primary-color);
	}

	.theme-toggle.dark:hover {
		background-color: var(--surface-hover);
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

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.theme-toggle {
			width: 44px;
			height: 44px;
		}
	}
</style>
