import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		return {
			githubProjects: []
		};
	}

	try {
		// Fetch user's GitHub repositories
		const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
			headers: {
				Accept: 'application/vnd.github.v3+json'
			}
		});

		if (response.ok) {
			const repos = await response.json();
			return {
				githubProjects: repos
			};
		}
	} catch (error) {
		console.error('Failed to fetch GitHub repos:', error);
	}

	return {
		githubProjects: []
	};
};
