import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'dashboard-analytics-connection';

interface AnalyticsConnection {
  refreshToken: string;
}

function createAnalyticsConnectionStore() {
  const initial: AnalyticsConnection = { refreshToken: '' };

  if (browser) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.refreshToken) {
          initial.refreshToken = parsed.refreshToken;
        }
      }
    } catch {
      // ignore
    }
  }

  const { subscribe, set, update } = writable<AnalyticsConnection>(initial);

  function persist(state: AnalyticsConnection) {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    }
  };
}

export const analyticsConnection = createAnalyticsConnectionStore();
export const isAnalyticsConnected = derived(analyticsConnection, ($c) => !!$c.refreshToken);
