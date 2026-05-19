# Course Enrollment — Admin Enroll Student Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Enroll Student" button to course cards (admin only) that opens a student-picker modal and calls `POST /courses/{id}/enroll`.

**Architecture:** All changes live in `src/routes/courses/+page.svelte` plus two locale files. New enrollment state and functions follow the existing `create*` naming pattern in the file. The student list is fetched lazily from `GET /admin/students` on first modal open and reused for subsequent opens.

**Tech Stack:** SvelteKit (Svelte 5 runes), `$lib/api` (`api.get`, `api.post`), svelte-i18n `$t`, Tailwind v3.

---

## File Map

| File | Change |
|---|---|
| `src/locales/en.json` | Add `courses.enrollStudent` + `courses.enrollSelectStudent` |
| `src/locales/id.json` | Same two keys in Indonesian |
| `src/routes/courses/+page.svelte` | New enrollment state, `openEnroll` + `submitEnroll` functions, updated card footer, new enroll modal |

---

## Task 1: i18n keys

**Files:**
- Modify: `src/locales/en.json:287` (after `viewCourse`)
- Modify: `src/locales/id.json:287` (after `viewCourse`)

- [ ] **Step 1: Add keys to en.json**

Find:
```json
    "viewCourse": "View Course",
```
Replace with:
```json
    "viewCourse": "View Course",
    "enrollStudent": "Enroll Student",
    "enrollSelectStudent": "Select a student",
```

- [ ] **Step 2: Add keys to id.json**

Find:
```json
    "viewCourse": "Lihat Kursus",
```
Replace with:
```json
    "viewCourse": "Lihat Kursus",
    "enrollStudent": "Daftarkan Murid",
    "enrollSelectStudent": "Pilih murid",
```

- [ ] **Step 3: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/id.json
git commit -m "i18n: add courses.enrollStudent and courses.enrollSelectStudent keys"
```

---

## Task 2: Enrollment state + functions

**Files:**
- Modify: `src/routes/courses/+page.svelte:45` (after `createLoading`)

- [ ] **Step 1: Add enrollment state after `createLoading` (line 45)**

Find:
```svelte
	let createLoading = $state(false);
```
Replace with:
```svelte
	let createLoading = $state(false);

	// Enrollment modal state
	let enrollOpen = $state(false);
	let enrollCourseId = $state('');
	let enrollStudentId = $state('');
	let enrollLoading = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let adminStudents = $state<any[]>([]);
	let adminStudentsLoading = $state(false);
```

- [ ] **Step 2: Add `openEnroll` and `submitEnroll` functions**

Find:
```svelte
	function toggleCourseAge(age: string) {
```
Replace with:
```svelte
	async function openEnroll(courseId: string) {
		enrollCourseId = courseId;
		enrollStudentId = '';
		enrollOpen = true;
		if (adminStudents.length > 0) return;
		adminStudentsLoading = true;
		try {
			const result = await api.get<any[]>('/admin/students');
			adminStudents = Array.isArray(result) ? result : [];
		} catch {
			adminStudents = [];
		} finally {
			adminStudentsLoading = false;
		}
	}

	async function submitEnroll() {
		if (!enrollStudentId) return;
		enrollLoading = true;
		try {
			await api.post(`/courses/${enrollCourseId}/enroll`, { student_id: enrollStudentId });
			courses = courses.map((c: any) =>
				c.id === enrollCourseId
					? { ...c, enrolled_count: (c.enrolled_count ?? 0) + 1 }
					: c
			);
			enrollOpen = false;
		} finally {
			enrollLoading = false;
		}
	}

	function toggleCourseAge(age: string) {
```

- [ ] **Step 3: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "feat: courses enrollment state + openEnroll/submitEnroll functions"
```

---

## Task 3: Card footer + enroll modal template

**Files:**
- Modify: `src/routes/courses/+page.svelte:273-278` (card footer)
- Modify: `src/routes/courses/+page.svelte` (add modal after Create Course Modal)

- [ ] **Step 1: Update the card footer (lines 273–278)**

Find:
```svelte
					<!-- Footer -->
					<div class="bg-bgGray px-4 py-3 border-t border-border">
						<Button variant="primary" size="sm" href="/courses/{course.id}" class="w-full">
							{$t('courses.viewCourse')}
						</Button>
					</div>
```
Replace with:
```svelte
					<!-- Footer -->
					<div class="bg-bgGray px-4 py-3 border-t border-border flex gap-2">
						<Button variant="primary" size="sm" href="/courses/{course.id}" class="flex-1">
							{$t('courses.viewCourse')}
						</Button>
						{#if data.user?.role === 'admin'}
							<Button variant="secondary" size="sm" onclick={() => openEnroll(course.id)}>
								{$t('courses.enrollStudent')}
							</Button>
						{/if}
					</div>
```

- [ ] **Step 2: Add the Enroll Student modal**

Find the line that starts the Create Course Modal:
```svelte
<!-- Create Course Modal -->
```

Insert the following **before** that comment:
```svelte
<!-- Enroll Student Modal -->
{#if data.user?.role === 'admin'}
	<Modal open={enrollOpen} title={$t('courses.enrollStudent')} onclose={() => (enrollOpen = false)}>
		<div class="flex flex-col gap-4">
			{#if adminStudentsLoading}
				<div class="flex justify-center py-6" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else}
				<div class="flex flex-col gap-1.5">
					<label for="enrollStudentId" class="text-[13px] font-medium">
						{$t('courses.enrollSelectStudent')}
					</label>
					<select id="enrollStudentId" bind:value={enrollStudentId}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
						<option value="">— {$t('courses.enrollSelectStudent')}</option>
						{#each adminStudents as student}
							<option value={student.user_id ?? student.id}>
								{student.full_name ?? student.name}
							</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (enrollOpen = false)}>
				{$t('common.cancel')}
			</Button>
			<Button variant="primary" size="sm" loading={enrollLoading}
				disabled={!enrollStudentId} onclick={submitEnroll}>
				{$t('courses.enrollStudent')}
			</Button>
		{/snippet}
	</Modal>
{/if}

```

- [ ] **Step 3: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "feat: course enrollment — admin Enroll Student button + modal"
```

---

## Final Verification

- [ ] **Full check + build**

```powershell
npm run check && npm run build
```
Expected: 0 errors, build succeeds.

- [ ] **Manual smoke test**

Start dev server:
```powershell
npm run dev
```

1. Log in as `admin@mutawazin.com` / `changeme123` → go to `/courses`
2. Each course card footer should show two buttons: "View Course" and "Enroll Student"
3. Click "Enroll Student" on any card → modal opens with a spinner then a student dropdown
4. Select a student → "Enroll Student" button becomes enabled
5. Click "Enroll Student" → `POST /courses/{id}/enroll` fires (check Network tab)
6. Modal closes; enrolled count on the card increments by 1
7. Log in as a teacher → go to `/courses` → only "View Course" button visible (no "Enroll Student")
8. Log in as a student → go to `/courses` → same, only "View Course" button visible
