<script lang="ts">
	import WeatherWidget from '$lib/components/WeatherWidget.svelte';
	import TrafficWidget from '$lib/components/TrafficWidget.svelte';
	import CalendarWidget from '$lib/components/CalendarWidget.svelte';
	import GithubWidget from '$lib/components/GithubWidget.svelte';
	import OrganizationProjectsWidget from '$lib/components/OrganizationProjectsWidget.svelte';
	import GithubProjectsWidget from '$lib/components/GithubProjectsWidget.svelte';
	import GithubPullRequestsWidget from '$lib/components/GithubPullRequestsWidget.svelte';
	import DataTableWidget from '$lib/components/DataTableWidget.svelte';
	import ColumnLayout from '$lib/components/ColumnLayout.svelte';
	import { widgets, sections } from '$lib/stores/widgets';
	import { commands } from '$lib/stores/commands';
	import { onMount, onDestroy } from 'svelte';

	export let data;

	// Component mapping for ColumnLayout
	const widgetComponents = {
		WeatherWidget,
		TrafficWidget,
		CalendarWidget,
		GithubWidget,
		OrganizationProjectsWidget,
		GithubProjectsWidget,
		GithubPullRequestsWidget,
		DataTableWidget
	};

	let isWidgetPickerOpen = false;

	let isLayoutPickerOpen = false;

	// Load data on mount
	onMount(() => {
		widgets.load();
		sections.load();

		// Add command to open widget picker
		commands.addCommand({
			id: 'add-widget',
			name: 'Add Widget',
			description: 'Add a new widget to your dashboard',
			category: 'custom',
			execute: () => {
				isWidgetPickerOpen = true;
			}
		});

		// Add command to open layout picker
		commands.addCommand({
			id: 'change-layout',
			name: 'Change Layout',
			description: 'Change the dashboard layout',
			category: 'custom',
			execute: () => {
				isLayoutPickerOpen = true;
			}
		});
	});

	onDestroy(() => {
		// Clean up commands when component unmounts
		commands.removeCommand('add-widget');
		commands.removeCommand('change-layout');
	});

	function closeWidgetPicker() {
		isWidgetPickerOpen = false;
	}

	function closeLayoutPicker() {
		isLayoutPickerOpen = false;
	}
</script>

<svelte:head>
	<title>Dashboard</title>
	<meta name="description" content="Personal dashboard with widgets" />
</svelte:head>

<div class="dashboard">
	<ColumnLayout 
		{widgetComponents} 
		{data} 
		{isWidgetPickerOpen}
		{isLayoutPickerOpen}
		onWidgetPickerClose={closeWidgetPicker}
		onLayoutPickerClose={closeLayoutPicker}
	/>
</div>

<style>
	.dashboard {
		width: 100%;
		max-width: 100vw;
		min-height: calc(100vh - 100px);
		position: relative;
		overflow-y: auto;
		overflow-x: hidden;
		box-sizing: border-box;
	}
</style>
