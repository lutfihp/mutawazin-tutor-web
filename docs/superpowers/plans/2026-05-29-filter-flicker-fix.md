# Filter Flicker Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate visible flickering on the courses page and admin teacher/student pages by keeping stale data visible while a refetch is in progress.

**Architecture:** Change each page's `{#if loading}` block so the spinner only appears on the *first* load (when data is empty). On subsequent fetches (filter changes, pagination), the existing table/grid stays rendered and dims to `opacity-50` with `pointer-events-none` until new data arrives.

**Tech Stack:** SvelteKit, Svelte 5 runes, Tailwind CSS v3

---

### Task 1: Fix courses page flicker

**Files:**
- Modify: `src/routes/courses/+page.svelte:279-340`

The current block at line 279 replaces the grid with a spinner whenever `loading` is true — including during filter changes when data is already on screen. The fix adds `&& courses.length === 0` to the spinner condition and attaches `class:opacity-50` / `class:pointer-events-none` to the grid div when loading.

- [ ] **Step 1: Edit the course grid block**

In `src/routes/courses/+page.svelte`, replace lines 279–340:

**Find (lines 279–288):**
```svelte
	{#if loading}
		<div class="flex items-center justify-center py-20" role="status" aria-label={$t('common.loading')}>
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if courses.length === 0}
		<div class="text-center py-20 bg-white border border-border rounded-DEFAULT">
			<p class="text-text2">{$t('courses.noResults')}</p>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
```

**Replace with:**
```svelte
	{#if loading && courses.length === 0}
		<div class="flex items-center justify-center py-20" role="status" aria-label={$t('common.loading')}>
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if courses.length === 0}
		<div class="text-center py-20 bg-white border border-border rounded-DEFAULT">
			<p class="text-text2">{$t('courses.noResults')}</p>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5" class:opacity-50={loading} class:pointer-events-none={loading}>
```

The closing `{/if}` and everything inside the grid loop remain unchanged.

- [ ] **Step 2: Verify no TypeScript errors**

```powershell
npm run check
```

Expected: 0 errors (12 pre-existing warnings are fine).

- [ ] **Step 3: Manual smoke test**

Open `http://localhost:5173/courses`.
- First load: spinner appears briefly, then grid fades in. ✓
- Change the subject filter: grid dims briefly, then updates in-place — no disappear/reappear. ✓
- Toggle an age chip: same smooth dim behavior. ✓
- Select a status: same. ✓

- [ ] **Step 4: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "fix: keep courses grid visible during filter refetch (stale-while-revalidate)"
```

---

### Task 2: Fix admin teachers page flicker

**Files:**
- Modify: `src/routes/admin/teachers/+page.svelte:193-244`

The `{#if allTeachersLoading}` block at line 193 replaces the table with a "Loading…" text string on every refetch. Fix: add `&& allTeachers.length === 0` to the loading condition, and dim the `overflow-x-auto` div while refetching.

- [ ] **Step 1: Edit the teachers table block**

In `src/routes/admin/teachers/+page.svelte`, replace lines 193–244:

**Find (lines 193–199):**
```svelte
		{#if allTeachersLoading}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allTeachers.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto">
```

**Replace with:**
```svelte
		{#if allTeachersLoading && allTeachers.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allTeachers.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto" class:opacity-50={allTeachersLoading} class:pointer-events-none={allTeachersLoading}>
```

Everything inside the table (thead, tbody, rows) and the closing `{/if}` remain unchanged.

- [ ] **Step 2: Verify no TypeScript errors**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manual smoke test**

Open `http://localhost:5173/admin/teachers`.
- First load: "Loading…" text appears briefly, then table renders. ✓
- Change status filter: table dims briefly, updates in-place. ✓
- Change page via pagination: same smooth behavior. ✓

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/teachers/+page.svelte
git commit -m "fix: keep teachers table visible during filter refetch (stale-while-revalidate)"
```

---

### Task 3: Fix admin students page flicker

**Files:**
- Modify: `src/routes/admin/students/+page.svelte:148-152`

Same pattern as teachers. State vars are `allStudentsLoading` and `allStudents`.

- [ ] **Step 1: Edit the students table block**

In `src/routes/admin/students/+page.svelte`, replace lines 148–153:

**Find (lines 148–153):**
```svelte
		{#if allStudentsLoading}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allStudents.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto">
```

**Replace with:**
```svelte
		{#if allStudentsLoading && allStudents.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allStudents.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto" class:opacity-50={allStudentsLoading} class:pointer-events-none={allStudentsLoading}>
```

Everything inside the table and the closing `{/if}` remain unchanged.

- [ ] **Step 2: Verify no TypeScript errors**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manual smoke test**

Open `http://localhost:5173/admin/students`.
- First load: "Loading…" text appears briefly, then table renders. ✓
- Change status filter: table dims briefly, updates in-place. ✓

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/students/+page.svelte
git commit -m "fix: keep students table visible during filter refetch (stale-while-revalidate)"
```
