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
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 9999;
		display: flex;
		justify-content: center;
		padding-top: 20vh;
	}

	.command-palette {
		background-color: var(--surface);
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 600px;
		max-height: 60vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--border);
	}

	.search-container {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
		gap: 0.75rem;
	}

	.search-icon {
		font-size: 1.25rem;
		color: var(--text-secondary);
		opacity: 0.5;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 1rem;
		color: var(--text-primary);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.escape-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-variant);
		border-radius: 4px;
		font-weight: 500;
	}

	.commands-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.commands-list::-webkit-scrollbar {
		width: 8px;
	}

	.commands-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.commands-list::-webkit-scrollbar-thumb {
		background: var(--surface-variant);
		border-radius: 4px;
	}

	.commands-list::-webkit-scrollbar-thumb:hover {
		background: var(--border);
	}

	.command-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 6px;
		transition: background-color 0.15s ease;
		text-align: left;
		gap: 1rem;
	}

	.command-item:hover,
	.command-item.selected {
		background-color: var(--surface-variant);
	}

	.command-main {
		flex: 1;
		min-width: 0;
	}

	.command-name {
		font-size: 0.9rem;
		color: var(--text-primary);
		font-weight: 500;
		margin-bottom: 0.15rem;
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
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-container-high);
		border-radius: 4px;
		font-family: monospace;
		font-weight: 600;
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}

	.no-results-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-results-text {
		font-size: 0.9rem;
	}

	.footer {
		border-top: 1px solid var(--border);
		padding: 0.75rem 1rem;
		background-color: var(--surface-variant);
	}

	.footer-hint {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		align-items: center;
	}

	kbd {
		background-color: var(--surface-container-high);
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
		font-size: 0.7rem;
		font-weight: 600;
		border: 1px solid var(--border);
		margin-right: 0.25rem;
	}
</style>
