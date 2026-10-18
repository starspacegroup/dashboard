<script lang="ts">
	import { page } from '$app/stores';

	$: notFound = $page.status === 404;
	$: heading = notFound ? 'Page not found' : 'Something went wrong';
	$: detail = notFound
		? 'This page does not exist. The link may be old or mistyped.'
		: 'The dashboard hit an error. Try again in a moment.';
</script>

<svelte:head>
	<title>{$page.status} - Dashboard</title>
</svelte:head>

<main class="error-page">
	<p class="status">{$page.status}</p>
	<h2>{heading}</h2>
	<p class="detail">{detail}</p>
	<a class="home" href="/">Back to the dashboard</a>
</main>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 50vh;
		padding: 2rem 1rem;
		text-align: center;
		color: var(--text-primary);
	}

	.status {
		margin: 0;
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		color: var(--text-secondary);
	}

	h2 {
		margin: 0;
	}

	.detail {
		margin: 0 0 1rem;
		color: var(--text-secondary);
	}

	.home {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		background: var(--primary-color);
		color: var(--surface);
		text-decoration: none;
		font-weight: 600;
	}
</style>
