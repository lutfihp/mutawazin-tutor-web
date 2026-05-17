# Course Catalog — Admin Management + Teacher Suggest Flow

**Date:** 2026-05-17
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-17-fe-handoff-delta.md` section 5

## Context

A new course catalog system lets teachers suggest course entries and admins approve/reject them. This spec covers the admin management UI and the teacher "suggest new entry" flow from the courses page.

---

## Admin side — `/admin` page

### Sidebar

Add a new entry to the admin nav in `src/lib/components/layout/Sidebar.svelte`:
```typescript
{ id: 'catalog', labelKey: 'nav.catalog', href: '/admin#catalog', icon: BookOpen }
```

### New "Pending Catalog Suggestions" card

Add below the All Users card in `src/routes/admin/+page.svelte`:

- Section anchor: `<div id="catalog"></div>`
- Fetch on mount: `GET /admin/catalog?status=pending`
- Table columns: Name / Subject / Age Categories / Suggested By / Actions
- Actions: "Approve" (success variant) + "Reject" (danger variant) buttons
- Approve → `PATCH /admin/catalog/:id/verify { action: "approve" }` → remove row optimistically
- Reject → same with `"reject"`
- Empty state: "No pending catalog suggestions."

`CatalogEntry` shape:
```typescript
{ id, name, subject, age_categories, status, suggested_by_teacher_id }
```

---

## Teacher side — `/courses` page

### "Suggest new entry" in Create Course modal

After the catalog entry `<select>`, add:
```
+ Suggest new entry
```
Clicking it toggles the modal into "suggest" mode, replacing the picker with 3 fields:
- **Name** (text, required)
- **Subject** (text, required)
- **Age categories** (chip group: Kids / Teens / Adults, multi-select)

Submit → `POST /catalog/suggest { name, subject, age_categories }`

On success: show inline message "Your suggestion is pending admin review. A draft course has been added." then close modal and refresh courses list.

On cancel: toggle back to the catalog picker view.

---

## New locale keys needed

Under `courses` namespace:
- `courses.suggestEntry`: "+ Suggest new entry"
- `courses.suggestTitle`: "Suggest New Course"
- `courses.suggestSuccess`: "Suggestion submitted. A draft course has been created for you."
- `courses.suggestCancelBack`: "← Back to catalog"

Under `dashboard.admin` namespace:
- `dashboard.admin.pendingCatalog`: "Pending Catalog Suggestions"
- `dashboard.admin.noPendingCatalog`: "No pending catalog suggestions."
- `dashboard.admin.catalogName`: "Course Name"

---

## Files changed

| File | Change |
|---|---|
| `src/lib/components/layout/Sidebar.svelte` | Add "Catalog" admin nav item |
| `src/routes/admin/+page.svelte` | Add pending catalog card + fetch + approve/reject actions |
| `src/routes/courses/+page.svelte` | Add suggest flow inside create modal |
| `src/locales/en.json` | New locale keys |
| `src/locales/id.json` | New locale keys (Indonesian) |
