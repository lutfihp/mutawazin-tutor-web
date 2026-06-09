# Mutawazin — Project Context for Claude Code

## What This Project Is

Mutawazin (Arabic for "balanced") is an online tutoring platform frontend built in SvelteKit. It connects teachers and students for group courses and 1-on-1 sessions.

**Working directory:** `d:\Codading Repo\mutawazin-tutor-web`
**SvelteKit app is at the repo root** — `src/`, `package.json`, etc. live directly in `d:\Codading Repo\mutawazin-tutor-web`
**Backend:** FastAPI at `http://localhost:8000` — not in this repo
**Design handoffs:** `handoffs/` — local only (gitignored). Contains: `design_handoff_mutawazin/`, `brand_kit_handoff/`, FE handoff MDs.

---

## Working with the Backend

**Backend repo:** `d:\Codading Repo\mutawazin-tutor-api` — FastAPI, separate Claude Code session (or same session when opened from the parent `d:\Codading Repo\mutawazin` folder).

**When working from this repo only (mutawazin-tutor-web as root):** Never edit backend files directly. If something requires a backend change, tell the user: *"This looks like a backend issue. Here's a prompt to paste into the backend Claude Code session:"* — then write a short factual prompt (what was called, what happened, what was expected).

**When working from the parent folder (`d:\Codading Repo\mutawazin`):** Both repos are accessible. Fix backend and frontend in the same session without asking the user to switch. See parent `CLAUDE.md` for the cross-repo workflow.

---

## Current Status (as of 2026-06-10 — session 26)

### Build status: ✅ Passes `npm run check` (0 errors, 16 pre-existing warnings)

### GitHub remote: ✅ `https://github.com/lutfihp/mutawazin-tutor-web` — branch `main` pushed and up to date

### Login flow: ✅ Confirmed working end-to-end with `admin@mutawazin.com` / `changeme123`

### What is complete

| Area | Content | Status |
|---|---|---|
| Foundation | SvelteKit scaffold, Tailwind v3, svelte-i18n, ui components, layouts, auth | ✅ |
| Auth | Login, Register (teacher/student) + **debounced email availability check**, Email Verify, Account Step-Up, Forgot Password, Reset Password | ✅ |
| Landing | Hero (brand mark), Benefits, Public search (courses+teachers tabs), Featured Teachers, Footer | ✅ |
| Admin | Overview (stats + pending approvals), `/admin/teachers` (**three-dot menu**, **featured confirm modal**, delete, create + username check), `/admin/students` (**three-dot menu**, **age from DOB**, delete, create + username check), `/admin/subjects` (**three-dot menu**, **edit modal**, delete, create) | ✅ |
| Admin Courses | `/admin/courses` — list all courses, **create** (teacher + subject pickers, age categories + price per category, description), **edit** (subject locked if enrolled, teacher change warning, status toggle), **delete** (409 handling). Sidebar link added. | ✅ |
| Admin Calendar | `/admin/calendar` — month grid via `GET /calendar/admin`, **teacher picker filter**, session edit modal (`PUT /sessions/:id`), session create (teacher_id required), recurring templates panel (when teacher filtered, full CRUD). Delta v6 + v7. | ✅ |
| Delta v5 backend | Admin course CRUD via `POST/PUT/DELETE /admin/courses/:id` | ✅ |
| Delta v6 backend | `GET /calendar/admin`, `PUT /sessions/:id` (edit any session), `POST /sessions` teacher_id required for admin | ✅ |
| Delta v7 backend | All `/sessions/recurring` endpoints accept `teacher_id` for admin | ✅ |
| Dashboards | Teacher dashboard (real names + My Students roster), Student dashboard, Admin → `/admin` redirect | ✅ |
| Profiles | Teacher profile (**redesigned** — per-section pencil editing, Card header + chips row, **handoff SVG icons** for credential sections, **SVG star** replacing ★ Unicode), Student profile (**age badge from DOB**) | ✅ |
| Teacher profile chips row | Chips row uses **inline SVGs** (globe for mode, map-pin for city). Offline mode → globe `opacity-50`. **Teaching methods badges removed** (not in handoff). Mode + city are **editable inline** via `PUT /teachers/me` following the per-section pencil pattern. | ✅ |
| Error pages | `static/errors/502.html`, `503.html`, `504.html` translated to **Bahasa Indonesia**. `src/lib/components/ErrorState.svelte` — Svelte 5 snippet-based presentational component (tone variants: blue/teal/amber/rose/slate). `src/routes/+error.svelte` — full handoff implementation: 401/403/404/429/500 + fallback, each with correct icon, copy, and actions. | ✅ |
| Courses | Filter + grid, create via subject picker, suggest new subject, admin+teacher can create, admin Enroll Student | ✅ |
| Calendar | Month grid, session pills + recurring badge, availability panel, Recurring templates, Add Session, Availability CRUD | ✅ |
| Reports | Score grid, create/edit modal, Share button + panel, public `/report/share/:token` page | ✅ |
| Brand | **Updated brand mark** — `Logo.svelte` now uses the real Mutawazin SVG mark; `static/brand-kit/png/logo-mark-*.png` updated from handoff (optimized, ~50% smaller) | ✅ |
| Subjects | Renamed from "Catalog"; 5-level age categories | ✅ |
| Navigation | Logout button, Sidebar profile/reports hrefs wired via `userId` prop chain | ✅ |
| `/teachers` public page | Featured teachers grid, footer + landing "Browse all" links | ✅ |
| Delta v4 backend | Email/username availability checks, Delete teacher/student/subject with confirmation modals, `"deleted"` status filtering | ✅ |
| Delta v8 backend | `GET /admin/stats` now returns `active_courses` (count of courses with status === "active"). Frontend already reads `s.active_courses ?? 0` — no frontend change needed. | ✅ |
| Navbar avatar | Admin: no avatar. Teacher/Student: `onMount` fetches own profile (`GET /teachers/:id` or `GET /students/:id`), renders Avatar as link to their profile page. Uses `full_name` + `photo_url` — falls back to blank colored circle if fetch fails. | ✅ |
| Course detail page | `src/routes/courses/[id]/` — server load fetches `GET /courses/:id` (throws 404 if not found). Page shows: name + status badges, description, teacher link, pricing grid by age category. Role-conditional: student sees "Enrolled" badge if enrolled; teacher/admin sees enrolled count; admin sees "Manage enrollments →" link to `/admin/courses`. No self-enrollment (admin-only). | ✅ |
| Delta v9 attendance removal | `attendance` field removed from all frontend: report list page (state, filter dropdown, modal radio, payload, $effect tracking), student profile recent reports section, public share page, and dashboard latest report hardcoded badge. Dead i18n keys removed from `en.json` and `id.json` (`attendanceFilter`, `modal.attendance/*Option`, `status.present/late/absent`). | ✅ |
| Bug fixes (session 12) | Course detail shows `teacher_name` as primary text. Report page + share page use correct `sc.max_score` field (not `sc.max`). Report page + share page use `formatDate(report.created_at)` (not `report.date`). Dead "View Full" button removed from reports footer (teacher-only now). | ✅ |
| UI polish (session 12) | Attendance badge deleted from report list entirely (not just hidden). Student age badge uses translatable i18n key `profile.student.yearsOld` (`{age} years old` / `{age} tahun`). Teacher profile course cards use `text-text2` for age categories (was `text-text3`, too light). | ✅ |
| Student DOB edit | Student profile (`students/[id]/+page.svelte`) — DOB edit UI added: pencil button → date input → save via `PUT /students/me { date_of_birth }`. Age badge reads `profile.age` (not formula), gated to `isOwn \|\| admin`. Waiting on backend to return `age: int \| null` from `GET /students/:id` before values are non-null. | ✅ (UI done, wired up; live when backend ships delta v9) |
| i18n fixes (session 13) | Added `common.age` key (EN: "Age", ID: "Usia") to both locale files. Admin students Age column header now uses `$t('common.age')` instead of hardcoded "Age". Admin calendar teacher filter fixed: `aria-label` uses correct path `dashboard.admin.filterByTeacher`; default option uses `courses.allTeachers` ("All teachers" / "Semua guru") instead of raw key. | ✅ |
| CI/CD pipeline (session 14) | `adapter-auto` → `adapter-node` (required for Docker). `Dockerfile` (node:22-alpine, non-root `app` user, port 3000). `docker-compose.yml` (port 3000, `env_file: .env`, restart: unless-stopped). `.github/workflows/deploy.yml.disabled` — GitHub Actions: npm build in CI → rsync artifact to VPS → `docker compose up --build -d`. `docs/deployment-guide.md` — full 9-step VPS setup guide. **Workflow is disabled** pending VPS setup + GitHub secrets. | ✅ (code done; first deploy pending) |
| Delta v11 pagination (session 15) | All list API responses migrated from plain arrays to `PaginatedResponse<T>`. Added `PaginationMeta` + `PaginatedResponse<T>` types to `api.ts`. New `<Pagination />` component (`src/lib/components/ui/Pagination.svelte`) — hidden when `totalPages <= 1`. **Category A (pagination UI):** admin/teachers (pageSize 25), admin/students (25), admin/subjects (25), courses (12), reports (20). **Category B (unwrap only):** admin/courses (3 sub-calls), admin/calendar (3 sub-calls + recurring), calendar (3 sub-calls), dashboard (students), register/teacher (subjects). Server-side `+page.server.ts` files fixed: `.then((b: any) => b.data ?? [])` on all list fetches. Audit log breaking changes fixed (was using deleted `AuditLogListResponse` type). | ✅ |
| Audit log UI polish (session 15) | `src/routes/admin/settings/audit-log/+page.svelte`: Actor column — role pill badge replaced with 8×8px colored dot (`bg-violet-600` admin, `bg-teal-600` teacher, `bg-amber-500` student, `bg-border` fallback) + `title` tooltip. Resource column — shows `resource_type` only, UUID fragment removed. Legend added between filter card and table card: "Actor role: ● Admin ● Teacher ● Student". `truncateId` kept (still used in diff panel expanded row). | ✅ |
| Filter flicker fix (session 16) | **admin/teachers, admin/students, audit-log:** Changed loading guard from `{#if loading}` (replaces table with skeleton on every filter change) to `{#if loading && list.length === 0}` (skeleton only on first load). Added `class:opacity-50={loading} class:pointer-events-none={loading}` on the table wrapper so subsequent loads dim the existing rows instead of replacing them. Pattern: show skeletons when the list is genuinely empty; overlay when refreshing. | ✅ |
| Courses SSR initial load (session 16) | `src/routes/courses/+page.server.ts` now fetches `GET /courses?page=1&limit=12` server-side and returns `{ courses, totalPages }`. `+page.svelte` initializes `courses` and `totalPages` from `data` (SSR props), sets `loading = false` initially, removes the `onMount` call to `fetchCourses()`, and removes the `$effect` that watched filters (replaced with explicit `onchange` handlers on each filter `<select>`). Result: courses page renders with data on first load — no loading spinner on initial visit. Subsequent filter/page changes still use CSR fetch with opacity overlay. | ✅ |
| Deployment guide update (session 16) | `docs/deployment-guide.md` updated to match actual VPS state from backend deployment: references `mutawazin` non-root user (not `root`), deploy directory is `/home/mutawazin/mutawazin-web` (not `/root/mutawazin-web`), reuses existing `github_deploy` SSH keypair (already on VPS from backend CI setup) instead of generating a new key. | ✅ |
| Delta v12 — dashboard report titles (session 17) | `GET /dashboard/teacher` now returns `subject_name: string\|null`, `student_name: string\|null`, `session_date: string\|null` on each `recent_reports` item. Added `DashboardReportItem` type to `src/lib/api.ts`. Dashboard report cards now show `"{subject_name} — {student_name}"` + `formatDate(session_date ?? created_at)` instead of raw IDs. | ✅ |
| Write Report flow — `/reports/new` (session 17) | New dedicated page replacing broken "Write Report" quick action (was `href=/dashboard#private-students`, now `/reports/new`). Three-step state machine on one URL: (1) session list — `GET /calendar/me` last 30 days, filtered to `starts_at <= now`, sorted newest first; (2) student picker — private session uses `session.student_id`, group session fetches `GET /courses/:course_id` → `enrolled_student_ids`; (3) report form — scores, notes, understanding level A–E, submits to `POST /sessions/:id/reports`. Auth guard: teacher-only. Layout: `src/routes/reports/new/+layout.svelte` (own AuthLayout wrapper, separate from `[studentId]` layout). | ✅ |
| API gap analysis (session 18) | Read full `api-types.ts` contract, compared against all frontend API calls. Key finding: approve/reject for teachers/students IS implemented on `/admin` overview page (not `/admin/teachers`). Documented 5 remaining gaps in `docs/api-gap-analysis.md`: `POST /auth/resend-verification`, `PUT /teachers/me/credentials`, `PUT /courses/{id}` (teacher non-admin edit), plus 3 unconsumed read endpoints (`GET /sessions/{id}`, `GET /sessions/{id}/rating`, `GET /reports/{id}`). | ✅ |
| Reports page UI polish (session 18) | `src/routes/reports/[studentId]/+page.svelte` — card title now shows `subject_name — teacher_name` (e.g. "Matematika — Ahmad Fauzi") instead of `session_title`. Removed `avgScore()` function and average score text from subtitle — subtitle is date only. Score tiles show raw score number only — no `/ max_score`, no progress bar (max score varies per topic, making comparison misleading). Scores section already conditionally hidden when `scores: []`. | ✅ |
| Favicon (session 18) | Added `<link rel="icon">` tags to `src/app.html` — SVG primary (`/brand-kit/svg/favicon.svg`) + PNG fallbacks (32×32, 16×16) from existing brand kit. No files copied — links point to existing `static/brand-kit/` assets. | ✅ |
| Default language ID (session 18) | Changed `DEFAULT_LANG` from `'en'` to `'id'` in `src/lib/i18n.ts`. Bahasa Indonesia is now the default for new visitors. Users with a stored `lang` preference in localStorage/cookie are unaffected. | ✅ |
| Teacher registration — phone replaces credentials (session 20) | `src/routes/register/teacher/+page.svelte` — credentials collapsible removed entirely; phone number `<input type="tel">` added after Bio. Label uses `profile.phoneNumber` i18n key (no "(optional)" text). Submit payload: `phone_number: phoneNumber \|\| null`. 7 credential i18n keys removed from `en.json` + `id.json`. 3 commits pushed to `origin/main`. Backend delta v14 needed: add `phone_number: str \| None = None` to `TeacherRegisterRequest`. | ✅ (frontend done; backend delta v14 pending) |
| Session display_title — remove title/student_id (session 21) | All `session.title` references replaced with `session.display_title` across admin calendar, teacher calendar, dashboard, and reports/new page. Teacher calendar recurring modal now always shows course select (no conditional student vs. course). Admin calendar recurring modal: same change. Dashboard subtitle lines (student_count, student_name, teacher_name) removed. Backend: `display_title` is computed async from `course → subject + enrolled student profiles` via `_compute_display_title()`. | ✅ |
| Price — admin only (session 21) | Teacher calendar: price inputs removed from Add Session modal and Recurring modal entirely. Backend silently ignores price from teacher callers on sessions, recurring templates, and courses (stored as null / {}). Admin can still set price via their own calendar/course pages. | ✅ |
| Admin delete session — admin calendar (session 21) | Admin calendar edit modal has a "Delete" button with two-step confirm: "Delete" (ghost) → "Permanently delete?" → "Delete" (danger). Calls `DELETE /sessions/:id`. On success: removes session from local state, closes modal. Backend: `DELETE /sessions/{session_id}` admin-only route; 409 if any Report references the session; hard delete + audit logged. | ✅ |
| Photo upload 422 fix + `assetUrl` helper (session 22) | `api.ts` — `request()` was injecting `Content-Type: application/json` for ALL non-GET bodies including FormData, causing 422 on photo upload. Fixed: skip header when `options.body instanceof FormData`. `assetUrl(path)` helper added to `api.ts` — prefixes relative `/uploads/…` paths with `VITE_API_URL`; pass-through for absolute URLs or nullish values. | ✅ |
| Session display fixes (session 25) | `formatSessionWindow(starts_at, ends_at, locale)` added to `date.ts`; teacher calendar session modal "When" field now shows `"09:05 – 10:00 · Monday, Jun 9, 2026"` (locale-aware). `eStudentIds = [...(session.student_ids ?? [])]` spread in admin `openSession` for reactivity. `StudentPicker` gains `max?: number` prop — private sessions auto-limit to 1 student; switching type private truncates excess. All pushed to `origin/main`. | ✅ |
| Admin calendar student picker fix (session 25) | Root cause was `CalendarSessionItem` schema (backend) missing `student_ids` + `recurring_template_id` — FastAPI silently stripped both from `/calendar/admin` responses. Edit modal now correctly populates `eStudentIds` from the session, showing student chips in `StudentPicker`. Recurring `↻` badge now appears on calendar pills. Backend fix: `app/calendar/schemas.py`. | ✅ |
| Admin calendar — recurring session delete scope (session 26) | Edit modal shows two choices when `selectedSession.recurring_template_id` is set: "This session only" (calls `DELETE /sessions/:id`) and "This + all future" (calls `DELETE /sessions/:id?delete_future=true`). Non-recurring sessions keep the original single confirm. Backend delta v17. | ✅ |
| Landing page — courses-only search (session 26) | Removed Teachers tab from search section. `searchTab`/`teacherResults` state removed, `runSearch()` simplified to courses-only `GET /search/courses`. Tab switcher UI and teacher results branch removed. | ✅ |
| Landing page — featured teachers always render (session 26) | Section always renders (removed outer `{#if}` hard-hide). Max 3 cards (`data.featuredTeachers.slice(0, 3)`). Added `{:else}` empty state with `$t('landing.teachersEmpty')`. Added `landing.teachersEmpty` i18n key to EN + ID. | ✅ |
| Teacher profile — public layout fix (session 26) | `src/routes/teachers/[id]/+layout.svelte` always uses public layout (Navbar + `max-w-profile` main, no sidebar) regardless of auth state. `data.user` is still available to `+page.svelte` via root layout data merging — `isOwn` and `isAdmin` derived values still work. | ✅ |
| Dashboard — session time format (session 26) | `{session.starts_at}` raw ISO replaced with `formatSessionWindow(session.starts_at, session.ends_at)` in both teacher and student upcoming sessions. Output: `"09:05 – 10:00 · Monday, Jun 10, 2026"`. | ✅ |
| Dashboard — My Students fix (session 26) | Private Students card removed; Recent Reports promoted to full-width (2-col grid wrapper removed). My Students section: heading uses `$t('dashboard.teacher.myStudents')`, empty state uses `noMyStudents` key, added `studentsError` state for API failures. i18n keys `myStudents`/`noMyStudents`/`studentsError` added to EN + ID. | ✅ |
| Photo crop modal — teacher + student profiles (session 22) | `PhotoCropModal.svelte` — cropperjs v1.6.2 (v2 has incompatible API — must stay on v1). Circular crop via `.cropper-view-box` + `.cropper-face` `border-radius: 50%` CSS. Drag-to-reposition, zoom slider. Teacher + student `[id]/+page.svelte`: camera button → `URL.createObjectURL` → open modal → confirm → `POST /teachers/me/photo` or `/students/me/photo` → `photoUrlOverride $state` updates avatar in place without reload. 5 commits local; not yet pushed to `origin/main`. | ✅ |
| Session `student_ids` — admin multi-select + reports/new fix (session 23) | `src/routes/admin/calendar/+page.svelte` — Add Session and Edit Session modals both include a `<select multiple>` student picker; `student_ids: string[]` sent in both `POST /sessions` and `PUT /sessions/:id` payloads. State: `sStudentIds`/`eStudentIds`; `onchange` reads `HTMLSelectElement.selectedOptions` array. `src/routes/reports/new/+page.svelte` — student resolution simplified: reads `session.student_ids` directly for all session types (private and group); course fetch removed. Backend delta v16. | ✅ |
| 204 No Content fix (session 24) | `src/lib/api.ts` — `request()` now returns `undefined as T` when `res.status === 204`, skipping the `.json()` call. Fixes "Unexpected end of JSON input" crash on course delete and any other endpoint returning 204 with empty body. | ✅ |
| Availability calendar fixes (session 24) | `src/routes/calendar/+page.svelte` — (1) `fetchAvailability` was calling `GET /availability` with no path param (silently 404ing); fixed to `GET /availability/${teacherId}`. (2) `hasAvailability` was using `!a.specific_date` for weekly slots, which highlighted every day on the calendar; fixed to `a.specific_date ? a.specific_date === key : a.day_of_week === date.getUTCDay()`. Teachers and admins can now see their availability slots highlighted on the calendar. | ✅ |
| Delta v13 — phone number (session 19) | Optional private `phone_number: string\|null` field added to teacher and student profiles. **Teacher profile:** new Phone Number card after Achievements (same per-section pencil pattern — `editingPhoneNumber`/`savingPhoneNumber`/`savePhoneNumber()`/`openSection('phoneNumber')`). Visible to `isOwn \|\| isAdmin`. Added `isAdmin = $derived(data.user?.role === 'admin')` to teacher profile. **Student profile:** inline phone row after DOB (same inline-edit pattern as DOB). Owner always sees field + pencil; admin sees field only when non-null; teacher callers see nothing (API returns null). Cross-cancel with DOB edit. **Types:** `TeacherProfileResponse`, `UpdateTeacherProfileRequest`, `StudentProfileResponse`, `UpdateStudentProfileRequest` added to `src/lib/api.ts`. **i18n:** `profile.phoneNumber` + `profile.phoneNumberPlaceholder` added to `en.json` + `id.json`. 4 commits on `main`, not yet pushed. | ✅ (code done; live verify pending) |

### What is NOT done yet (known gaps)

1. **Admin Courses — student enrollment management** — enroll/unenroll students per course (`POST /courses/:id/enroll`, `DELETE /courses/:id/enroll/:student_id`). Deferred to follow-up; the page exists but has no student management UI yet.

2. **Runtime verification** — admin calendar, session edit, teacher profile redesign, navbar avatar fetch, course detail page, and all previous delta features not yet tested against live backend.

3. **Availability slot `id` field** — not yet tested live. If edit/delete fail, fix `{@const slotId = slot.id ?? slot.slot_id ?? ''}` in `src/routes/calendar/+page.svelte`.

4. **Mobile testing** — hamburger sidebar untested at 375px viewport.

5. **Teacher profile — live verify** — redesign + chips row edit not yet tested against live backend. Confirm `GET /teachers/:user_id` returns `courses[]` with `name`, `age_categories`, `description`, and that `PUT /teachers/me` accepts per-section payloads (bio, university, experience, achievements, teaching_mode, city).

6. **Admin calendar — recurring student picker** — the recurring modal for private sessions uses a plain text input for student ID (not a dropdown). When backend student list is confirmed available, replace with a `<select>` from `adminStudents`.

7. **Course detail page — live verify** — not yet tested against live backend. Confirm `GET /courses/:id` returns the expected shape (especially `enrolled_student_ids[]` and `price_by_age_category`). Verify the 404 error page renders correctly for unknown course IDs.

8. **Teacher profile stats — verify live (delta v9 shipped)** — Backend now returns `years_experience` and `sessions_completed`. Frontend at `src/routes/teachers/[id]/+page.svelte` already reads `profile.years_experience ?? 0` and `profile.sessions_completed ?? 0`. Just verify the numbers show correctly in production.

9. **Admin students age column — one-line fix needed (delta v9 shipped)** — Backend now returns `age: int | null` on `GET /admin/students`. Replace the IIFE formula at `admin/students/+page.svelte` Age column with `user.age != null ? String(user.age) : '—'`. Student profile DOB edit is already wired up — just verify live.

10. **Courses SSR — verify `access_token` cookie forwarding** — `+page.server.ts` manually forwards the `access_token` cookie header to the API. Live-verify that the SSR fetch actually returns data (not 401). If the backend requires a Bearer token instead of cookie, change header to `Authorization: Bearer ${token}`. Also verify filter changes after SSR load still work (CSR refetch path).

11. **Delta v13 phone number — live verify** — Log in as teacher (own profile): Phone Number card appears, pencil opens `<input type="tel">`, save calls `PUT /teachers/me { phone_number }`, value persists. Log in as admin: card visible on any teacher/student profile with no pencil. Log in as another teacher: card NOT visible on peer profiles. Log in as student (own profile): phone row appears, pencil opens inline edit, DOB edit closes phone and vice versa. Push the 4 delta v13 commits to GitHub remote: `git push origin main`.

---

## Architecture Decisions (already made — don't change these)

| Decision | What it is |
|---|---|
| **Svelte 5 runes mode** | Enforced by `svelte.config.js`. Use `$props()`, `$state()`, `$derived()`, `$effect()`, `{@render children()}`. No `export let`, no `<slot>`. |
| **svelte-i18n** | Cookie-based lang (no URL prefix changes). `$t('key')` everywhere. EN/ID toggle in Navbar. |
| **Tailwind v3** (not v4) | v4 was installed by default and downgraded. Config is in `tailwind.config.js`. |
| **Sub-layouts per route group** | Each authenticated route group has its own `+layout.svelte` wrapping `<AuthLayout>`. |
| **CSR for feature pages** | Courses/Calendar/Reports load data in `onMount`, not SSR. Auth guard in `+page.server.ts` only. |
| **focusTrap action** | `src/lib/actions/focusTrap.ts` — shared by Modal and mobile Sidebar. |
| **Static gradient lookup** | Course band variants use a 6-element `BAND_VARIANTS` array with full static Tailwind arbitrary-value strings. Tailwind purge requires static strings. |
| **hooks.server.ts populates locals.user** | Auth context lives in `src/hooks.server.ts`. All `+page.server.ts` guards check `locals.user` set by the hook — NOT by `+layout.server.ts`. Do not remove the hook or move this logic. |
| **adapter-node (not adapter-auto)** | Switched from `@sveltejs/adapter-auto` to `@sveltejs/adapter-node` for Docker deployment. Build output lands in `build/`, entry point is `build/index.js`, default port 3000. VPS `.env` must contain `ORIGIN=https://mutawazinprivate.com` for CSRF protection. |
| **Subjects = name only** | `Subject` model has only `{ id, name, status }` — no subject field or age_categories. Age categories live on `Course` directly. `/catalog` endpoints renamed to `/subjects`. |
| **5-level age categories** | Values: `"pre-school"`, `"elementary"`, `"middle-school"`, `"high-school"`, `"general"`. Old `"kids"/"teens"/"adults"` are gone. |
| **pendingApprovalCount store** | `src/lib/stores/adminBadge.ts` — currently unused after admin restructure (sidebar badge removed). Store still exists but is no longer written to. |
| **Admin sub-layouts are pass-through** | `/admin/teachers`, `/admin/students`, `/admin/subjects` each have `+layout.svelte` files that are simple `{@render children()}` pass-throughs — no `<AuthLayout>` wrapper. The parent `/admin/+layout.svelte` already provides `<AuthLayout>`. Adding `<AuthLayout>` in a child layout causes double-wrapping (two sidebars, double `ml-60` offset). |
| **Public pages always use public layout** | Pages under `teachers/[id]/` are public — their `+layout.svelte` always renders `<Navbar>` + `max-w-profile` main, never `<AuthLayout>`. `data.user` is still available in `+page.svelte` via root layout data merging (for `isOwn`/`isAdmin` derived values). Do NOT branch on `data.user` to conditionally render `<AuthLayout>` on public pages — it causes the admin sidebar to appear for authenticated visitors. |
| **Sidebar userId prop chain** | `userId` flows: sub-layout `data.user?.id` → `<AuthLayout userId>` → `<Sidebar userId>`. Required for My Profile and My Reports hrefs. All authenticated sub-layouts pass it. |
| **AuthLayout content centering** | `<main>` has `flex-1 sidebar-collapse:ml-60 p-6 lg:p-8`. The `max-w-app mx-auto` is on an inner `<div>` wrapping `{@render children()}`, NOT on `<main>` itself. This centers content within the post-sidebar space on wide viewports. Do not move `max-w-app mx-auto` back to `<main>`. |
| **DropdownMenu component** | `src/lib/components/ui/DropdownMenu.svelte` — shared three-dot action dropdown. Props: `items: { label, onclick, variant? }[]`. Handles open/close via `onfocusout` on a `tabindex="-1"` wrapper and Escape key. Used on all three admin table pages. |
| **Admin action pattern** | All admin table rows use `<DropdownMenu>` for actions (View Profile, Delete, Feature/Edit). Delete and Featured actions open confirmation modals before executing. All modals use the existing `<Modal>` component with inline state per page. |
| **Age from DOB pattern** | **Replaced by backend-computed `age: int` field.** `students/[id]/+page.svelte` already reads `profile.age` directly (formula removed). Formula still in `admin/students/+page.svelte` — replace with `user.age != null ? String(user.age) : '—'` once backend ships delta v9 (`age` field on admin students list). |
| **DropdownMenu fixed positioning** | `DropdownMenu.svelte` panel uses `position: fixed` with `getBoundingClientRect()` on the trigger button to compute `top` and `right`. This escapes `overflow-x-auto` table containers — do NOT revert to `absolute`. |
| **Admin table header alignment** | All `<th>` in admin tables use `text-left`, including the Actions column. The `<td>` for the actions column keeps `text-right` so the `⋮` button stays right-aligned, but the header label is left-aligned. |
| **Admin courses page pattern** | `/admin/courses` loads courses + teachers + subjects in parallel on mount. `teacherMap` (teacher_id → full_name) is built from the teacher list for display. Price per age category is stored as `Record<string, string>` in state (for input binding) and converted to `Record<string, number>` on submit. |
| **Teacher profile per-section edit pattern** | `src/routes/teachers/[id]/+page.svelte` has one `editing*` / `saving*` / save-function triple per editable section (bio, university, experience, achievements). `openSection(name)` sets the named section to `true` and all others to `false` — enforces mutual exclusion so only one section is editable at a time. Camera overlay on avatar is always shown to `isOwn` (no editMode toggle). |
| **Teacher profile data display** | API data is adapted to the design: `university: string` shown as a single name row; `teaching_experience: [{subject, year_from, year_to}]` shown as subject + year range; `achievements: string[]` shown as plain string rows. Sections are hidden on public view when empty; on own view they show "Not set" with a pencil button. `teaching_mode` and `city` shown as SVG-icon chips below a `<hr>` in the profile header card. **`teaching_methods[]` chips are removed** — not in the current handoff. |
| **Teacher profile chips row** | Globe SVG = teaching_mode (online/offline/both). Offline-only → globe gets `opacity-50` class. Map-pin SVG = city. Both chips use `stroke="currentColor"` inline SVG. When `isOwn`, a pencil button opens inline edit: `<select>` for mode + `<input>` for city, saves via `PUT /teachers/me`. Follows the same `editingTeachingInfo` / `savingTeachingInfo` / `openSection('teachingInfo')` pattern as other sections. |
| **ErrorState component** | `src/lib/components/ErrorState.svelte` — Svelte 5 `$props()` with snippet props: `icon?`, `actions?`, `extra?`. Props: `tone` (blue/teal/amber/rose/slate), `code`, `title`, `body`, `noTile`. Used exclusively by `src/routes/+error.svelte`. Static nginx error pages (`static/errors/502.html`, `503.html`, `504.html`) are pure HTML/CSS/inline SVG — no JS, no external fonts, text in Bahasa Indonesia. |
| **Admin calendar pattern** | `src/routes/admin/calendar/+page.svelte` — CSR, loads in `onMount`. Fetches sessions via `GET /calendar/admin?from=&to=&teacher_id=`. Teacher list from `GET /admin/teachers` (use `teacher.user_id ?? teacher.id` as ID). Courses from `GET /courses`. Students from `GET /admin/students`. Session edit uses `PUT /sessions/:id`. Session create requires `teacher_id` in body. Recurring endpoints now accept `teacher_id` query (GET) and body field (POST) per delta v7. |
| **Admin calendar teacher ID field** | Teachers from `GET /admin/teachers` expose both `user_id` and `id` — always use `teacher.user_id ?? teacher.id` as the key (same as admin/courses page). The `teacher_id` on sessions matches this value. |
| **Session edit (admin)** | `PUT /sessions/:id` — admin can edit starts_at, ends_at, mode, price, teacher_id, student_ids (list), course_id. Teacher role can only edit time/mode/price (teacher_id/student_ids/course_id ignored). Endpoint added in delta v6; student_ids added in delta v16. |
| **Navbar profile fetch pattern** | `Navbar.svelte` fetches the logged-in user's own profile on `onMount` (teacher → `GET /teachers/:id`, student → `GET /students/:id`). Stores `profileName` + `profileSrc` in local `$state`. Admin gets no avatar. Teacher/student Avatar is wrapped in `<a>` linking to their profile page. No changes to `hooks.server.ts`, `app.d.ts`, or the `User` store type — JWT only carries `{ id, role, status }`. |
| **Course detail page pattern** | `src/routes/courses/[id]/+page.server.ts` — SSR load: auth guard + `GET /courses/:id` + `throw error(404)` if not found, returns `{ course, user: locals.user }`. Parent `src/routes/courses/+layout.svelte` provides `<AuthLayout>` — no new layout needed. Page uses `AGE_KEYS` map to translate API age-category strings to existing `courses.age*` i18n keys. Price formatted with `Intl.NumberFormat('id-ID', { currency: 'IDR' })`. Student self-enrollment is NOT allowed — enrollment is admin-only via `/admin/courses`. |
| **PaginatedResponse pattern** | All list endpoints return `{ data: T[]; pagination: { page, pageSize, totalItems, totalPages } }`. Types `PaginationMeta` and `PaginatedResponse<T>` are in `src/lib/api.ts`. CSR pages: `api.get<PaginatedResponse<T>>(url)` → destructure `data` + `pagination`. Server-side `+page.server.ts` uses native `fetch` → chain `.then((b: any) => b.data ?? [])` to unwrap. Never use the old plain-array shape. |
| **Pagination component** | `src/lib/components/ui/Pagination.svelte` — props: `page: number`, `totalPages: number`, `onPage: (n: number) => void`. Renders nothing when `totalPages <= 1`. Placed inside the table `<Card>` after the `<table>`, before `</Card>`. Caller manages `page` state and passes a `changePage(n)` handler that sets `page = n` and refetches. Category A pages (primary list content) get the full UI. Category B pages (sub-calls for pickers/dropdowns) just unwrap `.data` — no pagination UI needed. |
| **Server-side filter pattern (paginated)** | Admin pages with status filters (teachers, students) pass the filter as a query param to the API (`?status=active`) instead of doing client-side array filtering. `onchange` on the select resets `page = 1` then calls the fetch function. The old `filteredTeachers` / `filteredStudents` `$derived` values were removed — they are incompatible with server-side pagination. |
| **Flicker-free loading pattern** | All list pages use a two-state loading display: (1) `{#if loading && list.length === 0}` → show skeleton rows or spinner only on first/empty load; (2) `class:opacity-50={loading} class:pointer-events-none={loading}` on the table/grid wrapper → dim existing content during filter/page refreshes. Never unconditionally replace the table with a skeleton on every fetch — that causes visible flicker. Applied to: admin/teachers, admin/students, audit-log, courses. |
| **Courses SSR initial load pattern** | `src/routes/courses/+page.server.ts` fetches the first page SSR and returns `{ courses, totalPages }`. `+page.svelte` initializes state from `data` (no `onMount` fetch). Filter `<select>` elements use explicit `onchange` handlers (`() => { page = 1; scheduleRefetch(); }`) instead of a reactive `$effect` watching filter vars — `$effect` caused double-fetches on mount. Never use `$effect` to trigger side-effects on filter state changes. |
| **StudentPicker component** | `src/lib/components/ui/StudentPicker.svelte` — search-and-chip multi-select for students. Props: `students: {id, full_name, username}[]`, `value: string[] = $bindable([])`, `max?: number`. `filtered` excludes already-selected IDs. `selected` maps IDs to student objects with fallback `{id, full_name: null, username: id}` if not found in the list. `max` hides the search input and shows "Private session — 1 student only" when at limit. Used in admin calendar Add Session and Edit Session modals. Always pass the full `adminStudents` list (only first 20 loaded — fallback renders UUID chips for students on page 2+; acceptable tradeoff). |
| **`/reports/new` page pattern** | `src/routes/reports/new/` — teacher-only write-report flow. Has its own `+layout.svelte` (AuthLayout wrapper) because the parent `reports/[studentId]/+layout.svelte` is scoped to that route only. Three-step state machine: `step: 'sessions' \| 'students' \| 'form'`. On mount fetches `GET /calendar/me?from=<30d ago>&to=<today>` + `GET /students` in parallel. Session filter: `starts_at <= now` (not `status === 'completed'` — teacher may finish early). Student resolution: all sessions (private and group) use `session.student_ids` directly — resolved against `studentMap` from `GET /students`; no course fetch. Submit: `POST /sessions/:id/reports { student_id, scores, notes, understanding_level? }`. Success shows inline banner + "Write another" resets to step 1. |

---

## Key File Locations

```
mutawazin-tutor-web/          ← repo root = GitHub repo
├── tailwind.config.js
├── src/
│   ├── app.html
│   ├── app.css
│   ├── app.d.ts
│   ├── hooks.server.ts             ← ⚠️ Sets locals.user from JWT cookie on EVERY request
│   ├── lib/
│   │   ├── api.ts
│   │   ├── i18n.ts
│   │   ├── actions/focusTrap.ts
│   │   ├── stores/auth.ts          ← writable<User | null>
│   │   ├── stores/sidebar.ts       ← writable<boolean> sidebarOpen
│   │   ├── stores/adminBadge.ts    ← writable<number> pendingApprovalCount
│   │   ├── utils/avatar.ts, date.ts, cn.ts
│   │   ├── components/ui/          ← Badge, Avatar, Button, Card, Input, Modal, DropdownMenu, Pagination, StudentPicker
│   │   ├── components/ErrorState.svelte  ← full-page error state (tone variants, snippet props)
│   │   └── components/layout/      ← Logo, Navbar, Sidebar, AuthLayout
│   ├── locales/en.json, id.json
│   └── routes/
│       ├── +page.svelte            ← Landing (public search + featured teachers)
│       ├── login/, forgot-password/, reset-password/
│       ├── register/teacher/, register/student/
│       ├── verify-email/, account/step-up/
│       ├── dashboard/              ← Role-aware (teacher/student; admin → /admin)
│       ├── admin/                  ← Overview: stats + pending approvals only
│       ├── admin/teachers/         ← All non-pending teachers + three-dot menu + featured confirm + create
│       ├── admin/students/         ← All non-pending students + three-dot menu + age from DOB + create
│       ├── admin/subjects/         ← Verified subjects + three-dot menu + edit + create
│       ├── admin/courses/          ← Full course CRUD (list, create, edit, delete) — delta v5
│       ├── admin/calendar/         ← Admin calendar (all teachers view + teacher filter) — delta v6/v7
│       ├── teachers/             ← Public featured teachers directory (GET /teachers/featured)
│       ├── teachers/[id]/
│       ├── students/[id]/
│       ├── courses/
│       ├── courses/[id]/               ← Course detail page (server load + Svelte page)
│       ├── calendar/
│       ├── reports/new/                ← Write report flow (teacher-only, 3-step: session→student→form)
│       ├── reports/[studentId]/
│       └── report/share/[token]/   ← Public report share page (no auth)
├── Dockerfile                      ← node:22-alpine runtime image (receives pre-built artifacts from CI)
├── docker-compose.yml              ← frontend service on port 3000, env_file: .env
├── .dockerignore
├── .github/workflows/deploy.yml.disabled  ← CI/CD pipeline (rename to .yml to activate)
├── static/brand-kit/               ← All brand assets served statically
├── static/errors/                  ← nginx static error pages (502/503/504) in Bahasa Indonesia
└── docs/
    ├── content-audit.csv           ← Dead links / fake data audit with decisions
    ├── deployment-guide.md         ← Step-by-step VPS deployment guide (SSH key, secrets, Nginx, first deploy)
    └── superpowers/specs/ + plans/ ← Implementation specs and plans
```

---

## API Contract

Updated API contract is at `D:\Codading Repo\mutawazin-tutor-api\docs\api-contract\api-types.ts`.

Key endpoints active as of 2026-05-24:
- Auth: login, register, verify-email, refresh, logout, forgot-password, reset-password, step-up
- **Availability checks (public):** `GET /auth/check/email?email=<val>` → `{ available: boolean }`, `GET /auth/check/username?username=<val>` → `{ available: boolean }`
- Subjects: `GET /subjects`, `POST /subjects/suggest`, admin CRUD at `/admin/subjects`
- **Admin subjects:** `PUT /admin/subjects/:id { name }` (edit name), `DELETE /admin/subjects/:id`
- Courses: `POST /courses { subject_id, age_categories, description? }`
- Sessions: `POST /sessions { ..., teacher_id? (admin required) }`, `PATCH /sessions/:id/status { status }`, ratings at `/sessions/:id/rating`
- **Session edit (delta v6):** `PUT /sessions/:id { starts_at?, ends_at?, mode?, price?, teacher_id? (admin), student_ids?: string[] (admin), course_id? (admin) }`
- Reports: `POST /reports/:id/share`, public `GET /reports/share/:token`
- Recurring: `GET /sessions/recurring?teacher_id=<id>` (admin — required), `POST/PUT/DELETE /sessions/recurring` (POST body requires `teacher_id` for admin) — delta v7
- Search (public, no auth): `GET /search/courses`, `GET /search/teachers`
- Ratings: `POST /sessions/:id/rating`, `GET /sessions/:id/rating`
- Teachers (public, no auth): `GET /teachers/featured`, `GET /teachers/:user_id`
- Students: `GET /students` (teacher auth — returns assigned students list)
- Admin teachers: `PATCH /admin/teachers/:id/featured`, `DELETE /admin/teachers/:id`
- Admin students: `DELETE /admin/students/:id`
- **Admin calendar (delta v6):** `GET /calendar/admin?from=&to=&teacher_id=` (admin only)
- **Admin courses (delta v5):** `POST /admin/courses`, `PUT /admin/courses/:id`, `DELETE /admin/courses/:id`
- **Course enrollment:** `POST /courses/:id/enroll { student_id }`, `DELETE /courses/:id/enroll/:student_id` (admin only)
- **Course detail (delta v8):** `GET /courses/:id` — any authenticated role, returns `{ id, teacher_id, subject_id, name, subject_status, age_categories, price_by_age_category, description, status, enrolled_student_ids[] }`. Returns 404 if not found.
- **Admin stats (delta v8):** `GET /admin/stats` returns `{ total_teachers, total_students, active_courses }` — `active_courses` is count of courses with status === "active".
- Availability: `POST /availability`, `PUT /availability/:slot_id`, `DELETE /availability/:slot_id`
- **Delta v12 (2026-05-30):** `GET /dashboard/teacher` → `recent_reports` items now include `subject_name: string|null`, `student_name: string|null`, `session_date: string|null` (YYYY-MM-DD). Non-breaking additive change. `DashboardReportItem` type added to `src/lib/api.ts`.
- **Delta v13 (2026-06-06):** `GET /teachers/:user_id`, `PUT /teachers/me`, `GET /students/:id`, `GET /students/me`, `PUT /students/me` — all now include `phone_number: string|null`. Field is private: only returned for owner or admin callers; `null` for all others. Non-breaking additive change. Types `TeacherProfileResponse`, `UpdateTeacherProfileRequest`, `StudentProfileResponse`, `UpdateStudentProfileRequest` added to `src/lib/api.ts`.
- **Delta v14 (pending — 2026-06-07):** `POST /auth/register/teacher` — add `phone_number: str | None = None` to `TeacherRegisterRequest` and save it on the teacher record at creation. Non-breaking additive change. Backend prompt is in `docs/superpowers/plans/2026-06-07-teacher-register-phone-replace-credentials.md` (Task 3).
- **Delta v15 (2026-06-08):** Sessions now return `display_title: str` (computed from course subject + enrolled student names) instead of `title`. `student_id` removed from session shape. Dashboard `DashboardSessionItem` now has `display_title` (not `title`) and `course_id` (required, not `student_id`). `DELETE /sessions/{session_id}` — new admin-only endpoint; 409 if any Report references the session.
- **Delta v16 (2026-06-08):** Sessions now have `student_ids: string[]` — admin-assigned list of students per session. `POST /sessions` and `PUT /sessions/:id` both accept `student_ids` (admin only; silently stored as `[]` for teacher callers). Student calendar and dashboard now resolve sessions via `session.student_ids` membership, not course enrollment. `DELETE /sessions/{session_id}` — 409 guard changed from Report-based to `student_ids` non-empty. `GET /calendar/me` and `GET /calendar/admin` session shapes now include `student_ids: string[]`. `_compute_display_title(session)` reads `session.student_ids` to build names.
- **Delta v17 (2026-06-10):** `DELETE /sessions/{session_id}?delete_future=false` — added `delete_future` boolean query param (default `false`). When `true` and the session has a `recurring_template_id`: cascades to delete all future sessions for that template (`starts_at >= today`, `status == "scheduled"`) and sets `template.is_active = False`. The session itself is always deleted. Frontend admin calendar shows "This session only" / "This + all future" choice for recurring sessions.
- **Delta v9 (✅ backend shipped):**
  - `GET /teachers/:user_id` now returns `years_experience: int` and `sessions_completed: int`
  - `GET /admin/students` now returns `age: int | null` per student
  - `GET /students/:id` now returns `age: int | null`, keeps `date_of_birth`
  - **Frontend action needed:** Admin students Age column still uses IIFE formula — replace with `user.age != null ? String(user.age) : '—'` at `admin/students/+page.svelte`. All other frontend is already wired up.

---

## Design Reference

All visual specs are in `handoffs/design_handoff_mutawazin/` (local only, gitignored):
- `original-handoff.md` / `README.md` — design tokens, component specs
- HTML stage files — open in browser to see intended output

**Design tokens are in `tailwind.config.js`** — always use Tailwind classes, never inline hex values.

---

## How to Run

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npm run dev           # dev server at http://localhost:5173
npm run check         # TypeScript + Svelte type check (0 errors)
npm run build         # production build
npm run preview       # preview prod build at http://localhost:4173
```

The FastAPI backend must be running at `http://localhost:8000`.

**Test credentials:** `admin@mutawazin.com` / `changeme123` → lands on `/admin`

---

## What to Do Next Session

**Priority 1 — Live verify session 25 + 26 fixes**
1. Admin calendar: Add Session with StudentPicker — type a student name, select, save → session shows student name in calendar pill
2. Admin calendar: Edit Session for a session with students → StudentPicker shows student chips; remove a student → save → chips update
3. Admin calendar: private session → StudentPicker limits to 1 student
4. Admin calendar: session with students → Delete → 409 shown; remove student chip → save → Delete succeeds
5. Admin calendar: recurring sessions show `↻` badge on calendar pills
6. Admin calendar: delete a recurring session → "Delete recurring session?" prompt → "This session only" deletes one; "This + all future" cascades
7. Teacher calendar: session modal "When" field shows `"09:05 – 10:00 · Monday, Jun 9, 2026"` (not raw ISO)
8. Dashboard (teacher): sessions show `display_title` and formatted time (not raw ISO)
9. Dashboard (teacher): My Students section loads students from `GET /students`; error state shows if fetch fails
10. Landing page: search shows courses only (no teacher tab); featured teachers section always renders
11. Teacher profile: log in as admin, visit `/teachers/:id` → no sidebar (public layout)
12. **Availability calendar** — log in as teacher → `/calendar` → availability panel shows slots; calendar highlights the correct days/dates

**Priority 2 — Live verify delta v13 profile phone numbers**
1. Log in as **teacher** (own profile `/teachers/:id`): Phone Number card appears after Achievements, pencil opens tel input, save persists value
2. Log in as **admin**: Phone Number card visible on teacher + student profiles (no pencil), shows value or "Belum diisi"
3. Log in as **another teacher**: view a peer's teacher profile → Phone Number card NOT visible
4. Log in as **student** (own profile): phone row appears below DOB, pencil opens inline edit, opening DOB closes phone and vice versa
5. Log in as **admin**, view student with no phone set → phone row hidden (only shows when non-null)

**Priority 3 — Live verify `/reports/new` + reports page changes (sessions 17–18)**
1. Log in as teacher → `/dashboard` → "Write Report" → confirm navigates to `/reports/new`
2. Session list: confirm past sessions appear sorted newest first; future sessions NOT shown
3. Click a private session → one student shown; group session → enrolled students shown
4. Click a student → report form → fill + submit → success banner → "Write another" resets to step 1
5. Back arrow: form → students → sessions
6. Open a student's report list (`/reports/:studentId`): confirm card titles show "Matematika — Ahmad Fauzi" format, no average score text, score tiles show raw number only (no bar, no / max)
7. Log in as student/admin → visit `/reports/new` → confirm redirect to `/dashboard`

**Priority 4 — First production deploy (VPS setup)**
Follow `docs/deployment-guide.md` step by step (references `mutawazin` user and existing `github_deploy` SSH keypair):
1. SSH in: `ssh mutawazin@YOUR_DROPLET_IP`
2. Create deploy dir: `mkdir -p /home/mutawazin/mutawazin-web && echo "ORIGIN=https://mutawazinprivate.com" > /home/mutawazin/mutawazin-web/.env`
3. Confirm existing SSH key: `ls ~/.ssh/github_deploy.pub` — reuse it (already authorized from backend CI)
4. Print private key and add to **this** GitHub repo's secrets: `cat ~/.ssh/github_deploy`
5. Add 5 GitHub secrets: `SSH_HOST`, `SSH_USER=mutawazin`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH=/home/mutawazin/mutawazin-web`, `VITE_API_URL=https://api.mutawazinprivate.com`
6. Configure Nginx on VPS to proxy `mutawazinprivate.com` → `localhost:3000` (SSL via Certbot)
7. Enable workflow: `git mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml && git commit -m "ci: enable deploy workflow" && git push origin main`
8. Watch Actions tab — should complete in ~2-3 min. Verify with `curl -I http://localhost:3000` on VPS.

**Priority 5 — Finish delta v9 (backend now shipped)**
1. **Admin students age column — one-line code fix** — Replace the IIFE formula at `admin/students/+page.svelte` Age column with `user.age != null ? String(user.age) : '—'`.
2. **Teacher profile stats — verify live** — Log in as teacher, open own profile. Confirm "X yrs experience · Y sessions completed" shows real numbers (not 0 · 0).
3. **Student DOB edit — live verify** — Log in as student, open own profile. Age badge shows a number, pencil opens date input, save calls `PUT /students/me { date_of_birth }`.

**Priority 6 — Live verify accumulated features**
1. **Admin dashboard** — `/admin`: "Active Courses" card shows non-zero count; pending teacher/student tables show Approve/Reject buttons; pending subject suggestions show Approve/Reject.
2. **Navbar avatar** — Teacher/student: avatar appears, clicking links to own profile. Admin: no avatar.
3. **Course detail page** — `/courses/:id`: loads without 404, shows teacher name + pricing grid, enrolled badge for students.
4. **Reports page** — teacher view: no attendance filter, card titles are "subject — teacher", score tiles raw number only, date from `created_at`.
5. **Public share page** — `/report/share/:token`: date and scores render correctly, no attendance badge.
6. **Admin calendar** — sessions load, teacher filter works, session edit modal saves via `PUT /sessions/:id`.
7. **Teacher profile** — per-section editing works, SVG icons render, chips row shows mode + city.
8. **Error page smoke test** — `/nonexistent` → 404 page with correct icon and buttons.

**Priority 7 — Known API gaps to implement (see `docs/api-gap-analysis.md`)**
- `POST /auth/resend-verification` — add resend button to `/verify-email` page
- `PUT /teachers/me/credentials` — wire credentials section save in teacher profile
- **Admin Courses — student enrollment management** — enroll/unenroll UI using `POST /courses/:id/enroll` + `DELETE /courses/:id/enroll/:student_id`

**Priority 8 — Runtime QA**
- Test delta v4: email check on register pages, username check on admin create modals, Delete on all three admin table pages
- Test Calendar Add Session end-to-end (`POST /sessions`, session appears on calendar)
- Test Availability CRUD (Add/Edit/Delete slots — verify `slot.id` field)
- Courses SSR: verify `access_token` cookie forwarding works (not 401 on SSR fetch)

**Priority 9 — Mobile + Visual QA**
- Open DevTools at 375px, test hamburger sidebar drawer, verify all pages are usable
