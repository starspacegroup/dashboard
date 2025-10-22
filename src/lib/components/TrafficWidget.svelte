<script lang="ts">
	// Placeholder traffic widget
	const routes = [
		{ name: 'Home to Work', duration: '25 min', status: 'normal' },
		{ name: 'Downtown', duration: '15 min', status: 'heavy' },
		{ name: 'Airport', duration: '45 min', status: 'light' }
	];
</script>

<div class="traffic-widget">
	<div class="routes">
		{#each routes as route}
			<div class="route" data-status={route.status}>
				<div class="route-name">{route.name}</div>
				<div class="route-duration">{route.duration}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.traffic-widget {
		display: flex;
		flex-direction: column;
	}

	.routes {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.route {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.25rem;
		border-left: 3px solid var(--primary-color);
	}

	.route[data-status='heavy'] {
		border-left-color: #f56565;
	}

	.route[data-status='light'] {
		border-left-color: #48bb78;
	}

	.route-name {
		font-weight: 500;
	}

	.route-duration {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
</style>
