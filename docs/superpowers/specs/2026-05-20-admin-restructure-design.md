# Admin Page Restructure Design

**Date:** 2026-05-20
**Goal:** Split the single `/admin` page into four focused pages — Overview (pending approvals only), Teachers, Students, Subjects — each with a dedicated route.

---

## Route Map

| Route | Purpose |
|---|---|
| `/admin` | Stats + pending teacher/student/subject approvals |
| `/admin/teachers` | All non-pending teachers — feature toggle, create, view profile |
| `/admin/students` | All non-pending students — create, view profile |
| `/admin/subjects` | Verified subjects list + create subject |

**Rule:** Pending items appear **only** on the Overview page. The three management pages never show pending entries.

---

## Sidebar Changes

### Remove
- `approvals` (Pending Approvals → `/admin#pending-approvals`)
- `users` (All Users → `/admin#all-users`)

### Add
- `teachers` (labelKey: `nav.teachers`, href: `/admin/teachers`, icon: `Users`)
- `students` (labelKey: `nav.students`, href: `/admin/students`, icon: `User`)

### Update
- `subjects` href: `/admin#subjects` → `/admin/subjects`

### Final admin nav (in order)
```svelte
admin: [
    { id: 'overview',  labelKey: 'nav.overview',   href: '/admin',           icon: Home },
    { id: 'teachers',  labelKey: 'nav.teachers',   href: '/admin/teachers',  icon: Users },
    { id: 'students',  labelKey: 'nav.students',   href: '/admin/students',  icon: User },
    { id: 'subjects',  labelKey: 'nav.subjects',   href: '/admin/subjects',  icon: BookOpen },
]
```

`nav.teachers` and `nav.students` keys already exist in en.json/id.json — no new i18n needed.

The `pendingApprovalCount` store update (`$effect` in admin page) is removed — no sidebar badge to update.

---

## Overview page (`/admin`) — what stays, what's removed

### Stays (no change)
- Stats row: Total Teachers, Total Students, Active Courses (3 cards)
- Pending Teacher Approvals card — approve/reject per row
- Pending Student Approvals card — approve/reject per row
- Pending Subject Suggestions card — approve/reject per row

### Removed from this page
- "Pending Approvals" 4th stat card
- All Users tabbed section (lines 400–504)
- Create Teacher / Create Student buttons and modal
- Create Subject button and modal
- `$effect` that updates `pendingApprovalCount`
- `fetchAllUsers`, `allTeachers`, `allStudents`, `allUsersLoading`, `statusFilter`, `filteredUsers`, `featuredMap`, `featuredLoading`, `toggleFeatured`, `activeTab` — all removed
- `createSubjectOpen`, `newSubjectName`, `newSubjectField`, `newSubjectAges`, `createSubjectLoading`, `createSubjectFormEl`, `toggleSubjectAge`, `handleCreateSubject` — all removed (move to subjects page)
- `createOpen`, `createError`, `createLoading`, `formEl`, `newFullName`, `newUsername`, `newPassword` and all create-user state — removed (move to teachers/students pages)
- `onMount` block (no longer needed — all data comes from `+page.server.ts`)
- Import of `pendingApprovalCount` store

### What `+page.server.ts` keeps
- Admin auth guard (unchanged)
- Fetches `stats`, `pendingTeachers` (`status=email_verified`), `pendingStudents` (`status=email_verified`)
- Add: fetches `pendingSubjects` (`status=pending`) from `/admin/subjects?status=pending`

---

## Teachers page (`/admin/teachers`) — new

### New files
- `src/routes/admin/teachers/+layout.svelte`
- `src/routes/admin/teachers/+page.server.ts`
- `src/routes/admin/teachers/+page.svelte`

### Layout (identical to `admin/+layout.svelte`)
```svelte
<script lang="ts">
    import type { Snippet } from 'svelte';
    import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
    let { children }: { children?: Snippet } = $props();
</script>
<AuthLayout role="admin">
    {#if children}{@render children()}{/if}
</AuthLayout>
```

### Page server (auth guard only — data loaded in onMount)
```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');
    return {};
};
```

### Page state (moved from admin/+page.svelte)
- `allTeachers`, `allUsersLoading`, `statusFilter` (options: '', 'verified', 'active', 'rejected' — no 'pending')
- `featuredMap`, `featuredLoading`, `toggleFeatured`
- `filteredTeachers = $derived(allTeachers.filter(t => statusFilter ? t.status === statusFilter : true))`
- `createOpen`, `createError`, `createLoading`, `formEl`, `newFullName`, `newUsername`, `newPassword`, `newBio`, `newSubjectTags`, `newShowPassword` (teacher create form fields)

### Data fetch
```ts
// onMount
const teachers = await api.get<any[]>('/admin/teachers');
allTeachers = (Array.isArray(teachers) ? teachers : [])
    .filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending');
featuredMap = Object.fromEntries(allTeachers.map((t: any) => [t.user_id ?? t.id, t.is_featured ?? false]));
```

### Page layout
- Page header: "Teachers" + `+ Create Teacher` button (right)
- Status filter select: All / Verified / Active / Rejected
- Table: Name, Email, Status badge, Type, Actions (Feature toggle + View Profile)
- Create Teacher modal (moved from admin page — same form fields)

---

## Students page (`/admin/students`) — new

### New files
- `src/routes/admin/students/+layout.svelte` (identical pattern to teachers layout)
- `src/routes/admin/students/+page.server.ts` (identical auth guard)
- `src/routes/admin/students/+page.svelte`

### Page state (moved from admin/+page.svelte)
- `allStudents`, `allStudentsLoading`, `statusFilter` (options: '', 'verified', 'active', 'rejected' — no 'pending')
- `filteredStudents = $derived(...)`
- `createOpen`, `createError`, `createLoading`, `formEl`, `newFullName`, `newUsername`, `newPassword`, `newDob`, `newShowPassword` (student create form fields)

### Data fetch
```ts
// onMount
const students = await api.get<any[]>('/admin/students');
allStudents = (Array.isArray(students) ? students : [])
    .filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending');
```

### Page layout
- Page header: "Students" + `+ Create Student` button (right)
- Status filter select: All / Verified / Active / Rejected
- Table: Name, Email, Status badge, Age Category, Type, Actions (View Profile)
- Create Student modal (moved from admin page — same form fields)

---

## Subjects page (`/admin/subjects`) — new

### New files
- `src/routes/admin/subjects/+layout.svelte` (identical pattern)
- `src/routes/admin/subjects/+page.server.ts` (identical auth guard)
- `src/routes/admin/subjects/+page.svelte`

### Page state (moved from admin/+page.svelte)
- `allSubjects`, `subjectsLoading`
- `createSubjectOpen`, `newSubjectName`, `createSubjectLoading`, `createSubjectFormEl`
- `handleCreateSubject` function (same as current)

### Data fetch
```ts
// onMount
const [subjects] = await Promise.all([
    api.get<any[]>('/subjects?status=verified'),
]);
allSubjects = Array.isArray(subjects) ? subjects : [];
```

### Page layout
- Page header: "Subjects" + `+ Create Subject` button (right)
- Subject list: Name, Status badge, (future: edit/delete)
- Create Subject modal (moved from admin page — same form)

**Note:** Pending subject suggestions do NOT appear here — they are overview-only.

---

## Files Changed Summary

| File | Action |
|---|---|
| `src/lib/components/layout/Sidebar.svelte` | Update admin navByRole (remove 2 items, add 2 items, update subjects href) |
| `src/routes/admin/+page.svelte` | Strip to: stats + 3 pending cards only |
| `src/routes/admin/+page.server.ts` | Add pendingSubjects fetch |
| `src/routes/admin/teachers/+layout.svelte` | New — admin AuthLayout wrapper |
| `src/routes/admin/teachers/+page.server.ts` | New — admin auth guard |
| `src/routes/admin/teachers/+page.svelte` | New — teacher management page |
| `src/routes/admin/students/+layout.svelte` | New — admin AuthLayout wrapper |
| `src/routes/admin/students/+page.server.ts` | New — admin auth guard |
| `src/routes/admin/students/+page.svelte` | New — student management page |
| `src/routes/admin/subjects/+layout.svelte` | New — admin AuthLayout wrapper |
| `src/routes/admin/subjects/+page.server.ts` | New — admin auth guard |
| `src/routes/admin/subjects/+page.svelte` | New — subject management page |
