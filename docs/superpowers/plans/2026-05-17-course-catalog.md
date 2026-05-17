# Course Catalog — Admin Management + Teacher Suggest Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Pending Catalog Suggestions" card to the admin page and a "Suggest new entry" flow in the courses create modal.

**Architecture:** Admin side — new card + fetch in `admin/+page.svelte`, sidebar gets one new entry. Teacher side — the existing Create Course modal gets a toggle to switch between "pick from catalog" and "suggest new entry" modes. No new pages or components.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client, lucide-svelte

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/lib/components/layout/Sidebar.svelte` — add "Catalog" admin nav item |
| Modify | `src/routes/admin/+page.svelte` — pending catalog card + fetch + approve/reject |
| Modify | `src/routes/courses/+page.svelte` — suggest flow inside create modal |
| Modify | `src/locales/en.json` — new keys |
| Modify | `src/locales/id.json` — new keys (Indonesian) |

---

### Task 1: Add "Catalog" to admin sidebar

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte`

- [ ] **Step 1: Add catalog nav item to admin array**

In `src/lib/components/layout/Sidebar.svelte`, find the admin nav array:
```svelte
		admin: [
			{ id: 'overview',  labelKey: 'nav.overview',              href: '/admin',                   icon: Home },
			{ id: 'approvals', labelKey: 'nav.pendingApprovals',      href: '/admin#pending-approvals', icon: ShieldCheck },
			{ id: 'users',     labelKey: 'dashboard.admin.allUsers',  href: '/admin#all-users',         icon: Users },
		],
```

Replace with:
```svelte
		admin: [
			{ id: 'overview',  labelKey: 'nav.overview',              href: '/admin',                   icon: Home },
			{ id: 'approvals', labelKey: 'nav.pendingApprovals',      href: '/admin#pending-approvals', icon: ShieldCheck },
			{ id: 'users',     labelKey: 'dashboard.admin.allUsers',  href: '/admin#all-users',         icon: Users },
			{ id: 'catalog',   labelKey: 'nav.catalog',               href: '/admin#catalog',           icon: BookOpen },
		],
```

`BookOpen` is already imported from lucide-svelte in this file.

- [ ] **Step 2: Add locale key**

In `src/locales/en.json`, inside `nav`:
```json
    "catalog": "Catalog",
```

In `src/locales/id.json`, inside `nav`:
```json
    "catalog": "Katalog",
```

- [ ] **Step 3: Commit**

```powershell
git add src/lib/components/layout/Sidebar.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: add Catalog link to admin sidebar"
```

---

### Task 2: Add locale keys for catalog admin section

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add admin catalog locale keys to `en.json`**

Inside `dashboard.admin`, add after `"usernameLabel"`:
```json
      "pendingCatalog": "Pending Catalog Suggestions",
      "noPendingCatalog": "No pending catalog suggestions.",
      "catalogName": "Course Name",
      "catalogApprove": "Approve",
      "catalogReject": "Reject",
```

- [ ] **Step 2: Add same keys to `id.json`**

```json
      "pendingCatalog": "Saran Katalog Menunggu",
      "noPendingCatalog": "Tidak ada saran katalog yang menunggu.",
      "catalogName": "Nama Kursus",
      "catalogApprove": "Setujui",
      "catalogReject": "Tolak",
```

- [ ] **Step 3: Add courses suggest locale keys to `en.json`**

Inside `courses`, add:
```json
    "suggestEntry": "+ Suggest new entry",
    "suggestTitle": "Suggest New Course",
    "suggestSuccess": "Suggestion submitted. A draft course has been created for you.",
    "suggestCancelBack": "← Back to catalog",
    "suggestNameLabel": "Course name",
    "suggestNamePlaceholder": "e.g. Introduction to Algebra",
    "suggestSubjectLabel": "Subject",
    "suggestSubjectPlaceholder": "e.g. Mathematics",
    "suggestAgeLabel": "Age categories",
```

- [ ] **Step 4: Add same keys to `id.json`**

```json
    "suggestEntry": "+ Sarankan entri baru",
    "suggestTitle": "Sarankan Kursus Baru",
    "suggestSuccess": "Saran terkirim. Kursus draf telah dibuat untuk Anda.",
    "suggestCancelBack": "← Kembali ke katalog",
    "suggestNameLabel": "Nama kursus",
    "suggestNamePlaceholder": "mis. Pengantar Aljabar",
    "suggestSubjectLabel": "Mata pelajaran",
    "suggestSubjectPlaceholder": "mis. Matematika",
    "suggestAgeLabel": "Kategori usia",
```

---

### Task 3: Add "Pending Catalog Suggestions" card to admin page

**Files:**
- Modify: `src/routes/admin/+page.svelte`

- [ ] **Step 1: Add catalog state and fetch function to the script block**

In `src/routes/admin/+page.svelte`, after `onMount(fetchAllUsers);`, add:

```svelte
	// Catalog management
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let pendingCatalog = $state<any[]>([]);
	let catalogActionLoading = $state<string | null>(null);

	async function fetchPendingCatalog() {
		try {
			const entries = await api.get<any[]>('/admin/catalog?status=pending');
			pendingCatalog = Array.isArray(entries) ? entries : [];
		} catch {
			pendingCatalog = [];
		}
	}

	async function handleCatalogAction(id: string, action: 'approve' | 'reject') {
		catalogActionLoading = `${id}-${action}`;
		try {
			await api.patch(`/admin/catalog/${id}/verify`, { action });
			pendingCatalog = pendingCatalog.filter((e: any) => e.id !== id);
		} catch {
			// keep optimistic state
		} finally {
			catalogActionLoading = null;
		}
	}

	onMount(() => {
		fetchAllUsers();
		fetchPendingCatalog();
	});
```

> Remove the standalone `onMount(fetchAllUsers)` that was there before — replace it with this new `onMount` that calls both functions.

- [ ] **Step 2: Add the catalog card to the template**

Add this block after the `<!-- All Users tabs -->` Card (after its closing `</Card>`), before the Create User Modal:

```svelte
	<!-- Pending Catalog Suggestions -->
	<div id="catalog"></div>
	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('dashboard.admin.pendingCatalog')}</h2>
			{#if pendingCatalog.length > 0}
				<Badge variant="warning" label={$t('dashboard.admin.waitingTeachers', { values: { n: pendingCatalog.length } })} />
			{/if}
		{/snippet}
		{#if pendingCatalog.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.admin.noPendingCatalog')}</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('dashboard.admin.catalogName')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.status')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('dashboard.admin.subjects')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('dashboard.admin.ageCategory')}</th>
							<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each pendingCatalog as entry}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3 font-medium">{entry.name}</td>
								<td class="px-5 py-3 hidden sm:table-cell">
									<Badge variant="warning" label={entry.status ?? 'pending'} />
								</td>
								<td class="px-5 py-3 text-text2 hidden md:table-cell">{entry.subject}</td>
								<td class="px-5 py-3 hidden lg:table-cell">
									<div class="flex flex-wrap gap-1">
										{#each (entry.age_categories ?? []) as age}
											<Badge variant="violet" label={age} />
										{/each}
									</div>
								</td>
								<td class="px-5 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<Button variant="success" size="sm"
											loading={catalogActionLoading === `${entry.id}-approve`}
											onclick={() => handleCatalogAction(entry.id, 'approve')}>
											{$t('dashboard.admin.catalogApprove')}
										</Button>
										<Button variant="danger" size="sm"
											loading={catalogActionLoading === `${entry.id}-reject`}
											onclick={() => handleCatalogAction(entry.id, 'reject')}>
											{$t('dashboard.admin.catalogReject')}
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
```

- [ ] **Step 3: Verify and commit**

```powershell
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/admin/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: admin catalog management card — pending suggestions + approve/reject"
```

---

### Task 4: Add "Suggest new entry" flow to courses create modal

**Files:**
- Modify: `src/routes/courses/+page.svelte`

After Task 2 of the breaking-fixes plan, the create modal shows a catalog `<select>`. Now we add a "Suggest new entry" toggle mode below it.

- [ ] **Step 1: Add suggest-mode state to the script block**

After `let createLoading = $state(false);`, add:
```svelte
	let suggestMode = $state(false);
	let suggestName = $state('');
	let suggestSubject = $state('');
	let suggestAges = $state<string[]>([]);
	let suggestLoading = $state(false);
	let suggestSuccess = $state(false);
```

- [ ] **Step 2: Add suggest function**

After the `createCourse` function, add:
```svelte
	async function suggestCatalogEntry(e: SubmitEvent) {
		e.preventDefault();
		suggestLoading = true;
		try {
			await api.post('/catalog/suggest', {
				name: suggestName,
				subject: suggestSubject,
				age_categories: suggestAges,
			});
			suggestSuccess = true;
			suggestName = '';
			suggestSubject = '';
			suggestAges = [];
			await fetchCourses();
		} finally {
			suggestLoading = false;
		}
	}

	function toggleSuggestAge(age: string) {
		suggestAges = suggestAges.includes(age)
			? suggestAges.filter((a) => a !== age)
			: [...suggestAges, age];
	}
```

- [ ] **Step 3: Update the modal to show suggest mode**

Inside the Create Course Modal, after the catalog `<select>` div and before the description textarea, add the suggest toggle link and the suggest form:

```svelte
		<!-- Suggest toggle link -->
		{#if !suggestMode && !suggestSuccess}
			<button type="button" onclick={() => (suggestMode = true)}
				class="text-sm font-semibold text-primary hover:text-primary-dark text-left">
				{$t('courses.suggestEntry')}
			</button>
		{/if}

		<!-- Suggest form (replaces catalog select when active) -->
		{#if suggestMode}
			<div class="border border-border rounded-sm p-4 bg-bgGray flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<p class="text-sm font-semibold">{$t('courses.suggestTitle')}</p>
					<button type="button" onclick={() => (suggestMode = false)}
						class="text-xs font-semibold text-primary hover:text-primary-dark">
						{$t('courses.suggestCancelBack')}
					</button>
				</div>
				{#if suggestSuccess}
					<p class="text-sm text-successText">{$t('courses.suggestSuccess')}</p>
				{:else}
					<div class="flex flex-col gap-3">
						<div class="flex flex-col gap-1.5">
							<label for="suggestName" class="text-[13px] font-medium">{$t('courses.suggestNameLabel')}</label>
							<input id="suggestName" type="text" bind:value={suggestName} required
								placeholder={$t('courses.suggestNamePlaceholder')}
								class="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
						</div>
						<div class="flex flex-col gap-1.5">
							<label for="suggestSubject" class="text-[13px] font-medium">{$t('courses.suggestSubjectLabel')}</label>
							<input id="suggestSubject" type="text" bind:value={suggestSubject} required
								placeholder={$t('courses.suggestSubjectPlaceholder')}
								class="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
						</div>
						<div class="flex flex-col gap-1.5">
							<p class="text-[13px] font-medium">{$t('courses.suggestAgeLabel')}</p>
							<div class="flex gap-2">
								{#each [['Kids', $t('courses.ageKids')], ['Teens', $t('courses.ageTeens')], ['Adults', $t('courses.ageAdults')]] as [val, label]}
									<button type="button" onclick={() => toggleSuggestAge(val)}
										class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
										       {suggestAges.includes(val) ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
										{label}
									</button>
								{/each}
							</div>
						</div>
						<Button variant="teal" size="sm" loading={suggestLoading}
							onclick={() => document.getElementById('suggestName')?.closest('form')?.requestSubmit()}>
							{$t('courses.suggestEntry')}
						</Button>
					</div>
				{/if}
			</div>
		{/if}
```

Also reset `suggestMode` and `suggestSuccess` when the modal closes. Update the `onclose` handler:
```svelte
<Modal open={createOpen} title={$t('courses.modal.createTitle')}
	onclose={() => { createOpen = false; suggestMode = false; suggestSuccess = false; }}
	maxWidth="lg">
```

- [ ] **Step 4: Verify and commit**

```powershell
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/courses/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: courses — suggest new catalog entry flow in create modal"
```

---

## Self-Review

**Spec coverage:**
- ✅ Sidebar "Catalog" link → Task 1
- ✅ Admin pending catalog card → Task 3
- ✅ Approve/reject `PATCH /admin/catalog/:id/verify` → Task 3
- ✅ Teacher suggest flow `POST /catalog/suggest` → Task 4
- ✅ Locale keys EN + ID → Tasks 1, 2, 3, 4

**Placeholder scan:** None. All code blocks complete.

**Type consistency:** `pendingCatalog: any[]`, `catalogActionLoading: string | null` used consistently. `suggestMode`, `suggestSuccess` used consistently in Task 4.
