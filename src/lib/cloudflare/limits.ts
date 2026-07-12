/**
 * Cloudflare plan-limit engine.
 *
 * Single source of truth for the free/paid quotas the widget meters usage
 * against, plus the run-rate projection math that answers "am I going to hit
 * this limit, and when?". Framework-free so both the server (Overview rollup)
 * and the Svelte component can import it.
 *
 * Free-tier limits verified against Cloudflare docs (July 2026):
 *   Workers  100k requests/day, 10ms CPU/request
 *   KV       100k reads/day, 1k writes/day, 1k deletes/day, 1k lists/day, 1 GB
 *   D1       5M rows read/day, 100k rows written/day, 5 GB
 *   R2       1M Class-A ops/mo, 10M Class-B ops/mo, 10 GB-month
 *   Pages    500 builds/mo
 * Cloudflare bills storage in decimal GB (1 GB = 1e9 bytes).
 */

export type MeterWindow = 'day' | 'month' | 'storage';
export type MeterTone = 'ok' | 'warn' | 'crit';
export type MeterUnit = 'count' | 'bytes';
export type PlanTier = 'free' | 'paid';

export interface LimitDef {
	limit: number;
	window: MeterWindow;
	unit: MeterUnit;
	/** Short human label for the metric, e.g. "Writes / day". */
	label: string;
}

/** Per-product, per-metric free-tier limits. */
export const FREE_LIMITS = {
	workers: {
		requests: { limit: 100_000, window: 'day', unit: 'count', label: 'Requests / day' }
	},
	kv: {
		read: { limit: 100_000, window: 'day', unit: 'count', label: 'Reads / day' },
		write: { limit: 1_000, window: 'day', unit: 'count', label: 'Writes / day' },
		delete: { limit: 1_000, window: 'day', unit: 'count', label: 'Deletes / day' },
		list: { limit: 1_000, window: 'day', unit: 'count', label: 'Lists / day' },
		storage: { limit: 1e9, window: 'storage', unit: 'bytes', label: 'Stored' }
	},
	d1: {
		rowsRead: { limit: 5_000_000, window: 'day', unit: 'count', label: 'Rows read / day' },
		rowsWritten: { limit: 100_000, window: 'day', unit: 'count', label: 'Rows written / day' },
		storage: { limit: 5e9, window: 'storage', unit: 'bytes', label: 'Stored' }
	},
	r2: {
		classA: { limit: 1_000_000, window: 'month', unit: 'count', label: 'Class A ops / mo' },
		classB: { limit: 10_000_000, window: 'month', unit: 'count', label: 'Class B ops / mo' },
		storage: { limit: 10e9, window: 'storage', unit: 'bytes', label: 'Stored' }
	},
	pages: {
		builds: { limit: 500, window: 'month', unit: 'count', label: 'Builds / mo' }
	}
} as const satisfies Record<string, Record<string, LimitDef>>;

/**
 * Paid-tier ("Workers Paid", $5/mo) *included* allowances — usage beyond these
 * is billed rather than blocked, so the meter reads "included usage" and the
 * projection warns about overage rather than an outage. Only the deltas that
 * differ from free are listed; the widget defaults to free everywhere.
 */
export const PAID_LIMITS = {
	workers: {
		requests: { limit: 10_000_000, window: 'month', unit: 'count', label: 'Requests / mo (incl.)' }
	},
	kv: {
		read: { limit: 10_000_000, window: 'month', unit: 'count', label: 'Reads / mo (incl.)' },
		write: { limit: 1_000_000, window: 'month', unit: 'count', label: 'Writes / mo (incl.)' },
		delete: { limit: 1_000_000, window: 'month', unit: 'count', label: 'Deletes / mo (incl.)' },
		list: { limit: 1_000_000, window: 'month', unit: 'count', label: 'Lists / mo (incl.)' },
		storage: { limit: 1e9, window: 'storage', unit: 'bytes', label: 'Stored (incl.)' }
	},
	d1: {
		rowsRead: { limit: 25_000_000_000, window: 'month', unit: 'count', label: 'Rows read / mo (incl.)' },
		rowsWritten: { limit: 50_000_000, window: 'month', unit: 'count', label: 'Rows written / mo (incl.)' },
		storage: { limit: 5e9, window: 'storage', unit: 'bytes', label: 'Stored (incl.)' }
	},
	r2: {
		classA: { limit: 1_000_000, window: 'month', unit: 'count', label: 'Class A ops / mo (incl.)' },
		classB: { limit: 10_000_000, window: 'month', unit: 'count', label: 'Class B ops / mo (incl.)' },
		storage: { limit: 10e9, window: 'storage', unit: 'bytes', label: 'Stored (incl.)' }
	},
	pages: {
		builds: { limit: 5_000, window: 'month', unit: 'count', label: 'Builds / mo (incl.)' }
	}
} as const satisfies Record<string, Record<string, LimitDef>>;

/** Per-request CPU ceiling on the free plan (ms). Paid raises the cap to 30s. */
export const WORKERS_CPU_MS_FREE = 10;
export const WORKERS_CPU_MS_PAID = 30_000;

export function limitsFor(tier: PlanTier): Record<string, Record<string, LimitDef>> {
	return (tier === 'paid' ? PAID_LIMITS : FREE_LIMITS) as unknown as Record<string, Record<string, LimitDef>>;
}

// ─── Meter computation ────────────────────────────────────────────

export interface Meter {
	used: number;
	limit: number;
	window: MeterWindow;
	unit: MeterUnit;
	/** Current usage as a % of the limit (may exceed 100). */
	pct: number;
	/** Projected end-of-window usage (null for storage — no time component). */
	projected: number | null;
	/** Projected usage as % of limit (null for storage). */
	projectedPct: number | null;
	/** True when current or projected usage crosses the limit this window. */
	willExceed: boolean;
	/** Worst-case tone across current + projected usage. */
	tone: MeterTone;
	/**
	 * Short human ETA for when the limit is (or was) reached, e.g.
	 * "16:20 UTC", "Jul 28", "reached". Null when the window won't be exceeded.
	 */
	etaLabel: string | null;
}

function toneForPct(pct: number): MeterTone {
	if (pct >= 90) return 'crit';
	if (pct >= 70) return 'warn';
	return 'ok';
}

/** UTC [start, end) bounds for the window containing `now`. */
function windowBounds(window: MeterWindow, now: number): { start: number; end: number } | null {
	const d = new Date(now);
	if (window === 'day') {
		const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
		return { start, end: start + 24 * 60 * 60 * 1000 };
	}
	if (window === 'month') {
		const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
		const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
		return { start, end };
	}
	return null; // storage: no time window
}

function formatEta(window: MeterWindow, hitMs: number, now: number): string {
	const d = new Date(hitMs);
	if (window === 'day') {
		const hh = String(d.getUTCHours()).padStart(2, '0');
		const mm = String(d.getUTCMinutes()).padStart(2, '0');
		// Distinguish "later today" from a spill into tomorrow.
		const sameDay = new Date(now).getUTCDate() === d.getUTCDate();
		return sameDay ? `${hh}:${mm} UTC` : `tomorrow ${hh}:${mm} UTC`;
	}
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * Turn a raw usage number into a meter with run-rate projection.
 *
 * `used` must be the usage *within the current window* (today's total for a
 * daily limit, this month's total for a monthly limit, or the current snapshot
 * for storage) — not a multi-day rollup.
 */
export function computeMeter(input: {
	used: number;
	limit: number;
	window: MeterWindow;
	unit?: MeterUnit;
	now?: number;
}): Meter {
	const { used, limit, window } = input;
	const unit = input.unit ?? 'count';
	const now = input.now ?? Date.now();
	const pct = limit > 0 ? (used / limit) * 100 : 0;

	// Storage: no projection, tone from current fill only.
	if (window === 'storage') {
		return {
			used,
			limit,
			window,
			unit,
			pct,
			projected: null,
			projectedPct: null,
			willExceed: used >= limit,
			tone: toneForPct(pct),
			etaLabel: used >= limit ? 'over' : null
		};
	}

	const bounds = windowBounds(window, now);
	let projected: number | null = null;
	let projectedPct: number | null = null;
	let willExceed = used >= limit;
	let etaLabel: string | null = used >= limit ? 'reached' : null;

	if (bounds) {
		const elapsed = Math.max(1, now - bounds.start); // avoid /0 at window start
		const total = bounds.end - bounds.start;
		const fraction = Math.min(1, elapsed / total);
		projected = fraction > 0 ? used / fraction : used;
		projectedPct = limit > 0 ? (projected / limit) * 100 : 0;

		if (used < limit) {
			const ratePerMs = used / elapsed;
			if (ratePerMs > 0) {
				const hitMs = now + (limit - used) / ratePerMs;
				if (hitMs < bounds.end) {
					willExceed = true;
					etaLabel = formatEta(window, hitMs, now);
				}
			}
		}
	}

	const tone = toneForPct(Math.max(pct, projectedPct ?? 0));
	return { used, limit, window, unit, pct, projected, projectedPct, willExceed, tone, etaLabel };
}

/** Convenience: build a meter straight from a limit registry entry. */
export function meterFromDef(def: LimitDef, used: number, now?: number): Meter {
	return computeMeter({ used, limit: def.limit, window: def.window, unit: def.unit, now });
}
