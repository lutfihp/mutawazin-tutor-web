# UI Button Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dead "Create Report" button from the student report page and the dead "Message Student" button from the student profile page.

**Architecture:** Two independent one-file edits in the SvelteKit frontend. No backend changes, no new routes, no new components.

**Tech Stack:** SvelteKit 5 (Svelte runes), TypeScript, Tailwind v3. Type-check via `npm run check` (working dir: `d:\Codading Repo\mutawazin\mutawazin-tutor-web`).

---

## File Map

| File | Change |
|---|---|
| `src/routes/reports/[studentId]/+page.svelte` | Remove create-report button, `openCreate()` fn, and create path in `saveReport()` |
| `src/routes/students/[id]/+page.svelte` | Remove message-student button |

---

### Task 1: Remove "Create Report" button from student report page

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

- [ ] **Step 1: Delete the `openCreate` function (lines 73–79)**

Remove this entire block from the `<script>` section:

```diff
-	function openCreate() {
-		editingReport = null;
-		scores = [{ topic: '', score: '', max: '10' }];
-		notes = '';
-		understandingLevel = '';
-		modalOpen = true;
-	}
```

- [ ] **Step 2: Delete the "Create Report" button from the header (lines 138–140)**

Remove this block from the template:

```diff
-		{#if isTeacher}
-			<Button variant="primary" onclick={openCreate}>{$t('reports.createReport')}</Button>
-		{/if}
```

- [ ] **Step 3: Remove the dead create path from `saveReport()`**

In `saveReport()`, the current `if/else` is:

```typescript
if (editingReport) {
    await api.put(`/reports/${editingReport.id}`, payload);
} else {
    await api.post(`/sessions/${null}/reports`, payload);
}
```

Replace with just the edit path (since the modal can now only be opened via `openEdit`, `editingReport` is always set):

```typescript
await api.put(`/reports/${editingReport.id}`, payload);
```

- [ ] **Step 4: Run type-check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors (18 pre-existing warnings are fine).

- [ ] **Step 5: Commit**

```powershell
git -C "d:\Codading Repo\mutawazin\mutawazin-tutor-web" add src/routes/reports/`[studentId`]/+page.svelte
git -C "d:\Codading Repo\mutawazin\mutawazin-tutor-web" commit -m "ui: remove create report button from student report page"
```

---

### Task 2: Remove "Message Student" button from student profile

**Files:**
- Modify: `src/routes/students/[id]/+page.svelte`

- [ ] **Step 1: Delete the message-student button block (lines 220–222)**

Remove this block from the template (inside `<div class="flex gap-2">`):

```diff
-				{#if !isOwn && data.user?.role === 'teacher'}
-					<Button variant="primary">{$t('profile.student.messageStudent')}</Button>
-				{/if}
```

The wrapping `<div class="flex gap-2">` at line 216 stays — it still holds the `{#if canShowEmail}` "Set Up Email" button.

- [ ] **Step 2: Run type-check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors (18 pre-existing warnings are fine).

- [ ] **Step 3: Commit**

```powershell
git -C "d:\Codading Repo\mutawazin\mutawazin-tutor-web" add src/routes/students/`[id`]/+page.svelte
git -C "d:\Codading Repo\mutawazin\mutawazin-tutor-web" commit -m "ui: remove message student button from student profile"
```

---

## Manual Smoke Test (after both tasks)

- Log in as teacher → open any student's report page (`/reports/<student-id>`) → confirm no "Create Report" button in the header; confirm edit and share still work on each report card.
- Log in as teacher → open a student profile (`/students/<id>`) → confirm no "Message Student" button.
- Log in as student (own profile) → confirm "Set Up Email" button still appears if applicable.
