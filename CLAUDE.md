# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit 2 dashboard application with draggable widgets (weather, traffic, calendar, GitHub repos/PRs). Deployed to Cloudflare Pages using `@sveltejs/adapter-cloudflare`. Authentication via Auth.js with GitHub OAuth.

## Commands

```bash
npm run dev          # Start dev server on port 4200 (0.0.0.0:4200)
npm run build        # Production build
npm run preview      # Preview production build on port 4200
npm run check        # Run svelte-kit sync + svelte-check
npm run lint         # Run ESLint
```

## Architecture

### Widget System
- **Store**: `src/lib/stores/widgets.ts` - Manages widget state with localStorage persistence
- **Types**: `src/lib/types/widget.ts` - Widget and Section interfaces
- **Layout**: `src/lib/components/ColumnLayout.svelte` - Grid-based layout with draggable sections
- Widgets have `type`, `section` (which column), `order` (position within section), and optional `config`
- Sections define a flexible grid layout (1-4 columns, spanning supported)
- Widget positions are stored per-layout fingerprint to remember arrangements

### Authentication
- `src/hooks.server.ts` - SvelteKitAuth configuration with GitHub provider
- Session includes `accessToken` and GitHub `login` username
- Scopes: `read:user user:email read:org repo read:project manage_billing:copilot`

### API Routes
- `/api/weather` - Weather data from Open-Meteo with server-side caching (`src/lib/server/weatherCache.ts`)
- `/api/geocode` - Location geocoding
- `/api/maps-config` - Google Maps configuration

### State Management
- `src/lib/stores/theme.ts` - Theme toggle (light/dark)
- `src/lib/stores/widgets.ts` - Widget/section state
- `src/lib/stores/commands.ts` - Command palette actions
- `src/lib/stores/weatherSettings.ts` - Weather widget configuration modal

### Global Styles
- `src/app.css` - Theme CSS custom properties, browser default overrides, form styling

## Theme System (CRITICAL)

**All colors MUST use CSS custom properties. Never use hardcoded colors like `#fff`, `black`, `rgb()`, `hsl()`.**

Key variables defined in `src/app.css`:
- `--primary-color`, `--background`, `--surface`, `--surface-variant`
- `--text-primary`, `--text-secondary`, `--border`
- Status: `--success`, `--error`, `--warning`, `--info`

Dark mode: Applied via `.dark` class on root element.

**Autofill handling is critical** - use `-webkit-box-shadow` inset trick to prevent white flash:
```css
input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px var(--surface) inset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
}
```

## Environment Variables

Required in `.env` (see `.env.example`):
- `GITHUB_ID`, `GITHUB_SECRET` - GitHub OAuth app credentials
- `AUTH_SECRET` - Auth.js secret (generate with `openssl rand -base64 32`)
- `AUTH_TRUST_HOST=true` - Required for local dev
- `GOOGLE_MAPS_API_KEY` - For Traffic Widget (optional)

## Svelte Component Structure

```svelte
<script lang="ts">
  // 1. Imports (Svelte/SvelteKit → third-party → local → stores → types → utils)
  // 2. Props (export let)
  // 3. Stores
  // 4. State variables
  // 5. Reactive statements ($:)
  // 6. Functions
  // 7. Lifecycle hooks
</script>

<!-- Template -->

<style>
  /* Scoped styles - use CSS variables for colors */
</style>
```

## Deployment

Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `.svelte-kit/cloudflare`
- Set environment variables in Cloudflare Pages settings
