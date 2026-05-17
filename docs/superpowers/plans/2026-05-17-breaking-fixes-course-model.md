# Breaking Fixes — Course Model + Teacher Register + Teacher Profile

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three pages broken by the 2026-05-17 backend changes: courses (field rename + new create body), teacher registration (subjects → catalog IDs), teacher profile (remove subject editing).

**Architecture:** Pure frontend changes — no new components, no new routes. Each task modifies one file. The catalog entry picker in both courses and teacher register fetches `GET /catalog?status=verified` independently on mount/open.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client from `$lib/api`

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/routes/courses/+page.svelte` — rename field, replace create modal, fix create function |
| Modify | `src/routes/register/teacher/+page.svelte` — replace subjects tag input with catalog multi-select |
| Modify | `src/routes/teachers/[id]/+page.svelte` — remove subject editing, fix PUT body |

---

### Task 1: Fix `course.title` → `course.name` in course cards

**Files:**
- Modify: `src/routes/courses/+page.svelte:205`

- [ ] **Step 1: Replace the field reference in the card body**

In `src/routes/courses/+page.svelte`, find line 205:
```svelte
						<div class="font-semibold text-[17px] leading-snug">{course.title}</div>
```
Replace with:
```svelte
						<div class="font-semibold text-[17px] leading-snug">{course.name ?? course.title}</div>
```

> The `?? course.title` fallback ensures the card still works if any cached response still has the old field name during transition.

- [ ] **Step 2: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

---

### Task 2: Replace Create Course modal with catalog entry picker

**Files:**
- Modify: `src/routes/courses/+page.svelte` — script block and modal markup

The current modal has three free-form fields: title, description, subject. The new body is `{ catalog_entry_id, description? }`. Replace the three fields with a catalog `<select>` + description.

- [ ] **Step 1: Replace create-modal state variables**

In the `<script>` block, find:
```svelte
	// Create modal
	let createOpen = $state(false);
	let newTitle = $state('');
	let newDesc = $state('');
	let newSubject = $state('');
	let createLoading = $state(false);
```

Replace with:
```svelte
	// Create modal
	let createOpen = $state(false);
	let newCatalogId = $state('');
	let newDesc = $state('');
	let createLoading = $state(false);
	let catalogEntries = $state<{ id: string; name: string; subject: string }[]>([]);
	let catalogLoading = $state(false);

	async function loadCatalog() {
		if (catalogEntries.length > 0) return;
		catalogLoading = true;
		try {
			const entries = await api.get<{ id: string; name: string; subject: string; age_categories: string[]; status: string }[]>('/catalog?status=verified');
			catalogEntries = Array.isArray(entries) ? entries : [];
		} catch {
			catalogEntries = [];
		} finally {
			catalogLoading = false;
		}
	}
```

- [ ] **Step 2: Update the `createCourse` function**

Find the existing `createCourse` function:
```svelte
	async function createCourse(e: SubmitEvent) {
		e.preventDefault();
		createLoading = true;
		try {
			await api.post('/courses', {
				title: newTitle,
				description: newDesc,
				subject: newSubject,
				age_categories: [],
			});
			createOpen = false;
			await fetchCourses();
		} finally {
			createLoading = false;
		}
	}
```

Replace with:
```svelte
	async function createCourse(e: SubmitEvent) {
		e.preventDefault();
		createLoading = true;
		try {
			await api.post('/courses', {
				catalog_entry_id: newCatalogId,
				description: newDesc,
			});
			createOpen = false;
			newCatalogId = '';
			newDesc = '';
			await fetchCourses();
		} finally {
			createLoading = false;
		}
	}
```

- [ ] **Step 3: Update the "Create Course" button to load catalog on open**

Find:
```svelte
		<Button variant="primary" onclick={() => (createOpen = true)}>
```
Replace with:
```svelte
		<Button variant="primary" onclick={() => { createOpen = true; loadCatalog(); }}>
```

- [ ] **Step 4: Replace the Create Course modal form fields**

Find the entire modal form (the `<Modal open={createOpen}...>` block) and replace:
```svelte
<!-- Create Course Modal -->
<Modal open={createOpen} title={$t('courses.modal.createTitle')} onclose={() => (createOpen = false)} maxWidth="lg">
	<form onsubmit={createCourse} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="courseTitle" class="text-[13px] font-medium">{$t('courses.modal.titleLabel')}</label>
			<input id="courseTitle" type="text" bind:value={newTitle} required placeholder={$t('courses.modal.titlePlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="courseDesc" class="text-[13px] font-medium">{$t('courses.modal.descLabel')}</label>
			<textarea id="courseDesc" bind:value={newDesc} rows={3} placeholder={$t('courses.modal.descPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="courseSubject" class="text-[13px] font-medium">{$t('courses.modal.subjectLabel')}</label>
			<input id="courseSubject" type="text" bind:value={newSubject} placeholder={$t('courses.modal.subjectPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={(e: MouseEvent) => { const form = document.querySelector('form'); form?.requestSubmit(); }}>
			{$t('courses.modal.createTitle')}
		</Button>
	{/snippet}
</Modal>
```

With:
```svelte
<!-- Create Course Modal -->
<Modal open={createOpen} title={$t('courses.modal.createTitle')} onclose={() => (createOpen = false)} maxWidth="lg">
	<form onsubmit={createCourse} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="catalogEntry" class="text-[13px] font-medium">{$t('courses.modal.catalogLabel')}</label>
			{#if catalogLoading}
				<p class="text-sm text-text2">{$t('common.loading')}</p>
			{:else}
				<select id="catalogEntry" bind:value={newCatalogId} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
					<option value="">{$t('courses.modal.catalogPlaceholder')}</option>
					{#each catalogEntries as entry}
						<option value={entry.id}>{entry.name} ({entry.subject})</option>
					{/each}
				</select>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="courseDesc" class="text-[13px] font-medium">{$t('courses.modal.descLabel')}</label>
			<textarea id="courseDesc" bind:value={newDesc} rows={3} placeholder={$t('courses.modal.descPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => { document.getElementById('catalogEntry')?.closest('form')?.requestSubmit(); }}>
			{$t('courses.modal.createTitle')}
		</Button>
	{/snippet}
</Modal>
```

- [ ] **Step 5: Add missing locale keys**

In `src/locales/en.json`, inside `courses.modal`, add after `"editTitle"`:
```json
      "catalogLabel": "Course from catalog",
      "catalogPlaceholder": "Select a course entry...",
```

In `src/locales/id.json`, inside `courses.modal`, add the same:
```json
      "catalogLabel": "Kursus dari katalog",
      "catalogPlaceholder": "Pilih entri kursus...",
```

- [ ] **Step 6: Commit**

```powershell
git add src/routes/courses/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "fix: courses page — title→name, create modal uses catalog picker"
```

---

### Task 3: Replace subjects tag input in teacher registration

**Files:**
- Modify: `src/routes/register/teacher/+page.svelte`

Replace the free-form subjects tag input with a catalog entry multi-select checkbox list.

- [ ] **Step 1: Replace subjects state with catalog state**

In the script block, find:
```svelte
	let subjects = $state<string[]>([]);
	let tagInput = $state('');
```

Replace with:
```svelte
	let catalogEntryIds = $state<string[]>([]);
	let catalogEntries = $state<{ id: string; name: string; subject: string }[]>([]);
```

- [ ] **Step 2: Remove the tag helper functions**

Find and delete these three functions entirely:
```svelte
	function addTag() { ... }
	function removeTag(i: number) { ... }
	function handleTagKeydown(e: KeyboardEvent) { ... }
```

- [ ] **Step 3: Add catalog fetch on mount**

Add `import { onMount } from 'svelte';` to the imports block.

Add after the `credentials` state declarations:
```svelte
	onMount(async () => {
		try {
			const entries = await api.get<{ id: string; name: string; subject: string }[]>('/catalog?status=verified');
			catalogEntries = Array.isArray(entries) ? entries : [];
		} catch {
			catalogEntries = [];
		}
	});
```

- [ ] **Step 4: Update the submit handler**

Find inside `handleSubmit`:
```svelte
			await api.post('/auth/register/teacher', {
				full_name: fullName,
				email,
				password,
				bio,
				subjects,
				credentials: credentials.filter(...)...
			});
```

Replace `subjects` with `catalog_entry_ids: catalogEntryIds`:
```svelte
			await api.post('/auth/register/teacher', {
				full_name: fullName,
				email,
				password,
				bio,
				catalog_entry_ids: catalogEntryIds,
				credentials: credentials.filter((c) => c.title || c.institution || c.year).map((c) => ({
					title: c.title,
					institution: c.institution,
					year: parseInt(c.year) || 0,
				})),
			});
```

- [ ] **Step 5: Replace the subjects tag input markup with checkbox list**

Find the subjects section in the template — the `<div class="flex flex-col gap-1.5">` block with `label for="subjectInput"` and the tag input container. Replace the entire block with:

```svelte
				<!-- Catalog entry multi-select -->
				<div class="flex flex-col gap-1.5">
					<label class="text-[13px] font-medium">{$t('auth.registerTeacher.subjects')}</label>
					{#if catalogEntries.length === 0}
						<p class="text-sm text-text2">{$t('common.loading')}</p>
					{:else}
						<div class="border border-border rounded-sm bg-white max-h-48 overflow-y-auto divide-y divide-border">
							{#each catalogEntries as entry}
								<label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-bgGray">
									<input
										type="checkbox"
										value={entry.id}
										checked={catalogEntryIds.includes(entry.id)}
										onchange={(e) => {
											if ((e.target as HTMLInputElement).checked) {
												catalogEntryIds = [...catalogEntryIds, entry.id];
											} else {
												catalogEntryIds = catalogEntryIds.filter(id => id !== entry.id);
											}
										}}
										class="w-4 h-4 rounded text-primary focus:ring-primary/15"
									/>
									<div>
										<div class="text-sm font-medium">{entry.name}</div>
										<div class="text-xs text-text2">{entry.subject}</div>
									</div>
								</label>
							{/each}
						</div>
						<p class="text-xs text-text2">{$t('auth.registerTeacher.catalogHelper')}</p>
					{/if}
				</div>
```

- [ ] **Step 6: Add missing locale key**

In `src/locales/en.json`, inside `auth.registerTeacher`, add:
```json
      "catalogHelper": "Optional — select courses you'd like to offer. You can add more later.",
```

In `src/locales/id.json`:
```json
      "catalogHelper": "Opsional — pilih kursus yang ingin Anda tawarkan. Anda bisa menambahkan lebih banyak nanti.",
```

- [ ] **Step 7: Commit**

```powershell
git add src/routes/register/teacher/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "fix: teacher registration — subjects tag input replaced with catalog multi-select"
```

---

### Task 4: Remove subject editing from teacher profile

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

- [ ] **Step 1: Remove `+ Add subject` pill in edit mode**

Find the block in the profile header that renders the `+ Add subject` dashed pill:
```svelte
					{#if isOwn && editMode}
						<button class="inline-flex items-center gap-1 px-2.5 py-0.5 border border-dashed border-primary text-primary text-xs font-medium rounded-pill hover:bg-primary-light transition-colors">
							{$t('profile.teacher.addSubject')}
						</button>
					{/if}
```

Delete these 5 lines entirely.

- [ ] **Step 2: Fix `PUT /teachers/me` payload in `saveBio`**

The `saveBio` function currently calls `api.put('/teachers/me', { bio: bioValue })` — this is already correct (`subjects` was never included here). No change needed for `saveBio`.

Verify there is no other call to `PUT /teachers/me` in this file that passes `subjects`:

```powershell
Select-String -Path "src\routes\teachers\[id]\+page.svelte" -Pattern "subjects"
```
Expected: 0 matches (subjects should only appear in the read-only badge rendering, not in API calls).

- [ ] **Step 3: Verify and commit**

```powershell
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/teachers/[id]/+page.svelte
git commit -m "fix: teacher profile — remove subject editing (now read-only from catalog)"
```

---

## Self-Review

**Spec coverage:**
- ✅ `course.title` → `course.name` → Task 1
- ✅ Create modal catalog picker (fetch `GET /catalog?status=verified`, `<select>`) → Task 2
- ✅ Create body `{ catalog_entry_id, description }` → Task 2
- ✅ Teacher register subjects → catalog_entry_ids multi-select → Task 3
- ✅ Remove `+ Add subject` from teacher profile edit mode → Task 4
- ✅ `PUT /teachers/me` no longer sends subjects → Task 4

**Placeholder scan:** None. All code blocks complete.

**Type consistency:** `catalogEntryIds: string[]` and `catalogEntries: { id, name, subject }[]` used consistently in Tasks 2 and 3.
