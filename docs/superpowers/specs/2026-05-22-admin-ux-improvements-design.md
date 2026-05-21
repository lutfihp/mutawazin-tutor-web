# Design: Admin UX Improvements — Three-dot Menus, Age Column, Edit Subject

**Date:** 2026-05-22  
**Status:** Approved

## Overview

Four improvements to the admin management pages:

1. Replace inline action buttons on all three admin tables with a shared three-dot (`⋮`) dropdown menu component
2. Add a confirmation modal before toggling Featured status on admin/teachers
3. Replace the broken `age_category` column on admin/students with a calculated Age column
4. Add an Edit Subject modal on admin/subjects

Sidebar Courses link and admin courses page are **deferred** — backend endpoints not yet available.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/components/ui/DropdownMenu.svelte` | **New** — shared three-dot dropdown component |
| `src/routes/admin/teachers/+page.svelte` | Replace action buttons with `<DropdownMenu>`; add featured confirmation modal |
| `src/routes/admin/students/+page.svelte` | Replace action buttons with `<DropdownMenu>`; replace age_category with calculated age |
| `src/routes/admin/subjects/+page.svelte` | Replace Delete button with `<DropdownMenu>`; add edit subject modal |

---

## Component: `DropdownMenu.svelte`

**Location:** `src/lib/components/ui/DropdownMenu.svelte`

**Props:**
```typescript
items: Array<{
  label: string;
  onclick: () => void;
  variant?: 'default' | 'danger';
}>
```

**Trigger:** `<button>` containing `MoreVertical` (lucide-svelte, already installed) sized at 16×16. Style: ghost/icon button matching existing codebase pattern — `w-8 h-8 rounded-sm text-text2 hover:text-text hover:bg-bgGray flex items-center justify-center`.

**Dropdown panel:** Absolute-positioned, appears below-right of trigger. Styles: `bg-white border border-border rounded-sm shadow-md min-w-[140px] py-1 z-50`. Each item is a full-width `<button class="w-full text-left px-3 py-2 text-sm hover:bg-bgGray transition-colors">`. `variant="danger"` adds `text-errorText`.

**Dismiss behavior:**
- **Outside click:** wrapper `<div tabindex="-1">` with `onfocusout={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) open = false; }}` — closes when focus leaves the component
- **Escape key:** `onkeydown={(e) => { if (e.key === 'Escape') open = false; }}` on wrapper
- **After item click:** each item's `onclick` wrapper closes the menu before calling the user's handler

**One open at a time:** Each row instance manages its own `open = $state(false)`. No global coordination needed — focus-based dismissal handles it naturally.

**Full component structure:**
```svelte
<script lang="ts">
  import { MoreVertical } from 'lucide-svelte';

  type Item = { label: string; onclick: () => void; variant?: 'default' | 'danger' };
  let { items }: { items: Item[] } = $props();

  let open = $state(false);

  function select(item: Item) {
    open = false;
    item.onclick();
  }
</script>

<div
  class="relative"
  tabindex="-1"
  onfocusout={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) open = false;
  }}
  onkeydown={(e) => { if (e.key === 'Escape') open = false; }}
>
  <button
    onclick={() => (open = !open)}
    class="w-8 h-8 rounded-sm text-text2 hover:text-text hover:bg-bgGray flex items-center justify-center transition-colors"
    aria-label="Actions"
    aria-haspopup="true"
    aria-expanded={open}
  >
    <MoreVertical size={16} aria-hidden="true" />
  </button>

  {#if open}
    <div class="absolute right-0 top-full mt-1 bg-white border border-border rounded-sm shadow-md min-w-[140px] py-1 z-50">
      {#each items as item}
        <button
          onclick={() => select(item)}
          class="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bgGray
                 {item.variant === 'danger' ? 'text-errorText' : 'text-text'}"
        >
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
```

---

## admin/teachers Changes

### Action cell

Replace the current actions `<td>` (Delete button + Featured star button + View Profile link) with:

```svelte
<td class="px-5 py-3 text-right">
  <DropdownMenu items={[
    { label: 'View Profile', onclick: () => goto(`/teachers/${tid}`) },
    {
      label: isFeatured ? 'Unfeature' : 'Feature',
      onclick: () => openFeaturedConfirm(tid, user.full_name ?? user.name ?? '', isFeatured)
    },
    { label: 'Delete', variant: 'danger', onclick: () => openDelete(tid, user.full_name ?? user.name ?? '') },
  ]} />
</td>
```

Requires adding `import { goto } from '$app/navigation';` to the script block.

### Featured confirmation modal (new)

**New state:**
```svelte
let featuredConfirmOpen = $state(false);
let featuredConfirmTarget = $state<{ id: string; name: string; isFeatured: boolean } | null>(null);
```

**New function:**
```svelte
function openFeaturedConfirm(id: string, name: string, isFeatured: boolean) {
  featuredConfirmTarget = { id, name, isFeatured };
  featuredConfirmOpen = true;
}
```

**Modal:**
```svelte
<Modal
  open={featuredConfirmOpen}
  title="{featuredConfirmTarget?.isFeatured ? 'Unfeature' : 'Feature'} {featuredConfirmTarget?.name ?? ''}?"
  onclose={() => (featuredConfirmOpen = false)}
>
  <p class="text-sm text-text2">
    {#if featuredConfirmTarget?.isFeatured}
      {featuredConfirmTarget.name} will be removed from the Featured Teachers section.
    {:else}
      {featuredConfirmTarget?.name} will appear in the Featured Teachers section on the homepage.
    {/if}
  </p>
  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={() => (featuredConfirmOpen = false)}>
      Cancel
    </Button>
    <Button variant="primary" size="sm" onclick={async () => {
      if (featuredConfirmTarget) await toggleFeatured(featuredConfirmTarget.id);
      featuredConfirmOpen = false;
    }}>
      Confirm
    </Button>
  {/snippet}
</Modal>
```

The existing `toggleFeatured` function is called unchanged — only the trigger changes (modal confirm instead of direct click).

---

## admin/students Changes

### Age column (replaces age_category)

**Table header** — replace:
```svelte
<th class="px-5 py-3 text-left hidden md:table-cell">{$t('dashboard.admin.ageCategory')}</th>
```
with:
```svelte
<th class="px-5 py-3 text-left hidden md:table-cell">Age</th>
```

**Table cell** — replace the `<Badge variant="violet" label={user.age_category ?? ''} />` cell with:
```svelte
<td class="px-5 py-3 hidden md:table-cell text-sm text-text2">
  {(() => {
    const dob = user.date_of_birth;
    if (!dob) return '—';
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    return Number.isFinite(age) && age >= 0 ? String(age) : '—';
  })()}
</td>
```

### Action cell

Replace Delete button + View Profile link with:
```svelte
<td class="px-5 py-3 text-right">
  <DropdownMenu items={[
    { label: 'View Profile', onclick: () => goto(`/students/${user.user_id ?? user.id}`) },
    { label: 'Delete', variant: 'danger', onclick: () => openDelete(user.user_id ?? user.id, user.full_name ?? user.name ?? '') },
  ]} />
</td>
```

Requires adding `import { goto } from '$app/navigation';`.

---

## admin/subjects Changes

### Edit subject modal (new)

**New state:**
```svelte
let editSubjectOpen = $state(false);
let editSubjectTarget = $state<{ id: string; name: string } | null>(null);
let editSubjectName = $state('');
let editSubjectLoading = $state(false);
let editSubjectError = $state('');
let editSubjectFormEl = $state<HTMLFormElement | null>(null);
```

**New functions:**
```svelte
function openEditSubject(id: string, name: string) {
  editSubjectTarget = { id, name };
  editSubjectName = name;
  editSubjectError = '';
  editSubjectOpen = true;
}

async function handleEditSubject(e: SubmitEvent) {
  e.preventDefault();
  if (!editSubjectTarget) return;
  editSubjectLoading = true;
  editSubjectError = '';
  try {
    await api.put(`/admin/subjects/${editSubjectTarget.id}`, { name: editSubjectName });
    allSubjects = allSubjects.map((s: any) =>
      s.id === editSubjectTarget!.id ? { ...s, name: editSubjectName } : s
    );
    editSubjectOpen = false;
  } catch {
    editSubjectError = 'Failed to save. Please try again.';
  } finally {
    editSubjectLoading = false;
  }
}
```

**Modal:**
```svelte
<Modal open={editSubjectOpen} title="Edit Subject" onclose={() => (editSubjectOpen = false)}>
  {#if editSubjectError}
    <div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{editSubjectError}</div>
  {/if}
  <form bind:this={editSubjectFormEl} onsubmit={handleEditSubject} class="flex flex-col gap-4">
    <div class="flex flex-col gap-1.5">
      <label for="editSubjectName" class="text-[13px] font-medium">Subject Name</label>
      <input id="editSubjectName" type="text" bind:value={editSubjectName} required
        class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>
  </form>
  {#snippet footer()}
    <Button variant="secondary" size="sm" onclick={() => (editSubjectOpen = false)}>Cancel</Button>
    <Button variant="primary" size="sm" loading={editSubjectLoading} onclick={() => editSubjectFormEl?.requestSubmit()}>Save</Button>
  {/snippet}
</Modal>
```

### Action cell

Replace the existing Delete button (and add Edit) with:
```svelte
<td class="px-5 py-3 text-right">
  <DropdownMenu items={[
    { label: 'Edit', onclick: () => openEditSubject(subject.id, subject.name) },
    { label: 'Delete', variant: 'danger', onclick: () => openDeleteSubject(subject.id, subject.name) },
  ]} />
</td>
```

---

## API Calls

| Endpoint | Method | Used in |
|---|---|---|
| `/admin/teachers/:id/featured` | PATCH | admin/teachers (existing, via `toggleFeatured`) |
| `/admin/subjects/:id` | PUT | admin/subjects (new edit modal) |

All DELETE endpoints already implemented in delta v4.
