<script lang="ts">
	import { browser } from '$app/environment';
	import { widgets } from '$lib/stores/widgets';
	import { nebulakitSettings } from '$lib/stores/nebulakitSettings';
	import { nebulakitSites, normalizeSiteUrl } from '$lib/stores/nebulakitSites';
	import { revealWidget } from '$lib/utils/revealWidget';

	// ─── Store-driven state ───
	$: s = $nebulakitSettings;
	$: isOpen = s.isOpen;
	$: widget = s.widgetId ? $widgets.find((w) => w.id === s.widgetId) : null;
	$: nk = widget?.config?.nebulakit ?? {};
	$: sites = $nebulakitSites.sites;
	// Effective site: explicit choice, else (for a fresh widget) the first site.
	$: effectiveSiteId =
		nk.siteId === '' ? '' : nk.siteId && sites.some((x) => x.id === nk.siteId) ? nk.siteId : (sites[0]?.id ?? '');
	$: selectedSite = sites.find((x) => x.id === effectiveSiteId) ?? null;

	// ─── Config writes ───
	function patchNk(patch: Record<string, unknown>) {
		if (!widget) return;
		widgets.updateWidgetConfig(widget.id, { nebulakit: { ...nk, ...patch } });
	}
	function selectSite(id: string) {
		if (id === effectiveSiteId && nk.siteId !== '') return;
		patchNk({ siteId: id });
	}
	function removeFromWidget() {
		// Explicit "no site" — distinct from unset. Widget returns to its prompt.
		patchNk({ siteId: '' });
	}

	// ─── Add-site flow ───
	let adding = false;
	let newLabel = '';
	let newUrl = '';
	let newToken = '';
	let verifying = false;
	let addError = '';
	$: newOrigin = normalizeSiteUrl(newUrl);
	$: adminLink = newOrigin ? `${newOrigin}/admin/analytics` : '';

	function beginAdd() {
		adding = true;
		newLabel = '';
		newUrl = '';
		newToken = '';
		addError = '';
	}
	function cancelAdd() {
		adding = false;
		addError = '';
	}
	async function submitAdd() {
		const token = newToken.trim();
		if (!newOrigin) {
			addError = 'Enter the site URL, like https://example.com.';
			return;
		}
		if (!token) return;
		verifying = true;
		addError = '';
		try {
			const res = await fetch('/api/nebulakit?action=verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: newOrigin, token })
			});
			const data = await res.json();
			if (!res.ok || !data.valid) {
				addError = data.error || 'That site did not accept the token.';
				return;
			}
			const label = newLabel.trim() || data.site?.name || new URL(newOrigin).host;
			const id = nebulakitSites.add(label, newOrigin, token);
			adding = false;
			newLabel = '';
			newUrl = '';
			newToken = '';
			patchNk({ siteId: id });
		} catch (e) {
			addError = e instanceof Error ? e.message : 'Failed to verify the site.';
		} finally {
			verifying = false;
		}
	}

	// ─── Edit / replace token / delete ───
	let editingId = '';
	let editLabel = '';
	function beginEdit(id: string, label: string) {
		editingId = id;
		editLabel = label;
		replacingId = '';
	}
	function saveEdit() {
		if (editingId) nebulakitSites.update(editingId, { label: editLabel });
		editingId = '';
		editLabel = '';
	}

	let replacingId = '';
	let replaceToken = '';
	let replaceError = '';
	let replacing = false;
	function beginReplace(id: string) {
		replacingId = id;
		replaceToken = '';
		replaceError = '';
		editingId = '';
	}
	async function submitReplace() {
		const site = sites.find((x) => x.id === replacingId);
		const token = replaceToken.trim();
		if (!site || !token) return;
		replacing = true;
		replaceError = '';
		try {
			const res = await fetch('/api/nebulakit?action=verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: site.url, token })
			});
			const data = await res.json();
			if (!res.ok || !data.valid) {
				replaceError = data.error || 'That site did not accept the token.';
				return;
			}
			nebulakitSites.update(site.id, { token });
			replacingId = '';
			replaceToken = '';
		} catch (e) {
			replaceError = e instanceof Error ? e.message : 'Failed to verify the token.';
		} finally {
			replacing = false;
		}
	}

	let confirmingDeleteId = '';
	function widgetsUsing(id: string): number {
		return $widgets.filter((w) => w.type === 'nebulakit' && w.config?.nebulakit?.siteId === id).length;
	}
	function confirmDelete(id: string) {
		for (const w of $widgets) {
			if (w.type === 'nebulakit' && w.config?.nebulakit?.siteId === id) {
				widgets.updateWidgetConfig(w.id, { nebulakit: { ...w.config.nebulakit, siteId: '' } });
			}
		}
		nebulakitSites.remove(id);
		confirmingDeleteId = '';
	}

	// ─── Modal shell (mirrors CloudflareWidgetSettings) ───
	let isDragging = false;
	let startY = 0;
	let translateY = 0;

	function close() {
		const first = s.isFirstTimeSetup;
		const wid = s.widgetId;
		adding = false;
		editingId = '';
		replacingId = '';
		confirmingDeleteId = '';
		nebulakitSettings.close();
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

	$: showAddFlow = adding || sites.length === 0;
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
					<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
						<circle cx="24" cy="24" r="21" fill="none" stroke="#7c4dff" stroke-width="2.5" />
						<ellipse cx="24" cy="24" rx="17" ry="7" fill="none" stroke="#b39dff" stroke-width="1.5" transform="rotate(-25 24 24)" />
						<circle cx="24" cy="24" r="5" fill="#7c4dff" />
					</svg>
					<h2 class="modal-title">NebulaKit Settings</h2>
				</div>
				<button class="close-button" on:click={close} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="modal-content">
				<!-- ─── Site ─── -->
				<div class="settings-section">
					<h3 class="section-title">Site</h3>
					<p class="section-description">
						Pick which saved NebulaKit site this widget shows. Sites are shared across every widget, so
						you can watch several at once.
					</p>

					{#if sites.length > 0}
						<div class="site-list">
							{#each sites as site (site.id)}
								<div class="site-row" class:active={site.id === effectiveSiteId}>
									{#if editingId === site.id}
										<input class="site-edit-input" bind:value={editLabel} on:keydown={(e) => e.key === 'Enter' && saveEdit()} aria-label="Site label" />
										<button class="mini-btn" on:click={saveEdit}>Save</button>
										<button class="mini-btn" on:click={() => (editingId = '')}>Cancel</button>
									{:else if confirmingDeleteId === site.id}
										{@const n = widgetsUsing(site.id)}
										<span class="site-confirm">
											{#if n > 0}Remove — disconnects {n} widget{n > 1 ? 's' : ''}?{:else}Remove this site?{/if}
										</span>
										<button class="mini-btn danger" on:click={() => confirmDelete(site.id)}>Remove</button>
										<button class="mini-btn" on:click={() => (confirmingDeleteId = '')}>Cancel</button>
									{:else}
										<button class="site-select" on:click={() => selectSite(site.id)}>
											<span class="site-radio" class:on={site.id === effectiveSiteId}></span>
											<span class="site-text">
												<span class="site-label">{site.label}</span>
												<span class="site-url">{site.url}</span>
											</span>
										</button>
										<button class="mini-btn" on:click={() => beginEdit(site.id, site.label)} title="Rename">✎</button>
										<button class="mini-btn" on:click={() => beginReplace(site.id)} title="Replace token">🔑</button>
										<button class="mini-btn" on:click={() => (confirmingDeleteId = site.id)} title="Remove">🗑</button>
									{/if}
								</div>
								{#if replacingId === site.id}
									<div class="replace-box">
										<label class="field-label" for="nk-replace-token">New stats token for {site.label}</label>
										<input
											id="nk-replace-token"
											class="token-input"
											type="password"
											bind:value={replaceToken}
											placeholder="nks_…"
											autocomplete="off"
											spellcheck="false"
											on:keydown={(e) => e.key === 'Enter' && submitReplace()}
										/>
										{#if replaceError}<p class="connect-error">⚠️ {replaceError}</p>{/if}
										<div class="add-actions">
											<button class="connect-btn" on:click={submitReplace} disabled={replacing || !replaceToken.trim()}>
												{replacing ? 'Verifying…' : 'Save token'}
											</button>
											<button class="link-btn" on:click={() => (replacingId = '')}>Cancel</button>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{/if}

					{#if showAddFlow}
						<div class="add-site">
							{#if sites.length > 0}
								<div class="add-site-title">Add a site</div>
							{:else}
								<p class="section-description">
									Any site built on NebulaKit can share its admin stats. The owner issues a
									<strong>stats token</strong> under <strong>Dashboard access</strong> on the site's
									<strong>Admin → Analytics</strong> page; paste it here. It's read-only and doesn't
									expire, so you stay connected on every device.
								</p>
							{/if}

							<label class="field-label" for="nk-site-url">Site URL</label>
							<input
								id="nk-site-url"
								class="token-input"
								bind:value={newUrl}
								placeholder="https://example.com"
								autocomplete="off"
								spellcheck="false"
								inputmode="url"
							/>

							{#if adminLink}
								<a class="create-token-btn" href={adminLink} target="_blank" rel="noopener noreferrer">
									<span class="step-num">1</span>
									Issue a stats token on the site
									<span class="ext">↗</span>
								</a>
								<p class="connect-hint">
									Opens <strong>{new URL(adminLink).host}</strong> → Analytics → <strong>Dashboard access</strong> →
									<strong>Issue token</strong> → <strong>Copy</strong>. You must be that site's owner.
								</p>
							{/if}

							<label class="field-label" for="nk-site-label">Label</label>
							<input
								id="nk-site-label"
								class="token-input"
								bind:value={newLabel}
								placeholder="Optional — defaults to the site's name"
								autocomplete="off"
								spellcheck="false"
							/>

							<label class="field-label" for="nk-site-token">Stats token</label>
							<input
								id="nk-site-token"
								class="token-input"
								type="password"
								bind:value={newToken}
								placeholder="nks_…"
								autocomplete="off"
								spellcheck="false"
								on:keydown={(e) => e.key === 'Enter' && submitAdd()}
							/>
							{#if addError}<p class="connect-error">⚠️ {addError}</p>{/if}

							<div class="add-actions">
								<button class="connect-btn" on:click={submitAdd} disabled={verifying || !newToken.trim() || !newUrl.trim()}>
									{verifying ? 'Verifying…' : 'Save site'}
								</button>
								{#if sites.length > 0}
									<button class="link-btn" on:click={cancelAdd}>Cancel</button>
								{/if}
							</div>
						</div>
					{:else}
						<button class="add-site-btn" on:click={beginAdd}>＋ Add another site</button>
					{/if}
				</div>

				<!-- ─── Actions ─── -->
				<div class="settings-actions">
					{#if selectedSite}
						<button class="text-danger" on:click={removeFromWidget}>Remove site from this widget</button>
					{/if}
					<button class="done-btn" on:click={close}>Done</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		--nk: #7c4dff;
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
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

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
	@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
	.section-description strong { color: var(--text-primary); }

	/* ─── Site list ─── */
	.site-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
	.site-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.5rem;
		border: 2px solid var(--border);
		background: var(--surface-variant);
	}
	.site-row.active { border-color: var(--nk); }
	.site-select {
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
	.site-radio { width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; }
	.site-radio.on { border-color: var(--nk); background: radial-gradient(circle, var(--nk) 0 45%, transparent 55%); }
	.site-text { display: flex; flex-direction: column; min-width: 0; }
	.site-label { font-size: 0.9rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.site-url { font-size: 0.7rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.site-confirm { flex: 1; font-size: 0.8rem; color: var(--text-primary); }
	.site-edit-input {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 2px solid var(--border);
		background: var(--background);
		color: var(--text-primary);
		font-size: 0.85rem;
	}
	.site-edit-input:focus { outline: none; border-color: var(--nk); }
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
	.replace-box {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem;
		border: 2px dashed var(--border);
		border-top: none;
	}

	.add-site-btn {
		background: none;
		border: 2px dashed var(--border);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.55rem 0.9rem;
		width: 100%;
	}
	.add-site-btn:hover { color: var(--text-primary); border-color: var(--primary-color); }

	/* ─── Add-site flow ─── */
	.add-site { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
	.add-site-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
	.create-token-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.6rem 0.9rem;
		background: var(--nk);
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
	.token-input:focus { outline: none; border-color: var(--nk); }
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
		background: var(--nk);
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
		.modal-container { max-width: 100%; max-height: 85vh; border: none; border-top: 3px solid var(--border); }
		.drag-handle { display: block; }
		.modal-header, .modal-content { padding: 1rem; }
	}
</style>
