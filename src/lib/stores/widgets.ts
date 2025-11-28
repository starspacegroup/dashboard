import { writable } from 'svelte/store';
import type { Widget, Section } from '$lib/types/widget';

const WIDGETS_STORAGE_KEY = 'dashboard-widgets';
const SECTIONS_STORAGE_KEY = 'dashboard-sections';
const LAYOUT_WIDGETS_STORAGE_KEY = 'dashboard-layout-widgets';
const CURRENT_LAYOUT_KEY = 'dashboard-current-layout';

// Global drag state
export const isDraggingAny = writable(false);

// Generate a unique fingerprint for a layout configuration
function getLayoutFingerprint(sections: Section[]): string {
	const sorted = [...sections].sort((a, b) => {
		if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
		return a.gridColumn - b.gridColumn;
	});
	return sorted.map(s => `${s.gridColumn}-${s.gridColumnSpan}-${s.gridRow}`).join('|');
}

// Load per-layout widget positions
function loadLayoutWidgets(): Record<string, Widget[]> {
	if (typeof window === 'undefined') return {};
	try {
		const stored = localStorage.getItem(LAYOUT_WIDGETS_STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch (error) {
		console.warn('Failed to load layout widgets:', error);
		return {};
	}
}

// Save per-layout widget positions
function saveLayoutWidgets(layoutWidgets: Record<string, Widget[]>) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(LAYOUT_WIDGETS_STORAGE_KEY, JSON.stringify(layoutWidgets));
	} catch (error) {
		console.warn('Failed to save layout widgets:', error);
	}
}

// Get current layout fingerprint
function getCurrentLayout(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(CURRENT_LAYOUT_KEY);
	} catch (error) {
		return null;
	}
}

// Save current layout fingerprint
function saveCurrentLayout(fingerprint: string) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(CURRENT_LAYOUT_KEY, fingerprint);
	} catch (error) {
		console.warn('Failed to save current layout:', error);
	}
}

/**
 * Generate intelligent widget positions for a new layout.
 * 
 * This function distributes widgets across sections based on their visual size (column span).
 * Larger sections receive proportionally more widgets than smaller ones, creating a balanced
 * and sensible distribution. Widgets maintain their original order but are reassigned to
 * sections that best accommodate them.
 * 
 * @param widgets - The current widgets to redistribute
 * @param sections - The new layout sections
 * @returns Widgets with updated section and order properties
 */
function generateDefaultWidgetPositions(widgets: Widget[], sections: Section[]): Widget[] {
	if (sections.length === 0) return widgets;
	if (widgets.length === 0) return widgets;

	// Sort sections by row, then column for predictable distribution
	const sortedSections = [...sections].sort((a, b) => {
		if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
		return a.gridColumn - b.gridColumn;
	});

	// Calculate relative "capacity" for each section based on its visual size
	// Larger sections (more column span) should get more widgets
	const sectionCapacities = sortedSections.map(section => ({
		section,
		capacity: section.gridColumnSpan || 1,
		widgets: [] as Widget[]
	}));

	const totalCapacity = sectionCapacities.reduce((sum, s) => sum + s.capacity, 0);

	// Distribute widgets proportionally based on section capacity
	let widgetIndex = 0;
	for (const sectionData of sectionCapacities) {
		// Calculate how many widgets this section should get
		const targetCount = Math.max(1, Math.round((sectionData.capacity / totalCapacity) * widgets.length));

		// Assign widgets to this section
		for (let i = 0; i < targetCount && widgetIndex < widgets.length; i++) {
			sectionData.widgets.push(widgets[widgetIndex]);
			widgetIndex++;
		}
	}

	// If there are leftover widgets (due to rounding), distribute them to the largest sections
	while (widgetIndex < widgets.length) {
		// Find the section with the most capacity that has the fewest widgets relative to capacity
		const targetSection = sectionCapacities.reduce((best, current) => {
			const currentRatio = current.widgets.length / current.capacity;
			const bestRatio = best.widgets.length / best.capacity;
			return currentRatio < bestRatio ? current : best;
		});

		targetSection.widgets.push(widgets[widgetIndex]);
		widgetIndex++;
	}

	// Create the final widget array with updated section and order properties
	const result: Widget[] = [];
	for (const sectionData of sectionCapacities) {
		sectionData.widgets.forEach((widget, order) => {
			result.push({
				...widget,
				section: sectionData.section.id,
				order
			});
		});
	}

	return result;
}

// Default sections - 4 column grid-based layout
const defaultSections: Section[] = [
	{ id: 0, gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
	{ id: 1, gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
	{ id: 2, gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
	{ id: 3, gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
];


const defaultWidgets: Widget[] = [
	{
		id: 'weather-1',
		type: 'weather',
		title: 'Weather',
		section: 0,
		order: 0,
		size: { width: 300, height: 200 }
	},
	{
		id: 'traffic-1',
		type: 'traffic',
		title: 'Traffic',
		section: 1,
		order: 0,
		size: { width: 300, height: 200 }
	},
	{
		id: 'calendar-1',
		type: 'calendar',
		title: 'Calendar',
		section: 1,
		order: 1,
		size: { width: 300, height: 200 }
	},
	{
		id: 'github-projects-1',
		type: 'github-projects',
		title: 'GitHub Projects',
		section: 2,
		order: 0,
		size: { width: 0, height: 500 }
	},
	{
		id: 'github-pull-requests-1',
		type: 'github-pull-requests',
		title: 'GitHub Pull Requests',
		section: 2,
		order: 1,
		size: { width: 0, height: 500 }
	}
];

// Load widgets from localStorage or use defaults
function loadWidgets(): Widget[] {
	if (typeof window === 'undefined') {
		return defaultWidgets;
	}

	// First try to load from layout-specific storage
	const currentSections = loadSections();
	const layoutFingerprint = getLayoutFingerprint(currentSections);
	const layoutWidgets = loadLayoutWidgets();

	if (layoutWidgets[layoutFingerprint]) {
		const parsedWidgets = layoutWidgets[layoutFingerprint];
		if (Array.isArray(parsedWidgets) && parsedWidgets.every(w =>
			w.id && w.type && typeof w.section === 'number' && typeof w.order === 'number' && w.size)) {
			return parsedWidgets;
		}
	}

	// Fall back to legacy storage for migration
	try {
		const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
		if (stored) {
			const parsedWidgets = JSON.parse(stored);
			if (Array.isArray(parsedWidgets) && parsedWidgets.every(w =>
				w.id && w.type && typeof w.section === 'number' && typeof w.order === 'number' && w.size)) {
				// Migrate to new storage format
				layoutWidgets[layoutFingerprint] = parsedWidgets;
				saveLayoutWidgets(layoutWidgets);
				saveCurrentLayout(layoutFingerprint);
				return parsedWidgets;
			}
		}
	} catch (error) {
		console.warn('Failed to load widgets from localStorage:', error);
	}

	return defaultWidgets;
}

// Load sections from localStorage or use defaults
function loadSections(): Section[] {
	if (typeof window === 'undefined') {
		return defaultSections;
	}

	try {
		const stored = localStorage.getItem(SECTIONS_STORAGE_KEY);
		if (stored) {
			const parsedSections = JSON.parse(stored);
			if (Array.isArray(parsedSections)) {
				// Normalize sections to ensure they have all required grid properties
				return parsedSections.map(s => ({
					id: s.id,
					gridColumn: s.gridColumn ?? 1,
					gridColumnSpan: s.gridColumnSpan ?? 1, // Default to 1 if undefined
					gridRow: s.gridRow ?? 1,
					title: s.title
				}));
			}
		}
	} catch (error) {
		console.warn('Failed to load sections from localStorage:', error);
	}

	return defaultSections;
}

// Save widgets to localStorage with layout context
function saveWidgets(widgets: Widget[], sections?: Section[]) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		// Save to layout-specific storage
		const currentSections = sections || loadSections();
		const layoutFingerprint = getLayoutFingerprint(currentSections);
		const layoutWidgets = loadLayoutWidgets();
		layoutWidgets[layoutFingerprint] = widgets;
		saveLayoutWidgets(layoutWidgets);
		saveCurrentLayout(layoutFingerprint);

		// Also save to legacy storage for backwards compatibility
		localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
	} catch (error) {
		console.warn('Failed to save widgets to localStorage:', error);
	}
}

// Save sections to localStorage
function saveSections(sections: Section[]) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
	} catch (error) {
		console.warn('Failed to save sections to localStorage:', error);
	}
}

// Calculate grid rows for sections based on their positions
function calculateSectionRows(sections: Section[]): Section[] {
	// Sort sections by column and existing row
	const sorted = [...sections].sort((a, b) => {
		if (a.gridColumn !== b.gridColumn) return a.gridColumn - b.gridColumn;
		return a.gridRow - b.gridRow;
	});

	// Track occupied cells in the grid
	const grid: boolean[][] = Array(20).fill(null).map(() => Array(3).fill(false));

	return sorted.map(section => {
		// Find the first available row for this section
		let row = 1;
		let found = false;

		while (!found && row < 20) {
			// Check if all columns this section needs are available in this row
			const canPlace = Array(section.gridColumnSpan).fill(0).every((_, i) => {
				const col = section.gridColumn - 1 + i;
				return col < 3 && !grid[row - 1][col];
			});

			if (canPlace) {
				// Mark cells as occupied
				for (let i = 0; i < section.gridColumnSpan; i++) {
					grid[row - 1][section.gridColumn - 1 + i] = true;
				}
				found = true;
			} else {
				row++;
			}
		}

		return { ...section, gridRow: row };
	});
}

// Reorder widgets within a section or move between sections
function reorderWidgets(widgets: Widget[], fromSection: number, fromOrder: number, toSection: number, toOrder: number): Widget[] {
	// Get the widget being moved
	const movedWidget = widgets.find(w => w.section === fromSection && w.order === fromOrder);
	if (!movedWidget) return widgets;

	// Update all widgets
	return widgets.map(widget => {
		if (widget.id === movedWidget.id) {
			// Update the moved widget
			return { ...widget, section: toSection, order: toOrder };
		}

		// Adjust order for widgets in the source section
		if (widget.section === fromSection && widget.order > fromOrder) {
			return { ...widget, order: widget.order - 1 };
		}

		// Adjust order for widgets in the destination section
		if (widget.section === toSection && widget.order >= toOrder && widget.id !== movedWidget.id) {
			return { ...widget, order: widget.order + 1 };
		}

		return widget;
	});
}

function createWidgetStore() {
	const initialWidgets = loadWidgets();
	const { subscribe, set, update } = writable<Widget[]>(initialWidgets);

	return {
		subscribe,
		moveWidget: (widgetId: string, toSection: number, toOrder: number) => {
			update((widgets) => {
				const widget = widgets.find(w => w.id === widgetId);
				if (!widget) return widgets;

				const updatedWidgets = reorderWidgets(widgets, widget.section, widget.order, toSection, toOrder);
				saveWidgets(updatedWidgets);
				return updatedWidgets;
			});
		},
		addWidget: (widget: Widget) => {
			update((widgets) => {
				// Find the next available order in the specified section
				const sectionWidgets = widgets.filter(w => w.section === widget.section);
				const maxOrder = sectionWidgets.length > 0 ? Math.max(...sectionWidgets.map(w => w.order)) : -1;

				const newWidget = {
					...widget,
					order: maxOrder + 1
				};
				const updatedWidgets = [...widgets, newWidget];
				saveWidgets(updatedWidgets);
				return updatedWidgets;
			});
		},
		removeWidget: (id: string) => {
			update((widgets) => {
				const widgetToRemove = widgets.find(w => w.id === id);
				if (!widgetToRemove) return widgets;

				// Remove the widget and reorder remaining widgets in the same section
				const updatedWidgets = widgets
					.filter((widget) => widget.id !== id)
					.map(widget => {
						if (widget.section === widgetToRemove.section && widget.order > widgetToRemove.order) {
							return { ...widget, order: widget.order - 1 };
						}
						return widget;
					});

				saveWidgets(updatedWidgets);
				return updatedWidgets;
			});
		},
		toggleCollapse: (id: string) => {
			update((widgets) => {
				const updatedWidgets = widgets.map((widget) =>
					widget.id === id ? { ...widget, collapsed: !widget.collapsed } : widget
				);
				saveWidgets(updatedWidgets);
				return updatedWidgets;
			});
		},
		updateTitle: (id: string, title: string) => {
			update((widgets) => {
				const updatedWidgets = widgets.map((widget) =>
					widget.id === id ? { ...widget, title } : widget
				);
				saveWidgets(updatedWidgets);
				return updatedWidgets;
			});
		},
		updateWidgetConfig: (id: string, config: any) => {
			update((widgets) => {
				const updatedWidgets = widgets.map((widget) =>
					widget.id === id ? { ...widget, config: { ...widget.config, ...config } } : widget
				);
				saveWidgets(updatedWidgets);
				return updatedWidgets;
			});
		},
		reset: () => {
			set(defaultWidgets);
			saveWidgets(defaultWidgets);
		},
		load: () => {
			const loadedWidgets = loadWidgets();
			set(loadedWidgets);
		}
	};
}

function createSectionStore() {
	const initialSections = loadSections();
	const { subscribe, set, update } = writable<Section[]>(initialSections);

	return {
		subscribe,
		updateSectionGrid: (sectionId: number, gridColumn: number, gridColumnSpan: number) => {
			update((sections) => {
				const updatedSections = sections.map(section =>
					section.id === sectionId ? { ...section, gridColumn, gridColumnSpan } : section
				);
				// Recalculate rows after position changes
				const recalculatedSections = calculateSectionRows(updatedSections);
				saveSections(recalculatedSections);
				return recalculatedSections;
			});
		},
		moveSection: (sectionId: number, newColumn: number) => {
			update((sections) => {
				const updatedSections = sections.map(section =>
					section.id === sectionId ? { ...section, gridColumn: newColumn } : section
				);
				// Recalculate rows after position changes
				const recalculatedSections = calculateSectionRows(updatedSections);
				saveSections(recalculatedSections);
				return recalculatedSections;
			});
		},
		resizeSection: (sectionId: number, newSpan: number) => {
			update((sections) => {
				const section = sections.find(s => s.id === sectionId);
				if (!section) return sections;

				// Ensure span doesn't exceed grid bounds
				const maxSpan = 3 - section.gridColumn + 1;
				const clampedSpan = Math.max(1, Math.min(newSpan, maxSpan));

				const updatedSections = sections.map(s =>
					s.id === sectionId ? { ...s, gridColumnSpan: clampedSpan } : s
				);
				// Recalculate rows after span changes
				const recalculatedSections = calculateSectionRows(updatedSections);
				saveSections(recalculatedSections);
				return recalculatedSections;
			});
		},
		addSection: () => {
			update((sections) => {
				const newSectionId = Math.max(...sections.map(s => s.id), -1) + 1;
				const updatedSections = [
					...sections,
					{ id: newSectionId, gridColumn: 1, gridColumnSpan: 1, gridRow: 1 }
				];
				// Recalculate rows for all sections
				const recalculatedSections = calculateSectionRows(updatedSections);
				saveSections(recalculatedSections);
				return recalculatedSections;
			});
		},
		removeSection: (sectionId: number) => {
			update((sections) => {
				if (sections.length <= 1) return sections; // Don't allow removing the last section

				const updatedSections = sections.filter(section => section.id !== sectionId);
				// Recalculate rows after removal
				const recalculatedSections = calculateSectionRows(updatedSections);
				saveSections(recalculatedSections);
				return recalculatedSections;
			});
		},
		applyLayout: (layoutSections: Omit<Section, 'id'>[]) => {
			let newSections: Section[];

			update(() => {
				// Create new sections with sequential IDs
				newSections = layoutSections.map((section, index) => ({
					id: index,
					gridColumn: section.gridColumn,
					gridColumnSpan: section.gridColumnSpan,
					gridRow: section.gridRow,
					title: section.title
				}));
				saveSections(newSections);
				return newSections;
			});

			// Check if we have saved widget positions for this layout
			widgets.update((currentWidgets) => {
				const layoutFingerprint = getLayoutFingerprint(newSections);
				const layoutWidgets = loadLayoutWidgets();

				// If we have saved positions for this layout, use them
				if (layoutWidgets[layoutFingerprint]) {
					const savedWidgets = layoutWidgets[layoutFingerprint];

					// Ensure all current widgets are present (in case new widgets were added)
					const savedWidgetIds = new Set(savedWidgets.map(w => w.id));
					const newWidgets = currentWidgets.filter(w => !savedWidgetIds.has(w.id));

					if (newWidgets.length > 0) {
						// Distribute new widgets using sane defaults
						const distributedNewWidgets = generateDefaultWidgetPositions(newWidgets, newSections);
						const combined = [...savedWidgets, ...distributedNewWidgets];
						saveWidgets(combined, newSections);
						return combined;
					}

					// All widgets accounted for, use saved positions
					saveCurrentLayout(layoutFingerprint);
					return savedWidgets;
				}

				// No saved positions for this layout, generate sane defaults
				const updatedWidgets = generateDefaultWidgetPositions(currentWidgets, newSections);
				saveWidgets(updatedWidgets, newSections);
				return updatedWidgets;
			});
		},
		reset: () => {
			set(defaultSections);
			saveSections(defaultSections);
		},
		load: () => {
			const loadedSections = loadSections();
			set(loadedSections);
		}
	};
}

export const widgets = createWidgetStore();
export const sections = createSectionStore();
