import { describe, expect, it, vi } from 'vitest';

import { GET } from './+server';

function event(query: string) {
	return {
		locals: { auth: vi.fn(async () => ({ user: { login: 'alice' } })) },
		url: new URL(`https://dashboard.test/api/weather?${query}`)
	} as never;
}

describe('/api/weather', () => {
	it('rejects a latitude sent without a longitude', async () => {
		const res = await GET(event('lat=44.1'));
		expect(res.status).toBe(400);
	});

	it('rejects a longitude sent without a latitude', async () => {
		const res = await GET(event('lon=-70.2'));
		expect(res.status).toBe(400);
	});

	it('rejects out-of-range coordinates', async () => {
		const res = await GET(event('lat=91&lon=0'));
		expect(res.status).toBe(400);
	});

	it('cuts a long zip to 100 characters before it goes upstream', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [] })));
		vi.stubGlobal('fetch', fetchMock);
		try {
			const res = await GET(event(`zip=${'9'.repeat(500)}`));
			expect(res.status).toBe(400);
			const first = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
			expect(first.hostname).toBe('geocoding-api.open-meteo.com');
			expect(first.searchParams.get('name')).toBe(`${'9'.repeat(100)} USA`);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('does not cache a failed place-name or sun-time lookup', async () => {
		let upstreamUp = false;
		const now = Math.floor(Date.now() / 1000);
		const times = Array.from({ length: 48 }, (_, i) =>
			new Date((now - 24 * 3600 + i * 3600) * 1000).toISOString().slice(0, 16)
		);
		const hourly = (v: number) => times.map(() => v);
		const forecast = {
			timezone: 'UTC',
			current: {
				temperature_2m: 50, relative_humidity_2m: 50, apparent_temperature: 50, weather_code: 0,
				is_day: 1, surface_pressure: 1000, wind_speed_10m: 5, wind_direction_10m: 90, wind_gusts_10m: 8
			},
			hourly: {
				time: times, temperature_2m: hourly(50), relative_humidity_2m: hourly(50),
				dew_point_2m: hourly(40), apparent_temperature: hourly(50), weather_code: hourly(0),
				is_day: hourly(1), surface_pressure: hourly(1000), wind_speed_10m: hourly(5),
				wind_direction_10m: hourly(90), wind_gusts_10m: hourly(8)
			},
			daily: null
		};
		const sunIso = '2026-01-01T12:00:00+00:00';
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const host = new URL(String(input)).hostname;
			if (host === 'api.open-meteo.com') return new Response(JSON.stringify(forecast));
			if (host === 'api.weather.gov') return new Response(JSON.stringify({ features: [] }));
			if (!upstreamUp) return new Response('down', { status: 503 });
			if (host === 'nominatim.openstreetmap.org') {
				return new Response(
					JSON.stringify({ address: { city: 'Testville', state: 'Maine', country_code: 'us' } })
				);
			}
			return new Response(
				JSON.stringify({
					status: 'OK',
					results: {
						sunrise: sunIso, sunset: sunIso, solar_noon: sunIso, day_length: 3600,
						civil_twilight_begin: sunIso, civil_twilight_end: sunIso,
						nautical_twilight_begin: sunIso, nautical_twilight_end: sunIso,
						astronomical_twilight_begin: sunIso, astronomical_twilight_end: sunIso
					}
				})
			);
		});
		vi.stubGlobal('fetch', fetchMock);
		try {
			const first = await (await GET(event('lat=12.5&lon=34.5'))).json();
			expect(first.location).toBe('Unknown Location');

			upstreamUp = true;
			const second = await (await GET(event('lat=12.5&lon=34.5'))).json();
			expect(second.location).toBe('Testville, ME USA');
			expect(second.sunrise).toBe(new Date(sunIso).getTime() / 1000);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
