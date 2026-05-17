# Breaking Fixes — Subject Endpoints + Age Categories + Course Model

**Date:** 2026-05-18
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-18-fe-handoff-delta-v2.md` sections 2, 3

## Context

Backend renamed all `/catalog` endpoints to `/subjects` and expanded age categories from 3 values to 5. All existing frontend calls to `/catalog` and all hardcoded `"kids"/"teens"/"adults"` strings are broken.

---

## 1. Age categories — locale + UI

### Old values (remove)
`"kids"`, `"teens"`, `"adults"`

### New values (add)
| Value | English | Indonesian |
|---|---|---|
| `"pre-school"` | Pre-school | Pra-sekolah |
| `"elementary"` | Elementary | Sekolah Dasar |
| `"middle-school"` | Middle School | Sekolah Menengah Pertama |
| `"high-school"` | High School | Sekolah Menengah Atas |
| `"general"` | General | Umum |

### Files to update

**`src/locales/en.json`** — under `courses`:
- Remove: `"ageKids"`, `"ageTeens"`, `"ageAdults"`
- Add: `"agePreSchool"`, `"ageElementary"`, `"ageMiddleSchool"`, `"ageHighSchool"`, `"ageGeneral"`

**`src/locales/id.json`** — same structure, Indonesian values.

**All UI components** that hardcode `['Kids', ...]`, `['Teens', ...]`, `['Adults', ...]` age chip groups:
- `src/routes/courses/+page.svelte` — filter chip group + create/suggest modal age chips
- `src/routes/admin/+page.svelte` — catalog create modal age chips
- `src/routes/calendar/+page.svelte` — (no age filter, no change needed)

Replace every age chip array with:
```svelte
[['pre-school', $t('courses.agePreSchool')], ['elementary', $t('courses.ageElementary')],
 ['middle-school', $t('courses.ageMiddleSchool')], ['high-school', $t('courses.ageHighSchool')],
 ['general', $t('courses.ageGeneral')]]
```

---

## 2. Subject endpoints — rename all `/catalog` calls

### `src/routes/courses/+page.svelte`
- `GET /catalog?status=verified` → `GET /subjects?status=verified`
- `POST /catalog/suggest` → `POST /subjects/suggest`
- `POST /courses` body: `catalog_entry_id` → `subject_id`

### `src/routes/register/teacher/+page.svelte`
- `GET /catalog?status=verified` → `GET /subjects?status=verified`
- Register body: `catalog_entry_ids` → `subject_ids`

### `src/routes/admin/+page.svelte`
- `GET /admin/catalog?status=pending` → `GET /admin/subjects?status=pending`
- `PATCH /admin/catalog/:id/verify` → `PATCH /admin/subjects/:id/verify`
- `POST /admin/catalog` → `POST /admin/subjects`

---

## 3. Course model — `age_categories` now on Course

`PUT /courses/:id` now accepts `{ age_categories?, price_by_age_category?, description? }`. No frontend edit form exists yet for courses, so no change needed beyond fixing the POST body.

`POST /courses` new body:
```typescript
{ subject_id: string, age_categories: string[], description?: string }
```

The create course modal currently only sends `{ catalog_entry_id, description }`. It needs to also collect `age_categories` and send `subject_id` instead of `catalog_entry_id`.

**Update in `src/routes/courses/+page.svelte`:**
- Add an age category multi-select to the create course modal (same 5-chip pattern)
- Change submit body: `catalog_entry_id` → `subject_id`; add `age_categories: newAgeCategories`

---

## Files changed

| File | Change |
|---|---|
| `src/locales/en.json` | Remove 3 old age keys, add 5 new ones |
| `src/locales/id.json` | Same in Indonesian |
| `src/routes/courses/+page.svelte` | Endpoint renames + body + age chips |
| `src/routes/register/teacher/+page.svelte` | Endpoint rename + body field rename |
| `src/routes/admin/+page.svelte` | Endpoint renames |
