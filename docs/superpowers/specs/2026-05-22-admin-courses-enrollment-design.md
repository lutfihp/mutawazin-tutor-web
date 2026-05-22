# Design: Admin Courses — Student Enrollment Management

**Date:** 2026-05-22  
**Status:** Approved

## Overview

Add student enrollment management to the existing `/admin/courses` page. Admin can view enrolled students per course, enroll new students, and unenroll existing ones — all from a modal triggered by a new "Manage Students" action in the per-row `<DropdownMenu>`.

## Files Changed

| File | Change |
|---|---|
| `src/routes/admin/courses/+page.svelte` | Add enrollment state, handlers, DropdownMenu item, and Manage Students modal |

No new routes, no new components.

---

## API Endpoints

| Endpoint | Method | Action |
|---|---|---|
| `/admin/students` | GET | Fetch student list for the picker (lazy, cached) |
| `/courses/:id/enroll` | POST `{ student_id }` | Enroll a student |
| `/courses/:id/enroll/:student_id` | DELETE | Unenroll a student |

---

## New State

Added to the existing script block in `src/routes/admin/courses/+page.svelte`:

```svelte
let enrollOpen = $state(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let enrollTarget = $state<any | null>(null);          // course being managed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let allStudents = $state<any[]>([]);                  // lazy-loaded once, then cached
let studentsLoading = $state(false);
let studentMap = $state<Record<string, string>>({});  // student_id → full_name
let enrollStudentId = $state('');                     // student selected in picker
let enrollLoading = $state(false);
let unenrollLoadingId = $state<string | null>(null);  // ID of student being unenrolled
let enrollError = $state('');
```

---

## New Functions

### `openManageStudents(course)`

Sets enrollment target, clears state, opens modal, fetches students lazily on first open:

```svelte
async function openManageStudents(course: any) {
  enrollTarget = course;
  enrollStudentId = '';
  enrollError = '';
  enrollOpen = true;
  if (allStudents.length > 0) return;
  studentsLoading = true;
  try {
    const res = await api.get<any[]>('/admin/students');
    allStudents = (Array.isArray(res) ? res : [])
      .filter((s: any) => s.status !== 'deleted');
    studentMap = Object.fromEntries(
      allStudents.map((s: any) => [s.user_id ?? s.id, s.full_name ?? s.name ?? '—'])
    );
  } catch {
    allStudents = [];
  } finally {
    studentsLoading = false;
  }
}
```

### `handleEnroll()`

Enrolls the selected student. On success, adds student ID to `enrollTarget.enrolled_student_ids` and updates the row in `allCourses`:

```svelte
async function handleEnroll() {
  if (!enrollTarget || !enrollStudentId) return;
  enrollLoading = true;
  enrollError = '';
  try {
    await api.post(`/courses/${enrollTarget.id}/enroll`, { student_id: enrollStudentId });
    const updated = {
      ...enrollTarget,
      enrolled_student_ids: [...(enrollTarget.enrolled_student_ids ?? []), enrollStudentId],
    };
    enrollTarget = updated;
    allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
    enrollStudentId = '';
  } catch (err: unknown) {
    enrollError = err instanceof Error ? err.message : 'Failed to enroll student.';
  } finally {
    enrollLoading = false;
  }
}
```

### `handleUnenroll(studentId)`

Unenrolls a specific student. On success, removes student ID from `enrollTarget.enrolled_student_ids` and updates the row in `allCourses`:

```svelte
async function handleUnenroll(studentId: string) {
  if (!enrollTarget) return;
  unenrollLoadingId = studentId;
  enrollError = '';
  try {
    await api.delete(`/courses/${enrollTarget.id}/enroll/${studentId}`);
    const updated = {
      ...enrollTarget,
      enrolled_student_ids: (enrollTarget.enrolled_student_ids ?? []).filter((id: string) => id !== studentId),
    };
    enrollTarget = updated;
    allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
  } catch (err: unknown) {
    enrollError = err instanceof Error ? err.message : 'Failed to unenroll student.';
  } finally {
    unenrollLoadingId = null;
  }
}
```

---

## DropdownMenu Update

Add "Manage Students" as the first item in the per-row dropdown (before Edit and Delete):

```svelte
<DropdownMenu items={[
  { label: 'Manage Students', onclick: () => openManageStudents(course) },
  { label: 'Edit', onclick: () => openEdit(course) },
  { label: 'Delete', variant: 'danger', onclick: () => openDelete(course.id, course.name) },
]} />
```

---

## Manage Students Modal

Title: `"Manage Students — [course.name]"`

```svelte
<Modal open={enrollOpen} title="Manage Students — {enrollTarget?.name ?? ''}" onclose={() => (enrollOpen = false)}>
  {#if enrollError}
    <div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{enrollError}</div>
  {/if}

  <!-- Section 1: Enrolled Students -->
  <div class="mb-5">
    <h3 class="text-[13px] font-semibold text-text2 uppercase tracking-wide mb-2">Enrolled Students</h3>
    {#if studentsLoading}
      <p class="text-sm text-text2">Loading...</p>
    {:else if (enrollTarget?.enrolled_student_ids ?? []).length === 0}
      <p class="text-sm text-text2">No students enrolled yet.</p>
    {:else}
      <div class="flex flex-col divide-y divide-border">
        {#each (enrollTarget?.enrolled_student_ids ?? []) as sid}
          <div class="flex items-center justify-between py-2.5">
            <span class="text-sm">{studentMap[sid] ?? sid}</span>
            <button
              onclick={() => handleUnenroll(sid)}
              disabled={unenrollLoadingId === sid}
              class="text-xs font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors disabled:opacity-50"
            >
              {unenrollLoadingId === sid ? 'Removing…' : 'Unenroll'}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Section 2: Enroll a Student -->
  <div>
    <h3 class="text-[13px] font-semibold text-text2 uppercase tracking-wide mb-2">Enroll a Student</h3>
    {#if studentsLoading}
      <p class="text-sm text-text2">Loading students…</p>
    {:else}
      {@const available = allStudents.filter((s: any) =>
        !(enrollTarget?.enrolled_student_ids ?? []).includes(s.user_id ?? s.id)
      )}
      {#if available.length === 0}
        <p class="text-sm text-text2">All students are already enrolled.</p>
      {:else}
        <div class="flex gap-2">
          <select bind:value={enrollStudentId}
            class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
            <option value="">Select a student</option>
            {#each available as student}
              <option value={student.user_id ?? student.id}>{student.full_name ?? student.name}</option>
            {/each}
          </select>
          <Button variant="primary" size="sm" loading={enrollLoading}
            onclick={handleEnroll} disabled={!enrollStudentId}>
            Enroll
          </Button>
        </div>
      {/if}
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={() => (enrollOpen = false)}>Close</Button>
  {/snippet}
</Modal>
```

---

## Behaviour Notes

- **Enrolled count in table** updates immediately after enroll/unenroll (derived from `enrolled_student_ids.length`)
- **Student list** is cached for the session — re-opening the modal for a different course doesn't refetch
- **Enroll dropdown** only shows students NOT already in `enrolled_student_ids` (filtered client-side)
- **Error** shown inline above sections; does not close the modal
- **unenrollLoadingId** tracks per-student loading so only the clicked Unenroll button shows as loading
