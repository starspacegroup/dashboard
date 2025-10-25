import { writable } from 'svelte/store';

function createVoiceChatStore() {
  const { subscribe, set } = writable(false);

  return {
    subscribe,
    open: () => set(true),
    close: () => set(false),
    toggle: () => {
      let currentValue = false;
      subscribe(value => currentValue = value)();
      set(!currentValue);
    }
  };
}

export const voiceChat = createVoiceChatStore();
