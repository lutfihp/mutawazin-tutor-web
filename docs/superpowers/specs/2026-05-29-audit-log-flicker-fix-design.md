# Audit Log Flicker Fix — Design Spec

**Date:** 2026-05-29
**Status:** Approved

## Problem

`/admin/settings/audit-log` flickers when Apply is pressed multiple times. On each fetch, existing rows are replaced with skeleton rows, then replaced back — causing a visible flash.

## Solution

Same stale-while-revalidate pattern applied to the previous flicker fix (courses, teachers, students).

**Two edits to `src/routes/admin/settings/audit-log/+page.svelte`:**

1. **tbody condition (line 188):** Change `{#if loading}` → `{#if loading && entries.length === 0}` so skeleton rows only appear on the initial load when there are no entries yet.

2. **overflow wrapper (line 175):** Add `class:opacity-50={loading} class:pointer-events-none={loading}` to `<div class="overflow-x-auto">` so the table dims in-place during refetch instead of disappearing.

## Behaviour

| Scenario | Before | After |
|---|---|---|
| First load (no data) | Skeleton rows | Skeleton rows (unchanged) |
| Apply with data present | Rows → skeleton → rows (flicker) | Rows dim → rows update (no flicker) |
| Apply returns 0 results | Rows → skeleton → empty (flicker) | Rows dim → empty (smooth) |

## Files Changed

| File | Change |
|---|---|
| `src/routes/admin/settings/audit-log/+page.svelte` | 2 one-line edits — lines 175 and 188 |

## Out of Scope

No other pages. No backend changes.
