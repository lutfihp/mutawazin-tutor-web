# Catalog → Subject Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename every "catalog" identifier in the frontend to "subject" so future developers encounter consistent terminology matching the backend `/subjects` API.

**Architecture:** Pure rename — no behaviour changes. Six files touched in isolation. Each task ends with `npm run check` to catch any missed references before committing.

**Tech Stack:** SvelteKit (Svelte 5), svelte-i18n JSON locale files, Tailwind v3.

**Important collision fix:** `courses.modal.subjectLabel` and `courses.modal.subjectPlaceholder` already exist in the locale files (used for the subject text field). The old `catalogLabel`/`catalogPlaceholder` keys are renamed to `subjectPickerLabel`/`subjectPickerPlaceholder` to avoid a collision.

---

## File Map

| File | Changes |
|---|---|
| `src/locales/en.json` | 12 key renames + 6 value fixes |
| `src/locales/id.json` | 12 key renames + 6 value fixes (Indonesian) |
| `src/lib/components/layout/Sidebar.svelte` | 3 string changes |
| `src/routes/admin/+page.svelte` | 8 state vars + 4 functions + all `$t` references + anchor id |
| `src/routes/courses/+page.svelte` | 3 state vars + 2 functions + HTML ids + `$t` references |
| `src/routes/register/teacher/+page.svelte` | 2 state vars + 1 `$t` reference |

---

## Task 1: Locale files — en.json

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 1: Rename `nav.catalog` key**

Find:
```json
    "catalog": "Subjects",
    "logout": "Sign out"
```
Replace with:
```json
    "subjects": "Subjects",
    "logout": "Sign out"
```

- [ ] **Step 2: Rename `auth.registerTeacher.catalogHelper` key**

Find:
```json
      "catalogHelper": "Optional — select courses you'd like to offer. You can add more later.",
```
Replace with:
```json
      "subjectHelper": "Optional — select courses you'd like to offer. You can add more later.",
```

- [ ] **Step 3: Rename admin catalog keys + fix display values**

Find:
```json
      "waitingCatalog": "{n} pending",
      "createCatalog": "+ Create Entry",
      "createCatalogTitle": "Create Subject Entry",
```
Replace with:
```json
      "waitingSubjects": "{n} pending",
      "createSubject": "+ Create Entry",
      "createSubjectTitle": "Create Subject Entry",
```

- [ ] **Step 4: Rename pending/name/approve/reject catalog keys + fix display values**

Find:
```json
      "pendingCatalog": "Pending Catalog Suggestions",
      "noPendingCatalog": "No pending catalog suggestions.",
      "catalogName": "Course Name",
      "catalogApprove": "Approve",
      "catalogReject": "Reject",
```
Replace with:
```json
      "pendingSubjects": "Pending Subject Suggestions",
      "noPendingSubjects": "No pending subject suggestions.",
      "subjectName": "Subject Name",
      "subjectApprove": "Approve",
      "subjectReject": "Reject",
```

- [ ] **Step 5: Fix `courses.suggestCancelBack` display value (key unchanged)**

Find:
```json
    "suggestCancelBack": "← Back to catalog",
```
Replace with:
```json
    "suggestCancelBack": "← Back to subjects",
```

- [ ] **Step 6: Rename `courses.modal.catalogLabel` and `courses.modal.catalogPlaceholder`**

Find:
```json
      "catalogLabel": "Course from catalog",
      "catalogPlaceholder": "Select a course entry...",
```
Replace with:
```json
      "subjectPickerLabel": "Subject",
      "subjectPickerPlaceholder": "Select a subject...",
```

- [ ] **Step 7: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/locales/en.json
git commit -m "refactor: rename catalog i18n keys to subject in en.json"
```

---

## Task 2: Locale files — id.json

**Files:**
- Modify: `src/locales/id.json`

- [ ] **Step 1: Rename `nav.catalog` key**

Find:
```json
    "catalog": "Mata Pelajaran",
    "logout": "Keluar"
```
Replace with:
```json
    "subjects": "Mata Pelajaran",
    "logout": "Keluar"
```

- [ ] **Step 2: Rename `auth.registerTeacher.catalogHelper` key**

Find:
```json
      "catalogHelper": "Opsional — pilih kursus yang ingin Anda tawarkan. Anda bisa menambahkan lebih banyak nanti.",
```
Replace with:
```json
      "subjectHelper": "Opsional — pilih kursus yang ingin Anda tawarkan. Anda bisa menambahkan lebih banyak nanti.",
```

- [ ] **Step 3: Rename admin catalog keys + fix display values**

Find the three keys in the admin section. First locate the Indonesian equivalents by searching for `waitingCatalog`. Then replace:
```json
      "waitingCatalog": "{n} menunggu",
      "createCatalog": "+ Buat Entri",
      "createCatalogTitle": "Buat Entri Mata Pelajaran",
```
Replace with:
```json
      "waitingSubjects": "{n} menunggu",
      "createSubject": "+ Buat Entri",
      "createSubjectTitle": "Buat Entri Mata Pelajaran",
```

- [ ] **Step 4: Rename pending/name/approve/reject catalog keys + fix display values**

Find:
```json
      "pendingCatalog": "Saran Katalog Menunggu",
      "noPendingCatalog": "Tidak ada saran katalog yang menunggu.",
      "catalogName": "Nama Kursus",
      "catalogApprove": "Setujui",
      "catalogReject": "Tolak",
```
Replace with:
```json
      "pendingSubjects": "Saran Mata Pelajaran Menunggu",
      "noPendingSubjects": "Tidak ada saran mata pelajaran yang menunggu.",
      "subjectName": "Nama Mata Pelajaran",
      "subjectApprove": "Setujui",
      "subjectReject": "Tolak",
```

- [ ] **Step 5: Fix `courses.suggestCancelBack` display value (key unchanged)**

Find:
```json
    "suggestCancelBack": "← Kembali ke katalog",
```

If this string exists, replace with:
```json
    "suggestCancelBack": "← Kembali ke mata pelajaran",
```

If the value is different in the file, update it to `"← Kembali ke mata pelajaran"`.

- [ ] **Step 6: Rename `courses.modal.catalogLabel` and `courses.modal.catalogPlaceholder`**

Find:
```json
      "catalogLabel": "Kursus dari katalog",
      "catalogPlaceholder": "Pilih entri kursus...",
```
Replace with:
```json
      "subjectPickerLabel": "Mata Pelajaran",
      "subjectPickerPlaceholder": "Pilih mata pelajaran...",
```

- [ ] **Step 7: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/locales/id.json
git commit -m "refactor: rename catalog i18n keys to subject in id.json"
```

---

## Task 3: Sidebar.svelte

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte:32`

- [ ] **Step 1: Update the admin catalog nav item**

Find:
```svelte
			{ id: 'catalog',   labelKey: 'nav.catalog',               href: '/admin#catalog',           icon: BookOpen },
```
Replace with:
```svelte
			{ id: 'subjects',  labelKey: 'nav.subjects',              href: '/admin#subjects',          icon: BookOpen },
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/layout/Sidebar.svelte
git commit -m "refactor: rename catalog nav item to subjects in Sidebar"
```

---

## Task 4: admin/+page.svelte

**Files:**
- Modify: `src/routes/admin/+page.svelte`

Use `replace_all: true` for each rename since each variable/function name appears multiple times.

- [ ] **Step 1: Rename the state block comment and all state variables**

Find:
```svelte
	// Catalog management
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let pendingCatalog = $state<any[]>([]);
	let catalogActionLoading = $state<string | null>(null);
	let createCatalogOpen = $state(false);
	let newCatalogName = $state('');
	let newCatalogSubject = $state('');
	let newCatalogAges = $state<string[]>([]);
	let createCatalogLoading = $state(false);
	let createCatalogFormEl = $state<HTMLFormElement | null>(null);
```
Replace with:
```svelte
	// Subject management
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let pendingSubjects = $state<any[]>([]);
	let subjectActionLoading = $state<string | null>(null);
	let createSubjectOpen = $state(false);
	let newSubjectName = $state('');
	let newSubjectField = $state('');
	let newSubjectAges = $state<string[]>([]);
	let createSubjectLoading = $state(false);
	let createSubjectFormEl = $state<HTMLFormElement | null>(null);
```

- [ ] **Step 2: Rename `toggleCatalogAge` function (replace_all)**

Find (replace_all): `toggleCatalogAge`
Replace with: `toggleSubjectAge`

Find (replace_all): `newCatalogAges`
Replace with: `newSubjectAges`

- [ ] **Step 3: Rename `handleCreateCatalog` and its body references (replace_all)**

Find (replace_all): `handleCreateCatalog`
Replace with: `handleCreateSubject`

Find (replace_all): `newCatalogName`
Replace with: `newSubjectName`

Find (replace_all): `createCatalogLoading`
Replace with: `createSubjectLoading`

Find (replace_all): `createCatalogOpen`
Replace with: `createSubjectOpen`

Find (replace_all): `createCatalogFormEl`
Replace with: `createSubjectFormEl`

- [ ] **Step 4: Rename `fetchPendingCatalog` and `handleCatalogAction` (replace_all)**

Find (replace_all): `fetchPendingCatalog`
Replace with: `fetchPendingSubjects`

Find (replace_all): `pendingCatalog`
Replace with: `pendingSubjects`

Find (replace_all): `handleCatalogAction`
Replace with: `handleSubjectAction`

Find (replace_all): `catalogActionLoading`
Replace with: `subjectActionLoading`

- [ ] **Step 5: Update the anchor id**

Find:
```svelte
	<div id="catalog"></div>
```
Replace with:
```svelte
	<div id="subjects"></div>
```

- [ ] **Step 6: Update all `$t` key references in the template**

Find (replace_all): `$t('dashboard.admin.pendingCatalog'`
Replace with: `$t('dashboard.admin.pendingSubjects'`

Find (replace_all): `$t('dashboard.admin.noPendingCatalog'`
Replace with: `$t('dashboard.admin.noPendingSubjects'`

Find (replace_all): `$t('dashboard.admin.waitingCatalog'`
Replace with: `$t('dashboard.admin.waitingSubjects'`

Find (replace_all): `$t('dashboard.admin.createCatalog'`
Replace with: `$t('dashboard.admin.createSubject'`

Find (replace_all): `$t('dashboard.admin.createCatalogTitle'`
Replace with: `$t('dashboard.admin.createSubjectTitle'`

Find (replace_all): `$t('dashboard.admin.catalogName'`
Replace with: `$t('dashboard.admin.subjectName'`

Find (replace_all): `$t('dashboard.admin.catalogApprove'`
Replace with: `$t('dashboard.admin.subjectApprove'`

Find (replace_all): `$t('dashboard.admin.catalogReject'`
Replace with: `$t('dashboard.admin.subjectReject'`

- [ ] **Step 7: Update HTML id and modal comments**

Find:
```svelte
	<!-- Pending Catalog Suggestions -->
```
Replace with:
```svelte
	<!-- Pending Subject Suggestions -->
```

Find:
```svelte
	<!-- Create Catalog Modal -->
```
Replace with:
```svelte
	<!-- Create Subject Modal -->
```

Find:
```svelte
			<input id="catalogName" type="text" bind:value={newSubjectName} required
```
Replace with:
```svelte
			<input id="subjectNameInput" type="text" bind:value={newSubjectName} required
```

- [ ] **Step 8: Verify**

```powershell
npm run check
```
Expected: 0 errors. If errors appear, search the file for any remaining `catalog` references and rename them.

- [ ] **Step 9: Commit**

```bash
git add src/routes/admin/+page.svelte
git commit -m "refactor: rename catalog vars/functions/refs to subject in admin page"
```

---

## Task 5: courses/+page.svelte

**Files:**
- Modify: `src/routes/courses/+page.svelte`

- [ ] **Step 1: Rename state variables**

Find:
```svelte
	let newCatalogId = $state('');
```
Replace with:
```svelte
	let newSubjectId = $state('');
```

Find:
```svelte
	let catalogEntries = $state<{ id: string; name: string; status: string }[]>([]);
```
Replace with:
```svelte
	let subjectEntries = $state<{ id: string; name: string; status: string }[]>([]);
```

Find:
```svelte
	let catalogLoading = $state(false);
```
Replace with:
```svelte
	let subjectLoading = $state(false);
```

- [ ] **Step 2: Rename `loadCatalog` function (replace_all)**

Find (replace_all): `loadCatalog`
Replace with: `loadSubjects`

Find (replace_all): `catalogEntries`
Replace with: `subjectEntries`

Find (replace_all): `catalogLoading`
Replace with: `subjectLoading`

Find (replace_all): `newCatalogId`
Replace with: `newSubjectId`

- [ ] **Step 3: Rename `suggestCatalogEntry` function (replace_all)**

Find (replace_all): `suggestCatalogEntry`
Replace with: `suggestSubjectEntry`

- [ ] **Step 4: Update HTML ids and `$t` references in the template**

Find:
```svelte
			<label for="catalogEntry" class="text-[13px] font-medium">{$t('courses.modal.catalogLabel')}</label>
```
Replace with:
```svelte
			<label for="subjectEntry" class="text-[13px] font-medium">{$t('courses.modal.subjectPickerLabel')}</label>
```

Find:
```svelte
				<select id="catalogEntry" bind:value={newSubjectId} required
```
Replace with:
```svelte
				<select id="subjectEntry" bind:value={newSubjectId} required
```

Find:
```svelte
						<option value="">{$t('courses.modal.catalogPlaceholder')}</option>
```
Replace with:
```svelte
						<option value="">{$t('courses.modal.subjectPickerPlaceholder')}</option>
```

Find:
```svelte
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => { document.getElementById('catalogEntry')?.closest('form')?.requestSubmit(); }}>
```
Replace with:
```svelte
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => { document.getElementById('subjectEntry')?.closest('form')?.requestSubmit(); }}>
```

- [ ] **Step 5: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "refactor: rename catalog vars/functions/refs to subject in courses page"
```

---

## Task 6: register/teacher/+page.svelte

**Files:**
- Modify: `src/routes/register/teacher/+page.svelte`

- [ ] **Step 1: Rename state variables (replace_all)**

Find (replace_all): `catalogEntryIds`
Replace with: `subjectIds`

Find (replace_all): `catalogEntries`
Replace with: `subjectEntries`

- [ ] **Step 2: Update `$t` reference**

Find:
```svelte
						<p class="text-xs text-text2">{$t('auth.registerTeacher.catalogHelper')}</p>
```
Replace with:
```svelte
						<p class="text-xs text-text2">{$t('auth.registerTeacher.subjectHelper')}</p>
```

- [ ] **Step 3: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/register/teacher/+page.svelte
git commit -m "refactor: rename catalog vars/refs to subject in teacher register page"
```

---

## Final Verification

- [ ] **Confirm no remaining `catalog` references in source**

```powershell
grep -rn --include="*.svelte" --include="*.ts" --include="*.json" "catalog" src/
```
Expected: 0 results. If any remain, fix them before the build step.

- [ ] **Full check + build**

```powershell
npm run check && npm run build
```
Expected: 0 errors, build succeeds.

- [ ] **Commit final verification**

```bash
git commit --allow-empty -m "refactor: catalog-to-subject rename complete — 0 remaining references"
```
