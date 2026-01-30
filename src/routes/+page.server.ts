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

		// Fetch user's organizations
		const orgsResponse = await fetch('https://api.github.com/user/orgs', { headers });

		let organizationProjects: OrganizationProjects[] = [];

		if (orgsResponse.ok) {
			const organizations: GitHubOrganization[] = await orgsResponse.json();

			// Fetch repositories for each organization
			const orgProjectsPromises = organizations.map(async (org) => {
				try {
					const reposResponse = await fetch(
						`https://api.github.com/orgs/${org.login}/repos?sort=updated&per_page=20`,
						{ headers }
					);

					if (reposResponse.ok) {
						const repositories: GitHubRepository[] = await reposResponse.json();
						return {
							organization: org,
							repositories
						};
					}
				} catch (error) {
					console.error(`Failed to fetch repos for org ${org.login}:`, error);
				}
				return {
					organization: org,
					repositories: []
				};
			});

			organizationProjects = await Promise.all(orgProjectsPromises);
		}

		// Also fetch user's personal repositories
		const userReposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
			headers
		});

		let githubProjects: GitHubRepository[] = [];
		if (userReposResponse.ok) {
			githubProjects = await userReposResponse.json();
		}

		// Fetch GitHub Projects using GraphQL API
		const allGithubProjects: GitHubProject[] = [];

		// GraphQL query to fetch user's projects
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
								... on User {
									login
									avatarUrl
								}
								... on Organization {
									login
									avatarUrl
								}
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
										... on Organization {
											login
											avatarUrl
										}
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

			if (graphqlResponse.ok) {
				const result = await graphqlResponse.json();

				// Check for errors in the response
				if (result.errors) {
					console.error('GraphQL Errors:', result.errors);
				}

				// Extract user's personal projects
				if (result.data?.viewer?.projectsV2?.nodes) {
					const userProjects = result.data.viewer.projectsV2.nodes.map((project: any) => ({
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
					}));
					allGithubProjects.push(...userProjects);
				}

				// Extract organization projects
				if (result.data?.viewer?.organizations?.nodes) {
					for (const org of result.data.viewer.organizations.nodes) {
						if (org.projectsV2?.nodes) {
							const orgProjects = org.projectsV2.nodes.map((project: any) => ({
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
							}));
							allGithubProjects.push(...orgProjects);
						}
					}
				}
			} else {
				const errorText = await graphqlResponse.text();
				console.error('[ERROR] GraphQL Response not OK:', graphqlResponse.status, errorText);
			}
		} catch (error) {
			console.error('[ERROR] Failed to fetch GitHub Projects:', error);
			if (error instanceof Error) {
				console.error('[ERROR] Error message:', error.message);
				console.error('[ERROR] Error stack:', error.stack);
			}
		}

		// Fetch Pull Requests using GitHub Search API
		const assignedPRs: GitHubPullRequest[] = [];
		const createdPRs: GitHubPullRequest[] = [];
		const reviewRequestedPRs: GitHubPullRequest[] = [];

		try {
			// Fetch assigned PRs
			const assignedResponse = await fetch('https://api.github.com/search/issues?q=type:pr+state:open+assignee:@me&sort=updated&order=desc&per_page=100', {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'Dashboard-App'
				}
			});

			if (assignedResponse.ok) {
				const assignedResult = await assignedResponse.json();
				console.log('[DEBUG] Assigned PRs response:', assignedResult.total_count, 'found');

				for (const item of assignedResult.items || []) {
					const repoMatch = item.repository_url?.match(/\/repos\/([^\/]+)\/([^\/]+)$/);
					if (repoMatch) {
						assignedPRs.push({
							id: item.node_id,
							number: item.number,
							title: item.title,
							url: item.html_url,
							state: item.state.toUpperCase(),
							createdAt: item.created_at,
							updatedAt: item.updated_at,
							author: item.user ? {
								login: item.user.login,
								avatarUrl: item.user.avatar_url
							} : undefined,
							repository: {
								name: repoMatch[2],
								owner: {
									login: repoMatch[1]
								}
							},
							isDraft: item.draft || false
						});
					}
				}
			} else {
				console.error('[ERROR] Assigned PRs fetch failed:', assignedResponse.status);
			}

			// Fetch created PRs
			const createdResponse = await fetch('https://api.github.com/search/issues?q=type:pr+state:open+author:@me&sort=updated&order=desc&per_page=100', {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'Dashboard-App'
				}
			});

			if (createdResponse.ok) {
				const createdResult = await createdResponse.json();
				console.log('[DEBUG] Created PRs response:', createdResult.total_count, 'found');

				for (const item of createdResult.items || []) {
					const repoMatch = item.repository_url?.match(/\/repos\/([^\/]+)\/([^\/]+)$/);
					if (repoMatch) {
						createdPRs.push({
							id: item.node_id,
							number: item.number,
							title: item.title,
							url: item.html_url,
							state: item.state.toUpperCase(),
							createdAt: item.created_at,
							updatedAt: item.updated_at,
							author: item.user ? {
								login: item.user.login,
								avatarUrl: item.user.avatar_url
							} : undefined,
							repository: {
								name: repoMatch[2],
								owner: {
									login: repoMatch[1]
								}
							},
							isDraft: item.draft || false
						});
					}
				}
			} else {
				console.error('[ERROR] Created PRs fetch failed:', createdResponse.status);
			}

			// Fetch review-requested PRs
			const reviewRequestedResponse = await fetch('https://api.github.com/search/issues?q=type:pr+state:open+review-requested:@me&sort=updated&order=desc&per_page=100', {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'Dashboard-App'
				}
			});

			if (reviewRequestedResponse.ok) {
				const reviewRequestedResult = await reviewRequestedResponse.json();
				console.log('[DEBUG] Review-requested PRs response:', reviewRequestedResult.total_count, 'found');

				for (const item of reviewRequestedResult.items || []) {
					const repoMatch = item.repository_url?.match(/\/repos\/([^\/]+)\/([^\/]+)$/);
					if (repoMatch) {
						reviewRequestedPRs.push({
							id: item.node_id,
							number: item.number,
							title: item.title,
							url: item.html_url,
							state: item.state.toUpperCase(),
							createdAt: item.created_at,
							updatedAt: item.updated_at,
							author: item.user ? {
								login: item.user.login,
								avatarUrl: item.user.avatar_url
							} : undefined,
							repository: {
								name: repoMatch[2],
								owner: {
									login: repoMatch[1]
								}
							},
							isDraft: item.draft || false
						});
					}
				}
			} else {
				console.error('[ERROR] Review-requested PRs fetch failed:', reviewRequestedResponse.status);
			}

			console.log('[DEBUG] Final Assigned PRs count:', assignedPRs.length);
			console.log('[DEBUG] Final Created PRs count:', createdPRs.length);
			console.log('[DEBUG] Final Review-requested PRs count:', reviewRequestedPRs.length);
		} catch (error) {
			console.error('[ERROR] Failed to fetch Pull Requests:', error);
		}

		// Fetch Copilot usage metrics for organizations
		const copilotMetrics: OrganizationMetrics[] = [];

		try {
			// Get list of organizations the user belongs to
			const orgsForCopilot = organizationProjects.map(op => op.organization.login);

			// Fetch Copilot metrics for each organization
			for (const orgName of orgsForCopilot) {
				try {
					// Calculate date 28 days ago for the since parameter
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
						copilotMetrics.push({
							organization: orgName,
							metrics
						});
						console.log(`[DEBUG] Copilot metrics for ${orgName}:`, metrics.length, 'days of data');
					} else if (metricsResponse.status === 403) {
						console.log(`[DEBUG] No Copilot access for org ${orgName} (403 Forbidden)`);
						copilotMetrics.push({
							organization: orgName,
							metrics: [],
							error: 'No permission to view Copilot metrics'
						});
					} else if (metricsResponse.status === 404) {
						console.log(`[DEBUG] Copilot not enabled for org ${orgName} (404)`);
					} else if (metricsResponse.status === 422) {
						console.log(`[DEBUG] Copilot Metrics API disabled for org ${orgName} (422)`);
						copilotMetrics.push({
							organization: orgName,
							metrics: [],
							error: 'Copilot Metrics API is disabled for this organization'
						});
					} else {
						console.error(`[ERROR] Copilot metrics fetch failed for ${orgName}:`, metricsResponse.status);
					}
				} catch (orgError) {
					console.error(`[ERROR] Failed to fetch Copilot metrics for ${orgName}:`, orgError);
				}
			}

			console.log('[DEBUG] Total organizations with Copilot metrics:', copilotMetrics.length);
		} catch (error) {
			console.error('[ERROR] Failed to fetch Copilot metrics:', error);
		}

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
