<script lang="ts">
	import type { Widget } from '$lib/types/widget';
	import { widgets, isDraggingAny } from '$lib/stores/widgets';
	import { createEventDispatcher, onDestroy } from 'svelte';

	export let widget: Widget;
	export let onSettingsClick: (() => void) | undefined = undefined;

	const dispatch = createEventDispatcher();
	
	let isDragging = false;
	let dragOffset = { x: 0, y: 0 };
	let dragElement: HTMLDivElement;
	let dropIndicator: HTMLDivElement | null = null;
	let currentDropPosition: { section: number; order: number } | null = null;
	let dragGhost: HTMLDivElement | null = null;
	let lastMouseX = 0;
	
	// Auto-scroll configuration
	const SCROLL_ZONE_SIZE = 80; // pixels from edge to trigger scroll
	const SCROLL_SPEED_MAX = 20; // max pixels per frame
	let autoScrollAnimationFrame: number | null = null;
	let lastMouseY = 0;
	
	function startAutoScroll() {
		if (autoScrollAnimationFrame !== null) return;
		
		function autoScrollStep() {
			if (!isDragging) {
				stopAutoScroll();
				return;
			}
			
			const viewportHeight = window.innerHeight;
			
			// Calculate distance from edges
			const distanceFromTop = lastMouseY;
			const distanceFromBottom = viewportHeight - lastMouseY;
			
			let scrollAmount = 0;
			
			if (distanceFromTop < SCROLL_ZONE_SIZE) {
				// Near top edge - scroll up
				const intensity = 1 - (distanceFromTop / SCROLL_ZONE_SIZE);
				scrollAmount = -SCROLL_SPEED_MAX * intensity * intensity; // Quadratic for smoother feel
			} else if (distanceFromBottom < SCROLL_ZONE_SIZE) {
				// Near bottom edge - scroll down
				const intensity = 1 - (distanceFromBottom / SCROLL_ZONE_SIZE);
				scrollAmount = SCROLL_SPEED_MAX * intensity * intensity;
			}
			
			if (scrollAmount !== 0) {
				// Temporarily disable smooth scrolling for instant response
				const html = document.documentElement;
				const originalScrollBehavior = html.style.scrollBehavior;
				html.style.scrollBehavior = 'auto';
				
				window.scrollBy(0, scrollAmount);
				
				// Restore original scroll behavior
				html.style.scrollBehavior = originalScrollBehavior;
			}
			
			autoScrollAnimationFrame = requestAnimationFrame(autoScrollStep);
		}
		
		autoScrollAnimationFrame = requestAnimationFrame(autoScrollStep);
	}
	
	function stopAutoScroll() {
		if (autoScrollAnimationFrame !== null) {
			cancelAnimationFrame(autoScrollAnimationFrame);
			autoScrollAnimationFrame = null;
		}
	}
	
	function createDragGhost() {
		if (dragGhost) return;
		
		const rect = dragElement.getBoundingClientRect();
		dragGhost = dragElement.cloneNode(true) as HTMLDivElement;
		
		// Style the ghost to follow the cursor
		dragGhost.style.cssText = `
			position: fixed;
			top: ${rect.top}px;
			left: ${rect.left}px;
			width: ${rect.width}px;
			height: ${rect.height}px;
			z-index: 10001;
			pointer-events: none;
			opacity: 0.9;
			cursor: grabbing;
			box-shadow: 8px 8px 0 var(--primary-color);
			transform: rotate(2deg) scale(1.02);
			transition: none;
			background-color: var(--surface);
			border: 3px solid var(--primary-color);
		`;
		
		document.body.appendChild(dragGhost);
	}
	
	function updateDragGhostPosition() {
		if (dragGhost) {
			dragGhost.style.left = `${lastMouseX - dragOffset.x}px`;
			dragGhost.style.top = `${lastMouseY - dragOffset.y}px`;
		}
	}
	
	function removeDragGhost() {
		if (dragGhost && dragGhost.parentNode) {
			dragGhost.parentNode.removeChild(dragGhost);
			dragGhost = null;
		}
	}
	
	// Touch hold configuration
	const TOUCH_HOLD_DURATION = 300; // ms to hold before drag starts
	let touchHoldTimer: ReturnType<typeof setTimeout> | null = null;
	let touchStartPos = { x: 0, y: 0 };
	let isTouchDragging = false;
	
	onDestroy(() => {
		stopAutoScroll();
		removeDragGhost();
		if (touchHoldTimer) clearTimeout(touchHoldTimer);
	});
	
	function startDrag(clientX: number, clientY: number) {
		isDragging = true;
		isDraggingAny.set(true);
		
		const rect = dragElement.getBoundingClientRect();
		dragOffset = {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
		
		lastMouseX = clientX;
		lastMouseY = clientY;
		
		// Create the drag ghost
		createDragGhost();
		startAutoScroll();
	}
	
	function handleDragMove(clientX: number, clientY: number) {
		if (!isDragging) return;
		
		// Update position for auto-scroll and ghost position
		lastMouseX = clientX;
		lastMouseY = clientY;
		
		// Update the ghost position
		updateDragGhostPosition();
		
		// Remove existing drop indicator
		if (dropIndicator && dropIndicator.parentNode) {
			dropIndicator.parentNode.removeChild(dropIndicator);
			dropIndicator = null;
		}
		
		// Find the target section and position
		const sections = document.querySelectorAll('.section-content');
		
		sections.forEach((section, sectionIndex) => {
			const rect = section.getBoundingClientRect();
			if (clientX >= rect.left && clientX <= rect.right &&
				clientY >= rect.top && clientY <= rect.bottom) {
				const targetSection = sectionIndex;
				
				// Find the insertion point within the section
				const widgetElements = section.querySelectorAll('.widget-container');
				let insertIndex = widgetElements.length;
				let insertBeforeElement: Element | null = null;
				
				widgetElements.forEach((w, index) => {
					const wRect = w.getBoundingClientRect();
					if (clientY < wRect.top + wRect.height / 2) {
						if (insertIndex > index) {
							insertIndex = index;
							insertBeforeElement = w;
						}
					}
				});
				
				const targetOrder = insertIndex;
				
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
	
	function endDrag(clientX: number, clientY: number) {
		if (!isDragging) return;
		
		// Stop auto-scroll and remove ghost
		stopAutoScroll();
		removeDragGhost();
		
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
					Math.pow(clientX - centerX, 2) + 
					Math.pow(clientY - centerY, 2)
				);
				
				if ((clientX >= rect.left && clientX <= rect.right &&
					 clientY >= rect.top && clientY <= rect.bottom) ||
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
					if (clientY < wRect.top + wRect.height / 2) {
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
		isTouchDragging = false;
	}

	function handleMouseDown(e: MouseEvent) {
		// Only start dragging if clicking on the drag handle
		if ((e.target as HTMLElement).closest('.drag-handle')) {
			startDrag(e.clientX, e.clientY);
			e.preventDefault();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		handleDragMove(e.clientX, e.clientY);
	}

	function handleMouseUp(e: MouseEvent) {
		endDrag(e.clientX, e.clientY);
	}
	
	// Touch event handlers
	function handleTouchStart(e: TouchEvent) {
		if (!(e.target as HTMLElement).closest('.drag-handle')) return;
		
		const touch = e.touches[0];
		touchStartPos = { x: touch.clientX, y: touch.clientY };
		
		// Start a timer for tap-hold
		touchHoldTimer = setTimeout(() => {
			isTouchDragging = true;
			startDrag(touch.clientX, touch.clientY);
			
			// Provide haptic feedback if available
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}
		}, TOUCH_HOLD_DURATION);
	}
	
	function handleTouchMove(e: TouchEvent) {
		const touch = e.touches[0];
		
		// If we haven't started dragging yet, check if we moved too much (cancel the hold)
		if (!isDragging && touchHoldTimer) {
			const dx = Math.abs(touch.clientX - touchStartPos.x);
			const dy = Math.abs(touch.clientY - touchStartPos.y);
			
			// If moved more than 10px, cancel the hold timer
			if (dx > 10 || dy > 10) {
				clearTimeout(touchHoldTimer);
				touchHoldTimer = null;
			}
			return;
		}
		
		if (isDragging) {
			e.preventDefault(); // Prevent scrolling while dragging
			handleDragMove(touch.clientX, touch.clientY);
		}
	}
	
	function handleTouchEnd(e: TouchEvent) {
		// Clear the hold timer
		if (touchHoldTimer) {
			clearTimeout(touchHoldTimer);
			touchHoldTimer = null;
		}
		
		if (isDragging) {
			e.preventDefault();
			endDrag(lastMouseX, lastMouseY);
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
			document.addEventListener('touchmove', handleTouchMove, { passive: false });
			document.addEventListener('touchend', handleTouchEnd);
			document.addEventListener('touchcancel', handleTouchEnd);
		} else {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleTouchEnd);
			document.removeEventListener('touchcancel', handleTouchEnd);
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
		<button class="drag-handle" on:mousedown={handleMouseDown} on:touchstart={handleTouchStart} aria-label="Drag widget" type="button">⋮⋮</button>
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
	<div class="widget-content" class:collapsed={widget.collapsed}>
		<slot />
	</div>
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
		opacity: 0.3;
		cursor: grabbing;
		box-shadow: none;
		z-index: 1;
		transform: none;
		transition: opacity var(--transition-fast) var(--ease-out);
		pointer-events: none;
		position: relative;
		overflow: visible;
		border-style: dashed;
		border-color: var(--primary-color);
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
		user-select: none;
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

	.widget-content.collapsed {
		display: none;
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
