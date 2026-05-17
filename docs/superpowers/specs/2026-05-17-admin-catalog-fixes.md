# Admin Catalog Fixes + Footer Logo + Rename Subjects

**Date:** 2026-05-17
**Status:** Approved

## Context

Four small fixes across the admin page, footer, and locale files.

---

## 1. Admin dead links — fix sidebar count + catalog badge key

### Sidebar pending approvals count
`src/lib/components/layout/Sidebar.svelte` hardcodes `count: 0` for the Pending Approvals nav item. It never reflects the real pending count.

Fix: The admin nav items are declared as a static constant. Instead, add a `pendingCount` prop to Sidebar and pass the real count from the admin page after data loads.

- Add prop `pendingCount?: number` to Sidebar
- In the admin nav array, reference it: `count: pendingCount`
- In `/admin/+layout.svelte` or `+page.svelte`, pass the count once `pendingTeachers` and `pendingStudents` are loaded

### Catalog badge uses wrong locale key
The catalog card header badge uses `dashboard.admin.waitingTeachers` (wording: "N waiting" with teacher-specific key). Add a dedicated key.

- Add `"waitingCatalog": "{n} pending"` to `en.json` + `id.json`
- Replace the key in the catalog card badge

---

## 2. Admin create catalog entry

Add a "+ Create Entry" button to the catalog card header. On click, open a modal with:
- **Name** (text, required)
- **Subject** (text, required)
- **Age categories** (chip group: Kids / Teens / Adults, multi-select)

Submit → `POST /admin/catalog { name, subject, age_categories }`
Response 201: `CatalogEntry` with `status: "verified"` — immediately available for teachers to pick when creating courses.

On success: close modal, re-fetch `GET /admin/catalog?status=pending` to refresh the card.

### New locale keys
Under `dashboard.admin`:
- `"createCatalog": "+ Create Entry"`
- `"createCatalogTitle": "Create Catalog Entry"`

Under `dashboard.admin` in `id.json`:
- `"createCatalog": "+ Buat Entri"`
- `"createCatalogTitle": "Buat Entri Katalog"`

---

## 3. Footer logo — use light SVG variant

The footer (`background: #0F172A`) currently shows the `mark-primary.svg` inline (navy circle `#173343`) — nearly invisible against the dark background.

In `src/routes/+page.svelte`, in the footer logo `<a>` tag, replace the inline SVG block with:

```svelte
<img src="/brand-kit/svg/mark-light.svg" alt="" class="w-7 h-7 flex-none" aria-hidden="true" />
```

The `mark-light.svg` has a cream/light circle designed for dark surfaces.

---

## 4. Rename "Catalog" → "Subjects" nav label

Only the **navigation sidebar label** changes. Modal titles, field labels, and internal strings (e.g. "Course from catalog") are unchanged.

- `src/locales/en.json` → `nav.catalog`: `"Catalog"` → `"Subjects"`
- `src/locales/id.json` → `nav.catalog`: `"Katalog"` → `"Mata Pelajaran"`

---

## Files changed

| File | Change |
|---|---|
| `src/lib/components/layout/Sidebar.svelte` | Add `pendingCount` prop, wire to admin nav count |
| `src/routes/admin/+page.svelte` | Pass `pendingCount` to Sidebar; fix catalog badge key; add create catalog modal |
| `src/routes/+page.svelte` | Replace footer inline SVG with `mark-light.svg` img |
| `src/locales/en.json` | Rename `nav.catalog`; add `waitingCatalog`, `createCatalog`, `createCatalogTitle` |
| `src/locales/id.json` | Same as above in Indonesian |
