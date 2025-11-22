<script lang="ts">
	import { onMount } from 'svelte';
	import { widgets } from '$lib/stores/widgets';
	import type { Widget } from '$lib/types/widget';

	type ViewMode = 'days' | 'months' | 'years' | 'decades';

	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonth = today.getMonth();
	const currentDay = today.getDate();

	let viewMode: ViewMode = 'days';
	let selectedYear = currentYear;
	let selectedMonth = currentMonth;
	let selectedDecade = Math.floor(currentYear / 10) * 10;

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Get ordinal suffix for day (1st, 2nd, 3rd, etc.)
	function getOrdinalSuffix(day: number): string {
		if (day > 3 && day < 21) return 'th';
		switch (day % 10) {
			case 1: return 'st';
			case 2: return 'nd';
			case 3: return 'rd';
			default: return 'th';
		}
	}

	// Format today's date as "Today: 2025 October 23rd"
	const todayFormatted = `(Today: ${currentYear} ${monthNames[currentMonth]} ${currentDay}${getOrdinalSuffix(currentDay)})`;

	// Update the calendar widget title on mount
	onMount(() => {
		widgets.updateTitle('calendar-1', `Calendar ${todayFormatted}`);
	});

	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfMonth(year: number, month: number): number {
		return new Date(year, month, 1).getDay();
	}

	function generateCalendarDays(year: number, month: number): Array<{ day: number | null; isCurrentMonth: boolean; isToday: boolean }> {
		const daysInMonth = getDaysInMonth(year, month);
		const firstDay = getFirstDayOfMonth(year, month);
		const daysInPrevMonth = month === 0 
			? getDaysInMonth(year - 1, 11)
			: getDaysInMonth(year, month - 1);

		const days: Array<{ day: number | null; isCurrentMonth: boolean; isToday: boolean }> = [];

		// Previous month's days
		for (let i = firstDay - 1; i >= 0; i--) {
			days.push({
				day: daysInPrevMonth - i,
				isCurrentMonth: false,
				isToday: false
			});
		}

		// Current month's days
		for (let day = 1; day <= daysInMonth; day++) {
			const isToday = 
				year === currentYear &&
				month === currentMonth &&
				day === currentDay;
			
			days.push({
				day,
				isCurrentMonth: true,
				isToday
			});
		}

		// Next month's days to fill the grid
		const remainingDays = 42 - days.length; // 6 rows * 7 days
		for (let day = 1; day <= remainingDays; day++) {
			days.push({
				day,
				isCurrentMonth: false,
				isToday: false
			});
		}

		return days;
	}

	function previousMonth() {
		if (selectedMonth === 0) {
			selectedMonth = 11;
			selectedYear--;
		} else {
			selectedMonth--;
		}
	}

	function nextMonth() {
		if (selectedMonth === 11) {
			selectedMonth = 0;
			selectedYear++;
		} else {
			selectedMonth++;
		}
	}

	function previousYear() {
		selectedYear--;
	}

	function nextYear() {
		selectedYear++;
	}

	function previousDecade() {
		selectedDecade -= 10;
	}

	function nextDecade() {
		selectedDecade += 10;
	}

	function previousCentury() {
		selectedDecade -= 100;
	}

	function nextCentury() {
		selectedDecade += 100;
	}

	function goToToday() {
		selectedYear = currentYear;
		selectedMonth = currentMonth;
		selectedDecade = Math.floor(currentYear / 10) * 10;
		viewMode = 'days';
	}

	function selectMonth(month: number) {
		selectedMonth = month;
		viewMode = 'days';
	}

	function selectYear(year: number) {
		selectedYear = year;
		viewMode = 'months';
	}

	function selectDecade(startYear: number) {
		selectedDecade = startYear;
		viewMode = 'years';
	}

	function toggleViewMode() {
		if (viewMode === 'days') viewMode = 'months';
		else if (viewMode === 'months') viewMode = 'years';
		else if (viewMode === 'years') viewMode = 'decades';
		else viewMode = 'days';
	}

	// Reactive statements - explicitly depend on selectedYear and selectedMonth
	$: calendarDays = generateCalendarDays(selectedYear, selectedMonth);
	$: yearRange = Array.from({ length: 10 }, (_, i) => selectedDecade + i);
	$: decadeRanges = Array.from({ length: 10 }, (_, i) => {
		const start = selectedDecade + (i * 10);
		return { start, end: start + 9 };
	});
</script>

<div class="calendar-widget">
	<!-- Calendar Header -->
	<div class="calendar-header">
		<button class="nav-button" on:click={viewMode === 'days' ? previousMonth : viewMode === 'months' ? previousYear : viewMode === 'years' ? previousDecade : previousCentury}>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>
		
		<button class="header-title" on:click={toggleViewMode}>
			{#if viewMode === 'days'}
				{monthNames[selectedMonth]} {selectedYear}
			{:else if viewMode === 'months'}
				{selectedYear}
			{:else if viewMode === 'years'}
				{selectedDecade} - {selectedDecade + 9}
			{:else}
				{selectedDecade} - {selectedDecade + 99}
			{/if}
		</button>
		
		<button class="nav-button" on:click={viewMode === 'days' ? nextMonth : viewMode === 'months' ? nextYear : viewMode === 'years' ? nextDecade : nextCentury}>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</div>

	<!-- Today Button -->
	<button class="today-button" on:click={goToToday}>Today</button>

	<!-- Days View -->
	{#if viewMode === 'days'}
		<div class="calendar-grid">
			<!-- Day Headers -->
			{#each dayNames as dayName}
				<div class="day-header">{dayName}</div>
			{/each}
			
			<!-- Calendar Days -->
			{#each calendarDays as { day, isCurrentMonth, isToday }}
				<div 
					class="calendar-day" 
					class:other-month={!isCurrentMonth}
					class:today={isToday}
				>
					{day}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Months View -->
	{#if viewMode === 'months'}
		<div class="months-grid">
			{#each monthNames as monthName, index}
				<button 
					class="month-item"
					class:current={index === currentMonth && selectedYear === currentYear}
					class:selected={index === selectedMonth}
					on:click={() => selectMonth(index)}
				>
					{monthName.substring(0, 3)}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Years View -->
	{#if viewMode === 'years'}
		<div class="years-grid">
			{#each yearRange as year}
				<button 
					class="year-item"
					class:current={year === currentYear}
					class:selected={year === selectedYear}
					on:click={() => selectYear(year)}
				>
					{year}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Decades View -->
	{#if viewMode === 'decades'}
		<div class="decades-grid">
			{#each decadeRanges as { start, end }}
				<button 
					class="decade-item"
					class:current={currentYear >= start && currentYear <= end}
					class:selected={selectedYear >= start && selectedYear <= end}
					on:click={() => selectDecade(start)}
				>
					{start} - {end}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.calendar-widget {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	/* Calendar Header */
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		min-width: 36px;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: 0;
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.nav-button:hover {
		background: var(--primary-color);
		border-color: var(--primary-color);
		color: var(--surface);
	}

	.header-title {
		flex: 1;
		padding: 0.5rem 1rem;
		min-width: 0;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: 0;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.header-title:hover {
		border-color: var(--primary-color);
		color: var(--primary-color);
	}

	/* Today Button */
	.today-button {
		width: 100%;
		padding: 0.5rem;
		background: color-mix(in srgb, var(--primary-color) 15%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
		border-radius: 6px;
		color: var(--primary-color);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.today-button:hover {
		background: color-mix(in srgb, var(--primary-color) 25%, transparent);
		border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
	}

	/* Calendar Grid - Days View */
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 3px;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}

	.day-header {
		padding: 0.5rem 0.25rem;
		text-align: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.calendar-day {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-primary);
		transition: all var(--transition-fast) var(--ease-out);
		cursor: pointer;
		min-width: 0;
	}

	.calendar-day:hover {
		background: var(--surface-variant);
		border-color: var(--primary-color);
	}

	.calendar-day.other-month {
		color: var(--text-secondary);
		background: var(--surface-variant);
		opacity: 0.4;
	}

	.calendar-day.today {
		background: var(--primary-color);
		border-color: var(--primary-color);
		color: var(--surface);
		font-weight: 700;
	}

	/* Months Grid */
	.months-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		width: 100%;
	}

	.month-item {
		padding: 1rem;
		min-width: 0;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: 0;
		color: var(--text-primary);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.month-item:hover {
		background: var(--primary-color);
		border-color: var(--primary-color);
		color: var(--surface);
	}

	.month-item.current {
		border-color: var(--primary-color);
	}

	.month-item.selected {
		background: var(--primary-color);
		border-color: var(--primary-color);
		color: var(--surface);
	}

	/* Years Grid */
	.years-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		width: 100%;
	}

	.year-item {
		padding: 1rem;
		min-width: 0;
		background: var(--surface);
		border: 2px solid var(--border);
		border-radius: 0;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-out);
	}

	.year-item:hover {
		background: var(--surface-container-high);
		border-color: var(--outline-variant);
	}

	.year-item.current {
		border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
	}

	.year-item.selected {
		background: color-mix(in srgb, var(--primary-color) 20%, transparent);
		border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
	}

	/* Decades Grid */
	.decades-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.decade-item {
		padding: 1rem;
		background: var(--surface-variant);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.decade-item:hover {
		background: var(--surface-container-high);
		border-color: var(--outline-variant);
	}

	.decade-item.current {
		border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
	}

	.decade-item.selected {
		background: color-mix(in srgb, var(--primary-color) 20%, transparent);
		border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.calendar-grid {
			gap: 2px;
		}

		.calendar-day {
			font-size: 0.7rem;
			padding: 0.2rem;
		}

		.day-header {
			font-size: 0.6rem;
			padding: 0.3rem 0.1rem;
		}

		.nav-button {
			width: 44px;
			height: 44px;
			min-width: 44px;
		}

		.header-title {
			font-size: 0.75rem;
			padding: 0.5rem;
		}

		.month-item,
		.year-item,
		.decade-item {
			padding: 0.75rem 0.5rem;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.calendar-grid {
			gap: 1px;
		}

		.calendar-day {
			font-size: 0.65rem;
			padding: 0.15rem;
		}

		.day-header {
			font-size: 0.55rem;
			padding: 0.25rem 0;
		}

		.header-title {
			font-size: 0.7rem;
		}

		.months-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.month-item,
		.year-item,
		.decade-item {
			padding: 0.625rem;
			font-size: 0.7rem;
		}
	}
</style>
