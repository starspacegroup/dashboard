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
			githubProjects: [],
			organizationProjects: []
		};
	}

	try {
		// Get the user's access token from the session
		const accessToken = session.accessToken;
		if (!accessToken) {
			return {
				githubProjects: [],
				organizationProjects: []
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

		return {
			githubProjects,
			organizationProjects
		};
	} catch (error) {
		console.error('Failed to fetch GitHub data:', error);
	}

	return {
		githubProjects: [],
		organizationProjects: []
	};
};
