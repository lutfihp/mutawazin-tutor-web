# Admin: Create User + Remove Notification Dot

**Date:** 2026-05-17
**Status:** Approved

## Context

Two small fixes to the authenticated app:
1. The notification bell always shows a red dot regardless of whether notifications exist — there is no notifications API, so the dot is misleading.
2. Admin has no way to create username-based (no-email) teacher/student accounts, even though the API supports it via `POST /admin/users/teacher` and `POST /admin/users/student`.

---

## Change 1 — Remove hardcoded notification dot

**File:** `src/lib/components/layout/Navbar.svelte:98`

Remove this line:
```svelte
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-pill border-2 border-white" aria-hidden="true"></span>
```

No condition, no replacement. The bell icon remains; the red dot is simply gone until a real notifications system is built.

---

## Change 2 — Contextual Create button in All Users card

### Placement

In the All Users card header in `src/routes/admin/+page.svelte`, add a button next to the tab switcher that changes label based on `activeTab`:
- Teachers tab active → "**+ Create Teacher**"
- Students tab active → "**+ Create Student**"

### Modal — Create Teacher

Fields:
1. Full name (text, required)
2. Username (text, required — this is their login identifier, no email)
3. Password (password with show/hide, required)
4. Bio (textarea, optional)
5. Subjects (tag input, optional — same pattern as teacher registration)

API: `POST /admin/users/teacher`
```json
{ "full_name": "...", "username": "...", "password": "...", "bio": "", "subjects": [], "credentials": [] }
```

### Modal — Create Student

Fields:
1. Full name (text, required)
2. Username (text, required)
3. Password (password with show/hide, required)
4. Date of birth (date input, required)

API: `POST /admin/users/student`
```json
{ "full_name": "...", "username": "...", "password": "...", "date_of_birth": "YYYY-MM-DD" }
```

### On success

Close modal, clear form, re-call `fetchAllUsers()` to refresh the All Users list.

### On error

Show error message inside the modal (inline, same `role="alert"` pattern used in auth forms).

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/components/layout/Navbar.svelte` | Remove hardcoded red dot span |
| `src/routes/admin/+page.svelte` | Add contextual Create button + two modals |

---

## Out of Scope

- Notifications system (no API exists)
- Credential input on the Create Teacher modal (credentials can be added later via the teacher's own profile)
