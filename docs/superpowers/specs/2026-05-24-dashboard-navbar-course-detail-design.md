# Design: Dashboard stat fix, Navbar avatar, Course detail page

**Date:** 2026-05-24
**Scope:** Three independent fixes/features addressed in one plan.

---

## 1. Admin dashboard — Active Courses count (Issue 1)

### Problem
The "Active Courses" stat card on `/admin` showed 0 because the backend's `GET /admin/stats` previously did not return the `active_courses` field.

### Fix
Backend has been updated to include `active_courses` in the stats response:
```json
{ "total_teachers": 5, "total_students": 12, "active_courses": 3 }
```

The frontend at `src/routes/admin/+page.svelte:25` already reads `s.active_courses ?? 0`.
**No frontend change required.** Verify by refreshing `/admin` after the backend update.

---

## 2. Navbar Avatar (Issue 2)

### Problem
`src/lib/components/layout/Navbar.svelte` renders `<Avatar name={$user.id} id={$user.id} size="sm" />` for all authenticated roles. Since `$user.id` is a numeric string (e.g. `"1"`), the Avatar shows that number in a colored circle — confusing and not meaningful.

### Solution
- **Admin**: Remove the Avatar entirely. No profile link needed in the Navbar for admins.
- **Teacher**: Fetch `GET /teachers/${$user.id}` on mount. Render Avatar as a link to `/teachers/${$user.id}`.
- **Student**: Fetch `GET /students/${$user.id}` on mount. Render Avatar as a link to `/students/${$user.id}`.

Avatar uses `name={profileName}` for initials and `src={profileSrc}` for photo (falls back to initials if no photo or if image fails to load — existing Avatar component behavior).

### Data flow
- No changes to `hooks.server.ts`, `app.d.ts`, or `User` store type.
- Profile data is fetched client-side in `onMount` inside Navbar, stored in local `$state`.
- While loading: Avatar renders with empty name → blank colored circle (no flash of old number).

### Files changed
| File | Change |
|---|---|
| `src/lib/components/layout/Navbar.svelte` | Replace static Avatar with role-conditional: remove for admin, fetch + link for teacher/student |

### API calls
| Role | Endpoint | Fields used |
|---|---|---|
| teacher | `GET /teachers/:id` | `full_name`, photo URL field |
| student | `GET /students/:id` | `full_name`, photo URL field |

> Note: the exact photo field name (`photo_url`, `avatar_url`, etc.) must match what those endpoints return. Inspect the response at runtime if uncertain.

---

## 3. Course detail page `/courses/:id` (Issue 3)

### Problem
`src/routes/courses/+page.svelte` links to `/courses/{course.id}` but no route exists for that path, causing a 404.

### Solution
Create `src/routes/courses/[id]/+page.server.ts` and `+page.svelte`. The parent `src/routes/courses/+layout.svelte` already wraps with `<AuthLayout>`, so no new layout is needed.

### API
`GET /courses/:id` — authenticated, any role. Returns 404 if not found.

Response shape:
```ts
{
  id: string
  teacher_id: string
  subject_id: string
  name: string                         // resolved subject name
  subject_status: 'active' | 'deleted' | 'unknown'
  age_categories: string[]
  price_by_age_category: Record<string, number>
  description: string
  status: 'draft' | 'active' | 'archived'
  enrolled_student_ids: string[]
}
```

### Server load (`+page.server.ts`)
1. Guard: `if (!locals.user) throw redirect(302, '/login')`
2. Fetch `GET /courses/${params.id}` with auth cookie
3. If response is 404 or not ok: `throw error(404)`
4. Return `{ course, user: locals.user }`

### Page layout (`+page.svelte`)

**Back link** — `← Courses` → `/courses`

**Header**
- `h1`: `course.name`
- Badge: course status (`draft` → gray, `active` → success, `archived` → warning)
- Badge: subject status (`deleted` or `unknown` → error; `active` hidden or shown as teal)

**Body cards**

| Card | Content | Shown to |
|---|---|---|
| Description | `course.description` (hidden if empty) | All |
| Teacher | "By [Teacher]" link → `/teachers/{course.teacher_id}` | All |
| Pricing | Grid: age category → formatted price (Rp X.XXX) per row | All |
| Enrolled badge | "Enrolled" success badge | Student only, if `enrolled_student_ids.includes(user.id)` |
| Enrollment count | `{enrolled_student_ids.length} students enrolled` | Teacher + Admin |
| Manage link | "Manage enrollments →" → `/admin/courses` | Admin only |

**No enroll action on this page.** Student enrollment is admin-only and handled via `/admin/courses`.

### Files created
| File | Purpose |
|---|---|
| `src/routes/courses/[id]/+page.server.ts` | Auth guard + fetch course + throw 404 |
| `src/routes/courses/[id]/+page.svelte` | Course detail view |

---

## Out of scope
- Adding `full_name` to JWT (backend change, not needed for this plan)
- Student self-enrollment UI (not permitted; admin-only)
- Admin course enrollment management from the course detail page (stays in `/admin/courses`)
