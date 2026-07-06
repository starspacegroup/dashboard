import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'dashboard-analytics-connection';

interface AnalyticsConnection {
  refreshToken: string;
}

function loadFromStorage(): AnalyticsConnection {
  const state: AnalyticsConnection = { refreshToken: '' };

  if (browser) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.refreshToken) {
          state.refreshToken = parsed.refreshToken;
        }
      }
    } catch {
      // ignore
    }
  }

  return state;
}

function createAnalyticsConnectionStore() {
  const { subscribe, set } = writable<AnalyticsConnection>(loadFromStorage());

  function persist(state: AnalyticsConnection) {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('dashboard-state-changed'));
    }
  }

  return {
    subscribe,
    connect(refreshToken: string) {
      const state = { refreshToken };
      set(state);
      persist(state);
    },
    disconnect() {
      const state = { refreshToken: '' };
      set(state);
      persist(state);
    },
    /** Re-read localStorage (used after remote sync updates it) */
    reload() {
      set(loadFromStorage());
    }
  };
}

export const analyticsConnection = createAnalyticsConnectionStore();
export const isAnalyticsConnected = derived(analyticsConnection, ($c) => !!$c.refreshToken);
