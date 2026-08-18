<script lang="ts">
	import type { Widget } from '$lib/types/widget';
	import { widgets } from '$lib/stores/widgets';

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

	interface GitHubOrganization {
		login: string;
		avatar_url: string;
		description?: string;
	}

	export let widget: Widget | undefined = undefined;
	export let assignedPRs: GitHubPullRequest[] = [];
	export let createdPRs: GitHubPullRequest[] = [];
	export let reviewRequestedPRs: GitHubPullRequest[] = [];
	export let organizationPRs: GitHubPullRequest[] = [];
	export let githubOrganizations: GitHubOrganization[] = [];
	export let isLoggedIn: boolean = false;

	type Scope = 'assigned' | 'created' | 'review-requested' | 'organizations' | 'all';
	type Draft = 'any' | 'ready' | 'draft';
	type Sort = 'updated' | 'created' | 'oldest' | 'title';

	const SCOPES: { id: Scope; label: string }[] = [
		{ id: 'assigned', label: 'Assigned' },
		{ id: 'created', label: 'Mine' },
		{ id: 'review-requested', label: 'To review' },
		{ id: 'organizations', label: 'Orgs' },
		{ id: 'all', label: 'All' }
	];

	// ─── Filter state, restored from the widget's saved config ───
	const saved = widget?.config?.pullRequests ?? {};
	let scope: Scope = saved.scope ?? 'assigned';
	let owner = saved.owner ?? '';
	let repo = saved.repo ?? '';
	let author = saved.author ?? '';
	let draft: Draft = saved.draft ?? 'any';
	let search = saved.search ?? '';
	let sort: Sort = saved.sort ?? 'updated';
	let pageSize = saved.pageSize ?? 5;
	let filtersOpen = false;

	/**
	 * Persist the filter set so a reload — or another device, via the sync
	 * engine — comes back to the same view.
	 *
	 * This goes through persisted widget state rather than a volatile store,
	 * because unlike a live title it IS deliberate user state. Debounced
	 * because the search box calls it on every keystroke, and each call
	 * rewrites the widget list and fires `dashboard-state-changed`; the sync
	 * engine debounces the KV write on top of this, so typing a word costs one
	 * write rather than one per letter. See planning/kv-write-amplification.md.
	 */
	let persistTimer: ReturnType<typeof setTimeout> | null = null;

	function persist() {
		if (!widget) return;
		if (persistTimer) clearTimeout(persistTimer);
		persistTimer = setTimeout(() => {
			widgets.updateWidgetConfig(widget!.id, {
				pullRequests: { scope, owner, repo, author, draft, search, sort, pageSize }
			});
		}, 400);
	}

	// ─── Scope → the list it draws from ───
	/** Same PR can be assigned to you *and* opened by you; collapse by id. */
	function dedupe(prs: GitHubPullRequest[]): GitHubPullRequest[] {
		const seen = new Set<string>();
		return prs.filter((pr) => {
			const key = pr.id || `${pr.repository.owner.login}/${pr.repository.name}#${pr.number}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	$: scopePRs =
		scope === 'assigned'
			? assignedPRs
			: scope === 'created'
				? createdPRs
				: scope === 'review-requested'
					? reviewRequestedPRs
					: scope === 'organizations'
						? organizationPRs
						: dedupe([...assignedPRs, ...createdPRs, ...reviewRequestedPRs, ...organizationPRs]);

	$: scopeCounts = {
		assigned: assignedPRs.length,
		created: createdPRs.length,
		'review-requested': reviewRequestedPRs.length,
		organizations: organizationPRs.length,
		all: dedupe([...assignedPRs, ...createdPRs, ...reviewRequestedPRs, ...organizationPRs]).length
	} as Record<Scope, number>;

	// ─── Filter options, derived from what's actually in scope ───
	// Offering an owner that has no PRs in the current scope just gives the user
	// a way to empty their own list, so every dropdown is built from the data.
	$: ownerOptions = [...new Set(scopePRs.map((pr) => pr.repository.owner.login))].sort();
	$: repoOptions = [
		...new Set(
			scopePRs
				.filter((pr) => !owner || pr.repository.owner.login === owner)
				.map((pr) => `${pr.repository.owner.login}/${pr.repository.name}`)
		)
	].sort();
	$: authorOptions = [
		...new Set(scopePRs.map((pr) => pr.author?.login).filter((l): l is string => !!l))
	].sort();

	// A filter pointing at something no longer in scope would silently show
	// nothing, so drop it when the scope changes underneath it.
	$: if (owner && !ownerOptions.includes(owner)) owner = '';
	$: if (repo && !repoOptions.includes(repo)) repo = '';
	$: if (author && !authorOptions.includes(author)) author = '';

	// ─── The filtered, sorted list ───
	$: filteredPRs = (() => {
		const needle = search.trim().toLowerCase();
		const out = scopePRs.filter((pr) => {
			const full = `${pr.repository.owner.login}/${pr.repository.name}`;
			if (owner && pr.repository.owner.login !== owner) return false;
			if (repo && full !== repo) return false;
			if (author && pr.author?.login !== author) return false;
			if (draft === 'ready' && pr.isDraft) return false;
			if (draft === 'draft' && !pr.isDraft) return false;
			if (needle) {
				const hay = `${pr.title} ${full} #${pr.number} ${pr.author?.login ?? ''}`.toLowerCase();
				if (!hay.includes(needle)) return false;
			}
			return true;
		});

		const by: Record<Sort, (a: GitHubPullRequest, b: GitHubPullRequest) => number> = {
			updated: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
			created: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
			oldest: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
			title: (a, b) => a.title.localeCompare(b.title)
		};
		return [...out].sort(by[sort]);
	})();

	$: activeFilterCount =
		(owner ? 1 : 0) + (repo ? 1 : 0) + (author ? 1 : 0) + (draft !== 'any' ? 1 : 0) + (search.trim() ? 1 : 0);

	function clearFilters() {
		owner = '';
		repo = '';
		author = '';
		draft = 'any';
		search = '';
		persist();
	}

	// ─── Paging ───
	let currentPage = 1;
	$: totalPages = Math.max(1, Math.ceil(filteredPRs.length / pageSize));
	// Narrowing the list can strand you past the end.
	$: if (currentPage > totalPages) currentPage = totalPages;
	$: paginatedPRs = filteredPRs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	// Any change to what's being listed starts over at the first page.
	$: if (scope || owner || repo || author || draft || search || sort) currentPage = 1;

	/** Page buttons, windowed so a 30-page list doesn't overflow the widget. */
	$: pageWindow = (() => {
		const span = 5;
		let start = Math.max(1, currentPage - Math.floor(span / 2));
		const end = Math.min(totalPages, start + span - 1);
		start = Math.max(1, end - span + 1);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	})();

	function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}

	function prevPage() {
		if (currentPage > 1) currentPage--;
	}

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

	function scopeEmptyHint(s: Scope): string {
		if (s === 'assigned') return "PRs you're assigned to will appear here";
		if (s === 'created') return 'PRs you opened will appear here';
		if (s === 'review-requested') return 'PRs waiting on your review will appear here';
		if (s === 'organizations') {
			return githubOrganizations.length
				? `Open PRs across ${githubOrganizations.map((o) => o.login).join(', ')} will appear here`
				: "You don't belong to any organizations on GitHub";
		}
		return 'Anything open that involves you or your orgs will appear here';
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
		<div class="scopes">
			{#each SCOPES as s}
				<!-- Orgs only mean something if you're in one. -->
				{#if s.id !== 'organizations' || githubOrganizations.length > 0}
					<button
						class="scope"
						class:active={scope === s.id}
						on:click={() => {
							scope = s.id;
							persist();
						}}
					>
						{s.label}<span class="scope-count">{scopeCounts[s.id]}</span>
					</button>
				{/if}
			{/each}
		</div>

		<div class="filter-bar">
			<input
				class="search"
				type="search"
				placeholder="Filter by title, repo or #number"
				bind:value={search}
				on:input={persist}
			/>
			<button
				class="filter-toggle"
				class:has-filters={activeFilterCount > 0}
				on:click={() => (filtersOpen = !filtersOpen)}
				aria-expanded={filtersOpen}
			>
				Filters{#if activeFilterCount > 0}<span class="filter-badge">{activeFilterCount}</span>{/if}
			</button>
		</div>

		{#if filtersOpen}
			<div class="filters">
				<label class="field">
					<span>Owner</span>
					<select bind:value={owner} on:change={persist}>
						<option value="">All owners</option>
						{#each ownerOptions as o}
							<option value={o}>{o}</option>
						{/each}
					</select>
				</label>

				<label class="field">
					<span>Repository</span>
					<select bind:value={repo} on:change={persist}>
						<option value="">All repos</option>
						{#each repoOptions as r}
							<option value={r}>{r}</option>
						{/each}
					</select>
				</label>

				<label class="field">
					<span>Author</span>
					<select bind:value={author} on:change={persist}>
						<option value="">Anyone</option>
						{#each authorOptions as a}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</label>

				<label class="field">
					<span>State</span>
					<select bind:value={draft} on:change={persist}>
						<option value="any">Draft & ready</option>
						<option value="ready">Ready for review</option>
						<option value="draft">Drafts only</option>
					</select>
				</label>

				<label class="field">
					<span>Sort</span>
					<select bind:value={sort} on:change={persist}>
						<option value="updated">Recently updated</option>
						<option value="created">Newest</option>
						<option value="oldest">Oldest</option>
						<option value="title">Title</option>
					</select>
				</label>

				<label class="field">
					<span>Per page</span>
					<select bind:value={pageSize} on:change={persist}>
						{#each [3, 5, 10, 20] as n}
							<option value={n}>{n}</option>
						{/each}
					</select>
				</label>

				{#if activeFilterCount > 0}
					<button class="clear-filters" on:click={clearFilters}>Clear filters</button>
				{/if}
			</div>
		{/if}

		{#if activeFilterCount > 0}
			<div class="result-count">
				{filteredPRs.length} of {scopePRs.length} shown
			</div>
		{/if}

		<div class="pr-list">
			{#if filteredPRs.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📋</div>
					{#if scopePRs.length > 0}
						<p>Nothing matches these filters</p>
						<button class="clear-filters inline" on:click={clearFilters}>Clear filters</button>
					{:else}
						<p>No pull requests here</p>
						<p class="empty-hint">{scopeEmptyHint(scope)}</p>
					{/if}
				</div>
			{:else}
				{#each paginatedPRs as pr (pr.id)}
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

		{#if totalPages > 1}
			<div class="pagination">
				<button class="pagination-btn" disabled={currentPage === 1} on:click={prevPage}>←</button>
				<div class="pagination-info">
					{#if pageWindow[0] > 1}<span class="page-ellipsis">…</span>{/if}
					{#each pageWindow as p}
						<button
							class="page-number"
							class:active={currentPage === p}
							on:click={() => (currentPage = p)}
						>
							{p}
						</button>
					{/each}
					{#if pageWindow[pageWindow.length - 1] < totalPages}
						<span class="page-ellipsis">…</span>
					{/if}
				</div>
				<button class="pagination-btn" disabled={currentPage === totalPages} on:click={nextPage}>→</button>
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

	/* Scope row: which query the list draws from. Wraps rather than scrolls,
	   because the widget can sit in a narrow column. */
	.scopes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
		background-color: var(--surface);
	}

	.scope {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.6rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		transition: background-color var(--transition-fast, 0.1s), color var(--transition-fast, 0.1s);
	}

	.scope:hover {
		background-color: var(--surface-hover);
		color: var(--text-primary);
	}

	.scope.active {
		background-color: var(--primary-color);
		color: var(--primary-color-text, #fff);
		border-color: var(--primary-color);
	}

	/* The count rides in a pill so the label stays readable when it hits 0. */
	.scope-count {
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		padding: 0.05rem 0.3rem;
		border-radius: 999px;
		background: var(--surface-variant);
		color: var(--text-secondary);
	}

	.scope.active .scope-count {
		background: rgba(255, 255, 255, 0.22);
		color: inherit;
	}

	.filter-bar {
		display: flex;
		gap: 0.4rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.search {
		flex: 1;
		min-width: 0;
		padding: 0.35rem 0.5rem;
		font-size: 0.78rem;
		color: var(--text-primary);
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	.search:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: 1px;
	}

	.filter-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.6rem;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
		color: var(--text-secondary);
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
	}

	.filter-toggle:hover {
		color: var(--text-primary);
	}

	/* An active filter is why the list looks short — say so on the button, so
	   a narrowed list never reads as an empty one. */
	.filter-toggle.has-filters {
		color: var(--primary-color);
		border-color: var(--primary-color);
	}

	.filter-badge {
		font-size: 0.65rem;
		padding: 0.05rem 0.3rem;
		border-radius: 999px;
		background: var(--primary-color);
		color: var(--primary-color-text, #fff);
	}

	.filters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(9rem, 100%), 1fr));
		gap: 0.5rem;
		padding: 0.6rem 0.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface-variant);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
	}

	.field select {
		width: 100%;
		min-width: 0;
		padding: 0.3rem 0.4rem;
		font-size: 0.78rem;
		text-transform: none;
		letter-spacing: normal;
		color: var(--text-primary);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 5px;
	}

	.field select:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: 1px;
	}

	.clear-filters {
		align-self: end;
		padding: 0.35rem 0.5rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--error);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 5px;
		cursor: pointer;
	}

	.clear-filters:hover {
		border-color: var(--error);
	}

	.clear-filters.inline {
		align-self: center;
		margin-top: 0.5rem;
	}

	.result-count {
		padding: 0.3rem 0.6rem 0;
		font-size: 0.68rem;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.page-ellipsis {
		color: var(--text-secondary);
		font-size: 0.75rem;
		padding: 0 0.15rem;
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
