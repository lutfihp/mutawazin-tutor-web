# UI Polish — Badges & Text Contrast
**Date:** 2026-05-24
**Scope:** Three small visual tweaks across reports, student profile, and teacher profile.

---

## Changes

### 1. Remove attendance badge from report list (`reports/[studentId]/+page.svelte`)
Delete `<Badge variant={attendanceVariant(...)} label={report.attendance} />` from each report card header.
- `attendanceVariant` helper stays (used elsewhere, may be reused).
- Attendance filter dropdown stays.
- No data or logic changes.

### 2. Age label on student profile (`students/[id]/+page.svelte`)
Change badge label from `String(profile.age)` to `` `${profile.age} years old` ``.
- Only shown when `profile.age != null` (existing gate unchanged).
- Only visible to own student or admin (existing visibility gate unchanged).

### 3. Age category text contrast on teacher profile course cards (`teachers/[id]/+page.svelte`)
Change `text-text3` → `text-text2` on the age categories line inside each course card.
- `text-text3` is the lightest muted tone; `text-text2` is one step darker and readable as secondary info.
- No layout or structure changes.

---

## Files touched
- `src/routes/reports/[studentId]/+page.svelte`
- `src/routes/students/[id]/+page.svelte`
- `src/routes/teachers/[id]/+page.svelte`
