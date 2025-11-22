<script lang="ts">
	export let visible = false;
	export let gridSize = 20;
</script>

{#if visible}
	<div 
		class="grid-background"
		style="--grid-size: {gridSize}px;"
	></div>
{/if}

<style>
	.grid-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 999;
		background-image: 
			linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
			linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px);
		background-size: var(--grid-size) var(--grid-size);
		opacity: 0.6;
		animation: fadeIn 0.2s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 0.6;
		}
	}
</style>