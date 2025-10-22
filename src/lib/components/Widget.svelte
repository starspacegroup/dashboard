<script lang="ts">
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';

	export let widget: Widget;

	let isDragging = false;
	let dragOffset = { x: 0, y: 0 };

	function handleMouseDown(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.widget-header')) {
			// Don't start dragging if clicking on collapse button
			if ((e.target as HTMLElement).closest('.collapse-button')) {
				return;
			}
			isDragging = true;
			dragOffset = {
				x: e.clientX - widget.position.x,
				y: e.clientY - widget.position.y
			};
			e.preventDefault();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			const newX = Math.max(0, e.clientX - dragOffset.x);
			const newY = Math.max(0, e.clientY - dragOffset.y);
			widgets.updatePosition(widget.id, { x: newX, y: newY });
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function toggleCollapse() {
		widgets.toggleCollapse(widget.id);
	}

	$: if (typeof window !== 'undefined') {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		} else {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		}
	}
</script>

<div
	class="widget"
	class:dragging={isDragging}
	class:collapsed={widget.collapsed}
	style="left: {widget.position.x}px; top: {widget.position.y}px; width: {widget.size
		.width}px; {widget.collapsed ? '' : `min-height: ${widget.size.height}px;`}"
>
	<div class="widget-header" on:mousedown={handleMouseDown} role="button" tabindex="0">
		<h3>{widget.title}</h3>
		<div class="header-buttons">
			<button 
				class="collapse-button" 
				on:click={toggleCollapse}
				aria-label={widget.collapsed ? 'Expand widget' : 'Collapse widget'}
			>
				{widget.collapsed ? '▼' : '▲'}
			</button>
			<button class="drag-handle" aria-label="Drag widget">⋮⋮</button>
		</div>
	</div>
	{#if !widget.collapsed}
		<div class="widget-content">
			<slot />
		</div>
	{/if}
</div>

<style>
	.widget {
		position: absolute;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: box-shadow 0.2s, height 0.3s ease;
	}

	.widget.collapsed {
		height: auto !important;
		min-height: auto !important;
	}

	.widget:hover {
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.widget.dragging {
		opacity: 0.8;
		cursor: move;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
		z-index: 1000;
	}

	.widget-header {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.75rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: move;
		user-select: none;
	}

	.widget-header h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		flex: 1;
	}

	.header-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.collapse-button {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 0.25rem;
		transition: color 0.2s, background-color 0.2s;
	}

	.collapse-button:hover {
		color: var(--text-primary);
		background-color: rgba(255, 255, 255, 0.1);
	}

	.drag-handle {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: move;
		font-size: 1.25rem;
		padding: 0;
		line-height: 1;
	}

	.widget-content {
		padding: 1rem;
	}
</style>
