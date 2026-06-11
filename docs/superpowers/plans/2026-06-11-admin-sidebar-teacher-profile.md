# Admin Sidebar on Teacher Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the admin sidebar when an admin views any teacher profile page, while keeping unauthenticated visitors on the public Navbar-only layout.

**Architecture:** One-line fix to the `useAuthLayout` derived value in `src/routes/teachers/[id]/+layout.svelte` — add `admin` to the roles that use `<AuthLayout>`. Unauthenticated visitors (`role === undefined`) are unaffected because `undefined === 'admin'` is `false`. CLAUDE.md architecture note is updated to reflect the corrected constraint.

**Tech Stack:** SvelteKit 5 (runes mode), TypeScript

---

### Task 1: Fix `useAuthLayout` in teacher profile layout

**Files:**
- Modify: `src/routes/teachers/[id]/+layout.svelte:11`

- [ ] **Step 1: Open the layout file and confirm the current line**

  File: `src/routes/teachers/[id]/+layout.svelte`

  Line 11 currently reads:
  ```svelte
  const useAuthLayout = $derived(role === 'teacher' || role === 'student');
  ```

- [ ] **Step 2: Apply the fix**

  Replace line 11 with:
  ```svelte
  const useAuthLayout = $derived(role === 'teacher' || role === 'student' || role === 'admin');
  ```

  Full file after change:
  ```svelte
  <script lang="ts">
  	import type { Snippet } from 'svelte';
  	import Navbar from '$lib/components/layout/Navbar.svelte';
  	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';

  	let { data, children }: { data: App.PageData; children?: Snippet } = $props();

  	// Teachers and students keep their sidebar when viewing a teacher profile.
  	// Unauthenticated visitors get the public layout (no sidebar).
  	// Admin visitors keep the admin sidebar.
  	const role = $derived(data.user?.role as 'admin' | 'teacher' | 'student' | undefined);
  	const useAuthLayout = $derived(role === 'teacher' || role === 'student' || role === 'admin');
  </script>

  {#if useAuthLayout}
  	<AuthLayout role={role!} userId={data.user?.id ?? ''}>
  		{#if children}{@render children()}{/if}
  	</AuthLayout>
  {:else}
  	<div class="min-h-screen bg-bgGray">
  		<Navbar />
  		<main id="main-content" tabindex="-1" class="max-w-profile mx-auto px-6 py-10">
  			{#if children}{@render children()}{/if}
  		</main>
  	</div>
  {/if}
  ```

- [ ] **Step 3: Run type check**

  ```powershell
  cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
  npm run check
  ```

  Expected: 0 errors (18 pre-existing warnings are acceptable — do not treat warnings as failures).

- [ ] **Step 4: Commit**

  ```powershell
  cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
  git add src/routes/teachers/[id]/+layout.svelte
  git commit -m "fix: restore admin sidebar on teacher profile page"
  ```

---

### Task 2: Update CLAUDE.md architecture decision note

**Files:**
- Modify: `d:\Codading Repo\mutawazin\mutawazin-tutor-web\CLAUDE.md`

- [ ] **Step 1: Find the architecture decision to update**

  Search for the line containing `Do NOT apply` near `public pages` in `CLAUDE.md`. It currently reads:

  > **Public pages — role-conditional layout** | Pages under `teachers/[id]/` are public but layout branches on `data.user?.role`: `teacher`/`student` → `<AuthLayout>` (sidebar preserved); `admin` and unauthenticated → public layout (Navbar + `max-w-profile` main). Do NOT apply `<AuthLayout>` for admin on public pages — the admin sidebar would appear on a public profile. `data.user` is available in `+page.svelte` via root layout data merging.

- [ ] **Step 2: Replace with the corrected note**

  Replace the value cell of that table row with:

  > Pages under `teachers/[id]/` are public but layout branches on `data.user?.role`: `teacher`/`student`/`admin` → `<AuthLayout>` (sidebar preserved for their role); unauthenticated → public layout (Navbar + `max-w-profile` main, no sidebar). Do NOT apply `<AuthLayout>` for unauthenticated visitors on public pages. `data.user` is available in `+page.svelte` via root layout data merging.

- [ ] **Step 3: Commit**

  ```powershell
  cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
  git add CLAUDE.md
  git commit -m "docs: update public-page layout architecture note for admin sidebar"
  ```

---

## Manual Verification

After both tasks are committed:

1. Start the dev server: `npm run dev`
2. Log in as `admin@mutawazin.com` / `changeme123`
3. Navigate to `/admin/teachers` → click any teacher's name or "View Profile"
4. Confirm the admin sidebar is visible on the teacher profile page
5. Log out
6. Navigate directly to the same `/teachers/[id]/` URL while unauthenticated
7. Confirm only the Navbar is shown — no sidebar
