<script lang="ts">
	interface LanguageMetric {
		name: string;
		total_engaged_users: number;
		total_code_suggestions?: number;
		total_code_acceptances?: number;
		total_code_lines_suggested?: number;
		total_code_lines_accepted?: number;
	}

	interface EditorMetric {
		name: string;
		total_engaged_users: number;
		models?: {
			name: string;
			is_custom_model: boolean;
			total_engaged_users: number;
			languages?: LanguageMetric[];
		}[];
	}

	interface CopilotMetric {
		date: string;
		total_active_users: number;
		total_engaged_users: number;
		copilot_ide_code_completions?: {
			total_engaged_users: number;
			languages?: LanguageMetric[];
			editors?: EditorMetric[];
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

	export let copilotMetrics: OrganizationMetrics[] = [];
	export let isLoggedIn: boolean = false;

	let selectedOrg: string = '';
	let selectedView: 'overview' | 'completions' | 'chat' = 'overview';

	// Set first org as selected when metrics load
	$: if (copilotMetrics.length > 0 && !selectedOrg) {
		selectedOrg = copilotMetrics[0].organization;
	}

	$: currentOrgData = copilotMetrics.find(m => m.organization === selectedOrg);
	$: hasData = currentOrgData && currentOrgData.metrics && currentOrgData.metrics.length > 0;

	// Get the latest metrics (most recent day)
	$: latestMetrics = hasData ? currentOrgData!.metrics[currentOrgData!.metrics.length - 1] : null;

	// Calculate aggregated data for the chart
	$: chartData = hasData
		? currentOrgData!.metrics.slice(-14).map(m => ({
				date: formatDate(m.date),
				activeUsers: m.total_active_users,
				engagedUsers: m.total_engaged_users,
				suggestions: getTotalSuggestions(m),
				acceptances: getTotalAcceptances(m)
			}))
		: [];

	// Calculate acceptance rate
	$: acceptanceRate = latestMetrics
		? calculateAcceptanceRate(latestMetrics)
		: 0;

	// Get top languages
	$: topLanguages = latestMetrics?.copilot_ide_code_completions?.languages?.slice(0, 5) || [];

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getTotalSuggestions(metric: CopilotMetric): number {
		let total = 0;
		metric.copilot_ide_code_completions?.editors?.forEach(editor => {
			editor.models?.forEach(model => {
				model.languages?.forEach(lang => {
					total += lang.total_code_suggestions || 0;
				});
			});
		});
		return total;
	}

	function getTotalAcceptances(metric: CopilotMetric): number {
		let total = 0;
		metric.copilot_ide_code_completions?.editors?.forEach(editor => {
			editor.models?.forEach(model => {
				model.languages?.forEach(lang => {
					total += lang.total_code_acceptances || 0;
				});
			});
		});
		return total;
	}

	function calculateAcceptanceRate(metric: CopilotMetric): number {
		const suggestions = getTotalSuggestions(metric);
		const acceptances = getTotalAcceptances(metric);
		if (suggestions === 0) return 0;
		return Math.round((acceptances / suggestions) * 100);
	}

	function getMaxValue(data: typeof chartData, key: 'activeUsers' | 'engagedUsers' | 'suggestions' | 'acceptances'): number {
		return Math.max(...data.map(d => d[key]), 1);
	}
</script>

<div class="copilot-usage-widget">
	{#if !isLoggedIn}
		<div class="empty-state">
			<div class="empty-icon">🤖</div>
			<p>Log in to GitHub to see Copilot usage</p>
			<a href="/auth/signin" class="login-button">Sign in with GitHub</a>
		</div>
	{:else if copilotMetrics.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📊</div>
			<p>No Copilot usage data available</p>
			<p class="empty-hint">You need to be an owner of an organization with Copilot Business or Enterprise</p>
		</div>
	{:else}
		<div class="widget-header">
			{#if copilotMetrics.length > 1}
				<select class="org-selector" bind:value={selectedOrg}>
					{#each copilotMetrics as orgData}
						<option value={orgData.organization}>{orgData.organization}</option>
					{/each}
				</select>
			{:else}
				<span class="org-name">{selectedOrg}</span>
			{/if}
			
			<div class="view-tabs">
				<button
					class="tab"
					class:active={selectedView === 'overview'}
					on:click={() => selectedView = 'overview'}
				>
					Overview
				</button>
				<button
					class="tab"
					class:active={selectedView === 'completions'}
					on:click={() => selectedView = 'completions'}
				>
					Completions
				</button>
				<button
					class="tab"
					class:active={selectedView === 'chat'}
					on:click={() => selectedView = 'chat'}
				>
					Chat
				</button>
			</div>
		</div>

		{#if currentOrgData?.error}
			<div class="error-state">
				<p>⚠️ {currentOrgData.error}</p>
			</div>
		{:else if !hasData}
			<div class="empty-state">
				<div class="empty-icon">📈</div>
				<p>No metrics available for {selectedOrg}</p>
				<p class="empty-hint">Metrics require 5+ active Copilot users</p>
			</div>
		{:else if selectedView === 'overview'}
			<div class="overview-content">
				<div class="stats-grid">
					<div class="stat-card">
						<span class="stat-value">{latestMetrics?.total_active_users || 0}</span>
						<span class="stat-label">Active Users</span>
					</div>
					<div class="stat-card">
						<span class="stat-value">{latestMetrics?.total_engaged_users || 0}</span>
						<span class="stat-label">Engaged Users</span>
					</div>
					<div class="stat-card">
						<span class="stat-value">{acceptanceRate}%</span>
						<span class="stat-label">Acceptance Rate</span>
					</div>
				</div>

				<div class="chart-section">
					<h4 class="section-title">Activity (Last 14 Days)</h4>
					<div class="chart">
						{#each chartData as point, i}
							<div class="chart-bar-group">
								<div class="bars">
									<div
										class="bar active"
										style="height: {(point.activeUsers / getMaxValue(chartData, 'activeUsers')) * 100}%"
										title="Active: {point.activeUsers}"
									></div>
									<div
										class="bar engaged"
										style="height: {(point.engagedUsers / getMaxValue(chartData, 'engagedUsers')) * 100}%"
										title="Engaged: {point.engagedUsers}"
									></div>
								</div>
								<span class="chart-label">{point.date}</span>
							</div>
						{/each}
					</div>
					<div class="chart-legend">
						<span class="legend-item"><span class="legend-color active"></span> Active</span>
						<span class="legend-item"><span class="legend-color engaged"></span> Engaged</span>
					</div>
				</div>
			</div>
		{:else if selectedView === 'completions'}
			<div class="completions-content">
				{#if latestMetrics}
				<div class="stats-row">
					<div class="stat-card horizontal">
						<span class="stat-value">{getTotalSuggestions(latestMetrics).toLocaleString()}</span>
						<span class="stat-label">Suggestions</span>
					</div>
					<div class="stat-card horizontal">
						<span class="stat-value">{getTotalAcceptances(latestMetrics).toLocaleString()}</span>
						<span class="stat-label">Acceptances</span>
					</div>
				</div>
				{/if}

				{#if topLanguages.length > 0}
					<div class="languages-section">
						<h4 class="section-title">Top Languages</h4>
						<div class="language-list">
							{#each topLanguages as lang}
								<div class="language-item">
									<span class="language-name">{lang.name}</span>
									<span class="language-users">{lang.total_engaged_users} users</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="chart-section">
					<h4 class="section-title">Suggestions vs Acceptances</h4>
					<div class="chart">
						{#each chartData as point, i}
							<div class="chart-bar-group">
								<div class="bars">
									<div
										class="bar suggestions"
										style="height: {(point.suggestions / getMaxValue(chartData, 'suggestions')) * 100}%"
										title="Suggestions: {point.suggestions}"
									></div>
									<div
										class="bar acceptances"
										style="height: {(point.acceptances / getMaxValue(chartData, 'acceptances')) * 100}%"
										title="Acceptances: {point.acceptances}"
									></div>
								</div>
								<span class="chart-label">{point.date}</span>
							</div>
						{/each}
					</div>
					<div class="chart-legend">
						<span class="legend-item"><span class="legend-color suggestions"></span> Suggestions</span>
						<span class="legend-item"><span class="legend-color acceptances"></span> Acceptances</span>
					</div>
				</div>
			</div>
		{:else if selectedView === 'chat'}
			<div class="chat-content">
				{#if latestMetrics?.copilot_ide_chat || latestMetrics?.copilot_dotcom_chat}
					<div class="stats-row">
						<div class="stat-card horizontal">
							<span class="stat-value">{latestMetrics?.copilot_ide_chat?.total_engaged_users || 0}</span>
							<span class="stat-label">IDE Chat Users</span>
						</div>
						<div class="stat-card horizontal">
							<span class="stat-value">{latestMetrics?.copilot_dotcom_chat?.total_engaged_users || 0}</span>
							<span class="stat-label">Web Chat Users</span>
						</div>
					</div>

					{#if latestMetrics?.copilot_ide_chat?.editors}
						<div class="editors-section">
							<h4 class="section-title">Chat by Editor</h4>
							<div class="editor-list">
								{#each latestMetrics.copilot_ide_chat.editors as editor}
									<div class="editor-item">
										<span class="editor-name">{editor.name}</span>
										<span class="editor-users">{editor.total_engaged_users} users</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<div class="empty-state">
						<div class="empty-icon">💬</div>
						<p>No chat data available</p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.copilot-usage-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 350px;
		overflow: hidden;
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
		color: var(--text-primary);
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

	.widget-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border);
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.org-selector {
		background: var(--surface);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		appearance: none;
		cursor: pointer;
	}

	.org-selector:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: 2px;
	}

	.org-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.view-tabs {
		display: flex;
		gap: 0.25rem;
	}

	.tab {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tab:first-child {
		border-radius: 4px 0 0 4px;
	}

	.tab:last-child {
		border-radius: 0 4px 4px 0;
	}

	.tab:not(:last-child) {
		border-right: none;
	}

	.tab:hover {
		background: var(--surface-hover);
	}

	.tab.active {
		background: var(--primary-color);
		color: var(--background);
		border-color: var(--primary-color);
	}

	.error-state {
		padding: 1rem;
		color: var(--error);
		text-align: center;
	}

	.overview-content,
	.completions-content,
	.chat-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stats-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 4px;
	}

	.stat-card.horizontal {
		flex: 1;
		flex-direction: row;
		justify-content: center;
		gap: 0.5rem;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.75rem 0;
	}

	.chart-section {
		margin-top: 1rem;
	}

	.chart {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 100px;
		padding: 0.5rem 0;
	}

	.chart-bar-group {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}

	.bars {
		display: flex;
		gap: 2px;
		height: 80px;
		align-items: flex-end;
		width: 100%;
	}

	.bar {
		flex: 1;
		min-height: 2px;
		border-radius: 2px 2px 0 0;
		transition: height 0.3s ease;
	}

	.bar.active {
		background: var(--primary-color);
	}

	.bar.engaged {
		background: var(--info);
	}

	.bar.suggestions {
		background: var(--warning);
	}

	.bar.acceptances {
		background: var(--success);
	}

	.chart-label {
		font-size: 0.625rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.legend-color.active {
		background: var(--primary-color);
	}

	.legend-color.engaged {
		background: var(--info);
	}

	.legend-color.suggestions {
		background: var(--warning);
	}

	.legend-color.acceptances {
		background: var(--success);
	}

	.languages-section,
	.editors-section {
		margin-bottom: 1rem;
	}

	.language-list,
	.editor-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.language-item,
	.editor-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 4px;
	}

	.language-name,
	.editor-name {
		font-weight: 500;
		color: var(--text-primary);
		text-transform: capitalize;
	}

	.language-users,
	.editor-users {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Scrollbar styling */
	.overview-content::-webkit-scrollbar,
	.completions-content::-webkit-scrollbar,
	.chat-content::-webkit-scrollbar {
		width: 8px;
	}

	.overview-content::-webkit-scrollbar-track,
	.completions-content::-webkit-scrollbar-track,
	.chat-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.overview-content::-webkit-scrollbar-thumb,
	.completions-content::-webkit-scrollbar-thumb,
	.chat-content::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 4px;
	}

	.overview-content::-webkit-scrollbar-thumb:hover,
	.completions-content::-webkit-scrollbar-thumb:hover,
	.chat-content::-webkit-scrollbar-thumb:hover {
		background: var(--text-secondary);
	}
</style>
