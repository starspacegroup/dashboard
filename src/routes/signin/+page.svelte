<script lang="ts">
	// Deterministic star scatter (stable between SSR and hydration)
	const PAGE_STARS = Array.from({ length: 70 }, (_, i) => ({
		x: (i * 61.803) % 100,
		y: (i * 37.51) % 100,
		size: 1 + ((i * 7) % 3) * 0.8,
		dur: 2.4 + ((i * 13) % 12) * 0.5,
		delay: ((i * 29) % 50) / 10
	}));

	// Stars inside the globe's night sky
	const GLOBE_STARS = Array.from({ length: 10 }, (_, i) => ({
		x: 12 + ((i * 61.803) % 76),
		y: 8 + ((i * 37.51) % 55),
		dur: 2.2 + ((i * 11) % 8) * 0.4
	}));
</script>

<svelte:head>
	<title>Sign In - Dashboard</title>
	<meta name="description" content="Sign in to access your personal dashboard" />
</svelte:head>

<div class="signin-page">
	<!-- Ambient starfield -->
	<div class="page-stars" aria-hidden="true">
		{#each PAGE_STARS as s}
			<span
				class="page-star"
				style="left: {s.x}%; top: {s.y}%; width: {s.size}px; height: {s.size}px; animation-duration: {s.dur}s; animation-delay: {s.delay}s"
			></span>
		{/each}
	</div>

	<main class="signin-content">
		<!-- Miniature living sky: a full day cycle, sun and moon trading places -->
		<div class="mini-globe" aria-hidden="true">
			<div class="mini-orbit">
				<span class="mini-sun"></span>
				<span class="mini-moon"></span>
			</div>
			<div class="mini-earth">
				<div class="mini-sky night">
					{#each GLOBE_STARS as s}
						<span class="globe-star" style="left: {s.x}%; top: {s.y}%; animation-duration: {s.dur}s"></span>
					{/each}
				</div>
				<div class="mini-sky day"></div>
			</div>
		</div>

		<h1 class="brand">Dashboard</h1>
		<p class="tagline">
			Weather, calendar, projects, and traffic — your whole day on one screen.
		</p>

		<form method="POST" action="/auth/signin/github" class="signin-form">
			<button type="submit" class="github-signin-button">
				<svg class="github-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
					<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
				</svg>
				<span>Sign in with GitHub</span>
			</button>
		</form>

		<p class="signin-note">
			GitHub is used to sign you in and to show your repositories, pull requests, and projects.
		</p>

		<p class="legal">
			<a href="/terms-of-service">Terms of Service</a>
			<span class="dot">·</span>
			<a href="/privacy-policy">Privacy Policy</a>
		</p>
	</main>
</div>

<style>
	.signin-page {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background:
			radial-gradient(ellipse 80% 60% at 50% 30%, var(--primary-color-light), transparent 70%),
			var(--background);
		overflow: hidden;
	}

	.page-stars {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.page-star {
		position: absolute;
		border-radius: 50%;
		background: var(--text-secondary);
		animation: star-twinkle ease-in-out infinite alternate;
	}

	@keyframes star-twinkle {
		from {
			opacity: 0.1;
		}
		to {
			opacity: 0.7;
		}
	}

	.signin-content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 26rem;
		z-index: 1;
	}

	/* ─── Miniature living sky ─── */
	.mini-globe {
		position: relative;
		width: 150px;
		height: 150px;
		margin-bottom: 3.5rem;
	}

	.mini-orbit {
		position: absolute;
		inset: -26px;
		animation: orbit-spin 24s linear infinite;
	}

	.mini-sun,
	.mini-moon {
		position: absolute;
		left: 50%;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		transform: translateX(-50%);
	}

	.mini-sun {
		top: -13px;
		background: radial-gradient(circle, #ff9d5c 0%, #e8754a 100%);
		box-shadow: 0 0 24px rgba(255, 157, 92, 0.7);
	}

	.mini-moon {
		bottom: -13px;
		width: 20px;
		height: 20px;
		background: radial-gradient(circle at 42% 40%, #e8e4df 0%, #c2bbb0 100%);
		box-shadow: 0 0 12px rgba(220, 215, 205, 0.4);
	}

	/* Counter-rotate the bodies so their shading stays upright */
	.mini-sun,
	.mini-moon {
		animation: orbit-counter-spin 24s linear infinite;
	}

	@keyframes orbit-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes orbit-counter-spin {
		from {
			transform: translateX(-50%) rotate(0deg);
		}
		to {
			transform: translateX(-50%) rotate(-360deg);
		}
	}

	.mini-earth {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		overflow: hidden;
		box-shadow:
			0 8px 32px var(--shadow),
			0 0 34px rgba(110, 130, 210, 0.28);
	}

	/* Sphere depth, same language as the weather globe */
	.mini-earth::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(ellipse 60% 42% at 30% 16%, rgba(255, 255, 255, 0.14), transparent 70%);
		z-index: 2;
	}

	.mini-earth::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(circle at 50% 40%, transparent 55%, rgba(2, 4, 14, 0.2) 84%, rgba(2, 4, 16, 0.38) 100%);
		z-index: 2;
	}

	.mini-sky {
		position: absolute;
		inset: 0;
	}

	.mini-sky.night {
		background: linear-gradient(to top, #1b2440 0%, #0d1330 55%, #070b1e 100%);
	}

	.mini-sky.day {
		background: linear-gradient(to top, #d6e8f4 0%, #7eb0dc 46%, #2c6ec6 100%);
		animation: day-night 24s linear infinite;
	}

	/* Sun is up (rotation 0°=top) for the first half of the cycle */
	@keyframes day-night {
		0%, 38% {
			opacity: 1;
		}
		50%, 88% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	.globe-star {
		position: absolute;
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 3px rgba(255, 255, 255, 0.7);
		animation: star-twinkle ease-in-out infinite alternate;
	}

	/* ─── Copy ─── */
	.brand {
		font-size: 2.1rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--primary-color);
		margin: 0 0 0.75rem;
	}

	.tagline {
		color: var(--text-secondary);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 2.25rem;
		max-width: 22rem;
	}

	.signin-form {
		width: 100%;
		margin-bottom: 1.25rem;
	}

	.github-signin-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.95rem 1.5rem;
		background-color: var(--text-primary);
		color: var(--background);
		border: 1px solid var(--text-primary);
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s var(--ease-out, ease), box-shadow 0.15s var(--ease-out, ease), opacity 0.15s ease;
		box-shadow: 0 4px 16px var(--shadow);
	}

	.github-signin-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 24px var(--shadow);
		opacity: 0.92;
	}

	.github-signin-button:active {
		transform: translateY(0);
	}

	.github-signin-button:focus-visible {
		outline: 2px solid var(--primary-color);
		outline-offset: 3px;
	}

	.github-icon {
		flex-shrink: 0;
	}

	.signin-note {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0 0 1.5rem;
		max-width: 21rem;
	}

	.legal {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.legal .dot {
		margin: 0 0.5rem;
		opacity: 0.5;
	}

	.legal a {
		color: var(--text-secondary);
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-color: var(--border);
	}

	.legal a:hover {
		color: var(--primary-color);
	}

	@media (prefers-reduced-motion: reduce) {
		.page-star,
		.globe-star,
		.mini-orbit,
		.mini-sun,
		.mini-moon,
		.mini-sky.day {
			animation: none;
		}

		/* Frozen at noon: sun up, day sky visible */
		.mini-sky.day {
			opacity: 1;
		}
	}

	@media (max-width: 480px) {
		.mini-globe {
			width: 120px;
			height: 120px;
			margin-bottom: 2.75rem;
		}

		.brand {
			font-size: 1.75rem;
		}
	}
</style>
