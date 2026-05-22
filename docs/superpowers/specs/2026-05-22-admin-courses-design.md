# Design: Admin Course Management Page

**Date:** 2026-05-22  
**Status:** Approved  
**Source:** `handoffs/2026-05-22-fe-handoff-delta-v5.md`

## Overview

New `/admin/courses` page for admin CRUD on courses: list all courses, create a course for a specific teacher, edit course fields, and delete a course. Student enrollment management (enroll/unenroll) is deferred to a follow-up.

## Files Changed

| File | Change |
|---|---|
| `src/routes/admin/courses/+layout.svelte` | **New** — pass-through only (no `<AuthLayout>`, parent provides it) |
| `src/routes/admin/courses/+page.server.ts` | **New** — admin auth guard |
| `src/routes/admin/courses/+page.svelte` | **New** — table + Create/Edit/Delete modals |
| `src/lib/components/layout/Sidebar.svelte` | Add Courses nav item for admin role |

---

## Data Loading

All data loaded in `onMount` on `+page.svelte`:

```typescript
// Fetch in parallel
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

// Build lookup map: teacher_id → full_name
teacherMap = Object.fromEntries(
  allTeachers.map((t: any) => [t.user_id ?? t.id, t.full_name ?? t.name ?? '—'])
);
```

---

## Sidebar

In `src/lib/components/layout/Sidebar.svelte`, add to the admin items array after `subjects`:

```typescript
{ id: 'courses', labelKey: 'nav.courses', href: '/admin/courses', icon: BookOpen },
```

`BookOpen` is already imported. Add `'nav.courses'` i18n key: English `"Courses"`, Indonesian `"Kursus"`.

---

## Table Layout

Columns (all with `px-5 py-3`):

| Column | Source | Responsive |
|---|---|---|
| Course | `course.name` | always |
| Teacher | `teacherMap[course.teacher_id] ?? '—'` | `hidden sm:table-cell` |
| Age Categories | `course.age_categories` — one `<Badge variant="violet">` per entry | `hidden md:table-cell` |
| Status | badge: `active` → `success`, `draft` → `gray`, `archived` → `gray` | `hidden lg:table-cell` |
| Enrolled | `course.enrolled_student_ids.length` — plain number | `hidden lg:table-cell` |
| Actions | `<DropdownMenu items={[Edit, Delete]}>` | always, `text-right` on `<td>`, `text-left` on `<th>` |

---

## Create Modal

Opened by "Create Course" button in page header.

### State

```svelte
let createOpen = $state(false);
let createError = $state('');
let createLoading = $state(false);
let createFormEl = $state<HTMLFormElement | null>(null);
let newTeacherId = $state('');
let newSubjectId = $state('');
let newAgeCategories = $state<string[]>([]);
let newPrices = $state<Record<string, string>>({});   // string for input binding, convert to number on submit
let newDescription = $state('');
```

### Age category constants

```svelte
const AGE_CATEGORIES = ['pre-school', 'elementary', 'middle-school', 'high-school', 'general'];
```

### Open/reset

```svelte
function openCreate() {
  createOpen = true;
  createError = '';
  newTeacherId = '';
  newSubjectId = '';
  newAgeCategories = [];
  newPrices = {};
  newDescription = '';
}
```

### Toggling age categories

When a checkbox is unchecked, remove the corresponding price key:

```svelte
function toggleAge(cat: string, checked: boolean) {
  if (checked) {
    newAgeCategories = [...newAgeCategories, cat];
  } else {
    newAgeCategories = newAgeCategories.filter(c => c !== cat);
    const { [cat]: _, ...rest } = newPrices;
    newPrices = rest;
  }
}
```

### Submit handler

```svelte
async function handleCreate(e: SubmitEvent) {
  e.preventDefault();
  if (!newTeacherId || !newSubjectId || newAgeCategories.length === 0) return;
  createLoading = true;
  createError = '';
  try {
    const price_by_age_category = Object.fromEntries(
      newAgeCategories.map(cat => [cat, parseFloat(newPrices[cat] ?? '0') || 0])
    );
    const course = await api.post<any>('/admin/courses', {
      teacher_id: newTeacherId,
      subject_id: newSubjectId,
      age_categories: newAgeCategories,
      price_by_age_category,
      description: newDescription || undefined,
    });
    allCourses = [course, ...allCourses];
    createOpen = false;
  } catch (err: unknown) {
    createError = err instanceof Error ? err.message : 'Failed to create course.';
  } finally {
    createLoading = false;
  }
}
```

### Form markup (inside `<Modal>`)

```svelte
<form bind:this={createFormEl} onsubmit={handleCreate} class="flex flex-col gap-4">
  <!-- Teacher -->
  <div class="flex flex-col gap-1.5">
    <label for="newTeacher" class="text-[13px] font-medium">Teacher</label>
    <select id="newTeacher" bind:value={newTeacherId} required
      class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
      <option value="">Select a teacher</option>
      {#each allTeachers as t}
        <option value={t.user_id ?? t.id}>{t.full_name ?? t.name}</option>
      {/each}
    </select>
  </div>

  <!-- Subject -->
  <div class="flex flex-col gap-1.5">
    <label for="newSubject" class="text-[13px] font-medium">Subject</label>
    <select id="newSubject" bind:value={newSubjectId} required
      class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
      <option value="">Select a subject</option>
      {#each allSubjects as s}
        <option value={s.id}>{s.name}</option>
      {/each}
    </select>
  </div>

  <!-- Age Categories -->
  <div class="flex flex-col gap-1.5">
    <p class="text-[13px] font-medium">Age Categories</p>
    <div class="flex flex-col gap-1.5">
      {#each AGE_CATEGORIES as cat}
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={newAgeCategories.includes(cat)}
            onchange={(e) => toggleAge(cat, (e.target as HTMLInputElement).checked)}
            class="w-4 h-4 rounded text-primary focus:ring-primary/15" />
          {cat}
          {#if newAgeCategories.includes(cat)}
            <input type="number" min="0" step="0.01"
              bind:value={newPrices[cat]}
              placeholder="Price"
              class="ml-auto w-28 bg-white border border-border rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
          {/if}
        </label>
      {/each}
    </div>
  </div>

  <!-- Description -->
  <div class="flex flex-col gap-1.5">
    <label for="newDesc" class="text-[13px] font-medium">Description <span class="text-text2 font-normal">(optional)</span></label>
    <textarea id="newDesc" bind:value={newDescription} rows={3}
      class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical min-h-[84px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
  </div>
</form>
```

---

## Edit Modal

### Additional state

```svelte
let editOpen = $state(false);
let editTarget = $state<any | null>(null);          // the course being edited
let editError = $state('');
let editLoading = $state(false);
let editFormEl = $state<HTMLFormElement | null>(null);
let editTeacherId = $state('');
let editSubjectId = $state('');
let editAgeCategories = $state<string[]>([]);
let editPrices = $state<Record<string, string>>({});
let editDescription = $state('');
let editStatus = $state<'draft' | 'active' | 'archived'>('active');
let editOriginalTeacherId = $state('');             // to detect teacher change
```

### Open/prefill

```svelte
function openEdit(course: any) {
  editTarget = course;
  editError = '';
  editTeacherId = course.teacher_id;
  editOriginalTeacherId = course.teacher_id;
  editSubjectId = course.subject_id;
  editAgeCategories = [...course.age_categories];
  editPrices = Object.fromEntries(
    Object.entries(course.price_by_age_category ?? {}).map(([k, v]) => [k, String(v)])
  );
  editDescription = course.description ?? '';
  editStatus = course.status ?? 'active';
  editOpen = true;
}
```

### Toggle age (edit)

Same logic as create — removes price key when unchecked:

```svelte
function toggleEditAge(cat: string, checked: boolean) {
  if (checked) {
    editAgeCategories = [...editAgeCategories, cat];
  } else {
    editAgeCategories = editAgeCategories.filter(c => c !== cat);
    const { [cat]: _, ...rest } = editPrices;
    editPrices = rest;
  }
}
```

### Submit handler

```svelte
async function handleEdit(e: SubmitEvent) {
  e.preventDefault();
  if (!editTarget) return;
  editLoading = true;
  editError = '';
  try {
    const price_by_age_category = Object.fromEntries(
      editAgeCategories.map(cat => [cat, parseFloat(editPrices[cat] ?? '0') || 0])
    );
    const updated = await api.put<any>(`/admin/courses/${editTarget.id}`, {
      teacher_id: editTeacherId,
      subject_id: editSubjectId,
      age_categories: editAgeCategories,
      price_by_age_category,
      description: editDescription || undefined,
      status: editStatus,
    });
    allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
    editOpen = false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('409') || msg.toLowerCase().includes('enrolled')) {
      editError = 'Cannot change subject while students are enrolled — unenroll them first.';
    } else {
      editError = msg || 'Failed to save.';
    }
  } finally {
    editLoading = false;
  }
}
```

### Subject disabled + teacher warning

Subject `<select>` is disabled when `editTarget?.enrolled_student_ids?.length > 0`:

```svelte
<select id="editSubject" bind:value={editSubjectId}
  disabled={editTarget?.enrolled_student_ids?.length > 0}
  class="... disabled:opacity-50 disabled:cursor-not-allowed">
```

Below the subject field, when disabled:
```svelte
{#if editTarget?.enrolled_student_ids?.length > 0}
  <p class="text-xs text-text2 mt-1">Subject cannot be changed while students are enrolled.</p>
{/if}
```

Teacher change warning — shown below teacher field when value differs from original:
```svelte
{#if editTeacherId !== editOriginalTeacherId}
  <p class="text-xs text-warningText mt-1">Future scheduled sessions will be reassigned to the new teacher.</p>
{/if}
```

Status buttons:
```svelte
<div class="flex gap-2">
  {#each ['draft', 'active', 'archived'] as s}
    <button type="button" onclick={() => (editStatus = s as typeof editStatus)}
      class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
             {editStatus === s ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
      {s}
    </button>
  {/each}
</div>
```

---

## Delete Modal

### State

```svelte
let deleteOpen = $state(false);
let deleteTarget = $state<{ id: string; name: string } | null>(null);
let deleteLoading = $state(false);
let deleteError = $state('');
```

### Handler

```svelte
function openDelete(id: string, name: string) {
  deleteTarget = { id, name };
  deleteError = '';
  deleteOpen = true;
}

async function handleDelete() {
  if (!deleteTarget) return;
  deleteLoading = true;
  deleteError = '';
  try {
    await api.delete(`/admin/courses/${deleteTarget.id}`);
    allCourses = allCourses.filter((c: any) => c.id !== deleteTarget!.id);
    deleteOpen = false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('409') || msg.toLowerCase().includes('enrolled')) {
      deleteError = 'Unenroll all students before deleting this course.';
    } else {
      deleteError = msg || 'Failed to delete course.';
    }
  } finally {
    deleteLoading = false;
  }
}
```

### Modal markup

```svelte
<Modal open={deleteOpen} title="Delete {deleteTarget?.name ?? ''}?" onclose={() => (deleteOpen = false)}>
  {#if deleteError}
    <div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
  {/if}
  <p class="text-sm text-text2">Future scheduled sessions will be cancelled. This action cannot be undone.</p>
  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>Cancel</Button>
    <Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
  {/snippet}
</Modal>
```

---

## DropdownMenu Items per Row

```svelte
<DropdownMenu items={[
  { label: 'Edit', onclick: () => openEdit(course) },
  { label: 'Delete', variant: 'danger', onclick: () => openDelete(course.id, course.name) },
]} />
```

---

## i18n Keys Needed

Add to `src/locales/en.json` and `src/locales/id.json`:

| Key | English | Indonesian |
|---|---|---|
| `nav.courses` | `"Courses"` | `"Kursus"` |

All other UI strings are hardcoded English in this spec (consistent with existing admin pages that mix i18n and hardcoded strings).

---

## API Calls Summary

| Endpoint | Method | Used in |
|---|---|---|
| `/courses` | GET | Page load — list all courses |
| `/admin/teachers` | GET | Page load — teacher picker + name lookup |
| `/subjects?status=verified` | GET | Page load — subject picker |
| `/admin/courses` | POST | Create modal |
| `/admin/courses/:id` | PUT | Edit modal |
| `/admin/courses/:id` | DELETE | Delete modal |
