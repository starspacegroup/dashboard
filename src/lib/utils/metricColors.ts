/**
 * One colour per *data type*, shared by every analytics widget.
 *
 * The rule this enforces: **colour follows the entity, never its rank.** Before
 * this, each widget picked colours by position — Google Analytics did
 * `CHART_COLORS[idx % 5]`, so "Sessions" was purple when it was the first metric
 * and green when it was the second, and dropping a metric repainted every
 * survivor. Cloudflare painted every series brand orange, Copilot hard-coded
 * status colours per series. Nothing lined up across widgets.
 *
 * Now a data type owns a slot for the life of the dashboard: "page views" is the
 * same colour in the GA widget and the Cloudflare widget, and stays that colour
 * whatever else is on the chart.
 *
 * ## The palette
 *
 * Eight categorical hues in a fixed order, per-mode steps, validated with the
 * `dataviz` skill's checker against this app's own surfaces (`--surface`:
 * #ffffff light, #171717 dark). Both modes pass the lightness band, chroma
 * floor, adjacent-pair CVD separation (protan/deutan, Machado 2009) and the
 * normal-vision floor. Slots 3/4/5 sit under 3:1 on the light surface, which the
 * checker allows only with a relief channel — every chart here ships a legend,
 * labelled tooltip rows and value cards, so identity is never colour-alone.
 *
 * Do not add a ninth hue or nudge a step by eye. To change the palette, re-run
 * `scripts/validate_palette.js` from the dataviz skill for BOTH modes first.
 *
 * ## Which slot gets which data type
 *
 * With eight hues, only four can be mutually distinguishable at once (all-pairs
 * separation caps out there — measured, not guessed). So the four data types
 * most often charted together — visits, users, views, new users — are seated on
 * slots 1/6/5/4, which are pairwise safe in both modes, as are the fixed
 * two-series pairs in the Copilot widget (users↔engagement, visits↔conversions).
 * Rarer combinations can land on a softer pair; that is what the legend is for.
 */

/** Palette slot. Fixed order — the order is the CVD-safety mechanism. */
export type SeriesSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * The data types analytics widgets actually chart. Two widgets showing the same
 * data type must use the same member here, not a new one.
 */
export type DataType =
	| 'visits'
	| 'weight'
	| 'conversions'
	| 'new-users'
	| 'views'
	| 'users'
	| 'engagement'
	| 'problems';

/**
 * Data type → palette slot. Seating is deliberate (see the header): the common
 * four are pairwise safe, and `weight` takes the most constrained slot because
 * it only ever appears alone (Cloudflare charts one metric at a time).
 */
export const DATA_TYPE_SLOT: Record<DataType, SeriesSlot> = {
	/** Visits and hits: GA sessions, Cloudflare requests, Copilot suggestions. */
	visits: 1,
	/** How heavy a visit is: bytes moved, time spent. */
	weight: 2,
	/** The good outcome: GA conversions, Copilot accepted suggestions. */
	conversions: 3,
	/** First-time people. */
	'new-users': 4,
	/** Page views. */
	views: 5,
	/** People. */
	users: 6,
	/** Depth of interaction: engagement rate, engaged users, events per session. */
	engagement: 7,
	/** Things going wrong: bounces, threats, errors. */
	problems: 8
};

/**
 * Metric identifiers → data type, keyed on a normalised form so a widget can
 * look up by API id (`screenPageViews`), by column key (`pageViews`) or by the
 * label it shows the user (`Page Views`) and land in the same place.
 */
const METRIC_DATA_TYPES: Record<string, DataType> = {
	// Visits / hits
	sessions: 'visits',
	sessionsperuser: 'visits',
	requests: 'visits',
	suggestions: 'visits',
	// Weight of a visit
	averagesessionduration: 'weight',
	avgsessionduration: 'weight',
	duration: 'weight',
	bytes: 'weight',
	bandwidth: 'weight',
	// Good outcomes
	conversions: 'conversions',
	acceptances: 'conversions',
	// New people
	newusers: 'new-users',
	// Views
	screenpageviews: 'views',
	pageviews: 'views',
	views: 'views',
	// People
	totalusers: 'users',
	activeusers: 'users',
	users: 'users',
	visitors: 'users',
	// Engagement
	engagementrate: 'engagement',
	engagedusers: 'engagement',
	eventspersession: 'engagement',
	events: 'engagement',
	// Problems
	bouncerate: 'problems',
	threats: 'problems',
	errors: 'problems'
};

/** Lowercase, strip anything that isn't a letter or digit. */
function normalize(id: string): string {
	return id.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** The data type a metric belongs to, or `null` if it isn't a known one. */
export function metricDataType(metricId: string): DataType | null {
	return METRIC_DATA_TYPES[normalize(metricId)] ?? null;
}

/** The CSS colour for a palette slot. Theme-aware — resolves per light/dark. */
export function slotColor(slot: SeriesSlot): string {
	return `var(--series-${slot})`;
}

/** The CSS colour for a data type. */
export function dataTypeColor(type: DataType): string {
	return slotColor(DATA_TYPE_SLOT[type]);
}

/**
 * The colour for a metric, by identity.
 *
 * An unknown metric falls back to a hash of its id rather than its position, so
 * a metric the registry hasn't learned yet still keeps one stable colour instead
 * of changing every time the selection does. When you add a metric to a widget,
 * add it to `METRIC_DATA_TYPES` too — the hash is a safety net, not the design.
 */
export function metricColor(metricId: string): string {
	const type = metricDataType(metricId);
	if (type) return dataTypeColor(type);

	const key = normalize(metricId);
	let hash = 0;
	for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
	return slotColor(((hash % 8) + 1) as SeriesSlot);
}
