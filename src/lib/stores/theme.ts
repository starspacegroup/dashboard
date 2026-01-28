import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'dashboard-theme';
const THEME_SET_KEY = 'dashboard-theme-user-set';

function getInitialTheme(): Theme {
  if (!browser) return 'dark';

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const userHasSet = localStorage.getItem(THEME_SET_KEY);

    // If user has explicitly set a preference, use it
    if (userHasSet === 'true' && (stored === 'light' || stored === 'dark')) {
      return stored;
    }

    // First time user - check for system preference, otherwise use dark
    if (!userHasSet) {
      const hasSystemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ||
        window.matchMedia('(prefers-color-scheme: light)').matches;
      if (hasSystemPreference) {
        return 'auto';
      }
      return 'dark';
    }
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error);
  }

  return 'dark';
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
    // For signed-in users with three-way switch (keeps auto option)
    setThemeWithAuto: (theme: Theme) => {
      set(theme);
      if (browser) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        localStorage.setItem(THEME_SET_KEY, 'true');
        applyTheme(theme);
      }
    },
    // For non-signed-in users toggle (removes auto, user has made a choice)
    toggleTheme: () => {
      update(current => {
        if (browser) {
          const currentResolved = current === 'auto' ? getSystemTheme() : current;
          const newTheme = currentResolved === 'light' ? 'dark' : 'light';

          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
          localStorage.setItem(THEME_SET_KEY, 'true');
          applyTheme(newTheme);

          return newTheme;
        }
        return current;
      });
    },
    getCurrentResolvedTheme: (): 'light' | 'dark' => {
      if (!browser) return 'dark';
      let currentTheme: Theme = 'dark';
      subscribe(t => currentTheme = t)();
      // Need to cast because TypeScript can't track the subscription pattern correctly
      const themeValue = currentTheme as Theme;
      return themeValue === 'auto' ? getSystemTheme() : themeValue;
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
