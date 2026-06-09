# Hide Phone Number Section for Unauthenticated Users — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent unauthenticated users from seeing the phone number section (including the "belum diisi" placeholder) on the teacher profile page.

**Architecture:** Add an explicit `data.user` null guard to the existing `{#if isOwn || isAdmin}` condition on the phone number card. This fixes the edge case where `isOwn` evaluates `true` when both `data.user?.id` and `profile?.user_id` are `undefined` (i.e., unauthenticated + missing field → `undefined === undefined`).

**Tech Stack:** SvelteKit 5 (Svelte 5 runes), TypeScript

---

### Task 1: Add auth guard to phone number section

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte:498`

- [ ] **Step 1: Open the file and locate the phone number section**

  File: `src/routes/teachers/[id]/+page.svelte`

  Find line 497–498:
  ```svelte
  <!-- ── Phone Number ── -->
  {#if isOwn || isAdmin}
  ```

- [ ] **Step 2: Apply the change**

  Replace:
  ```svelte
  {#if isOwn || isAdmin}
  ```
  With:
  ```svelte
  {#if data.user && (isOwn || isAdmin)}
  ```

  No other lines change. The closing `{/if}` at line 534 and everything inside the block stays as-is.

- [ ] **Step 3: Verify manually**

  Start the dev server:
  ```bash
  npm run dev
  ```

  Test these cases by navigating to any teacher profile URL (e.g. `http://localhost:5173/teachers/<id>`):

  | Scenario | How to test | Expected result |
  |---|---|---|
  | Unauthenticated | Open in incognito / log out | Phone section not visible at all |
  | Authenticated student | Log in as a student | Phone section not visible |
  | Owner (teacher themselves) | Log in as the teacher whose profile it is | Phone section visible, editable |
  | Admin | Log in as admin | Phone section visible, read-only |

- [ ] **Step 4: Commit**

  ```bash
  git add src/routes/teachers/[id]/+page.svelte
  git commit -m "fix: hide phone number section from unauthenticated users"
  ```
