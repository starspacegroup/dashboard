<script lang="ts">
	// Placeholder weather widget
</script>

<div class="weather-widget">
	<div class="weather-icon">🌤️</div>
	<div class="weather-info">
		<div class="temperature">72°F</div>
		<div class="condition">Partly Cloudy</div>
		<div class="location">San Francisco, CA</div>
	</div>
</div>

<style>
	.weather-widget {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.weather-icon {
		font-size: 4rem;
	}

	.weather-info {
		flex: 1;
	}

	.temperature {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.condition {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}

	.location {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
</style>
