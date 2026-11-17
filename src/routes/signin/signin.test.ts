import { beforeEach, describe, expect, it, vi } from 'vitest';

const flag = vi.hoisted(() => ({ enabled: false }));
vi.mock('$lib/server/devPreview', () => ({
	get DEV_PREVIEW_ENABLED() {
		return flag.enabled;
	}
}));

import { load } from './+page.server';

async function run(opts: { signedIn?: boolean; query?: string } = {}) {
	const event = {
		locals: { auth: async () => (opts.signedIn ? { user: { name: 'x' } } : null) },
		url: new URL(`http://localhost/signin${opts.query ?? ''}`)
	};
	return (load as (e: unknown) => Promise<{ devLogin: boolean; authError: string | null }>)(event);
}

beforeEach(() => {
	flag.enabled = false;
});

describe('/signin load', () => {
	it('redirects a signed-in user home with 303', async () => {
		await expect(run({ signedIn: true })).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('has no error message when there is no error param', async () => {
		expect((await run()).authError).toBeNull();
	});

	it('has no error message for an empty error param', async () => {
		expect((await run({ query: '?error=' })).authError).toBeNull();
	});

	it('explains AccessDenied', async () => {
		expect((await run({ query: '?error=AccessDenied' })).authError).toMatch(/declined/);
	});

	it('explains Verification', async () => {
		expect((await run({ query: '?error=Verification' })).authError).toMatch(/already been used or has expired/);
	});

	it('maps Configuration and unknown codes to the retry message, never "server configuration"', async () => {
		for (const code of ['Configuration', 'Whatever']) {
			const msg = (await run({ query: `?error=${code}` })).authError;
			expect(msg).toMatch(/did not go through/);
			expect(msg).not.toMatch(/server configuration/i);
		}
	});

	it('offers the dev login only when the preview is enabled', async () => {
		expect((await run()).devLogin).toBe(false);
		flag.enabled = true;
		expect((await run()).devLogin).toBe(true);
	});
});
