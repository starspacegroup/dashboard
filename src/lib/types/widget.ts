export interface Widget {
	id: string;
	type: 'weather' | 'traffic' | 'calendar' | 'github' | 'organization-projects' | 'github-projects' | 'spotify';
	title: string;
	section: number; // Which section this widget belongs to
	order: number; // Order within the section
	size: {
		width: number;
		height: number;
	};
	collapsed?: boolean;
}

export interface Section {
	id: number;
	gridColumn: number; // Starting column (1-based)
	gridColumnSpan: number; // Number of columns to span (1-3)
	gridRow: number; // Starting row (1-based, auto-calculated)
	title?: string; // Optional section title
}

export interface DragState {
	isDragging: boolean;
	widgetId: string | null;
	startX: number;
	startY: number;
	offsetX: number;
	offsetY: number;
}
