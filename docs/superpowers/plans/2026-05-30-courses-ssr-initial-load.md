# Courses SSR Initial Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the cold-load spinner on `/courses` by fetching the default first page server-side so data is available the moment the page renders.

**Architecture:** Extend `+page.server.ts` to fetch `GET /courses?page=1&limit=12` alongside the auth guard and return it as `{ courses, totalPages }`. The page component initializes its state from this server data instead of empty defaults, removes the `onMount` courses fetch, and replaces the `$effect` filter watcher with explicit `onchange` handlers to avoid a spurious mount-time refetch.

**Tech Stack:** SvelteKit, Svelte 5 runes, TypeScript

---

### Task 1: Add courses fetch to the server load

**Files:**
- Modify: `src/routes/courses/+page.server.ts`

- [ ] **Step 1: Replace the server load file**

Replace the entire contents of `src/routes/courses/+page.server.ts`:

**Current file:**
```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return {};
};
```

**New file:**
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

- [ ] **Step 2: Run type check**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS` — same pre-existing warnings, no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/courses/+page.server.ts
git commit -m "feat: SSR initial courses data to eliminate cold-load spinner"
```

---

### Task 2: Initialize page state from server data and fix filter effects

**Files:**
- Modify: `src/routes/courses/+page.svelte:37-42` (state init)
- Modify: `src/routes/courses/+page.svelte:180-195` (onMount + $effect)
- Modify: `src/routes/courses/+page.svelte:239-248` (subject select)
- Modify: `src/routes/courses/+page.svelte:267-275` (status select)

- [ ] **Step 1: Initialize state from server data**

In `src/routes/courses/+page.svelte`, find lines 37–42:

```svelte
	// Course data
	let courses = $state<any[]>([]);
	let loading = $state(true);
	let subjects = $state<{ id: string; name: string }[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
```

Replace with:

```svelte
	// Course data — initialized from SSR, updated by client fetches
	let courses = $state<any[]>(data.courses ?? []);
	let loading = $state(false);
	let subjects = $state<{ id: string; name: string }[]>([]);
	let page = $state(1);
	let totalPages = $state(data.totalPages ?? 1);
```

- [ ] **Step 2: Remove fetchCourses from onMount and remove the $effect**

Find lines 180–195:

```svelte
	onMount(async () => {
		await fetchCourses();
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string; status: string }>>('/subjects?status=verified');
			subjects = body.data;
		} catch {
			subjects = [];
		}
	});

	$effect(() => {
		subjectFilter;
		statusFilter;
		page = 1;
		scheduleRefetch();
	});
```

Replace with:

```svelte
	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string; status: string }>>('/subjects?status=verified');
			subjects = body.data;
		} catch {
			subjects = [];
		}
	});
```

- [ ] **Step 3: Add onchange to the subject select**

Find the subject select (around line 239):

```svelte
		<select
			bind:value={subjectFilter}
			aria-label={$t('courses.allSubjects')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
```

Replace with:

```svelte
		<select
			bind:value={subjectFilter}
			onchange={() => { page = 1; scheduleRefetch(); }}
			aria-label={$t('courses.allSubjects')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
```

- [ ] **Step 4: Add onchange to the status select**

Find the status select (around line 267):

```svelte
		<select
			bind:value={statusFilter}
			aria-label={$t('courses.allStatuses')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
```

Replace with:

```svelte
		<select
			bind:value={statusFilter}
			onchange={() => { page = 1; scheduleRefetch(); }}
			aria-label={$t('courses.allStatuses')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
```

- [ ] **Step 5: Run type check**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

- [ ] **Step 6: Manual smoke test**

Start the dev server (`npm run dev`) with the backend running at `http://localhost:8000`.

- Open `http://localhost:5173/courses` — grid renders immediately with no spinner. ✓
- Navigate to any course detail page, then press Back — grid renders immediately with no spinner. ✓
- Change the subject filter dropdown — grid dims briefly, updates in-place. ✓
- Change the status filter dropdown — same. ✓
- Toggle an age chip or type in search — debounced refetch, no flicker. ✓

- [ ] **Step 7: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "fix: initialize courses state from SSR data, replace \$effect with onchange handlers"
```
