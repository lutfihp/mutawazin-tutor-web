# Delta v11: Pagination Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 9 list endpoints from plain-array responses to `PaginatedResponse<T>`, add a shared `<Pagination />` component, wire pagination UI to the 5 main list pages, and fix the audit log's two additional breaking changes.

**Architecture:** Add `PaginationMeta` / `PaginatedResponse<T>` to `src/lib/api.ts`; create one shared `Pagination.svelte` component; update Category A pages (teachers, students, subjects, courses, reports) to track `page` + `totalPages` state; Category B pages just unwrap `.data`; audit log also renames `page_size` → `limit` and updates all field refs.

**Tech Stack:** SvelteKit (Svelte 5 runes), `api.get<T>()` helper, Tailwind v3, `<Button variant="secondary">` for pagination controls. Verification via `npm run check` (0 errors, 12 warnings baseline).

---

## File Map

| File | Action |
|---|---|
| `src/lib/api.ts` | Modify — add `PaginationMeta`, `PaginatedResponse<T>`; remove `AuditLogListResponse` |
| `src/lib/components/ui/Pagination.svelte` | **Create** — shared Prev/Next pagination component |
| `src/routes/admin/settings/audit-log/+page.svelte` | Modify — fix `page_size`→`limit`, field refs, retire `AuditLogListResponse`, use `<Pagination />` |
| `src/routes/admin/teachers/+page.svelte` | Modify — add page state, pass `page`/`limit` to fetch, move filter to server, use `<Pagination />` |
| `src/routes/admin/students/+page.svelte` | Modify — same pattern as teachers |
| `src/routes/admin/subjects/+page.svelte` | Modify — add page state, pass `page`/`limit`, use `<Pagination />` |
| `src/routes/courses/+page.svelte` | Modify — add page state for courses, reset on filter change; unwrap `.data` on sub-calls |
| `src/routes/reports/[studentId]/+page.svelte` | Modify — add page state, pass `page`/`limit`, use `<Pagination />` |
| `src/routes/admin/courses/+page.svelte` | Modify — unwrap `.data` on all three endpoints |
| `src/routes/admin/calendar/+page.svelte` | Modify — unwrap `.data` on teachers, students, recurring templates |
| `src/routes/calendar/+page.svelte` | Modify — unwrap `.data` on recurring templates, courses, students |
| `src/routes/dashboard/+page.svelte` | Modify — unwrap `.data` on students |
| `src/routes/register/teacher/+page.svelte` | Modify — unwrap `.data` on subjects |
| `src/routes/admin/+page.server.ts` | Modify — unwrap `.data` on teachers, students, subjects server-side fetches |
| `src/routes/students/[id]/+page.server.ts` | Modify — unwrap `.data` on reports server-side fetch |

---

## Task 1: Add shared types to `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Replace `AuditLogListResponse` with `PaginationMeta` and `PaginatedResponse<T>`**

Open `src/lib/api.ts`. The current end of the file is:

```typescript
export type AuditLogListResponse = {
	total: number;
	page: number;
	page_size: number;
	items: AuditLogEntry[];
};
```

Replace that entire block with:

```typescript
export type PaginationMeta = {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

export type PaginatedResponse<T> = {
	data: T[];
	pagination: PaginationMeta;
};
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```

Expected: TypeScript will now complain about `AuditLogListResponse` being used in the audit log page (1–2 new errors). That's expected — it will be fixed in Task 3. If you see errors only in `audit-log/+page.svelte`, proceed.

---

## Task 2: Create shared `<Pagination />` component

**Files:**
- Create: `src/lib/components/ui/Pagination.svelte`

- [ ] **Step 1: Create the component**

Create `src/lib/components/ui/Pagination.svelte` with this content:

```svelte
<script lang="ts">
	import Button from './Button.svelte';

	let { page, totalPages, onPage }: {
		page: number;
		totalPages: number;
		onPage: (n: number) => void;
	} = $props();
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-between px-4 py-3 border-t border-border">
		<Button variant="secondary" disabled={page === 1} onclick={() => onPage(page - 1)}>Prev</Button>
		<span class="text-sm text-text2">Page {page} of {totalPages}</span>
		<Button variant="secondary" disabled={page >= totalPages} onclick={() => onPage(page + 1)}>Next</Button>
	</div>
{/if}
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```

Expected: still the same errors from Task 1 (audit log only), no new errors from the component itself.

---

## Task 3: Migrate audit log page

**Files:**
- Modify: `src/routes/admin/settings/audit-log/+page.svelte`

This page has two breaking changes: `page_size` → `limit` query param, and the entire response shape changed from `AuditLogListResponse` to `PaginatedResponse<AuditLogEntry>`.

- [ ] **Step 1: Update the import**

Find in the `<script>` block:

```typescript
	import type { AuditLogEntry, AuditLogListResponse } from '$lib/api';
```

Replace with:

```typescript
	import type { AuditLogEntry, PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
```

- [ ] **Step 2: Replace `total` state with `totalPages`**

Find:

```typescript
	let entries = $state<AuditLogEntry[]>([]);
	let total = $state(0);
	let page = $state(1);
	const pageSize = 50;
```

Replace with:

```typescript
	let entries = $state<AuditLogEntry[]>([]);
	let totalPages = $state(1);
	let page = $state(1);
	const pageSize = 50;
```

- [ ] **Step 3: Update `fetchLogs()` — rename param and unwrap response**

Find the entire `fetchLogs` function:

```typescript
	async function fetchLogs() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams();
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			if (actionFilter) params.set('action', actionFilter);
			if (resourceTypeFilter) params.set('resource_type', resourceTypeFilter);
			params.set('page', String(page));
			params.set('page_size', String(pageSize));
			const data = await api.get<AuditLogListResponse>(`/admin/audit-logs?${params}`);
			entries = data.items;
			total = data.total;
		} catch (e) {
			error = e instanceof Error ? e.message : $t('auditLog.error');
		} finally {
			loading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchLogs() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams();
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			if (actionFilter) params.set('action', actionFilter);
			if (resourceTypeFilter) params.set('resource_type', resourceTypeFilter);
			params.set('page', String(page));
			params.set('limit', String(pageSize));
			const body = await api.get<PaginatedResponse<AuditLogEntry>>(`/admin/audit-logs?${params}`);
			entries = body.data;
			totalPages = body.pagination.totalPages;
		} catch (e) {
			error = e instanceof Error ? e.message : $t('auditLog.error');
		} finally {
			loading = false;
		}
	}
```

- [ ] **Step 4: Replace the pagination UI in the template**

Find the pagination block at the bottom of the card (inside the `<Card padding="none">` component):

```svelte
		<!-- Pagination -->
		{#if total > pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<Button variant="secondary" disabled={page === 1} onclick={() => changePage(page - 1)}>Prev</Button>
				<span class="text-sm text-text2">Page {page} of {Math.ceil(total / pageSize)}</span>
				<Button variant="secondary" disabled={page * pageSize >= total} onclick={() => changePage(page + 1)}>Next</Button>
			</div>
		{/if}
```

Replace with:

```svelte
		<!-- Pagination -->
		<Pagination {page} {totalPages} onPage={changePage} />
```

- [ ] **Step 5: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS` — all audit log errors resolved, no new ones.

---

## Task 4: Add pagination to admin teachers page

**Files:**
- Modify: `src/routes/admin/teachers/+page.svelte`

- [ ] **Step 1: Add imports and pagination state**

Find in the `<script>` block:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
```

- [ ] **Step 2: Add page state variables after the existing state declarations**

Find:

```typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allTeachers = $state<any[]>([]);
	let allTeachersLoading = $state(true);
	let statusFilter = $state('');
	let featuredMap = $state<Record<string, boolean>>({});
	let featuredLoading = $state<Record<string, boolean>>({});

	const filteredTeachers = $derived(
		allTeachers.filter((u: any) =>
			statusFilter ? (u.status ?? '').toLowerCase() === statusFilter : true
		)
	);
```

Replace with:

```typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allTeachers = $state<any[]>([]);
	let allTeachersLoading = $state(true);
	let statusFilter = $state('');
	let featuredMap = $state<Record<string, boolean>>({});
	let featuredLoading = $state<Record<string, boolean>>({});
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 25;
```

- [ ] **Step 3: Update `fetchTeachers()` to send page/limit and unwrap response**

Find:

```typescript
	async function fetchTeachers() {
		allTeachersLoading = true;
		try {
			const teachers = await api.get<any[]>('/admin/teachers');
			allTeachers = (Array.isArray(teachers) ? teachers : [])
				.filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending' && t.status !== 'deleted');
			featuredMap = Object.fromEntries(
				allTeachers.map((t: any) => [t.user_id ?? t.id, t.is_featured ?? false])
			);
		} catch {
			allTeachers = [];
		} finally {
			allTeachersLoading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchTeachers() {
		allTeachersLoading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (statusFilter) params.set('status', statusFilter);
			const body = await api.get<PaginatedResponse<any>>(`/admin/teachers?${params}`);
			allTeachers = body.data
				.filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending' && t.status !== 'deleted');
			totalPages = body.pagination.totalPages;
			featuredMap = Object.fromEntries(
				allTeachers.map((t: any) => [t.user_id ?? t.id, t.is_featured ?? false])
			);
		} catch {
			allTeachers = [];
			totalPages = 1;
		} finally {
			allTeachersLoading = false;
		}
	}
```

- [ ] **Step 4: Add `onchange` to the status filter select and update template to use `allTeachers` directly**

In the template, find the status filter select:

```svelte
			<select
				bind:value={statusFilter}
				aria-label={$t('common.status')}
				class="h-8 px-2 text-sm bg-white border border-border rounded-sm focus:outline-none focus:border-primary"
			>
```

Replace with:

```svelte
			<select
				bind:value={statusFilter}
				onchange={() => { page = 1; fetchTeachers(); }}
				aria-label={$t('common.status')}
				class="h-8 px-2 text-sm bg-white border border-border rounded-sm focus:outline-none focus:border-primary"
			>
```

- [ ] **Step 5: Replace `filteredTeachers` with `allTeachers` in the `{#each}` loop**

Find:

```svelte
				{#each filteredTeachers as user}
```

Replace with:

```svelte
				{#each allTeachers as user}
```

Also update the empty state check. Find:

```svelte
		{:else if filteredTeachers.length === 0}
```

Replace with:

```svelte
		{:else if allTeachers.length === 0}
```

- [ ] **Step 6: Add `<Pagination />` inside the Card, after the table's `</div>` closing tag**

Find (the closing of the overflow-x-auto div and then the Card's closing):

```svelte
			{/if}
		</Card>
	</div>
```

Replace with:

```svelte
			{/if}
			<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchTeachers(); }} />
		</Card>
	</div>
```

- [ ] **Step 7: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 5: Add pagination to admin students page

**Files:**
- Modify: `src/routes/admin/students/+page.svelte`

- [ ] **Step 1: Add imports**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
```

- [ ] **Step 2: Replace state declarations**

Find:

```typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allStudents = $state<any[]>([]);
	let allStudentsLoading = $state(true);
	let statusFilter = $state('');

	const filteredStudents = $derived(
		allStudents.filter((u: any) =>
			statusFilter ? (u.status ?? '').toLowerCase() === statusFilter : true
		)
	);
```

Replace with:

```typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allStudents = $state<any[]>([]);
	let allStudentsLoading = $state(true);
	let statusFilter = $state('');
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 25;
```

- [ ] **Step 3: Update `fetchStudents()`**

Find:

```typescript
	async function fetchStudents() {
		allStudentsLoading = true;
		try {
			const students = await api.get<any[]>('/admin/students');
			allStudents = (Array.isArray(students) ? students : [])
				.filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending' && s.status !== 'deleted');
		} catch {
			allStudents = [];
		} finally {
			allStudentsLoading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchStudents() {
		allStudentsLoading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (statusFilter) params.set('status', statusFilter);
			const body = await api.get<PaginatedResponse<any>>(`/admin/students?${params}`);
			allStudents = body.data
				.filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending' && s.status !== 'deleted');
			totalPages = body.pagination.totalPages;
		} catch {
			allStudents = [];
			totalPages = 1;
		} finally {
			allStudentsLoading = false;
		}
	}
```

- [ ] **Step 4: Update the status filter select in the template**

Read the template section of `src/routes/admin/students/+page.svelte` to find the status filter select, then add `onchange={() => { page = 1; fetchStudents(); }}` to it — same pattern as Task 4 Step 4.

- [ ] **Step 5: Replace `filteredStudents` with `allStudents` in the template**

In the template, replace every occurrence of `filteredStudents` with `allStudents` (there will be a `{#each}` and an `{:else if ... .length === 0}` check).

- [ ] **Step 6: Add `<Pagination />` after the table's closing overflow div**

Same position as Task 4 Step 6 — inside the Card, after the `{/if}` that closes the loading/empty/table block:

```svelte
			{/if}
			<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchStudents(); }} />
		</Card>
```

- [ ] **Step 7: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 6: Add pagination to admin subjects page

**Files:**
- Modify: `src/routes/admin/subjects/+page.svelte`

- [ ] **Step 1: Add imports**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
```

- [ ] **Step 2: Add page state after existing state**

Find:

```typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allSubjects = $state<any[]>([]);
	let subjectsLoading = $state(true);
```

Replace with:

```typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allSubjects = $state<any[]>([]);
	let subjectsLoading = $state(true);
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 25;
```

- [ ] **Step 3: Update `fetchSubjects()`**

Find:

```typescript
	async function fetchSubjects() {
		subjectsLoading = true;
		try {
			const result = await api.get<any[]>('/subjects?status=verified');
			allSubjects = (Array.isArray(result) ? result : []).filter((s: any) => s.status !== 'deleted');
		} catch {
			allSubjects = [];
		} finally {
			subjectsLoading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchSubjects() {
		subjectsLoading = true;
		try {
			const params = new URLSearchParams({ status: 'verified', page: String(page), limit: String(pageSize) });
			const body = await api.get<PaginatedResponse<any>>(`/subjects?${params}`);
			allSubjects = body.data.filter((s: any) => s.status !== 'deleted');
			totalPages = body.pagination.totalPages;
		} catch {
			allSubjects = [];
			totalPages = 1;
		} finally {
			subjectsLoading = false;
		}
	}
```

- [ ] **Step 4: Add `<Pagination />` inside the Card after the `{/if}` closing block**

Find:

```svelte
		{/if}
	</Card>
</div>
```

Replace with:

```svelte
		{/if}
		<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchSubjects(); }} />
	</Card>
</div>
```

- [ ] **Step 5: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 7: Add pagination to courses page + fix sub-calls

**Files:**
- Modify: `src/routes/courses/+page.svelte`

This page has three calls to fix:
1. `fetchCourses()` — Category A (add pagination UI)
2. `loadSubjects()` — Category B (unwrap `.data` only)
3. `openEnroll()` — Category B (unwrap `.data` only)
4. `onMount` subjects load — Category B (unwrap `.data` only)

- [ ] **Step 1: Add imports**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
```

- [ ] **Step 2: Add page state after the courses state block**

Find:

```typescript
	// Course data
	let courses = $state<any[]>([]);
	let loading = $state(true);
	let subjects = $state<{ id: string; name: string }[]>([]);
```

Replace with:

```typescript
	// Course data
	let courses = $state<any[]>([]);
	let loading = $state(true);
	let subjects = $state<{ id: string; name: string }[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 12;
```

- [ ] **Step 3: Update `fetchCourses()` to pass page/limit and unwrap**

Find:

```typescript
	async function fetchCourses() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (query) params.set('search', query);
			if (subjectFilter) params.set('subject', subjectFilter);
			if (statusFilter) params.set('status', statusFilter);
			ageFilters.forEach((a) => params.append('age_category', a));
			const data = await api.get<any[]>(`/courses?${params}`);
			courses = Array.isArray(data) ? data : [];
		} catch {
			courses = [];
		} finally {
			loading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchCourses() {
		loading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (query) params.set('search', query);
			if (subjectFilter) params.set('subject', subjectFilter);
			if (statusFilter) params.set('status', statusFilter);
			ageFilters.forEach((a) => params.append('age_category', a));
			const body = await api.get<PaginatedResponse<any>>(`/courses?${params}`);
			courses = body.data;
			totalPages = body.pagination.totalPages;
		} catch {
			courses = [];
			totalPages = 1;
		} finally {
			loading = false;
		}
	}
```

- [ ] **Step 4: Reset page to 1 when filters change**

Find:

```typescript
	$effect(() => {
		subjectFilter;
		statusFilter;
		scheduleRefetch();
	});
```

Replace with:

```typescript
	$effect(() => {
		subjectFilter;
		statusFilter;
		page = 1;
		scheduleRefetch();
	});
```

- [ ] **Step 5: Fix `loadSubjects()` — unwrap `.data`**

Find:

```typescript
	async function loadSubjects() {
		if (subjectEntries.length > 0) return;
		subjectLoading = true;
		try {
			const entries = await api.get<{ id: string; name: string; status: string }[]>('/subjects?status=verified');
			subjectEntries = Array.isArray(entries) ? entries : [];
		} catch {
			subjectEntries = [];
		} finally {
			subjectLoading = false;
		}
	}
```

Replace with:

```typescript
	async function loadSubjects() {
		if (subjectEntries.length > 0) return;
		subjectLoading = true;
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string; status: string }>>('/subjects?status=verified');
			subjectEntries = body.data;
		} catch {
			subjectEntries = [];
		} finally {
			subjectLoading = false;
		}
	}
```

- [ ] **Step 6: Fix `openEnroll()` — unwrap `.data`**

Find:

```typescript
		adminStudentsLoading = true;
		try {
			const result = await api.get<any[]>('/admin/students');
			adminStudents = Array.isArray(result) ? result : [];
		} catch {
			adminStudents = [];
		} finally {
			adminStudentsLoading = false;
		}
```

Replace with:

```typescript
		adminStudentsLoading = true;
		try {
			const body = await api.get<PaginatedResponse<any>>('/admin/students');
			adminStudents = body.data;
		} catch {
			adminStudents = [];
		} finally {
			adminStudentsLoading = false;
		}
```

- [ ] **Step 7: Fix `onMount` subjects load — unwrap `.data`**

Find:

```typescript
	onMount(async () => {
		await fetchCourses();
		try {
			const result = await api.get<{ id: string; name: string; status: string }[]>('/subjects?status=verified');
			subjects = Array.isArray(result) ? result : [];
		} catch {
			subjects = [];
		}
	});
```

Replace with:

```typescript
	onMount(async () => {
		await fetchCourses();
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string; status: string }>>('/subjects?status=verified');
			subjects = body.data;
		} catch {
			subjects = [];
		}
	});
```

- [ ] **Step 8: Add `<Pagination />` to the courses grid in the template**

Find the template section where courses are rendered. The courses grid ends before the closing `</div>` of the outer `<div>`. Look for the closing of the courses grid section and add the pagination component after it.

Find the block that ends the grid (after the `{:else if courses.length === 0}` and `{:else}` grid block):

```svelte
	{/if}
</div>
```

The courses grid is the last content before the outer div closes. Add `<Pagination />` before the closing `</div>`:

```svelte
	{/if}
	<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchCourses(); }} />
</div>
```

- [ ] **Step 9: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 8: Add pagination to reports page

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

- [ ] **Step 1: Add imports**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
```

- [ ] **Step 2: Add page state after the existing state**

Find:

```typescript
	let reports = $state<any[]>([]);
	let loading = $state(true);
```

Replace with:

```typescript
	let reports = $state<any[]>([]);
	let loading = $state(true);
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 20;
```

- [ ] **Step 3: Update `fetchReports()`**

Find:

```typescript
	async function fetchReports() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			const result = await api.get<any[]>(`/students/${data.studentId}/reports?${params}`);
			reports = Array.isArray(result) ? result : [];
		} catch {
			reports = [];
		} finally {
			loading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchReports() {
		loading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			const body = await api.get<PaginatedResponse<any>>(`/students/${data.studentId}/reports?${params}`);
			reports = body.data;
			totalPages = body.pagination.totalPages;
		} catch {
			reports = [];
			totalPages = 1;
		} finally {
			loading = false;
		}
	}
```

- [ ] **Step 4: Reset page when date filters change**

Find:

```typescript
	$effect(() => {
		fromDate; toDate;
		fetchReports();
	});
```

Replace with:

```typescript
	$effect(() => {
		fromDate; toDate;
		page = 1;
		fetchReports();
	});
```

- [ ] **Step 5: Add `<Pagination />` to the template**

Read the template in `src/routes/reports/[studentId]/+page.svelte` to find the end of the reports card. The reports list is typically inside a `<Card>`. Add `<Pagination />` inside the card, after the reports list block (after the `{/if}` that closes the loading/empty/list block).

Find (the end of the reports card content):

```svelte
		{/if}
	</Card>
```

Replace with:

```svelte
		{/if}
		<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchReports(); }} />
	</Card>
```

- [ ] **Step 6: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 9: Fix data shape — admin/courses and admin/calendar (Category B)

**Files:**
- Modify: `src/routes/admin/courses/+page.svelte`
- Modify: `src/routes/admin/calendar/+page.svelte`

### `admin/courses/+page.svelte`

- [ ] **Step 1: Add type import**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
```

- [ ] **Step 2: Update `fetchAll()` to unwrap all three responses**

Find:

```typescript
	async function fetchAll() {
		loading = true;
		try {
			const [coursesRes, teachersRes, subjectsRes] = await Promise.all([
				api.get<any[]>('/courses'),
				api.get<any[]>('/admin/teachers'),
				api.get<any[]>('/subjects?status=verified'),
			]);
			allCourses = Array.isArray(coursesRes) ? coursesRes : [];
			allTeachers = (Array.isArray(teachersRes) ? teachersRes : [])
				.filter((t: any) => t.status !== 'deleted' && t.status !== 'pending' && t.status !== 'email_verified');
			allSubjects = (Array.isArray(subjectsRes) ? subjectsRes : [])
				.filter((s: any) => s.status !== 'deleted');
			teacherMap = Object.fromEntries(
				allTeachers.map((t: any) => [t.user_id ?? t.id, t.full_name ?? t.name ?? '—'])
			);
		} catch {
			allCourses = [];
		} finally {
			loading = false;
		}
	}
```

Replace with:

```typescript
	async function fetchAll() {
		loading = true;
		try {
			const [coursesBody, teachersBody, subjectsBody] = await Promise.all([
				api.get<PaginatedResponse<any>>('/courses'),
				api.get<PaginatedResponse<any>>('/admin/teachers'),
				api.get<PaginatedResponse<any>>('/subjects?status=verified'),
			]);
			allCourses = coursesBody.data;
			allTeachers = teachersBody.data
				.filter((t: any) => t.status !== 'deleted' && t.status !== 'pending' && t.status !== 'email_verified');
			allSubjects = subjectsBody.data
				.filter((s: any) => s.status !== 'deleted');
			teacherMap = Object.fromEntries(
				allTeachers.map((t: any) => [t.user_id ?? t.id, t.full_name ?? t.name ?? '—'])
			);
		} catch {
			allCourses = [];
		} finally {
			loading = false;
		}
	}
```

Also check if there's a separate call to `/admin/students` in `admin/courses/+page.svelte` (the enroll student modal). If found, unwrap it the same way.

### `admin/calendar/+page.svelte`

- [ ] **Step 3: Add type import**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
```

- [ ] **Step 4: Update `onMount` to unwrap teachers, courses, students**

Find:

```typescript
	onMount(async () => {
		const [teachersRes, coursesRes, studentsRes] = await Promise.all([
			api.get<any[]>('/admin/teachers').catch(() => []),
			api.get<any[]>('/courses').catch(() => []),
			api.get<any[]>('/admin/students').catch(() => []),
		]);
		teachers = Array.isArray(teachersRes)
			? teachersRes.filter((t: any) => t.status !== 'deleted' && t.status !== 'pending')
			: [];
		adminCourses = Array.isArray(coursesRes) ? coursesRes : [];
		adminStudents = Array.isArray(studentsRes) ? studentsRes : [];
	});
```

Replace with:

```typescript
	onMount(async () => {
		const [teachersBody, coursesBody, studentsBody] = await Promise.all([
			api.get<PaginatedResponse<any>>('/admin/teachers').catch(() => ({ data: [], pagination: { totalPages: 1 } })),
			api.get<PaginatedResponse<any>>('/courses').catch(() => ({ data: [], pagination: { totalPages: 1 } })),
			api.get<PaginatedResponse<any>>('/admin/students').catch(() => ({ data: [], pagination: { totalPages: 1 } })),
		]);
		teachers = teachersBody.data.filter((t: any) => t.status !== 'deleted' && t.status !== 'pending');
		adminCourses = coursesBody.data;
		adminStudents = studentsBody.data;
	});
```

- [ ] **Step 5: Update `fetchRecurringTemplates()` in admin calendar to unwrap**

Find:

```typescript
	async function fetchRecurringTemplates() {
		if (!filteredTeacherId) { recurringTemplates = []; return; }
		try {
			const d = await api.get<any[]>(`/sessions/recurring?teacher_id=${filteredTeacherId}`);
			recurringTemplates = Array.isArray(d) ? d : [];
		} catch {
			recurringTemplates = [];
		}
	}
```

Replace with:

```typescript
	async function fetchRecurringTemplates() {
		if (!filteredTeacherId) { recurringTemplates = []; return; }
		try {
			const body = await api.get<PaginatedResponse<any>>(`/sessions/recurring?teacher_id=${filteredTeacherId}`);
			recurringTemplates = body.data;
		} catch {
			recurringTemplates = [];
		}
	}
```

- [ ] **Step 6: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 10: Fix data shape — calendar, dashboard, register/teacher (Category B)

**Files:**
- Modify: `src/routes/calendar/+page.svelte`
- Modify: `src/routes/dashboard/+page.svelte`
- Modify: `src/routes/register/teacher/+page.svelte`

### `calendar/+page.svelte`

- [ ] **Step 1: Add type import**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
```

- [ ] **Step 2: Update `fetchRecurringTemplates()`**

Find:

```typescript
	async function fetchRecurringTemplates() {
		if (!isTeacher) return;
		try {
			const d = await api.get<any[]>('/sessions/recurring');
			recurringTemplates = Array.isArray(d) ? d : [];
		} catch {
			recurringTemplates = [];
		}
	}
```

Replace with:

```typescript
	async function fetchRecurringTemplates() {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/sessions/recurring');
			recurringTemplates = body.data;
		} catch {
			recurringTemplates = [];
		}
	}
```

- [ ] **Step 3: Update `fetchTeacherCourses()`**

Find:

```typescript
	async function fetchTeacherCourses() {
		if (!isTeacher) return;
		try {
			const d = await api.get<any[]>('/courses');
			teacherCourses = Array.isArray(d) ? d : [];
		} catch {
			teacherCourses = [];
		}
	}
```

Replace with:

```typescript
	async function fetchTeacherCourses() {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/courses');
			teacherCourses = body.data;
		} catch {
			teacherCourses = [];
		}
	}
```

- [ ] **Step 4: Update `fetchCalendarStudents()`**

Find:

```typescript
	async function fetchCalendarStudents() {
		if (!isTeacher) return;
		try {
			const d = await api.get<any[]>('/students');
			calendarStudents = Array.isArray(d) ? d : [];
		} catch {
			calendarStudents = [];
		}
	}
```

Replace with:

```typescript
	async function fetchCalendarStudents() {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/students');
			calendarStudents = body.data;
		} catch {
			calendarStudents = [];
		}
	}
```

### `dashboard/+page.svelte`

- [ ] **Step 5: Add type import**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
```

- [ ] **Step 6: Update the students fetch in `onMount`**

Find:

```typescript
	onMount(async () => {
		if (!isTeacher) return;
		try {
			const result = await api.get<any[]>('/students');
			students = Array.isArray(result) ? result : [];
		} catch {
			students = [];
		} finally {
			studentsLoading = false;
		}
	});
```

Replace with:

```typescript
	onMount(async () => {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/students');
			students = body.data;
		} catch {
			students = [];
		} finally {
			studentsLoading = false;
		}
	});
```

### `register/teacher/+page.svelte`

- [ ] **Step 7: Add type import**

Find:

```typescript
	import { api } from '$lib/api';
```

Replace with:

```typescript
	import { api, type PaginatedResponse } from '$lib/api';
```

- [ ] **Step 8: Update the subjects fetch in `onMount`**

Find:

```typescript
	onMount(async () => {
		try {
			const entries = await api.get<{ id: string; name: string }[]>('/subjects?status=verified');
			subjectEntries = Array.isArray(entries) ? entries : [];
		} catch {
			subjectEntries = [];
		}
	});
```

Replace with:

```typescript
	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string }>>('/subjects?status=verified');
			subjectEntries = body.data;
		} catch {
			subjectEntries = [];
		}
	});
```

- [ ] **Step 9: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 11: Fix data shape — server-side files (Category B)

**Files:**
- Modify: `src/routes/admin/+page.server.ts`
- Modify: `src/routes/students/[id]/+page.server.ts`

### `admin/+page.server.ts`

- [ ] **Step 1: Update the three paginated fetch calls**

The current file fetches `pendingTeachers`, `pendingStudents`, `pendingSubjects` with:
```typescript
fetch(`${BASE}/admin/teachers?status=email_verified`, { headers }).then((r) =>
    r.ok ? r.json() : []
),
```

Replace each of the three `.then((r) => r.ok ? r.json() : [])` calls with a version that extracts `.data`:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };

	try {
		const [stats, pendingTeachers, pendingStudents, pendingSubjects] = await Promise.all([
			fetch(`${BASE}/admin/stats`, { headers }).then((r) => (r.ok ? r.json() : {})),
			fetch(`${BASE}/admin/teachers?status=email_verified`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
			fetch(`${BASE}/admin/students?status=email_verified`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
			fetch(`${BASE}/admin/subjects?status=pending`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
		]);
		return { stats, pendingTeachers, pendingStudents, pendingSubjects };
	} catch {
		return { stats: {}, pendingTeachers: [], pendingStudents: [], pendingSubjects: [] };
	}
};
```

### `students/[id]/+page.server.ts`

- [ ] **Step 2: Update the reports fetch**

Current file:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, locals, request }) => {
	if (!locals.user) throw redirect(302, '/login');

	const cookie = request.headers.get('cookie') ?? '';
	const headers = { Cookie: cookie };

	try {
		const [profile, reports] = await Promise.all([
			fetch(`${BASE}/students/${params.id}`, { headers }).then((r) => (r.ok ? r.json() : null)),
			fetch(`${BASE}/students/${params.id}/reports`, { headers }).then((r) =>
				r.ok ? r.json() : []
			),
		]);
		return { profile, reports };
	} catch {
		return { profile: null, reports: [] };
	}
};
```

Replace with:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, locals, request }) => {
	if (!locals.user) throw redirect(302, '/login');

	const cookie = request.headers.get('cookie') ?? '';
	const headers = { Cookie: cookie };

	try {
		const [profile, reports] = await Promise.all([
			fetch(`${BASE}/students/${params.id}`, { headers }).then((r) => (r.ok ? r.json() : null)),
			fetch(`${BASE}/students/${params.id}/reports`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
		]);
		return { profile, reports };
	} catch {
		return { profile: null, reports: [] };
	}
};
```

- [ ] **Step 3: Final verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.
