/**
 * Scroll a widget into view and flash it so the user can see where it is.
 * Used by the first-time-setup flow when a widget is added: widgets with
 * settings reveal after their setup closes; widgets without reveal right
 * after they mount. Targets the `data-widget-id` attribute rendered by
 * ColumnLayout; the flash animation lives in app.css (.widget-flash).
 */
export function revealWidget(widgetId: string, delay = 0) {
	if (typeof window === 'undefined') return;
	setTimeout(() => {
		const el = document.querySelector(`[data-widget-id="${CSS.escape(widgetId)}"]`);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		el.classList.add('widget-flash');
		setTimeout(() => el.classList.remove('widget-flash'), 2600);
	}, delay);
}
