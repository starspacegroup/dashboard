import { writable } from 'svelte/store';
import type { Widget, Section } from '$lib/types/widget';

const WIDGETS_STORAGE_KEY = 'dashboard-widgets';
const SECTIONS_STORAGE_KEY = 'dashboard-sections';

// Global drag state
export const isDraggingAny = writable(false);

// Default sections - grid-based layout
const defaultSections: Section[] = [
	{ id: 0, gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
	{ id: 1, gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
	{ id: 2, gridColumn: 3, gridColumnSpan: 1, gridRow: 1 }
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
	}
];

// Load widgets from localStorage or use defaults
function loadWidgets(): Widget[] {
	if (typeof window === 'undefined') {
		return defaultWidgets;
	}

	try {
		const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
		if (stored) {
			const parsedWidgets = JSON.parse(stored);
			// Validate that stored widgets have required properties
			if (Array.isArray(parsedWidgets) && parsedWidgets.every(w =>
				w.id && w.type && typeof w.section === 'number' && typeof w.order === 'number' && w.size)) {
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

// Save widgets to localStorage
function saveWidgets(widgets: Widget[]) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
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
