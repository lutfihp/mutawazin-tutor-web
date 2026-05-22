# Admin Calendar — Recurring Templates Fix (Delta v7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the three recurring template endpoints in the admin calendar page now that the backend supports `teacher_id` — add the query param to GET, add the body field to POST, and remove the obsolete warning banner.

**Architecture:** Three targeted string replacements in `src/routes/admin/calendar/+page.svelte`. No new state, no new UI, no new routes.

**Tech Stack:** Svelte 5 runes, existing `api.get` / `api.post` helpers.

---

## Files

| Action | Path |
|---|---|
| Modify | `src/routes/admin/calendar/+page.svelte` |

---

### Task 1: Apply the three changes

**Files:**
- Modify: `src/routes/admin/calendar/+page.svelte`

- [ ] **Step 1: Add `?teacher_id=` to `fetchRecurringTemplates()`**

  Find this line (inside `fetchRecurringTemplates`):

  ```typescript
  		const d = await api.get<any[]>('/sessions/recurring');
  ```

  Replace with:

  ```typescript
  		const d = await api.get<any[]>(`/sessions/recurring?teacher_id=${filteredTeacherId}`);
  ```

- [ ] **Step 2: Add `teacher_id` to `handleRecurringSubmit()` POST body**

  Find this block (the `body` object inside `handleRecurringSubmit`):

  ```typescript
  		const body = {
  			type: rType,
  			course_id: rType === 'group' ? rCourseId : undefined,
  			student_id: rType === 'private' ? rStudentId : undefined,
  			title: rTitle,
  			day_of_week: rDayOfWeek,
  			start_time: rStartTime,
  			duration_minutes: rDuration,
  			mode: rMode,
  			price: rPrice || undefined,
  		};
  ```

  Replace with:

  ```typescript
  		const body = {
  			type: rType,
  			course_id: rType === 'group' ? rCourseId : undefined,
  			student_id: rType === 'private' ? rStudentId : undefined,
  			title: rTitle,
  			day_of_week: rDayOfWeek,
  			start_time: rStartTime,
  			duration_minutes: rDuration,
  			mode: rMode,
  			price: rPrice || undefined,
  			teacher_id: filteredTeacherId || undefined,
  		};
  ```

  `teacher_id` is only sent when creating (the `if (editingTemplate)` branch calls `PUT` which needs no body change). The `|| undefined` ensures the field is omitted on `PUT` if `filteredTeacherId` is empty, though in practice the recurring panel only opens when a teacher is filtered.

- [ ] **Step 3: Remove the warning banner from the recurring panel**

  Find and delete this entire `<div>` block (inside the `{:else}` branch of the recurring panel, just before the `{#if recurringTemplates.length === 0}` check):

  ```svelte
  				<div class="mb-3 p-2.5 bg-warningBg border border-warning/40 rounded-sm text-xs text-warningText leading-relaxed">
  					Recurring management for other teachers requires a backend update. Create/edit will not work until then.
  				</div>
  ```

- [ ] **Step 4: Run type check**

  ```bash
  npm run check
  ```

  Expected: 0 errors, 10 pre-existing warnings. No new issues — these are string replacements with no type implications.

- [ ] **Step 5: Commit**

  ```bash
  git add "src/routes/admin/calendar/+page.svelte"
  git commit -m "feat: wire admin recurring templates to teacher_id (delta v7)"
  ```
