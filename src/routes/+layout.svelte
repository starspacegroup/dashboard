<script lang="ts">
	import '../app.css';

	export let data;
</script>

<div class="app">
	<header>
		<h1>Dashboard</h1>
		<nav>
			{#if data.user}
				<span>Welcome, {data.user.login || data.user.name || 'User'}!</span>
				<form method="POST" action="/auth/signout">
					<button type="submit">Sign Out</button>
				</form>
			{:else}
				<form method="POST" action="/auth/signin/github">
					<button type="submit">Sign in with GitHub</button>
				</form>
			{/if}
		</nav>
	</header>

	<main>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background-color: var(--surface);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
	}

	nav {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	nav span {
		color: var(--text-secondary);
	}

	button {
		background-color: var(--primary-color);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: opacity 0.2s;
	}

	button:hover {
		opacity: 0.8;
	}

	main {
		flex: 1;
		padding: 2rem;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
	}
</style>
