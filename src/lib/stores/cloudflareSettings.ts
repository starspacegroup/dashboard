import { writable } from 'svelte/store';

interface CloudflareSettingsState {
  isOpen: boolean;
  widgetId: string | null;
  /** True when the widget was just added and the panel should reveal it on close. */
  isFirstTimeSetup: boolean;
}

function createCloudflareSettingsStore() {
  const { subscribe, set, update } = writable<CloudflareSettingsState>({
    isOpen: false,
    widgetId: null,
    isFirstTimeSetup: false
  });

  return {
    subscribe,
    open: (widgetId: string, isFirstTimeSetup = false) => {
      set({ isOpen: true, widgetId, isFirstTimeSetup });
    },
    close: () => {
      update((state) => ({ ...state, isOpen: false }));
    },
    reset: () => {
      set({ isOpen: false, widgetId: null, isFirstTimeSetup: false });
    }
  };
}

export const cloudflareSettings = createCloudflareSettingsStore();
