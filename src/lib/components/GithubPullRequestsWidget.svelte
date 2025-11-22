<script lang="ts">
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

	export let assignedPRs: GitHubPullRequest[] = [];
	export let createdPRs: GitHubPullRequest[] = [];
	export let reviewRequestedPRs: GitHubPullRequest[] = [];
	export let isLoggedIn: boolean = false;

	let activeTab: 'assigned' | 'created' | 'review-requested' = 'assigned';
	let currentPage = 1;
	const itemsPerPage = 3;

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

	$: activePRs = activeTab === 'assigned' ? assignedPRs : activeTab === 'created' ? createdPRs : reviewRequestedPRs;
	$: totalPages = Math.ceil(activePRs.length / itemsPerPage);
	$: paginatedPRs = activePRs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	// Reset to page 1 when switching tabs
	$: if (activeTab) {
		currentPage = 1;
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function goToPage(page: number) {
		currentPage = page;
	}
</script>

<div class="github-prs-widget">
	{#if !isLoggedIn}
		<div class="empty-state">
			<div class="empty-icon">🔒</div>
			<p>Log in to GitHub to see your Pull Requests</p>
			<a href="/auth/signin" class="login-button">Sign in with GitHub</a>
		</div>
	{:else}
		<div class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'assigned'}
				on:click={() => (activeTab = 'assigned')}
			>
				Assigned ({assignedPRs.length})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'created'}
				on:click={() => (activeTab = 'created')}
			>
				Created ({createdPRs.length})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'review-requested'}
				on:click={() => (activeTab = 'review-requested')}
			>
				Review Requests ({reviewRequestedPRs.length})
			</button>
		</div>

		<div class="pr-list">
			{#if activePRs.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📋</div>
					<p>No {activeTab === 'review-requested' ? 'review request' : activeTab} pull requests found</p>
					<p class="empty-hint">PRs you're {activeTab === 'assigned' ? 'assigned to' : activeTab === 'created' ? 'created' : 'requested to review'} will appear here</p>
				</div>
			{:else}
				{#each paginatedPRs as pr}
					<a href={pr.url} target="_blank" rel="noopener noreferrer" class="pr-card">
						<div class="pr-header">
							<div class="pr-meta">
								{#if pr.author?.avatarUrl}
									<img src={pr.author.avatarUrl} alt={pr.author.login} class="author-avatar" />
								{/if}
								<span class="repo-name">{pr.repository.owner.login}/{pr.repository.name}</span>
							</div>
							<div class="pr-badges">
								{#if pr.isDraft}
									<span class="badge draft">Draft</span>
								{/if}
								<span class="badge state {pr.state.toLowerCase()}">{pr.state}</span>
							</div>
						</div>
						<div class="pr-title">
							<span class="pr-number">#{pr.number}</span>
							{pr.title}
						</div>
						<div class="pr-footer">
							{#if pr.author}
								<span class="author">by {pr.author.login}</span>
							{/if}
							<span class="updated">Updated {formatDate(pr.updatedAt)}</span>
						</div>
					</a>
				{/each}
			{/if}
		</div>

		{#if activePRs.length > itemsPerPage}
			<div class="pagination">
				<button class="pagination-btn" disabled={currentPage === 1} on:click={prevPage}>
					←
				</button>
				<div class="pagination-info">
					{#each Array(totalPages) as _, i}
						<button
							class="page-number"
							class:active={currentPage === i + 1}
							on:click={() => goToPage(i + 1)}
						>
							{i + 1}
						</button>
					{/each}
				</div>
				<button class="pagination-btn" disabled={currentPage === totalPages} on:click={nextPage}>
					→
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.github-prs-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 300px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
		text-align: center;
		flex: 1;
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

	.tabs {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
		background-color: var(--surface);
	}

	.tab {
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.tab:hover {
		background-color: var(--surface-hover);
		color: var(--text-primary);
	}

	.tab.active {
		background-color: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	.pr-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.pr-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		margin-bottom: 0.75rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}

	.pr-card:hover {
		border-color: var(--primary-color);
		box-shadow: 0 2px 8px var(--shadow);
		transform: translateY(-2px);
	}

	.pr-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.pr-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.author-avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
	}

	.repo-name {
		font-weight: 500;
	}

	.pr-badges {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge.state.open {
		background-color: var(--success-bg);
		color: var(--success);
	}

	.badge.state.closed {
		background-color: var(--error-bg);
		color: var(--error);
	}

	.badge.state.merged {
		background-color: var(--purple-bg);
		color: var(--purple);
	}

	.badge.draft {
		background-color: var(--gray-bg);
		color: var(--gray);
	}

	.pr-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.pr-number {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.pr-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding-top: 0.25rem;
		border-top: 1px solid var(--border);
	}

	.author {
		font-weight: 500;
	}

	.updated {
		margin-left: auto;
	}

	/* Scrollbar styling */
	.pr-list::-webkit-scrollbar {
		width: 8px;
	}

	.pr-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.pr-list::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 4px;
	}

	.pr-list::-webkit-scrollbar-thumb:hover {
		background: var(--text-secondary);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid var(--border);
		background-color: var(--surface);
	}

	.pagination-btn {
		padding: 0.5rem 0.75rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		color: var(--text-primary);
		transition: all 0.2s ease;
	}

	.pagination-btn:hover:not(:disabled) {
		background-color: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	.pagination-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pagination-info {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.page-number {
		padding: 0.5rem 0.75rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--text-primary);
		min-width: 2.5rem;
		transition: all 0.2s ease;
	}

	.page-number:hover {
		background-color: var(--surface-hover);
		border-color: var(--primary-color);
	}

	.page-number.active {
		background-color: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
		font-weight: 600;
	}
</style>
