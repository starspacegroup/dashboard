import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/devPreview', () => ({
	isDevPreview: () => false,
	DEV_SESSION: { user: { login: 'dev-preview' } }
}));
vi.mock('$lib/server/devFixtures', () => ({ devGithubPayload: () => ({}) }));

import { load } from './+page.server';

type Payload = Record<string, unknown> & { user?: unknown; tokenError?: boolean };

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const org = { login: 'acme', avatar_url: 'a' };
const prItem = {
	node_id: 'PR_1',
	number: 7,
	title: 'Fix it',
	html_url: 'https://github.com/acme/app/pull/7',
	state: 'open',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-02T00:00:00Z',
	repository_url: 'https://api.github.com/repos/acme/app',
	user: { login: 'me', avatar_url: 'u' }
};

/** Answers every GitHub call the load makes; `overrides` swap a path's response. */
function githubFetch(overrides: Record<string, () => Response> = {}) {
	return vi.fn(async (input: string | URL | Request) => {
		const url = String(input);
		for (const [needle, make] of Object.entries(overrides)) {
			if (url.includes(needle)) return make();
		}
		if (url.includes('/user/orgs')) return json([org]);
		if (url.includes('/search/issues')) return json({ items: [prItem] });
		if (url.includes('/graphql')) return json({ data: { viewer: {} } });
		if (url.includes('/copilot/metrics')) return json([], 404);
		if (url.includes('/user/repos') || url.includes('/orgs/')) return json([]);
		return json({}, 404);
	});
}

function fakeKv(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	return {
		store,
		get: vi.fn(async (k: string) => store.get(k) ?? null),
		put: vi.fn(async (k: string, v: string, _opts?: { expirationTtl: number }) => void store.set(k, v))
	};
}

let n = 0;
/** A fresh login per test: the load keeps a module-level "verified" clock keyed by user. */
function run(
	opts: {
		fetch?: ReturnType<typeof githubFetch>;
		kv?: ReturnType<typeof fakeKv>;
		session?: Record<string, unknown> | null;
		login?: string;
	} = {}
) {
	const login = opts.login ?? `user-${++n}`;
	const session =
		opts.session === undefined
			? { user: { login }, accessToken: 'tok' }
			: opts.session;
	return (load as (e: unknown) => Promise<Payload>)({
		locals: { auth: async () => session },
		fetch: opts.fetch ?? githubFetch(),
		platform: opts.kv ? { env: { DASHBOARD_KV: opts.kv } } : undefined,
		url: new URL('http://localhost/'),
		cookies: { get: () => undefined }
	});
}

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('dashboard page load', () => {
	it('sends a signed-out visitor to /signin with 303', async () => {
		await expect(run({ session: null })).rejects.toMatchObject({ status: 303, location: '/signin' });
	});

	it('asks for a new sign-in, without calling GitHub, when the session has no token', async () => {
		const f = githubFetch();
		const out = await run({ fetch: f, session: { user: { login: 'x' } } });
		expect(out.tokenError).toBe(true);
		expect(f).not.toHaveBeenCalled();
	});

	it('asks for a new sign-in when the session carries a token error', async () => {
		const out = await run({ session: { user: { login: 'x' }, accessToken: 't', error: 'RefreshTokenError' } });
		expect(out.tokenError).toBe(true);
	});

	it('flags tokenError when GitHub answers 401 to the first call', async () => {
		const out = await run({ fetch: githubFetch({ '/user/orgs': () => json({}, 401) }) });
		expect(out.tokenError).toBe(true);
	});

	it('parses PR search results and runs one org query however many orgs there are', async () => {
		const f = githubFetch({
			'/user/orgs': () => json([org, { login: 'beta', avatar_url: 'b' }])
		});
		const out = await run({ fetch: f });
		expect(out.assignedPRs).toEqual([
			expect.objectContaining({
				id: 'PR_1',
				state: 'OPEN',
				isDraft: false,
				repository: { name: 'app', owner: { login: 'acme' } },
				author: { login: 'me', avatarUrl: 'u' }
			})
		]);
		const searches = f.mock.calls.map((c) => decodeURIComponent(String(c[0]))).filter((u) => u.includes('/search/issues'));
		expect(searches).toHaveLength(4);
		expect(searches.filter((u) => u.includes('org:acme org:beta'))).toHaveLength(1);
	});

	it('caps the orgs in the PR query', async () => {
		const many = Array.from({ length: 15 }, (_, i) => ({ login: `o${i}`, avatar_url: '' }));
		const f = githubFetch({ '/user/orgs': () => json(many) });
		await run({ fetch: f });
		const orgQuery = f.mock.calls
			.map((c) => decodeURIComponent(String(c[0])))
			.find((u) => u.includes('org:o0'))!;
		expect(orgQuery).toContain('org:o9');
		expect(orgQuery).not.toContain('org:o10');
	});

	it('serves a fresh cache without calling GitHub', async () => {
		const login = 'cached-user';
		const data = { assignedPRs: [{ id: 'cached' }] };
		const kv = fakeKv({
			[`github-data:${login}`]: JSON.stringify({ data, timestamp: Date.now() })
		});
		const f = githubFetch();
		const out = await run({ fetch: f, kv, login });
		expect(out.assignedPRs).toEqual([{ id: 'cached' }]);
		expect(f).not.toHaveBeenCalled();
	});

	it('serves the stale cache when GitHub rate-limits, and does not overwrite it', async () => {
		const login = 'limited-user';
		const key = `github-data:${login}`;
		const stale = JSON.stringify({ data: { assignedPRs: [{ id: 'stale' }] }, timestamp: Date.now() - 60 * 60 * 1000 });
		const kv = fakeKv({ [key]: stale });
		const f = githubFetch({ '/search/issues': () => json({}, 429) });
		const out = await run({ fetch: f, kv, login });
		expect(out.assignedPRs).toEqual([{ id: 'stale' }]);
		expect(kv.put).not.toHaveBeenCalled();
	});

	it('serves the stale cache when the whole fetch fails', async () => {
		const login = 'failing-user';
		const kv = fakeKv({
			[`github-data:${login}`]: JSON.stringify({ data: { assignedPRs: [{ id: 'stale' }] }, timestamp: 0 })
		});
		const f = vi.fn(async () => {
			throw new Error('boom');
		});
		const out = await run({ fetch: f as never, kv, login });
		expect(out.assignedPRs).toEqual([{ id: 'stale' }]);
	});

	it('returns empty widgets, not an error, when the fetch fails and nothing is cached', async () => {
		const f = vi.fn(async () => {
			throw new Error('boom');
		});
		const out = await run({ fetch: f as never });
		expect(out.assignedPRs).toEqual([]);
		expect(out.tokenError).toBeUndefined();
	});

	it('writes the cache on a change and skips the write when the payload is identical', async () => {
		const login = 'writer';
		const kv = fakeKv();
		await run({ kv, login, fetch: githubFetch() });
		expect(kv.put).toHaveBeenCalledTimes(1);
		const [key, , opts] = kv.put.mock.calls[0];
		expect(key).toBe(`github-data:${login}`);
		expect(opts?.expirationTtl).toBe(24 * 60 * 60);

		// Age the stored copy so the next load goes to GitHub, but leave the data alone.
		const stored = JSON.parse(kv.store.get(key)!);
		stored.timestamp = 0;
		kv.store.set(key, JSON.stringify(stored));
		vi.useFakeTimers();
		vi.setSystemTime(Date.now() + 10 * 60 * 1000);
		try {
			const f = githubFetch();
			await run({ kv, login, fetch: f });
			expect(f).toHaveBeenCalled();
			expect(kv.put).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it('keeps a 3-minute fresh window even when stable data means no KV write', async () => {
		const login = 'stable';
		const kv = fakeKv();
		await run({ kv, login, fetch: githubFetch() });
		const stored = JSON.parse(kv.store.get(`github-data:${login}`)!);
		stored.timestamp = 0; // as if KV was last written long ago
		kv.store.set(`github-data:${login}`, JSON.stringify(stored));
		const f = githubFetch();
		await run({ kv, login, fetch: f });
		expect(f).not.toHaveBeenCalled();
	});
});
