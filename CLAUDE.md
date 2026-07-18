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

## Current Status (as of 2026-07-18 — session 38)

### Build status: ✅ Passes `npm run check` (0 errors, 18 pre-existing warnings) and `npm run build` — confirmed after session 38 mobile/SEO pass

### GitHub remote: ⚠️ `https://github.com/lutfihp/mutawazin-tutor-web` — **27 local commits not yet pushed** (sessions 37 + 38: URL-based language routing, first-load glitch fix, self-hosted fonts, mobile pass, mobile calendar, SEO/OG/sitemap — through `69de3d0`). Do not push without explicit user instruction.

### Login flow: ✅ Confirmed working end-to-end with `admin@mutawazin.com` / `changeme123`. Dev QA accounts also exist: teacher `devteacher360` / `Teacher123!`, student `devstudent360` / `Student123!` (username auth, created via admin API session 38; the student is enrolled in a Matematika course with test sessions on 2026-07-18)

### Browser verification (session 38): ✅ Global Playwright 1.59 (`NODE_PATH=$(npm root -g)`) drives the dev server headless — all 28 routes verified at 360×740 for all three roles, calendars verified at 360 + 1280, throttled cold-load verified 0 spinner/blank frames and 0 external requests. Gotcha: wait ~1.5s after networkidle on /login before clicking submit (pre-hydration click native-submits the form as GET).

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
| Teacher profile — public layout fix (session 26, corrected session 27) | `src/routes/teachers/[id]/+layout.svelte` branches on role: `teacher`/`student` → `<AuthLayout>` (sidebar preserved); `admin` and unauthenticated → public layout (Navbar + `max-w-profile` main, no admin sidebar). `data.user` is still available to `+page.svelte` via root layout data merging — `isOwn` and `isAdmin` derived values still work. | ✅ |
| Dashboard — session time format (session 26) | `{session.starts_at}` raw ISO replaced with `formatSessionWindow(session.starts_at, session.ends_at)` in both teacher and student upcoming sessions. Output: `"09:05 – 10:00 · Monday, Jun 10, 2026"`. | ✅ |
| Dashboard — My Students fix (session 26) | Private Students card removed; Recent Reports promoted to full-width (2-col grid wrapper removed). My Students section: heading uses `$t('dashboard.teacher.myStudents')`, empty state uses `noMyStudents` key, added `studentsError` state for API failures. i18n keys `myStudents`/`noMyStudents`/`studentsError` added to EN + ID. | ✅ |
| Photo crop modal — teacher + student profiles (session 22) | `PhotoCropModal.svelte` — cropperjs v1.6.2 (v2 has incompatible API — must stay on v1). Circular crop via `.cropper-view-box` + `.cropper-face` `border-radius: 50%` CSS. Drag-to-reposition, zoom slider. Teacher + student `[id]/+page.svelte`: camera button → `URL.createObjectURL` → open modal → confirm → `POST /teachers/me/photo` or `/students/me/photo` → `photoUrlOverride $state` updates avatar in place without reload. 5 commits local; not yet pushed to `origin/main`. | ✅ |
| Session `student_ids` — admin multi-select + reports/new fix (session 23) | `src/routes/admin/calendar/+page.svelte` — Add Session and Edit Session modals both include a `<select multiple>` student picker; `student_ids: string[]` sent in both `POST /sessions` and `PUT /sessions/:id` payloads. State: `sStudentIds`/`eStudentIds`; `onchange` reads `HTMLSelectElement.selectedOptions` array. `src/routes/reports/new/+page.svelte` — student resolution simplified: reads `session.student_ids` directly for all session types (private and group); course fetch removed. Backend delta v16. | ✅ |
| 204 No Content fix (session 24) | `src/lib/api.ts` — `request()` now returns `undefined as T` when `res.status === 204`, skipping the `.json()` call. Fixes "Unexpected end of JSON input" crash on course delete and any other endpoint returning 204 with empty body. | ✅ |
| Availability calendar fixes (session 24) | `src/routes/calendar/+page.svelte` — (1) `fetchAvailability` was calling `GET /availability` with no path param (silently 404ing); fixed to `GET /availability/${teacherId}`. (2) `hasAvailability` was using `!a.specific_date` for weekly slots, which highlighted every day on the calendar; fixed to `a.specific_date ? a.specific_date === key : a.day_of_week === date.getUTCDay()`. Teachers and admins can now see their availability slots highlighted on the calendar. | ✅ |
| Admin calendar — StudentPicker enrollment filter (session 27) | Both Add Session and Edit Session modals now pass only students enrolled in the selected course to `StudentPicker` (derived from `course.enrolled_student_ids` already in `adminCourses` — no extra API call). Changing the course select clears the student selection via `onchange`. Previously passed all platform students, allowing unenrolled students to be added. | ✅ |
| Teacher dashboard — My Students fix (session 27) | `GET /students` backend fix: was querying `StudentProfile` by `assigned_teacher_id` (field never set → always empty). Now queries via course enrollment: finds teacher's courses → collects `enrolled_student_ids` → returns those profiles. `GET /students/:id` teacher access also fixed from `assigned_teacher_id` check to course enrollment check. Backend: `app/students/service.py`. | ✅ |
| Teacher profile — sidebar restored for teacher/student (session 27) | Corrects overly-broad session 26 fix. `teachers/[id]/+layout.svelte` now uses `<AuthLayout>` for `teacher`/`student` visitors (sidebar preserved) and public layout for `admin`/unauthenticated (admin sidebar stays off public pages). Previously all authenticated users lost their sidebar on teacher profile pages. | ✅ |
| Admin calendar — recurring delete reappear fix (session 28) | `fetchRecurringTemplates` was missing `&is_active=true` so soft-deleted templates reappeared after delete. One-line fix in `src/routes/admin/calendar/+page.svelte`. | ✅ |
| Teacher simplification — courses (session 28) | "Create New" course button (`src/routes/courses/+page.svelte`) gated to admin only (`isAdmin` derived). Teachers no longer see it; auto-create on register still works. | ✅ |
| Teacher simplification — calendar (session 28) | `src/routes/calendar/+page.svelte`: "Add Session", "Add Recurring", recurring templates panel all removed for teachers. Session modal footer simplified: teachers only see "Mark Completed" (for confirmed sessions); "Cancel Session" removed entirely for teachers. | ✅ |
| Teacher simplification — reports earnings page (session 28) | New `src/routes/reports/+page.server.ts` (teacher-only guard, admin/student → `/dashboard`) and `src/routes/reports/+page.svelte` (month navigation with Prev/Next, completed sessions table: Tanggal/Mata Pelajaran/Murid/Harga, totals footer: gross → 10% platform fee → "Yang diterima" in teal). Sidebar Reports link updated to `/reports`. Backend: `price` + `recurring_template_id` added to `CalendarSessionItem` and `_session_to_dict`. | ✅ |
| Admin payment reports page (session 29) | New `src/routes/admin/reports/+page.svelte` — teacher picker (`GET /admin/teachers`), month navigation, reuses `EarningsTable`. Guard: `src/routes/admin/reports/+page.server.ts` (admin-only, others → `/dashboard`). Pass-through layout file. Sidebar item "Payment Reports" (`nav.adminReports`) added to admin nav between calendar and audit-log. i18n keys added to both `en.json` and `id.json`: `nav.adminReports`, `reports.admin.selectTeacher`. | ✅ |
| Shared EarningsTable component (session 29) | `src/lib/components/EarningsTable.svelte` — presentational component. Props: `sessions: any[]`, `loading: boolean`, `studentMap: Record<string, string>`. Computes totals internally (gross, 10% fee, net). Used by both `/reports` (teacher) and `/admin/reports` (admin). Teacher reports page refactored to use it. | ✅ |
| Reports stale data fix (session 32) | `src/routes/reports/[studentId]/+page.svelte` — `$effect` now has `data.studentId;` as a dependency. SvelteKit reuses the component on navigation between students; `onMount` never re-runs, but `$effect` retriggers on param change. Removed duplicate `onMount(fetchReports)`. | ✅ |
| EarningsTable — i18n + column fixes (session 32) | `EarningsTable.svelte`: removed `studentMap` prop entirely; added `import { t } from 'svelte-i18n'`; all hardcoded column headers replaced with `$t('reports.earnings.*')` keys; subject column uses `display_title?.split(' — ')[0] ?? ''`; student column uses `display_title?.split(' — ')[1] ?? '—'`. Both teacher `/reports` and admin `/admin/reports` pages updated to drop `studentMap` and `GET /students` calls. | ✅ |
| Dashboard greeting shows name (session 32) | `dashboard/+page.svelte` greeting now works: backend `get_teacher_dashboard` and `get_student_dashboard` both return `full_name` in the response. Frontend uses `d.full_name`. i18n keys changed from `"Good morning, 👋"` pattern to `"Hi, {name}"` / `"Halo, {name}"` in both locales. | ✅ |
| Student dashboard enrolled courses — name + teacher (session 32) | Enrolled courses now show subject name (e.g. "Math") and teacher name instead of raw MongoDB ID. Backend `_course_dict` in `app/dashboard/service.py` now resolves `TeacherProfile.full_name` and returns `teacher_name`. `DashboardEnrolledCourseItem` schema got `teacher_name: Optional[str] = None`. Frontend: `course.title` → `course.name`; subtitle renders `{#if course.teacher_name}` only (no fallback to raw ID). | ✅ |
| Teacher dashboard recent reports dedup (session 32) | `get_teacher_dashboard` in `app/dashboard/service.py` fetches 25 reports then deduplicates by `student_id`, keeping only 5 unique students. Fixes duplicate links when 2+ students share a group session. | ✅ |
| Teacher-view UI cleanup (session 34) | `reports/[studentId]/+page.svelte` — "Create Report" button + `openCreate()` fn + broken create path (`session_id = null`) removed; report creation is now `/reports/new` only. `students/[id]/+page.svelte` — "Message Student" button removed (was dead — no href/onclick). Both committed to `main`, 0 type errors. | ✅ |
| Admin sidebar on teacher profile (session 35) | `src/routes/teachers/[id]/+layout.svelte` — `useAuthLayout` condition extended to include `admin` role. Admins now keep their sidebar when viewing any teacher profile. Unauthenticated visitors are unaffected (still get public Navbar-only layout). Architecture decision note in `CLAUDE.md` updated: constraint is now "unauthenticated visitors" not "admin". | ✅ |
| Avatar `assetUrl` — all non-profile call sites (session 36) | Profile picture was broken everywhere except Teacher/Student My Profile because callers passed the raw `/uploads/...` relative path from the API into `<Avatar src>`, so the browser tried to load it from the app origin instead of the API origin. Fixed by wrapping `src` with `assetUrl()` at four sites: `Navbar.svelte` (`profileSrc = assetUrl(profile?.photo_url) ?? ''`), landing `+page.svelte` search-result teacher chips and featured-teacher cards, and `/teachers/+page.svelte` directory grid. Follows the established caller-applies convention — no change to `Avatar.svelte` itself. | ✅ |
| Report notes `whitespace-pre-line` (session 36) | DB stores newlines in `report.notes`, but the `<blockquote>{report.notes}</blockquote>` renders collapse `\n` into a single space by default. Added `whitespace-pre-line` to every notes render: report list card (`reports/[studentId]/+page.svelte`), public share page (`report/share/[token]/+page.svelte`), dashboard latest-report card, and the new view modal. `pre-line` (not `pre-wrap`) — preserves newlines but still wraps normally and collapses runs of spaces, which matches teacher input intent. | ✅ |
| Report view modal — read-only, mobile-friendly (session 36) | On mobile the list card clamped notes to 2 lines with no way to see the rest, and the edit modal was teacher-only. `reports/[studentId]/+page.svelte` now: (1) makes each report card clickable (`role="button"`, `tabindex="0"`, Enter/Space keys) → opens a new read-only `<Modal maxWidth="lg">` with full scores + full notes (`whitespace-pre-line`), scrollable body via existing `max-h-[90vh]`; (2) adds an explicit "View Report" button in the card footer, visible to both teacher and student; (3) footer of the view modal shows "Close" always, and "Edit Report" for teachers (which closes view + opens the existing edit modal on the same report); (4) `stopPropagation()` on the edit/share buttons and on the inline share-panel input/copy button so tapping them does NOT re-trigger the card's view-modal open. New i18n keys: `reports.viewReport` + `reports.viewTitle` in both `en.json` and `id.json`. No backend change. | ✅ |
| First-load glitch fix (session 38) | Root `+layout.svelte` `{#if $isLoading}` spinner wrapper **removed** — it replaced the hydrated page with a spinner on every cold-cache first visit (the incognito "glitch"). `+layout.ts` `await waitLocale()` already guarantees translations before render on server AND client; the guard was redundant. Verified: throttled cold load shows 0 spinner/blank frames. | ✅ |
| Self-hosted Inter fonts (session 38) | `@fontsource/inter` 400/500/600/700 imported at top of `app.css`; Google Fonts preconnects + stylesheet removed from `app.html`. Fonts now same-origin hashed woff2 (browsers fetch latin subset only via unicode-range). Zero external requests on page load. | ✅ |
| Mobile 360px pass (session 38) | Playwright walk of all 28 routes at 360×740 (admin/teacher/student/public) — all fit, 0 console errors. Fixes: **AuthLayout `<main>` gains `min-w-0`** (wide tables stretched the page — flex min-width:auto; audit log was 872px); Navbar `px-4 sm:px-6` + `gap-2 sm:gap-4`; `Logo` gains `compact` prop (wordmark hidden `<sm` when authenticated — navbar overflowed 18px with avatar); logout button `whitespace-nowrap`; AuthLayout main `p-4 sm:p-6 lg:p-8`; EarningsTable wrapped in `overflow-x-auto` + totals `gap-6 sm:gap-14`; reports/[studentId] date filter `flex-wrap`; sidebar drawer Escape-to-close (handler moved onto the dialog, `tabindex="-1"`); 5 auth pages un-nested `<a><Logo/></a>` → `<Logo href>` (killed `node_invalid_placement_ssr` warnings); `<title>` added to `/reports` + audit-log. | ✅ |
| Mobile calendar — dots + day panel (session 38) | Both `/calendar` and `/admin/calendar`, below `md`: day cells show ≤3 session dots + `+N` (dotClass: group=primary, private=teal, done/cancelled=text3), whole cell is a tap target, selected day highlighted, day panel below grid lists sessions (admin uses `pillLabel`) and opens the existing modals. `selectedDayKey` defaults to today in current month (reset via `$effect` on month change). Desktop ≥md unchanged. Cells `min-h-[64px] md:min-h-[120px]`. Pattern intentionally duplicated per page (no shared component). i18n: `calendar.noSessionsDay`. | ✅ |
| SEO/OG meta + sitemap (session 38) | `SeoAlternates.svelte` extended with optional `title`/`description`/`image` props → emits description + OG + Twitter meta when `description` given (og:image defaults to existing `brand-kit/png/social-card-1200x630.png`, og:locale from URL lang). New top-level `seo.*` i18n section (EN+ID) wired on 7 public pages; teacher profile uses bio as description. `static/robots.txt` (disallow auth sections, Sitemap pointer). `src/routes/sitemap.xml/+server.ts` — ID+EN variants of public routes + featured teachers, 1h cache, degrades gracefully if API down. | ✅ |
| URL-based language routing + SEO (session 37) | Indonesian = unprefixed URLs, English = `/en` prefix on public pages. New: `src/hooks.ts` (reroute strips `/en`), `SeoAlternates.svelte` (canonical + hreflang id/en/x-default), `teachers/+page.server.ts` (SSR grid). Changed: `hooks.server.ts` (locale resolution + cookie rules + `<html lang>` via `transformPageChunk`), `app.html` (`%lang%`), `+layout.server.ts` (lang from locals), `+layout.ts` (`waitLocale()`), `i18n.ts` (`lhref`/`altLangHref`/`stripLangPrefix`, cookie-only persistence, `detectLang` deleted), Navbar (toggle = crawlable `<a data-sveltekit-reload>` when logged out), ~22 public-page hrefs wrapped in `$lhref()`, `noindex` on `/report/share/[token]`. Spec: `docs/superpowers/specs/2026-07-17-url-based-language-design.md`; plan: `docs/superpowers/plans/2026-07-17-url-based-language-routing.md`. Curl-verified: `<html lang>`, canonical/hreflang on `/` + `/en`, translated SSR text both languages, cookie set/no-overwrite rules, `/en/en` → 404. | ✅ (curl-verified; browser + production verify pending) |
| Landing footer — 4-column symmetry + Contact (session 32) | `src/routes/+page.svelte` footer — added 4th Contact `<nav>` column (`mailto:info@mutawazinprivate.com`) to fill the `lg:grid-cols-4` grid. Added `landing.footerContact` + `landing.footerEmailUs` i18n keys to both `en.json` and `id.json`. Commit `b79303b` — **local only, not yet pushed**. | ✅ |
| Write report — stale student fix (session 29) | `src/routes/reports/new/+page.svelte`: after `saveReport()` succeeds, the reported student is removed from `sessionStudents` and the session's `reported_student_ids` is updated locally. Sessions where all students are reported are also filtered out. This prevents the just-reported student from reappearing when clicking "Write another". | ✅ |
| Logout cookie fix — same-origin deletion (session 29) | Root cause: `Navbar.svelte` was calling `api.post('/auth/logout')` cross-origin to `localhost:8000`. The backend's `Set-Cookie: Max-Age=0` deletion was not reliably honored by the browser, so the `access_token` cookie persisted. `+layout.server.ts` read the stale cookie and returned `data.user` as authenticated, making the sidebar and edit icons appear even after logout. **Fix:** New `src/routes/api/logout/+server.ts` — same-origin SvelteKit endpoint that reads the token from cookies, forwards it to the backend via `Authorization: Bearer` (for server-side session cleanup), then deletes both cookies via `event.cookies.delete()`. `Navbar.svelte` now calls `fetch('/api/logout', { method: 'POST' })`. | ✅ |
| Logout navigation fix — hard reload (session 30) | Root cause: `goto('/', { invalidateAll: true })` is SvelteKit client-side navigation. It re-runs `+layout.ts` on the client, which calls `user.set(data.user)`. If the cookie was not yet deleted (Vite HMR didn't pick up the new `+server.ts` route, or same-URL navigation was skipped), `data.user` came back non-null and the store was re-written to authenticated. **Fix:** Replaced `goto` + `user.set(null)` with `window.location.replace('/')` — a hard page reload that bypasses SvelteKit's store layer entirely. The browser makes a fresh GET, the server reads the (now-deleted) cookies, and the page renders from scratch as unauthenticated. Removed unused `goto` import from `Navbar.svelte`. | ✅ |
| Logout cookie domain mismatch — production only (session 31) | Root cause: backend sets cookies with `Domain=mutawazinprivate.com` (`COOKIE_DOMAIN` env var). The SvelteKit `/api/logout` was calling `cookies.delete('access_token', { path: '/' })` — no `domain` attribute. Browsers treat a cookie set with an explicit domain and a deletion without domain as different cookies; the original domain cookie was never removed. After logout, `window.location.replace('/')` sent the still-present cookie, `+page.server.ts` saw `locals.user` as truthy, redirected (302) to `/dashboard` — user stayed logged in. Appeared in devtools as tokens "glitching" (briefly deleted then present again) plus an extra main-domain 302 with cookies. **Fix:** `/api/logout/+server.ts` now reads `COOKIE_DOMAIN` and `COOKIE_SECURE` from `$env/dynamic/private` and passes matching `domain`/`secure`/`sameSite` to `cookies.delete()`. **VPS `.env` (frontend):** add `COOKIE_DOMAIN=mutawazinprivate.com` and `COOKIE_SECURE=true`. | ✅ |
| Delta v13 — phone number (session 19) | Optional private `phone_number: string\|null` field added to teacher and student profiles. **Teacher profile:** new Phone Number card after Achievements (same per-section pencil pattern — `editingPhoneNumber`/`savingPhoneNumber`/`savePhoneNumber()`/`openSection('phoneNumber')`). Visible to `isOwn \|\| isAdmin`. Added `isAdmin = $derived(data.user?.role === 'admin')` to teacher profile. **Student profile:** inline phone row after DOB (same inline-edit pattern as DOB). Owner always sees field + pencil; admin sees field only when non-null; teacher callers see nothing (API returns null). Cross-cancel with DOB edit. **Types:** `TeacherProfileResponse`, `UpdateTeacherProfileRequest`, `StudentProfileResponse`, `UpdateStudentProfileRequest` added to `src/lib/api.ts`. **i18n:** `profile.phoneNumber` + `profile.phoneNumberPlaceholder` added to `en.json` + `id.json`. 4 commits on `main`, not yet pushed. | ✅ (code done; live verify pending) |

### What is NOT done yet (known gaps)

0. **Push + production verification (sessions 37+38)** — **27 commits await explicit push approval.** After deploy, verify in production: (a) incognito first load on a phone — no flash/spinner (the session 38 glitch fix); (b) EN/ID toggle round-trip on `/teachers`, log in from `/en/login` → dashboard stays English, log in from `/login` → Indonesian; (c) `/teachers` grid with real data (dev DB had zero featured teachers); (d) canonical/og:url/sitemap URLs must show `https://mutawazinprivate.com` (all built from request origin; existing `ORIGIN` env handles it, no new env vars); (e) WhatsApp link preview shows the brand social card (og:image). Session 37's deferred sitemap.xml + robots.txt were DONE in session 38.

1. **Admin Courses — student enrollment management** — enroll/unenroll students per course (`POST /courses/:id/enroll`, `DELETE /courses/:id/enroll/:student_id`). Deferred to follow-up; the page exists but has no student management UI yet.

2. **Runtime verification** — admin calendar, session edit, teacher profile redesign, navbar avatar fetch, course detail page, and all previous delta features not yet tested against live backend.

3. **Availability slot `id` field** — not yet tested live. If edit/delete fail, fix `{@const slotId = slot.id ?? slot.slot_id ?? ''}` in `src/routes/calendar/+page.svelte`.

4. **Mobile testing** — ✅ CLOSED in session 38: all 28 routes verified at 360×740 via Playwright for all three roles (drawer open/Escape-close included); both calendars got a dedicated mobile treatment (dots + day panel).

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
| **svelte-i18n + URL-based locale on public pages** | Indonesian = unprefixed URLs (default/x-default), English = `/en` prefix, stripped by the `reroute` hook in `src/hooks.ts` (no route files move). Locale resolution in `hooks.server.ts`: `/en/*` → en; other public paths → id (URL-authoritative, never redirect); authenticated paths → `lang` cookie. Public-page links use `$lhref('/path')` from `src/lib/i18n.ts`; the Navbar toggle is a crawlable `<a data-sveltekit-reload>` when logged out, a button when logged in. `SeoAlternates.svelte` emits canonical + hreflang. `+layout.ts` awaits `waitLocale()` so SSR HTML is always translated. `$t('key')` usage everywhere is unchanged. |
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
| **Public pages — role-conditional layout** | Pages under `teachers/[id]/` are public but layout branches on `data.user?.role`: `teacher`/`student`/`admin` → `<AuthLayout>` (sidebar preserved for their role); unauthenticated → public layout (Navbar + `max-w-profile` main, no sidebar). Do NOT apply `<AuthLayout>` for unauthenticated visitors on public pages. `data.user` is available in `+page.svelte` via root layout data merging. |
| **Sidebar userId prop chain** | `userId` flows: sub-layout `data.user?.id` → `<AuthLayout userId>` → `<Sidebar userId>`. Required for My Profile and My Reports hrefs. All authenticated sub-layouts pass it. |
| **AuthLayout content centering** | `<main>` has `flex-1 sidebar-collapse:ml-60 p-6 lg:p-8`. The `max-w-app mx-auto` is on an inner `<div>` wrapping `{@render children()}`, NOT on `<main>` itself. This centers content within the post-sidebar space on wide viewports. Do not move `max-w-app mx-auto` back to `<main>`. |
| **DropdownMenu component** | `src/lib/components/ui/DropdownMenu.svelte` — shared three-dot action dropdown. Props: `items: { label, onclick, variant? }[]`. Handles open/close via `onfocusout` on a `tabindex="-1"` wrapper and Escape key. Used on all three admin table pages. |
| **Admin action pattern** | All admin table rows use `<DropdownMenu>` for actions (View Profile, Delete, Feature/Edit). Delete and Featured actions open confirmation modals before executing. All modals use the existing `<Modal>` component with inline state per page. |
| **Age from DOB pattern** | **Replaced by backend-computed `age: int` field.** `students/[id]/+page.svelte` already reads `profile.age` directly (formula removed). Formula still in `admin/students/+page.svelte` — replace with `user.age != null ? String(user.age) : '—'` once backend ships delta v9 (`age` field on admin students list). |
| **Logout via same-origin SvelteKit endpoint + hard reload** | `Navbar.svelte` calls `fetch('/api/logout', { method: 'POST' })` → `src/routes/api/logout/+server.ts`. The server route reads the `access_token` cookie, forwards it to the backend via `Authorization: Bearer` (to invalidate the DB-side refresh token hash), then deletes both cookies with `event.cookies.delete()`. After the fetch resolves, `Navbar.svelte` calls `window.location.replace('/')` — a hard reload, NOT `goto`. NEVER call the backend's `/auth/logout` directly from the browser (cross-origin `Set-Cookie` is unreliable). NEVER use `goto` after logout (SvelteKit client-side navigation re-runs `+layout.ts` which calls `user.set(data.user)` — if the cookie persists for any reason, this re-authenticates the user). **CRITICAL — cookie delete must match domain:** In production the backend sets cookies with `Domain=COOKIE_DOMAIN` (e.g. `mutawazinprivate.com`). The SvelteKit delete must pass the same `domain` (and `secure`/`sameSite`) attrs, otherwise the browser treats the deletion as targeting a different host-only cookie and the domain cookie survives. The logout handler reads `COOKIE_DOMAIN` and `COOKIE_SECURE` from `$env/dynamic/private` and builds `deleteOpts` accordingly. Both must be added to the frontend `.env` on the VPS: `COOKIE_DOMAIN=mutawazinprivate.com` and `COOKIE_SECURE=true`. |
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
│   ├── hooks.ts                    ← reroute: strips /en prefix so /en/* matches existing routes
│   ├── hooks.server.ts             ← ⚠️ Sets locals.user + locals.lang on EVERY request; lang cookie rules; <html lang> stamp
│   ├── lib/
│   │   ├── api.ts
│   │   ├── i18n.ts
│   │   ├── actions/focusTrap.ts
│   │   ├── stores/auth.ts          ← writable<User | null>
│   │   ├── stores/sidebar.ts       ← writable<boolean> sidebarOpen
│   │   ├── stores/adminBadge.ts    ← writable<number> pendingApprovalCount
│   │   ├── utils/avatar.ts, date.ts, cn.ts
│   │   ├── components/ui/          ← Badge, Avatar, Button, Card, Input, Modal, DropdownMenu, Pagination, StudentPicker
│   ├── components/EarningsTable.svelte  ← Shared earnings table (sessions + totals). Props: sessions, loading. Subject/student resolved from display_title. No studentMap.
│   │   ├── components/ErrorState.svelte  ← full-page error state (tone variants, snippet props)
│   │   ├── components/SeoAlternates.svelte  ← canonical + hreflang id/en/x-default tags (public pages)
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
│       ├── admin/reports/          ← Admin payment reports (teacher picker + month nav + EarningsTable)
│       ├── teachers/             ← Public featured teachers directory (GET /teachers/featured)
│       ├── teachers/[id]/
│       ├── students/[id]/
│       ├── courses/
│       ├── courses/[id]/               ← Course detail page (server load + Svelte page)
│       ├── calendar/
│       ├── api/logout/             ← POST: reads cookie, calls backend via Bearer header, deletes cookies same-origin
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

**Priority 0 — Live-verify session 36 fixes**
- **Profile picture** — as teacher AND as student: reload the app, avatar should appear in Navbar (top-right), landing search-result teacher chips, landing Featured Teachers cards, and `/teachers` directory. Previously all four were broken (raw relative path loading from app origin).
- **Report notes newlines** — open any report that was saved with multi-line notes (either via `/reports/{id}` list card preview *or* dashboard latest-report card *or* public share page *or* the new view modal). Newlines from the DB should now be preserved.
- **Report view modal** — on mobile (375px): tap a report card → view modal opens; scores render in 2-col grid; long notes scroll inside the modal. As teacher, "Edit Report" button in the modal footer swaps to the existing edit form. Share panel "Copy link" should copy without opening the view modal.

**Priority 1 — Finish delta v9**
1. **Admin students age column — one-line code fix** — Replace the IIFE formula at `admin/students/+page.svelte` Age column with `user.age != null ? String(user.age) : '—'`.
2. **Teacher profile stats — verify live** — Log in as teacher, open own profile. Confirm "X yrs experience · Y sessions completed" shows real numbers (not 0 · 0).
3. **Student DOB edit — live verify** — Log in as student, open own profile. Age badge shows a number, pencil opens date input, save calls `PUT /students/me { date_of_birth }`.

**Priority 2 — Live verify accumulated features**
1. **Course detail page** — `/courses/:id`: loads without 404, shows teacher name + pricing grid, enrolled badge for students.
2. **Reports page** — teacher view: no attendance filter, card titles are "subject — teacher", score tiles raw number only, date from `created_at`.
3. **Public share page** — `/report/share/:token`: date and scores render correctly, no attendance badge.
4. **Admin calendar** — sessions load, teacher filter works, session edit modal saves via `PUT /sessions/:id`.
5. **Teacher profile** — per-section editing works, SVG icons render, chips row shows mode + city.
6. **Error page smoke test** — `/nonexistent` → 404 page with correct icon and buttons.

**Priority 3 — Known API gaps to implement (see `docs/api-gap-analysis.md`)**
- `POST /auth/resend-verification` — add resend button to `/verify-email` page
- `PUT /teachers/me/credentials` — wire credentials section save in teacher profile
- **Admin Courses — student enrollment management** — enroll/unenroll UI using `POST /courses/:id/enroll` + `DELETE /courses/:id/enroll/:student_id`

**Priority 4 — Runtime QA**
- Test delta v4: email check on register pages, username check on admin create modals, Delete on all three admin table pages
- Test Calendar Add Session end-to-end (`POST /sessions`, session appears on calendar)
- Test Availability CRUD (Add/Edit/Delete slots — verify `slot.id` field)
- Courses SSR: verify `access_token` cookie forwarding works (not 401 on SSR fetch)

**Priority 5 — Mobile + Visual QA**
- Open DevTools at 375px, test hamburger sidebar drawer, verify all pages are usable
