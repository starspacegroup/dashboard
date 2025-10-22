export interface Widget {
	id: string;
	type: 'weather' | 'traffic' | 'calendar' | 'github';
	title: string;
	position: {
		x: number;
		y: number;
	};
	size: {
		width: number;
		height: number;
	};
}

export interface DragState {
	isDragging: boolean;
	widgetId: string | null;
	startX: number;
	startY: number;
	offsetX: number;
	offsetY: number;
}
