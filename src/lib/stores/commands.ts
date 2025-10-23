import { writable } from 'svelte/store';
import { theme } from './theme';
import { browser } from '$app/environment';

export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: 'search' | 'theme' | 'navigation' | 'custom';
  execute: (query?: string) => void;
}

function createCommandsStore() {
  const { subscribe, set } = writable<Command[]>([]);

  const baseCommands: Command[] = [
    {
      id: 'google-search',
      name: 'Google Search',
      description: 'Search Google (g %s)',
      shortcut: 'g',
      category: 'search',
      execute: (query?: string) => {
        if (browser && query) {
          const searchQuery = encodeURIComponent(query);
          window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
        }
      }
    },
    {
      id: 'amazon-search',
      name: 'Amazon Search',
      description: 'Search Amazon (am %s)',
      shortcut: 'am',
      category: 'search',
      execute: (query?: string) => {
        if (browser && query) {
          const searchQuery = encodeURIComponent(query);
          window.open(`https://www.amazon.com/s?k=${searchQuery}`, '_blank');
        }
      }
    },
    {
      id: 'theme-light',
      name: 'Theme: Light',
      description: 'Switch to light theme',
      category: 'theme',
      execute: () => {
        theme.setTheme('light');
      }
    },
    {
      id: 'theme-dark',
      name: 'Theme: Dark',
      description: 'Switch to dark theme',
      category: 'theme',
      execute: () => {
        theme.setTheme('dark');
      }
    },
    {
      id: 'theme-auto',
      name: 'Theme: Auto',
      description: 'Switch to automatic theme (follows system)',
      category: 'theme',
      execute: () => {
        theme.setTheme('auto');
      }
    }
  ];

  set(baseCommands);

  return {
    subscribe,
    addCommand: (command: Command) => {
      subscribe(commands => {
        set([...commands, command]);
        return commands;
      })();
    },
    removeCommand: (id: string) => {
      subscribe(commands => {
        set(commands.filter(cmd => cmd.id !== id));
        return commands;
      })();
    }
  };
}

export const commands = createCommandsStore();
