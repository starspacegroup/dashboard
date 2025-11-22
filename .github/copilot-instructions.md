# GitHub Copilot Instructions

## Project Overview

This is a SvelteKit dashboard application with a strong emphasis on consistent theming and user experience.

## Core Principles

### 1. Theme System - STRICT ENFORCEMENT

**CRITICAL: NO HARDCODED COLORS EVER**

- **All colors MUST use CSS custom properties (variables)** defined in the theme system
- Never use hardcoded colors like `#fff`, `black`, `rgb()`, `hsl()`, etc.
- Check `src/app.css` and theme-related files for available CSS variables
- If a color variable doesn't exist, create it in the theme system first

**Browser Component Overrides**

- Override ALL browser default styles that may show unwanted colors
- Special attention to form elements in all states:
  - Input fields (text, email, password, etc.)
  - Select dropdowns
  - Checkboxes and radio buttons
  - Buttons
  - Focus states
  - Disabled states
  - Placeholder text
  - **Autofill states** - CRITICAL: prevent white flash on dark theme
- Override scrollbar styles to match theme
- Override selection/highlight colors
- Override outline colors on focus

**Autofill State Handling**

```css
/* Example: Always handle autofill */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px var(--background) inset !important;
  -webkit-text-fill-color: var(--foreground) !important;
  caret-color: var(--foreground);
}
```

**Form Element Best Practices**

- Always style `:focus`, `:hover`, `:active`, `:disabled`, `:invalid` states
- Use `appearance: none` to remove browser defaults
- Apply theme colors to borders, backgrounds, and text
- Handle dark mode specifically for form validation messages

### 2. Code Quality Standards

**TypeScript**

- Use strict typing - no `any` types without explicit justification
- Define interfaces for all data structures
- Use type guards where appropriate
- Leverage SvelteKit's generated types

**Svelte Best Practices**

- Use reactive statements (`$:`) for derived state
- Keep components focused and single-purpose
- Use stores for global state management
- Prefer composition over prop drilling
- Use `export let` for component props with TypeScript types

**Naming Conventions**

- Components: PascalCase (e.g., `CalendarWidget.svelte`)
- Files/folders: kebab-case for routes, PascalCase for components
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case
- CSS custom properties: `--kebab-case`

### 3. File Organization

**Component Structure**

```svelte
<script lang="ts">
  // 1. Imports
  // 2. Props (export let)
  // 3. Stores
  // 4. State variables
  // 5. Reactive statements
  // 6. Functions
  // 7. Lifecycle hooks
</script>

<!-- Template -->

<style>
  /* Scoped component styles */
  /* ALWAYS use CSS variables for colors */
</style>
```

**Imports Order**

1. Svelte/SvelteKit imports
2. Third-party libraries
3. Local components
4. Stores
5. Types
6. Utils/helpers

### 4. SvelteKit Specific

**Server Routes**

- Use `+server.ts` for API endpoints
- Properly handle errors with appropriate status codes
- Use TypeScript for request/response types
- Implement proper error handling and validation

**Page Structure**

- Use `+page.svelte` for page components
- Use `+page.server.ts` or `+page.ts` for data loading
- Use `+layout.svelte` for shared layouts
- Use `+layout.server.ts` for layout-level data

**Performance**

- Lazy load heavy components when possible
- Use `{#await}` for async operations
- Minimize reactivity recalculations
- Use `onMount` for browser-only code

### 5. Styling Guidelines

**CSS Structure**

- Global styles in `src/app.css`
- Component-specific styles in `<style>` blocks
- Use CSS custom properties for theming
- Mobile-first responsive design

**Responsive Design**

- Start with mobile layout
- Use media queries for larger screens
- Test all breakpoints
- Consider tablet sizes between mobile and desktop

**Accessibility**

- Always include ARIA labels where needed
- Ensure keyboard navigation works
- Maintain proper heading hierarchy
- Test with screen readers in mind
- Ensure color contrast meets WCAG standards using theme variables

### 6. State Management

**Stores**

- Use Svelte stores for shared state
- Keep store files in `src/lib/stores/`
- Use writable stores for mutable state
- Use derived stores for computed values
- Use readable stores for external data sources

**Local State**

- Use `let` for component-local state
- Use reactive statements for derived values
- Avoid unnecessary global state

### 7. Error Handling

- Always handle potential errors in async operations
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Use try-catch blocks for error-prone operations
- Handle edge cases explicitly

### 8. Testing & Validation

**Before Committing**

- Ensure no TypeScript errors
- Test in both light and dark themes
- Verify no hardcoded colors exist
- Check responsive behavior
- Test form interactions including autofill
- Validate accessibility

### 9. Security

- Sanitize user input
- Use environment variables for sensitive data
- Validate data on both client and server
- Follow SvelteKit security best practices

### 10. Documentation

**Code Comments**

- Comment complex logic
- Document non-obvious decisions
- Use JSDoc for functions and types
- Keep comments up to date

**Component Props**

```typescript
/**
 * A reusable button component
 * @component
 */
export interface ButtonProps {
  /** The button label text */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Button variant - uses theme colors */
  variant?: 'primary' | 'secondary' | 'danger';
}
```

## Quick Reference

### Theme Color Usage

✅ **DO:**
```css
.element {
  background: var(--background);
  color: var(--foreground);
  border-color: var(--border);
}
```

❌ **DON'T:**
```css
.element {
  background: #fff;
  color: black;
  border-color: rgb(200, 200, 200);
}
```

### Form Styling Template

```css
input, select, textarea {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
  appearance: none;
}

input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px var(--background) inset !important;
  -webkit-text-fill-color: var(--foreground) !important;
}
```

## Common Patterns

### Loading States

```svelte
{#await promise}
  <p>Loading...</p>
{:then data}
  <Component {data} />
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

### Conditional Rendering

```svelte
{#if condition}
  <Element />
{:else if otherCondition}
  <OtherElement />
{:else}
  <FallbackElement />
{/if}
```

### Iterating with Key

```svelte
{#each items as item (item.id)}
  <Item {item} />
{/each}
```

## Remember

1. **NEVER hardcode colors** - this is non-negotiable
2. **Always test in both light and dark themes**
3. **Override all browser defaults** that might show wrong colors
4. **Handle form autofill explicitly** to prevent white flashes
5. **Think accessibility first**
6. **Type everything with TypeScript**
7. **Keep components focused and reusable**
8. **Test responsive behavior on all screen sizes**

---

*Last updated: November 21, 2025*
