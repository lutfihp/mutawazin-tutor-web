# Student & Session Improvements — Design

## Overview

Three independent improvements to student management and session assignment UI.

1. **Birthday optional** — admin no longer required to enter DOB when creating a student
2. **StudentPicker component** — replaces native `<select multiple>` in session modals with a search + chip UI
3. **Student names in Edit Session modal** — fixed as a natural consequence of the new component

---

## 1. Birthday Optional (Admin Create Student)

### Backend

**File:** `app/admin/schemas.py`

Change `AdminCreateStudentRequest`:
```python
# Before
date_of_birth: str

# After
date_of_birth: Optional[str] = None
```

**File:** `app/admin/service.py` — `create_student()`

When `date_of_birth` is `None`, skip age category computation and store nulls:
```python
if data.date_of_birth:
    dob = date.fromisoformat(data.date_of_birth)
    age_cat = calculate_age_category(dob)
else:
    dob = None
    age_cat = None

await StudentProfile(
    user_id=str(user.id),
    full_name=data.full_name,
    date_of_birth=data.date_of_birth,
    age_category=age_cat,
).insert()
```

### Frontend

**File:** `src/routes/admin/students/+page.svelte`

Remove `required` from the DOB input. No other changes — field remains visible as optional.

---

## 2. StudentPicker Component

### New File: `src/lib/components/ui/StudentPicker.svelte`

**Props:**
- `students: { id: string; full_name: string | null; username: string | null }[]` — full loaded list
- `value: string[]` — selected student IDs (use `bind:value`)

**Behaviour:**
- Input shows placeholder "Type name to search..." with no dropdown on mount
- Typing 1+ characters filters `students` client-side (case-insensitive match on `full_name ?? username`)
- Dropdown shows up to 6 matching results, scrollable; already-selected students excluded from results
- Clicking a result appends the student's ID to `value` and clears the input
- Clicking × on a chip removes that ID from `value`
- Chip display: avatar initials circle + `full_name ?? username` + × button
- Result count shown at bottom of dropdown ("N results for 'query'")

**Name resolution for chips:** match `value` IDs against the `students` prop. If a student ID in `value` isn't found in the prop (e.g. list not yet loaded), show the raw ID as fallback.

### Updated File: `src/routes/admin/calendar/+page.svelte`

Replace both `<select multiple>` blocks:

**Add Session modal** — replace:
```svelte
<select multiple ...> ... </select>
<p>Hold Ctrl/Cmd to select multiple</p>
```
With:
```svelte
<StudentPicker students={adminStudents} bind:value={sStudentIds} />
```

**Edit Session modal** — replace the equivalent block with:
```svelte
<StudentPicker students={adminStudents} bind:value={eStudentIds} />
```

When the Edit Session modal opens, `eStudentIds = session.student_ids ?? []` is already set before the component mounts — chips render immediately with student names, fixing both the pre-selection display bug and the "show names" requirement.

---

## 3. Student Names in Edit Session Modal

No separate implementation needed. Resolved by the StudentPicker component above: chips display `full_name` for each ID in `eStudentIds`, so opening any existing session immediately shows who is assigned by name.

---

## Scope

- Backend: 2 files changed (`schemas.py`, `service.py`) — non-breaking (field defaults to `null`)
- Frontend: 1 new file (`StudentPicker.svelte`), 1 existing file updated (`admin/calendar/+page.svelte`), 1 existing file updated (`admin/students/+page.svelte` — remove `required`)
- No API shape changes, no new endpoints
