import { beforeEach, describe, expect, it, vi } from 'vitest';

const flag = vi.hoisted(() => ({ enabled: true }));
vi.mock('$lib/server/devPreview', () => ({
	get DEV_PREVIEW_ENABLED() {
		return flag.enabled;
	},
	DEV_PREVIEW_COOKIE: 'dev-preview'
}));

import { POST } from './+server';

const cookieSet = vi.fn();

async function thrown() {
	try {
		await POST({ cookies: { set: cookieSet } } as never);
	} catch (e) {
		return e as { status: number; location?: string; body?: { message: string } };
	}
	throw new Error('expected a throw');
}

beforeEach(() => {
	flag.enabled = true;
	cookieSet.mockReset();
});

describe('/dev-login', () => {
	it('answers 404 and sets no cookie when the preview is off', async () => {
		flag.enabled = false;
		const e = await thrown();
		expect(e.status).toBe(404);
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it('sets the preview cookie and redirects home', async () => {
		const e = await thrown();
		expect(e.status).toBe(303);
		expect(e.location).toBe('/');
		expect(cookieSet).toHaveBeenCalledWith(
			'dev-preview',
			'on',
			expect.objectContaining({
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: false,
				maxAge: 60 * 60 * 24 * 30
			})
		);
	});
});
