<script lang="ts">
	import WeatherWidget from '$lib/components/WeatherWidget.svelte';
	import TrafficWidget from '$lib/components/TrafficWidget.svelte';
	import CalendarWidget from '$lib/components/CalendarWidget.svelte';
	import GithubWidget from '$lib/components/GithubWidget.svelte';
	import OrganizationProjectsWidget from '$lib/components/OrganizationProjectsWidget.svelte';
	import GithubProjectsWidget from '$lib/components/GithubProjectsWidget.svelte';
	import GithubPullRequestsWidget from '$lib/components/GithubPullRequestsWidget.svelte';
	import ColumnLayout from '$lib/components/ColumnLayout.svelte';
	import { widgets, sections } from '$lib/stores/widgets';
	import { onMount } from 'svelte';

	export let data;

	// Component mapping for ColumnLayout
	const widgetComponents = {
		WeatherWidget,
		TrafficWidget,
		CalendarWidget,
		GithubWidget,
		OrganizationProjectsWidget,
		GithubProjectsWidget,
		GithubPullRequestsWidget
	};

	// Load data on mount
	onMount(() => {
		widgets.load();
		sections.load();
	});
</script>

<svelte:head>
	<title>Dashboard</title>
	<meta name="description" content="Personal dashboard with widgets" />
</svelte:head>

<div class="dashboard">
	<ColumnLayout {widgetComponents} {data} />
</div>

<style>
	.dashboard {
		width: 100%;
		min-height: calc(100vh - 100px);
		position: relative;
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
