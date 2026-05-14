# Mutawazin — Project Context for Claude Code

## What This Project Is

Mutawazin (Arabic for "balanced") is an online tutoring platform frontend built in SvelteKit. It connects teachers and students for group courses and 1-on-1 sessions.

**Working directory:** `d:\Codading Repo\mutawazin-tutor-web`
**SvelteKit app is at the repo root** — `src/`, `package.json`, etc. live directly in `d:\Codading Repo\mutawazin-tutor-web`
**Backend:** FastAPI at `http://localhost:8000` — not in this repo
**Design handoffs:** `design_handoff_mutawazin/` — high-fidelity HTML/JSX/CSS prototypes, use as visual reference

---

## Current Status (as of 2026-05-14)

### Build status: ✅ Passes `npm run build` and `npm run check` (0 errors)

### What is complete

All 12 implementation phases are done:

| Phase | Content | Status |
|---|---|---|
| 0 | SvelteKit scaffold + deps (Tailwind v3, svelte-i18n, lucide-svelte) | ✅ |
| 1 | tailwind.config.js with full design tokens, app.html (Inter font, skip-to-content), app.css | ✅ |
| 2 | svelte-i18n setup, en.json + id.json (complete translations for all pages) | ✅ |
| 3 | api.ts, auth/sidebar stores, avatar/date/cn utils, root layout files, focusTrap action | ✅ |
| 4 | Badge, Avatar, Button, Card, Input, Modal UI components | ✅ |
| 5 | Logo, Navbar (landing + app mode, lang toggle), Sidebar (desktop + mobile drawer), AuthLayout | ✅ |
| 6 | Login, Teacher Register (tag input + credentials), Student Register, Email Verification (3 states) | ✅ |
| 7 | Landing page (hero, benefits, featured teachers, footer) — SSR | ✅ |
| 8 | Teacher Dashboard, Student Dashboard, Admin Dashboard (stats + approval tables) | ✅ |
| 9 | Teacher Profile (inline bio edit, photo upload), Student Profile, Account Step-Up (2-step wizard) | ✅ |
| 10 | Courses (filters + grid + create modal), Calendar (month grid + session pills + availability), Reports (score grid + create/edit modal) | ✅ |
| 11-12 | Error page, build verification | ✅ |

### What is NOT done yet (known gaps to complete next session)

1. **`npm run dev` has not been visually tested in browser** — the build passes but UI hasn't been verified against the design handoff. This is the main thing to do next.

2. **Admin "All Users" tab** — the card renders but just shows a loading state. Need to wire `GET /admin/teachers` and `GET /admin/students` with client-side status filter.

3. **Sidebar nav `href` values for teacher/student profiles** — currently hardcoded to `/dashboard`. Need to use the actual user ID: `/teachers/{id}` and `/students/{id}`. Requires passing the user ID from the layout data into the Sidebar.

4. **Calendar Add Session modal** — currently a placeholder ("use the calendar to create sessions"). Needs the full form: type radio-pills, course/student select, date + start/end time inputs, `POST /sessions`.

5. **Availability CRUD in Calendar** — the right panel lists slots but the "Add Slot" and edit/delete buttons are not wired. Needs `POST /availability`, `PUT /availability/:id`, `DELETE /availability/:id`.

6. **Course enrollment** — teacher/admin should be able to enroll a student: `POST /courses/:id/enroll`. Button not yet built.

7. **Logout** — no logout button anywhere. Add to Navbar (authenticated mode) or Avatar dropdown. Calls `POST /auth/logout` then redirects to `/`.

8. **`postcss.config.js` may need a `plugins` format fix** — Tailwind v3 requires `{ tailwindcss: {}, autoprefixer: {} }`. Check the generated file matches this.

9. **Mobile hamburger sidebar** — implemented but untested on actual mobile viewport. Verify the drawer opens/closes and focus trap works correctly.

10. **`svelte-i18n` `$t()` with array values (calendar days)** — `$t('calendar.daysShort')` returns an array in JSON; this is non-standard. If it breaks, replace with a hardcoded array or a different key structure.

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
| **`any[]` for pending approval tables** | Admin page uses `any[]` for `pendingTeachers`/`pendingStudents` to allow mutable local state. Known `$state` capture warning is intentional. |

---

## Key File Locations

```
mutawazin-tutor-web/          ← repo root
├── tailwind.config.js              ← All design tokens (colors, shadows, radii, screens)
├── src/
│   ├── app.html                    ← Inter font, skip-to-content link
│   ├── app.css                     ← @tailwind directives, base overrides
│   ├── app.d.ts                    ← App.Locals and App.PageData types
│   ├── lib/
│   │   ├── api.ts                  ← Fetch wrapper with 401 refresh retry
│   │   ├── i18n.ts                 ← setupI18n(), setLang(), detectLang()
│   │   ├── actions/focusTrap.ts    ← Tab-cycle focus trap (Modal + Sidebar)
│   │   ├── stores/auth.ts          ← writable<User | null>
│   │   ├── stores/sidebar.ts       ← writable<boolean> sidebarOpen
│   │   ├── utils/avatar.ts         ← initials(), avatarColor()
│   │   ├── utils/date.ts           ← formatDate, calendarGrid, toISODate
│   │   ├── utils/cn.ts             ← class-name merge helper
│   │   ├── components/ui/          ← Badge, Avatar, Button, Card, Input, Modal
│   │   └── components/layout/      ← Navbar, Sidebar, AuthLayout
│   │       Logo.svelte             ← (at components/ root)
│   ├── locales/
│   │   ├── en.json                 ← Full English translations
│   │   └── id.json                 ← Full Bahasa Indonesia translations
│   └── routes/
│       ├── +layout.server.ts       ← JWT decode → locals.user; reads lang cookie
│       ├── +layout.ts              ← user.set(); setupI18n()
│       ├── +page.svelte            ← Landing page
│       ├── +page.server.ts         ← SSR fetch /teachers/featured
│       ├── login/
│       ├── register/teacher/, register/student/
│       ├── verify-email/
│       ├── dashboard/              ← Role-aware (teacher or student view)
│       ├── admin/
│       ├── teachers/[id]/
│       ├── students/[id]/
│       ├── account/step-up/
│       ├── courses/
│       ├── calendar/
│       └── reports/[studentId]/
```

---

## Design Reference

All visual specs are in `design_handoff_mutawazin/`:
- `original-handoff.md` — canonical design tokens, component specs, responsive breakpoints, interaction patterns
- `README.md` — same info but more detailed
- `Landing Page.html`, `Stage 2 - Auth.html`, `Stage 3 - Dashboards.html`, `Stage 4 - Features.html` — open in browser to see intended output
- CSS files (`auth.css`, `dashboards.css`, `features.css`) — exact spacing/shadow values

**Design tokens are in `tailwind.config.js`** — always use Tailwind classes, never inline hex values.

---

## How to Run

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npm run dev           # dev server at http://localhost:5173
npm run check         # TypeScript + Svelte type check (should be 0 errors)
npm run build         # production build (✅ confirmed passing)
npm run preview       # preview prod build
```

The FastAPI backend must be running at `http://localhost:8000` for API calls to work. Pages degrade gracefully when backend is offline (empty arrays, null data).

---

## What to Do Next Session

**Priority 1 — Visual verification**
Start `npm run dev`, open each page in the browser, and compare against the HTML prototypes in `design_handoff_mutawazin/`. Fix any layout/styling gaps.

**Priority 2 — Wire the missing functionality (see gaps above)**
Start with logout (quick win), then admin All Users tab, then Sidebar profile href fix, then calendar Add Session form.

**Priority 3 — Mobile testing**
Resize browser to 375px and verify: hamburger opens/closes drawer, sidebar drawer has working focus trap, all forms are usable.

**Priority 4 — Accessibility smoke test**
Tab through each auth form, verify focus trap in modals, check screen reader output with browser accessibility tree.
