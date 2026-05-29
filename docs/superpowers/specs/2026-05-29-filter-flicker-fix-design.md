# Filter Flicker Fix — Design Spec

**Date:** 2026-05-29
**Status:** Approved

## Problem

Three pages show a visible flicker when data is loading:

1. `/courses` — on initial page open, the grid disappears and reappears
2. `/admin/teachers` — table flickers when the status filter changes
3. `/admin/students` — table flickers when the status filter changes

**Root cause:** Each page uses `{#if loading} <spinner> {:else} <content> {/if}`. When `loading` becomes `true`, the entire content area is unmounted and replaced with a spinner. When loading completes, content remounts. This unmount/remount cycle is the flicker.

## Solution: Stale-while-revalidate

Keep existing data visible while a refetch is in progress. Dim the content with `opacity-50 pointer-events-none` to signal loading. Only show the full spinner on the very first load when there is no data to display.

### Template pattern (applied to all three pages)

**Before:**
```svelte
{#if loading}
  <spinner />
{:else if data.length === 0}
  <empty-state />
{:else}
  <content />
{/if}
```

**After:**
```svelte
{#if loading && data.length === 0}
  <spinner />
{:else if data.length === 0}
  <empty-state />
{:else}
  <div class:opacity-50={loading} class:pointer-events-none={loading}>
    <content />
  </div>
{/if}
```

### Behaviour by scenario

| Scenario | Before | After |
|---|---|---|
| Cold page open (no data) | Spinner → content | Spinner → content (unchanged) |
| Filter change (data present) | Content → spinner → content (flicker) | Content dims → content updates (no flicker) |
| Filter returns 0 results | Content → spinner → empty state (flicker) | Content dims → empty state (smooth) |

## Files Changed

| File | Change |
|---|---|
| `src/routes/courses/+page.svelte` | Apply pattern to courses grid; state var is `courses` / `loading` |
| `src/routes/admin/teachers/+page.svelte` | Apply pattern to teachers table; state vars are `allTeachers` / `allTeachersLoading` |
| `src/routes/admin/students/+page.svelte` | Apply pattern to students table; state vars are `allStudents` / `allStudentsLoading` |

## Out of Scope

- Admin subjects page (pagination-only, no filter — not reported)
- Reports, calendar, dashboard pages — not reported
- No backend changes required
- No new components or utilities
