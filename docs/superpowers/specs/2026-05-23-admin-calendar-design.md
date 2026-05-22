# Admin Calendar Page — Design Spec

**Date:** 2026-05-23
**Route:** `/admin/calendar`
**Backend delta:** `handoffs/2026-05-22-fe-handoff-delta-v6.md`
**Scope:** New admin calendar page + session edit modal (PUT /sessions/:id). Does not touch teacher calendar yet.

---

## Overview

A new admin-only calendar page that mirrors the teacher calendar's visual design but adds a teacher picker for cross-teacher visibility. The admin can view all sessions at once or filter to a specific teacher's view. Recurring template management is included in design but requires a backend addition to function (see Constraints).

---

## Route & File Structure

```
src/routes/admin/calendar/
├── +layout.svelte        ← pass-through (parent /admin/+layout.svelte provides AuthLayout)
├── +page.server.ts       ← auth guard: admin only
└── +page.svelte          ← full page
```

The `+layout.svelte` follows the existing admin sub-route pass-through pattern:
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>
{#if children}{@render children()}{/if}
```

---

## Sidebar

Add a Calendar item to the admin nav in `src/lib/components/layout/Sidebar.svelte`:

```typescript
{ id: 'calendar', labelKey: 'nav.calendar', href: '/admin/calendar', icon: Calendar }
```

Insert after `courses` in the admin items array. `Calendar` is already imported from `lucide-svelte`.

---

## Data Loading

All data loads in `onMount` (CSR, same pattern as teacher calendar and admin courses).

### On mount
1. `GET /admin/teachers` → build `teacherMap: Record<string, { full_name, photo_url }>` and populate the teacher picker list
2. `GET /calendar/admin?from=<monthStart>&to=<monthEnd>` → initial sessions array

### On teacher filter change
- Re-fetch `GET /calendar/admin?teacher_id=<id>&from=<monthStart>&to=<monthEnd>`
- Clear filter → re-fetch without `teacher_id`

### On month navigation
- Re-fetch with updated `from`/`to` params (and `teacher_id` if filter is active)

### Date params
`from` = first day of displayed month (`YYYY-MM-DD`), `to` = last day of displayed month.

---

## Page Layout

### Toolbar (single row, inside a Card)

```
[ Teacher picker dropdown (200px min) ] [ divider ] [ ‹ May 2026 › ] [ + Add Session (right) ]
```

**Teacher picker — no selection state:**
- Placeholder text "Filter by teacher…" in muted style
- Clicking opens a dropdown list of all teachers (avatar + name)

**Teacher picker — selected state:**
- Shows teacher avatar (22px) + name in blue tint
- ✕ button on the right to clear the filter
- Border and background change to blue tint (`bg-primary-light border-primary/30`)

### Calendar Grid

Same month grid as `src/routes/calendar/+page.svelte`:
- 7-column grid (Mon–Sun)
- Day cells with date number + session pills
- Session pills: same colour coding as teacher calendar
  - Group sessions: blue tint (`bg-primary-light text-primary-dark`)
  - Private sessions: violet tint (`bg-violet-bg text-violet-text`)
  - Recurring badge (↻) on pills from recurring templates
- **All-teachers mode only:** pill text is prefixed with teacher's first name e.g. `Ahmad · Calculus 09:00`
- **Filtered mode:** no prefix — same as teacher's own view
- Clicking a pill opens the **Session Edit modal**

### Session count summary (header, right)
- All-teachers: `"All teachers — N sessions this month"` in a green chip
- Filtered: show nothing (teacher name already visible in picker)

### Recurring Templates Section

Shown **only when a teacher filter is active**. Hidden when viewing all teachers, with a static note: *"Select a teacher to view their recurring sessions."*

When visible: same layout as teacher calendar recurring panel — list of recurring templates with day badge, title, time, type, Edit/Delete actions + "+ Recurring" button.

> **Backend constraint:** The existing recurring endpoints (`GET/POST/PUT/DELETE /sessions/recurring`) are auth-scoped to the logged-in user and do not accept `teacher_id`. Until the backend adds admin support for teacher-specific recurring management, this section renders but calls to create/edit/delete will return 403. The section should be shown with a dismissible warning: *"Recurring management for other teachers requires a backend update."* This allows the UI to be built now and light up automatically once the backend ships the fix. **Do not block the admin calendar ship on this.**

---

## Session Create Modal

Same modal as teacher calendar's "Add Session", with these changes:

| Field | Teacher | Admin (no filter) | Admin (filtered) |
|---|---|---|---|
| Teacher | — (own) | Required picker | Pre-filled + locked |
| Type | Group / Private | Group / Private | Group / Private |
| Course | Required for Group | Required for Group | Required for Group |
| Student | Required for Private | Required for Private | Required for Private |
| Title | Required | Required | Required |
| Date, Start, End | Required | Required | Required |
| Mode | Optional | Optional | Optional |
| Price | Optional | Optional | Optional |

**Teacher picker in create modal (no filter active):**
- Searchable dropdown of all teachers (already in memory from page load)
- Required — 422 from backend if omitted

**Course list in create modal (Group type):**
- Fetched on-demand when the modal opens: `GET /admin/courses` (same endpoint as the admin courses page)
- Filtered client-side by the selected `teacher_id` to show only that teacher's courses
- If no teacher selected yet, course picker is disabled with placeholder "Select a teacher first"

**API call:** `POST /sessions` with `teacher_id` in body.

---

## Session Edit Modal (New — PUT /sessions/:id)

Clicking any session pill on the calendar opens this modal. Admin can edit all fields.

**Fields shown:**
- Title (text input)
- Date (date input)
- Start time / End time
- Mode (online / offline)
- Price (number input, optional)
- Teacher (picker — same teacher dropdown) — admin only
- Student (picker — populated from existing students list or typed) — admin only, shown for private sessions
- Course (picker) — admin only, shown for group sessions

**Save:** `PUT /sessions/:id` with changed fields.

**Status actions** (same as teacher calendar):
- "Mark Completed" → `PATCH /sessions/:id/status { status: "completed" }`
- "Cancel Session" → `PATCH /sessions/:id/status { status: "cancelled" }`

**API responses:**
- `200` → close modal, refresh session list
- `403` → show inline error "You don't have permission to edit this session"
- `404` → show inline error "Session not found"

---

## Auth Guard

`src/routes/admin/calendar/+page.server.ts`:
```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  if (locals.user.role !== 'admin') throw redirect(302, '/dashboard');
  return {};
};
```

---

## i18n

No new keys needed — all strings reuse existing keys:
- `nav.calendar` — already exists (used by teacher/student sidebar)
- `calendar.*` — all existing calendar keys apply
- `common.save`, `common.cancel`, `common.edit`, `common.delete` — existing

One new key needed for the teacher filter placeholder:
- `admin.filterByTeacher` → `"Filter by teacher…"` (EN) / `"Filter berdasarkan guru…"` (ID)

---

## Out of Scope

- Teacher calendar session edit (PUT /sessions/:id for teacher role) — separate future task
- Admin recurring endpoint backend changes — flagged above; UI scaffolded, full function deferred
- Availability panel — explicitly excluded
