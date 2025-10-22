import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'dashboard-theme';

function getInitialTheme(): Theme {
  if (!browser) return 'auto';

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error);
  }

  return 'auto';
}

function getSystemTheme(): 'light' | 'dark' {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>(getInitialTheme());

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      set(theme);
      if (browser) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        applyTheme(theme);
      }
    },
    initialize: () => {
      if (browser) {
        const theme = getInitialTheme();
        applyTheme(theme);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          update(current => {
            if (current === 'auto') {
              applyTheme('auto');
            }
            return current;
          });
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
          mediaQuery.removeEventListener('change', handleChange);
        };
      }
    }
  };
}

function applyTheme(theme: Theme) {
  if (!browser) return;

  const resolvedTheme = theme === 'auto' ? getSystemTheme() : theme;

  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

export const theme = createThemeStore();
