# AuthLayout Content Centering Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center page content within the post-sidebar space on wide viewports (≥1520px) by moving `max-w-app mx-auto` off `<main>` onto an inner wrapper div in AuthLayout.

**Architecture:** The sidebar is `position: fixed` (out of flow). `<main>` fills the full flex container and uses `ml-60` to offset past the sidebar. Currently `mx-auto` on `<main>` is overridden by `ml-60`, so free space after `max-w-app` accumulates on the right only. Moving `max-w-app mx-auto` to an inner div inside `<main>` makes centering relative to the post-sidebar area.

**Tech Stack:** SvelteKit, Tailwind CSS v3

---

### Task 1: Apply the centering fix to AuthLayout

**Files:**
- Modify: `src/lib/components/layout/AuthLayout.svelte:34-39`

- [ ] **Step 1: Open the file and locate the `<main>` element**

  In `src/lib/components/layout/AuthLayout.svelte`, find lines 34–38:

  ```svelte
  <main
  	id="main-content"
  	tabindex="-1"
  	class="flex-1 sidebar-collapse:ml-60 p-6 lg:p-8 max-w-app mx-auto w-full focus:outline-none"
  >
  	{#if children}{@render children()}{/if}
  </main>
  ```

- [ ] **Step 2: Apply the change**

  Replace with:

  ```svelte
  <main
  	id="main-content"
  	tabindex="-1"
  	class="flex-1 sidebar-collapse:ml-60 p-6 lg:p-8 focus:outline-none"
  >
  	<div class="max-w-app mx-auto">
  		{#if children}{@render children()}{/if}
  	</div>
  </main>
  ```

  Key changes:
  - Removed `max-w-app mx-auto w-full` from `<main>`
  - Added `<div class="max-w-app mx-auto">` wrapping `{@render children()}`

- [ ] **Step 3: Run type check**

  ```powershell
  npm run check
  ```

  Expected output: `0 errors, 0 warnings` (or same counts as before the change — this edit touches only markup, no TS).

- [ ] **Step 4: Visual verification**

  ```powershell
  npm run dev
  ```

  Open `http://localhost:5173/admin/teachers` in a browser set to 1600px viewport width (DevTools → device toolbar or resize window).

  Expected:
  - Table card is horizontally centered between the sidebar's right edge and the viewport's right edge (equal whitespace on both sides of the card)
  - At 1440px viewport: content still fills the full available width with no side gaps

  Also spot-check:
  - `/admin/students` — same centering
  - `/admin/subjects` — same centering
  - `/dashboard` — no regression (content still fills available space at typical widths)

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/components/layout/AuthLayout.svelte
  git commit -m "fix: center authenticated page content within post-sidebar space on wide viewports"
  ```
