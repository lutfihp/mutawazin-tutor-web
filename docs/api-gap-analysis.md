# API Gap Analysis — 2026-05-30

Compares `mutawazin-tutor-api/docs/api-contract/api-types.ts` against all frontend API calls.

---

## Not Implemented

### 🟡 Medium Priority

**`POST /auth/resend-verification`**
- Body: `{ email: string }`
- No "resend email" button on `/verify-email` page. If the link expires the user is stuck.
- Need: a resend button that posts `{ email }` and shows a confirmation.

**`PUT /teachers/me/credentials`**
- Body: `{ credentials: CredentialSchema[] }` — `{ title, institution, year }[]`
- `PUT /teachers/me` (UpdateTeacherProfileRequest) does NOT include a credentials field — it is a separate endpoint.
- The teacher profile credentials section displays existing credentials but cannot save edits.
- Need: wire the credentials section edit save to this endpoint.

**`PUT /courses/{course_id}` (teacher, non-admin)**
- Body: `UpdateCourseRequest` — `{ age_categories?, price_by_age_category?, description? }`
- Admin course edit is implemented at `PUT /admin/courses/{id}`.
- A teacher editing their own course via the regular courses route is not implemented.
- Need: edit UI on the teacher's course detail or course list page.

---

### 🟢 Low Priority — Read endpoints not consumed

**`GET /sessions/{session_id}`**
- Returns `SessionResponse` (full session detail including mode, price, recurring_template_id).
- Not used anywhere in the frontend.

**`GET /sessions/{session_id}/rating`**
- Returns `RatingAggregateResponse` — `{ average_rating, total_ratings }`.
- `POST /sessions/{id}/rating` (create rating) is implemented, but there is no display of ratings.
- Need: show average rating on the session pill, session detail, or teacher profile.

**`GET /reports/{report_id}`**
- Returns full `ReportResponse` for a single report.
- Reports are always loaded via the student list endpoint `GET /students/{id}/reports`.
- Not consumed standalone.

---

## Not a Gap (working as designed)

| Endpoint | Notes |
|---|---|
| `GET /students/me` | Frontend uses `GET /students/{id}` with the user's own ID from auth — same result |
| `GET /availability` (no teacher_id) | Contract says `GET /availability/{teacher_id}` but teacher inferred from auth cookie |
| `POST /teachers/me/photo` | Implemented ✅ |
| `POST /students/me/photo` | Implemented ✅ |
| `POST /auth/change-password` | Implemented ✅ (Navbar) |
| `PATCH /admin/subjects/{id}/verify` | Implemented ✅ |
| `PATCH /admin/teachers/{id}/verify` | Implemented ✅ — on `/admin` overview page, not `/admin/teachers` |
| `PATCH /admin/students/{id}/verify` | Implemented ✅ — on `/admin` overview page, not `/admin/students` |

---

## Summary Table

| Priority | Endpoint | What's Missing |
|---|---|---|
| 🟡 Medium | `POST /auth/resend-verification` | Resend email button on verify-email page |
| 🟡 Medium | `PUT /teachers/me/credentials` | Credentials section save in teacher profile |
| 🟡 Medium | `PUT /courses/{course_id}` | Teacher editing own course (non-admin) |
| 🟢 Low | `GET /sessions/{session_id}` | Session detail not consumed |
| 🟢 Low | `GET /sessions/{session_id}/rating` | No rating display anywhere |
| 🟢 Low | `GET /reports/{report_id}` | Single report not consumed standalone |
