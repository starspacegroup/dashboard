<script lang="ts">
	import type { Widget } from '$lib/types/widget';
	import { widgets, isDraggingAny } from '$lib/stores/widgets';
	import { createEventDispatcher } from 'svelte';

	export let widget: Widget;
	export let onSettingsClick: (() => void) | undefined = undefined;

	const dispatch = createEventDispatcher();
	
	let isDragging = false;
	let dragOffset = { x: 0, y: 0 };
	let dragElement: HTMLDivElement;
	let dropIndicator: HTMLDivElement | null = null;
	let currentDropPosition: { section: number; order: number } | null = null;

	function handleMouseDown(e: MouseEvent) {
		// Only start dragging if clicking on the drag handle
		if ((e.target as HTMLElement).closest('.drag-handle')) {
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
			// Remove existing drop indicator
			if (dropIndicator && dropIndicator.parentNode) {
				dropIndicator.parentNode.removeChild(dropIndicator);
				dropIndicator = null;
			}
			
			// Find the target section and position
			const sections = document.querySelectorAll('.section-content');
			let targetSection = -1;
			let targetOrder = 0;
			let targetElement: Element | null = null;
			
			sections.forEach((section, sectionIndex) => {
				const rect = section.getBoundingClientRect();
				if (e.clientX >= rect.left && e.clientX <= rect.right &&
					e.clientY >= rect.top && e.clientY <= rect.bottom) {
					targetSection = sectionIndex;
					
					// Find the insertion point within the section
					const widgets = section.querySelectorAll('.widget-container');
					let insertIndex = widgets.length;
					let insertBeforeElement: Element | null = null;
					
					widgets.forEach((w, index) => {
						const wRect = w.getBoundingClientRect();
						if (e.clientY < wRect.top + wRect.height / 2) {
							if (insertIndex > index) {
								insertIndex = index;
								insertBeforeElement = w;
							}
						}
					});
					
					targetOrder = insertIndex;
					
					// Create and insert drop indicator
					dropIndicator = document.createElement('div');
					dropIndicator.className = 'drop-indicator';
					dropIndicator.style.cssText = 'height: 3px; background: var(--primary-color); border-radius: 2px; margin: 0.5rem 0; transition: all 0.2s; box-shadow: 0 0 8px var(--primary-color);';
					
					if (insertBeforeElement) {
						section.insertBefore(dropIndicator, insertBeforeElement);
					} else {
						section.appendChild(dropIndicator);
					}
					
					currentDropPosition = { section: targetSection, order: targetOrder };
				}
			});
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (isDragging) {
			// Remove drop indicator
			if (dropIndicator && dropIndicator.parentNode) {
				dropIndicator.parentNode.removeChild(dropIndicator);
				dropIndicator = null;
			}
			
			// Use the tracked drop position if available
			let targetSection = widget.section;
			let targetOrder = widget.order;
			
			if (currentDropPosition) {
				targetSection = currentDropPosition.section;
				targetOrder = currentDropPosition.order;
			} else {
				// Fallback to finding the target section
				const sections = document.querySelectorAll('.section');
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
					
					if ((e.clientX >= rect.left && e.clientX <= rect.right &&
						 e.clientY >= rect.top && e.clientY <= rect.bottom) ||
						distance < closestDistance) {
						closestDistance = distance;
						closestSectionIndex = sectionIndex;
					}
				});
				
				targetSection = closestSectionIndex;
				
				// Find the insertion point
				const sectionContent = sections[closestSectionIndex]?.querySelector('.section-content');
				if (sectionContent) {
					const widgetElements = sectionContent.querySelectorAll('.widget-container');
					let insertIndex = widgetElements.length;
					
					widgetElements.forEach((w: Element, index: number) => {
						const wRect = w.getBoundingClientRect();
						if (e.clientY < wRect.top + wRect.height / 2) {
							insertIndex = Math.min(insertIndex, index);
					}
					});
					
					targetOrder = insertIndex;
				}
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
			currentDropPosition = null;
		}
	}

	function toggleCollapse() {
		widgets.toggleCollapse(widget.id);
	}

	function deleteWidget() {
		if (confirm(`Are you sure you want to delete ${widget.title}?`)) {
			widgets.removeWidget(widget.id);
		}
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
	<div class="widget-header">
		<button class="drag-handle" on:mousedown={handleMouseDown} aria-label="Drag widget" type="button">⋮⋮</button>
		<h3>{widget.title}</h3>
		<div class="header-buttons">
			{#if onSettingsClick}
				<button
					class="settings-button"
					on:click={onSettingsClick}
					aria-label="Widget settings"
					type="button"
				>
					⚙
				</button>
			{/if}
			<button 
				class="delete-button" 
				on:click={deleteWidget}
				aria-label="Delete widget"
				type="button"
			>
				✕
			</button>
			<button 
				class="collapse-button"
				class:collapsed={widget.collapsed}
				on:click={toggleCollapse}
				aria-label={widget.collapsed ? 'Expand widget' : 'Collapse widget'}
				type="button"
			>
				▼
			</button>
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
		max-width: 100%;
		min-width: 0;
		background-color: var(--surface);
		border: 3px solid var(--border);
		border-radius: 0;
		box-shadow: none;
		overflow: visible;
		transition: border-color var(--transition-fast) var(--ease-out),
					transform var(--transition-fast) var(--ease-out);
		margin-bottom: 1.5rem;
		position: relative;
		box-sizing: border-box;
	}

	.widget::before {
		content: '';
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		height: 6px;
		background: var(--primary-color);
		opacity: 0;
		transition: opacity var(--transition-fast) var(--ease-out);
		z-index: 1;
	}

	.widget.collapsed {
		margin-bottom: 1rem;
	}

	.widget.dragging {
		opacity: 0.85;
		cursor: grabbing;
		box-shadow: 8px 8px 0 var(--primary-color);
		z-index: 10000;
		transform: translateY(-8px);
		transition: none;
		pointer-events: none;
		position: relative;
		overflow: visible;
	}

	.widget-header {
		background: var(--surface);
		padding: 1rem 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		user-select: none;
		gap: 0.75rem;
		border-bottom: 3px solid var(--border);
	}

	.widget-header h3 {
		font-size: 0.875rem;
		font-weight: 700;
		margin: 0;
		flex: 1;
		letter-spacing: 0.025em;
		color: var(--text-primary);
		text-transform: uppercase;
	}

	.header-buttons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.settings-button {
		background: none;
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 1rem;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 0;
		transition: all var(--transition-fast) var(--ease-out);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		min-height: 28px;
	}

	.settings-button:hover {
		color: var(--primary-color);
		border-color: var(--primary-color);
		background-color: transparent;
	}

	.delete-button {
		background: none;
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 1rem;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 0;
		transition: all var(--transition-fast) var(--ease-out);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		min-height: 28px;
	}

	.delete-button:hover {
		color: var(--error);
		border-color: var(--error);
		background-color: transparent;
	}

	.collapse-button {
		background: none;
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 0;
		transition: all var(--transition-fast) var(--ease-out);
		transform: rotate(0deg);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		min-height: 28px;
	}

	.collapse-button.collapsed {
		transform: rotate(-90deg);
	}

	.collapse-button:hover {
		color: var(--primary-color);
		border-color: var(--primary-color);
		background-color: transparent;
	}

	.collapse-button.collapsed:hover {
		transform: rotate(-90deg);
	}

	.drag-handle {
		background: none;
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: grab;
		font-size: 1.25rem;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 0;
		transition: all var(--transition-fast) var(--ease-out);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		min-height: 28px;
	}

	.drag-handle:hover {
		color: var(--primary-color);
		border-color: var(--primary-color);
		background-color: transparent;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.widget-content {
		padding: 1.25rem;
		overflow-x: auto;
		overflow-y: visible;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.widget {
			margin-bottom: 1rem;
		}

		.widget-header {
			padding: 0.875rem 1rem;
		}

		.widget-header h3 {
			font-size: 0.8rem;
		}

		.widget-content {
			padding: 1rem;
		}

		.settings-button,
		.delete-button,
		.collapse-button,
		.drag-handle {
			min-width: 44px;
			min-height: 44px;
			padding: 0.5rem;
		}

		.drag-handle {
			font-size: 1.1rem;
		}
	}

	@media (max-width: 480px) {
		.widget-header {
			padding: 0.75rem;
		}

		.widget-content {
			padding: 0.75rem;
		}
	}
</style>
