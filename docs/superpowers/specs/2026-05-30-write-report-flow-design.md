# Design: Write Report Flow + Dashboard Report Titles

**Date:** 2026-05-30
**Scope:** Teacher dashboard — two related fixes

---

## Problem

1. **Recent Reports titles show raw MongoDB IDs** — `{report.student_id} · {report.session_id}` at `src/routes/dashboard/+page.svelte:134`. Delta v12 backend now returns `subject_name`, `student_name`, and `session_date` on each `recent_reports` item — the frontend just needs to use them.

2. **"Write Report" quick action does nothing** — href is `/dashboard#private-students` but no element with that id exists. The report creation flow also needs a rethink: it should be session-first (pick a completed session, pick a student from it, then write the report), not student-first.

---

## Solution

### Fix 1 — Report card titles (dashboard)

Use the three new delta v12 fields on each `recent_reports` item:

- **Primary line:** `{report.subject_name ?? 'No subject'} — {report.student_name ?? 'Unknown student'}`
- **Secondary line:** `formatDate(report.session_date ?? report.created_at)` — falls back to `created_at` for legacy reports pre-dating delta v12

Also add the `DashboardReportItem` type to `src/lib/api.ts`:

```typescript
export type DashboardReportItem = {
  id: string;
  session_id: string;
  student_id: string;
  teacher_id: string;
  scores: { topic: string; score: number; max_score: number }[];
  notes: string | null;
  created_at: string;
  subject_name: string | null;
  student_name: string | null;
  session_date: string | null;
};
```

---

### Fix 2 — `/reports/new` dedicated page

A new page at `src/routes/reports/new/` replaces the broken quick action link. The "Write Report" quick action href changes to `/reports/new`.

#### Flow (single URL, step machine)

```
step: 'sessions' | 'students' | 'form'
```

**Step 1 — Session list**
- On mount, fetch in parallel:
  - `GET /calendar/me?from=<30 days ago>&to=<today>` → filter `status === 'completed'`, sort by `starts_at` descending
  - `GET /students` (PaginatedResponse) → build `studentMap: Record<userId, full_name>`
- Show list: session title, `formatDate(starts_at)`, group/private badge
- Empty state if no completed sessions in the window
- Tap a row → `selectedSession = session`, advance to step 2

**Step 2 — Student picker**
- Back arrow header + selected session title
- Private session (`session.type === 'private'`): one student — `session.student_id` resolved from `studentMap`
- Group session (`session.type === 'group'`): fetch `GET /courses/:course_id` once → `enrolled_student_ids[]` → resolve names from `studentMap`; show Avatar + name per row
- Tap a row → `selectedStudent = { id, name }`, advance to step 3

**Step 3 — Report form**
- Back arrow header + "Report for {student_name}"
- Form fields (same pattern as existing reports page):
  - Score rows: topic, score, max (add/remove rows)
  - Notes textarea
  - Understanding level selector: A | B | C | D | E (optional)
- Submit → `POST /sessions/:session_id/reports { student_id, scores, notes, understanding_level? }`
- On success: inline "Report saved ✓" banner + "Write another" button that resets state to step 1

#### Auth guard

`+page.server.ts`: teacher role only — redirect `/login` if not authenticated, redirect `/dashboard` if authenticated but not a teacher.

---

## Files Changed

| File | Change |
|---|---|
| `src/routes/reports/new/+page.server.ts` | New — teacher-only auth guard |
| `src/routes/reports/new/+page.svelte` | New — 3-step page |
| `src/routes/dashboard/+page.svelte` | Update — report card display (fix 1) + Quick Action href → `/reports/new` |
| `src/lib/api.ts` | Update — add `DashboardReportItem` type |
| `src/locales/en.json` | Update — new i18n keys for the new page |
| `src/locales/id.json` | Update — same keys in Bahasa Indonesia |

---

## New i18n Keys

| Key | EN | ID |
|---|---|---|
| `reports.new.title` | Write a Report | Tulis Laporan |
| `reports.new.selectSession` | Select a completed session | Pilih sesi yang sudah selesai |
| `reports.new.selectStudent` | Select a student | Pilih siswa |
| `reports.new.noCompletedSessions` | No completed sessions in the last 30 days | Tidak ada sesi selesai dalam 30 hari terakhir |
| `reports.new.reportFor` | Report for {name} | Laporan untuk {name} |
| `reports.new.saved` | Report saved | Laporan berhasil disimpan |
| `reports.new.writeAnother` | Write another | Tulis laporan lain |

---

## Scope Boundary

- `src/routes/reports/[studentId]/+page.svelte` — **untouched**. Full report history and edit flow are unchanged.
- No new UI components — reuses `Card`, `Button`, `Badge`, `Avatar` from `$lib/components/ui/`.
- No per-student "Write Report" links on the dashboard My Students roster.
- The existing `formatDate` utility from `src/lib/utils/date.ts` handles both `YYYY-MM-DD` and ISO datetime strings via `new Date(iso)`. Use it for all date display including `session_date`.

---

## Edge Cases

| Scenario | Handling |
|---|---|
| No completed sessions (last 30 days) | Empty state message in step 1 |
| Group session with no course_id | Treat as private; show empty student list with "No students found" |
| Student not in `studentMap` | Display `student_id` truncated to 8 chars as fallback |
| `POST /sessions/:id/reports` fails | Show inline error in form; keep form open |
| `subject_name` or `student_name` null (delta v12 nulls) | `'No subject'` / `'Unknown student'` fallbacks on dashboard card |
