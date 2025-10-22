<script lang="ts">
	interface GithubProject {
		name: string;
		html_url: string;
		language?: string;
		description?: string;
		stargazers_count: number;
		forks_count: number;
		open_issues_count: number;
	}

	export let projects: GithubProject[] = [];
</script>

<div class="github-widget">
	{#if projects.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📦</div>
			<p>No personal repositories found</p>
			<p class="empty-hint">Create repositories on GitHub to see them here</p>
		</div>
	{:else}
		<div class="projects-grid">
			{#each projects as project}
				<a href={project.html_url} target="_blank" rel="noopener noreferrer" class="project-card">
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
	{/if}
</div>

<style>
	.github-widget {
		max-height: 400px;
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

	.projects-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.project-card {
		display: block;
		padding: 1rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.375rem;
		border: 1px solid var(--border);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.project-card:hover {
		background-color: rgba(0, 0, 0, 0.3);
		border-color: var(--primary-color);
		transform: translateY(-2px);
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.project-name {
		font-weight: 600;
		font-size: 1rem;
	}

	.project-language {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background-color: var(--primary-color);
		border-radius: 0.25rem;
	}

	.project-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	.project-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
</style>
