export interface Widget {
	id: string;
	type: 'weather' | 'traffic' | 'calendar' | 'github' | 'organization-projects' | 'github-projects' | 'github-pull-requests' | 'data-table' | 'copilot-usage' | 'crypto';
	title: string;
	section: number; // Which section this widget belongs to
	order: number; // Order within the section
	size: {
		width: number;
		height: number;
	};
	collapsed?: boolean;
	config?: WidgetConfig; // Widget-specific configuration
}

export interface WidgetConfig {
	location?: {
		name: string;
		state: string;
		country: string;
		lat: number;
		lon: number;
		displayName: string;
		timezone?: string; // IANA timezone string (e.g., "America/New_York")
		timezoneOffset?: number; // Offset from UTC in seconds
	};
	temperatureUnit?: 'celsius' | 'fahrenheit';
	crypto?: {
		coinId: string; // CoinGecko coin ID (e.g., 'bitcoin')
		vsCurrency: string; // Target currency (e.g., 'usd')
		days: number; // Chart timeframe in days (1, 7, 30, 90, 365)
	};
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
