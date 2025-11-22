<script lang="ts">
	interface GitHubProject {
		id: string;
		number: number;
		title: string;
		url: string;
		shortDescription?: string;
		public: boolean;
		closed: boolean;
		ownerType: string; // 'User' or 'Organization'
		ownerLogin: string;
		ownerAvatarUrl?: string;
		updatedAt: string;
	}

	export let projects: GitHubProject[] = [];
	export let isLoggedIn: boolean = false;

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="github-projects-widget">
	{#if !isLoggedIn}
		<div class="empty-state">
			<div class="empty-icon">🔒</div>
			<p>Log in to GitHub to see your Projects</p>
			<a href="/auth/signin" class="login-button">Sign in with GitHub</a>
		</div>
	{:else if projects.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📊</div>
			<p>No GitHub Projects found</p>
			<p class="empty-hint">Create projects on GitHub to see them here</p>
		</div>
	{:else}
		<div class="projects-grid">
			{#each projects as project}
				<a href={project.url} target="_blank" rel="noopener noreferrer" class="project-card">
					<div class="project-header">
						<div class="owner-info">
							{#if project.ownerAvatarUrl}
								<img src={project.ownerAvatarUrl} alt={project.ownerLogin} class="owner-avatar" />
							{/if}
							<span class="owner-login">{project.ownerLogin}</span>
						</div>
						{#if project.closed}
							<span class="status-badge closed">Closed</span>
						{:else}
							<span class="status-badge open">Open</span>
						{/if}
					</div>
					<div class="project-title">{project.title}</div>
					{#if project.shortDescription}
						<div class="project-description">{project.shortDescription}</div>
					{/if}
					<div class="project-footer">
						<span class="project-number">#{project.number}</span>
						<span class="project-visibility">{project.public ? '🌐 Public' : '🔒 Private'}</span>
						<span class="project-updated">Updated {formatDate(project.updatedAt)}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.github-projects-widget {
		max-height: 500px;
		overflow-y: auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
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
		opacity: 0.7;
	}

	.login-button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background-color: var(--primary-color);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 500;
		transition: all 0.2s ease;
		display: inline-block;
	}

	.login-button:hover {
		background-color: var(--primary-color-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px var(--shadow-hover);
	}

	.projects-grid {
		display: grid;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.project-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.project-card:hover {
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px var(--shadow);
		transform: translateY(-2px);
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.owner-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.owner-avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
	}

	.owner-login {
		font-weight: 500;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.open {
		background-color: var(--success-bg);
		color: var(--success);
	}

	.status-badge.closed {
		background-color: var(--gray-bg);
		color: var(--gray);
	}

	.project-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.project-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.project-footer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding-top: 0.25rem;
		border-top: 1px solid var(--border);
	}

	.project-number {
		font-weight: 600;
		color: var(--primary-color);
	}

	.project-visibility {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.project-updated {
		margin-left: auto;
	}

	/* Scrollbar styling */
	.github-projects-widget::-webkit-scrollbar {
		width: 8px;
	}

	.github-projects-widget::-webkit-scrollbar-track {
		background: transparent;
	}

	.github-projects-widget::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 4px;
	}

	.github-projects-widget::-webkit-scrollbar-thumb:hover {
		background: var(--text-secondary);
	}
</style>
