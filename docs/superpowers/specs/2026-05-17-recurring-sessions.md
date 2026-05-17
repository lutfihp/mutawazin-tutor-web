# Recurring Sessions — Calendar Updates

**Date:** 2026-05-17
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-17-fe-handoff-delta.md` section 7

## Context

Backend now supports recurring session templates. Sessions created from a template have `recurring_template_id` set. Teachers can create, edit, and delete recurring templates. The calendar gets a visual indicator and a management panel.

---

## Calendar page — `src/routes/calendar/+page.svelte`

### 1. Recurring badge on session pills

Sessions in the calendar grid have a `recurring_template_id?: string | null` field in the response.

When `recurring_template_id` is set: prepend a "↻ " to the pill text.

```svelte
{session.recurring_template_id ? '↻ ' : ''}{session.starts_at?.slice(11,16)} {session.title}
```

### 2. Session detail modal update

When `recurring_template_id` is non-null, add a line in the modal body:

```
↻ Part of a recurring series
```

Shown below the session title, in `text-text2` small text.

### 3. Recurring template list — right panel (teacher only)

Add a new card above the existing "My Availability" card in the right panel:

**"Recurring Sessions" card:**
- Fetch on mount: `GET /sessions/recurring`
- List rows: `[day name] · [start_time] — [title]` + edit/delete icon buttons
- "**+ Add Recurring**" secondary button in the card header
- Edit (pencil): open the Add Recurring modal pre-filled, submit `PUT /sessions/recurring/:id`
- Delete (trash): `DELETE /sessions/recurring/:id` with a confirm dialog → remove from list, the backend deletes future materialized sessions

### 4. "+ Add Recurring" button — page header (teacher only)

Add a secondary button "+ Recurring" next to the existing "+ Add Session" button.

### 5. Add Recurring modal

Fields:
- **Type**: Group / Private radio-pills (same style as Add Session)
- **Course** (shown when Group): `<select>` populated from `GET /courses`
- **Student** (shown when Private): `<select>` populated from `GET /admin/students` or teacher's private student list
- **Title**: text input
- **Day of week**: `<select>` with Mon–Sun options (values 0–6)
- **Start time**: `<input type="time">`
- **Duration**: `<input type="number">` in minutes

Submit → `POST /sessions/recurring { type, course_id?, student_id?, title, day_of_week, start_time, duration_minutes }`

On success: close modal, re-fetch calendar sessions for current month (backend materializes next 30 days immediately), re-fetch recurring templates list.

---

## New locale keys needed

Under `calendar` namespace:
- `calendar.recurringTitle`: "Recurring Sessions"
- `calendar.addRecurring`: "+ Recurring"
- `calendar.noRecurring`: "No recurring sessions."
- `calendar.recurringBadge`: "Part of a recurring series"
- `calendar.modal.recurringTitle`: "Add Recurring Session"
- `calendar.modal.recurringEditTitle`: "Edit Recurring Session"
- `calendar.modal.dayLabel`: "Day of week"
- `calendar.modal.durationLabel`: "Duration (minutes)"
- `calendar.modal.days`: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
- `calendar.modal.deleteRecurringConfirm`: "This will delete all future sessions in this series. Continue?"

---

## Files changed

| File | Change |
|---|---|
| `src/routes/calendar/+page.svelte` | Recurring badge, detail modal update, template list panel, add/edit modal |
| `src/locales/en.json` | New locale keys |
| `src/locales/id.json` | New locale keys (Indonesian) |
