# Public Search — Guest Browse on Landing Page

**Date:** 2026-05-17
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-17-fe-handoff-delta.md` section 6

## Context

Two new public endpoints (`GET /search/courses`, `GET /search/teachers`) allow guests to browse without logging in. A new search section is added to the landing page between the Benefits section and the Featured Teachers section.

---

## New section on landing page — `src/routes/+page.svelte`

### Position
Between `<!-- ── Benefits ──>` and `<!-- ── Featured Teachers ──>`.

### Section structure

```
id="courses"     ← fixes the /#courses dead link from the content audit
```

1. **Section heading**: eyebrow "Browse" + H2 "Find the right course or teacher"
2. **Search bar**: text input + "Search" button, debounced 300ms
3. **Tab switcher**: Courses | Teachers (controls which results render)
4. **Results grid**: same 3-col/2-col/1-col responsive grid as Featured Teachers section
5. **Empty state**: "No results for '...'" message

### Initial load
On `onMount`, fetch both with no query:
- `GET /search/courses` → show as course result cards
- `GET /search/teachers` → show as teacher result cards

Active tab switches which array is displayed — no extra fetch needed on tab switch.

### Course result card
Uses `CourseSearchResult`:
```typescript
{ catalog_entry_id, name, subject, age_categories, teachers: [{ user_id, full_name, photo_url }] }
```
Card shows: subject badge + course name + age category badges + teacher avatars row. No link (no course detail page yet).

### Teacher result card
Uses `TeacherSearchResult`:
```typescript
{ user_id, full_name, photo_url, subjects: string[], active_course_count: number }
```
Card shows: avatar + name + subject badges + "N active courses". Links to `/teachers/{user_id}`.

### API calls
- `GET /search/courses?q=&subject=&age_category=` — no auth
- `GET /search/teachers?q=` — no auth
- Debounce 300ms on input; on empty query fetch without `q` param

### Navbar fix
The dead Navbar anchor `href="/#courses"` → update to `href="/#courses"` (already matches the new section id).

---

## New locale keys needed

Under `landing` namespace:
- `landing.searchEyebrow`: "Browse"
- `landing.searchH2`: "Find the right course or teacher"
- `landing.searchTab_courses`: "Courses"
- `landing.searchTab_teachers`: "Teachers"
- `landing.searchPlaceholder`: "Search courses or teachers..."
- `landing.searchButton`: "Search"
- `landing.searchEmpty`: "No results for '{q}'"
- `landing.searchActiveCourses`: "{n} active courses"

---

## Files changed

| File | Change |
|---|---|
| `src/routes/+page.svelte` | New search section between Benefits and Featured Teachers |
| `src/locales/en.json` | New locale keys |
| `src/locales/id.json` | New locale keys (Indonesian) |
