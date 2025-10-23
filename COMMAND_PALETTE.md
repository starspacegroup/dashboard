# Command Palette Feature

## Overview

The command palette is an app-wide feature that provides quick access to various
commands and search functionality.

## Usage

### Opening the Command Palette

- Press the **ESC** key anywhere in the app to toggle the command palette
- Click the **⌘** button in the header navigation

### Available Commands

#### Search Commands

These commands allow you to quickly search external services:

1. **Google Search** - `g <search term>`
   - Example: Type `g hello world` and press Enter
   - Opens Google search in a new tab

2. **Amazon Search** - `am <search term>`
   - Example: Type `am laptop` and press Enter
   - Opens Amazon search in a new tab

#### Theme Commands

Switch between different theme modes:

1. **Theme: Light** - Switch to light theme
2. **Theme: Dark** - Switch to dark theme
3. **Theme: Auto** - Follow system theme preference

### Navigation

- **↑/↓ Arrow Keys** - Navigate through commands
- **Enter** - Execute the selected command
- **ESC** - Close the command palette
- **Type to search** - Filter commands by name or description

## Implementation

### Files Created

1. `src/lib/stores/commands.ts` - Store for managing available commands
2. `src/lib/components/CommandPalette.svelte` - Main command palette component

### Files Modified

1. `src/routes/+layout.svelte` - Added command palette integration and ESC key
   handler

## Extending the Command Palette

To add new commands, modify `src/lib/stores/commands.ts`:

```typescript
{
  id: 'unique-command-id',
  name: 'Command Name',
  description: 'Command description (shortcut %s)',
  shortcut: 'shortcut', // Optional: for quick access
  category: 'search' | 'theme' | 'navigation' | 'custom',
  execute: (query?: string) => {
    // Command implementation
  }
}
```

### Example: Adding a Wikipedia Search Command

```typescript
{
  id: 'wikipedia-search',
  name: 'Wikipedia Search',
  description: 'Search Wikipedia (wiki %s)',
  shortcut: 'wiki',
  category: 'search',
  execute: (query?: string) => {
    if (browser && query) {
      const searchQuery = encodeURIComponent(query);
      window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${searchQuery}`, '_blank');
    }
  }
}
```
