# Landing Page — Search Section & Featured Teachers Section

**Date:** 2026-06-09
**Scope:** Frontend only (`src/routes/+page.svelte`, `src/routes/+page.server.ts`)

---

## Problem

1. **Search section** has a tab switcher (Courses / Teachers). The Teachers tab is redundant — the "Meet Our Teachers" section below already surfaces teachers, and early-stage search results for teachers would be thin. The tab switcher should be removed so the search is courses-only.

2. **"Meet Our Teachers" section** renders nothing when no teachers are admin-marked as `is_featured`. The grid is wrapped in `{#if data.featuredTeachers?.length > 0}` which silently hides the entire section. It should always render — with a graceful empty state when there are no featured teachers yet.

---

## Design

### 1. Search Section — Courses Only

**Remove:**
- The `searchTab` state variable
- The `teacherResults` state variable
- The tab switcher `<div>` (the `bg-bgGray` pill with Courses/Teachers buttons)
- The `teachers` fetch inside `runSearch()` — replace with courses-only fetch
- The `{:else}` branch that renders teacher cards

**Keep:**
- The search input and search button (unchanged)
- The courses results grid (unchanged)
- The empty-state text for courses (unchanged)
- The loading spinner (unchanged)

`runSearch()` simplifies to a single `GET /search/courses` call. The `searchTab` state and all teacher-related state is removed entirely.

### 2. Featured Teachers Section — Always Render

**Current behaviour:** `{#if data.featuredTeachers?.length > 0}` wraps the entire grid — the section header and "Browse All" button are visible but the cards area is silently empty.

**New behaviour:** Always render the section. Two sub-cases:

- **Has featured teachers (1–6):** Render the existing card grid. Grid uses `sm:grid-cols-2 lg:grid-cols-3` — at 1–3 cards the grid simply left-aligns without stretching to fill, which looks fine.
- **No featured teachers:** Show a centred text empty state: `"Belum ada guru unggulan. Pantau terus!"` / `"No featured teachers yet. Check back soon!"`. Same `min-h` container so the section doesn't collapse.

**No change to data source** — `+page.server.ts` continues fetching `GET /teachers/featured`.

---

## i18n Keys Required

Two new keys for the empty state (one per locale):

| Key | EN | ID |
|---|---|---|
| `landing.teachersEmpty` | `"No featured teachers yet. Check back soon!"` | `"Belum ada guru unggulan. Pantau terus!"` |

---

## Files Touched

| File | Change |
|---|---|
| `src/routes/+page.svelte` | Remove tab switcher + teacher search state/branch; add empty state to featured teachers section |
| `src/locales/en.json` | Add `landing.teachersEmpty` |
| `src/locales/id.json` | Add `landing.teachersEmpty` |
| `src/routes/+page.server.ts` | No change |

---

## Out of Scope

- Switching the featured teachers section to a different API endpoint
- Pagination in the search results
- Any backend changes
