# Delta v3 — Student Roster + Featured Toggle Design

**Date:** 2026-05-19
**Source:** `handoffs/2026-05-19-fe-handoff-delta-v3.md`
**API contract:** `D:\Codading Repo\mutawazin-tutor-api\docs\api-contract\api-types.ts`

---

## Scope

Three changes in one implementation pass:

1. **Teacher Dashboard — Student Roster** (`src/routes/dashboard/+page.svelte`)
2. **Admin — Featured Teacher Toggle** (`src/routes/admin/+page.svelte`)
3. **Calendar bug fix** — Cancel/Mark Completed use wrong endpoint path (`/sessions/{id}` → `/sessions/{id}/status`)

---

## 1. Teacher Dashboard — Student Roster

### Endpoint

```
GET /students   (teacher auth only — 403 for other roles)
```

Response: `StudentProfileResponse[]`

```ts
{
  id: string;
  user_id: string;
  full_name: string;
  photo_url: string | null;
  date_of_birth: string | null;
  age_category: "pre-school" | "elementary" | "middle-school" | "high-school" | "general" | null;
  assigned_teacher_id: string | null;
  enrolled_courses: [];   // always empty — do not render
  recent_reports: [];     // always empty — do not render
}
```

### File changes

**`src/routes/dashboard/+page.svelte`**

Add imports to the `<script>` block (currently missing both):
```svelte
import { onMount } from 'svelte';
import { api } from '$lib/api';
```

Add state variables after the existing state:
```svelte
let students = $state<any[]>([]);
let studentsLoading = $state(true);
```

Add fetch in `onMount` (teacher-only guard keeps it safe for the student branch):
```svelte
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

### New UI section

Insert a new full-width card **after the Quick Actions block** (after line 153, inside the `{#if isTeacher}` branch). The existing "My Private Students" 2-col card is kept as-is (it shows `last_session_at` context from the dashboard response).

```svelte
<!-- My Students roster -->
<Card padding="none">
  {#snippet head()}
    <h2 class="font-semibold">My Students</h2>
  {/snippet}
  {#if studentsLoading}
    <div class="flex justify-center py-10" role="status">
      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if students.length === 0}
    <p class="px-5 py-8 text-sm text-text2 text-center">No students assigned yet.</p>
  {:else}
    <div class="divide-y divide-border">
      {#each students as student}
        <div class="flex items-center gap-3 px-5 py-3">
          <Avatar name={student.full_name} id={student.user_id} size="md" />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{student.full_name}</div>
          </div>
          {#if student.age_category}
            <Badge variant="violet" label={student.age_category} />
          {/if}
          <a href="/students/{student.user_id}" class="text-xs font-semibold text-primary">
            {$t('dashboard.teacher.openStudent')}
          </a>
        </div>
      {/each}
    </div>
  {/if}
</Card>
```

---

## 2. Admin — Featured Teacher Toggle

### Endpoint

```
PATCH /admin/teachers/:teacher_id/featured   (admin auth only)
No request body.
```

Response `200`:
```ts
{ user_id: string; is_featured: boolean }   // is_featured = new value after toggle
```

`:teacher_id` is the user ID — same as `user.user_id ?? user.id` used in existing admin rows.

### State

Add to the admin `<script>` block after the existing `allTeachers` / `allStudents` state:

```svelte
let featuredMap = $state<Record<string, boolean>>({});
let featuredLoading = $state<Record<string, boolean>>({});
```

Populate `featuredMap` inside `fetchAllUsers()`, immediately after `allTeachers` is assigned (line ~47):

```svelte
featuredMap = Object.fromEntries(
  allTeachers.map((t: any) => [t.user_id ?? t.id, t.is_featured ?? false])
);
```

### Toggle function

Add after `fetchAllUsers`:

```svelte
async function toggleFeatured(teacherId: string) {
  featuredLoading = { ...featuredLoading, [teacherId]: true };
  try {
    const res = await api.patch<{ user_id: string; is_featured: boolean }>(
      `/admin/teachers/${teacherId}/featured`, {}
    );
    featuredMap = { ...featuredMap, [res.user_id]: res.is_featured };
  } catch {}
  featuredLoading = { ...featuredLoading, [teacherId]: false };
}
```

No optimistic update — the map only changes on a confirmed response. If the PATCH fails, the star stays as-is.

### Button placement

In the actions `<td>` of each teacher row (lines 456–465 of admin page), add the toggle button **before** the existing "View profile →" link, but only when `activeTab === 'teachers'`:

```svelte
<td class="px-5 py-3 text-right">
  {#if activeTab === 'teachers'}
    {@const tid = user.user_id ?? user.id}
    {@const isFeatured = featuredMap[tid] ?? false}
    <button
      onclick={() => toggleFeatured(tid)}
      disabled={featuredLoading[tid]}
      class="mr-3 text-sm font-medium px-2 py-1 rounded-sm transition-colors
             {isFeatured
               ? 'text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A]'
               : 'text-text2 bg-bgGray hover:bg-border/50'}
             disabled:opacity-50"
      title={isFeatured ? 'Remove featured' : 'Mark as featured'}
    >
      {isFeatured ? '★' : '☆'} {isFeatured ? 'Featured' : 'Feature'}
    </button>
  {/if}
  <a
    href={activeTab === 'teachers'
      ? `/teachers/${user.user_id ?? user.id}`
      : `/students/${user.user_id ?? user.id}`}
    class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
  >
    {$t('common.viewProfile')}
  </a>
</td>
```

---

## 3. Calendar Bug Fix — Session Status Endpoint

**File:** `src/routes/calendar/+page.svelte`

The `cancelSession` and `markCompleted` functions call:
```ts
api.patch(`/sessions/${selectedSession.id}`, { status: '...' })
```

The correct endpoint per the API contract is:
```ts
api.patch(`/sessions/${selectedSession.id}/status`, { status: '...' })
```

Fix: append `/status` to the path in both handler functions.

---

## Files Changed

| File | Change |
|---|---|
| `src/routes/dashboard/+page.svelte` | Add `onMount` + `api` imports, student state + fetch, new My Students roster card |
| `src/routes/admin/+page.svelte` | Add `featuredMap` + `featuredLoading` state, populate in `fetchAllUsers`, add `toggleFeatured` function, add star button to teacher rows |
| `src/routes/calendar/+page.svelte` | Fix endpoint path: `/sessions/{id}` → `/sessions/{id}/status` in both handlers |
