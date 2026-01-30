<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Sign In - Dashboard</title>
	<meta name="description" content="Sign in to access your personal dashboard" />
</svelte:head>

<div class="signin-container">
	<div class="signin-card">
		<div class="logo-section">
			<h1>Dashboard</h1>
			<p class="tagline">Your personal productivity hub</p>
		</div>

		<div class="divider"></div>

		<div class="content-section">
			<h2>Sign in required</h2>
			<p class="description">
				This dashboard requires GitHub authentication to access your personalized widgets, 
				weather data, traffic information, and GitHub integrations.
			</p>

			<div class="features">
				<div class="feature">
					<span class="feature-icon">🌤️</span>
					<span>Weather & Location</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🗺️</span>
					<span>Traffic Maps</span>
				</div>
				<div class="feature">
					<span class="feature-icon">📊</span>
					<span>GitHub Projects</span>
				</div>
				<div class="feature">
					<span class="feature-icon">📅</span>
					<span>Calendar</span>
				</div>
			</div>

			<form method="POST" action="/auth/signin/github" class="signin-form">
				<button type="submit" class="github-signin-button">
					<svg class="github-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
						<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
					</svg>
					<span>Sign in with GitHub</span>
				</button>
			</form>

			<p class="privacy-note">
				By signing in, you agree to our 
				<a href="/terms-of-service">Terms of Service</a> and 
				<a href="/privacy-policy">Privacy Policy</a>.
			</p>
		</div>
	</div>
</div>

<style>
	.signin-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background-color: var(--background);
	}

	.signin-card {
		background-color: var(--surface);
		border: 4px solid var(--border);
		box-shadow: 8px 8px 0 var(--shadow);
		padding: 3rem;
		max-width: 480px;
		width: 100%;
	}

	.logo-section {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.logo-section h1 {
		font-size: 2rem;
		font-weight: 900;
		letter-spacing: 0.05em;
		color: var(--primary-color);
		text-transform: uppercase;
		margin: 0;
	}

	.tagline {
		color: var(--muted);
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.divider {
		height: 4px;
		background-color: var(--primary-color);
		margin: 1.5rem 0;
	}

	.content-section {
		text-align: center;
	}

	.content-section h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.description {
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.feature {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--background);
		border: 2px solid var(--border);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--foreground);
	}

	.feature-icon {
		font-size: 1.25rem;
	}

	.signin-form {
		margin-bottom: 1.5rem;
	}

	.github-signin-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem 1.5rem;
		background-color: var(--foreground);
		color: var(--background);
		border: 3px solid var(--foreground);
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 4px 4px 0 var(--shadow-hover);
	}

	.github-signin-button:hover {
		background-color: var(--background);
		color: var(--foreground);
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 var(--shadow-hover);
	}

	.github-icon {
		flex-shrink: 0;
	}

	.privacy-note {
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.5;
	}

	.privacy-note a {
		color: var(--primary-color);
		text-decoration: none;
		font-weight: 600;
	}

	.privacy-note a:hover {
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.signin-card {
			padding: 2rem;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
