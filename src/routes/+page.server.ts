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
		return {
			user: null,
			githubProjects: [],
			organizationProjects: [],
			allGithubProjects: []
		};
	}

	try {
		// Get the user's access token from the session
		const accessToken = session.accessToken;
		if (!accessToken) {
			return {
				user: session.user,
				githubProjects: [],
				organizationProjects: [],
				allGithubProjects: []
			};
		}

		const headers = {
			Accept: 'application/vnd.github.v3+json',
			Authorization: `token ${accessToken}`
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
				},
				body: JSON.stringify({ query: projectsQuery })
			});

			if (graphqlResponse.ok) {
				const result = await graphqlResponse.json();

				console.log('GraphQL Response:', JSON.stringify(result, null, 2));

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

				console.log('Total GitHub Projects found:', allGithubProjects.length);
			} else {
				const errorText = await graphqlResponse.text();
				console.error('GraphQL Response not OK:', graphqlResponse.status, errorText);
			}
		} catch (error) {
			console.error('Failed to fetch GitHub Projects:', error);
		}

		return {
			user: session.user,
			githubProjects,
			organizationProjects,
			allGithubProjects
		};
	} catch (error) {
		console.error('Failed to fetch GitHub data:', error);
	}

	return {
		user: session?.user || null,
		githubProjects: [],
		organizationProjects: [],
		allGithubProjects: []
	};
};
