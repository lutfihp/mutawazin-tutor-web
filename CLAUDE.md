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

## Current Status (as of 2026-05-22 — session 6)

### Build status: ✅ Passes `npm run build` and `npm run check` (0 errors)

### GitHub remote: ✅ `https://github.com/lutfihp/mutawazin-tutor-web` — branch `main` (local only, not yet pushed)

### Login flow: ✅ Confirmed working end-to-end with `admin@mutawazin.com` / `changeme123`

### What is complete

| Area | Content | Status |
|---|---|---|
| Foundation | SvelteKit scaffold, Tailwind v3, svelte-i18n, ui components, layouts, auth | ✅ |
| Auth | Login, Register (teacher/student) + **debounced email availability check**, Email Verify, Account Step-Up, Forgot Password, Reset Password | ✅ |
| Landing | Hero (brand mark), Benefits, Public search (courses+teachers tabs), Featured Teachers, Footer | ✅ |
| Admin | Overview (stats + pending approvals), `/admin/teachers` (**three-dot menu**, **featured confirm modal**, delete, create + username check), `/admin/students` (**three-dot menu**, **age from DOB**, delete, create + username check), `/admin/subjects` (**three-dot menu**, **edit modal**, delete, create) | ✅ |
| Dashboards | Teacher dashboard (real names + My Students roster), Student dashboard, Admin → `/admin` redirect | ✅ |
| Profiles | Teacher profile (bio edit, photo, mode/city/methods/uni/experience/achievements, rating — **credentials removed**), Student profile (**age badge from DOB**) | ✅ |
| Courses | Filter + grid, create via subject picker, suggest new subject, admin+teacher can create, admin Enroll Student | ✅ |
| Calendar | Month grid, session pills + recurring badge, availability panel, Recurring templates, Add Session, Availability CRUD | ✅ |
| Reports | Score grid, create/edit modal, Share button + panel, public `/report/share/:token` page | ✅ |
| Brand | SVG companion mark in Navbar+footer, brand kit in `static/brand-kit/` | ✅ |
| Subjects | Renamed from "Catalog"; 5-level age categories | ✅ |
| Navigation | Logout button, Sidebar profile/reports hrefs wired via `userId` prop chain | ✅ |
| `/teachers` public page | Featured teachers grid, footer + landing "Browse all" links | ✅ |
| Delta v4 backend | Email/username availability checks, Delete teacher/student/subject with confirmation modals, `"deleted"` status filtering | ✅ |

### What is NOT done yet (known gaps — needs backend first)

1. **Teacher profile — Current Courses section** — handoff includes a course card grid on the teacher profile page. Blocked on backend confirmation: does `GET /teachers/:user_id` already return `courses[]` in the response, or does a separate endpoint exist (e.g. `GET /teachers/:id/courses`)? Once confirmed, implement the section with subject badge, title, age category badge.

2. **Admin Courses page (`/admin/courses`)** — admin-specific course management where admin can create courses for teachers and assign teachers to existing courses. Needs new backend endpoints — not yet implemented on the backend side.

3. **Runtime verification** — calendar, enrollment, and new admin features (delta v4 deletes, availability CRUD) not yet tested against live backend. See `docs/qa-checklist.md`.

4. **Availability slot `id` field** — not yet tested live. If edit/delete fail, fix `{@const slotId = slot.id ?? slot.slot_id ?? ''}` in `src/routes/calendar/+page.svelte`.

5. **Mobile testing** — hamburger sidebar untested at 375px viewport.

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
│       ├── admin/teachers/         ← All non-pending teachers + feature toggle + create
│       ├── admin/students/         ← All non-pending students + create
│       ├── admin/subjects/         ← Verified subjects list + create
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

**Priority 1 — Backend confirmations needed (ask backend session first)**
1. **Teacher profile courses:** Does `GET /teachers/:user_id` already return `courses[]`? Or is there a `GET /teachers/:id/courses` endpoint? Once confirmed, implement the Current Courses section on `teachers/[id]/+page.svelte` (card grid: subject badge, title, age category badge).
2. **Admin Courses page:** Request new backend endpoints for admin course management — admin should be able to list all courses, create a course for a specific teacher, and assign a teacher to an existing course. Once endpoints are ready, build `/admin/courses` route (new sub-layout + page + server).

**Priority 2 — Runtime QA (use `docs/qa-checklist.md`)**
3. Test delta v4 features: email check on `/register/teacher` + `/register/student`, username check on admin create modals, Delete actions on `/admin/teachers` + `/admin/students` + `/admin/subjects`
4. Test Calendar Add Session form end-to-end (`POST /sessions`, session appears on calendar)
5. Test Availability CRUD end-to-end (Add/Edit/Delete slots — verify `slot.id` field works)
6. Test Course enrollment (admin: "Enroll Student" → `POST /courses/:id/enroll`, count +1)

**Priority 3 — Mobile + Visual QA**
7. Mobile testing — open DevTools at 375px, test hamburger sidebar drawer, verify all pages are usable
8. Visual verification — open each `handoffs/design_handoff_mutawazin/Stage*.html` in browser, compare against live app, note and fix gaps
