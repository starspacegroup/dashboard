<script lang="ts">
	import Widget from '$lib/components/Widget.svelte';
	import WeatherWidget from '$lib/components/WeatherWidget.svelte';
	import TrafficWidget from '$lib/components/TrafficWidget.svelte';
	import CalendarWidget from '$lib/components/CalendarWidget.svelte';
	import GithubWidget from '$lib/components/GithubWidget.svelte';
	import { widgets } from '$lib/stores/widgets';

	export let data;

	// Add GitHub widget if user is logged in and has projects
	$: if (data.user && data.githubProjects && data.githubProjects.length > 0) {
		const hasGithubWidget = $widgets.some((w) => w.type === 'github');
		if (!hasGithubWidget) {
			widgets.addWidget({
				id: 'github-1',
				type: 'github',
				title: 'GitHub Projects',
				position: { x: 340, y: 240 },
				size: { width: 620, height: 400 }
			});
		}
	}
</script>

<svelte:head>
	<title>Dashboard</title>
	<meta name="description" content="Personal dashboard with widgets" />
</svelte:head>

<div class="dashboard">
	<div class="widget-container">
		{#each $widgets as widget (widget.id)}
			<Widget {widget}>
				{#if widget.type === 'weather'}
					<WeatherWidget />
				{:else if widget.type === 'traffic'}
					<TrafficWidget />
				{:else if widget.type === 'calendar'}
					<CalendarWidget />
				{:else if widget.type === 'github'}
					<GithubWidget projects={data.githubProjects || []} />
				{/if}
			</Widget>
		{/each}
	</div>
</div>

<style>
	.dashboard {
		width: 100%;
		height: calc(100vh - 100px);
		position: relative;
	}

	.widget-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 800px;
	}
</style>
