<script lang="ts">
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

	export let organizationProjects: OrganizationProjects[] = [];
</script>

<div class="organization-projects-widget">
	{#if organizationProjects.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🏢</div>
			<p>No organization projects found</p>
			<p class="empty-hint">Join organizations on GitHub to see their projects</p>
		</div>
	{:else}
		<div class="organizations-container">
			{#each organizationProjects as orgData}
				<div class="organization-section">
					<div class="organization-header">
						<img src={orgData.organization.avatar_url} alt="{orgData.organization.login} avatar" class="org-avatar" />
						<div class="org-info">
							<h3 class="org-name">{orgData.organization.login}</h3>
							{#if orgData.organization.description}
								<p class="org-description">{orgData.organization.description}</p>
							{/if}
						</div>
					</div>
					
					{#if orgData.repositories.length > 0}
						<div class="projects-grid">
							{#each orgData.repositories.slice(0, 6) as project}
								<a href={project.html_url} target="_blank" rel="noopener noreferrer" class="project-tile">
									<div class="project-header">
										<div class="project-name">{project.name}</div>
										{#if project.language}
											<div class="project-language">{project.language}</div>
										{/if}
									</div>
									{#if project.description}
										<div class="project-description">{project.description}</div>
									{/if}
									<div class="project-stats">
										<span>⭐ {project.stargazers_count}</span>
										<span>🍴 {project.forks_count}</span>
										{#if project.open_issues_count > 0}
											<span>📋 {project.open_issues_count}</span>
										{/if}
									</div>
								</a>
							{/each}
						</div>
						{#if orgData.repositories.length > 6}
							<div class="more-projects">
								<p>+ {orgData.repositories.length - 6} more projects</p>
							</div>
						{/if}
					{:else}
						<div class="no-projects">
							<p>No repositories found in this organization</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.organization-projects-widget {
		max-height: 500px;
		overflow-y: auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0.25rem 0;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.organizations-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.organization-section {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1rem;
		background-color: var(--surface-overlay);
	}

	.organization-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.org-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.org-info {
		flex: 1;
	}

	.org-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.org-description {
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.project-tile {
		display: block;
		padding: 0.875rem;
		background-color: var(--surface-overlay);
		border-radius: 0.375rem;
		border: 1px solid var(--border-subtle);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.project-tile:hover {
		background-color: var(--surface-overlay-medium);
		border-color: var(--primary-color);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px var(--shadow);
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.project-name {
		font-weight: 600;
		font-size: 0.9rem;
		line-height: 1.3;
		flex: 1;
	}

	.project-language {
		font-size: 0.7rem;
		padding: 0.125rem 0.4rem;
		background-color: var(--primary-color);
		border-radius: 0.25rem;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.project-description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.project-stats {
		display: flex;
		gap: 0.75rem;
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.no-projects {
		text-align: center;
		padding: 1rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	.more-projects {
		text-align: center;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.more-projects p {
		margin: 0;
	}
</style>