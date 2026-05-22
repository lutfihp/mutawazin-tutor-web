# Admin Table Action Column Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two bugs on admin table pages: right-aligned "Actions" column header and dropdown panel causing horizontal scroll inside `overflow-x-auto`.

**Architecture:** Two independent fixes — `DropdownMenu.svelte` switches from `absolute` to `fixed` positioning using `getBoundingClientRect()` so the panel escapes all overflow ancestors; the three admin pages each get a one-word change on the Actions `<th>`.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS v3.

---

### Task 1: Fix `DropdownMenu` — switch panel to `position: fixed`

**Files:**
- Modify: `src/lib/components/ui/DropdownMenu.svelte`

- [ ] **Step 1: Replace the full file content**

  The current file is 47 lines. Replace it entirely with:

  ```svelte
  <script lang="ts">
  	import { MoreVertical } from 'lucide-svelte';

  	type Item = { label: string; onclick: () => void; variant?: 'default' | 'danger' };
  	let { items }: { items: Item[] } = $props();

  	let open = $state(false);
  	let buttonEl = $state<HTMLButtonElement | null>(null);
  	let panelTop = $state(0);
  	let panelRight = $state(0);

  	function openMenu(e: MouseEvent) {
  		e.stopPropagation();
  		if (!open && buttonEl) {
  			const rect = buttonEl.getBoundingClientRect();
  			panelTop = rect.bottom + 4;
  			panelRight = window.innerWidth - rect.right;
  		}
  		open = !open;
  	}

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
  	role="none"
  >
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
  </div>
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/components/ui/DropdownMenu.svelte
  git commit -m "fix: use fixed positioning in DropdownMenu to prevent table overflow scroll"
  ```

---

### Task 2: Fix Actions column header alignment on all three admin pages

**Files:**
- Modify: `src/routes/admin/teachers/+page.svelte`
- Modify: `src/routes/admin/students/+page.svelte`
- Modify: `src/routes/admin/subjects/+page.svelte`

- [ ] **Step 1: Fix `admin/teachers/+page.svelte`**

  Find the Actions `<th>` (last `<th>` in the thead row). Change `text-right` to `text-left`:

  ```svelte
  <!-- before -->
  <th class="px-5 py-3 text-right">{$t('common.actions')}</th>

  <!-- after -->
  <th class="px-5 py-3 text-left">{$t('common.actions')}</th>
  ```

  The `<td class="px-5 py-3 text-right">` in the tbody rows is unchanged — the `⋮` button stays right-aligned.

- [ ] **Step 2: Fix `admin/students/+page.svelte`**

  Same change — find the last `<th>` in the thead and change `text-right` to `text-left`:

  ```svelte
  <!-- before -->
  <th class="px-5 py-3 text-right">{$t('common.actions')}</th>

  <!-- after -->
  <th class="px-5 py-3 text-left">{$t('common.actions')}</th>
  ```

- [ ] **Step 3: Fix `admin/subjects/+page.svelte`**

  Same change:

  ```svelte
  <!-- before -->
  <th class="px-5 py-3 text-right">{$t('common.actions')}</th>

  <!-- after -->
  <th class="px-5 py-3 text-left">{$t('common.actions')}</th>
  ```

- [ ] **Step 4: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 5: Commit**

  ```bash
  git add src/routes/admin/teachers/+page.svelte src/routes/admin/students/+page.svelte src/routes/admin/subjects/+page.svelte
  git commit -m "fix: left-align Actions column header on admin tables"
  ```

---

### Task 3: Verify

- [ ] **Step 1: Start dev server**

  ```powershell
  npm run dev
  ```

- [ ] **Step 2: Verify dropdown no longer causes scroll**

  Open `http://localhost:5173/admin/teachers`. Click the `⋮` button on any row.

  Expected:
  - Dropdown panel appears below the button, aligned to its right edge
  - No horizontal scrollbar appears on the table
  - Clicking outside the panel closes it
  - Pressing Escape closes it

  Repeat on `/admin/students` and `/admin/subjects`.

- [ ] **Step 3: Verify header alignment**

  On each admin table page, confirm the "Actions" column header is left-aligned, matching all other column headers.
