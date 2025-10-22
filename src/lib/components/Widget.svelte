<script lang="ts">
	import type { Widget } from '$lib/types/widget';
	import { widgets, isDraggingAny } from '$lib/stores/widgets';
	import { createEventDispatcher } from 'svelte';

	export let widget: Widget;

	const dispatch = createEventDispatcher();
	
	let isDragging = false;
	let dragOffset = { x: 0, y: 0 };
	let dragElement: HTMLDivElement;

	function handleMouseDown(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.widget-header')) {
			// Don't start dragging if clicking on collapse button
			if ((e.target as HTMLElement).closest('.collapse-button')) {
				return;
			}
			
			isDragging = true;
			isDraggingAny.set(true);
			
			const rect = dragElement.getBoundingClientRect();
			dragOffset = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};
			
			e.preventDefault();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			// Find the column and position where the widget should be dropped
			const columns = document.querySelectorAll('.column-content');
			let targetColumn = -1;
			let targetOrder = 0;
			
			columns.forEach((column, columnIndex) => {
				const rect = column.getBoundingClientRect();
				if (e.clientX >= rect.left && e.clientX <= rect.right) {
					targetColumn = columnIndex;
					
					// Find the insertion point within the column
					const widgets = column.querySelectorAll('.widget-container');
					let insertIndex = widgets.length;
					
					widgets.forEach((w, index) => {
						const wRect = w.getBoundingClientRect();
						if (e.clientY < wRect.top + wRect.height / 2) {
							insertIndex = Math.min(insertIndex, index);
						}
					});
					
					targetOrder = insertIndex;
				}
			});
			
			// Visual feedback could be added here
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (isDragging) {
			// Find the target section and order
			const sections = document.querySelectorAll('.section');
			let targetSection = widget.section; // Default to current section
			let targetOrder = widget.order; // Default to current order
			let closestSectionElement: Element | null = null;
			let closestSectionIndex = widget.section;
			let closestDistance = Infinity;
			
			sections.forEach((sectionEl, sectionIndex) => {
				const rect = sectionEl.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				const distance = Math.sqrt(
					Math.pow(e.clientX - centerX, 2) + 
					Math.pow(e.clientY - centerY, 2)
				);
				
				// Check if point is within section bounds or find closest
				if ((e.clientX >= rect.left && e.clientX <= rect.right &&
					 e.clientY >= rect.top && e.clientY <= rect.bottom) ||
					distance < closestDistance) {
					closestDistance = distance;
					closestSectionElement = sectionEl;
					closestSectionIndex = sectionIndex;
				}
			});
			
			if (closestSectionElement) {
				targetSection = closestSectionIndex;
				
				// Find the insertion point within the section
				const widgetElements = (closestSectionElement as Element).querySelectorAll('.widget-container');
				let insertIndex = widgetElements.length;
				
				widgetElements.forEach((w: Element, index: number) => {
					const wRect = w.getBoundingClientRect();
					if (e.clientY < wRect.top + wRect.height / 2) {
						insertIndex = Math.min(insertIndex, index);
					}
				});
				
				targetOrder = insertIndex;
			}
			
			// Only move if position actually changed
			if (targetSection !== widget.section || targetOrder !== widget.order) {
				dispatch('widgetDrop', {
					widgetId: widget.id,
					targetSection,
					targetOrder
				});
			}
			
			isDragging = false;
			isDraggingAny.set(false);
		}
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
	bind:this={dragElement}
	class="widget"
	class:dragging={isDragging}
	class:collapsed={widget.collapsed}
>
	<div class="widget-header" on:mousedown={handleMouseDown} role="button" tabindex="0">
		<h3>{widget.title}</h3>
		<div class="header-buttons">
			<button 
				class="collapse-button" 
				on:click={toggleCollapse}
				aria-label={widget.collapsed ? 'Expand widget' : 'Collapse widget'}
				type="button"
			>
				{widget.collapsed ? '▼' : '▲'}
			</button>
			<button class="drag-handle" aria-label="Drag widget" type="button">⋮⋮</button>
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
		width: 100%;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px var(--shadow);
		overflow: hidden;
		transition: box-shadow 0.2s, transform 0.1s ease, background-color 0.3s ease;
		margin-bottom: 1rem;
		position: relative;
	}

	.widget.collapsed {
		margin-bottom: 0.5rem;
	}

	.widget:hover {
		box-shadow: 0 6px 12px var(--shadow-hover);
	}

	.widget.dragging {
		opacity: 0.6;
		cursor: grabbing;
		box-shadow: 0 12px 24px var(--shadow-hover);
		z-index: 1000;
		transform: translateY(-4px) scale(1.02);
		transition: none;
		pointer-events: none;
	}

	.widget-header {
		background-color: var(--surface-variant);
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
		background-color: var(--surface-hover);
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
