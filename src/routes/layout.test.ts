import { beforeEach, describe, expect, it, vi } from 'vitest';

const preview = vi.hoisted(() => ({ on: false }));
vi.mock('$lib/server/devPreview', () => ({
	DEV_SESSION: { user: { name: 'Dev Preview' } },
	isDevPreview: () => preview.on
}));

import { load } from './+layout.server';

type Out = { user?: unknown; devPreview: boolean };

async function run(session: unknown) {
	const auth = vi.fn(async () => session);
	const event = { locals: { auth }, url: new URL('http://localhost/'), cookies: {} };
	const out = await (load as (e: unknown) => Promise<Out>)(event);
	return { out, auth };
}

beforeEach(() => {
	preview.on = false;
});

describe('root layout load', () => {
	it('hands out the fake user in dev preview and never asks Auth.js', async () => {
		preview.on = true;
		const { out, auth } = await run({ user: { name: 'Real' } });
		expect(out).toEqual({ user: { name: 'Dev Preview' }, devPreview: true });
		expect(auth).not.toHaveBeenCalled();
	});

	it('returns the signed-in user from the session', async () => {
		const { out } = await run({ user: { name: 'Real' } });
		expect(out).toEqual({ user: { name: 'Real' }, devPreview: false });
	});

	it('returns no user when signed out', async () => {
		const { out } = await run(null);
		expect(out.user).toBeUndefined();
		expect(out.devPreview).toBe(false);
	});
});
