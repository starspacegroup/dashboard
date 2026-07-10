import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'dashboard-cloudflare-connection';

interface CloudflareConnection {
  apiToken: string;
}

function loadFromStorage(): CloudflareConnection {
  const state: CloudflareConnection = { apiToken: '' };

  if (browser) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiToken) {
          state.apiToken = parsed.apiToken;
        }
      }
    } catch {
      // ignore
    }
  }

  return state;
}

function createCloudflareConnectionStore() {
  const { subscribe, set } = writable<CloudflareConnection>(loadFromStorage());

  function persist(state: CloudflareConnection) {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('dashboard-state-changed'));
    }
  }

  return {
    subscribe,
    connect(apiToken: string) {
      const state = { apiToken };
      set(state);
      persist(state);
    },
    disconnect() {
      const state = { apiToken: '' };
      set(state);
      persist(state);
      if (browser) {
        window.dispatchEvent(new CustomEvent('cloudflare-disconnected'));
      }
    },
    /** Re-read localStorage (used after remote sync updates it) */
    reload() {
      set(loadFromStorage());
    }
  };
}

export const cloudflareConnection = createCloudflareConnectionStore();
export const isCloudflareConnected = derived(cloudflareConnection, ($c) => !!$c.apiToken);
