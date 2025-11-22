<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { commands, type Command } from '$lib/stores/commands';
	import { fly, fade } from 'svelte/transition';

	export let isOpen = false;
	export let onClose: () => void;

	let searchInput: HTMLInputElement;
	let searchQuery = '';
	let selectedIndex = 0;
	let filteredCommands: Command[] = [];
	let allCommands: Command[] = [];

	// Subscribe to commands store
	const unsubscribe = commands.subscribe(cmds => {
		allCommands = cmds;
		filterCommands();
	});

	$: {
		searchQuery;
		filterCommands();
	}

	function filterCommands() {
		if (!searchQuery.trim()) {
			filteredCommands = allCommands;
			selectedIndex = 0;
			return;
		}

		const query = searchQuery.toLowerCase().trim();
		
		// Check if it's a shortcut command (e.g., "g hello" or "am product")
		const shortcutMatch = query.match(/^(\w+)\s+(.+)$/);
		if (shortcutMatch) {
			const [, shortcut, searchTerm] = shortcutMatch;
			const matchingCommand = allCommands.find(cmd => cmd.shortcut === shortcut);
			if (matchingCommand) {
				filteredCommands = [{ ...matchingCommand, name: `${matchingCommand.name}: ${searchTerm}` }];
				selectedIndex = 0;
				return;
			}
		}

		// Regular search through command names and descriptions
		filteredCommands = allCommands.filter(cmd => 
			cmd.name.toLowerCase().includes(query) ||
			cmd.description.toLowerCase().includes(query) ||
			(cmd.shortcut && cmd.shortcut.toLowerCase().includes(query))
		);
		
		selectedIndex = 0;
	}

	function executeCommand(command: Command) {
		const query = searchQuery.trim();
		const shortcutMatch = query.match(/^(\w+)\s+(.+)$/);
		
		if (shortcutMatch && command.shortcut === shortcutMatch[1]) {
			// Execute with the search term
			command.execute(shortcutMatch[2]);
			closeAndReset();
		} else if (command.shortcut && command.category === 'search') {
			// For search commands without a query, insert the shortcut with a space
			searchQuery = `${command.shortcut} `;
			selectedIndex = 0;
			// Focus the input and move cursor to the end
			setTimeout(() => {
				if (searchInput) {
					searchInput.focus();
					searchInput.setSelectionRange(searchQuery.length, searchQuery.length);
				}
			}, 0);
		} else {
			// Execute without parameters
			command.execute();
			closeAndReset();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation(); // Stop the event from bubbling to global handler
			// If search query is not empty, clear it first
			// If search query is empty, close the palette
			if (searchQuery.trim()) {
				searchQuery = '';
				selectedIndex = 0;
			} else {
				closeAndReset();
			}
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = (selectedIndex + 1) % filteredCommands.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = selectedIndex === 0 ? filteredCommands.length - 1 : selectedIndex - 1;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (filteredCommands.length > 0) {
				executeCommand(filteredCommands[selectedIndex]);
			}
		}
	}

	function closeAndReset() {
		searchQuery = '';
		selectedIndex = 0;
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeAndReset();
		}
	}

	$: if (isOpen && searchInput) {
		setTimeout(() => searchInput.focus(), 0);
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if isOpen}
	<div 
		class="command-palette-backdrop" 
		on:click={handleBackdropClick}
		transition:fade={{ duration: 150 }}
		role="presentation"
	>
		<div class="command-palette" transition:fly={{ y: -20, duration: 200 }}>
			<div class="search-container">
				<div class="search-icon">⌘</div>
				<input
					bind:this={searchInput}
					bind:value={searchQuery}
					on:keydown={handleKeyDown}
					type="text"
					placeholder="Type a command or search... (e.g., 'g hello' for Google)"
					class="search-input"
					autocomplete="off"
					spellcheck="false"
				/>
				<div class="escape-hint">ESC</div>
			</div>

			<div class="commands-list">
				{#if filteredCommands.length === 0}
					<div class="no-results">
						<div class="no-results-icon">🔍</div>
						<div class="no-results-text">No commands found</div>
					</div>
				{:else}
					{#each filteredCommands as command, index}
						<button
							class="command-item"
							class:selected={index === selectedIndex}
							on:click={() => executeCommand(command)}
							on:mouseenter={() => selectedIndex = index}
						>
							<div class="command-main">
								<div class="command-name">{command.name}</div>
								<div class="command-description">{command.description}</div>
							</div>
							{#if command.shortcut}
								<div class="command-shortcut">{command.shortcut}</div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>

			<div class="footer">
				<div class="footer-hint">
					<kbd>↑↓</kbd> Navigate
					<kbd>↵</kbd> Execute
					<kbd>ESC</kbd> Close
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.command-palette-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--overlay);
		z-index: 9999;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 15vh 1rem 1rem;
	}

	.command-palette {
		background-color: var(--surface);
		border-radius: 0;
		box-shadow: 8px 8px 0 var(--shadow-strong);
		width: 100%;
		max-width: 640px;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 4px solid var(--primary-color);
	}

	.search-container {
		display: flex;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 3px solid var(--primary-color);
		gap: 1rem;
		position: relative;
		background-color: var(--surface);
	}

	.search-icon {
		font-size: 1.5rem;
		color: var(--primary-color);
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 1.05rem;
		color: var(--text-primary);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--text-secondary);
		opacity: 0.7;
	}

	.escape-hint {
		font-size: 0.7rem;
		color: var(--text-secondary);
		padding: 0.375rem 0.625rem;
		background-color: var(--surface-variant);
		border-radius: 0.375rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		border: 1px solid var(--border);
		transition: all var(--transition-fast) var(--ease-out);
	}

	.escape-hint:hover {
		background-color: var(--primary-color-light);
		border-color: var(--primary-color);
		color: var(--primary-color);
	}

	.commands-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
	}

	.commands-list::-webkit-scrollbar {
		width: 10px;
	}

	.commands-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.commands-list::-webkit-scrollbar-thumb {
		background: var(--surface-variant);
		border-radius: 0.5rem;
		border: 2px solid var(--surface);
	}

	.commands-list::-webkit-scrollbar-thumb:hover {
		background: var(--border);
	}

	.command-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1.25rem;
		border: 2px solid transparent;
		border-radius: 0;
		background: transparent;
		cursor: pointer;
		transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
		text-align: left;
		gap: 1rem;
		position: relative;
	}

	.command-item:hover,
	.command-item.selected {
		background-color: var(--primary-color);
		color: var(--surface);
		border-color: var(--primary-color);
		box-shadow: 4px 4px 0 var(--shadow-hover);
		transform: translate(-2px, -2px);
	}

	.command-main {
		flex: 1;
		min-width: 0;
	}

	.command-name {
		font-size: 0.95rem;
		color: var(--text-primary);
		font-weight: 600;
		margin-bottom: 0.25rem;
		transition: color var(--transition-fast) var(--ease-out);
	}

	.command-item:hover .command-name,
	.command-item.selected .command-name {
		color: var(--surface);
	}

	.command-description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.command-shortcut {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.375rem 0.625rem;
		background-color: var(--surface-variant);
		border-radius: 0;
		font-family: monospace;
		font-weight: 600;
		border: 2px solid var(--border);
		transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.command-item:hover .command-shortcut,
	.command-item.selected .command-shortcut {
		background-color: var(--surface);
		border-color: var(--surface);
		color: var(--primary-color);
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 1rem;
		color: var(--text-secondary);
	}

	.no-results-icon {
		font-size: 3.5rem;
		margin-bottom: 1rem;
		opacity: 0.4;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.no-results-text {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.footer {
		border-top: 1px solid var(--border);
		padding: 1rem 1.5rem;
		background: linear-gradient(to bottom, transparent, var(--surface-variant));
	}

	.footer-hint {
		display: flex;
		gap: 1.25rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		align-items: center;
		flex-wrap: wrap;
	}

	kbd {
		background-color: var(--surface-container-high);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-family: monospace;
		font-size: 0.7rem;
		font-weight: 600;
		border: 1px solid var(--border);
		margin-right: 0.375rem;
		box-shadow: 0 2px 0 var(--border);
		transition: all var(--transition-fast) var(--ease-out);
	}

	kbd:hover {
		transform: translateY(-1px);
		box-shadow: 0 3px 0 var(--border);
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.command-palette-backdrop {
			padding: 10vh 0.75rem 0.75rem;
		}

		.command-palette {
			max-height: 75vh;
			border-radius: 0.875rem;
		}

		.search-container {
			padding: 1rem 1.25rem;
		}

		.search-input {
			font-size: 1rem;
		}

		.search-input::placeholder {
			font-size: 0.9rem;
		}

		.command-item {
			padding: 1rem 1rem;
		}

		.footer-hint {
			gap: 0.75rem;
			font-size: 0.75rem;
		}

		kbd {
			padding: 0.2rem 0.4rem;
		}
	}

	@media (max-width: 480px) {
		.command-palette-backdrop {
			padding: 5vh 0.5rem 0.5rem;
		}

		.search-container {
			padding: 0.875rem 1rem;
			gap: 0.75rem;
		}

		.escape-hint {
			display: none;
		}

		.command-item {
			padding: 0.875rem 0.875rem;
		}

		.command-description {
			display: none;
		}

		.footer {
			padding: 0.75rem 1rem;
		}
	}
</style>
