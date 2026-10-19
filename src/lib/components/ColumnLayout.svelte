<script lang="ts">
	import { onMount } from 'svelte';
	import { widgets, sections, isDraggingAny, gridColumns } from '$lib/stores/widgets';
	import Widget from '$lib/components/Widget.svelte';
	import WidgetPicker from '$lib/components/WidgetPicker.svelte';
	import LayoutPicker from '$lib/components/LayoutPicker.svelte';
	import type { Widget as WidgetType } from '$lib/types/widget';
	import type { ComponentType } from 'svelte';
	
	export let widgetComponents: Record<string, ComponentType>;
	export let data: Record<string, unknown>;
	export let isWidgetPickerOpen = false;
	export let isLayoutPickerOpen = false;
	export let onWidgetPickerClose: () => void;
	export let onLayoutPickerClose: () => void;
	
	let internalWidgetPickerOpen = false;
	
	// Use internal or external state
	$: effectiveWidgetPickerOpen = isWidgetPickerOpen || internalWidgetPickerOpen;
	
	function closeWidgetPicker() {
		internalWidgetPickerOpen = false;
		onWidgetPickerClose();
	}

	function closeLayoutPicker() {
		onLayoutPickerClose();
	}
	
	let containerRef: HTMLDivElement;
	let draggedSectionId: number | null = null;
	
	// Component refs for widgets that expose an openSettings() (weather, traffic)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let settingsWidgetRefs: Record<string, any> = {};

	function openWidgetSettings(widgetId: string) {
		const ref = settingsWidgetRefs[widgetId];
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

	// The grid sizes itself to the window: it renders as many of the chosen
	// columns as fit at MIN_COLUMN_WIDTH, measured from the container rather
	// than fixed breakpoints, so a 6-column dashboard steps down 6→5→4… as the
	// window narrows. Nothing is saved — widening again restores the layout.
	const MIN_COLUMN_WIDTH = 320;
	// Matches the .dashboard-layout gap (1.5rem) closely enough for the fit
	const GRID_GAP = 24;
	let layoutWidth = 0;
	$: fitColumns = layoutWidth > 0
		? Math.max(1, Math.min($gridColumns, Math.floor((layoutWidth + GRID_GAP) / (MIN_COLUMN_WIDTH + GRID_GAP))))
		: $gridColumns;
	$: isFitted = fitColumns < $gridColumns;

	function sectionStyle(section: { gridColumn: number; gridColumnSpan: number; gridRow: number }, columns: number, fitted: boolean): string {
		// Squeezed: sections flow in reading order, each keeping as much of its
		// width as the narrower grid allows
		if (fitted) return `grid-column: auto / span ${Math.min(section.gridColumnSpan, columns)}; grid-row: auto;`;
		return `grid-column: ${section.gridColumn} / span ${section.gridColumnSpan}; grid-row: ${section.gridRow};`;
	}

	onMount(() => {
		const observer = new ResizeObserver(([entry]) => {
			layoutWidth = entry.contentRect.width;
		});
		observer.observe(containerRef);
		return () => observer.disconnect();
	});
	
	function handleSectionDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}
	
	function handleSectionDrop(targetColumn: number, event: DragEvent) {
		event.preventDefault();
		if (draggedSectionId !== null) {
			const validColumn = Math.max(1, Math.min($gridColumns, targetColumn));
			sections.moveSection(draggedSectionId, validColumn);
		}
		draggedSectionId = null;
		isDraggingAny.set(false);
	}
	
	function handleSectionDragStart(sectionId: number, event: DragEvent) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', String(sectionId));
			// Drag the whole section's image, not just the small handle
			const sectionEl = (event.currentTarget as HTMLElement).closest('.section');
			if (sectionEl) event.dataTransfer.setDragImage(sectionEl, 16, 16);
		}
		// Flip the drag state after the browser has captured the drag image: the
		// section padding and active drop zones reflow the page, and doing that
		// inside dragstart makes Chrome cancel the drag outright.
		setTimeout(() => {
			draggedSectionId = sectionId;
			isDraggingAny.set(true);
		}, 0);
	}

	function handleSectionDragEnd() {
		draggedSectionId = null;
		isDraggingAny.set(false);
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

<div class="dashboard-layout" style="--grid-columns: {fitColumns};" bind:this={containerRef}>
	<!-- Drop zones for each column; a squeezed grid's columns aren't the saved
	     ones, so there is nothing true to drop a section onto -->
	{#each isFitted ? [] : Array.from({ length: $gridColumns }, (_, i) => i + 1) as columnNum}
		<div 
			class="drop-zone" 
			class:active={draggedSectionId !== null}
			style="grid-column: {columnNum};"
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
			data-section-id={section.id}
			style={sectionStyle(section, fitColumns, isFitted)}
			role="region"
			aria-label="Section {section.id}"
		>
			{#if !isFitted}
			<button
				class="section-drag-handle"
				draggable="true"
				on:dragstart={(e) => handleSectionDragStart(section.id, e)}
				on:dragend={handleSectionDragEnd}
				aria-label="Drag section"
				title="Drag section to another column"
				type="button">⋮⋮</button>
			{/if}
			<div class="section-content">
				{#if widgetsBySection[section.id]}
					{#each widgetsBySection[section.id] as widget (widget.id)}
						<div class="widget-container" data-widget-id={widget.id}>
							<Widget {widget} on:widgetDrop={handleWidgetDrop} onSettingsClick={widget.type === 'weather' || widget.type === 'traffic' || widget.type === 'cloudflare' || widget.type === 'nebulakit' ? () => openWidgetSettings(widget.id) : undefined}>
								{#if widget.type === 'weather'}
									<svelte:component this={widgetComponents.WeatherWidget} {widget} bind:this={settingsWidgetRefs[widget.id]} />
								{:else if widget.type === 'traffic'}
									<svelte:component this={widgetComponents.TrafficWidget} {widget} bind:this={settingsWidgetRefs[widget.id]} />
								{:else if widget.type === 'calendar'}
									<svelte:component this={widgetComponents.CalendarWidget} />
								{:else if widget.type === 'github'}
									<svelte:component this={widgetComponents.GithubWidget} projects={data.githubProjects || []} />
								{:else if widget.type === 'organization-projects'}
									<svelte:component this={widgetComponents.OrganizationProjectsWidget} organizationProjects={data.organizationProjects || []} />
								{:else if widget.type === 'github-projects'}
									<svelte:component this={widgetComponents.GithubProjectsWidget} projects={data.allGithubProjects || []} isLoggedIn={!!data.user} />
								{:else if widget.type === 'github-pull-requests'}
									<svelte:component this={widgetComponents.GithubPullRequestsWidget} {widget} assignedPRs={data.assignedPRs || []} createdPRs={data.createdPRs || []} reviewRequestedPRs={data.reviewRequestedPRs || []} organizationPRs={data.organizationPRs || []} githubOrganizations={data.githubOrganizations || []} isLoggedIn={!!data.user} />
								{:else if widget.type === 'data-table'}
									<svelte:component this={widgetComponents.DataTableWidget} />
								{:else if widget.type === 'copilot-usage'}
									<svelte:component this={widgetComponents.CopilotUsageWidget} copilotMetrics={data.copilotMetrics || []} isLoggedIn={!!data.user} />
								{:else if widget.type === 'crypto'}
									<svelte:component this={widgetComponents.CryptoWidget} {widget} />
								{:else if widget.type === 'google-analytics'}
									<svelte:component this={widgetComponents.GoogleAnalyticsWidget} {widget} />
								{:else if widget.type === 'cloudflare'}
									<svelte:component this={widgetComponents.CloudflareWidget} {widget} bind:this={settingsWidgetRefs[widget.id]} />
								{:else if widget.type === 'nebulakit'}
									<svelte:component this={widgetComponents.NebulaKitWidget} {widget} bind:this={settingsWidgetRefs[widget.id]} />
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
		grid-template-columns: repeat(var(--grid-columns, 4), minmax(0, 1fr));
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
		/* Sit above the sections so the drop reaches the zone */
		z-index: 3;
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
	
	/* Same grip glyph and look as the widget's .drag-handle in Widget.svelte */
	.section-drag-handle {
		position: absolute;
		top: -0.75rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 4;
		background: var(--surface);
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: grab;
		font-size: 1.25rem;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 0;
		min-width: 24px;
		min-height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		opacity: 0;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.section:hover > .section-drag-handle,
	.section.dragging > .section-drag-handle,
	.section-drag-handle:focus-visible {
		opacity: 1;
	}

	.section-drag-handle:hover {
		color: var(--primary-color);
		border-color: var(--primary-color);
	}

	.section-drag-handle:active {
		cursor: grabbing;
	}

	@media (hover: none) {
		.section-drag-handle {
			opacity: 1;
		}
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
	
	/* Column count is fitted to the measured width in the script; these only
	   tighten spacing */
	@media (max-width: 1024px) {
		.dashboard-layout {
			gap: 1.25rem;
			padding: 1.25rem;
		}

		.section.dragging {
			padding: 0.875rem;
		}

		.section-content {
			gap: 0.875rem;
		}
	}

	@media (max-width: 768px) {
		.dashboard-layout {
			padding: 0.75rem;
			gap: 0.875rem;
		}

		.section {
			border-radius: 0.625rem;
		}

		.section.dragging {
			padding: 0.75rem;
		}

		.section-content {
			/* Sections are invisible grouping on mobile — no extra inset */
			padding: 0;
			gap: 0.875rem;
		}
		
		.drop-zone {
			display: none;
		}

	}

	/* Small mobile */
	@media (max-width: 480px) {
		.dashboard-layout {
			padding: 0.5rem;
			gap: 0.75rem;
		}

		.section.dragging {
			padding: 0.625rem;
			border-width: 2px;
		}

		.section-content {
			padding: 0;
		}
	}
</style>