# Admin Calendar — Recurring Templates Fix (Delta v7)

**Date:** 2026-05-23
**File:** `src/routes/admin/calendar/+page.svelte`
**Backend delta:** `handoffs/2026-05-23-fe-handoff-delta-v7.md`
**Scope:** Three targeted edits — no new UI, no new state, no new routes.

---

## Context

Delta v7 adds `teacher_id` support to all four `/sessions/recurring` endpoints. Admin can now fetch, create, edit, and delete recurring templates on behalf of any teacher. The admin calendar page already has all the UI scaffolded but was blocked by missing API support (guarded with a warning banner). This spec removes those blockers.

---

## Changes

### 1. `fetchRecurringTemplates()` — pass `teacher_id` query param

The function already guards on `if (!filteredTeacherId) return` so it only runs when a teacher is selected. The GET call needs the query param added:

```typescript
// Before
const d = await api.get<any[]>('/sessions/recurring');

// After
const d = await api.get<any[]>(`/sessions/recurring?teacher_id=${filteredTeacherId}`);
```

### 2. `handleRecurringSubmit()` — add `teacher_id` to POST body

When creating a new recurring template (`editingTemplate` is null), `teacher_id` is required by the backend for admin callers. Add it to the body object:

```typescript
// Before
const body = {
    type: rType,
    course_id: ...,
    student_id: ...,
    title: rTitle,
    day_of_week: rDayOfWeek,
    start_time: rStartTime,
    duration_minutes: rDuration,
    mode: rMode,
    price: rPrice || undefined,
};

// After — add teacher_id
const body = {
    type: rType,
    course_id: ...,
    student_id: ...,
    title: rTitle,
    day_of_week: rDayOfWeek,
    start_time: rStartTime,
    duration_minutes: rDuration,
    mode: rMode,
    price: rPrice || undefined,
    teacher_id: filteredTeacherId || undefined,
};
```

`PUT /sessions/recurring/:id` (edit) requires no body change — admin ownership bypass is handled server-side.

### 3. Remove warning banner from recurring panel

Delete the yellow warning `<div>` that says *"Recurring management for other teachers requires a backend update."* It is no longer accurate.

```svelte
<!-- Remove this entire block: -->
<div class="mb-3 p-2.5 bg-warningBg border border-warning/40 rounded-sm text-xs text-warningText leading-relaxed">
    Recurring management for other teachers requires a backend update. Create/edit will not work until then.
</div>
```

---

## Out of Scope

- Teacher calendar recurring endpoints — unchanged, no action needed.
- Any other pages — not affected by delta v7.
