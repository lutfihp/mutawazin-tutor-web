# Course Enrollment — Admin Enroll Student Design

**Date:** 2026-05-20
**Source:** CLAUDE.md Priority 2, item 3

---

## Scope

Add an "Enroll Student" button to course cards in `src/routes/courses/+page.svelte`, visible to **admin only**. Clicking opens a modal with a student dropdown. Submitting calls `POST /courses/{id}/enroll { student_id }` and increments the displayed `enrolled_count`.

---

## API

```
POST /courses/{course_id}/enroll
Auth: admin only
Body: { student_id: string }
Response 200: unknown (update enrolled_count locally on success)
```

Student list source: `GET /admin/students` — same endpoint the admin page already uses.

---

## Files Changed

| File | Change |
|---|---|
| `src/routes/courses/+page.svelte` | New state, lazy student fetch, `openEnroll` + `submitEnroll` functions, updated card footer, new enroll modal |
| `src/locales/en.json` | Add `courses.enrollStudent`, `courses.enrollSelectStudent` inside `"courses"` |
| `src/locales/id.json` | Same two keys in Indonesian |

---

## New State

Add after the existing `createLoading` state block:

```svelte
// Enrollment modal state
let enrollOpen = $state(false);
let enrollCourseId = $state('');
let enrollStudentId = $state('');
let enrollLoading = $state(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminStudents = $state<any[]>([]);
let adminStudentsLoading = $state(false);
```

---

## New Functions

### `openEnroll(courseId: string)` — opens the modal

```svelte
async function openEnroll(courseId: string) {
	enrollCourseId = courseId;
	enrollStudentId = '';
	enrollOpen = true;
	if (adminStudents.length > 0) return;   // already loaded
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
```

### `submitEnroll()` — submits the enrollment

```svelte
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
```

On success: update the matching course's `enrolled_count` in the local `courses` array (+1). Does not refetch all courses.

---

## Card Footer Update (lines 273–278)

Current footer (single button, all roles):
```svelte
<!-- Footer -->
<div class="bg-bgGray px-4 py-3 border-t border-border">
	<Button variant="primary" size="sm" href="/courses/{course.id}" class="w-full">
		{$t('courses.viewCourse')}
	</Button>
</div>
```

New footer — "View Course" stays for all roles; admin gets a second "Enroll Student" button:
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

---

## Enroll Student Modal

Add after the existing Create Course Modal block:

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

---

## i18n Keys

Add to `src/locales/en.json` inside `"courses"` (after `"viewCourse"`):
```json
"enrollStudent": "Enroll Student",
"enrollSelectStudent": "Select a student",
```

Add to `src/locales/id.json` inside `"courses"` (after `"viewCourse"`):
```json
"enrollStudent": "Daftarkan Murid",
"enrollSelectStudent": "Pilih murid",
```

---

## Assumptions

- `GET /admin/students` returns objects with `user_id` (or `id`) and `full_name` (or `name`) — same shape used on the admin page.
- `POST /courses/{id}/enroll` succeeds silently on re-enrollment or returns a 2xx; no special error handling needed beyond the generic `finally` cleanup.
- The "View Course" link (`/courses/{id}`) remains a dead link — course detail page is out of scope for this task.
