<script lang="ts">
	import { browser } from '$app/environment';
	import { widgets } from '$lib/stores/widgets';
	import { cloudflareSettings } from '$lib/stores/cloudflareSettings';
	import { cloudflareCredentials } from '$lib/stores/cloudflareCredentials';
	import { revealWidget } from '$lib/utils/revealWidget';

	// ─── Create-token deep link (mirrors CloudflareWidget) ───
	const TOKEN_PERMISSION_KEYS = [
		{ key: 'account_analytics', type: 'read' },
		{ key: 'analytics', type: 'read' },
		{ key: 'zone', type: 'read' },
		{ key: 'page', type: 'read' },
		{ key: 'workers_scripts', type: 'read' },
		{ key: 'workers_kv_storage', type: 'read' },
		{ key: 'workers_r2', type: 'read' },
		{ key: 'd1', type: 'read' },
		{ key: 'queues', type: 'read' },
		{ key: 'waf', type: 'read' },
		{ key: 'rum', type: 'read' }
	];
	const CREATE_TOKEN_URL =
		'https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=' +
		encodeURIComponent(JSON.stringify(TOKEN_PERMISSION_KEYS)) +
		'&accountId=*&zoneId=all&name=' +
		encodeURIComponent('Dashboard (read-only)');
	const TOKEN_URL = 'https://dash.cloudflare.com/profile/api-tokens';

	// ─── Store-driven state ───
	$: s = $cloudflareSettings;
	$: isOpen = s.isOpen;
	$: widget = s.widgetId ? $widgets.find((w) => w.id === s.widgetId) : null;
	$: cf = widget?.config?.cloudflare ?? {};
	$: creds = $cloudflareCredentials.credentials;
	// Effective key: explicit choice, else (for legacy widgets) the first key.
	$: effectiveCredId =
		cf.credentialId === '' ? '' : cf.credentialId && creds.some((c) => c.id === cf.credentialId) ? cf.credentialId : (creds[0]?.id ?? '');
	$: selectedCred = creds.find((c) => c.id === effectiveCredId) ?? null;
	$: planTier = cf.plan ?? 'free';

	// ─── Account picker ───
	let accounts: { id: string; name: string }[] = [];
	let accountsLoading = false;
	let accountsError = '';
	let loadedForToken: string | null = null;

	async function loadAccounts(token: string) {
		accountsLoading = true;
		accountsError = '';
		try {
			const res = await fetch('/api/cloudflare?action=accounts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiToken: token })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
			accounts = data.accounts ?? [];
		} catch (e) {
			accountsError = e instanceof Error ? e.message : 'Failed to load accounts.';
			accounts = [];
		} finally {
			accountsLoading = false;
		}
	}

	// (Re)load accounts whenever the panel is open and the active token changes.
	$: if (browser && isOpen && selectedCred && selectedCred.token !== loadedForToken) {
		loadedForToken = selectedCred.token;
		loadAccounts(selectedCred.token);
	}
	$: if (browser && isOpen && !selectedCred) {
		accounts = [];
		accountsError = '';
		loadedForToken = null;
	}

	// ─── Config writes ───
	function patchCf(patch: Record<string, unknown>) {
		if (!widget) return;
		widgets.updateWidgetConfig(widget.id, { cloudflare: { ...cf, ...patch } });
	}

	function selectKey(id: string) {
		if (id === effectiveCredId && cf.credentialId !== '') return;
		// Switching keys invalidates the chosen account — let the widget re-pick.
		patchCf({ credentialId: id, accountId: '', accountName: '' });
	}

	function selectAccount(id: string) {
		const a = accounts.find((x) => x.id === id);
		if (!a) return;
		patchCf({ credentialId: effectiveCredId, accountId: a.id, accountName: a.name });
	}

	function setPlan(tier: 'free' | 'paid') {
		if (planTier === tier) return;
		patchCf({ credentialId: effectiveCredId, plan: tier });
	}

	function removeFromWidget() {
		// Explicit "no key" — distinct from unset. Widget returns to its prompt.
		patchCf({ credentialId: '', accountId: '', accountName: '' });
	}

	// ─── Add-key flow ───
	let adding = false;
	let newLabel = '';
	let newToken = '';
	let verifying = false;
	let addError = '';

	function beginAdd() {
		adding = true;
		newLabel = '';
		newToken = '';
		addError = '';
	}
	function cancelAdd() {
		adding = false;
		addError = '';
	}
	async function submitAdd() {
		const token = newToken.trim();
		if (!token) return;
		verifying = true;
		addError = '';
		try {
			const res = await fetch('/api/cloudflare?action=verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiToken: token })
			});
			const data = await res.json();
			if (!res.ok || !data.valid) {
				addError = data.error || 'That token could not be verified.';
				return;
			}
			const id = cloudflareCredentials.add(newLabel, token);
			adding = false;
			newLabel = '';
			newToken = '';
			patchCf({ credentialId: id, accountId: '', accountName: '' });
		} catch (e) {
			addError = e instanceof Error ? e.message : 'Failed to verify token.';
		} finally {
			verifying = false;
		}
	}

	// ─── Edit / delete keys ───
	let editingId = '';
	let editLabel = '';
	function beginEdit(id: string, label: string) {
		editingId = id;
		editLabel = label;
	}
	function saveEdit() {
		if (editingId) cloudflareCredentials.update(editingId, { label: editLabel });
		editingId = '';
		editLabel = '';
	}

	let confirmingDeleteId = '';
	function widgetsUsing(id: string): number {
		return $widgets.filter((w) => w.type === 'cloudflare' && w.config?.cloudflare?.credentialId === id).length;
	}
	function confirmDelete(id: string) {
		// Disconnect every widget pinned to this key, then drop it.
		for (const w of $widgets) {
			if (w.type === 'cloudflare' && w.config?.cloudflare?.credentialId === id) {
				widgets.updateWidgetConfig(w.id, {
					cloudflare: { ...w.config.cloudflare, credentialId: '', accountId: '', accountName: '' }
				});
			}
		}
		cloudflareCredentials.remove(id);
		confirmingDeleteId = '';
	}

	// ─── Modal shell (mirrors WeatherWidgetSettings) ───
	let isDragging = false;
	let startY = 0;
	let translateY = 0;

	function close() {
		const first = s.isFirstTimeSetup;
		const wid = s.widgetId;
		adding = false;
		editingId = '';
		confirmingDeleteId = '';
		cloudflareSettings.close();
		if (first && wid) revealWidget(wid, 300);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}
	function handleTouchStart(event: TouchEvent) {
		isDragging = true;
		startY = event.touches[0].clientY;
	}
	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;
		const diff = event.touches[0].clientY - startY;
		if (diff > 0) translateY = diff;
	}
	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;
		if (translateY > 100) close();
		translateY = 0;
		startY = 0;
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) close();
	}

	$: if (browser && isOpen) {
		document.body.style.overflow = 'hidden';
	} else if (browser) {
		document.body.style.overflow = '';
	}

	// Whether to show the add-key flow front-and-center (no keys, or user asked).
	$: showAddFlow = adding || creds.length === 0;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-backdrop"
		role="presentation"
		on:click={handleBackdropClick}
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
	>
		<div class="modal-container" class:dragging={isDragging} style="transform: translateY({translateY}px)">
			<div class="drag-handle"><div class="drag-bar"></div></div>

			<div class="modal-header">
				<div class="header-title">
					<svg viewBox="0 0 48 32" width="26" height="18" aria-hidden="true">
						<path fill="#f6821f" d="M35.9 20.2c.3-1 .2-1.9-.3-2.6-.4-.6-1.2-1-2.1-1l-17-.2c-.1 0-.2-.1-.3-.2 0-.1 0-.2.1-.2 0-.1.1-.2.3-.2l17.1-.2c2-.1 4.2-1.7 5-3.7l1-2.6c0-.1.1-.2 0-.3C35.6 3.3 30.9 0 25.4 0c-5.1 0-9.4 3.3-11 7.8-1-.8-2.4-1.2-3.8-1-2.6.3-4.6 2.4-4.9 5 0 .7 0 1.3.2 1.9C1.7 13.8 0 15.6 0 17.9c0 .2 0 .4.1.6 0 .1.1.2.2.2h31.4c.1 0 .2-.1.3-.2l.9-2.6z" />
						<path fill="#fbad41" d="M40.6 9.3h-.5c-.1 0-.2.1-.2.2l-.6 2.1c-.3 1-.2 1.9.3 2.6.4.6 1.2 1 2.1 1l3.6.2c.1 0 .2.1.3.2 0 .1 0 .2-.1.2 0 .1-.1.2-.3.2l-3.8.2c-2 .1-4.2 1.7-5 3.7l-.2.7c-.1.1 0 .3.2.3h13c.1 0 .2-.1.2-.2.2-.8.4-1.7.4-2.6 0-4.9-4-8.9-9-8.9z" />
					</svg>
					<h2 class="modal-title">Cloudflare Settings</h2>
				</div>
				<button class="close-button" on:click={close} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="modal-content">
				<!-- ─── API Key ─── -->
				<div class="settings-section">
					<h3 class="section-title">API Key</h3>
					<p class="section-description">
						Pick which saved Cloudflare key this widget uses. Keys are shared across every widget, so you
						can point some widgets at one key and others at a different one.
					</p>

					{#if creds.length > 0}
						<div class="key-list">
							{#each creds as c (c.id)}
								<div class="key-row" class:active={c.id === effectiveCredId}>
									{#if editingId === c.id}
										<input
											class="key-edit-input"
											bind:value={editLabel}
											on:keydown={(e) => e.key === 'Enter' && saveEdit()}
											aria-label="Key label"
										/>
										<button class="mini-btn" on:click={saveEdit}>Save</button>
										<button class="mini-btn" on:click={() => (editingId = '')}>Cancel</button>
									{:else if confirmingDeleteId === c.id}
										{@const n = widgetsUsing(c.id)}
										<span class="key-confirm">
											{#if n > 0}Delete — disconnects {n} widget{n > 1 ? 's' : ''}?{:else}Delete this key?{/if}
										</span>
										<button class="mini-btn danger" on:click={() => confirmDelete(c.id)}>Delete</button>
										<button class="mini-btn" on:click={() => (confirmingDeleteId = '')}>Cancel</button>
									{:else}
										<button class="key-select" on:click={() => selectKey(c.id)}>
											<span class="key-radio" class:on={c.id === effectiveCredId}></span>
											<span class="key-label">{c.label}</span>
											{#if c.id === effectiveCredId && cf.credentialId === undefined}<span class="key-tag">default</span>{/if}
										</button>
										<button class="mini-btn" on:click={() => beginEdit(c.id, c.label)} title="Rename">✎</button>
										<button class="mini-btn" on:click={() => (confirmingDeleteId = c.id)} title="Delete">🗑</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					{#if showAddFlow}
						<div class="add-key">
							{#if creds.length > 0}
								<div class="add-key-title">Add a new key</div>
							{:else}
								<p class="section-description">
									Connect your Cloudflare account with a read-only API token. The button below opens
									Cloudflare with the permissions pre-selected — tokens don't expire, so you stay
									connected on every device.
								</p>
							{/if}

							<a class="create-token-btn" href={CREATE_TOKEN_URL} target="_blank" rel="noopener noreferrer">
								<span class="step-num">1</span>
								Create token on Cloudflare
								<span class="ext">↗</span>
							</a>
							<p class="connect-hint">
								Permissions are pre-selected — just click <strong>Continue to summary</strong> →
								<strong>Create Token</strong> → <strong>Copy</strong>.
							</p>

							<label class="field-label" for="cf-key-label">Label</label>
							<input
								id="cf-key-label"
								class="token-input"
								bind:value={newLabel}
								placeholder="e.g. Personal, Work"
								autocomplete="off"
								spellcheck="false"
							/>

							<label class="field-label" for="cf-key-token">API token</label>
							<input
								id="cf-key-token"
								class="token-input"
								type="password"
								bind:value={newToken}
								placeholder="Paste API token"
								autocomplete="off"
								spellcheck="false"
								on:keydown={(e) => e.key === 'Enter' && submitAdd()}
							/>
							{#if addError}<p class="connect-error">⚠️ {addError}</p>{/if}

							<div class="add-actions">
								<button class="connect-btn" on:click={submitAdd} disabled={verifying || !newToken.trim()}>
									{verifying ? 'Verifying…' : 'Save key'}
								</button>
								{#if creds.length > 0}
									<button class="link-btn" on:click={cancelAdd}>Cancel</button>
								{/if}
							</div>
							<a class="manual-link" href={TOKEN_URL} target="_blank" rel="noopener noreferrer">or create a token manually</a>
						</div>
					{:else}
						<button class="add-key-btn" on:click={beginAdd}>＋ Add another key</button>
					{/if}
				</div>

				<!-- ─── Account ─── -->
				{#if selectedCred}
					<div class="settings-section">
						<h3 class="section-title">Account</h3>
						<p class="section-description">Which Cloudflare account this widget shows.</p>
						{#if accountsLoading}
							<div class="inline-msg"><div class="spinner"></div> Loading accounts…</div>
						{:else if accountsError}
							<div class="inline-msg err">⚠️ {accountsError}</div>
						{:else if accounts.length === 0}
							<div class="inline-msg">This key has no accessible accounts.</div>
						{:else}
							<select class="settings-select" value={cf.accountId ?? accounts[0]?.id} on:change={(e) => selectAccount(e.currentTarget.value)}>
								{#each accounts as acc}
									<option value={acc.id}>{acc.name}</option>
								{/each}
							</select>
						{/if}
					</div>

					<!-- ─── Plan tier ─── -->
					<div class="settings-section">
						<h3 class="section-title">Plan tier</h3>
						<p class="section-description">Usage meters compare against this tier's limits.</p>
						<div class="plan-toggle">
							<button class="plan-opt" class:active={planTier === 'free'} on:click={() => setPlan('free')}>Free</button>
							<button class="plan-opt" class:active={planTier === 'paid'} on:click={() => setPlan('paid')}>Workers Paid</button>
						</div>
					</div>
				{/if}

				<!-- ─── Actions ─── -->
				<div class="settings-actions">
					{#if selectedCred}
						<button class="text-danger" on:click={removeFromWidget}>Remove key from this widget</button>
					{/if}
					<button class="done-btn" on:click={close}>Done</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay);
		backdrop-filter: blur(4px);
		z-index: 10001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
		overflow-y: auto;
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-container {
		background: var(--surface);
		border: 3px solid var(--border);
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		animation: slideUp 0.3s ease-out;
		box-shadow: 0 0 20px var(--shadow);
	}
	@keyframes slideUp {
		from { transform: translateY(20px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}
	.modal-container.dragging { transition: none; }

	.drag-handle { display: none; padding: 0.75rem; cursor: grab; touch-action: none; }
	.drag-bar { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto; }

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 3px solid var(--border);
	}
	.header-title { display: flex; align-items: center; gap: 0.6rem; }
	.modal-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text-primary); }

	.close-button {
		background: none;
		border: 2px solid transparent;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast) var(--ease-out);
	}
	.close-button:hover { color: var(--primary-color); border-color: var(--primary-color); }

	.modal-content { padding: 1.5rem; }

	.settings-section { margin-bottom: 2rem; }
	.settings-section:last-child { margin-bottom: 0; }
	.section-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem 0; color: var(--text-primary); }
	.section-description { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 1rem 0; line-height: 1.5; }

	/* ─── Key list ─── */
	.key-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
	.key-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.5rem;
		border: 2px solid var(--border);
		background: var(--surface-variant);
	}
	.key-row.active { border-color: #f6821f; }
	.key-select {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-primary);
		text-align: left;
		padding: 0.3rem;
		min-width: 0;
	}
	.key-radio {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 2px solid var(--border);
		flex-shrink: 0;
	}
	.key-radio.on { border-color: #f6821f; background: radial-gradient(circle, #f6821f 0 45%, transparent 55%); }
	.key-label { font-size: 0.9rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.key-tag {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.05rem 0.4rem;
	}
	.key-confirm { flex: 1; font-size: 0.8rem; color: var(--text-primary); }
	.key-edit-input {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 2px solid var(--border);
		background: var(--background);
		color: var(--text-primary);
		font-size: 0.85rem;
	}
	.key-edit-input:focus { outline: none; border-color: #f6821f; }
	.mini-btn {
		background: none;
		border: 2px solid var(--border);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0.3rem 0.5rem;
		flex-shrink: 0;
	}
	.mini-btn:hover { color: var(--text-primary); border-color: var(--primary-color); }
	.mini-btn.danger:hover { color: var(--error); border-color: var(--error); }

	.add-key-btn {
		background: none;
		border: 2px dashed var(--border);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.55rem 0.9rem;
		width: 100%;
	}
	.add-key-btn:hover { color: var(--text-primary); border-color: var(--primary-color); }

	/* ─── Add-key flow ─── */
	.add-key { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
	.add-key-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
	.create-token-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.6rem 0.9rem;
		background: #f6821f;
		color: #fff;
		font-weight: 700;
		font-size: 0.82rem;
		text-decoration: none;
		justify-content: center;
		transition: filter 0.15s, transform 0.1s;
	}
	.create-token-btn:hover { filter: brightness(1.08); }
	.create-token-btn:active { transform: scale(0.98); }
	.create-token-btn .ext { font-weight: 400; opacity: 0.9; }
	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		font-size: 0.7rem;
		font-weight: 800;
		flex-shrink: 0;
	}
	.connect-hint { margin: 0; font-size: 0.7rem; color: var(--text-secondary); line-height: 1.5; }
	.connect-hint strong { color: var(--text-primary); }
	.field-label { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); margin-top: 0.35rem; }
	.token-input {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border: 2px solid var(--border);
		background: var(--background);
		color: var(--text-primary);
		font-size: 0.85rem;
	}
	.token-input:focus { outline: none; border-color: #f6821f; }
	.token-input:-webkit-autofill,
	.token-input:-webkit-autofill:hover,
	.token-input:-webkit-autofill:focus {
		-webkit-box-shadow: 0 0 0 30px var(--background) inset !important;
		-webkit-text-fill-color: var(--text-primary) !important;
	}
	.connect-error { margin: 0; font-size: 0.75rem; color: var(--error); }
	.add-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem; }
	.connect-btn {
		padding: 0.55rem 1.5rem;
		background: #f6821f;
		color: #fff;
		border: none;
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
		transition: filter 0.15s, transform 0.1s;
	}
	.connect-btn:hover:not(:disabled) { filter: brightness(1.08); }
	.connect-btn:active:not(:disabled) { transform: scale(0.97); }
	.connect-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.link-btn { background: none; border: none; font-size: 0.78rem; color: var(--text-secondary); cursor: pointer; }
	.link-btn:hover { color: var(--text-primary); text-decoration: underline; }
	.manual-link { font-size: 0.7rem; color: var(--text-secondary); text-decoration: none; opacity: 0.8; }
	.manual-link:hover { text-decoration: underline; opacity: 1; }

	/* ─── Account + plan ─── */
	.settings-select {
		width: 100%;
		padding: 0.6rem 0.7rem;
		border: 2px solid var(--border);
		background: var(--background);
		color: var(--text-primary);
		font-size: 0.9rem;
	}
	.settings-select:focus { outline: none; border-color: #f6821f; }
	.inline-msg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); }
	.inline-msg.err { color: var(--error); }
	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--border);
		border-top-color: #f6821f;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	.plan-toggle { display: flex; gap: 0.5rem; }
	.plan-opt {
		flex: 1;
		padding: 0.6rem 1rem;
		background: var(--surface-variant);
		color: var(--text-secondary);
		border: 2px solid var(--border);
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.plan-opt:hover { border-color: var(--primary-color); color: var(--text-primary); }
	.plan-opt.active { background: #f6821f; color: #fff; border-color: #f6821f; }

	/* ─── Actions ─── */
	.settings-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 0.5rem;
		border-top: 2px solid var(--border);
	}
	.text-danger { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.82rem; }
	.text-danger:hover { color: var(--error); text-decoration: underline; }
	.done-btn {
		margin-left: auto;
		padding: 0.55rem 1.5rem;
		background: var(--primary-color);
		color: var(--background);
		border: none;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.done-btn:hover { filter: brightness(1.1); }

	@media (max-width: 768px) {
		.modal-backdrop { padding: 0; align-items: flex-end; }
		.modal-container {
			max-width: 100%;
			max-height: 85vh;
			border: none;
			border-top: 3px solid var(--border);
		}
		.drag-handle { display: block; }
		.modal-header, .modal-content { padding: 1rem; }
	}
</style>
