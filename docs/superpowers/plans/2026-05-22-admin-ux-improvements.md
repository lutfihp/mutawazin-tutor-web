# Admin UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline action buttons on all three admin tables with a shared three-dot dropdown menu, add a featured confirmation modal on admin/teachers, fix the student age column, and add an edit subject modal on admin/subjects.

**Architecture:** A new shared `DropdownMenu` component handles open/close state, dismiss-on-focus-out, and Escape key. Each admin page imports it and passes an `items` array. No global state — each row instance has its own `open` boolean. New modals (featured confirmation, edit subject) use the existing `<Modal>` component and follow the established inline-state pattern.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS v3, lucide-svelte (already installed), `$app/navigation` goto.

---

### Task 1: Create the `DropdownMenu` shared component

**Files:**
- Create: `src/lib/components/ui/DropdownMenu.svelte`

- [ ] **Step 1: Create the file with this exact content**

  ```svelte
  <script lang="ts">
  	import { MoreVertical } from 'lucide-svelte';

  	type Item = { label: string; onclick: () => void; variant?: 'default' | 'danger' };
  	let { items }: { items: Item[] } = $props();

  	let open = $state(false);

  	function select(item: Item) {
  		open = false;
  		item.onclick();
  	}
  </script>

  <div
  	class="relative"
  	tabindex="-1"
  	onfocusout={(e) => {
  		if (!e.currentTarget.contains(e.relatedTarget as Node)) open = false;
  	}}
  	onkeydown={(e) => { if (e.key === 'Escape') open = false; }}
  	role="none"
  >
  	<button
  		onclick={(e) => { e.stopPropagation(); open = !open; }}
  		class="w-8 h-8 rounded-sm text-text2 hover:text-text hover:bg-bgGray flex items-center justify-center transition-colors"
  		aria-label="Actions"
  		aria-haspopup="true"
  		aria-expanded={open}
  	>
  		<MoreVertical size={16} aria-hidden="true" />
  	</button>

  	{#if open}
  		<div class="absolute right-0 top-full mt-1 bg-white border border-border rounded-sm shadow-md min-w-[140px] py-1 z-50">
  			{#each items as item}
  				<button
  					onclick={() => select(item)}
  					class="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bgGray
  					       {item.variant === 'danger' ? 'text-errorText' : 'text-text'}"
  				>
  					{item.label}
  				</button>
  			{/each}
  		</div>
  	{/if}
  </div>
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/components/ui/DropdownMenu.svelte
  git commit -m "feat: add shared DropdownMenu component"
  ```

---

### Task 2: Admin teachers — three-dot menu + featured confirmation modal

**Files:**
- Modify: `src/routes/admin/teachers/+page.svelte`

- [ ] **Step 1: Add imports**

  Replace the import block at lines 1–9:

  ```svelte
  <script lang="ts">
  	import { onMount } from 'svelte';
  	import { goto } from '$app/navigation';
  	import { t } from 'svelte-i18n';
  	import { api } from '$lib/api';
  	import Badge from '$lib/components/ui/Badge.svelte';
  	import Card from '$lib/components/ui/Card.svelte';
  	import Avatar from '$lib/components/ui/Avatar.svelte';
  	import Button from '$lib/components/ui/Button.svelte';
  	import Modal from '$lib/components/ui/Modal.svelte';
  	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
  ```

- [ ] **Step 2: Add featured confirmation state and function**

  After `let deleteError = $state('');` (line 69), add:

  ```svelte
  	let featuredConfirmOpen = $state(false);
  	let featuredConfirmTarget = $state<{ id: string; name: string; isFeatured: boolean } | null>(null);

  	function openFeaturedConfirm(id: string, name: string, isFeatured: boolean) {
  		featuredConfirmTarget = { id, name, isFeatured };
  		featuredConfirmOpen = true;
  	}
  ```

- [ ] **Step 3: Replace the actions `<td>` in the table row**

  Find the actions `<td>` starting at line 216 and replace it entirely:

  ```svelte
  								<td class="px-5 py-3 text-right">
  									<DropdownMenu items={[
  										{ label: $t('common.viewProfile'), onclick: () => goto(`/teachers/${tid}`) },
  										{
  											label: isFeatured ? 'Unfeature' : 'Feature',
  											onclick: () => openFeaturedConfirm(tid, user.full_name ?? user.name ?? '', isFeatured)
  										},
  										{ label: 'Delete', variant: 'danger', onclick: () => openDelete(tid, user.full_name ?? user.name ?? '') },
  									]} />
  								</td>
  ```

- [ ] **Step 4: Add featured confirmation modal**

  After the closing `</Modal>` of the Delete Teacher Modal (line 333), add:

  ```svelte
  <!-- Featured Confirmation Modal -->
  <Modal
  	open={featuredConfirmOpen}
  	title="{featuredConfirmTarget?.isFeatured ? 'Unfeature' : 'Feature'} {featuredConfirmTarget?.name ?? ''}?"
  	onclose={() => (featuredConfirmOpen = false)}
  >
  	<p class="text-sm text-text2">
  		{#if featuredConfirmTarget?.isFeatured}
  			{featuredConfirmTarget.name} will be removed from the Featured Teachers section.
  		{:else}
  			{featuredConfirmTarget?.name} will appear in the Featured Teachers section on the homepage.
  		{/if}
  	</p>
  	{#snippet footer()}
  		<Button variant="secondary" size="sm" onclick={() => (featuredConfirmOpen = false)}>
  			{$t('common.cancel')}
  		</Button>
  		<Button variant="primary" size="sm" onclick={async () => {
  			if (featuredConfirmTarget) await toggleFeatured(featuredConfirmTarget.id);
  			featuredConfirmOpen = false;
  		}}>
  			Confirm
  		</Button>
  	{/snippet}
  </Modal>
  ```

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 6: Commit**

  ```bash
  git add src/routes/admin/teachers/+page.svelte
  git commit -m "feat: three-dot menu and featured confirmation modal on admin teachers"
  ```

---

### Task 3: Admin students — three-dot menu + age column

**Files:**
- Modify: `src/routes/admin/students/+page.svelte`

- [ ] **Step 1: Add imports**

  Replace the import block at lines 1–9:

  ```svelte
  <script lang="ts">
  	import { onMount } from 'svelte';
  	import { goto } from '$app/navigation';
  	import { t } from 'svelte-i18n';
  	import { api } from '$lib/api';
  	import Badge from '$lib/components/ui/Badge.svelte';
  	import Card from '$lib/components/ui/Card.svelte';
  	import Avatar from '$lib/components/ui/Avatar.svelte';
  	import Button from '$lib/components/ui/Button.svelte';
  	import Modal from '$lib/components/ui/Modal.svelte';
  	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
  ```

- [ ] **Step 2: Replace the age_category column header (line 155)**

  ```svelte
  							<th class="px-5 py-3 text-left hidden md:table-cell">Age</th>
  ```

- [ ] **Step 3: Replace the age_category badge cell (lines 173–175)**

  Replace:
  ```svelte
  								<td class="px-5 py-3 hidden md:table-cell">
  									<Badge variant="violet" label={user.age_category ?? ''} />
  								</td>
  ```

  With:
  ```svelte
  								<td class="px-5 py-3 hidden md:table-cell text-sm text-text2">
  									{(() => {
  										const dob = user.date_of_birth;
  										if (!dob) return '—';
  										const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  										return Number.isFinite(age) && age >= 0 ? String(age) : '—';
  									})()}
  								</td>
  ```

- [ ] **Step 4: Replace the actions `<td>` (lines 181–192)**

  Replace:
  ```svelte
  								<td class="px-5 py-3 text-right">
  									<button
  										onclick={() => openDelete(user.user_id ?? user.id, user.full_name ?? user.name ?? '')}
  										class="mr-3 text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
  									>
  										Delete
  									</button>
  									<a href="/students/{user.user_id ?? user.id}"
  										class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
  										{$t('common.viewProfile')}
  									</a>
  								</td>
  ```

  With:
  ```svelte
  								<td class="px-5 py-3 text-right">
  									<DropdownMenu items={[
  										{ label: $t('common.viewProfile'), onclick: () => goto(`/students/${user.user_id ?? user.id}`) },
  										{ label: 'Delete', variant: 'danger', onclick: () => openDelete(user.user_id ?? user.id, user.full_name ?? user.name ?? '') },
  									]} />
  								</td>
  ```

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 6: Commit**

  ```bash
  git add src/routes/admin/students/+page.svelte
  git commit -m "feat: three-dot menu and age column on admin students"
  ```

---

### Task 4: Admin subjects — three-dot menu + edit modal

**Files:**
- Modify: `src/routes/admin/subjects/+page.svelte`

- [ ] **Step 1: Add DropdownMenu import**

  Replace the import block at lines 1–8:

  ```svelte
  <script lang="ts">
  	import { onMount } from 'svelte';
  	import { t } from 'svelte-i18n';
  	import { api } from '$lib/api';
  	import Badge from '$lib/components/ui/Badge.svelte';
  	import Card from '$lib/components/ui/Card.svelte';
  	import Button from '$lib/components/ui/Button.svelte';
  	import Modal from '$lib/components/ui/Modal.svelte';
  	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
  ```

- [ ] **Step 2: Add edit subject state variables**

  After `let deleteSubjectError = $state('');` (line 22), add:

  ```svelte
  	let editSubjectOpen = $state(false);
  	let editSubjectTarget = $state<{ id: string; name: string } | null>(null);
  	let editSubjectName = $state('');
  	let editSubjectLoading = $state(false);
  	let editSubjectError = $state('');
  	let editSubjectFormEl = $state<HTMLFormElement | null>(null);
  ```

- [ ] **Step 3: Add `openEditSubject` and `handleEditSubject` functions**

  After the `handleDeleteSubject` function (after line 70), add:

  ```svelte
  	function openEditSubject(id: string, name: string) {
  		editSubjectTarget = { id, name };
  		editSubjectName = name;
  		editSubjectError = '';
  		editSubjectOpen = true;
  	}

  	async function handleEditSubject(e: SubmitEvent) {
  		e.preventDefault();
  		if (!editSubjectTarget) return;
  		editSubjectLoading = true;
  		editSubjectError = '';
  		try {
  			await api.put(`/admin/subjects/${editSubjectTarget.id}`, { name: editSubjectName });
  			allSubjects = allSubjects.map((s: any) =>
  				s.id === editSubjectTarget!.id ? { ...s, name: editSubjectName } : s
  			);
  			editSubjectOpen = false;
  		} catch {
  			editSubjectError = 'Failed to save. Please try again.';
  		} finally {
  			editSubjectLoading = false;
  		}
  	}
  ```

- [ ] **Step 4: Replace the actions `<td>` Delete button (lines 112–119)**

  Replace:
  ```svelte
  								<td class="px-5 py-3 text-right">
  									<button
  										onclick={() => openDeleteSubject(subject.id, subject.name)}
  										class="text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
  									>
  										Delete
  									</button>
  								</td>
  ```

  With:
  ```svelte
  								<td class="px-5 py-3 text-right">
  									<DropdownMenu items={[
  										{ label: 'Edit', onclick: () => openEditSubject(subject.id, subject.name) },
  										{ label: 'Delete', variant: 'danger', onclick: () => openDeleteSubject(subject.id, subject.name) },
  									]} />
  								</td>
  ```

- [ ] **Step 5: Add edit subject modal**

  After the closing `</Modal>` of the Delete Subject Modal (line 161), add:

  ```svelte
  <!-- Edit Subject Modal -->
  <Modal open={editSubjectOpen} title="Edit Subject" onclose={() => (editSubjectOpen = false)}>
  	{#if editSubjectError}
  		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{editSubjectError}</div>
  	{/if}
  	<form bind:this={editSubjectFormEl} onsubmit={handleEditSubject} class="flex flex-col gap-4">
  		<div class="flex flex-col gap-1.5">
  			<label for="editSubjectName" class="text-[13px] font-medium">Subject Name</label>
  			<input id="editSubjectName" type="text" bind:value={editSubjectName} required
  				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
  		</div>
  	</form>
  	{#snippet footer()}
  		<Button variant="secondary" size="sm" onclick={() => (editSubjectOpen = false)}>{$t('common.cancel')}</Button>
  		<Button variant="primary" size="sm" loading={editSubjectLoading} onclick={() => editSubjectFormEl?.requestSubmit()}>Save</Button>
  	{/snippet}
  </Modal>
  ```

- [ ] **Step 6: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 7: Commit**

  ```bash
  git add src/routes/admin/subjects/+page.svelte
  git commit -m "feat: three-dot menu and edit subject modal on admin subjects"
  ```

---

### Task 5: Final verification

- [ ] **Step 1: Run full type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`, same 13 pre-existing warnings.

- [ ] **Step 2: Start dev server**

  ```powershell
  npm run dev
  ```

- [ ] **Step 3: Verify admin/teachers**

  Open `http://localhost:5173/admin/teachers` (logged in as admin).

  - Each row has a `⋮` button in the Actions column — no inline Delete/Feature/View Profile buttons
  - Click `⋮` → dropdown shows: View Profile / Feature (or Unfeature) / Delete
  - Click outside dropdown → it closes
  - Click **Feature** → confirmation modal opens with teacher name in title
  - Click Cancel → modal closes, featured status unchanged
  - Click Confirm → featured status toggles, modal closes
  - Click **Delete** → existing delete confirmation modal opens

- [ ] **Step 4: Verify admin/students**

  Open `http://localhost:5173/admin/students`.

  - Age column shows a number (e.g. `"17"`) calculated from date_of_birth, or `"—"` if absent
  - No empty violet badge in that column
  - Each row has a `⋮` button → dropdown shows: View Profile / Delete

- [ ] **Step 5: Verify admin/subjects**

  Open `http://localhost:5173/admin/subjects`.

  - Each row has a `⋮` button → dropdown shows: Edit / Delete
  - Click **Edit** → modal opens with current subject name pre-filled
  - Change the name and click Save → row updates in-place, modal closes
  - Click **Delete** → existing delete confirmation modal opens
