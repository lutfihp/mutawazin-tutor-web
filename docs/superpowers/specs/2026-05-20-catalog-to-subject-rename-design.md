# Catalog → Subject Rename Design

**Date:** 2026-05-20
**Goal:** Rename all "catalog" references to "subject" across the frontend codebase so future developers encounter consistent terminology matching the backend API (`/subjects`).

**No behaviour changes.** Build must pass with 0 errors before and after.

---

## Scope: 6 files, ~51 occurrences

| File | Type of change |
|---|---|
| `src/locales/en.json` | Rename 12 i18n keys + fix 5 display values |
| `src/locales/id.json` | Same 12 key renames + fix 5 display values (Indonesian) |
| `src/lib/components/layout/Sidebar.svelte` | 3 renames (nav item id, labelKey, href) |
| `src/routes/admin/+page.svelte` | 8 state vars + 4 functions + anchor id + all `$t` references |
| `src/routes/courses/+page.svelte` | 3 state vars + 2 functions + 2 HTML ids + `$t` references |
| `src/routes/register/teacher/+page.svelte` | 2 state vars + 1 `$t` reference |

---

## 1. i18n Key Renames

### en.json

| Old key | New key | Old value | New value |
|---|---|---|---|
| `nav.catalog` | `nav.subjects` | "Subjects" | (unchanged) |
| `dashboard.admin.pendingCatalog` | `dashboard.admin.pendingSubjects` | "Pending Catalog Suggestions" | "Pending Subject Suggestions" |
| `dashboard.admin.noPendingCatalog` | `dashboard.admin.noPendingSubjects` | "No pending catalog suggestions." | "No pending subject suggestions." |
| `dashboard.admin.waitingCatalog` | `dashboard.admin.waitingSubjects` | "{n} pending" | (unchanged) |
| `dashboard.admin.createCatalog` | `dashboard.admin.createSubject` | "+ Create Entry" | (unchanged) |
| `dashboard.admin.createCatalogTitle` | `dashboard.admin.createSubjectTitle` | "Create Subject Entry" | (unchanged) |
| `dashboard.admin.catalogName` | `dashboard.admin.subjectName` | "Course Name" | "Subject Name" |
| `dashboard.admin.catalogApprove` | `dashboard.admin.subjectApprove` | "Approve" | (unchanged) |
| `dashboard.admin.catalogReject` | `dashboard.admin.subjectReject` | "Reject" | (unchanged) |
| `auth.registerTeacher.catalogHelper` | `auth.registerTeacher.subjectHelper` | (unchanged) | (unchanged) |
| `courses.modal.catalogLabel` | `courses.modal.subjectLabel` | "Course from catalog" | "Subject" |
| `courses.modal.catalogPlaceholder` | `courses.modal.subjectPlaceholder` | "Select a course entry..." | "Select a subject..." |

Also update the **value only** (key stays the same):
- `courses.suggestCancelBack` value: "← Back to catalog" → "← Back to subjects"

### id.json

Same 12 key renames plus value fixes in Indonesian:
- `dashboard.admin.pendingSubjects` value: "Saran Katalog Menunggu" → "Saran Mata Pelajaran Menunggu"
- `dashboard.admin.noPendingSubjects` value: "Tidak ada saran katalog yang menunggu." → "Tidak ada saran mata pelajaran yang menunggu."
- `dashboard.admin.subjectName` value: "Nama Kursus" → "Nama Mata Pelajaran"
- `courses.modal.subjectLabel` value: "Kursus dari katalog" → "Mata Pelajaran"
- `courses.modal.subjectPlaceholder` value: "Pilih entri kursus..." → "Pilih mata pelajaran..."
- `courses.suggestCancelBack` value: "← Kembali ke katalog" → "← Kembali ke mata pelajaran"

---

## 2. Sidebar.svelte

Three changes in the admin nav item (line 32):

```svelte
// Before
{ id: 'catalog', labelKey: 'nav.catalog', href: '/admin#catalog', icon: BookOpen },

// After
{ id: 'subjects', labelKey: 'nav.subjects', href: '/admin#subjects', icon: BookOpen },
```

---

## 3. admin/+page.svelte

### State variables (lines 73–82)

| Old | New |
|---|---|
| `pendingCatalog` | `pendingSubjects` |
| `catalogActionLoading` | `subjectActionLoading` |
| `createCatalogOpen` | `createSubjectOpen` |
| `newCatalogName` | `newSubjectName` |
| `newCatalogSubject` | `newSubjectField` (currently unused — keep rename for consistency) |
| `newCatalogAges` | `newSubjectAges` |
| `createCatalogLoading` | `createSubjectLoading` |
| `createCatalogFormEl` | `createSubjectFormEl` |

### Functions

| Old | New |
|---|---|
| `toggleCatalogAge` | `toggleSubjectAge` |
| `handleCreateCatalog` | `handleCreateSubject` |
| `fetchPendingCatalog` | `fetchPendingSubjects` |
| `handleCatalogAction` | `handleSubjectAction` |

### Template

- `<div id="catalog">` → `<div id="subjects">`
- All `$t('dashboard.admin.pendingCatalog')` → `$t('dashboard.admin.pendingSubjects')`
- All `$t('dashboard.admin.noPendingCatalog')` → `$t('dashboard.admin.noPendingSubjects')`
- All `$t('dashboard.admin.waitingCatalog'...)` → `$t('dashboard.admin.waitingSubjects'...)`
- All `$t('dashboard.admin.createCatalog')` → `$t('dashboard.admin.createSubject')`
- All `$t('dashboard.admin.createCatalogTitle')` → `$t('dashboard.admin.createSubjectTitle')`
- All `$t('dashboard.admin.catalogName')` → `$t('dashboard.admin.subjectName')`
- All `$t('dashboard.admin.catalogApprove')` → `$t('dashboard.admin.subjectApprove')`
- All `$t('dashboard.admin.catalogReject')` → `$t('dashboard.admin.subjectReject')`
- `<!-- Catalog management -->` comment → `<!-- Subject management -->`
- `<!-- Pending Catalog Suggestions -->` → `<!-- Pending Subject Suggestions -->`
- `<!-- Create Catalog Modal -->` → `<!-- Create Subject Modal -->`
- `id="catalogName"` input → `id="subjectNameInput"` (avoids clashing with the i18n key rename)

---

## 4. courses/+page.svelte

### State variables

| Old | New |
|---|---|
| `newCatalogId` | `newSubjectId` |
| `catalogEntries` | `subjectEntries` |
| `catalogLoading` | `subjectLoading` |

### Functions

| Old | New |
|---|---|
| `loadCatalog` | `loadSubjects` |
| `suggestCatalogEntry` | `suggestSubjectEntry` |

### Template

- `id="catalogEntry"` → `id="subjectEntry"`
- `document.getElementById('catalogEntry')` → `document.getElementById('subjectEntry')`
- `$t('courses.modal.catalogLabel')` → `$t('courses.modal.subjectLabel')`
- `$t('courses.modal.catalogPlaceholder')` → `$t('courses.modal.subjectPlaceholder')`
- Button that calls `loadCatalog()` → calls `loadSubjects()`
- `<!-- Catalog entry multi-select -->` comment → `<!-- Subject multi-select -->`

---

## 5. register/teacher/+page.svelte

### State variables

| Old | New |
|---|---|
| `catalogEntries` | `subjectEntries` |
| `catalogEntryIds` | `subjectIds` |

### Template

- `$t('auth.registerTeacher.catalogHelper')` → `$t('auth.registerTeacher.subjectHelper')`
- `<!-- Catalog entry multi-select -->` comment → `<!-- Subject multi-select -->`
