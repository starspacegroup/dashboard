<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import type { Theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SettingsModal from './SettingsModal.svelte';

	export let user: any;

	let isOpen = false;
	let dropdownElement: HTMLDivElement;
	let currentTheme: Theme = 'auto';
	let isSettingsOpen = false;

	// Subscribe to theme
	theme.subscribe(t => {
		currentTheme = t;
	});

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function setThemeOption(newTheme: Theme) {
		theme.setThemeWithAuto(newTheme);
		closeDropdown();
	}

	function openSettings() {
		isSettingsOpen = true;
		closeDropdown();
	}

	function closeSettings() {
		isSettingsOpen = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			closeDropdown();
		}
	}

	// Handle event listeners only on the client side
	$: if (browser) {
		if (isOpen) {
			window.addEventListener('click', handleClickOutside);
		} else {
			window.removeEventListener('click', handleClickOutside);
		}
	}
</script>

<div class="user-dropdown" bind:this={dropdownElement}>
	<button class="user-button" on:click={toggleDropdown} title="User menu">
		<img src={user.image || user.avatar_url} alt={user.name || user.login} class="user-avatar" />
	</button>

	{#if isOpen}
		<div class="dropdown-menu">
			<div class="dropdown-header">
				<img src={user.image || user.avatar_url} alt={user.name || user.login} class="user-avatar-large" />
				<div class="user-info">
					<div class="user-name">{user.name || user.login || 'User'}</div>
					{#if user.login && user.name}
						<div class="user-username">@{user.login}</div>
					{/if}
				</div>
			</div>

		<div class="dropdown-divider"></div>

		<div class="theme-section">
			<div class="theme-label">Theme</div>
			<div class="theme-options">
				<button
					class="theme-option"
					class:active={currentTheme === 'light'}
					on:click={() => setThemeOption('light')}
					title="Light theme"
				>
					<span class="theme-icon">☀️</span>
					<span>Light</span>
				</button>
				<button
					class="theme-option"
					class:active={currentTheme === 'dark'}
					on:click={() => setThemeOption('dark')}
					title="Dark theme"
				>
					<span class="theme-icon">🌙</span>
					<span>Dark</span>
				</button>
				<button
					class="theme-option"
					class:active={currentTheme === 'auto'}
					on:click={() => setThemeOption('auto')}
					title="System theme"
				>
					<span class="theme-icon">🌓</span>
					<span>System</span>
				</button>
			</div>
		</div>

		<div class="dropdown-divider"></div>

		<button class="dropdown-item" on:click={openSettings}>
			<span class="dropdown-icon">⚙️</span>
			<span>Settings</span>
		</button>

		<div class="dropdown-divider"></div>
		
		<form method="POST" action="/auth/signout">
			<button type="submit" class="dropdown-item sign-out">
				<span class="dropdown-icon">🚪</span>
				<span>Sign Out</span>
			</button>
		</form>
		</div>
	{/if}
</div>

<SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />

<style>
	.user-dropdown {
		position: relative;
	}

	.user-button {
		background: transparent;
		border: 2px solid var(--border);
		border-radius: 50%;
		padding: 0;
		cursor: pointer;
		transition: all var(--transition-fast) var(--ease-spring);
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		position: relative;
	}

	.user-button::before {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		padding: 2px;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-color-hover));
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: exclude;
		opacity: 0;
		transition: opacity var(--transition-fast) var(--ease-out);
	}

	.user-button:hover {
		transform: scale(1.1) rotate(5deg);
		border-color: transparent;
	}

	.user-button:hover::before {
		opacity: 1;
	}

	.user-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		transition: transform var(--transition-fast) var(--ease-out);
	}

	.user-button:hover .user-avatar {
		transform: scale(1.05);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.75rem);
		right: 0;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		box-shadow: 0 10px 40px var(--shadow-strong);
		min-width: 260px;
		z-index: 1000;
		overflow: hidden;
		animation: dropdownSlideIn 0.3s var(--ease-out);
		backdrop-filter: blur(10px);
	}

	:global(.dark) .dropdown-menu {
		box-shadow: 0 10px 40px var(--shadow-stronger);
	}

	@keyframes dropdownSlideIn {
		from {
			opacity: 0;
			transform: translateY(-15px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.dropdown-header {
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar-large {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-username {
		font-size: 0.85rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dropdown-divider {
		height: 1px;
		background-color: var(--border);
		margin: 0.25rem 0;
	}

	.theme-section {
		padding: 0.875rem 1.25rem;
	}

	.theme-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-secondary);
		margin-bottom: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.075em;
	}

	.theme-options {
		display: flex;
		gap: 0.5rem;
	}

	.theme-option {
		flex: 1;
		padding: 0.625rem 0.5rem;
		background: var(--surface-variant);
		border: 2px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		transition: all var(--transition-fast) var(--ease-out);
		position: relative;
		overflow: hidden;
	}

	.theme-option::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at center, var(--primary-color-light), transparent);
		opacity: 0;
		transition: opacity var(--transition-fast) var(--ease-out);
	}

	.theme-option:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px var(--shadow);
	}

	.theme-option:hover::before {
		opacity: 0.5;
	}

	.theme-option.active {
		background: var(--primary-color-light);
		border-color: var(--primary-color);
		color: var(--primary-color);
		font-weight: 600;
		transform: scale(1.05);
	}

	.theme-option.active::before {
		opacity: 1;
	}

	.theme-icon {
		font-size: 1.5rem;
		transition: transform var(--transition-normal) var(--ease-spring);
		position: relative;
		z-index: 1;
	}

	.theme-option:hover .theme-icon {
		transform: scale(1.15) rotate(5deg);
	}

	.theme-option.active .theme-icon {
		transform: scale(1.2);
	}

	.dropdown-item {
		width: 100%;
		padding: 0.875rem 1.25rem;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.875rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-primary);
		transition: all var(--transition-fast) var(--ease-out);
		position: relative;
	}

	.dropdown-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: var(--primary-color);
		transform: scaleY(0);
		transition: transform var(--transition-fast) var(--ease-spring);
	}

	.dropdown-item:hover {
		background-color: var(--surface-variant);
		padding-left: 1.5rem;
	}

	.dropdown-item:hover::before {
		transform: scaleY(1);
	}

	.dropdown-icon {
		font-size: 1.25rem;
		width: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform var(--transition-normal) var(--ease-spring);
	}

	.dropdown-item:hover .dropdown-icon {
		transform: scale(1.1);
	}

	.dropdown-item.sign-out {
		color: var(--error);
	}

	.dropdown-item.sign-out::before {
		background: var(--error);
	}

	.dropdown-item.sign-out:hover {
		background-color: var(--error-bg);
	}

	.dropdown-item.sign-out:hover .dropdown-icon {
		transform: scale(1.1) rotate(10deg);
	}

	form {
		margin: 0;
		padding: 0;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.dropdown-menu {
			min-width: 240px;
			right: -10px;
		}

		.theme-option {
			padding: 0.75rem 0.5rem;
			min-height: 70px;
		}

		.dropdown-item {
			padding: 1rem 1.25rem;
			min-height: 52px;
		}
	}
</style>
