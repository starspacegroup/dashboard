<script lang="ts">
	import { widgets, sections, isDraggingAny } from '$lib/stores/widgets';
	import Widget from '$lib/components/Widget.svelte';
	import type { Widget as WidgetType } from '$lib/types/widget';
	
	export let widgetComponents: Record<string, any>;
	export let data: any;
	
	let containerRef: HTMLDivElement;
	let draggedSectionId: number | null = null;
	
	// Organize widgets by section
	$: widgetsBySection = $widgets.reduce((acc, widget) => {
		if (!acc[widget.section]) {
			acc[widget.section] = [];
		}
		acc[widget.section].push(widget);
		return acc;
	}, {} as Record<number, WidgetType[]>);
	
	// Sort widgets within each section by order
	$: {
		Object.keys(widgetsBySection).forEach(sectionId => {
			const widgets = widgetsBySection[parseInt(sectionId)];
			if (widgets && Array.isArray(widgets)) {
				widgets.sort((a, b) => a.order - b.order);
			}
		});
	}
	
	// Sort sections by row and column for proper rendering
	// Also normalize any undefined spans to 1
	$: sortedSections = [...$sections].map(s => ({
		...s,
		gridColumnSpan: s.gridColumnSpan ?? 1
	})).sort((a, b) => {
		if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
		return a.gridColumn - b.gridColumn;
	});
	
	function handleSectionDragStart(sectionId: number, event: DragEvent) {
		draggedSectionId = sectionId;
		isDraggingAny.set(true);
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', sectionId.toString());
		}
	}
	
	function handleSectionDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}
	
	function handleSectionDrop(targetColumn: number, event: DragEvent) {
		event.preventDefault();
		if (draggedSectionId !== null) {
			// Clamp to valid column range (1-3)
			const validColumn = Math.max(1, Math.min(3, targetColumn));
			sections.moveSection(draggedSectionId, validColumn);
		}
		draggedSectionId = null;
		isDraggingAny.set(false);
	}
	
	function handleSectionDragEnd() {
		draggedSectionId = null;
		isDraggingAny.set(false);
	}
	
	function increaseSpan(sectionId: number) {
		const section = $sections.find(s => s.id === sectionId);
		if (section) {
			sections.resizeSection(sectionId, section.gridColumnSpan + 1);
		}
	}
	
	function decreaseSpan(sectionId: number) {
		const section = $sections.find(s => s.id === sectionId);
		if (section) {
			sections.resizeSection(sectionId, section.gridColumnSpan - 1);
		}
	}
	
	function handleWidgetDrop(event: CustomEvent<{targetSection: number, targetOrder: number, widgetId: string}>) {
		const { targetSection, targetOrder, widgetId } = event.detail;
		if (widgetId) {
			widgets.moveWidget(widgetId, targetSection, targetOrder);
		}
	}
</script>

<div class="dashboard-layout" bind:this={containerRef}>
	<!-- Drop zones for each column -->
	{#each [1, 2, 3] as columnNum}
		<div 
			class="drop-zone" 
			class:active={draggedSectionId !== null}
			style="grid-column: {columnNum}; grid-row: 1 / -1;"
			on:dragover={handleSectionDragOver}
			on:drop={(e) => handleSectionDrop(columnNum, e)}
			role="region"
			aria-label="Drop zone for column {columnNum}"
		>
			{#if draggedSectionId !== null}
				<span class="drop-zone-label">Drop here</span>
			{/if}
		</div>
	{/each}
	
	{#each sortedSections as section (section.id)}
		<div 
			class="section"
			class:dragging={draggedSectionId === section.id}
			style="grid-column: {section.gridColumn} / span {section.gridColumnSpan}; grid-row: {section.gridRow};"
			draggable="true"
			on:dragstart={(e) => handleSectionDragStart(section.id, e)}
			on:dragend={handleSectionDragEnd}
			role="region"
			aria-label="Section {section.id}"
		>
			<!-- Section Controls -->
			<div class="section-controls">
				<button 
					class="control-btn drag-handle"
					title="Drag to move section"
					aria-label="Drag to move section"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path d="M10 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
					</svg>
				</button>
				<div class="resize-controls">
					<button 
						class="control-btn"
						on:click={() => decreaseSpan(section.id)}
						disabled={section.gridColumnSpan <= 1}
						title="Decrease width"
						aria-label="Decrease section width"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
						</svg>
					</button>
					<span class="span-indicator">{section.gridColumnSpan}col</span>
					<button 
						class="control-btn"
						on:click={() => increaseSpan(section.id)}
						disabled={section.gridColumn + section.gridColumnSpan > 3}
						title="Increase width"
						aria-label="Increase section width"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
						</svg>
					</button>
				</div>
			</div>
			
			<div class="section-content">
				{#if widgetsBySection[section.id]}
					{#each widgetsBySection[section.id] as widget (widget.id)}
						<div class="widget-container">
							<Widget {widget} on:widgetDrop={handleWidgetDrop}>
								{#if widget.type === 'weather'}
									<svelte:component this={widgetComponents.WeatherWidget} />
								{:else if widget.type === 'traffic'}
									<svelte:component this={widgetComponents.TrafficWidget} />
								{:else if widget.type === 'calendar'}
									<svelte:component this={widgetComponents.CalendarWidget} />
								{:else if widget.type === 'github'}
									<svelte:component this={widgetComponents.GithubWidget} projects={data.githubProjects || []} />
								{:else if widget.type === 'organization-projects'}
									<svelte:component this={widgetComponents.OrganizationProjectsWidget} organizationProjects={data.organizationProjects || []} />
								{/if}
							</Widget>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.dashboard-layout {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		width: 100%;
		height: 100%;
		padding: 1rem;
		overflow-y: auto;
		position: relative;
		grid-auto-rows: minmax(min-content, max-content);
	}
	
	.drop-zone {
		position: absolute;
		top: 0;
		bottom: 0;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 122, 204, 0.1);
		border: 2px dashed var(--primary-color, #007acc);
		border-radius: 8px;
		z-index: 1;
	}
	
	.drop-zone.active {
		pointer-events: all;
		opacity: 1;
	}
	
	.drop-zone-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--primary-color, #007acc);
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	
	.section {
		display: flex;
		flex-direction: column;
		background-color: var(--surface, #ffffff);
		border-radius: 8px;
		border: 2px solid var(--outline-variant, #e0e0e0);
		overflow: hidden;
		min-height: fit-content;
		height: fit-content;
		position: relative;
		z-index: 2;
		transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
		cursor: move;
	}
	
	.section:hover {
		border-color: var(--primary-color, #007acc);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.section.dragging {
		opacity: 0.5;
		transform: scale(0.98);
	}
	
	.section-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background-color: var(--surface-variant, #f5f5f5);
		border-bottom: 1px solid var(--outline-variant, #e0e0e0);
		gap: 0.5rem;
	}
	
	.drag-handle {
		cursor: grab;
		color: var(--on-surface-variant, #666);
	}
	
	.drag-handle:active {
		cursor: grabbing;
	}
	
	.resize-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background-color: transparent;
		border: 1px solid var(--outline-variant, #e0e0e0);
		border-radius: 4px;
		cursor: pointer;
		color: var(--on-surface, #333);
		transition: background-color 0.2s, border-color 0.2s;
	}
	
	.control-btn:hover:not(:disabled) {
		background-color: var(--surface-container-high, #e8e8e8);
		border-color: var(--primary-color, #007acc);
	}
	
	.control-btn:active:not(:disabled) {
		background-color: var(--surface-container-highest, #d8d8d8);
	}
	
	.control-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	.span-indicator {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--on-surface-variant, #666);
		padding: 0 0.25rem;
		min-width: 35px;
		text-align: center;
	}
	
	.section-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		cursor: default;
	}
	
	.widget-container {
		width: 100%;
	}
	
	/* Tablet responsive - 2 columns */
	@media (max-width: 1024px) {
		.dashboard-layout {
			grid-template-columns: repeat(2, 1fr);
			grid-auto-flow: row; /* Ensure sections flow in rows */
		}
		
		.section {
			grid-column: auto / span 1 !important;
			grid-row: auto !important; /* Let grid auto-place sections to prevent overlap */
		}
	}
	
	/* Mobile responsive - 1 column */
	@media (max-width: 768px) {
		.dashboard-layout {
			grid-template-columns: 1fr;
			padding: 0.5rem;
			gap: 0.75rem;
			grid-auto-flow: row; /* Ensure sections flow in rows */
		}
		
		.section {
			grid-column: 1 / span 1 !important;
			grid-row: auto !important; /* Let grid auto-place sections to prevent overlap */
		}
		
		.section-content {
			padding: 0.75rem;
		}
		
		.drop-zone {
			display: none;
		}
	}
</style>