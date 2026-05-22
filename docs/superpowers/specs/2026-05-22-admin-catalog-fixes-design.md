# Design: Admin Table Action Column Fixes

**Date:** 2026-05-22  
**Status:** Approved

## Problems

1. **Header misalignment** — The "Actions" `<th>` uses `text-right` on all three admin table pages while every other column header uses `text-left`. This makes the column label appear right-aligned while the other labels are left-aligned.

2. **Dropdown causes horizontal scroll** — `DropdownMenu`'s panel is `position: absolute` inside a `<div class="overflow-x-auto">` wrapper. When the panel opens, its width pushes the `overflow-x-auto` container to grow a horizontal scrollbar.

## Files Changed

| File | Change |
|---|---|
| `src/lib/components/ui/DropdownMenu.svelte` | Switch panel to `position: fixed` using `getBoundingClientRect()` |
| `src/routes/admin/teachers/+page.svelte` | `text-right` → `text-left` on Actions `<th>` |
| `src/routes/admin/students/+page.svelte` | `text-right` → `text-left` on Actions `<th>` |
| `src/routes/admin/subjects/+page.svelte` | `text-right` → `text-left` on Actions `<th>` |

---

## Fix 1: Header alignment (3 admin pages)

In each of the three admin table pages, find the Actions column header and change `text-right` to `text-left`:

```svelte
<!-- before -->
<th class="px-5 py-3 text-right">{$t('common.actions')}</th>

<!-- after -->
<th class="px-5 py-3 text-left">{$t('common.actions')}</th>
```

The `<td>` cells keep `text-right` — the `⋮` button remains right-aligned. Only the header label changes.

---

## Fix 2: Dropdown fixed positioning (`DropdownMenu.svelte`)

### New state

```svelte
let buttonEl = $state<HTMLButtonElement | null>(null);
let panelTop = $state(0);
let panelRight = $state(0);
```

### Updated open handler

Replace the current `onclick` on the trigger button with a named function that captures position before opening:

```svelte
function openMenu(e: MouseEvent) {
  e.stopPropagation();
  if (!open && buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    panelTop = rect.bottom + 4;
    panelRight = window.innerWidth - rect.right;
  }
  open = !open;
}
```

`rect.bottom + 4` — positions panel 4px below the button (equivalent to the previous `mt-1`).  
`window.innerWidth - rect.right` — aligns the panel's right edge with the button's right edge.

### Updated trigger button

Add `bind:this={buttonEl}` and replace the inline `onclick` with `openMenu`:

```svelte
<button
  bind:this={buttonEl}
  onclick={openMenu}
  class="w-8 h-8 rounded-sm text-text2 hover:text-text hover:bg-bgGray flex items-center justify-center transition-colors"
  aria-label="Actions"
  aria-haspopup="true"
  aria-expanded={open}
>
  <MoreVertical size={16} aria-hidden="true" />
</button>
```

### Updated panel

Replace `class="absolute right-0 top-full mt-1 ..."` with `position: fixed` via inline style:

```svelte
{#if open}
  <div
    style="position:fixed; top:{panelTop}px; right:{panelRight}px;"
    class="bg-white border border-border rounded-sm shadow-md min-w-[140px] py-1 z-50"
  >
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
```

The panel now renders relative to the viewport, escaping all `overflow` ancestors. No horizontal scroll is introduced.
