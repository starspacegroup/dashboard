import { browser } from '$app/environment';

export interface SavedLocation {
	name: string;
	state: string;
	country: string;
	lat: number;
	lon: number;
	displayName: string;
}

const LOCATION_KEY = 'dashboard-location';
// Marks a location we resolved from GPS ourselves, as opposed to a place the
// user picked in Settings. Only the former may be silently overwritten.
const CURRENT_LOCATION_NAME = 'Current location';
// Below this coordinate delta (~1.1 km) a new fix counts as "same place", so we
// skip persisting it — avoids a KV write + re-render on GPS jitter / every load.
const MOVE_THRESHOLD_DEG = 0.01;

/**
 * Location + geolocation helpers shared by the Weather and Traffic widgets.
 *
 * Design goal: show the user's *live* location without re-prompting for
 * permission on every page load. We can't make a grant persist — on iOS
 * (all-WebKit) the browser re-asks after a reload and there's no web API to
 * stop it — so the rule is: **never call `getCurrentPosition()` automatically
 * unless the permission is already `granted`.** A load can then silently
 * refresh a live fix where the platform allows it, and everywhere else we fall
 * back to the last cached location. An actual prompt only happens from a
 * deliberate user gesture (`requestAndSaveLocation`, e.g. a Settings button).
 */

export function getSavedLocation(): SavedLocation | null {
	if (!browser) return null;
	const raw = localStorage.getItem(LOCATION_KEY);
	if (!raw) return null;
	try {
		const loc = JSON.parse(raw);
		if (typeof loc?.lat === 'number' && typeof loc?.lon === 'number') return loc as SavedLocation;
	} catch {
		/* unparseable — treat as no saved location */
	}
	return null;
}

/**
 * Persist resolved coordinates as the global dashboard location and notify
 * widgets + the sync engine. No-ops (returns false) when the fix is within
 * MOVE_THRESHOLD of the saved one, so a live refresh doesn't rewrite KV or
 * re-render on every reload when the user hasn't meaningfully moved.
 */
export function saveResolvedCoords(lat: number, lon: number, force = false): boolean {
	if (!browser) return false;
	const prev = getSavedLocation();
	// A city the user deliberately picked outranks an automatic live fix — only
	// overwrite our own 'Current location' entries. `force` is for the explicit
	// "use my current location" tap, which is entitled to replace a chosen city.
	if (!force && prev && prev.name !== CURRENT_LOCATION_NAME) return false;
	if (
		prev &&
		Math.abs(prev.lat - lat) < MOVE_THRESHOLD_DEG &&
		Math.abs(prev.lon - lon) < MOVE_THRESHOLD_DEG
	) {
		return false; // essentially unchanged — don't churn
	}
	const location: SavedLocation = {
		name: CURRENT_LOCATION_NAME,
		state: '',
		country: '',
		lat,
		lon,
		displayName: CURRENT_LOCATION_NAME
	};
	localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
	window.dispatchEvent(new CustomEvent('location-changed', { detail: location }));
	window.dispatchEvent(new CustomEvent('dashboard-state-changed'));
	return true;
}

export type GeoPermission = 'granted' | 'prompt' | 'denied' | 'unsupported';

/** Best-effort permission state. 'unsupported' when the Permissions API is
 *  unavailable or throws (notably flaky on iOS WebKit). */
export async function geolocationPermission(): Promise<GeoPermission> {
	if (!browser || !navigator.permissions?.query) return 'unsupported';
	try {
		const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
		return res.state as GeoPermission;
	} catch {
		return 'unsupported';
	}
}

/**
 * Get the current position WITHOUT ever showing a prompt: only calls the API
 * when permission is already `granted`. Safe to call automatically on load to
 * refresh a live fix — it silently resolves `null` when a prompt would be
 * required (or on error/timeout), so the caller falls back to the cache.
 */
export async function getPositionIfGranted(
	options: PositionOptions = { timeout: 10000, maximumAge: 300000 }
): Promise<GeolocationPosition | null> {
	if (!browser || !navigator.geolocation) return null;
	if ((await geolocationPermission()) !== 'granted') return null;
	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), options);
	});
}

/**
 * Deliberate, user-gesture location request. MAY prompt — that's expected,
 * because a tap initiated it. On success it persists the fix (so subsequent
 * loads reuse it) and returns the saved location; resolves `null` on
 * denial/error.
 */
export async function requestAndSaveLocation(
	options: PositionOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
): Promise<SavedLocation | null> {
	if (!browser || !navigator.geolocation) return null;
	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				saveResolvedCoords(pos.coords.latitude, pos.coords.longitude, true);
				resolve(getSavedLocation());
			},
			() => resolve(null),
			options
		);
	});
}
