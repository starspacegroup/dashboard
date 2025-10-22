<script lang="ts">
	import WeatherWidget from '$lib/components/WeatherWidget.svelte';
	import TrafficWidget from '$lib/components/TrafficWidget.svelte';
	import CalendarWidget from '$lib/components/CalendarWidget.svelte';
	import GithubWidget from '$lib/components/GithubWidget.svelte';
	import OrganizationProjectsWidget from '$lib/components/OrganizationProjectsWidget.svelte';
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
		OrganizationProjectsWidget
	};

	// Load data on mount
	onMount(() => {
		widgets.load();
		sections.load();
	});

	// Add GitHub widget if user is logged in and has projects
	$: if (data.user && data.githubProjects && data.githubProjects.length > 0) {
		const hasGithubWidget = $widgets.some((w) => w.type === 'github');
		if (!hasGithubWidget) {
			// Find a section with fewer widgets
			const sectionCounts = $widgets.reduce((acc, w) => {
				acc[w.section] = (acc[w.section] || 0) + 1;
				return acc;
			}, {} as Record<number, number>);
			
			const targetSection = Object.keys(sectionCounts).length > 0 
				? parseInt(Object.keys(sectionCounts).reduce((a, b) => 
					(sectionCounts[parseInt(a)] || 0) < (sectionCounts[parseInt(b)] || 0) ? a : b
				)) 
				: 0;

			widgets.addWidget({
				id: 'github-1',
				type: 'github',
				title: 'Personal Repositories',
				section: targetSection,
				order: 0,
				size: { width: 0, height: 400 },
				collapsed: true
			});
		}
	}

	// Add Organization Projects widget if user is logged in and has organization projects
	$: if (data.user && data.organizationProjects && data.organizationProjects.length > 0) {
		const hasOrgProjectsWidget = $widgets.some((w) => w.type === 'organization-projects');
		if (!hasOrgProjectsWidget) {
			// Find a section with fewer widgets
			const sectionCounts = $widgets.reduce((acc, w) => {
				acc[w.section] = (acc[w.section] || 0) + 1;
				return acc;
			}, {} as Record<number, number>);
			
			const targetSection = Object.keys(sectionCounts).length > 0 
				? parseInt(Object.keys(sectionCounts).reduce((a, b) => 
					(sectionCounts[parseInt(a)] || 0) < (sectionCounts[parseInt(b)] || 0) ? a : b
				)) 
				: 1;

			widgets.addWidget({
				id: 'org-projects-1',
				type: 'organization-projects',
				title: 'Organization Projects',
				section: targetSection,
				order: 0,
				size: { width: 0, height: 500 },
				collapsed: true
			});
		}
	}
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
		height: calc(100vh - 100px);
		position: relative;
		overflow: hidden;
	}
</style>
