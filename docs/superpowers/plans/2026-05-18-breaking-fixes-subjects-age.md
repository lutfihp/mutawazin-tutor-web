# Breaking Fixes — Subject Endpoints + Age Categories

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken `/catalog` → `/subjects` endpoint calls and replace 3-value age categories with the new 5-value system throughout.

**Architecture:** Four files touched — locale files for age key rename, then three page files for endpoint URL fixes. The `Subject` model is simpler than `CatalogEntry` (name only, no subject/age_categories fields), so several form fields are removed.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/locales/en.json` — remove 3 age keys, add 5 new ones |
| Modify | `src/locales/id.json` — same in Indonesian |
| Modify | `src/routes/courses/+page.svelte` — endpoint renames, body changes, age chips, simplify suggest |
| Modify | `src/routes/register/teacher/+page.svelte` — endpoint rename, field rename, simplify display |
| Modify | `src/routes/admin/+page.svelte` — endpoint renames, simplify create modal and table |

---

### Task 1: Update age category locale keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: In `en.json` — remove old 3 keys and add 5 new ones**

Find inside `"courses"`:
```json
    "ageAll": "All ages",
    "ageKids": "Kids",
    "ageTeens": "Teens",
    "ageAdults": "Adults",
```

Replace with:
```json
    "ageAll": "All ages",
    "agePreSchool": "Pre-school",
    "ageElementary": "Elementary",
    "ageMiddleSchool": "Middle School",
    "ageHighSchool": "High School",
    "ageGeneral": "General",
```

- [ ] **Step 2: In `id.json` — same replacement**

Find inside `"courses"`:
```json
    "ageAll": "Semua usia",
    "ageKids": "Anak-anak",
    "ageTeens": "Remaja",
    "ageAdults": "Dewasa",
```

Replace with:
```json
    "ageAll": "Semua usia",
    "agePreSchool": "Pra-sekolah",
    "ageElementary": "Sekolah Dasar",
    "ageMiddleSchool": "Sekolah Menengah Pertama",
    "ageHighSchool": "Sekolah Menengah Atas",
    "ageGeneral": "Umum",
```

- [ ] **Step 3: Verify JSON**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
node -e "require('./src/locales/en.json'); console.log('OK')"
node -e "require('./src/locales/id.json'); console.log('OK')"
```
Expected: `OK` twice.

---

### Task 2: Fix `courses/+page.svelte` — endpoint renames + body + age chips

**Files:**
- Modify: `src/routes/courses/+page.svelte`

- [ ] **Step 1: Fix `loadCatalog` — rename endpoint**

Find:
```svelte
		const entries = await api.get<{ id: string; name: string; subject: string; age_categories: string[]; status: string }[]>('/catalog?status=verified');
```
Replace with:
```svelte
		const entries = await api.get<{ id: string; name: string; status: string }[]>('/subjects?status=verified');
```

Also update the `catalogEntries` type throughout — it no longer has `subject` field. The `<option>` in the select currently shows `{entry.name} ({entry.subject})`. Update to just `{entry.name}`:
```svelte
						<option value={entry.id}>{entry.name}</option>
```

- [ ] **Step 2: Add `newCourseAges` state and update `createCourse` body**

After `let newDesc = $state('');`, add:
```svelte
	let newCourseAges = $state<string[]>([]);
	function toggleCourseAge(age: string) {
		newCourseAges = newCourseAges.includes(age)
			? newCourseAges.filter((a) => a !== age)
			: [...newCourseAges, age];
	}
```

Update `createCourse` function:
```svelte
	async function createCourse(e: SubmitEvent) {
		e.preventDefault();
		createLoading = true;
		try {
			await api.post('/courses', {
				subject_id: newCatalogId,
				age_categories: newCourseAges,
				description: newDesc,
			});
			createOpen = false;
			newCatalogId = '';
			newCourseAges = [];
			newDesc = '';
			await fetchCourses();
		} finally {
			createLoading = false;
		}
	}
```

Also update `onclose` to reset `newCourseAges`:
```svelte
<Modal open={createOpen} title={$t('courses.modal.createTitle')}
	onclose={() => { createOpen = false; suggestMode = false; suggestSuccess = false; newCourseAges = []; }}
	maxWidth="lg">
```

- [ ] **Step 3: Add age category chips to create course modal**

Inside the create course modal form, after the catalog select div and before the suggest toggle button, add:
```svelte
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">{$t('courses.suggestAgeLabel')}</p>
			<div class="flex flex-wrap gap-2">
				{#each [['pre-school', $t('courses.agePreSchool')], ['elementary', $t('courses.ageElementary')], ['middle-school', $t('courses.ageMiddleSchool')], ['high-school', $t('courses.ageHighSchool')], ['general', $t('courses.ageGeneral')]] as [val, label]}
					<button type="button" onclick={() => toggleCourseAge(val)}
						class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
						       {newCourseAges.includes(val) ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
						{label}
					</button>
				{/each}
			</div>
		</div>
```

- [ ] **Step 4: Update age filter chip group**

Find the age filter chip group:
```svelte
	{#each [['Kids', $t('courses.ageKids')], ['Teens', $t('courses.ageTeens')], ['Adults', $t('courses.ageAdults')]] as [val, label]}
```

Replace with:
```svelte
	{#each [['pre-school', $t('courses.agePreSchool')], ['elementary', $t('courses.ageElementary')], ['middle-school', $t('courses.ageMiddleSchool')], ['high-school', $t('courses.ageHighSchool')], ['general', $t('courses.ageGeneral')]] as [val, label]}
```

- [ ] **Step 5: Simplify suggest flow — rename endpoint and simplify form**

The suggest endpoint now only takes `{ name }`. Remove `suggestSubject` and `suggestAges` state.

Find and remove these state declarations:
```svelte
	let suggestSubject = $state('');
	let suggestAges = $state<string[]>([]);
```

Remove `toggleSuggestAge` function entirely.

Update `suggestCatalogEntry` function:
```svelte
	async function suggestCatalogEntry(e: SubmitEvent) {
		e.preventDefault();
		suggestLoading = true;
		try {
			await api.post('/subjects/suggest', { name: suggestName });
			suggestSuccess = true;
			suggestName = '';
			await fetchCourses();
		} finally {
			suggestLoading = false;
		}
	}
```

In the suggest form template, remove the Subject and Age Categories sections — keep only the Name field:
```svelte
					<div class="flex flex-col gap-3">
						<div class="flex flex-col gap-1.5">
							<label for="suggestName" class="text-[13px] font-medium">{$t('courses.suggestNameLabel')}</label>
							<input id="suggestName" type="text" bind:value={suggestName} required
								placeholder={$t('courses.suggestNamePlaceholder')}
								class="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
						</div>
						<Button variant="teal" size="sm" loading={suggestLoading}
							onclick={() => document.getElementById('suggestName')?.closest('form')?.requestSubmit()}>
							{$t('courses.suggestEntry')}
						</Button>
					</div>
```

- [ ] **Step 6: Commit courses fixes**

```powershell
git add src/routes/courses/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "fix: subjects endpoint rename + age categories update in courses"
```

---

### Task 3: Fix `register/teacher/+page.svelte`

**Files:**
- Modify: `src/routes/register/teacher/+page.svelte`

- [ ] **Step 1: Fix endpoint and body field name**

In `onMount`, change:
```svelte
		const entries = await api.get<{ id: string; name: string; subject: string }[]>('/catalog?status=verified');
```
To:
```svelte
		const entries = await api.get<{ id: string; name: string }[]>('/subjects?status=verified');
```

In `handleSubmit`, change:
```svelte
			catalog_entry_ids: catalogEntryIds,
```
To:
```svelte
			subject_ids: catalogEntryIds,
```

- [ ] **Step 2: Remove `entry.subject` from the checkbox display**

Find in the multi-select template:
```svelte
					<div>
						<div class="text-sm font-medium">{entry.name}</div>
						<div class="text-xs text-text2">{entry.subject}</div>
					</div>
```

Replace with:
```svelte
					<div class="text-sm font-medium">{entry.name}</div>
```

- [ ] **Step 3: Commit**

```powershell
git add src/routes/register/teacher/+page.svelte
git commit -m "fix: teacher register — /subjects endpoint, subject_ids field, remove entry.subject"
```

---

### Task 4: Fix `admin/+page.svelte` — all catalog → subjects

**Files:**
- Modify: `src/routes/admin/+page.svelte`

- [ ] **Step 1: Rename all endpoint URLs**

Three replacements (use replace_all):

1. `/admin/catalog?status=pending` → `/admin/subjects?status=pending`
2. `/admin/catalog/${id}/verify` → `/admin/subjects/${id}/verify`
3. `/admin/catalog` → `/admin/subjects` (in `POST` call inside `handleCreateCatalog`)

- [ ] **Step 2: Simplify `handleCreateCatalog` — subjects only take `name`**

Find:
```svelte
		await api.post('/admin/catalog', {
			name: newCatalogName,
			subject: newCatalogSubject,
			age_categories: newCatalogAges,
		});
		createCatalogOpen = false;
		newCatalogName = '';
		newCatalogSubject = '';
		newCatalogAges = [];
```

Replace with:
```svelte
		await api.post('/admin/subjects', {
			name: newCatalogName,
		});
		createCatalogOpen = false;
		newCatalogName = '';
```

- [ ] **Step 3: Remove unused state variables**

Find and delete:
```svelte
	let newCatalogSubject = $state('');
	let newCatalogAges = $state<string[]>([]);
```

Also delete `toggleCatalogAge` function.

- [ ] **Step 4: Simplify Create Catalog Modal form — only Name field**

In the Create Catalog Modal, remove the Subject input div and the Age Categories chip group div. Keep only the Name input:
```svelte
	<form bind:this={createCatalogFormEl} onsubmit={handleCreateCatalog} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="catalogName" class="text-[13px] font-medium">{$t('dashboard.admin.catalogName')}</label>
			<input id="catalogName" type="text" bind:value={newCatalogName} required
				placeholder="e.g. Introduction to Algebra"
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
	</form>
```

- [ ] **Step 5: Update pending subjects table — remove Subject and Age Category columns**

Subjects no longer have `subject` or `age_categories` fields. In the table template:

Remove the `<th>` for Subjects and Age Category:
```html
<!-- REMOVE these two th rows: -->
<th class="px-5 py-3 text-left hidden md:table-cell">{$t('dashboard.admin.subjects')}</th>
<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('dashboard.admin.ageCategory')}</th>
```

Remove the corresponding `<td>` cells:
```html
<!-- REMOVE these two td cells: -->
<td class="px-5 py-3 text-text2 hidden md:table-cell">{entry.subject}</td>
<td class="px-5 py-3 hidden lg:table-cell">...</td>
```

Also update the status badge — `entry.status` values are still `pending/verified/rejected` so `Badge variant="warning"` still works for pending.

- [ ] **Step 6: Verify and commit**

```powershell
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/admin/+page.svelte
git commit -m "fix: admin — /subjects endpoint rename, simplify create/table for Subject model"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/catalog` → `/subjects` in courses, register/teacher, admin → Tasks 2–4
- ✅ Age categories 3 values → 5 new values in locale + UI → Tasks 1, 2
- ✅ Course POST body: `subject_id` + `age_categories` → Task 2
- ✅ Teacher register body: `subject_ids` → Task 3
- ✅ Suggest form simplified (name only) → Task 2
- ✅ Admin create simplified (name only) → Task 4
- ✅ Admin table simplified (no subject/age columns) → Task 4

**Placeholder scan:** None found.

**Type consistency:** `newCourseAges: string[]`, `newCatalogId` renamed conceptually but variable name kept as-is for minimal diff.
