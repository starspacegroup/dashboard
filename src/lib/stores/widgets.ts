import { writable } from 'svelte/store';
import type { Widget } from '$lib/types/widget';

const defaultWidgets: Widget[] = [
	{
		id: 'weather-1',
		type: 'weather',
		title: 'Weather',
		position: { x: 20, y: 20 },
		size: { width: 300, height: 200 }
	},
	{
		id: 'traffic-1',
		type: 'traffic',
		title: 'Traffic',
		position: { x: 340, y: 20 },
		size: { width: 300, height: 200 }
	},
	{
		id: 'calendar-1',
		type: 'calendar',
		title: 'Calendar',
		position: { x: 20, y: 240 },
		size: { width: 300, height: 200 }
	}
];

function createWidgetStore() {
	const { subscribe, set, update } = writable<Widget[]>(defaultWidgets);

	return {
		subscribe,
		updatePosition: (id: string, position: { x: number; y: number }) => {
			update((widgets) =>
				widgets.map((widget) => (widget.id === id ? { ...widget, position } : widget))
			);
		},
		addWidget: (widget: Widget) => {
			update((widgets) => [...widgets, widget]);
		},
		removeWidget: (id: string) => {
			update((widgets) => widgets.filter((widget) => widget.id !== id));
		},
		reset: () => set(defaultWidgets)
	};
}

export const widgets = createWidgetStore();
