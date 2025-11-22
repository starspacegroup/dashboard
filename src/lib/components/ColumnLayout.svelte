<script lang="ts">
	import { widgets, sections, isDraggingAny } from '$lib/stores/widgets';
	import Widget from '$lib/components/Widget.svelte';
	import WidgetPicker from '$lib/components/WidgetPicker.svelte';
	import LayoutPicker from '$lib/components/LayoutPicker.svelte';
	import type { Widget as WidgetType } from '$lib/types/widget';
	
	export let widgetComponents: Record<string, any>;
	export let data: any;
	export let isWidgetPickerOpen = false;
	export let isLayoutPickerOpen = false;
	export let onWidgetPickerClose: () => void;
	export let onLayoutPickerClose: () => void;
	
	let internalWidgetPickerOpen = false;
	
	// Use internal or external state
	$: effectiveWidgetPickerOpen = isWidgetPickerOpen || internalWidgetPickerOpen;
	
	function openWidgetPicker() {
		internalWidgetPickerOpen = true;
	}
	
	function closeWidgetPicker() {
		internalWidgetPickerOpen = false;
		onWidgetPickerClose();
	}

	function closeLayoutPicker() {
		onLayoutPickerClose();
	}
	
	let containerRef: HTMLDivElement;
	let draggedSectionId: number | null = null;
	let isDraggingFromHandle = false;
	
	// Store weather widget component references
	let weatherWidgetRefs: Record<string, any> = {};
	
	function openWeatherSettings(widgetId: string) {
		const ref = weatherWidgetRefs[widgetId];
		if (ref && ref.openSettings) {
			ref.openSettings();
		}
	}
	
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
		// Only allow drag if it's from the handle
		if (!isDraggingFromHandle) {
			event.preventDefault();
			return;
		}
		draggedSectionId = sectionId;
		isDraggingAny.set(true);
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', sectionId.toString());
		}
	}
	
	function handleDragHandleMouseDown() {
		isDraggingFromHandle = true;
	}
	
	function handleDragHandleMouseUp() {
		isDraggingFromHandle = false;
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
			// Clamp to valid column range (1-4)
			const validColumn = Math.max(1, Math.min(4, targetColumn));
			sections.moveSection(draggedSectionId, validColumn);
		}
		draggedSectionId = null;
		isDraggingAny.set(false);
	}
	
	function handleSectionDragEnd() {
		draggedSectionId = null;
		isDraggingAny.set(false);
		isDraggingFromHandle = false;
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

<WidgetPicker isOpen={effectiveWidgetPickerOpen} onClose={closeWidgetPicker} />
<LayoutPicker isOpen={isLayoutPickerOpen} onClose={closeLayoutPicker} />

<div class="dashboard-layout" bind:this={containerRef}>
	<!-- Drop zones for each column -->
	{#each [1, 2, 3, 4] as columnNum}
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
			class:dragging={$isDraggingAny}
			style="grid-column: {section.gridColumn} / span {section.gridColumnSpan}; grid-row: {section.gridRow};"
			role="region"
			aria-label="Section {section.id}"
		>
			<div class="section-content">
				{#if widgetsBySection[section.id]}
					{#each widgetsBySection[section.id] as widget (widget.id)}
						<div class="widget-container">
							<Widget {widget} on:widgetDrop={handleWidgetDrop} onSettingsClick={widget.type === 'weather' ? () => openWeatherSettings(widget.id) : undefined}>
								{#if widget.type === 'weather'}
									<svelte:component this={widgetComponents.WeatherWidget} {widget} bind:this={weatherWidgetRefs[widget.id]} />
								{:else if widget.type === 'traffic'}
									<svelte:component this={widgetComponents.TrafficWidget} />
								{:else if widget.type === 'calendar'}
									<svelte:component this={widgetComponents.CalendarWidget} />
								{:else if widget.type === 'github'}
									<svelte:component this={widgetComponents.GithubWidget} projects={data.githubProjects || []} />
								{:else if widget.type === 'organization-projects'}
									<svelte:component this={widgetComponents.OrganizationProjectsWidget} organizationProjects={data.organizationProjects || []} />
								{:else if widget.type === 'github-projects'}
									<svelte:component this={widgetComponents.GithubProjectsWidget} projects={data.allGithubProjects || []} isLoggedIn={!!data.user} />
								{:else if widget.type === 'github-pull-requests'}
									<svelte:component this={widgetComponents.GithubPullRequestsWidget} assignedPRs={data.assignedPRs || []} createdPRs={data.createdPRs || []} reviewRequestedPRs={data.reviewRequestedPRs || []} isLoggedIn={!!data.user} />
								{:else if widget.type === 'data-table'}
									<svelte:component this={widgetComponents.DataTableWidget} />
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
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1.5rem;
		width: 100%;
		max-width: 100vw;
		height: 100%;
		padding: 1.5rem;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		grid-auto-rows: minmax(min-content, max-content);
		box-sizing: border-box;
	}
	
	.drop-zone {
		position: absolute;
		top: 0;
		bottom: 0;
		pointer-events: none;
		opacity: 0;
		transition: all var(--transition-normal) var(--ease-out);
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--primary-color-light), transparent);
		border: 2px dashed var(--primary-color);
		border-radius: 1rem;
		z-index: 1;
		backdrop-filter: blur(4px);
	}
	
	.drop-zone.active {
		pointer-events: all;
		opacity: 1;
		animation: pulseDropZone 1.5s ease-in-out infinite;
	}

	@keyframes pulseDropZone {
		0%, 100% {
			border-color: var(--primary-color);
			background: linear-gradient(135deg, var(--primary-color-light), transparent);
		}
		50% {
			border-color: var(--primary-color-hover);
			background: linear-gradient(135deg, rgba(0, 122, 204, 0.15), transparent);
		}
	}
	
	.drop-zone-label {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--primary-color);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-shadow: 0 2px 4px var(--shadow);
	}
	
	.section {
		display: flex;
		flex-direction: column;
		min-height: fit-content;
		height: fit-content;
		min-width: 0;
		position: relative;
		z-index: 2;
		overflow: visible;
		border: 3px dashed transparent;
		border-radius: 0;
		padding: 0;
		background: transparent;
		transition: border-color var(--transition-fast) var(--ease-out), padding var(--transition-fast) var(--ease-out);
	}

	.section.dragging {
		border-color: var(--border);
		padding: 1rem;
	}

	.section.dragging:hover {
		border-color: var(--primary-color);
	}
	
	.section-content {
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
	}
	
	.widget-container {
		width: 100%;
		min-width: 0;
		overflow: visible;
	}
	
	/* Tablet responsive - 2 columns */
	@media (max-width: 1024px) {
		.dashboard-layout {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.25rem;
			padding: 1.25rem;
			grid-auto-flow: row;
		}
		
		.section {
			grid-column: auto / span 1 !important;
			grid-row: auto !important;
		}

		.section.dragging {
			padding: 0.875rem;
		}

		.section-content {
			gap: 0.875rem;
		}
	}

	/* Mobile responsive - 1 column */
	@media (max-width: 768px) {
		.dashboard-layout {
			grid-template-columns: 1fr;
			padding: 1rem;
			gap: 1rem;
			grid-auto-flow: row;
		}
		
		.section {
			grid-column: 1 / span 1 !important;
			grid-row: auto !important;
			border-radius: 0.625rem;
		}

		.section.dragging {
			padding: 0.75rem;
		}
		
		.section-content {
			padding: 0.5rem;
			gap: 0.75rem;
		}
		
		.drop-zone {
			display: none;
		}

	}

	/* Small mobile */
	@media (max-width: 480px) {
		.dashboard-layout {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.section.dragging {
			padding: 0.625rem;
			border-width: 2px;
		}

		.section-content {
			padding: 0.25rem;
		}
	}
</style>