# Design: AuthLayout Content Centering Fix

**Date:** 2026-05-22  
**Status:** Approved

## Problem

On viewports ≥ 1520px, content inside all authenticated pages (admin, teacher, student) is left-aligned within the post-sidebar space instead of centered. Root cause: `<main>` in `AuthLayout.svelte` has both `sidebar-collapse:ml-60` and `mx-auto`. The `ml-60` (240px fixed left margin) overrides `mx-auto`'s left-auto, so the remaining free space after `max-w-app` (1280px) accumulates entirely on the right.

Example at 1600px viewport:
- Post-sidebar space: 1360px
- Content width: 1280px (capped by `max-w-app`)
- Current: 0px left gap, 80px right gap (left-aligned)
- Expected: 40px left gap, 40px right gap (centered)

## Solution

Move `max-w-app mx-auto w-full` off `<main>` onto an inner `<div>` wrapping the page slot. `<main>` becomes a positioning + padding container only; the inner `<div>` centers itself within the available space after the sidebar.

**File:** `src/lib/components/layout/AuthLayout.svelte`

```svelte
<!-- Before -->
<main
  id="main-content"
  tabindex="-1"
  class="flex-1 sidebar-collapse:ml-60 p-6 lg:p-8 max-w-app mx-auto w-full focus:outline-none"
>
  {#if children}{@render children()}{/if}
</main>

<!-- After -->
<main
  id="main-content"
  tabindex="-1"
  class="flex-1 sidebar-collapse:ml-60 p-6 lg:p-8 focus:outline-none"
>
  <div class="max-w-app mx-auto">
    {#if children}{@render children()}{/if}
  </div>
</main>
```

## Scope

- One file changed: `src/lib/components/layout/AuthLayout.svelte`
- No page-level changes required
- Fixes all authenticated routes: admin, admin/teachers, admin/students, admin/subjects, dashboard, courses, calendar, reports, profiles

## Behaviour at each breakpoint

| Viewport | Post-sidebar space | Content width | Left gap | Right gap |
|---|---|---|---|---|
| 960–1519px | < 1280px | fills available | 0 | 0 |
| 1520px | = 1280px | 1280px | 0 | 0 |
| 1600px | 1360px | 1280px | 40px | 40px |
| 1920px | 1680px | 1280px | 200px | 200px |

## Testing

- Open `/admin/teachers` on a 1600px viewport — table card should be horizontally centered between sidebar right edge and viewport right edge
- Resize to 1440px — content should still fill full available width (no gaps)
- Check `/admin/students`, `/admin/subjects`, `/dashboard` for visual consistency
