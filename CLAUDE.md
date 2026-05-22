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

## Current Status (as of 2026-05-22 — session 7)

### Build status: ✅ Passes `npm run check` (0 errors, 10 pre-existing warnings)

### GitHub remote: ✅ `https://github.com/lutfihp/mutawazin-tutor-web` — branch `main` pushed

### Login flow: ✅ Confirmed working end-to-end with `admin@mutawazin.com` / `changeme123`

### What is complete

| Area | Content | Status |
|---|---|---|
| Foundation | SvelteKit scaffold, Tailwind v3, svelte-i18n, ui components, layouts, auth | ✅ |
| Auth | Login, Register (teacher/student) + **debounced email availability check**, Email Verify, Account Step-Up, Forgot Password, Reset Password | ✅ |
| Landing | Hero (brand mark), Benefits, Public search (courses+teachers tabs), Featured Teachers, Footer | ✅ |
| Admin | Overview (stats + pending approvals), `/admin/teachers` (**three-dot menu**, **featured confirm modal**, delete, create + username check), `/admin/students` (**three-dot menu**, **age from DOB**, delete, create + username check), `/admin/subjects` (**three-dot menu**, **edit modal**, delete, create) | ✅ |
| Admin Courses | `/admin/courses` — list all courses, **create** (teacher + subject pickers, age categories + price per category, description), **edit** (subject locked if enrolled, teacher change warning, status toggle), **delete** (409 handling). Sidebar link added. | ✅ |
| Delta v5 backend | Admin course CRUD via `POST/PUT/DELETE /admin/courses/:id` | ✅ |
| Dashboards | Teacher dashboard (real names + My Students roster), Student dashboard, Admin → `/admin` redirect | ✅ |
| Profiles | Teacher profile (**redesigned** — per-section pencil editing, Card header + chips row, University/Experience/Achievements/Courses sections, no action buttons), Student profile (**age badge from DOB**) | ✅ |
| Courses | Filter + grid, create via subject picker, suggest new subject, admin+teacher can create, admin Enroll Student | ✅ |
| Calendar | Month grid, session pills + recurring badge, availability panel, Recurring templates, Add Session, Availability CRUD | ✅ |
| Reports | Score grid, create/edit modal, Share button + panel, public `/report/share/:token` page | ✅ |
| Brand | **Updated brand mark** — `Logo.svelte` now uses the real Mutawazin SVG mark; `static/brand-kit/png/logo-mark-*.png` updated from handoff (optimized, ~50% smaller) | ✅ |
| Subjects | Renamed from "Catalog"; 5-level age categories | ✅ |
| Navigation | Logout button, Sidebar profile/reports hrefs wired via `userId` prop chain | ✅ |
| `/teachers` public page | Featured teachers grid, footer + landing "Browse all" links | ✅ |
| Delta v4 backend | Email/username availability checks, Delete teacher/student/subject with confirmation modals, `"deleted"` status filtering | ✅ |

### What is NOT done yet (known gaps)

1. **Admin Courses — student enrollment management** — enroll/unenroll students per course (`POST /courses/:id/enroll`, `DELETE /courses/:id/enroll/:student_id`). Deferred to follow-up; the page exists but has no student management UI yet.

2. **Runtime verification** — calendar, enrollment, and new admin features (delta v4 deletes, delta v5 course CRUD, availability CRUD) not yet tested against live backend. See `docs/qa-checklist.md`.

3. **Availability slot `id` field** — not yet tested live. If edit/delete fail, fix `{@const slotId = slot.id ?? slot.slot_id ?? ''}` in `src/routes/calendar/+page.svelte`.

4. **Mobile testing** — hamburger sidebar untested at 375px viewport.

5. **Teacher profile — live verify** — redesign not yet tested against live backend. Confirm that `GET /teachers/:user_id` returns `courses[]` with `name`, `age_categories`, `description` fields, and that `PUT /teachers/me` accepts per-section saves correctly.

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
| **Subjects = name only** | `Subject` model has only `{ id, name, status }` — no subject field or age_categories. Age categories live on `Course` directly. `/catalog` endpoints renamed to `/subjects`. |
| **5-level age categories** | Values: `"pre-school"`, `"elementary"`, `"middle-school"`, `"high-school"`, `"general"`. Old `"kids"/"teens"/"adults"` are gone. |
| **pendingApprovalCount store** | `src/lib/stores/adminBadge.ts` — currently unused after admin restructure (sidebar badge removed). Store still exists but is no longer written to. |
| **Admin sub-layouts are pass-through** | `/admin/teachers`, `/admin/students`, `/admin/subjects` each have `+layout.svelte` files that are simple `{@render children()}` pass-throughs — no `<AuthLayout>` wrapper. The parent `/admin/+layout.svelte` already provides `<AuthLayout>`. Adding `<AuthLayout>` in a child layout causes double-wrapping (two sidebars, double `ml-60` offset). |
| **Sidebar userId prop chain** | `userId` flows: sub-layout `data.user?.id` → `<AuthLayout userId>` → `<Sidebar userId>`. Required for My Profile and My Reports hrefs. All authenticated sub-layouts pass it. |
| **AuthLayout content centering** | `<main>` has `flex-1 sidebar-collapse:ml-60 p-6 lg:p-8`. The `max-w-app mx-auto` is on an inner `<div>` wrapping `{@render children()}`, NOT on `<main>` itself. This centers content within the post-sidebar space on wide viewports. Do not move `max-w-app mx-auto` back to `<main>`. |
| **DropdownMenu component** | `src/lib/components/ui/DropdownMenu.svelte` — shared three-dot action dropdown. Props: `items: { label, onclick, variant? }[]`. Handles open/close via `onfocusout` on a `tabindex="-1"` wrapper and Escape key. Used on all three admin table pages. |
| **Admin action pattern** | All admin table rows use `<DropdownMenu>` for actions (View Profile, Delete, Feature/Edit). Delete and Featured actions open confirmation modals before executing. All modals use the existing `<Modal>` component with inline state per page. |
| **Age from DOB pattern** | `Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))` — used in both admin/students table and students/:id profile. Check `Number.isFinite(age) && age >= 0` before rendering. |
| **DropdownMenu fixed positioning** | `DropdownMenu.svelte` panel uses `position: fixed` with `getBoundingClientRect()` on the trigger button to compute `top` and `right`. This escapes `overflow-x-auto` table containers — do NOT revert to `absolute`. |
| **Admin table header alignment** | All `<th>` in admin tables use `text-left`, including the Actions column. The `<td>` for the actions column keeps `text-right` so the `⋮` button stays right-aligned, but the header label is left-aligned. |
| **Admin courses page pattern** | `/admin/courses` loads courses + teachers + subjects in parallel on mount. `teacherMap` (teacher_id → full_name) is built from the teacher list for display. Price per age category is stored as `Record<string, string>` in state (for input binding) and converted to `Record<string, number>` on submit. |
| **Teacher profile per-section edit pattern** | `src/routes/teachers/[id]/+page.svelte` has one `editing*` / `saving*` / save-function triple per editable section (bio, university, experience, achievements). `openSection(name)` sets the named section to `true` and all others to `false` — enforces mutual exclusion so only one section is editable at a time. Camera overlay on avatar is always shown to `isOwn` (no editMode toggle). |
| **Teacher profile data display** | API data is adapted to the design: `university: string` shown as a single name row; `teaching_experience: [{subject, year_from, year_to}]` shown as subject + year range; `achievements: string[]` shown as plain string rows. Sections are hidden on public view when empty; on own view they show "Not set" with a pencil button. `teaching_mode`, `city`, `teaching_methods[]` shown as Badge chips below a `<hr>` in the profile header card. |

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
│       ├── teachers/             ← Public featured teachers directory (GET /teachers/featured)
│       ├── teachers/[id]/
│       ├── students/[id]/
│       ├── courses/
│       ├── calendar/
│       ├── reports/[studentId]/
│       └── report/share/[token]/   ← Public report share page (no auth)
├── static/brand-kit/               ← All brand assets served statically
└── docs/
    ├── content-audit.csv           ← Dead links / fake data audit with decisions
    └── superpowers/specs/ + plans/ ← Implementation specs and plans
```

---

## API Contract

Updated API contract is at `D:\Codading Repo\mutawazin-tutor-api\docs\api-contract\api-types.ts`.

Key endpoints active as of 2026-05-22:
- Auth: login, register, verify-email, refresh, logout, forgot-password, reset-password, step-up
- **Availability checks (public):** `GET /auth/check/email?email=<val>` → `{ available: boolean }`, `GET /auth/check/username?username=<val>` → `{ available: boolean }`
- Subjects: `GET /subjects`, `POST /subjects/suggest`, admin CRUD at `/admin/subjects`
- **Admin subjects:** `PUT /admin/subjects/:id { name }` (edit name), `DELETE /admin/subjects/:id`
- Courses: `POST /courses { subject_id, age_categories, description? }`
- Sessions: `POST /sessions`, `PATCH /sessions/:id/status { status }`, ratings at `/sessions/:id/rating`
- Reports: `POST /reports/:id/share`, public `GET /reports/share/:token`
- Recurring: `POST/GET/PUT/DELETE /sessions/recurring`
- Search (public, no auth): `GET /search/courses`, `GET /search/teachers`
- Ratings: `POST /sessions/:id/rating`, `GET /sessions/:id/rating`
- Teachers (public, no auth): `GET /teachers/featured`, `GET /teachers/:user_id`
- Students: `GET /students` (teacher auth — returns assigned students list)
- Admin teachers: `PATCH /admin/teachers/:id/featured`, `DELETE /admin/teachers/:id`
- Admin students: `DELETE /admin/students/:id`
- **Admin courses (delta v5):** `POST /admin/courses`, `PUT /admin/courses/:id`, `DELETE /admin/courses/:id`
- **Course enrollment:** `POST /courses/:id/enroll { student_id }`, `DELETE /courses/:id/enroll/:student_id` (admin only)
- Availability: `POST /availability`, `PUT /availability/:slot_id`, `DELETE /availability/:slot_id`

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

**Priority 1 — Live verify teacher profile redesign**
1. Start the dev server + backend, log in as a teacher, visit own profile — confirm:
   - Per-section pencil editing works (About, University, Experience, Achievements each save independently)
   - `PUT /teachers/me` accepts each per-section payload correctly
   - Chips row (mode/city/methods) renders correctly in the header
   - Current Courses section shows `courses[].name` + `age_categories` + `description` from the API
   - Sections with no data hide on public view; show "Not set" on own view
   - Camera overlay → photo upload still works

**Priority 2 — Follow-up feature (frontend only, endpoints already exist)**
2. **Admin Courses — student enrollment management:** Add enroll/unenroll UI to `/admin/courses`. Endpoints: `POST /courses/:id/enroll { student_id }`, `DELETE /courses/:id/enroll/:student_id`. The page exists; needs a student management panel per course (e.g. expandable row or modal showing enrolled students with unenroll buttons + enroll new student picker).

**Priority 3 — Check design handoff for other updated pages**
3. The design handoff in `handoffs/design_handoff_mutawazin/` was updated this session. Teacher profile was done. Check the handoff README/stage files to see if any other pages have visual updates that need implementing (student profile, course cards, landing, etc.).

**Priority 4 — Runtime QA (use `docs/qa-checklist.md`)**
4. Test delta v4 features: email check on `/register/teacher` + `/register/student`, username check on admin create modals, Delete actions on all three admin table pages
5. Test delta v5: create/edit/delete courses on `/admin/courses` against live backend
6. Test Calendar Add Session form end-to-end (`POST /sessions`, session appears on calendar)
7. Test Availability CRUD end-to-end (Add/Edit/Delete slots — verify `slot.id` field works)

**Priority 5 — Mobile + Visual QA**
8. Mobile testing — open DevTools at 375px, test hamburger sidebar drawer, verify all pages are usable
