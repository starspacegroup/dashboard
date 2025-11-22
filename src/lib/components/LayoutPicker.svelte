<script lang="ts">
	import { sections } from '$lib/stores/widgets';
	import type { Section } from '$lib/types/widget';

	export let isOpen = false;
	export let onClose: () => void;

	interface LayoutPreset {
		id: string;
		name: string;
		description: string;
		sections: Omit<Section, 'id'>[];
		icon: Array<{ col: number; span: number; row: number }>;
	}

	const layoutPresets: LayoutPreset[] = [
		// ===== SINGLE COLUMN LAYOUTS =====
		{
			id: 'single-column',
			name: 'Single Column',
			description: 'One full-width column for focused content',
			sections: [{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 }],
			icon: [{ col: 1, span: 4, row: 1 }]
		},

		// ===== TWO COLUMN LAYOUTS =====
		{
			id: 'two-column-equal',
			name: 'Two Equal Columns',
			description: 'Balanced split for parallel workflows',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 2, row: 1 },
				{ col: 3, span: 2, row: 1 }
			]
		},
		{
			id: 'left-sidebar',
			name: 'Left Sidebar',
			description: 'Narrow sidebar with main content area',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 3, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 3, row: 1 }
			]
		},
		{
			id: 'right-sidebar',
			name: 'Right Sidebar',
			description: 'Main content with narrow right panel',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 3, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 3, row: 1 },
				{ col: 4, span: 1, row: 1 }
			]
		},

		// ===== THREE COLUMN LAYOUTS =====
		{
			id: 'three-column-equal',
			name: 'Three Equal Columns',
			description: 'Balanced triptych layout',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 2, row: 1 },
				{ col: 4, span: 1, row: 1 }
			]
		},
		{
			id: 'three-column-wide-center',
			name: 'Wide Center',
			description: 'Emphasized center with sidebars',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 2, row: 1 },
				{ col: 4, span: 1, row: 1 }
			]
		},

		// ===== FOUR COLUMN LAYOUTS =====
		{
			id: 'four-column-equal',
			name: 'Four Equal Columns',
			description: 'Four balanced sections side by side',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 1, row: 1 },
				{ col: 3, span: 1, row: 1 },
				{ col: 4, span: 1, row: 1 }
			]
		},

		// ===== HEADER LAYOUTS =====
		{
			id: 'header-two-column',
			name: 'Header + Two Columns',
			description: 'Banner top with split content below',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 4, row: 1 },
				{ col: 1, span: 2, row: 2 },
				{ col: 3, span: 2, row: 2 }
			]
		},
		{
			id: 'header-three-column',
			name: 'Header + Three Columns',
			description: 'Featured top with organized sections',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 2, gridRow: 2 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 4, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 2, row: 2 },
				{ col: 4, span: 1, row: 2 }
			]
		},
		{
			id: 'header-four-column',
			name: 'Header + Four Columns',
			description: 'Full-width header with four columns below',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 4, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 1, row: 2 },
				{ col: 3, span: 1, row: 2 },
				{ col: 4, span: 1, row: 2 }
			]
		},

		// ===== FOOTER LAYOUTS =====
		{
			id: 'four-column-footer',
			name: 'Four Columns + Footer',
			description: 'Four sections with bottom summary',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 1, row: 1 },
				{ col: 3, span: 1, row: 1 },
				{ col: 4, span: 1, row: 1 },
				{ col: 1, span: 4, row: 2 }
			]
		},

		// ===== GRID LAYOUTS =====
		{
			id: 'grid-2x2',
			name: '2×2 Grid',
			description: 'Four equal quadrants',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 2, row: 1 },
				{ col: 3, span: 2, row: 1 },
				{ col: 1, span: 2, row: 2 },
				{ col: 3, span: 2, row: 2 }
			]
		},
		{
			id: 'grid-4x2',
			name: '4×2 Grid',
			description: 'Eight sections in two rows',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 1, row: 1 },
				{ col: 3, span: 1, row: 1 },
				{ col: 4, span: 1, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 1, row: 2 },
				{ col: 3, span: 1, row: 2 },
				{ col: 4, span: 1, row: 2 }
			]
		},
		{
			id: 'grid-4x3',
			name: '4×3 Grid',
			description: 'Twelve sections in three rows',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 3 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 3 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 3 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 3 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 2, span: 1, row: 1 },
				{ col: 3, span: 1, row: 1 },
				{ col: 4, span: 1, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 1, row: 2 },
				{ col: 3, span: 1, row: 2 },
				{ col: 4, span: 1, row: 2 },
				{ col: 1, span: 1, row: 3 },
				{ col: 2, span: 1, row: 3 },
				{ col: 3, span: 1, row: 3 },
				{ col: 4, span: 1, row: 3 }
			]
		},

		// ===== ASYMMETRIC LAYOUTS =====
		{
			id: 'left-dominant',
			name: 'Left Dominant',
			description: 'Large left section with stacked right',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 3, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 3, row: 1 },
				{ col: 4, span: 1, row: 1 },
				{ col: 4, span: 1, row: 2 }
			]
		},
		{
			id: 'right-dominant',
			name: 'Right Dominant',
			description: 'Stacked left with large right section',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 3, gridRow: 1 }
			],
			icon: [
				{ col: 1, span: 1, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 3, row: 1 }
			]
		},
		{
			id: 'asymmetric-split',
			name: 'Asymmetric Split',
			description: 'Mixed column widths across rows',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 3, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 3, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 3, row: 1 },
				{ col: 4, span: 1, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 3, row: 2 }
			]
		},

		// ===== COMPLEX LAYOUTS =====
		{
			id: 'dashboard',
			name: 'Dashboard',
			description: 'Header with mixed content below',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 2, gridRow: 2 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 3 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 3 }
			],
			icon: [
				{ col: 1, span: 4, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 2, row: 2 },
				{ col: 4, span: 1, row: 2 },
				{ col: 1, span: 2, row: 3 },
				{ col: 3, span: 2, row: 3 }
			]
		},
		{
			id: 'magazine-style',
			name: 'Magazine',
			description: 'Editorial layout with varied sections',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 3, gridRow: 1 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 3, gridRow: 2 },
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 3 }
			],
			icon: [
				{ col: 1, span: 3, row: 1 },
				{ col: 4, span: 1, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 3, row: 2 },
				{ col: 1, span: 4, row: 3 }
			]
		},
		{
			id: 'sandwich',
			name: 'Sandwich',
			description: 'Header, four columns, footer',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 2, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 4, gridColumnSpan: 1, gridRow: 2 },
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 3 }
			],
			icon: [
				{ col: 1, span: 4, row: 1 },
				{ col: 1, span: 1, row: 2 },
				{ col: 2, span: 1, row: 2 },
				{ col: 3, span: 1, row: 2 },
				{ col: 4, span: 1, row: 2 },
				{ col: 1, span: 4, row: 3 }
			]
		},

		// ===== STACKED LAYOUTS =====
		{
			id: 'stacked-halves',
			name: 'Stacked Halves',
			description: 'Two rows of two columns each',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 2, gridRow: 2 },
				{ gridColumn: 3, gridColumnSpan: 2, gridRow: 2 }
			],
			icon: [
				{ col: 1, span: 2, row: 1 },
				{ col: 3, span: 2, row: 1 },
				{ col: 1, span: 2, row: 2 },
				{ col: 3, span: 2, row: 2 }
			]
		},
		{
			id: 'triple-stack',
			name: 'Triple Stack',
			description: 'Three full-width rows',
			sections: [
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 1 },
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 2 },
				{ gridColumn: 1, gridColumnSpan: 4, gridRow: 3 }
			],
			icon: [
				{ col: 1, span: 4, row: 1 },
				{ col: 1, span: 4, row: 2 },
				{ col: 1, span: 4, row: 3 }
			]
		}
	];

	function applyLayout(preset: LayoutPreset) {
		sections.applyLayout(preset.sections);
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="modal-backdrop" on:click={handleBackdropClick} role="button" tabindex="-1">
		<div class="modal-content" role="dialog" aria-labelledby="layout-picker-title">
			<div class="modal-header">
				<h2 id="layout-picker-title">Choose a Layout</h2>
				<button class="close-button" on:click={onClose} aria-label="Close layout picker">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="layout-grid">
				{#each layoutPresets as preset (preset.id)}
					<button class="layout-card" on:click={() => applyLayout(preset)}>
						<div class="layout-icon">
							<svg viewBox="0 0 90 60" preserveAspectRatio="xMidYMid meet">
								<!-- Grid background -->
								<defs>
									<pattern id="grid-{preset.id}" width="22.5" height="20" patternUnits="userSpaceOnUse">
										<path d="M 22.5 0 L 0 0 0 20" fill="none" stroke="var(--border-light)" stroke-width="0.5" opacity="0.3"/>
									</pattern>
								</defs>
								<rect width="90" height="60" fill="url(#grid-{preset.id})" />
								
							<!-- Layout sections -->
							{#each preset.icon as section}
								<rect
									x={section.col === 1 ? 2 : section.col === 2 ? 24.5 : section.col === 3 ? 47 : 69.5}
									y={section.row === 1 ? 2 : section.row === 2 ? 22 : 42}
									width={section.span === 1 ? 20 : section.span === 2 ? 42.5 : section.span === 3 ? 65 : 86}
									height="16"
									fill="var(--primary-container)"
									stroke="var(--primary-color)"
									stroke-width="1.5"
									rx="2"
									/>
								{/each}
							</svg>
						</div>
						<div class="layout-info">
							<h3 class="layout-name">{preset.name}</h3>
							<p class="layout-description">{preset.description}</p>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--overlay);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background-color: var(--surface);
		border-radius: 12px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.close-button {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.close-button:hover {
		background-color: var(--hover-bg);
		color: var(--text-primary);
	}

	.layout-grid {
		padding: 2rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1.5rem;
		overflow-y: auto;
		max-height: calc(90vh - 5rem);
	}

	.layout-card {
		background: var(--surface-container);
		border: 2px solid var(--border);
		border-radius: 10px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-align: left;
		height: 100%;
	}

	.layout-card:hover {
		border-color: var(--primary-color);
		background: var(--surface-container-high);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.layout-card:active {
		transform: translateY(0);
	}

	.layout-icon {
		width: 100%;
		flex: 1;
		min-height: 90px;
		border-radius: 6px;
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--border-light);
		display: flex;
		align-items: stretch;
	}

	.layout-icon svg {
		width: 100%;
		height: 100%;
		display: block;
		flex: 1;
	}

	.layout-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.layout-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.layout-description {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.3;
	}

	/* Tablet responsive */
	@media (max-width: 768px) {
		.modal-content {
			max-width: 95vw;
			max-height: 95vh;
		}

		.modal-header {
			padding: 1rem 1.5rem;
		}

		.layout-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 1rem;
			padding: 1.5rem;
		}

		.layout-card {
			padding: 0.75rem;
		}

		.layout-name {
			font-size: 0.8rem;
		}

		.layout-description {
			font-size: 0.7rem;
		}
	}

	/* Mobile responsive */
	@media (max-width: 480px) {
		.layout-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
			padding: 1rem;
		}
	}

	/* Color scheme variables */
	:global(:root) {
		--border-light: rgba(0, 0, 0, 0.1);
	}

	:global([data-theme='dark']) {
		--border-light: rgba(255, 255, 255, 0.1);
	}
</style>
