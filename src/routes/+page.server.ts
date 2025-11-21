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

	console.log('[DEBUG] Session exists:', !!session);
	console.log('[DEBUG] User exists:', !!session?.user);
	console.log('[DEBUG] User login:', session?.user?.login);

	if (!session?.user) {
		console.log('[DEBUG] No user in session, returning empty');
		return {
			user: null,
			githubProjects: [],
			organizationProjects: [],
			allGithubProjects: [],
			assignedPRs: [],
			mentionedPRs: []
		};
	}

	try {
		// Get the user's access token from the session
		const accessToken = session.accessToken;
		console.log('[DEBUG] Access token exists:', !!accessToken);
		console.log('[DEBUG] Access token length:', accessToken?.length);

		if (!accessToken) {
			console.error('[ERROR] No access token in session!');
			return {
				user: session.user,
				githubProjects: [],
				organizationProjects: [],
				allGithubProjects: [],
				assignedPRs: [],
				mentionedPRs: []
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
			console.log('[DEBUG] Fetching GitHub Projects via GraphQL...');

			const graphqlResponse = await fetch('https://api.github.com/graphql', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					'User-Agent': 'Dashboard-App'
				},
				body: JSON.stringify({ query: projectsQuery })
			});

			console.log('[DEBUG] GraphQL Response Status:', graphqlResponse.status);
			console.log('[DEBUG] GraphQL Response OK:', graphqlResponse.ok);

			if (graphqlResponse.ok) {
				const result = await graphqlResponse.json();

				console.log('[DEBUG] GraphQL Response:', JSON.stringify(result, null, 2));

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
					console.log('User Projects:', userProjects);
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
							console.log(`Org (${org.login}) Projects:`, orgProjects);
							allGithubProjects.push(...orgProjects);
						}
					}
				}

				console.log('[DEBUG] Total GitHub Projects found:', allGithubProjects.length);
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

		// Fetch Pull Requests using GraphQL API
		const assignedPRs: GitHubPullRequest[] = [];
		const mentionedPRs: GitHubPullRequest[] = [];

		// GraphQL query to fetch assigned and mentioned PRs
		const pullRequestsQuery = `
			query {
				viewer {
					login
					pullRequests(first: 50, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
						nodes {
							id
							number
							title
							url
							state
							createdAt
							updatedAt
							isDraft
							author {
								login
								avatarUrl
							}
							repository {
								name
								owner {
									login
								}
							}
							assignees(first: 10) {
								nodes {
									login
								}
							}
							participants(first: 100) {
								nodes {
									login
								}
							}
						}
					}
				}
			}
		`;

		try {
			console.log('[DEBUG] Fetching Pull Requests via GraphQL...');

			const prGraphqlResponse = await fetch('https://api.github.com/graphql', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					'User-Agent': 'Dashboard-App'
				},
				body: JSON.stringify({ query: pullRequestsQuery })
			});

			console.log('[DEBUG] PR GraphQL Response Status:', prGraphqlResponse.status);

			if (prGraphqlResponse.ok) {
				const result = await prGraphqlResponse.json();

				if (result.errors) {
					console.error('PR GraphQL Errors:', result.errors);
				}

				if (result.data?.viewer?.pullRequests?.nodes) {
					const currentUserLogin = result.data.viewer.login;
					const pullRequests = result.data.viewer.pullRequests.nodes;

					for (const pr of pullRequests) {
						const prData: GitHubPullRequest = {
							id: pr.id,
							number: pr.number,
							title: pr.title,
							url: pr.url,
							state: pr.state,
							createdAt: pr.createdAt,
							updatedAt: pr.updatedAt,
							author: pr.author ? {
								login: pr.author.login,
								avatarUrl: pr.author.avatarUrl
							} : undefined,
							repository: {
								name: pr.repository.name,
								owner: {
									login: pr.repository.owner.login
								}
							},
							isDraft: pr.isDraft
						};

						// Check if user is assigned
						const isAssigned = pr.assignees?.nodes?.some((assignee: { login: string }) => assignee.login === currentUserLogin);
						
						// Check if user is mentioned (participant but not author)
						const isMentioned = pr.participants?.nodes?.some((participant: { login: string }) => 
							participant.login === currentUserLogin && participant.login !== pr.author?.login
						);

						if (isAssigned) {
							assignedPRs.push(prData);
						}
						if (isMentioned) {
							mentionedPRs.push(prData);
						}
					}

					console.log('[DEBUG] Assigned PRs found:', assignedPRs.length);
					console.log('[DEBUG] Mentioned PRs found:', mentionedPRs.length);
				}
			} else {
				const errorText = await prGraphqlResponse.text();
				console.error('[ERROR] PR GraphQL Response not OK:', prGraphqlResponse.status, errorText);
			}
		} catch (error) {
			console.error('[ERROR] Failed to fetch Pull Requests:', error);
		}

		return {
			user: session.user,
			githubProjects,
			organizationProjects,
			allGithubProjects,
			assignedPRs,
			mentionedPRs
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
		mentionedPRs: []
	};
};
