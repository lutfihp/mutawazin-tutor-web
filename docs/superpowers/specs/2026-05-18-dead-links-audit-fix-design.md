# Dead Links & No-Op Buttons — Audit Fix Design

**Date:** 2026-05-18  
**Source:** `docs/content-audit.csv` — 28 items audited, decisions recorded by user

---

## Scope

Fix all 28 items from the content audit in one pass. Changes span: Navbar, Sidebar, Landing page, Dashboard (teacher + student), Courses page, Calendar page, Teachers profile page, and a new `/teachers` public directory page.

No new backend endpoints are needed except confirming `PATCH /sessions/{id}` accepts a `status` field — all required endpoints already exist.

---

## 1. Removals (delete the element)

These elements are removed with no replacement.

| File | Element | What to remove |
|---|---|---|
| `src/routes/+page.svelte` | Footer Blog / Contact / Privacy links | Remove the three `<a>` entries from the footer links array |
| `src/routes/+page.svelte` | Hero trust row | Remove the `<div>` block showing "2,400+ students" and "180 teachers" |
| `src/routes/+page.svelte` | Hero vignette card | Remove the entire decorative card with hardcoded teacher/session data |
| `src/routes/dashboard/+page.svelte` | Student streak count | Remove the `streakMeta` `<p>` line below the student welcome heading |
| `src/routes/dashboard/+page.svelte` | Student dashboard 'Message' button | Remove `<Button variant="secondary" size="sm">Message</Button>` from assigned-teacher card |
| `src/routes/teachers/[id]/+page.svelte` | Teachers profile 'Message' button | Remove the `<Button>` for messaging |
| `src/lib/components/layout/Navbar.svelte` | Bell notification icon | Remove the `<button>` wrapping `<Bell>` entirely |
| `src/lib/components/layout/Sidebar.svelte` | Teacher 'My Students' nav item | Remove the `students` entry from `navByRole.teacher` |

---

## 2. Simple Link Fixes (change href values)

| File | Element | Current `href` | New `href` |
|---|---|---|---|
| `src/lib/components/layout/Navbar.svelte` | 'Home' nav anchor | `/#` | `/` |
| `src/routes/dashboard/+page.svelte` | 'Write Report' quick action | `/reports/` | `/dashboard#private-students` |
| `src/lib/components/layout/Sidebar.svelte` | Teacher 'Reports' link | `/dashboard` | `/dashboard#private-students` |

---

## 3. Sidebar Profile Links — Wire User ID

The Sidebar currently has `My Profile` pointing to `/dashboard` for both roles, and `My Reports` pointing to `/dashboard` for students. These need the authenticated user's ID.

**Change:** The `userId` prop must flow through the component chain:

1. `Sidebar.svelte` — add `userId?: string = ''` prop; use it in the `navByRole` hrefs below
2. `AuthLayout.svelte` — add `userId?: string = ''` prop; forward it to `<Sidebar {role} {userId} />`
3. `dashboard/+layout.svelte` — pass `userId={data.user?.id ?? ''}` to `<AuthLayout>`
4. All other sub-layouts that render `<AuthLayout>` (`courses`, `calendar`, `reports/[studentId]`, `teachers/[id]`, `students/[id]`) — same: add `data` to props if not present, pass `userId`

| Nav item | New `href` |
|---|---|
| Teacher 'My Profile' | `/teachers/${userId}` |
| Student 'My Profile' | `/students/${userId}` |
| Student 'My Reports' | `/reports/${userId}` |

The `userId` prop defaults to `''` so the admin sidebar (which has no dynamic profile links) is unaffected.

---

## 4. Hardcoded Name & Data Fixes

### Dashboard welcome names
- Teacher: replace `{ name: 'Layla' }` with `{ name: d.full_name ?? data.user?.name ?? '' }`
- Student: replace `{ name: 'Nour' }` with `{ name: d.full_name ?? data.user?.name ?? '' }`

### Last session timing
- Replace hardcoded `'recently'` with `student.last_session_at ?? ''`. If the field comes back as an ISO string, format it with the existing `formatDate` util. If the field is absent from the API response, remove the line entirely — confirm at runtime.

### Teacher role label ('Tutor')
Two locations: `dashboard/+page.svelte:265` (assigned teacher card) and `teachers/[id]/+page.svelte`.
- Check if the API response includes a `title` field on the teacher object.
- If yes: use `teacher.title`.
- If no: replace the hardcoded `"Tutor"` string with `$t('common.tutor')` and add the key to `en.json` / `id.json`.

---

## 5. Courses Subject Filter — Dynamic

**File:** `src/routes/courses/+page.svelte`

In `onMount`, after the existing course fetch, also call `GET /subjects` (authenticated). Populate the `<select>` options from the response. Keep the existing "All subjects" default option. Fall back to the hardcoded list only if the fetch fails.

---

## 6. Logout Button

**File:** `src/lib/components/layout/Navbar.svelte`

Add a logout trigger in the authenticated section of the Navbar, after the avatar. Use a plain text link or small icon button labelled `$t('nav.logout')`.

```
import { request } from '$lib/api';
import { goto } from '$app/navigation';

async function logout() {
  try { await request('/auth/logout', { method: 'POST' }); } catch {}
  user.set(null);
  goto('/');
}
```

Use `request()` from `$lib/api` (handles the base URL and credentials). The `try/catch` ensures the user is always logged out client-side even if the server call fails.

Add `nav.logout` key to `en.json` (`"Sign out"`) and `id.json` (`"Keluar"`).

The auth cookie is cleared server-side by the `/auth/logout` endpoint; no client-side cookie manipulation needed.

---

## 7. Calendar Session Actions

**File:** `src/routes/calendar/+page.svelte`

Two buttons in the session detail modal currently have `onclick={() => {}}`.

### Cancel Session
- Show an inline confirmation prompt (`"Are you sure?"` toggle or a second click) before calling.
- Call `PATCH /sessions/{selectedSession.id}` with body `{ status: 'cancelled' }`.
- On success: update `selectedSession.status` in the reactive state and close the modal.
- On error: show an inline error message.

### Mark Completed
- No confirmation needed.
- Call `PATCH /sessions/{selectedSession.id}` with body `{ status: 'completed' }`.
- On success: update `selectedSession.status` and close the modal.

Both handlers need the session ID available from the modal's selected session state (already in scope as `selectedSession`).

---

## 8. New `/teachers` Public Directory Page

**Route:** `src/routes/teachers/+page.svelte` (new file — public, no auth required)

No `+page.server.ts` needed. This is a public CSR page — same pattern as the landing page. All data is fetched in `onMount`. The route is accessible without login.

### Data
Call `GET /teachers/featured` from `onMount` (CSR, same pattern as landing page public search). No auth header needed.

### Layout
- Reuse the public `<Navbar />` (no sidebar — this is a public page).
- Simple responsive grid of teacher cards (2-col mobile, 3-col desktop).
- Each card: avatar, full name, subjects as `<Badge>` chips, a "View Profile" link to `/teachers/{user_id}`.
- Loading skeleton while fetching; empty state if no results.

### Navbar & Footer links
The Footer 'Teachers' link and 'Browse all teachers' button both point to `/teachers` — these now resolve correctly once the route exists.

### No search/filter
This page shows only featured teachers from the API. No client-side filter UI.

---

## Files Changed Summary

| File | Change type |
|---|---|
| `src/routes/+page.svelte` | Remove hero vignette, trust row, Blog/Contact/Privacy footer links |
| `src/routes/dashboard/+page.svelte` | Fix welcome names, remove streak/Message, fix Write Report href, fix role label |
| `src/routes/courses/+page.svelte` | Dynamic subject filter |
| `src/routes/calendar/+page.svelte` | Implement Cancel + Mark Completed handlers |
| `src/routes/teachers/[id]/+page.svelte` | Remove Message button, fix role label |
| `src/lib/components/layout/Navbar.svelte` | Remove Bell, fix Home href, add Logout |
| `src/lib/components/layout/Sidebar.svelte` | Add `userId` prop, fix profile/reports hrefs, remove My Students |
| `src/lib/components/layout/AuthLayout.svelte` | Add `userId` prop, forward to Sidebar |
| `src/routes/dashboard/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` to `<AuthLayout>` |
| `src/routes/courses/+layout.svelte` | Pass `userId` to `<AuthLayout>` |
| `src/routes/calendar/+layout.svelte` | Pass `userId` to `<AuthLayout>` |
| `src/routes/reports/[studentId]/+layout.svelte` | Pass `userId` to `<AuthLayout>` |
| `src/routes/teachers/[id]/+layout.svelte` | Pass `userId` to `<AuthLayout>` |
| `src/routes/students/[id]/+layout.svelte` | Pass `userId` to `<AuthLayout>` |
| `src/routes/teachers/+page.svelte` | **New file** — featured teachers grid (public, CSR only) |
| `src/locales/en.json` | Add `nav.logout`, `common.tutor` keys |
| `src/locales/id.json` | Add `nav.logout`, `common.tutor` keys |
