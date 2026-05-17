# Breaking Fixes — Course Model + Teacher Register + Teacher Profile

**Date:** 2026-05-17
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-17-fe-handoff-delta.md` sections 2, 3, 4

## Context

Backend changes on 2026-05-17 broke three existing pages. This spec covers the minimum required fixes so existing flows work again. No new features.

---

## 1. `/courses` page — `src/routes/courses/+page.svelte`

### Display fix
Course cards use `course.title`. Field was renamed to `course.name`. Replace every reference:
- `course.title` → `course.name`

### Create Course modal fix
Old body: `{ title, description, subject, age_categories }`
New body: `{ catalog_entry_id, description? }`

The modal needs a **catalog entry picker** instead of the three free-form fields:
- On modal open: fetch `GET /catalog?status=verified` → `CatalogEntry[]`
- Render as `<select>`: each option shows `entry.name` (with subject in parentheses), value = `entry.id`
- Keep the `description` textarea (optional)
- Submit sends `{ catalog_entry_id: selectedId, description }`

### Edit Course
`PUT /courses/:id` now only accepts `{ description }`. Remove any title/subject/age_categories fields from the edit form.

---

## 2. `/register/teacher` page — `src/routes/register/teacher/+page.svelte`

Old field: `subjects: string[]` (free-form tag input)
New field: `catalog_entry_ids: string[]` (IDs of verified catalog entries, optional)

### Catalog entry multi-select
- On mount: fetch `GET /catalog?status=verified`
- Render as a scrollable checkbox list grouped by `subject`
- Each item shows the entry name; checking it adds the `id` to `catalog_entry_ids`
- Optional — user can submit with empty selection (`[]`)
- Submit body: replace `subjects` with `catalog_entry_ids`

---

## 3. `/teachers/[id]` page — `src/routes/teachers/[id]/+page.svelte`

### Remove subject editing in edit mode
- Remove the `+ Add subject` dashed pill button
- Remove the subject tag-input logic from `PUT /teachers/me` payload — subjects field is no longer accepted
- `PUT /teachers/me` body is now only `{ full_name?, bio? }`
- Subject badges remain visible (read-only, derived from profile response)

---

## New shared API call

Both pages above need `GET /catalog?status=verified`. No shared component needed — each page fetches independently on mount.

`CatalogEntry` shape:
```typescript
{ id: string, name: string, subject: string, age_categories: string[], status: string }
```

---

## Files changed

| File | Change |
|---|---|
| `src/routes/courses/+page.svelte` | `title` → `name`, create modal catalog picker, edit body fix |
| `src/routes/register/teacher/+page.svelte` | subjects tag input → catalog entry multi-select |
| `src/routes/teachers/[id]/+page.svelte` | remove subject editing, fix PUT body |
