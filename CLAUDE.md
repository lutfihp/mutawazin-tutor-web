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

## Current Status (as of 2026-05-20 — session 5)

### Build status: ✅ Passes `npm run build` and `npm run check` (0 errors)

### GitHub remote: ✅ `https://github.com/lutfihp/mutawazin-tutor-web` — branch `main`

### Login flow: ✅ Confirmed working end-to-end with `admin@mutawazin.com` / `changeme123`

### What is complete

| Area | Content | Status |
|---|---|---|
| Foundation | SvelteKit scaffold, Tailwind v3, svelte-i18n, ui components, layouts, auth | ✅ |
| Auth | Login, Register (teacher/student), Email Verify, Account Step-Up, **Forgot Password**, **Reset Password** | ✅ |
| Landing | Hero (brand mark), Benefits, **Public search** (courses+teachers tabs), Featured Teachers, Footer (clean — no dead links) | ✅ |
| Admin | **Restructured into 4 pages**: Overview (stats + pending approvals), `/admin/teachers` (full list + feature toggle + create), `/admin/students` (full list + create), `/admin/subjects` (verified list + create) | ✅ |
| Dashboards | Teacher dashboard (real names + **My Students roster**), Student dashboard, Admin → `/admin` redirect | ✅ |
| Profiles | Teacher profile (bio edit, photo, new fields: mode/city/methods/uni/experience/achievements, rating display), Student profile | ✅ |
| Courses | Filter + grid (subject filter dynamic from `/subjects`), **create via subject picker**, **suggest new subject**, admin+teacher can create, **admin Enroll Student** (`POST /courses/:id/enroll`) | ✅ |
| Calendar | Month grid, session pills + **recurring ↻ badge**, availability panel, **Recurring templates panel** (add/edit/delete), session detail with mode/price/**student rating**, **Cancel Session + Mark Completed wired**, **Add Session full form** (7 fields, `POST /sessions`), **Availability CRUD** (Add Slot weekly/specific + edit/delete) | ✅ |
| Reports | Score grid, create/edit modal with **understanding_level A–E**, **Share button + panel**, public `/report/share/:token` page | ✅ |
| Brand | SVG companion mark in Navbar+footer, brand kit in `static/brand-kit/`, `mark-light.svg` for dark footer | ✅ |
| Subjects | Renamed from "Catalog" throughout codebase (all vars, functions, i18n keys); 5-level age categories | ✅ |
| Navigation | **Logout button** in Navbar, **Sidebar profile/reports hrefs** wired via `userId` prop chain, My Students removed | ✅ |
| `/teachers` public page | Featured teachers grid (`GET /teachers/featured`), footer + landing "Browse all" links now live | ✅ |

### Design handoff stage coverage (4 stages total)

| Stage | Content | Status |
|---|---|---|
| Stage 1 — Landing | All sections ✅; trust row + vignette intentionally removed (fake data); footer social icons not added | ~95% |
| Stage 2 — Auth | All 9 screens + bonus Forgot/Reset Password | 100% |
| Stage 3 — Dashboards + Profiles | All 5 pages | 100% |
| Stage 4 — Features | Courses ✅ (+ enrollment), Reports ✅, Calendar ✅ | ~98% |

### What is NOT done yet (known gaps for next session)

1. **Runtime verification** — new calendar + enrollment features not yet tested against live backend. See `docs/qa-checklist.md` for full checklist.

2. **Availability slot `id` field** — confirmed `id` from backend source code, but not yet tested live. If edit/delete fail at runtime, fix `{@const slotId = slot.id ?? slot.slot_id ?? ''}` in `src/routes/calendar/+page.svelte`.

3. **Mobile testing** — hamburger sidebar untested at 375px viewport.

4. **Visual verification** — pages not checked against `handoffs/design_handoff_mutawazin/Stage*.html`.

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
| **Admin sub-layouts** | `/admin/teachers`, `/admin/students`, `/admin/subjects` each have their own `+layout.svelte` + `+page.server.ts` (admin auth guard) + `+page.svelte`. Same pattern as other route groups. |
| **Sidebar userId prop chain** | `userId` flows: sub-layout `data.user?.id` → `<AuthLayout userId>` → `<Sidebar userId>`. Required for My Profile and My Reports hrefs. All authenticated sub-layouts pass it. |

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
│   │   ├── components/ui/          ← Badge, Avatar, Button, Card, Input, Modal
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

Key endpoints active as of 2026-05-20:
- Auth: login, register, verify-email, refresh, logout, forgot-password, reset-password, step-up
- Subjects: `GET /subjects`, `POST /subjects/suggest`, admin CRUD at `/admin/subjects`
- Courses: `POST /courses { subject_id, age_categories, description? }`
- Sessions: `POST /sessions`, `PATCH /sessions/:id/status { status }`, ratings at `/sessions/:id/rating`
- Reports: `POST /reports/:id/share`, public `GET /reports/share/:token`
- Recurring: `POST/GET/PUT/DELETE /sessions/recurring`
- Search (public, no auth): `GET /search/courses`, `GET /search/teachers`
- Ratings: `POST /sessions/:id/rating`, `GET /sessions/:id/rating`
- Teachers (public, no auth): `GET /teachers/featured`, `GET /teachers/:user_id`
- Students: `GET /students` (teacher auth — returns assigned students list)
- Admin: `PATCH /admin/teachers/:id/featured` (toggles is_featured, returns `{ user_id, is_featured }`)
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

The app is **feature-complete** against the design handoffs. Remaining work is QA only.

**Priority 1 — Runtime QA (use `docs/qa-checklist.md`)**
1. Test Calendar Add Session form end-to-end (`POST /sessions`, session appears on calendar)
2. Test Availability CRUD end-to-end (Add/Edit/Delete slots — verify `slot.id` field works)
3. Test Course enrollment (admin: "Enroll Student" → `POST /courses/:id/enroll`, count +1)
4. Test admin restructure — Overview/Teachers/Students/Subjects pages all load and actions work

**Priority 2 — Design + Mobile QA**
5. Visual verification — open each `handoffs/design_handoff_mutawazin/Stage*.html` in browser, compare against live app, note and fix gaps
6. Mobile testing — open DevTools at 375px, test hamburger sidebar drawer, verify all pages are usable
