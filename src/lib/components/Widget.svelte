<script lang="ts">
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';

	export let widget: Widget;

	let isDragging = false;
	let dragOffset = { x: 0, y: 0 };

	function handleMouseDown(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.widget-header')) {
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
	style="left: {widget.position.x}px; top: {widget.position.y}px; width: {widget.size
		.width}px; min-height: {widget.size.height}px;"
>
	<div class="widget-header" on:mousedown={handleMouseDown} role="button" tabindex="0">
		<h3>{widget.title}</h3>
		<button class="drag-handle" aria-label="Drag widget">⋮⋮</button>
	</div>
	<div class="widget-content">
		<slot />
	</div>
</div>

<style>
	.widget {
		position: absolute;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: box-shadow 0.2s;
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
