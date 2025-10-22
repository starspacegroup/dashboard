<script lang="ts">
	// Placeholder calendar widget
	const today = new Date();
	const events = [
		{ time: '9:00 AM', title: 'Team Standup', color: '#4299e1' },
		{ time: '11:00 AM', title: 'Client Meeting', color: '#f56565' },
		{ time: '2:00 PM', title: 'Code Review', color: '#48bb78' }
	];
</script>

<div class="calendar-widget">
	<div class="calendar-date">
		<div class="day-name">{today.toLocaleDateString('en-US', { weekday: 'long' })}</div>
		<div class="date-number">{today.getDate()}</div>
		<div class="month-year">
			{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
		</div>
	</div>
	<div class="events">
		{#each events as event}
			<div class="event" style="border-left-color: {event.color}">
				<div class="event-time">{event.time}</div>
				<div class="event-title">{event.title}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.calendar-widget {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.calendar-date {
		text-align: center;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.day-name {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.date-number {
		font-size: 2.5rem;
		font-weight: bold;
		line-height: 1;
		margin: 0.25rem 0;
	}

	.month-year {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.events {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.event {
		padding: 0.5rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.25rem;
		border-left: 3px solid;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.event-time {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.event-title {
		font-weight: 500;
	}
</style>
