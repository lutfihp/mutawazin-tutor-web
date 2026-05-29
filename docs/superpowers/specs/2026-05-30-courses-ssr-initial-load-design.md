# Courses Page SSR Initial Load — Design Spec

**Date:** 2026-05-30
**Status:** Approved

## Problem

`/courses` shows a spinner on every first load (initial navigation and every back-navigation), because all data is fetched client-side in `onMount`. The stale-while-revalidate fix (session 16) eliminated filter-change flicker but not the cold-load spinner.

Additionally, the `$effect` watching `subjectFilter`/`statusFilter` fires on mount, triggering a redundant refetch 300ms after the initial `onMount` fetch — causing two fetches on every page open.

## Solution

Server-render the default first page of courses so data is available the moment the page renders. Filter changes continue using CSR (debounced fetch). The `$effect` is replaced with explicit `onchange` handlers to avoid a spurious mount-time refetch.

## Files Changed

### `src/routes/courses/+page.server.ts`

Extend the existing load function (currently auth-guard only) to also fetch the initial courses page:

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) throw redirect(302, '/login');

  const token = cookies.get('access_token');
  const headers: HeadersInit = token ? { Cookie: `access_token=${token}` } : {};

  try {
    const res = await fetch(`${BASE}/courses?page=1&limit=12`, { headers });
    const body = res.ok ? await res.json() : null;
    return {
      courses: body?.data ?? [],
      totalPages: body?.pagination?.totalPages ?? 1,
    };
  } catch {
    return { courses: [], totalPages: 1 };
  }
};
```

### `src/routes/courses/+page.svelte`

Three changes:

**1. Initialize state from server data:**
```js
let courses = $state<any[]>(data.courses ?? []);
let loading  = $state(false);          // was true
let totalPages = $state(data.totalPages ?? 1);
```

**2. Remove the initial fetch from `onMount`:**
```js
onMount(async () => {
  // fetchCourses() removed — SSR provides initial data
  try {
    const body = await api.get<PaginatedResponse<...>>('/subjects?status=verified');
    subjects = body.data;
  } catch {
    subjects = [];
  }
});
```

**3. Replace the `$effect` with explicit `onchange` handlers on both selects:**

Remove:
```svelte
$effect(() => {
  subjectFilter;
  statusFilter;
  page = 1;
  scheduleRefetch();
});
```

Add `onchange` to the subject select:
```svelte
<select bind:value={subjectFilter}
  onchange={() => { page = 1; scheduleRefetch(); }}
  ...>
```

Add `onchange` to the status select:
```svelte
<select bind:value={statusFilter}
  onchange={() => { page = 1; scheduleRefetch(); }}
  ...>
```

## Behaviour

| Scenario | Before | After |
|---|---|---|
| First open `/courses` | Spinner → grid (flicker) | Grid renders instantly (no spinner) |
| Navigate away and back | Spinner → grid (flicker) | Grid renders instantly |
| Change subject/status filter | Grid dims → updates (no flicker) | Same — unchanged |
| Change age chips or search | Debounced refetch | Same — unchanged |
| Pagination | Dims → updates | Same — unchanged |

## Out of Scope

- Calendar and Reports pages (not reported)
- No backend changes
- No other pages
