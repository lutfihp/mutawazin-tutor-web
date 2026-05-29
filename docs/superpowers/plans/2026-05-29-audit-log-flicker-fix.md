# Audit Log Flicker Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate flickering on the audit log page when Apply is pressed while entries are already loaded.

**Architecture:** Change the tbody condition so skeleton rows only appear on first load (empty state). Add opacity dimming to the table wrapper during refetch so existing rows stay visible instead of disappearing.

**Tech Stack:** SvelteKit, Svelte 5 runes, Tailwind CSS v3

---

### Task 1: Fix audit log flicker

**Files:**
- Modify: `src/routes/admin/settings/audit-log/+page.svelte:175` (overflow wrapper)
- Modify: `src/routes/admin/settings/audit-log/+page.svelte:188` (tbody loading condition)

- [ ] **Step 1: Edit the overflow wrapper (line 175)**

In `src/routes/admin/settings/audit-log/+page.svelte`, find line 175:

```svelte
		<div class="overflow-x-auto">
```

Replace with:

```svelte
		<div class="overflow-x-auto" class:opacity-50={loading} class:pointer-events-none={loading}>
```

- [ ] **Step 2: Edit the tbody loading condition (line 188)**

In the same file, find line 188:

```svelte
					{#if loading}
```

Replace with:

```svelte
					{#if loading && entries.length === 0}
```

- [ ] **Step 3: Run type check**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS` (same 12 pre-existing warnings, no new errors).

- [ ] **Step 4: Manual smoke test**

Open `http://localhost:5173/admin/settings/audit-log`.
- First load: skeleton rows appear briefly, then real rows render. ✓
- Press Apply: table dims briefly, updates in-place — no disappear/reappear. ✓
- Press Apply again immediately: same smooth dim behavior. ✓

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/settings/audit-log/+page.svelte
git commit -m "fix: keep audit log table visible during refetch (stale-while-revalidate)"
```
