import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'dashboard-cloudflare-credentials';
// Legacy single-token store we migrate from on first load.
const LEGACY_KEY = 'dashboard-cloudflare-connection';

export interface CloudflareCredential {
  id: string;
  label: string;
  token: string;
}

interface CredentialsState {
  credentials: CloudflareCredential[];
}

function makeId(): string {
  if (browser && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Non-browser / very old engines: fall back to a plain unique-ish id. This
  // path is only hit during SSR where the value is immediately replaced on
  // hydration, so collision risk is irrelevant.
  return 'cred-' + Math.floor(Math.random() * 1e9).toString(36);
}

function loadFromStorage(): CredentialsState {
  const state: CredentialsState = { credentials: [] };
  if (!browser) return state;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed?.credentials)) {
        state.credentials = parsed.credentials.filter(
          (c: unknown): c is CloudflareCredential =>
            !!c && typeof (c as CloudflareCredential).id === 'string' && typeof (c as CloudflareCredential).token === 'string'
        );
        return state;
      }
    }

    // ─── One-time migration from the legacy single-token store ───
    // Existing users have a token in `dashboard-cloudflare-connection` and
    // widgets with no `credentialId`. Seed it as the "Default" key so those
    // widgets resolve to it (first-credential fallback) with zero disruption.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy?.apiToken) {
        state.credentials = [{ id: 'default', label: 'Default', token: parsedLegacy.apiToken }];
      }
    }
  } catch {
    // ignore — start empty
  }

  return state;
}

function createCloudflareCredentialsStore() {
  const { subscribe, set, update } = writable<CredentialsState>(loadFromStorage());

  function persist(state: CredentialsState) {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Same signal every other synced store emits so sync.ts pushes to KV.
    window.dispatchEvent(new CustomEvent('dashboard-state-changed'));
  }

  return {
    subscribe,
    /** Add a new key, returning its generated id. */
    add(label: string, token: string): string {
      const id = makeId();
      const cred: CloudflareCredential = { id, label: label.trim() || 'Untitled key', token };
      update((state) => {
        const next = { credentials: [...state.credentials, cred] };
        persist(next);
        return next;
      });
      return id;
    },
    update(id: string, patch: Partial<Pick<CloudflareCredential, 'label' | 'token'>>) {
      update((state) => {
        const next = {
          credentials: state.credentials.map((c) =>
            c.id === id
              ? { ...c, ...(patch.label !== undefined ? { label: patch.label.trim() || c.label } : {}), ...(patch.token !== undefined ? { token: patch.token } : {}) }
              : c
          )
        };
        persist(next);
        return next;
      });
    },
    remove(id: string) {
      update((state) => {
        const next = { credentials: state.credentials.filter((c) => c.id !== id) };
        persist(next);
        return next;
      });
    },
    /** Re-read localStorage (used after a remote sync pull updates it). */
    reload() {
      set(loadFromStorage());
    }
  };
}

export const cloudflareCredentials = createCloudflareCredentialsStore();

export const hasCloudflareCredentials = derived(
  cloudflareCredentials,
  ($c) => $c.credentials.length > 0
);

/**
 * Resolve the token a widget should use.
 * - `credentialId === ''` → explicit "no key" (widget shows its connect prompt).
 * - `credentialId === undefined` → back-compat: fall back to the first/default key
 *   (existing widgets predate the per-widget key model and have no id).
 * - a real id → that key, or the first key if the id was since deleted.
 */
export function resolveToken(
  credentials: CloudflareCredential[],
  credentialId: string | undefined
): string {
  if (credentialId === '') return '';
  const chosen = credentialId ? credentials.find((c) => c.id === credentialId) : undefined;
  return chosen?.token ?? credentials[0]?.token ?? '';
}
