/**
 * Sample data for the local dev preview. See `devPreview.ts` for the gating —
 * nothing in here is reachable from a build.
 *
 * The aim is a dashboard that looks like a real one in use: enough shape in the
 * numbers that charts, sparklines and meters all have something to draw, and
 * enough variation day to day that a rendering bug is visible. Everything is
 * generated from a fixed seed, so a reload shows the same dashboard and a visual
 * diff between two runs means something actually changed.
 *
 * Names are deliberately obvious placeholders (`dev-preview`, `example.com`) so
 * a screenshot of the preview can never be mistaken for someone's real account.
 */

/**
 * Small deterministic PRNG (mulberry32). Seeded per series so each chart keeps
 * its own stable shape regardless of what else is generated.
 */
function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * A wandering series with a weekly dip, which is what real traffic looks like.
 * `dayOffset` counts back from today so weekends land on real weekends.
 */
function series(seed: number, days: number, base: number, spread: number): number[] {
	const rand = rng(seed);
	const today = new Date();
	const out: number[] = [];
	let drift = 0;
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const weekend = d.getDay() === 0 || d.getDay() === 6;
		drift += (rand() - 0.5) * spread * 0.3;
		const value = base + drift + (rand() - 0.5) * spread - (weekend ? base * 0.35 : 0);
		out.push(Math.max(0, Math.round(value)));
	}
	return out;
}

/** ISO dates (YYYY-MM-DD) for the last `days` days, oldest first, ending today. */
function dateRange(days: number): string[] {
	const today = new Date();
	const out: string[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		out.push(d.toISOString().slice(0, 10));
	}
	return out;
}

/**
 * How far through the current UTC window we are, floored so a request in the
 * first seconds of a day doesn't divide by ~0.
 */
function elapsedFraction(window: 'day' | 'month'): number {
	const now = new Date();
	if (window === 'day') {
		const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
		return Math.max(0.02, (now.getTime() - start) / 86_400_000);
	}
	const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
	const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
	return Math.max(0.02, (now.getTime() - start) / (end - start));
}

/**
 * Usage *so far* in the current window, given where it should land by the end
 * of it.
 *
 * The usage meters take a partial-window number and project it to a full window
 * at the current run rate. Handing them a flat number means the preview looks
 * calm at 23:00 and screams "limit reached" at 00:30, because the same value
 * projects to 48x. Scaling by elapsed time makes the projection land on
 * `endOfWindowTotal` whenever you happen to look.
 */
function windowUsage(endOfWindowTotal: number, window: 'day' | 'month'): number {
	return Math.round(endOfWindowTotal * elapsedFraction(window));
}

/** An ISO timestamp `daysAgo` days back, for "last updated" style fields. */
function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub — the payload +page.server.ts would fetch with a real access token
// ─────────────────────────────────────────────────────────────────────────────

const REPOS = [
	{ name: 'dashboard', language: 'Svelte', description: 'Widgets, layouts and a lot of charts', stars: 128, forks: 14, issues: 7 },
	{ name: 'edge-proxy', language: 'TypeScript', description: 'Request router running on Workers', stars: 74, forks: 6, issues: 3 },
	{ name: 'design-tokens', language: 'CSS', description: 'Shared colour and spacing primitives', stars: 41, forks: 9, issues: 1 },
	{ name: 'ingest-worker', language: 'TypeScript', description: 'Batches events into the analytics store', stars: 33, forks: 2, issues: 5 },
	{ name: 'docs-site', language: 'MDX', description: 'Public documentation', stars: 19, forks: 11, issues: 2 }
];

function repo(owner: string, ownerType: string, r: (typeof REPOS)[number]) {
	return {
		name: r.name,
		html_url: `https://github.com/${owner}/${r.name}`,
		language: r.language,
		description: r.description,
		stargazers_count: r.stars,
		forks_count: r.forks,
		open_issues_count: r.issues,
		owner: {
			login: owner,
			avatar_url: `https://avatars.githubusercontent.com/u/0?v=4&dev=${owner}`,
			type: ownerType
		}
	};
}

const PR_TITLES = [
	'Fix chart legend wrapping at narrow widths',
	'Cache zone analytics for the full window',
	'Drop the duplicate KV write on title updates',
	'Add a retry to the geocode lookup',
	'Tighten the widget drag hit target',
	'Document the dev preview'
];

function pullRequest(i: number, repoName: string, author: string, draft = false) {
	return {
		id: `PR_devpreview_${i}`,
		number: 400 + i,
		title: PR_TITLES[i % PR_TITLES.length],
		url: `https://github.com/dev-preview/${repoName}/pull/${400 + i}`,
		state: 'OPEN',
		createdAt: daysAgo(i + 2),
		updatedAt: daysAgo(i),
		author: {
			login: author,
			avatarUrl: `https://avatars.githubusercontent.com/u/0?v=4&dev=${author}`
		},
		repository: { name: repoName, owner: { login: 'dev-preview' } },
		isDraft: draft
	};
}

/** One org's Copilot metrics, in the shape the REST API returns. */
function copilotMetrics(org: string, seed: number) {
	const dates = dateRange(28);
	const active = series(seed, 28, 46, 14);
	const engaged = series(seed + 1, 28, 31, 11);
	const suggested = series(seed + 2, 28, 4200, 1400);
	const accepted = series(seed + 3, 28, 1500, 600);

	return {
		organization: org,
		metrics: dates.map((date, i) => ({
			date,
			total_active_users: active[i],
			total_engaged_users: Math.min(engaged[i], active[i]),
			copilot_ide_code_completions: {
				total_engaged_users: Math.min(engaged[i], active[i]),
				languages: [
					{ name: 'typescript', total_engaged_users: Math.round(engaged[i] * 0.42) },
					{ name: 'svelte', total_engaged_users: Math.round(engaged[i] * 0.24) },
					{ name: 'python', total_engaged_users: Math.round(engaged[i] * 0.16) },
					{ name: 'css', total_engaged_users: Math.round(engaged[i] * 0.11) },
					{ name: 'markdown', total_engaged_users: Math.round(engaged[i] * 0.07) }
				],
				editors: [
					{
						name: 'vscode',
						total_engaged_users: Math.round(engaged[i] * 0.7),
						models: [
							{
								name: 'default',
								is_custom_model: false,
								total_engaged_users: Math.round(engaged[i] * 0.7),
								languages: [
									{
										name: 'typescript',
										total_engaged_users: Math.round(engaged[i] * 0.42),
										total_code_suggestions: Math.round(suggested[i] * 0.6),
										total_code_acceptances: Math.round(accepted[i] * 0.6),
										total_code_lines_suggested: Math.round(suggested[i] * 1.7),
										total_code_lines_accepted: Math.round(accepted[i] * 1.6)
									},
									{
										name: 'svelte',
										total_engaged_users: Math.round(engaged[i] * 0.24),
										total_code_suggestions: Math.round(suggested[i] * 0.25),
										total_code_acceptances: Math.round(accepted[i] * 0.25),
										total_code_lines_suggested: Math.round(suggested[i] * 0.7),
										total_code_lines_accepted: Math.round(accepted[i] * 0.6)
									}
								]
							}
						]
					},
					{
						name: 'jetbrains',
						total_engaged_users: Math.round(engaged[i] * 0.3),
						models: [
							{
								name: 'default',
								is_custom_model: false,
								total_engaged_users: Math.round(engaged[i] * 0.3),
								languages: [
									{
										name: 'python',
										total_engaged_users: Math.round(engaged[i] * 0.16),
										total_code_suggestions: Math.round(suggested[i] * 0.15),
										total_code_acceptances: Math.round(accepted[i] * 0.15),
										total_code_lines_suggested: Math.round(suggested[i] * 0.4),
										total_code_lines_accepted: Math.round(accepted[i] * 0.35)
									}
								]
							}
						]
					}
				]
			},
			copilot_ide_chat: {
				total_engaged_users: Math.round(engaged[i] * 0.55),
				editors: [
					{
						name: 'vscode',
						total_engaged_users: Math.round(engaged[i] * 0.55),
						models: [
							{
								name: 'default',
								total_engaged_users: Math.round(engaged[i] * 0.55),
								total_chats: Math.round(engaged[i] * 4.2),
								total_chat_insertion_events: Math.round(engaged[i] * 1.3),
								total_chat_copy_events: Math.round(engaged[i] * 0.9)
							}
						]
					}
				]
			}
		}))
	};
}

/** Everything `+page.server.ts` returns, without touching GitHub. */
export function devGithubPayload() {
	return {
		githubProjects: REPOS.map((r) => repo('dev-preview', 'User', r)),
		organizationProjects: [
			{
				organization: {
					login: 'dev-preview-org',
					avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4&dev=org',
					description: 'Sample organization for the local dev preview'
				},
				repositories: REPOS.slice(0, 4).map((r) => repo('dev-preview-org', 'Organization', r))
			},
			{
				organization: {
					login: 'dev-preview-labs',
					avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4&dev=labs',
					description: 'Second org, so the org switcher has something to switch'
				},
				repositories: REPOS.slice(2).map((r) => repo('dev-preview-labs', 'Organization', r))
			}
		],
		allGithubProjects: [
			{
				id: 'PVT_devpreview_1',
				number: 12,
				title: 'Dashboard roadmap',
				url: 'https://github.com/users/dev-preview/projects/12',
				shortDescription: 'What ships next',
				public: true,
				closed: false,
				ownerType: 'User',
				ownerLogin: 'dev-preview',
				ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4&dev=dev-preview',
				updatedAt: daysAgo(1)
			},
			{
				id: 'PVT_devpreview_2',
				number: 4,
				title: 'Edge migration',
				url: 'https://github.com/orgs/dev-preview-org/projects/4',
				shortDescription: 'Move the remaining routes to Workers',
				public: false,
				closed: false,
				ownerType: 'Organization',
				ownerLogin: 'dev-preview-org',
				ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4&dev=org',
				updatedAt: daysAgo(3)
			},
			{
				id: 'PVT_devpreview_3',
				number: 9,
				title: 'Design system v2',
				url: 'https://github.com/orgs/dev-preview-labs/projects/9',
				shortDescription: 'Tokens, then components',
				public: true,
				closed: false,
				ownerType: 'Organization',
				ownerLogin: 'dev-preview-labs',
				ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4&dev=labs',
				updatedAt: daysAgo(6)
			}
		],
		assignedPRs: [pullRequest(1, 'dashboard', 'dev-preview'), pullRequest(2, 'edge-proxy', 'octo-reviewer')],
		createdPRs: [
			pullRequest(3, 'dashboard', 'dev-preview'),
			pullRequest(4, 'design-tokens', 'dev-preview', true),
			pullRequest(5, 'docs-site', 'dev-preview')
		],
		reviewRequestedPRs: [pullRequest(6, 'ingest-worker', 'octo-contributor')],
		copilotMetrics: [copilotMetrics('dev-preview-org', 101), copilotMetrics('dev-preview-labs', 202)]
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Analytics
// ─────────────────────────────────────────────────────────────────────────────

/** Plausible daily values per GA4 metric, including the rate/duration ones. */
function gaMetricSeries(metric: string, days: number): number[] {
	const seed = [...metric].reduce((a, c) => a + c.charCodeAt(0), 0);
	switch (metric) {
		case 'sessions':
			return series(seed, days, 1850, 520);
		case 'totalUsers':
			return series(seed, days, 1420, 400);
		case 'activeUsers':
			return series(seed, days, 1310, 380);
		case 'newUsers':
			return series(seed, days, 610, 210);
		case 'screenPageViews':
			return series(seed, days, 4700, 1300);
		case 'conversions':
			return series(seed, days, 48, 22);
		case 'bounceRate':
			return series(seed, days, 42, 9).map((v) => Math.min(95, v) / 100);
		case 'engagementRate':
			return series(seed, days, 58, 9).map((v) => Math.min(95, v) / 100);
		case 'averageSessionDuration':
			return series(seed, days, 168, 44);
		case 'eventsPerSession':
			return series(seed, days, 62, 16).map((v) => v / 10);
		case 'sessionsPerUser':
			return series(seed, days, 13, 3).map((v) => v / 10);
		default:
			return series(seed, days, 500, 150);
	}
}

/** Answer a GA API call from fixtures. `null` means "not a fixture action". */
export function devAnalyticsResponse(action: string | null, url: URL): unknown | null {
	if (action === 'properties') {
		return {
			properties: [
				{ propertyId: '000000001', displayName: 'Dev Preview — Marketing site', accountDisplayName: 'Dev Preview' },
				{ propertyId: '000000002', displayName: 'Dev Preview — App', accountDisplayName: 'Dev Preview' }
			]
		};
	}

	if (action === 'report') {
		const requested = (url.searchParams.get('metrics') || 'sessions,totalUsers')
			.split(',')
			.map((m) => m.trim())
			.filter(Boolean);
		const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10)));
		const dates = dateRange(days);
		const byMetric = new Map(requested.map((m) => [m, gaMetricSeries(m, days)]));

		const rows = dates.map((date, i) => {
			const row: Record<string, string | number> = { date };
			for (const metric of requested) row[metric] = byMetric.get(metric)![i];
			return row;
		});

		// Rates and averages total as a mean; counts total as a sum — same
		// distinction GA4 makes, so the metric cards read correctly.
		const AVERAGED = new Set([
			'bounceRate',
			'engagementRate',
			'averageSessionDuration',
			'eventsPerSession',
			'sessionsPerUser'
		]);
		const totals: Record<string, number> = {};
		for (const metric of requested) {
			const values = byMetric.get(metric)!;
			const sum = values.reduce((a, b) => a + b, 0);
			totals[metric] = AVERAGED.has(metric)
				? Math.round((sum / values.length) * 1000) / 1000
				: sum;
		}

		return { rows, totals, metrics: requested, days };
	}

	if (action === 'realtime') {
		// Ticks with the clock so the live view visibly updates.
		const minute = Math.floor(Date.now() / 60000);
		return { activeUsers: 24 + Math.round(rng(minute)() * 18) };
	}

	if (action === 'realtime-history') {
		const now = new Date();
		const history = [];
		for (let minutesAgo = 29; minutesAgo >= 0; minutesAgo--) {
			const ts = new Date(now.getTime() - minutesAgo * 60000);
			const rand = rng(Math.floor(ts.getTime() / 60000));
			history.push({
				minutesAgo,
				activeUsers: 18 + Math.round(rand() * 24),
				timestamp: ts.toISOString()
			});
		}
		return { history };
	}

	return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare
// ─────────────────────────────────────────────────────────────────────────────

const DEV_ACCOUNT = { id: 'devpreviewaccount0000000000000000', name: 'Dev Preview Account' };

const DEV_ZONES = [
	{ id: 'devpreviewzone00000000000000000a', name: 'example.com', status: 'active', plan: 'Free Website' },
	{ id: 'devpreviewzone00000000000000000b', name: 'docs.example.com', status: 'active', plan: 'Free Website' },
	{ id: 'devpreviewzone00000000000000000c', name: 'staging.example.net', status: 'active', plan: 'Pro Website' }
];

function windowDays(url: URL): number {
	return Math.min(30, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10)));
}

/** Answer a Cloudflare API call from fixtures. `null` means "not a fixture action". */
export function devCloudflareResponse(action: string | null, url: URL): unknown | null {
	const days = windowDays(url);
	const dates = dateRange(days);

	switch (action) {
		case 'verify':
			return { valid: true, status: 'active' };

		case 'accounts':
			return { accounts: [DEV_ACCOUNT] };

		case 'overview': {
			const requests = series(11, days, 128_000, 34_000);
			const bytes = series(12, days, 3_900_000_000, 900_000_000);
			return {
				zonesCount: DEV_ZONES.length,
				pagesCount: 2,
				workersCount: 3,
				totals: {
					requests: requests.reduce((a, b) => a + b, 0),
					bytes: bytes.reduce((a, b) => a + b, 0),
					threats: series(13, days, 320, 180).reduce((a, b) => a + b, 0),
					cachedRequests: Math.round(requests.reduce((a, b) => a + b, 0) * 0.71)
				},
				series: dates.map((date, i) => ({ date, requests: requests[i], bytes: bytes[i] })),
				// Deliberately spread across the meter tones so the preview shows
				// what healthy, warning and over-limit all look like: KV writes
				// land at ~74% of the free daily allowance and D1 row writes at
				// ~93%, everything else comfortably under.
				usage: {
					workers: { requests: windowUsage(62_000, 'day'), errors: windowUsage(140, 'day') },
					kv: {
						read: windowUsage(38_000, 'day'),
						write: windowUsage(740, 'day'),
						delete: windowUsage(40, 'day'),
						list: windowUsage(180, 'day'),
						storageBytes: 412_000_000,
						keys: 1_284
					},
					d1: { rowsRead: windowUsage(2_200_000, 'day'), rowsWritten: windowUsage(93_000, 'day') },
					r2: { classA: windowUsage(220_000, 'month'), classB: windowUsage(3_100_000, 'month'), storageBytes: 2_600_000_000 },
					pages: { builds: windowUsage(235, 'month') }
				}
			};
		}

		case 'zones':
			return { zones: DEV_ZONES };

		case 'zone-analytics': {
			const zoneId = url.searchParams.get('zoneId') || DEV_ZONES[0].id;
			// Seed off the zone so switching domains visibly changes the chart.
			const seed = [...zoneId].reduce((a, c) => a + c.charCodeAt(0), 0);
			const requests = series(seed, days, 42_000, 12_000);
			const bytes = series(seed + 1, days, 1_400_000_000, 380_000_000);
			const cached = requests.map((r, i) => Math.round(r * (0.62 + (i % 5) * 0.02)));
			const threats = series(seed + 2, days, 140, 90);
			const pageViews = requests.map((r) => Math.round(r * 0.42));
			const uniques = requests.map((r) => Math.round(r * 0.11));
			const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

			return {
				series: dates.map((date, i) => ({
					date,
					requests: requests[i],
					bytes: bytes[i],
					cachedRequests: cached[i],
					threats: threats[i],
					pageViews: pageViews[i],
					uniques: uniques[i]
				})),
				totals: {
					requests: sum(requests),
					bytes: sum(bytes),
					cachedRequests: sum(cached),
					threats: sum(threats),
					pageViews: sum(pageViews),
					uniques: sum(uniques)
				},
				breakdown: {
					statusBuckets: {
						'2xx': Math.round(sum(requests) * 0.89),
						'3xx': Math.round(sum(requests) * 0.06),
						'4xx': Math.round(sum(requests) * 0.04),
						'5xx': Math.round(sum(requests) * 0.01)
					},
					topCountries: [
						{ country: 'US', requests: Math.round(sum(requests) * 0.44) },
						{ country: 'GB', requests: Math.round(sum(requests) * 0.14) },
						{ country: 'DE', requests: Math.round(sum(requests) * 0.11) },
						{ country: 'CA', requests: Math.round(sum(requests) * 0.08) },
						{ country: 'AU', requests: Math.round(sum(requests) * 0.05) }
					],
					cacheStatus: [
						{ status: 'hit', requests: Math.round(sum(requests) * 0.64) },
						{ status: 'miss', requests: Math.round(sum(requests) * 0.19) },
						{ status: 'dynamic', requests: Math.round(sum(requests) * 0.14) },
						{ status: 'expired', requests: Math.round(sum(requests) * 0.03) }
					]
				}
			};
		}

		case 'security': {
			const total = series(21, days, 480, 220).reduce((a, b) => a + b, 0);
			return {
				total,
				byAction: [
					{ action: 'managed_challenge', count: Math.round(total * 0.51) },
					{ action: 'block', count: Math.round(total * 0.3) },
					{ action: 'js_challenge', count: Math.round(total * 0.13) },
					{ action: 'log', count: Math.round(total * 0.06) }
				],
				topCountries: [
					{ country: 'CN', count: Math.round(total * 0.28) },
					{ country: 'RU', count: Math.round(total * 0.21) },
					{ country: 'BR', count: Math.round(total * 0.12) },
					{ country: 'US', count: Math.round(total * 0.09) }
				],
				topRules: [
					{ source: 'waf.managed', ruleId: 'dev-preview-owasp', count: Math.round(total * 0.36) },
					{ source: 'ratelimit', ruleId: 'dev-preview-api-burst', count: Math.round(total * 0.24) },
					{ source: 'firewallrules', ruleId: 'dev-preview-country-block', count: Math.round(total * 0.18) }
				]
			};
		}

		case 'pages':
			return {
				builds: windowUsage(235, 'month'),
				projects: [
					{
						name: 'marketing-site',
						subdomain: 'marketing-site.pages.dev',
						domains: ['example.com', 'www.example.com'],
						deployment: {
							environment: 'production',
							createdOn: daysAgo(1),
							url: 'https://a1b2c3d4.marketing-site.pages.dev',
							status: 'success',
							stage: 'deploy',
							branch: 'main',
							message: 'Tighten hero spacing on mobile'
						}
					},
					{
						name: 'docs-site',
						subdomain: 'docs-site.pages.dev',
						domains: ['docs.example.com'],
						deployment: {
							environment: 'production',
							createdOn: daysAgo(4),
							url: 'https://e5f6a7b8.docs-site.pages.dev',
							status: 'success',
							stage: 'deploy',
							branch: 'main',
							message: 'Add the dev preview page'
						}
					}
				]
			};

		case 'workers': {
			const requests = series(31, days, 58_000, 16_000);
			const errors = series(32, days, 90, 70);
			const subrequests = requests.map((r) => Math.round(r * 1.6));
			const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
			return {
				scripts: [
					{ name: 'edge-proxy', modifiedOn: daysAgo(2), createdOn: daysAgo(210), requests: Math.round(sum(requests) * 0.62), errors: Math.round(sum(errors) * 0.5), subrequests: Math.round(sum(subrequests) * 0.62), cpuP50: 3.1, cpuP99: 18.4 },
					{ name: 'ingest-worker', modifiedOn: daysAgo(9), createdOn: daysAgo(180), requests: Math.round(sum(requests) * 0.28), errors: Math.round(sum(errors) * 0.42), subrequests: Math.round(sum(subrequests) * 0.28), cpuP50: 5.8, cpuP99: 41.2 },
					{ name: 'image-resizer', modifiedOn: daysAgo(26), createdOn: daysAgo(95), requests: Math.round(sum(requests) * 0.1), errors: Math.round(sum(errors) * 0.08), subrequests: Math.round(sum(subrequests) * 0.1), cpuP50: 9.4, cpuP99: 63.7 }
				],
				analyticsAvailable: true,
				daily: dates.map((date, i) => ({ date, requests: requests[i], errors: errors[i], subrequests: subrequests[i] })),
				// Today is still in progress — same partial-window number the
				// Overview meter reads, so the two tabs agree.
				today: {
					requests: windowUsage(62_000, 'day'),
					errors: windowUsage(140, 'day'),
					subrequests: windowUsage(99_000, 'day')
				},
				windowTotals: { requests: sum(requests), errors: sum(errors), subrequests: sum(subrequests) },
				cpuP50: 4.2,
				cpuP99: 29.6
			};
		}

		case 'kv': {
			const read = series(41, days, 13_400, 3_800);
			const write = series(42, days, 58, 30);
			const del = series(43, days, 4, 5);
			const list = series(44, days, 26, 14);
			const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
			return {
				namespaces: [
					{ id: 'devpreviewkv0000000000000000000a', title: 'DASHBOARD_KV', keys: 1_284, bytes: 389_000_000 },
					{ id: 'devpreviewkv0000000000000000000b', title: 'SESSION_CACHE', keys: 412, bytes: 23_000_000 }
				],
				today: {
					read: windowUsage(38_000, 'day'),
					write: windowUsage(740, 'day'),
					delete: windowUsage(40, 'day'),
					list: windowUsage(180, 'day')
				},
				windowOps: { read: sum(read), write: sum(write), delete: sum(del), list: sum(list) },
				daily: dates.map((date, i) => ({ date, read: read[i], write: write[i], delete: del[i], list: list[i] })),
				storage: { keys: 1_696, bytes: 412_000_000 },
				analyticsAvailable: true
			};
		}

		case 'r2':
			return {
				buckets: [
					{ name: 'dev-preview-uploads', createdOn: daysAgo(240), objects: 18_400, bytes: 2_100_000_000 },
					{ name: 'dev-preview-backups', createdOn: daysAgo(120), objects: 940, bytes: 500_000_000 }
				],
				month: { classA: windowUsage(220_000, 'month'), classB: windowUsage(3_100_000, 'month') },
				storage: { objects: 19_340, bytes: 2_600_000_000 },
				analyticsAvailable: true
			};

		case 'd1':
			return {
				databases: [
					{ id: 'devpreviewd10000000000000000000a', name: 'app-primary', version: 'production', tables: 14, bytes: 88_000_000, readQueries: 412_000, writeQueries: 9_400, rowsRead: 1_800_000, rowsWritten: 54_000, rowsReadToday: 240_000, rowsWrittenToday: 7_100 },
					{ id: 'devpreviewd10000000000000000000b', name: 'analytics-rollup', version: 'production', tables: 6, bytes: 21_000_000, readQueries: 96_000, writeQueries: 2_100, rowsRead: 300_000, rowsWritten: 9_000, rowsReadToday: 41_000, rowsWrittenToday: 1_200 }
				],
				windowTotals: { readQueries: 508_000, writeQueries: 11_500, rowsRead: 2_100_000, rowsWritten: 63_000 },
				today: { rowsRead: windowUsage(2_200_000, 'day'), rowsWritten: windowUsage(93_000, 'day') },
				analyticsAvailable: true
			};

		case 'queues':
			return {
				queues: [
					{ id: 'devpreviewq000000000000000000000a', name: 'ingest-events', createdOn: daysAgo(150), producers: 2, consumers: 1, backlogMessages: 118, backlogBytes: 240_000 },
					{ id: 'devpreviewq000000000000000000000b', name: 'email-outbox', createdOn: daysAgo(60), producers: 1, consumers: 1, backlogMessages: 3, backlogBytes: 6_400 }
				],
				analyticsAvailable: true
			};

		case 'durable-objects':
			return {
				available: true,
				requests: 84_000,
				responseBytes: 610_000_000,
				cpuTime: 128_000,
				storedBytes: 74_000_000
			};

		case 'web-analytics':
			return {
				available: true,
				sites: [{ siteTag: 'devpreviewrum00000000000000000000', host: 'example.com' }],
				pageLoads: series(51, days, 9_400, 2_600).reduce((a, b) => a + b, 0),
				visits: series(52, days, 6_100, 1_700).reduce((a, b) => a + b, 0),
				vitals: { lcpP75: 1_840, inpP75: 168, clsP75: 0.06 }
			};

		default:
			return null;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// The dashboard the preview opens on
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fixed timestamp for the seed snapshot. `/api/dashboard-state` hands this back
 * as `updatedAt`, and the sync engine only applies a remote snapshot that is
 * newer than what the browser already has. So the seed lands once, on a browser
 * with no dashboard yet, and every later edit wins — you can rearrange the
 * preview and it stays rearranged.
 */
export const DEV_SEED_UPDATED_AT = 1_700_000_000_000;

const LEWISTON = {
	name: 'Lewiston',
	state: 'Maine',
	country: 'US',
	lat: 44.1004,
	lon: -70.2148,
	displayName: 'Lewiston, ME',
	timezone: 'America/New_York',
	timezoneOffset: -14400
};

const PHOENIX = {
	name: 'Phoenix',
	state: 'Arizona',
	country: 'US',
	lat: 33.4484,
	lon: -112.074,
	displayName: 'Phoenix, AZ',
	timezone: 'America/Phoenix',
	timezoneOffset: -25200
};

/**
 * One widget of every type, so the preview shows the whole surface. Two weather
 * widgets in different timezones, because a single one can't show that each
 * keeps its own clock and location.
 */
const DEV_WIDGETS = [
	{ id: 'dev-weather-east', type: 'weather', title: 'Weather', section: 0, order: 0, size: { width: 300, height: 200 }, config: { location: LEWISTON, temperatureUnit: 'fahrenheit' } },
	{ id: 'dev-weather-west', type: 'weather', title: 'Weather', section: 0, order: 1, size: { width: 300, height: 200 }, config: { location: PHOENIX, temperatureUnit: 'fahrenheit' } },
	{ id: 'dev-data-table', type: 'data-table', title: 'Hourly Forecast', section: 0, order: 2, size: { width: 300, height: 400 }, config: { location: LEWISTON } },

	{ id: 'dev-traffic', type: 'traffic', title: 'Traffic', section: 1, order: 0, size: { width: 300, height: 300 }, config: { location: LEWISTON } },
	{ id: 'dev-calendar', type: 'calendar', title: 'Calendar', section: 1, order: 1, size: { width: 300, height: 300 } },
	{ id: 'dev-crypto', type: 'crypto', title: 'Bitcoin', section: 1, order: 2, size: { width: 300, height: 300 }, config: { crypto: { coinId: 'bitcoin', vsCurrency: 'usd', days: 7 } } },

	{
		id: 'dev-analytics',
		type: 'google-analytics',
		title: 'Google Analytics',
		section: 2,
		order: 0,
		size: { width: 0, height: 460 },
		config: {
			analytics: {
				propertyId: '000000001',
				propertyName: 'Dev Preview — Marketing site',
				metrics: ['sessions', 'totalUsers', 'screenPageViews', 'newUsers'],
				days: 30
			}
		}
	},
	{ id: 'dev-copilot', type: 'copilot-usage', title: 'Copilot Usage', section: 2, order: 1, size: { width: 0, height: 500 } },
	{ id: 'dev-github', type: 'github', title: 'GitHub', section: 2, order: 2, size: { width: 0, height: 400 } },

	{
		id: 'dev-cloudflare',
		type: 'cloudflare',
		title: 'Cloudflare',
		section: 3,
		order: 0,
		size: { width: 0, height: 520 },
		config: {
			cloudflare: {
				credentialId: 'dev-preview-credential',
				accountId: 'devpreviewaccount0000000000000000',
				accountName: 'Dev Preview Account',
				view: 'overview',
				days: 7,
				plan: 'free'
			}
		}
	},
	{ id: 'dev-gh-projects', type: 'github-projects', title: 'GitHub Projects', section: 3, order: 1, size: { width: 0, height: 420 } },
	{ id: 'dev-gh-prs', type: 'github-pull-requests', title: 'Pull Requests', section: 3, order: 2, size: { width: 0, height: 420 } },
	{ id: 'dev-org-projects', type: 'organization-projects', title: 'Organization Projects', section: 3, order: 3, size: { width: 0, height: 420 } }
];

const DEV_SECTIONS = [
	{ id: 0, gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
	{ id: 1, gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
	{ id: 2, gridColumn: 3, gridColumnSpan: 1, gridRow: 1 },
	{ id: 3, gridColumn: 4, gridColumnSpan: 1, gridRow: 1 }
];

/**
 * The localStorage snapshot the preview seeds through the normal sync path, so
 * the client needs no dev-specific code to pick it up.
 *
 * The two placeholder credentials are what get the Analytics and Cloudflare
 * widgets past their Connect screens; the API fixtures only answer for exactly
 * these values, so a real token you paste in still goes to the real provider.
 */
export function devDashboardSnapshot(
	gaRefreshToken: string,
	cfApiToken: string
): Record<string, string | null> {
	return {
		'dashboard-widgets': JSON.stringify(DEV_WIDGETS),
		'dashboard-sections': JSON.stringify(DEV_SECTIONS),
		'dashboard-location': JSON.stringify(LEWISTON),
		'dashboard-temp-unit-global': 'fahrenheit',
		'dashboard-analytics-connection': JSON.stringify({ refreshToken: gaRefreshToken }),
		'dashboard-cloudflare-credentials': JSON.stringify({
			credentials: [
				{ id: 'dev-preview-credential', label: 'Dev Preview', token: cfApiToken }
			]
		})
	};
}
