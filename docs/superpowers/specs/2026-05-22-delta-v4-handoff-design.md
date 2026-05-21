# Design: Delta v4 Backend Handoff — Availability Checks + Admin Deletes

**Date:** 2026-05-22  
**Status:** Approved  
**Source:** `handoffs/2026-05-22-fe-handoff-delta-v4.md`

## Overview

Implements all 6 items from the v4 backend delta:
1. Email availability check on registration forms
2. Username availability check on admin create modals
3. Delete teacher (admin)
4. Delete student (admin)
5. Delete subject (admin)
6. New `"deleted"` enum values for `UserStatus` and `SubjectStatus`

## Files Changed

| File | Changes |
|---|---|
| `src/routes/register/teacher/+page.svelte` | Debounced email availability check |
| `src/routes/register/student/+page.svelte` | Debounced email availability check |
| `src/routes/admin/teachers/+page.svelte` | Debounced username check in create modal; delete button + confirm modal; filter `"deleted"` |
| `src/routes/admin/students/+page.svelte` | Debounced username check in create modal; delete button + confirm modal; filter `"deleted"` |
| `src/routes/admin/subjects/+page.svelte` | Delete button + confirm modal; filter `"deleted"` |

No new files. 0 new components.

---

## Feature 1 & 2: Availability Checks

### Email check (teacher register + student register)

**New state per form:**
```svelte
let emailAvailable = $state<boolean | null>(null);
let emailDebounce: ReturnType<typeof setTimeout>;
```

**`null`** = not yet checked, **`true`** = available, **`false`** = already registered.

**Input handler** on the email `<input>`:
```svelte
oninput={(e) => {
  clearTimeout(emailDebounce);
  const val = (e.target as HTMLInputElement).value.trim();
  if (!val) { emailAvailable = null; return; }
  emailDebounce = setTimeout(async () => {
    try {
      const res = await api.get<{ available: boolean }>(
        `/auth/check/email?email=${encodeURIComponent(val)}`
      );
      emailAvailable = res.available;
    } catch { emailAvailable = null; }
  }, 400);
}}
```

**Inline error** below the email field, shown when `emailAvailable === false`:
```svelte
{#if emailAvailable === false}
  <p class="text-xs text-errorText mt-1">Email is already registered.</p>
{/if}
```

**Submit guard:** In the submit handler, return early if `emailAvailable === false`.

**Reset:** Set `emailAvailable = null` when the form is reset or the page remounts (handled naturally since these are full page forms, not modals).

### Username check (admin create teacher modal + admin create student modal)

Same pattern, separate state:
```svelte
let usernameAvailable = $state<boolean | null>(null);
let usernameDebounce: ReturnType<typeof setTimeout>;
```

API call: `GET /auth/check/username?username=<encodeURIComponent(val)>`

Inline error: `"Username is already taken."`

**Reset on modal open:** Inside `openCreate()`, set `usernameAvailable = null` so stale state from a previous open doesn't carry over.

**Submit guard:** Return early from `handleCreate` if `usernameAvailable === false`.

---

## Features 3–5: Admin Delete with Confirmation Modal

Same pattern applied to all three admin pages.

### New state (per page)
```svelte
let deleteOpen = $state(false);
let deleteTarget = $state<{ id: string; name: string } | null>(null);
let deleteLoading = $state(false);
let deleteError = $state('');
```

### Opening the modal
```svelte
function openDelete(id: string, name: string) {
  deleteTarget = { id, name };
  deleteError = '';
  deleteOpen = true;
}
```

### Delete handler

**Teachers:**
```svelte
async function handleDelete() {
  if (!deleteTarget) return;
  deleteLoading = true;
  deleteError = '';
  try {
    await api.delete(`/admin/teachers/${deleteTarget.id}`);
    allTeachers = allTeachers.filter((t: any) => (t.user_id ?? t.id) !== deleteTarget!.id);
    deleteOpen = false;
  } catch {
    deleteError = 'Failed to delete. Please try again.';
  } finally {
    deleteLoading = false;
  }
}
```

**Students:** Same pattern — `api.delete('/admin/students/:id')`, filter `allStudents`.

**Subjects:** Same pattern — `api.delete('/admin/subjects/:id')`, filter `allSubjects`.

### Delete button in table row

Added to the actions cell, left of the existing action link:
```svelte
<button
  onclick={() => openDelete(id, name)}
  class="mr-3 text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
>
  Delete
</button>
```

### Confirmation modal markup
```svelte
<Modal open={deleteOpen} title="Delete {deleteTarget?.name ?? ''}?" onclose={() => (deleteOpen = false)}>
  {#if deleteError}
    <div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
  {/if}
  <p class="text-sm text-text2">This action cannot be undone.</p>
  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>Cancel</Button>
    <Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
  {/snippet}
</Modal>
```

---

## Feature 6: New `"deleted"` Enum Values

### Filtering deleted from lists

**Teachers** (`admin/teachers/+page.svelte`): Extend the existing filter:
```svelte
allTeachers = teachers.filter(
  (t: any) => t.status !== 'email_verified' && t.status !== 'pending' && t.status !== 'deleted'
);
```

**Students** (`admin/students/+page.svelte`): Add to fetch handler:
```svelte
allStudents = students.filter((s: any) => s.status !== 'deleted');
```

**Subjects** (`admin/subjects/+page.svelte`): Add to fetch handler:
```svelte
allSubjects = subjects.filter((s: any) => s.status !== 'deleted');
```

### Status badge mapping

In any page with a `statusVariant()` helper, add `"deleted"` → `'gray'`:
```svelte
const map = {
  // ... existing entries ...
  deleted: 'gray',
  Deleted: 'gray',
};
```

---

## API Calls Summary

| Endpoint | Method | Used in |
|---|---|---|
| `/auth/check/email?email=<val>` | GET | teacher register, student register |
| `/auth/check/username?username=<val>` | GET | admin create teacher modal, admin create student modal |
| `/admin/teachers/:id` | DELETE | admin teachers page |
| `/admin/students/:id` | DELETE | admin students page |
| `/admin/subjects/:id` | DELETE | admin subjects page |

All GET availability calls are public (no auth). All DELETE calls require admin auth (already handled by `+page.server.ts` guards).

---

## Button Component

`<Button variant="danger">` already exists in `src/lib/components/ui/Button.svelte` — use it for the Delete confirm button. No changes to Button.svelte needed.
