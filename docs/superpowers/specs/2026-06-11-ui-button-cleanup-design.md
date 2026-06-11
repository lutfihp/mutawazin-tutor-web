# UI Button Cleanup — Design Spec
**Date:** 2026-06-11

## Scope

Two targeted button removals in the teacher-facing frontend. No backend changes. No new routes or components.

---

## Task 1 — Remove "Create Report" button from student report page

**File:** `src/routes/reports/[studentId]/+page.svelte`

### What changes

| Element | Action |
|---|---|
| `{#if isTeacher}<Button ...openCreate>` (lines 138–140) | Delete |
| `openCreate()` function (lines 73–79) | Delete — dead code |
| `else` branch in `saveReport()` (`api.post('/sessions/${null}/reports', ...)`) | Delete — was already broken (null session ID) and is now unreachable |

### What stays unchanged

- Edit-report modal and all associated state
- `openEdit(report)` function and the edit button in each report card
- `saveReport()` edit path (`api.put('/reports/:id', payload)`)
- Share functionality
- Date filters and pagination

### Why

The dedicated `/reports/new` page already handles report creation with the full 3-step flow (session → student → form). The inline create button in `[studentId]` was a duplicate entry point that also used a broken API call (`session_id = null`).

---

## Task 2 — Remove "Message Student" button from student profile

**File:** `src/routes/students/[id]/+page.svelte`

### What changes

| Element | Action |
|---|---|
| `{#if !isOwn && data.user?.role === 'teacher'}<Button ...messageStudent>` (lines 220–222) | Delete |

### What stays unchanged

- Wrapping `<div class="flex gap-2">` — still holds the "Set Up Email" button
- All other profile functionality (photo upload, name/DOB/phone editing, enrolled courses, recent reports)

### Why

Messaging is not implemented — the button had no `href` or `onclick` handler and calling it was dead UI.

---

## Testing

After changes:
- Teacher visits `reports/<student-id>` — no "Create Report" button visible; edit and share still work per report card
- Teacher visits a student profile — no "Message Student" button visible; "Set Up Email" button still renders for the student's own view
- `npm run check` passes (0 errors)
