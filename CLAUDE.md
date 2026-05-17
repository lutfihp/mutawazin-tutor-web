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

## Current Status (as of 2026-05-18)

### Build status: ✅ Passes `npm run build` and `npm run check` (0 errors)

### Login flow: ✅ Confirmed working end-to-end with `admin@mutawazin.com` / `changeme123`

### What is complete

| Area | Content | Status |
|---|---|---|
| Foundation | SvelteKit scaffold, Tailwind v3, svelte-i18n, ui components, layouts, auth | ✅ |
| Auth | Login, Register (teacher/student), Email Verify, Account Step-Up, **Forgot Password**, **Reset Password** | ✅ |
| Landing | Hero (brand mark), Benefits, **Public search** (courses+teachers tabs), Featured Teachers, Footer | ✅ |
| Admin | Stats, Pending approvals (approve/reject), All Users (wired), **Create Teacher/Student**, **Subjects management** (pending list + approve/reject + create), live badge count | ✅ |
| Dashboards | Teacher dashboard, Student dashboard, Admin → `/admin` redirect | ✅ |
| Profiles | Teacher profile (bio edit, photo, new fields: mode/city/methods/uni/experience/achievements, rating display), Student profile | ✅ |
| Courses | Filter + grid, **create via subject picker**, **suggest new subject**, admin+teacher can create | ✅ |
| Calendar | Month grid, session pills + **recurring ↻ badge**, availability panel, **Recurring templates panel** (add/edit/delete), session detail with mode/price/**student rating** | ✅ |
| Reports | Score grid, create/edit modal with **understanding_level A–E**, **Share button + panel**, public `/report/share/:token` page | ✅ |
| Brand | SVG companion mark in Navbar+footer, brand kit in `static/brand-kit/`, `mark-light.svg` for dark footer | ✅ |
| Subjects | Renamed from "Catalog"; 5-level age categories (pre-school/elementary/middle-school/high-school/general) | ✅ |

### What is NOT done yet (known gaps for next session)

1. **Logout** — no logout button anywhere. Add to Navbar (authenticated mode). Calls `POST /auth/logout` then redirects to `/`.

2. **Sidebar profile hrefs** — "My Profile" links still point to `/dashboard`. Need `/teachers/{id}` and `/students/{id}` using `data.user.id` passed into the Sidebar.

3. **Calendar Add Session modal** — still a placeholder. Needs full form: type radio-pills, course/student select, date + start/end time, `POST /sessions`.

4. **Availability CRUD** — right panel "Add Slot" and edit/delete are not wired. Needs `POST /availability`, `PUT /availability/:id`, `DELETE /availability/:id`.

5. **Course enrollment** — `POST /courses/:id/enroll` button not built.

6. **Dashboard welcome names** — hardcoded `'Layla'` (teacher) and `'Nour'` (student). Should come from `dashboardData.full_name` or the JWT user.

7. **Teacher profile "Tutor" label** — hardcoded `"Tutor"` in featured teachers section of landing and in teacher cards.

8. **Mobile testing** — hamburger sidebar untested at 375px.

9. **`/teachers` public directory** — footer "Teachers" link goes nowhere. Needs `GET /teachers` API (not yet in contract).

10. **Content audit pre-mvp items** — Contact/Privacy Policy/Forgot Password links still `#` dead links. See `docs/content-audit.csv` for full list.

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
| **pendingApprovalCount store** | `src/lib/stores/adminBadge.ts` — written by the admin page, read by Sidebar for the live badge count. |

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
│       ├── admin/
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

Key endpoints active as of 2026-05-18:
- Auth: login, register, verify-email, refresh, logout, forgot-password, reset-password, step-up
- Subjects: `GET /subjects`, `POST /subjects/suggest`, admin CRUD at `/admin/subjects`
- Courses: `POST /courses { subject_id, age_categories, description? }`
- Sessions: `POST /sessions`, ratings at `/sessions/:id/rating`
- Reports: `POST /reports/:id/share`, public `GET /reports/share/:token`
- Recurring: `POST/GET/PUT/DELETE /sessions/recurring`
- Search (public, no auth): `GET /search/courses`, `GET /search/teachers`
- Ratings: `POST /sessions/:id/rating`, `GET /sessions/:id/rating`

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

**Priority 1 — Quick wins**
1. Logout button in Navbar (`POST /auth/logout` + redirect to `/`)
2. Dashboard welcome names — use real name from `dashboardData` or API response
3. Sidebar "My Profile" hrefs → `/teachers/{id}` and `/students/{id}`

**Priority 2 — Calendar completions**
4. Calendar Add Session full form (type radio, course/student select, date/time, `POST /sessions`)
5. Availability CRUD (`POST /availability`, `PUT/DELETE /availability/:id`)

**Priority 3 — Remaining features**
6. Course enrollment button (`POST /courses/:id/enroll`)
7. Visual verification against `handoffs/design_handoff_mutawazin/Stage*.html`
8. Mobile testing at 375px viewport
