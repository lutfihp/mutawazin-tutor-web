# Mutawazin — Project Context for Claude Code

## What This Project Is

Mutawazin (Arabic for "balanced") is an online tutoring platform frontend built in SvelteKit. It connects teachers and students for group courses and 1-on-1 sessions.

**Working directory:** `d:\Codading Repo\mutawazin-tutor-web`
**SvelteKit app is at the repo root** — `src/`, `package.json`, etc. live directly in `d:\Codading Repo\mutawazin-tutor-web`
**Backend:** FastAPI at `http://localhost:8000` — not in this repo
**Design handoffs:** `handoffs/` — local only (gitignored). Contains: `design_handoff_mutawazin/`, `brand_kit_handoff/`, FE handoff MDs.

---

## Working with the Backend

**Backend repo:** `d:\Codading Repo\mutawazin-tutor-api` — FastAPI, separate Claude Code session.

**Rule: Never edit backend files directly from this session.** If something doesn't work and the cause appears to be in the backend:
1. Stop immediately — do not attempt to debug or fix the backend
2. Tell the user: *"This looks like a backend issue. Here's a prompt to paste into the backend Claude Code session:"*
3. Write a short, factual prompt describing only: **what was called**, **what happened**, and **what was expected** — no root cause analysis, no suggested fix. The backend session has full context to debug and fix it.
4. Wait for the user to confirm the backend is fixed before continuing on the frontend

---

## Current Status (as of 2026-05-27 — session 14)

### Build status: ✅ Passes `npm run check` (0 errors, 12 pre-existing warnings)

### GitHub remote: ✅ `https://github.com/lutfihp/mutawazin-tutor-web` — branch `main` pushed (sessions 12–14 commits local only, not yet pushed)

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

### What is NOT done yet (known gaps)

1. **Admin Courses — student enrollment management** — enroll/unenroll students per course (`POST /courses/:id/enroll`, `DELETE /courses/:id/enroll/:student_id`). Deferred to follow-up; the page exists but has no student management UI yet.

2. **Runtime verification** — admin calendar, session edit, teacher profile redesign, navbar avatar fetch, course detail page, and all previous delta features not yet tested against live backend.

3. **Availability slot `id` field** — not yet tested live. If edit/delete fail, fix `{@const slotId = slot.id ?? slot.slot_id ?? ''}` in `src/routes/calendar/+page.svelte`.

4. **Mobile testing** — hamburger sidebar untested at 375px viewport.

5. **Teacher profile — live verify** — redesign + chips row edit not yet tested against live backend. Confirm `GET /teachers/:user_id` returns `courses[]` with `name`, `age_categories`, `description`, and that `PUT /teachers/me` accepts per-section payloads (bio, university, experience, achievements, teaching_mode, city).

6. **Admin calendar — recurring student picker** — the recurring modal for private sessions uses a plain text input for student ID (not a dropdown). When backend student list is confirmed available, replace with a `<select>` from `adminStudents`.

7. **Course detail page — live verify** — not yet tested against live backend. Confirm `GET /courses/:id` returns the expected shape (especially `enrolled_student_ids[]` and `price_by_age_category`). Verify the 404 error page renders correctly for unknown course IDs.

8. **Teacher profile stats — pending backend delta v9** — `GET /teachers/:user_id` does not return `years_experience` or `sessions_completed`; both always show 0. Frontend at `src/routes/teachers/[id]/+page.svelte:173-175` already reads `profile.years_experience ?? 0` and `profile.sessions_completed ?? 0` — no frontend change needed once backend ships. Backend must add: `years_experience = current_year - min(year_from)` across `teaching_experience[]` (0 if empty); `sessions_completed = count of Session where teacher_id == user_id and status == "completed"`.

9. **Admin students age column — pending backend delta v9** — `admin/students/+page.svelte` Age column still uses IIFE+formula. Once backend ships `age: int | null` on `GET /admin/students`, replace with `user.age != null ? String(user.age) : '—'`. The student profile DOB edit UI is already in place (`students/[id]/+page.svelte`); it just needs backend to return non-null `age` values.

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
| **Session edit (admin)** | `PUT /sessions/:id` — admin can edit title, starts_at, ends_at, mode, price, teacher_id, student_id, course_id. Teacher role can only edit title/time/mode/price (teacher_id/student_id/course_id ignored). Endpoint added in delta v6. |
| **Navbar profile fetch pattern** | `Navbar.svelte` fetches the logged-in user's own profile on `onMount` (teacher → `GET /teachers/:id`, student → `GET /students/:id`). Stores `profileName` + `profileSrc` in local `$state`. Admin gets no avatar. Teacher/student Avatar is wrapped in `<a>` linking to their profile page. No changes to `hooks.server.ts`, `app.d.ts`, or the `User` store type — JWT only carries `{ id, role, status }`. |
| **Course detail page pattern** | `src/routes/courses/[id]/+page.server.ts` — SSR load: auth guard + `GET /courses/:id` + `throw error(404)` if not found, returns `{ course, user: locals.user }`. Parent `src/routes/courses/+layout.svelte` provides `<AuthLayout>` — no new layout needed. Page uses `AGE_KEYS` map to translate API age-category strings to existing `courses.age*` i18n keys. Price formatted with `Intl.NumberFormat('id-ID', { currency: 'IDR' })`. Student self-enrollment is NOT allowed — enrollment is admin-only via `/admin/courses`. |

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
│   │   ├── components/ui/          ← Badge, Avatar, Button, Card, Input, Modal, DropdownMenu
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
- **Session edit (delta v6):** `PUT /sessions/:id { title?, starts_at?, ends_at?, mode?, price?, teacher_id? (admin), student_id? (admin), course_id? (admin) }`
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
- **Delta v9 (PENDING — backend not yet updated):**
  - `GET /teachers/:user_id` adds `years_experience: int` (0 if no teaching_experience), `sessions_completed: int` (count of completed sessions for that teacher)
  - `GET /admin/students` adds `age: int | null` per student, drops `date_of_birth` from list response
  - `GET /students/:id` adds `age: int | null`, keeps `date_of_birth` (needed for edit form pre-fill)
  - **Frontend ready:** `students/[id]/+page.svelte` already reads `profile.age` and has DOB edit UI. Admin list still uses formula — fix that column once backend ships.

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

**Priority 0 — First production deploy (VPS setup)**
Follow `docs/deployment-guide.md` step by step:
1. SSH into VPS: `mkdir -p /root/mutawazin-web && echo "ORIGIN=https://mutawazinprivate.com" > /root/mutawazin-web/.env`
2. Generate deploy SSH key locally and add public key to VPS `~/.ssh/authorized_keys`
3. Add 5 GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH=/root/mutawazin-web`, `VITE_API_URL=https://api.mutawazinprivate.com`
4. Configure Nginx on VPS to proxy `mutawazinprivate.com` → `localhost:3000`
5. Enable workflow: `git mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml && git commit -m "ci: enable deploy workflow" && git push origin main`
6. Watch Actions tab — should complete in ~2-3 min. Verify with `curl -I http://localhost:3000` on VPS.

**Priority 1 — Finish delta v9 (once backend confirms it's done)**
1. **Teacher profile stats** — log in as a teacher, open own profile. Confirm "X yrs experience · Y sessions completed" shows real numbers (not 0 · 0). No frontend code change needed — just verify.

2. **Admin students age column** — open `/admin/students`. Confirm Age column shows a number instead of `—`. Replace the IIFE formula at `admin/students/+page.svelte:179` with `user.age != null ? String(user.age) : '—'`.

3. **Student DOB edit — live verify** — log in as a student, open own profile. Confirm:
   - Age badge shows a number (reads `profile.age` from backend)
   - Pencil button next to age badge appears; click opens date input
   - Pick a date and save → `PUT /students/me { date_of_birth }` → badge updates

**Priority 2 — Live verify sessions 10–12 features**
1. **Admin dashboard stat** — log in as admin, open `/admin`. Confirm "Active Courses" card shows a non-zero count.

2. **Navbar avatar** — log in as each role:
   - Admin: no avatar between lang toggle and Sign out
   - Teacher: colored circle with name initials (or photo) appears; clicking navigates to `/teachers/:id`
   - Student: same, links to `/students/:id`

3. **Course detail page** — open `/courses`, click "View Course →" on any card:
   - Page loads without 404, `teacher_name` shown with "View Profile →" link
   - Pricing grid shows age categories with Rp-formatted prices
   - Student enrolled in the course sees green "Enrolled" badge
   - Teacher/admin sees enrolled count; admin sees "Manage enrollments →" link

4. **Reports page** — log in as a teacher, open a student's reports:
   - No attendance filter dropdown (removed)
   - Create/edit modal has no attendance radio section
   - Scores show correct max values and progress bars
   - Report rows show formatted date from `created_at`

5. **Public share page** — open a shared report token URL:
   - Score max values render correctly
   - Date shows formatted `created_at`
   - No attendance badge

**Priority 3 — Live verify previous sessions**
6. **Admin calendar** — log in as admin, open `/admin/calendar`:
   - Confirm sessions load from `GET /calendar/admin`
   - Teacher filter dropdown should show "All teachers" / "Semua guru" as default option (fixed session 13)
   - Select a teacher from the picker — confirm calendar refetches filtered sessions
   - Click a session pill → edit modal → save via `PUT /sessions/:id`
   - With teacher filter active: confirm recurring panel loads that teacher's templates

7. **Teacher profile** — log in as a teacher, visit own profile:
   - Per-section pencil editing (About, University, Experience, Achievements)
   - SVG icons render correctly in credential section tiles
   - Chips row: globe icon shows mode, map-pin shows city

8. **Error pages smoke test:**
   - Navigate to `http://localhost:5173/nonexistent` → 404 blue tone, compass icon, "Go home" + "Browse courses" buttons

**Priority 4 — Follow-up feature (frontend only, endpoints already exist)**
9. **Admin Courses — student enrollment management:** Add enroll/unenroll UI to `/admin/courses`. Endpoints: `POST /courses/:id/enroll { student_id }`, `DELETE /courses/:id/enroll/:student_id`. The page exists; needs a student management panel per course.

**Priority 5 — Runtime QA**
10. Test delta v4 features: email check on `/register/teacher` + `/register/student`, username check on admin create modals, Delete actions on all three admin table pages
11. Test Calendar Add Session form end-to-end (`POST /sessions`, session appears on calendar)
12. Test Availability CRUD end-to-end (Add/Edit/Delete slots — verify `slot.id` field works)

**Priority 6 — Mobile + Visual QA**
13. Mobile testing — open DevTools at 375px, test hamburger sidebar drawer, verify all pages are usable
