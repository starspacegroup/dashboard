/**
 * Global Moon Phase Store
 *
 * Computes accurate moon phase data once and shares it across all widgets.
 * Uses an improved Jean Meeus algorithm with 11 longitude perturbation terms,
 * 4 latitude terms, and 4 distance terms for sub-degree accuracy in the
 * Moon's ecliptic position.
 *
 * Reference: Jean Meeus, "Astronomical Algorithms" 2nd ed., Chapters 47-49
 */
import { readable } from 'svelte/store';
import { browser } from '$app/environment';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoonPhaseData {
  /** Cycle position 0–1 (0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter) */
  phase: number;
  /** Illumination fraction 0–1 */
  fraction: number;
  /** Position angle of the Moon's bright limb (radians) */
  angle: number;
  /** Human-readable phase name */
  phaseName: string;
  /** Illumination as an integer percentage 0–100 */
  illuminationPercent: number;
  /** SVG path for the shadow overlay in a 100×100 viewBox (empty string = no shadow) */
  shadowPath: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;

/** Store updates once per hour — moon phase changes negligibly in that time */
const MOON_UPDATE_INTERVAL = 60 * 60 * 1000;

// ─── Julian-date helpers ──────────────────────────────────────────────────────

function toJulian(date: Date): number {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}

function toDays(date: Date): number {
  return toJulian(date) - J2000;
}

// ─── Sun coordinates ──────────────────────────────────────────────────────────

interface SunCoords {
  dec: number;
  ra: number;
  /** Sun's mean anomaly — needed for Moon perturbations */
  M: number;
}

/**
 * Compute the Sun's equatorial coordinates for a given number of days since J2000.
 * Uses the standard Meeus low-precision solar model.
 */
function getSunCoords(d: number): SunCoords {
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C =
    RAD *
    (1.9148 * Math.sin(M) +
      0.02 * Math.sin(2 * M) +
      0.0003 * Math.sin(3 * M));
  const L = RAD * (280.46646 + 0.98564736 * d) + C;

  return {
    dec: Math.asin(Math.sin(L) * Math.sin(RAD * 23.4397)),
    ra: Math.atan2(Math.sin(L) * Math.cos(RAD * 23.4397), Math.cos(L)),
    M
  };
}

// ─── Moon coordinates (improved with Meeus perturbation terms) ────────────────

interface MoonCoords {
  dec: number;
  ra: number;
  dist: number;
}

/**
 * Compute the Moon's equatorial coordinates using the major perturbation terms
 * from Meeus' Astronomical Algorithms, Table 47.A.
 *
 * @param d   Days since J2000.0
 * @param sunM Sun's mean anomaly (radians) — used by the annual equation and
 *             other Sun-dependent perturbation terms
 */
function getMoonCoords(d: number, sunM: number): MoonCoords {
  // Fundamental arguments (Meeus Ch. 47)
  const Lp = RAD * (218.3165 + 13.176396 * d); // Mean longitude
  const Mp = RAD * (134.9634 + 13.064993 * d); // Mean anomaly
  const F = RAD * (93.2721 + 13.22935 * d); // Argument of latitude
  const D = RAD * (297.8502 + 12.190749 * d); // Mean elongation

  // ── Ecliptic longitude — 11 perturbation terms ──────────────────────────
  const l =
    Lp +
    RAD * 6.2888 * Math.sin(Mp) + // principal term
    RAD * 1.274 * Math.sin(2 * D - Mp) + // evection
    RAD * 0.6583 * Math.sin(2 * D) + // variation
    RAD * 0.2136 * Math.sin(2 * Mp) +
    -RAD * 0.1856 * Math.sin(sunM) + // annual equation
    -RAD * 0.1143 * Math.sin(2 * F) +
    RAD * 0.0588 * Math.sin(2 * D - 2 * Mp) +
    RAD * 0.0572 * Math.sin(2 * D - sunM - Mp) +
    RAD * 0.0533 * Math.sin(2 * D + Mp) +
    RAD * 0.0459 * Math.sin(2 * D - sunM) +
    -RAD * 0.041 * Math.sin(sunM - Mp);

  // ── Ecliptic latitude — 4 perturbation terms ────────────────────────────
  const b =
    RAD * 5.128 * Math.sin(F) +
    RAD * 0.2806 * Math.sin(Mp + F) +
    RAD * 0.2777 * Math.sin(Mp - F) +
    RAD * 0.1732 * Math.sin(2 * D - F);

  // ── Distance (km) — 4 perturbation terms ────────────────────────────────
  const dt =
    385001 -
    20905 * Math.cos(Mp) -
    3699 * Math.cos(2 * D - Mp) -
    2956 * Math.cos(2 * D) +
    570 * Math.cos(2 * Mp);

  // Equatorial coordinates from ecliptic
  const sinL = Math.sin(l);
  const cosL = Math.cos(l);
  const sinB = Math.sin(b);
  const cosB = Math.cos(b);
  const sinE = Math.sin(RAD * 23.4397);
  const cosE = Math.cos(RAD * 23.4397);

  return {
    dec: Math.asin(sinB * cosE + cosB * sinE * sinL),
    ra: Math.atan2(sinL * cosE - Math.tan(b) * sinE, cosL),
    dist: dt
  };
}

// ─── Phase computation ────────────────────────────────────────────────────────

/**
 * Compute full moon-phase data for a given date.
 *
 * Exported so that the WeatherWidget can call it for its "time travel"
 * debug feature while the global store handles the normal (current-time) case.
 */
export function computeMoonPhase(date: Date): MoonPhaseData {
  const d = toDays(date);
  const sun = getSunCoords(d);
  const moon = getMoonCoords(d, sun.M);

  const EARTH_SUN_KM = 149598000;

  // Geocentric elongation (angular separation between Sun and Moon)
  const phi = Math.acos(
    Math.sin(sun.dec) * Math.sin(moon.dec) +
    Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra)
  );

  // Phase angle (angle at Moon between Sun and Earth)
  const inc = Math.atan2(
    EARTH_SUN_KM * Math.sin(phi),
    moon.dist - EARTH_SUN_KM * Math.cos(phi)
  );

  // Position angle of the bright limb
  const angle = Math.atan2(
    Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra),
    Math.sin(sun.dec) * Math.cos(moon.dec) -
    Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra)
  );

  const fraction = (1 + Math.cos(inc)) / 2;
  const phase = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI;

  return {
    phase,
    fraction,
    angle,
    phaseName: getPhaseName(phase),
    illuminationPercent: Math.round(fraction * 100),
    shadowPath: buildShadowPath(phase, fraction)
  };
}

// ─── Phase-name mapping ───────────────────────────────────────────────────────

/**
 * Map a phase value (0–1) to a human-readable name.
 * Boundaries use generous ±2.5 % tolerance for the exact-quarter events
 * so that they display correctly even with minor computational offsets.
 */
export function getPhaseName(phase: number): string {
  if (phase < 0.025 || phase >= 0.975) return 'New Moon';
  if (phase < 0.235) return 'Waxing Crescent';
  if (phase < 0.265) return 'First Quarter';
  if (phase < 0.485) return 'Waxing Gibbous';
  if (phase < 0.515) return 'Full Moon';
  if (phase < 0.735) return 'Waning Gibbous';
  if (phase < 0.765) return 'Last Quarter';
  if (phase < 0.975) return 'Waning Crescent';
  return 'New Moon';
}

// ─── SVG shadow path ──────────────────────────────────────────────────────────

/**
 * Build an SVG path that represents the shadowed area of the Moon.
 *
 * The path is designed for a 100×100 viewBox with the Moon as a circle of
 * radius 50 centred at (50, 50).  It uses the standard Northern-hemisphere
 * convention where the right limb lights up first during waxing.
 *
 * @param phase    0–1 cycle position
 * @param fraction 0–1 illumination fraction
 */
export function buildShadowPath(phase: number, fraction: number): string {
  const R = 50;
  const CX = 50;
  const CY = 50;

  // Fully dark (new moon)
  if (fraction < 0.01) {
    return `M ${CX - R},${CY} A ${R},${R} 0 1,1 ${CX - R},${CY + 0.01} Z`;
  }
  // No shadow (full moon)
  if (fraction > 0.99) {
    return '';
  }

  // The terminator projected onto the disk is an ellipse whose x-radius
  // equals  |2 × fraction − 1| × R  (0 at quarter, R at new/full).
  const tRx = Math.abs(2 * fraction - 1) * R;
  const waxing = phase < 0.5;

  if (waxing) {
    // Shadow on the LEFT, illuminated crescent/gibbous on the RIGHT
    if (fraction < 0.5) {
      // Waxing crescent — shadow covers more than half
      // Arc1: LEFT semicircle (outer), Arc2: RIGHT semi-ellipse (terminator) → large shadow
      return `M ${CX},${CY - R} A ${R},${R} 0 0,0 ${CX},${CY + R} A ${tRx},${R} 0 0,0 ${CX},${CY - R} Z`;
    }
    // Waxing gibbous — shadow covers less than half
    // Arc1: LEFT semicircle (outer), Arc2: LEFT semi-ellipse (terminator) → thin shadow
    return `M ${CX},${CY - R} A ${R},${R} 0 0,0 ${CX},${CY + R} A ${tRx},${R} 0 0,1 ${CX},${CY - R} Z`;
  }

  // Shadow on the RIGHT, illuminated crescent/gibbous on the LEFT
  if (fraction < 0.5) {
    // Waning crescent — shadow covers more than half
    return `M ${CX},${CY - R} A ${R},${R} 0 0,1 ${CX},${CY + R} A ${tRx},${R} 0 0,1 ${CX},${CY - R} Z`;
  }
  // Waning gibbous — shadow covers less than half
  return `M ${CX},${CY - R} A ${R},${R} 0 0,1 ${CX},${CY + R} A ${tRx},${R} 0 0,0 ${CX},${CY - R} Z`;
}

// ─── Global readable store ────────────────────────────────────────────────────

/**
 * A readable store that holds the current moon-phase data.
 *
 * - Computed once at module-load time (works for SSR).
 * - On the client it recomputes immediately on first subscription,
 *   then refreshes every hour.
 */
export const moonPhase = readable<MoonPhaseData>(
  computeMoonPhase(new Date()),
  (set) => {
    if (!browser) return;

    // Recompute immediately so client-side hydration gets fresh data
    set(computeMoonPhase(new Date()));

    const interval = setInterval(() => {
      set(computeMoonPhase(new Date()));
    }, MOON_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }
);
