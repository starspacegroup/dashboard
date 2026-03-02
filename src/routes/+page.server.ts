import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

interface GitHubOrganization {
	login: string;
	avatar_url: string;
	description?: string;
}

interface GitHubRepository {
	name: string;
	html_url: string;
	language?: string;
	description?: string;
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	owner: {
		login: string;
		avatar_url: string;
		type: string;
	};
}

interface OrganizationProjects {
	organization: GitHubOrganization;
	repositories: GitHubRepository[];
}

interface GitHubProject {
	id: string;
	number: number;
	title: string;
	url: string;
	shortDescription?: string;
	public: boolean;
	closed: boolean;
	ownerType: string;
	ownerLogin: string;
	ownerAvatarUrl?: string;
	updatedAt: string;
}

interface GitHubPullRequest {
	id: string;
	number: number;
	title: string;
	url: string;
	state: string;
	createdAt: string;
	updatedAt: string;
	author?: {
		login: string;
		avatarUrl?: string;
	};
	repository: {
		name: string;
		owner: {
			login: string;
		};
	};
	isDraft: boolean;
}

interface CopilotMetric {
	date: string;
	total_active_users: number;
	total_engaged_users: number;
	copilot_ide_code_completions?: {
		total_engaged_users: number;
		languages?: { name: string; total_engaged_users: number; }[];
		editors?: {
			name: string;
			total_engaged_users: number;
			models?: {
				name: string;
				is_custom_model: boolean;
				total_engaged_users: number;
				languages?: {
					name: string;
					total_engaged_users: number;
					total_code_suggestions?: number;
					total_code_acceptances?: number;
					total_code_lines_suggested?: number;
					total_code_lines_accepted?: number;
				}[];
			}[];
		}[];
	};
	copilot_ide_chat?: {
		total_engaged_users: number;
		editors?: {
			name: string;
			total_engaged_users: number;
			models?: {
				name: string;
				total_engaged_users: number;
				total_chats: number;
				total_chat_insertion_events: number;
				total_chat_copy_events: number;
			}[];
		}[];
	};
	copilot_dotcom_chat?: {
		total_engaged_users: number;
		models?: {
			name: string;
			total_engaged_users: number;
			total_chats: number;
		}[];
	};
}

interface OrganizationMetrics {
	organization: string;
	metrics: CopilotMetric[];
	error?: string;
}

interface ExtendedSession {
	user?: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
		login?: string;
	};
	accessToken?: string;
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const session = await locals.getSession() as ExtendedSession | null;

	if (!session?.user) {
		throw redirect(303, '/signin');
	}

	try {
		// Get the user's access token from the session
		const accessToken = session.accessToken;

		if (!accessToken) {
			console.error('[ERROR] No access token in session!');
			return {
				user: session.user,
				githubProjects: [],
				organizationProjects: [],
				allGithubProjects: [],
				assignedPRs: [],
				createdPRs: [],
				reviewRequestedPRs: [],
				copilotMetrics: []
			};
		}

		const headers = {
			Accept: 'application/vnd.github.v3+json',
			Authorization: `token ${accessToken}`,
			'User-Agent': 'Dashboard-App'
		};

		// ── Helper: parse a PR search response into GitHubPullRequest[] ──
		function parsePRItems(items: Record<string, unknown>[]): GitHubPullRequest[] {
			const prs: GitHubPullRequest[] = [];
			for (const item of items) {
				const repoUrl = item.repository_url as string | undefined;
				const repoMatch = repoUrl?.match(/\/repos\/([^/]+)\/([^/]+)$/);
				if (repoMatch) {
					const user = item.user as Record<string, unknown> | undefined;
					prs.push({
						id: item.node_id as string,
						number: item.number as number,
						title: item.title as string,
						url: item.html_url as string,
						state: (item.state as string).toUpperCase(),
						createdAt: item.created_at as string,
						updatedAt: item.updated_at as string,
						author: user ? {
							login: user.login as string,
							avatarUrl: user.avatar_url as string | undefined
						} : undefined,
						repository: {
							name: repoMatch[2],
							owner: { login: repoMatch[1] }
						},
						isDraft: (item.draft as boolean) || false
					});
				}
			}
			return prs;
		}

		// ── Helper: fetch a single PR search query ──
		async function fetchPRSearch(query: string): Promise<GitHubPullRequest[]> {
			try {
				const res = await fetch(
					`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100`,
					{
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'Accept': 'application/vnd.github.v3+json',
							'User-Agent': 'Dashboard-App'
						}
					}
				);
				if (res.ok) {
					const result = await res.json();
					return parsePRItems(result.items || []);
				}
				console.error('[ERROR] PR search failed:', res.status);
			} catch (error) {
				console.error('[ERROR] PR search error:', error);
			}
			return [];
		}

		// ── Helper: fetch Copilot metrics for one org ──
		async function fetchCopilotMetricsForOrg(orgName: string): Promise<OrganizationMetrics | null> {
			try {
				const sinceDate = new Date();
				sinceDate.setDate(sinceDate.getDate() - 28);
				const sinceDateStr = sinceDate.toISOString().split('T')[0];

				const metricsResponse = await fetch(
					`https://api.github.com/orgs/${orgName}/copilot/metrics?since=${sinceDateStr}`,
					{
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'Accept': 'application/vnd.github+json',
							'X-GitHub-Api-Version': '2022-11-28',
							'User-Agent': 'Dashboard-App'
						}
					}
				);

				if (metricsResponse.ok) {
					const metrics: CopilotMetric[] = await metricsResponse.json();
					return { organization: orgName, metrics };
				} else if (metricsResponse.status === 403) {
					return { organization: orgName, metrics: [], error: 'No permission to view Copilot metrics' };
				} else if (metricsResponse.status === 422) {
					return { organization: orgName, metrics: [], error: 'Copilot Metrics API is disabled for this organization' };
				}
				// 404 = not enabled → skip
			} catch (error) {
				console.error(`[ERROR] Copilot metrics error for ${orgName}:`, error);
			}
			return null;
		}

		// ── Helper: fetch GraphQL projects ──
		async function fetchGraphQLProjects(): Promise<GitHubProject[]> {
			const projectsQuery = `
				query {
					viewer {
						projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
							nodes {
								id
								number
								title
								url
								shortDescription
								public
								closed
								updatedAt
								owner {
									... on User { login avatarUrl }
									... on Organization { login avatarUrl }
								}
							}
						}
						organizations(first: 50) {
							nodes {
								login
								projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
									nodes {
										id
										number
										title
										url
										shortDescription
										public
										closed
										updatedAt
										owner {
											... on Organization { login avatarUrl }
										}
									}
								}
							}
						}
					}
				}
			`;

			try {
				const graphqlResponse = await fetch('https://api.github.com/graphql', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
						'User-Agent': 'Dashboard-App'
					},
					body: JSON.stringify({ query: projectsQuery })
				});

				if (!graphqlResponse.ok) {
					const errorText = await graphqlResponse.text();
					console.error('[ERROR] GraphQL Response not OK:', graphqlResponse.status, errorText);
					return [];
				}

				const result = await graphqlResponse.json();
				if (result.errors) {
					console.error('GraphQL Errors:', result.errors);
				}

				const projects: GitHubProject[] = [];

				// Extract user's personal projects
				if (result.data?.viewer?.projectsV2?.nodes) {
					for (const project of result.data.viewer.projectsV2.nodes) {
						projects.push({
							id: project.id,
							number: project.number,
							title: project.title,
							url: project.url,
							shortDescription: project.shortDescription,
							public: project.public,
							closed: project.closed,
							ownerType: 'User',
							ownerLogin: project.owner?.login || 'Unknown',
							ownerAvatarUrl: project.owner?.avatarUrl,
							updatedAt: project.updatedAt
						});
					}
				}

				// Extract organization projects
				if (result.data?.viewer?.organizations?.nodes) {
					for (const org of result.data.viewer.organizations.nodes) {
						if (org.projectsV2?.nodes) {
							for (const project of org.projectsV2.nodes) {
								projects.push({
									id: project.id,
									number: project.number,
									title: project.title,
									url: project.url,
									shortDescription: project.shortDescription,
									public: project.public,
									closed: project.closed,
									ownerType: 'Organization',
									ownerLogin: project.owner?.login || org.login,
									ownerAvatarUrl: project.owner?.avatarUrl,
									updatedAt: project.updatedAt
								});
							}
						}
					}
				}

				return projects;
			} catch (error) {
				console.error('[ERROR] Failed to fetch GitHub Projects:', error);
				return [];
			}
		}

		// ── 1) Kick off the org list fetch (needed before org repos & copilot) ──
		const orgsResponse = await fetch('https://api.github.com/user/orgs', { headers });
		let organizations: GitHubOrganization[] = [];
		if (orgsResponse.ok) {
			organizations = await orgsResponse.json();
		}

		// ── 2) Fire ALL independent fetches in parallel ──
		const [
			orgReposResults,
			userReposResponse,
			allGithubProjects,
			assignedPRs,
			createdPRs,
			reviewRequestedPRs,
			copilotMetricsResults
		] = await Promise.all([
			// Org repos (parallel per org)
			Promise.all(
				organizations.map(async (org): Promise<OrganizationProjects> => {
					try {
						const reposResponse = await fetch(
							`https://api.github.com/orgs/${org.login}/repos?sort=updated&per_page=20`,
							{ headers }
						);
						if (reposResponse.ok) {
							const repositories: GitHubRepository[] = await reposResponse.json();
							return { organization: org, repositories };
						}
					} catch (error) {
						console.error(`Failed to fetch repos for org ${org.login}:`, error);
					}
					return { organization: org, repositories: [] };
				})
			),

			// User repos
			fetch('https://api.github.com/user/repos?sort=updated&per_page=10', { headers }),

			// GraphQL projects
			fetchGraphQLProjects(),

			// PR searches (all three in parallel)
			fetchPRSearch('type:pr state:open assignee:@me'),
			fetchPRSearch('type:pr state:open author:@me'),
			fetchPRSearch('type:pr state:open review-requested:@me'),

			// Copilot metrics (parallel per org)
			Promise.all(organizations.map(org => fetchCopilotMetricsForOrg(org.login)))
		]);

		// ── 3) Resolve simple results ──
		const organizationProjects: OrganizationProjects[] = orgReposResults;

		let githubProjects: GitHubRepository[] = [];
		if (userReposResponse.ok) {
			githubProjects = await userReposResponse.json();
		}

		const copilotMetrics: OrganizationMetrics[] = copilotMetricsResults.filter(
			(m): m is OrganizationMetrics => m !== null
		);

		return {
			user: session.user,
			githubProjects,
			organizationProjects,
			allGithubProjects,
			assignedPRs,
			createdPRs,
			reviewRequestedPRs,
			copilotMetrics
		};
	} catch (error) {
		console.error('Failed to fetch GitHub data:', error);
	}

	return {
		user: session?.user || null,
		githubProjects: [],
		organizationProjects: [],
		allGithubProjects: [],
		assignedPRs: [],
		createdPRs: [],
		reviewRequestedPRs: [],
		copilotMetrics: []
	};
};
