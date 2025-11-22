<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { widgets, sections } from '$lib/stores/widgets';
	import type { Widget } from '$lib/types/widget';

	export let isOpen = false;
	export let onClose: () => void;

	interface WidgetTemplate {
		type: Widget['type'];
		title: string;
		description: string;
		icon: string;
	}

	const availableWidgets: WidgetTemplate[] = [
		{
			type: 'weather',
			title: 'Weather',
			description: 'Display current weather conditions',
			icon: '🌤️'
		},
		{
			type: 'traffic',
			title: 'Traffic',
			description: 'Show traffic conditions and maps',
			icon: '🚗'
		},
		{
			type: 'calendar',
			title: 'Calendar',
			description: 'View your calendar events',
			icon: '📅'
		},
		{
			type: 'github',
			title: 'GitHub',
			description: 'GitHub repository information',
			icon: '🐙'
		},
		{
			type: 'organization-projects',
			title: 'Organization Projects',
			description: 'View organization GitHub projects',
			icon: '🏢'
		},
		{
			type: 'github-projects',
			title: 'GitHub Projects',
			description: 'View all your GitHub projects',
			icon: '📋'
		},
		{
			type: 'github-pull-requests',
			title: 'GitHub Pull Requests',
			description: 'Track your pull requests',
			icon: '🔀'
		},
		{
			type: 'data-table',
			title: 'Data Table',
			description: 'Display detailed weather and system data',
			icon: '📊'
		}
	];

	let searchInput: HTMLInputElement;
	let searchQuery = '';
	let selectedIndex = 0;
	let selectedSection = 0;
	let sectionsList: number[] = [];

	$: filteredWidgets = searchQuery.trim()
		? availableWidgets.filter(widget =>
			widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			widget.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: availableWidgets;

	$: {
		// Update sections list whenever sections change
		sectionsList = $sections.map(s => s.id).sort((a, b) => a - b);
		// Ensure selectedSection is valid
		if (!sectionsList.includes(selectedSection) && sectionsList.length > 0) {
			selectedSection = sectionsList[0];
		}
	}

	function addWidget(widgetTemplate: WidgetTemplate) {
		const newWidget: Widget = {
			id: `${widgetTemplate.type}-${Date.now()}`,
			type: widgetTemplate.type,
			title: widgetTemplate.title,
			section: selectedSection,
			order: 0, // Will be automatically calculated by the store
			size: { width: 300, height: 200 }
		};

		widgets.addWidget(newWidget);
		closeAndReset();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			if (searchQuery.trim()) {
				searchQuery = '';
				selectedIndex = 0;
			} else {
				closeAndReset();
			}
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = (selectedIndex + 1) % filteredWidgets.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = selectedIndex === 0 ? filteredWidgets.length - 1 : selectedIndex - 1;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (filteredWidgets.length > 0) {
				addWidget(filteredWidgets[selectedIndex]);
			}
		} else if (event.key === 'Tab') {
			event.preventDefault();
			// Cycle through sections with Tab
			const currentIdx = sectionsList.indexOf(selectedSection);
			const nextIdx = (currentIdx + 1) % sectionsList.length;
			selectedSection = sectionsList[nextIdx];
		}
	}

	function closeAndReset() {
		searchQuery = '';
		selectedIndex = 0;
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeAndReset();
		}
	}

	$: if (isOpen && searchInput) {
		setTimeout(() => searchInput.focus(), 0);
	}
</script>

{#if isOpen}
	<div 
		class="widget-picker-backdrop" 
		on:click={handleBackdropClick}
		transition:fade={{ duration: 150 }}
		role="presentation"
	>
		<div class="widget-picker" transition:fly={{ y: -20, duration: 200 }}>
			<div class="header">
				<h2>Add Widget</h2>
				<button class="close-btn" on:click={closeAndReset} aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
						<path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
					</svg>
				</button>
			</div>

			<div class="section-selector">
				<label for="section-select">Add to section:</label>
				<select id="section-select" bind:value={selectedSection}>
					{#each sectionsList as sectionId}
						<option value={sectionId}>Section {sectionId + 1}</option>
					{/each}
				</select>
			</div>

			<div class="search-container">
				<div class="search-icon">🔍</div>
				<input
					bind:this={searchInput}
					bind:value={searchQuery}
					on:keydown={handleKeyDown}
					type="text"
					placeholder="Search widgets..."
					class="search-input"
					autocomplete="off"
					spellcheck="false"
				/>
			</div>

			<div class="widgets-list">
				{#if filteredWidgets.length === 0}
					<div class="no-results">
						<div class="no-results-icon">🔍</div>
						<div class="no-results-text">No widgets found</div>
					</div>
				{:else}
					{#each filteredWidgets as widget, index}
						<button
							class="widget-item"
							class:selected={index === selectedIndex}
							on:click={() => addWidget(widget)}
							on:mouseenter={() => selectedIndex = index}
						>
							<div class="widget-icon">{widget.icon}</div>
							<div class="widget-main">
								<div class="widget-title">{widget.title}</div>
								<div class="widget-description">{widget.description}</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<div class="footer">
				<div class="footer-hint">
					<kbd>↑↓</kbd> Navigate
					<kbd>Tab</kbd> Change Section
					<kbd>↵</kbd> Add
					<kbd>ESC</kbd> Close
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.widget-picker-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--overlay);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.widget-picker {
		background-color: var(--surface);
		border-radius: 0;
		box-shadow: 8px 8px 0 var(--shadow-strong);
		width: 100%;
		max-width: 640px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 4px solid var(--primary-color);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.75rem;
		border-bottom: 3px solid var(--primary-color);
		background: var(--surface);
	}

	.header h2 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 900;
		color: var(--primary-color);
		letter-spacing: -0.025em;
		text-transform: uppercase;
	}

	.close-btn {
		background: var(--surface);
		border: 2px solid var(--border);
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0;
		transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
		min-width: 36px;
		min-height: 36px;
		box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
	}

	.close-btn:hover {
		background-color: var(--primary-color);
		color: var(--surface);
		border-color: var(--primary-color);
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
	}

	.close-btn:active {
		transform: scale(0.95) rotate(0deg);
	}

	.section-selector {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.75rem;
		background: linear-gradient(to bottom, var(--surface-variant), var(--surface));
		border-bottom: 1px solid var(--border);
	}

	.section-selector label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-selector select {
		padding: 0.625rem 1rem;
		border: 2px solid var(--border);
		border-radius: 0.5rem;
		background-color: var(--surface);
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.section-selector select:hover {
		border-color: var(--primary-color);
		box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
	}

	.section-selector select:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
	}

	.search-container {
		display: flex;
		align-items: center;
		padding: 1.25rem 1.75rem;
		border-bottom: 3px solid var(--border);
		gap: 1rem;
		position: relative;
	}

	.search-icon {
		font-size: 1.5rem;
		color: var(--primary-color);
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.search-input::placeholder {
		color: var(--text-secondary);
		opacity: 0.7;
	}

	.widgets-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
	}

	.widgets-list::-webkit-scrollbar {
		width: 10px;
	}

	.widgets-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.widgets-list::-webkit-scrollbar-thumb {
		background: var(--surface-variant);
		border-radius: 0.5rem;
		border: 2px solid var(--surface);
	}

	.widgets-list::-webkit-scrollbar-thumb:hover {
		background: var(--border);
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 1rem;
		color: var(--text-secondary);
	}

	.no-results-icon {
		font-size: 3.5rem;
		margin-bottom: 1rem;
		opacity: 0.4;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.no-results-text {
		font-size: 1rem;
		font-weight: 500;
	}

	.widget-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1.125rem 1.25rem;
		background-color: transparent;
		border: 2px solid transparent;
		border-radius: 0;
		cursor: pointer;
		transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
		text-align: left;
		position: relative;
	}

	.widget-item:hover,
	.widget-item.selected {
		background-color: var(--primary-color);
		color: var(--surface);
		border-color: var(--primary-color);
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
		transform: translate(-2px, -2px);
	}

	.widget-icon {
		font-size: 2.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.widget-main {
		flex: 1;
		min-width: 0;
	}

	.widget-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.375rem;
		transition: color 100ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.widget-item:hover .widget-title,
	.widget-item.selected .widget-title {
		color: var(--surface);
	}

	.widget-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.footer {
		padding: 1rem 1.75rem;
		border-top: 3px solid var(--border);
		background: var(--surface);
	}

	.footer-hint {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		flex-wrap: wrap;
	}

	kbd {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-variant);
		border: 2px solid var(--border);
		border-radius: 0;
		font-size: 0.7rem;
		font-weight: 600;
		line-height: 1;
		color: var(--text-primary);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.widget-picker {
			max-width: 100%;
			max-height: 90vh;
			border-radius: 1rem 1rem 0 0;
		}

		.header {
			padding: 1.25rem 1.5rem;
		}

		.section-selector,
		.search-container {
			padding: 1rem 1.5rem;
		}

		.widget-item {
			padding: 1rem;
			gap: 1rem;
		}

		.widget-icon {
			font-size: 2rem;
		}

		.footer-hint {
			gap: 0.75rem;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.header {
			padding: 1rem 1.25rem;
		}

		.header h2 {
			font-size: 1.15rem;
		}

		.section-selector,
		.search-container {
			padding: 0.875rem 1.25rem;
		}

		.widget-item {
			padding: 0.875rem 1rem;
		}

		.widget-description {
			font-size: 0.8rem;
		}

		.footer {
			padding: 0.875rem 1.25rem;
		}

		kbd {
			padding: 0.2rem 0.4rem;
		}
	}
</style>
