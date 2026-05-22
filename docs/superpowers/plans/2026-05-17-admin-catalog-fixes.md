# Admin Catalog Fixes + Footer Logo + Rename Subjects

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two admin dead-link issues, add admin create-catalog modal, swap the footer logo for the light SVG variant, and rename the "Catalog" nav label to "Subjects".

**Architecture:** Five independent file changes: locale JSON files (no logic), `+page.svelte` footer (one line), a new `adminBadge.ts` store + Sidebar wiring, admin page fixes (catalog badge key + create modal). No new routes or components.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/locales/en.json` — rename `nav.catalog`, add 3 keys |
| Modify | `src/locales/id.json` — same in Indonesian |
| Modify | `src/routes/+page.svelte` — replace footer inline SVG with img |
| Create | `src/lib/stores/adminBadge.ts` — `pendingApprovalCount` writable |
| Modify | `src/lib/components/layout/Sidebar.svelte` — read store for approvals count |
| Modify | `src/routes/admin/+page.svelte` — fix badge key, write store, add create modal |

---

### Task 1: Update locale files

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Rename `nav.catalog` and add 3 new keys in `en.json`**

In `src/locales/en.json`, find:
```json
    "catalog": "Catalog"
```
Replace with:
```json
    "catalog": "Subjects"
```

Then find `"waitingCatalog"` — it doesn't exist yet. Add it inside `dashboard.admin` after `"waitingStudents"`:
```json
      "waitingCatalog": "{n} pending",
      "createCatalog": "+ Create Entry",
      "createCatalogTitle": "Create Subject Entry",
```

- [ ] **Step 2: Same changes in `id.json`**

In `src/locales/id.json`, find:
```json
    "catalog": "Katalog"
```
Replace with:
```json
    "catalog": "Mata Pelajaran"
```

Then in `dashboard.admin` after `"waitingStudents"`:
```json
      "waitingCatalog": "{n} menunggu",
      "createCatalog": "+ Buat Entri",
      "createCatalogTitle": "Buat Entri Mata Pelajaran",
```

- [ ] **Step 3: Verify JSON is valid**

```powershell
node -e "require('./src/locales/en.json'); console.log('en.json OK')"
node -e "require('./src/locales/id.json'); console.log('id.json OK')"
```
Expected: `en.json OK` and `id.json OK` (no parse errors).

---

### Task 2: Fix footer logo — swap to light SVG variant

**Files:**
- Modify: `src/routes/+page.svelte`

The footer currently embeds the `mark-primary.svg` inline (navy circle `#173343`). On the dark footer background (`#0F172A`), this is nearly invisible. Replace with an `<img>` pointing to the light variant.

- [ ] **Step 1: Find the footer logo SVG block**

In `src/routes/+page.svelte`, find this block in the footer section:
```svelte
					<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 flex-none" aria-hidden="true">
						<circle cx="32" cy="32" r="32" fill="#173343" />
						<g fill="#f6f3ec">
							<path d="M6 28 Q20 30 32 33 L32 56 Q22 42 6 28 Z" />
							<path d="M58 28 Q44 30 32 33 L32 56 Q42 42 58 28 Z" />
						</g>
						<line x1="32" y1="33" x2="32" y2="55" stroke="#2d6a5e" stroke-width="0.9" stroke-linecap="round" />
						<path d="M32 33 C 28 18, 22 12, 6 14 C 12 28, 20 32, 32 33 Z" fill="#7ba37a" />
						<path d="M32 33 C 36 18, 42 12, 58 14 C 52 28, 44 32, 32 33 Z" fill="#7ba37a" />
						<path d="M32 33 C 25 26, 23 16, 31 6 C 41 16, 39 26, 32 33 Z" fill="#9bb39a" />
						<circle cx="31.5" cy="6.5" r="1.4" fill="#c9a35a" />
					</svg>
```

Replace the entire `<svg>...</svg>` block with:
```svelte
					<img src="/brand-kit/svg/mark-light.svg" alt="" class="w-7 h-7 flex-none" aria-hidden="true" />
```

- [ ] **Step 2: Commit**

```powershell
git add src/routes/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "fix: footer uses mark-light.svg for dark bg; rename nav Catalog→Subjects"
```

---

### Task 3: Create `pendingApprovalCount` store

**Files:**
- Create: `src/lib/stores/adminBadge.ts`

- [ ] **Step 1: Create the store file**

Create `src/lib/stores/adminBadge.ts` with this exact content:
```typescript
import { writable } from 'svelte/store';

export const pendingApprovalCount = writable(0);
```

---

### Task 4: Wire store into Sidebar

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte`

- [ ] **Step 1: Import the store**

In `src/lib/components/layout/Sidebar.svelte`, add after the existing imports:
```svelte
	import { pendingApprovalCount } from '$lib/stores/adminBadge';
```

- [ ] **Step 2: Replace the count badge in the template**

Find the existing count badge block in both the desktop and mobile sidebar (same pattern appears twice):
```svelte
				{#if item.count && item.count > 0}
					<span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
						{item.count}
					</span>
				{/if}
```

Replace both occurrences with:
```svelte
				{#if item.id === 'approvals' && $pendingApprovalCount > 0}
					<span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
						{$pendingApprovalCount}
					</span>
				{:else if item.id !== 'approvals' && item.count && item.count > 0}
					<span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
						{item.count}
					</span>
				{/if}
```

- [ ] **Step 3: Commit**

```powershell
git add src/lib/stores/adminBadge.ts src/lib/components/layout/Sidebar.svelte
git commit -m "feat: live pending approvals count in admin sidebar"
```

---

### Task 5: Wire store from admin page + fix catalog badge key

**Files:**
- Modify: `src/routes/admin/+page.svelte`

- [ ] **Step 1: Import the store**

In `src/routes/admin/+page.svelte`, add to the imports block:
```svelte
	import { pendingApprovalCount } from '$lib/stores/adminBadge';
```

- [ ] **Step 2: Update the store when pending lists change**

In the script block, after `let pendingStudents`, add:
```svelte
	$effect(() => {
		pendingApprovalCount.set(pendingTeachers.length + pendingStudents.length);
	});
```

- [ ] **Step 3: Fix the catalog badge locale key**

Find line 447 in the admin page template:
```svelte
				<Badge variant="warning" label={$t('dashboard.admin.waitingTeachers', { values: { n: pendingCatalog.length } })} />
```

Replace with:
```svelte
				<Badge variant="warning" label={$t('dashboard.admin.waitingCatalog', { values: { n: pendingCatalog.length } })} />
```

---

### Task 6: Add create catalog modal to admin page

**Files:**
- Modify: `src/routes/admin/+page.svelte`

- [ ] **Step 1: Add create catalog state variables**

In the script block, after `let catalogActionLoading`, add:
```svelte
	let createCatalogOpen = $state(false);
	let newCatalogName = $state('');
	let newCatalogSubject = $state('');
	let newCatalogAges = $state<string[]>([]);
	let createCatalogLoading = $state(false);
	let createCatalogFormEl = $state<HTMLFormElement | null>(null);

	function toggleCatalogAge(age: string) {
		newCatalogAges = newCatalogAges.includes(age)
			? newCatalogAges.filter((a) => a !== age)
			: [...newCatalogAges, age];
	}

	async function handleCreateCatalog(e: SubmitEvent) {
		e.preventDefault();
		createCatalogLoading = true;
		try {
			await api.post('/admin/catalog', {
				name: newCatalogName,
				subject: newCatalogSubject,
				age_categories: newCatalogAges,
			});
			createCatalogOpen = false;
			newCatalogName = '';
			newCatalogSubject = '';
			newCatalogAges = [];
		} catch {
			// stay open on error
		} finally {
			createCatalogLoading = false;
		}
	}
```

- [ ] **Step 2: Add "+ Create Entry" button to catalog card header**

In the template, find the catalog card `{#snippet head()}` block:
```svelte
	{#snippet head()}
		<h2 class="font-semibold">{$t('dashboard.admin.pendingCatalog')}</h2>
		{#if pendingCatalog.length > 0}
			<Badge variant="warning" label={$t('dashboard.admin.waitingCatalog', { values: { n: pendingCatalog.length } })} />
		{/if}
	{/snippet}
```

Replace with:
```svelte
	{#snippet head()}
		<h2 class="font-semibold">{$t('dashboard.admin.pendingCatalog')}</h2>
		<div class="flex items-center gap-2">
			{#if pendingCatalog.length > 0}
				<Badge variant="warning" label={$t('dashboard.admin.waitingCatalog', { values: { n: pendingCatalog.length } })} />
			{/if}
			<Button variant="primary" size="sm" onclick={() => (createCatalogOpen = true)}>
				{$t('dashboard.admin.createCatalog')}
			</Button>
		</div>
	{/snippet}
```

- [ ] **Step 3: Add the Create Catalog modal**

Find the closing `</div>` of the main page div (at the very end of the template, after the Create User Modal's closing `{/if}`). Add this block just before it:

```svelte
<!-- Create Catalog Modal -->
<Modal
	open={createCatalogOpen}
	title={$t('dashboard.admin.createCatalogTitle')}
	onclose={() => (createCatalogOpen = false)}
>
	<form bind:this={createCatalogFormEl} onsubmit={handleCreateCatalog} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="catalogName" class="text-[13px] font-medium">{$t('dashboard.admin.catalogName')}</label>
			<input id="catalogName" type="text" bind:value={newCatalogName} required
				placeholder="e.g. Introduction to Algebra"
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="catalogSubject" class="text-[13px] font-medium">{$t('dashboard.admin.subjects')}</label>
			<input id="catalogSubject" type="text" bind:value={newCatalogSubject} required
				placeholder="e.g. Mathematics"
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">{$t('dashboard.admin.ageCategory')}</p>
			<div class="flex gap-2">
				{#each [['Kids', $t('courses.ageKids')], ['Teens', $t('courses.ageTeens')], ['Adults', $t('courses.ageAdults')]] as [val, label]}
					<button type="button" onclick={() => toggleCatalogAge(val)}
						class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
						       {newCatalogAges.includes(val) ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
						{label}
					</button>
				{/each}
			</div>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createCatalogOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createCatalogLoading} onclick={() => createCatalogFormEl?.requestSubmit()}>
			{$t('dashboard.admin.createCatalog')}
		</Button>
	{/snippet}
</Modal>
```

- [ ] **Step 4: Verify and commit**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/admin/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: admin create catalog entry modal + fix sidebar count + fix badge key"
```

---

## Self-Review

**Spec coverage:**
- ✅ Rename `nav.catalog` EN/ID → Task 1
- ✅ Add `waitingCatalog`, `createCatalog`, `createCatalogTitle` → Task 1
- ✅ Footer logo `mark-light.svg` → Task 2
- ✅ `pendingApprovalCount` store → Task 3
- ✅ Sidebar reads real count from store → Task 4
- ✅ Admin page writes store via `$effect` → Task 5
- ✅ Catalog badge key fix (`waitingTeachers` → `waitingCatalog`) → Task 5
- ✅ Create catalog modal `POST /admin/catalog` → Task 6

**Placeholder scan:** None. All code blocks complete.

**Type consistency:** `newCatalogAges: string[]`, `createCatalogFormEl: HTMLFormElement | null` used consistently in Tasks 5–6.
