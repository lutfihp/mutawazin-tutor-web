# Delta v4 Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up email/username availability checks on registration forms and admin create modals, add Delete buttons with confirmation modals on all three admin management pages, and filter `"deleted"` status from rendered lists.

**Architecture:** All changes are inline per-page (no new components). Availability checks use a local `setTimeout`/`clearTimeout` debounce at 400 ms, writing to a nullable boolean state. Delete flows use the existing `<Modal>` component with local open/target/loading/error state. No shared utilities; each page is self-contained.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS v3, existing `api` client (`src/lib/api.ts`), existing `<Modal>` and `<Button>` components.

---

### Task 1: Email availability check — Teacher registration

**Files:**
- Modify: `src/routes/register/teacher/+page.svelte`

- [ ] **Step 1: Add availability state and debounce timer**

  In the `<script>` block, after `let error = $state('');` (line 20), add:

  ```svelte
  let emailAvailable = $state<boolean | null>(null);
  let emailDebounce: ReturnType<typeof setTimeout>;
  ```

- [ ] **Step 2: Guard the submit handler**

  In `handleSubmit`, after `e.preventDefault();` and before `error = '';` (line 43), add:

  ```svelte
  if (emailAvailable === false) return;
  ```

- [ ] **Step 3: Add oninput handler to the email field**

  Find the email `<input>` (around line 110). Replace it with:

  ```svelte
  <input id="regEmail" type="email" bind:value={email} required placeholder={$t('auth.registerTeacher.emailPlaceholder')} autocomplete="email"
    oninput={(e) => {
      clearTimeout(emailDebounce);
      const val = (e.target as HTMLInputElement).value.trim();
      if (!val) { emailAvailable = null; return; }
      emailDebounce = setTimeout(async () => {
        try {
          const res = await api.get<{ available: boolean }>(`/auth/check/email?email=${encodeURIComponent(val)}`);
          emailAvailable = res.available;
        } catch { emailAvailable = null; }
      }, 400);
    }}
    class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
  ```

- [ ] **Step 4: Add inline error below the email field**

  Immediately after the email `<input>` (still inside `<div class="flex flex-col gap-1.5">`), add:

  ```svelte
  {#if emailAvailable === false}
    <p class="text-xs text-errorText mt-1">Email is already registered.</p>
  {/if}
  ```

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 6: Commit**

  ```bash
  git add src/routes/register/teacher/+page.svelte
  git commit -m "feat: add debounced email availability check on teacher registration"
  ```

---

### Task 2: Email availability check — Student registration

**Files:**
- Modify: `src/routes/register/student/+page.svelte`

- [ ] **Step 1: Add availability state and debounce timer**

  In the `<script>` block, after `let error = $state('');` (line 14), add:

  ```svelte
  let emailAvailable = $state<boolean | null>(null);
  let emailDebounce: ReturnType<typeof setTimeout>;
  ```

- [ ] **Step 2: Guard the submit handler**

  In `handleSubmit`, after `e.preventDefault();` (line 17) and before `error = '';`, add:

  ```svelte
  if (emailAvailable === false) return;
  ```

- [ ] **Step 3: Add oninput handler to the email field**

  Find the email `<input>` (around line 77). Replace it with:

  ```svelte
  <input id="regEmail" type="email" bind:value={email} required placeholder={$t('auth.registerStudent.emailPlaceholder')} autocomplete="email"
    oninput={(e) => {
      clearTimeout(emailDebounce);
      const val = (e.target as HTMLInputElement).value.trim();
      if (!val) { emailAvailable = null; return; }
      emailDebounce = setTimeout(async () => {
        try {
          const res = await api.get<{ available: boolean }>(`/auth/check/email?email=${encodeURIComponent(val)}`);
          emailAvailable = res.available;
        } catch { emailAvailable = null; }
      }, 400);
    }}
    class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
  ```

- [ ] **Step 4: Add inline error below the email field**

  Immediately after the email `<input>` (still inside `<div class="flex flex-col gap-1.5">`), add:

  ```svelte
  {#if emailAvailable === false}
    <p class="text-xs text-errorText mt-1">Email is already registered.</p>
  {/if}
  ```

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 6: Commit**

  ```bash
  git add src/routes/register/student/+page.svelte
  git commit -m "feat: add debounced email availability check on student registration"
  ```

---

### Task 3: Admin teachers — username check + enum filter + delete

**Files:**
- Modify: `src/routes/admin/teachers/+page.svelte`

- [ ] **Step 1: Extend the fetch filter to exclude `"deleted"`**

  Find the `fetchTeachers` function. The filter line currently reads (around line 29):
  ```svelte
  .filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending');
  ```
  Replace with:
  ```svelte
  .filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending' && t.status !== 'deleted');
  ```

- [ ] **Step 2: Add `"deleted"` to `statusVariant`**

  Find `statusVariant` (around line 113). Update the map:
  ```svelte
  function statusVariant(s: string): 'success' | 'warning' | 'error' | 'active' | 'gray' {
  	const map: Record<string, 'success' | 'warning' | 'error' | 'active' | 'gray'> = {
  		verified: 'success', Verified: 'success',
  		active: 'active',    Active: 'active',
  		rejected: 'error',   Rejected: 'error',
  		deleted: 'gray',     Deleted: 'gray',
  	};
  	return map[s] ?? 'gray';
  }
  ```

- [ ] **Step 3: Add username availability state and delete state**

  After `let newSubjectInput = $state('');` (the last create-modal state variable, around line 62), add:

  ```svelte
  let usernameAvailable = $state<boolean | null>(null);
  let usernameDebounce: ReturnType<typeof setTimeout>;

  let deleteOpen = $state(false);
  let deleteTarget = $state<{ id: string; name: string } | null>(null);
  let deleteLoading = $state(false);
  let deleteError = $state('');
  ```

- [ ] **Step 4: Reset `usernameAvailable` in `openCreate`**

  In the `openCreate` function, add `usernameAvailable = null;` before the closing brace:

  ```svelte
  function openCreate() {
  	createOpen = true;
  	createError = '';
  	newFullName = '';
  	newUsername = '';
  	newPassword = '';
  	showNewPassword = false;
  	newBio = '';
  	newSubjects = [];
  	newSubjectInput = '';
  	usernameAvailable = null;
  }
  ```

- [ ] **Step 5: Guard `handleCreate` against taken username**

  In `handleCreate`, after `e.preventDefault();` and before `createError = '';`, add:

  ```svelte
  if (usernameAvailable === false) return;
  ```

- [ ] **Step 6: Add `openDelete` and `handleDelete` functions**

  After the `handleCreate` function, add:

  ```svelte
  function openDelete(id: string, name: string) {
  	deleteTarget = { id, name };
  	deleteError = '';
  	deleteOpen = true;
  }

  async function handleDelete() {
  	if (!deleteTarget) return;
  	deleteLoading = true;
  	deleteError = '';
  	try {
  		await api.delete(`/admin/teachers/${deleteTarget.id}`);
  		allTeachers = allTeachers.filter((t: any) => (t.user_id ?? t.id) !== deleteTarget!.id);
  		deleteOpen = false;
  	} catch {
  		deleteError = 'Failed to delete teacher. Please try again.';
  	} finally {
  		deleteLoading = false;
  	}
  }
  ```

- [ ] **Step 7: Add oninput handler and inline error to username field in create modal**

  Find the `newUsername` `<input>` in the Create Teacher Modal (around line 226). Replace it with:

  ```svelte
  <input id="newUsername" type="text" bind:value={newUsername} required
  	placeholder={$t('dashboard.admin.usernamePlaceholder')} autocomplete="off"
  	oninput={(e) => {
  		clearTimeout(usernameDebounce);
  		const val = (e.target as HTMLInputElement).value.trim();
  		if (!val) { usernameAvailable = null; return; }
  		usernameDebounce = setTimeout(async () => {
  			try {
  				const res = await api.get<{ available: boolean }>(`/auth/check/username?username=${encodeURIComponent(val)}`);
  				usernameAvailable = res.available;
  			} catch { usernameAvailable = null; }
  		}, 400);
  	}}
  	class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
  {#if usernameAvailable === false}
  	<p class="text-xs text-errorText mt-1">Username is already taken.</p>
  {/if}
  ```

- [ ] **Step 8: Add Delete button to each teacher table row**

  Find the actions `<td>` in the `{#each filteredTeachers as user}` loop (around line 185). It currently starts with the featured `<button>`. Add the delete button before it:

  ```svelte
  <td class="px-5 py-3 text-right">
  	<button
  		onclick={() => openDelete(tid, user.full_name ?? user.name ?? '')}
  		class="mr-3 text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
  	>
  		Delete
  	</button>
  	<button
  		onclick={() => toggleFeatured(tid)}
  		...existing featured button content...
  	</button>
  	<a href="/teachers/{user.user_id ?? user.id}" ...>
  		{$t('common.viewProfile')}
  	</a>
  </td>
  ```

  The full updated `<td>` (replace the existing actions `<td>` entirely):

  ```svelte
  <td class="px-5 py-3 text-right">
  	<button
  		onclick={() => openDelete(tid, user.full_name ?? user.name ?? '')}
  		class="mr-3 text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
  	>
  		Delete
  	</button>
  	<button
  		onclick={() => toggleFeatured(tid)}
  		disabled={featuredLoading[tid]}
  		class="mr-3 text-sm font-medium px-2 py-1 rounded-sm transition-colors
  		       {isFeatured
  			? 'text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A]'
  			: 'text-text2 bg-bgGray hover:bg-border/50'}
  		       disabled:opacity-50"
  		title={isFeatured ? 'Remove featured' : 'Mark as featured'}
  	>
  		{isFeatured ? '★' : '☆'} {isFeatured ? 'Featured' : 'Feature'}
  	</button>
  	<a href="/teachers/{user.user_id ?? user.id}"
  		class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
  		{$t('common.viewProfile')}
  	</a>
  </td>
  ```

- [ ] **Step 9: Add delete confirmation modal**

  After the closing `</Modal>` of the Create Teacher Modal, add:

  ```svelte
  <!-- Delete Teacher Modal -->
  <Modal open={deleteOpen} title="Delete {deleteTarget?.name ?? ''}?" onclose={() => (deleteOpen = false)}>
  	{#if deleteError}
  		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
  	{/if}
  	<p class="text-sm text-text2">This action cannot be undone.</p>
  	{#snippet footer()}
  		<Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
  		<Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
  	{/snippet}
  </Modal>
  ```

- [ ] **Step 10: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 11: Commit**

  ```bash
  git add src/routes/admin/teachers/+page.svelte
  git commit -m "feat: username availability check, delete teacher, filter deleted on admin teachers page"
  ```

---

### Task 4: Admin students — username check + enum filter + delete

**Files:**
- Modify: `src/routes/admin/students/+page.svelte`

- [ ] **Step 1: Extend the fetch filter to exclude `"deleted"`**

  In `fetchStudents`, the filter line currently reads (around line 27):
  ```svelte
  .filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending');
  ```
  Replace with:
  ```svelte
  .filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending' && s.status !== 'deleted');
  ```

- [ ] **Step 2: Add `"deleted"` to `statusVariant`**

  Find `statusVariant` (around line 76). Update the map:

  ```svelte
  function statusVariant(s: string): 'success' | 'warning' | 'error' | 'active' | 'gray' {
  	const map: Record<string, 'success' | 'warning' | 'error' | 'active' | 'gray'> = {
  		verified: 'success', Verified: 'success',
  		active: 'active',    Active: 'active',
  		rejected: 'error',   Rejected: 'error',
  		deleted: 'gray',     Deleted: 'gray',
  	};
  	return map[s] ?? 'gray';
  }
  ```

- [ ] **Step 3: Add username availability state and delete state**

  After `let newDob = $state('');` (around line 44), add:

  ```svelte
  let usernameAvailable = $state<boolean | null>(null);
  let usernameDebounce: ReturnType<typeof setTimeout>;

  let deleteOpen = $state(false);
  let deleteTarget = $state<{ id: string; name: string } | null>(null);
  let deleteLoading = $state(false);
  let deleteError = $state('');
  ```

- [ ] **Step 4: Reset `usernameAvailable` in `openCreate`**

  Update `openCreate`:

  ```svelte
  function openCreate() {
  	createOpen = true;
  	createError = '';
  	newFullName = '';
  	newUsername = '';
  	newPassword = '';
  	showNewPassword = false;
  	newDob = '';
  	usernameAvailable = null;
  }
  ```

- [ ] **Step 5: Guard `handleCreate` against taken username**

  In `handleCreate`, after `e.preventDefault();` and before `createError = '';`, add:

  ```svelte
  if (usernameAvailable === false) return;
  ```

- [ ] **Step 6: Add `openDelete` and `handleDelete` functions**

  After the `handleCreate` function, add:

  ```svelte
  function openDelete(id: string, name: string) {
  	deleteTarget = { id, name };
  	deleteError = '';
  	deleteOpen = true;
  }

  async function handleDelete() {
  	if (!deleteTarget) return;
  	deleteLoading = true;
  	deleteError = '';
  	try {
  		await api.delete(`/admin/students/${deleteTarget.id}`);
  		allStudents = allStudents.filter((s: any) => (s.user_id ?? s.id) !== deleteTarget!.id);
  		deleteOpen = false;
  	} catch {
  		deleteError = 'Failed to delete student. Please try again.';
  	} finally {
  		deleteLoading = false;
  	}
  }
  ```

- [ ] **Step 7: Add oninput handler and inline error to username field in create modal**

  Find the `newUsername` `<input>` in the Create Student Modal (around line 179). Replace it with:

  ```svelte
  <input id="newUsername" type="text" bind:value={newUsername} required
  	placeholder={$t('dashboard.admin.usernamePlaceholder')} autocomplete="off"
  	oninput={(e) => {
  		clearTimeout(usernameDebounce);
  		const val = (e.target as HTMLInputElement).value.trim();
  		if (!val) { usernameAvailable = null; return; }
  		usernameDebounce = setTimeout(async () => {
  			try {
  				const res = await api.get<{ available: boolean }>(`/auth/check/username?username=${encodeURIComponent(val)}`);
  				usernameAvailable = res.available;
  			} catch { usernameAvailable = null; }
  		}, 400);
  	}}
  	class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
  {#if usernameAvailable === false}
  	<p class="text-xs text-errorText mt-1">Username is already taken.</p>
  {/if}
  ```

- [ ] **Step 8: Add Delete button to each student table row**

  Find the actions `<td>` in the `{#each filteredStudents as user}` loop (around line 150). Replace it with:

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

- [ ] **Step 9: Add delete confirmation modal**

  After the closing `</Modal>` of the Create Student Modal, add:

  ```svelte
  <!-- Delete Student Modal -->
  <Modal open={deleteOpen} title="Delete {deleteTarget?.name ?? ''}?" onclose={() => (deleteOpen = false)}>
  	{#if deleteError}
  		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
  	{/if}
  	<p class="text-sm text-text2">This action cannot be undone.</p>
  	{#snippet footer()}
  		<Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
  		<Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
  	{/snippet}
  </Modal>
  ```

- [ ] **Step 10: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 11: Commit**

  ```bash
  git add src/routes/admin/students/+page.svelte
  git commit -m "feat: username availability check, delete student, filter deleted on admin students page"
  ```

---

### Task 5: Admin subjects — enum filter + delete

**Files:**
- Modify: `src/routes/admin/subjects/+page.svelte`

- [ ] **Step 1: Filter `"deleted"` subjects from the fetched list**

  In `fetchSubjects`, the assignment currently reads (around line 23):
  ```svelte
  allSubjects = Array.isArray(result) ? result : [];
  ```
  Replace with:
  ```svelte
  allSubjects = (Array.isArray(result) ? result : []).filter((s: any) => s.status !== 'deleted');
  ```

- [ ] **Step 2: Add delete state variables**

  After `let createSubjectFormEl = $state<HTMLFormElement | null>(null);` (around line 17), add:

  ```svelte
  let deleteSubjectOpen = $state(false);
  let deleteSubjectTarget = $state<{ id: string; name: string } | null>(null);
  let deleteSubjectLoading = $state(false);
  let deleteSubjectError = $state('');
  ```

- [ ] **Step 3: Add `openDeleteSubject` and `handleDeleteSubject` functions**

  After `handleCreateSubject`, add:

  ```svelte
  function openDeleteSubject(id: string, name: string) {
  	deleteSubjectTarget = { id, name };
  	deleteSubjectError = '';
  	deleteSubjectOpen = true;
  }

  async function handleDeleteSubject() {
  	if (!deleteSubjectTarget) return;
  	deleteSubjectLoading = true;
  	deleteSubjectError = '';
  	try {
  		await api.delete(`/admin/subjects/${deleteSubjectTarget.id}`);
  		allSubjects = allSubjects.filter((s: any) => s.id !== deleteSubjectTarget!.id);
  		deleteSubjectOpen = false;
  	} catch {
  		deleteSubjectError = 'Failed to delete subject. Please try again.';
  	} finally {
  		deleteSubjectLoading = false;
  	}
  }
  ```

- [ ] **Step 4: Add Actions column header to subjects table**

  Find the `<thead>` row in the subjects table (around line 72). Replace it with:

  ```svelte
  <thead class="bg-bgGray text-[13px] font-medium text-text2">
  	<tr>
  		<th class="px-5 py-3 text-left">{$t('dashboard.admin.subjectName')}</th>
  		<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.status')}</th>
  		<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
  	</tr>
  </thead>
  ```

- [ ] **Step 5: Add Delete button to each subject table row**

  Find the `{#each allSubjects as subject}` row in `<tbody>` (around line 79). Replace it with:

  ```svelte
  {#each allSubjects as subject}
  	<tr class="hover:bg-bgGray/50 transition-colors">
  		<td class="px-5 py-3 font-medium">{subject.name}</td>
  		<td class="px-5 py-3 hidden sm:table-cell">
  			<Badge variant="success" label={subject.status ?? 'verified'} />
  		</td>
  		<td class="px-5 py-3 text-right">
  			<button
  				onclick={() => openDeleteSubject(subject.id, subject.name)}
  				class="text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
  			>
  				Delete
  			</button>
  		</td>
  	</tr>
  {/each}
  ```

- [ ] **Step 6: Add delete confirmation modal**

  After the closing `</Modal>` of the Create Subject Modal, add:

  ```svelte
  <!-- Delete Subject Modal -->
  <Modal open={deleteSubjectOpen} title="Delete {deleteSubjectTarget?.name ?? ''}?" onclose={() => (deleteSubjectOpen = false)}>
  	{#if deleteSubjectError}
  		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteSubjectError}</div>
  	{/if}
  	<p class="text-sm text-text2">This action cannot be undone.</p>
  	{#snippet footer()}
  		<Button variant="secondary" size="sm" onclick={() => (deleteSubjectOpen = false)}>{$t('common.cancel')}</Button>
  		<Button variant="danger" size="sm" loading={deleteSubjectLoading} onclick={handleDeleteSubject}>Delete</Button>
  	{/snippet}
  </Modal>
  ```

- [ ] **Step 7: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 8: Commit**

  ```bash
  git add src/routes/admin/subjects/+page.svelte
  git commit -m "feat: delete subject with confirmation, filter deleted on admin subjects page"
  ```

---

### Task 6: Final verification

- [ ] **Step 1: Run full type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`, same 13 pre-existing warnings as before.

- [ ] **Step 2: Start dev server and verify availability checks**

  ```powershell
  npm run dev
  ```

  - Open `http://localhost:5173/register/teacher`
  - Type a known-registered email → inline error "Email is already registered." appears after ~400 ms
  - Type a fresh email → error disappears
  - Submit with taken email → form does not submit

  - Open `http://localhost:5173/register/student` — same behaviour on its email field

- [ ] **Step 3: Verify admin username check**

  - Log in as `admin@mutawazin.com / changeme123`
  - Go to `http://localhost:5173/admin/teachers` → click "Create Teacher"
  - Type a known-taken username → inline error "Username is already taken." after ~400 ms
  - Close and reopen modal → inline error is cleared (null reset worked)

  - Repeat on `http://localhost:5173/admin/students` → "Create Student"

- [ ] **Step 4: Verify delete flows**

  - On `/admin/teachers` → click Delete for any teacher → modal opens with name in title
  - Click Cancel → modal closes, row unchanged
  - Click Delete → 204 from backend → row disappears, modal closes
  - Repeat on `/admin/students` and `/admin/subjects`
