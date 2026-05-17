# Admin Create User + Remove Notification Dot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hardcoded notification red dot and add contextual "Create Teacher / Create Student" buttons with modals to the admin All Users card.

**Architecture:** Two independent changes in two files. The notification dot is a one-line removal. The create-user feature adds state + modal to `admin/+page.svelte` using the existing `Modal` component and `api.post()` client — same patterns already used in the courses create modal and teacher registration form.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS v3, svelte-i18n, lucide-svelte

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/lib/components/layout/Navbar.svelte` — remove 1 line |
| Modify | `src/locales/en.json` — add 7 keys under `dashboard.admin` |
| Modify | `src/locales/id.json` — same 7 keys in Indonesian |
| Modify | `src/routes/admin/+page.svelte` — add Modal import, state, logic, button, modal markup |

---

### Task 1: Remove hardcoded notification dot

**Files:**
- Modify: `src/lib/components/layout/Navbar.svelte:98`

- [ ] **Step 1: Delete the hardcoded dot span**

In `src/lib/components/layout/Navbar.svelte`, find and delete this exact line (currently inside the bell button):
```svelte
			<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-pill border-2 border-white" aria-hidden="true"></span>
```

The bell button after the change should look like:
```svelte
		<button
			class="relative w-9 h-9 flex items-center justify-center rounded-pill border border-border text-text2 hover:text-text transition-colors"
			aria-label="Notifications"
		>
			<Bell size={16} aria-hidden="true" />
		</button>
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/components/layout/Navbar.svelte
git commit -m "fix: remove hardcoded notification dot (no notifications API)"
```

---

### Task 2: Add locale keys for create-user forms

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add 7 keys under `dashboard.admin` in `en.json`**

Inside the `"dashboard"` → `"admin"` object in `src/locales/en.json`, add after the `"allStatuses"` key:
```json
    "createTeacher": "+ Create Teacher",
    "createStudent": "+ Create Student",
    "createTeacherTitle": "Create Teacher Account",
    "createStudentTitle": "Create Student Account",
    "createSuccess": "Account created successfully.",
    "usernameLabel": "Username",
    "usernamePlaceholder": "e.g. layla.haddad"
```

- [ ] **Step 2: Add matching keys to `id.json`**

Inside the `"dashboard"` → `"admin"` object in `src/locales/id.json`, add after the `"allStatuses"` key:
```json
    "createTeacher": "+ Buat Guru",
    "createStudent": "+ Buat Murid",
    "createTeacherTitle": "Buat Akun Guru",
    "createStudentTitle": "Buat Akun Murid",
    "createSuccess": "Akun berhasil dibuat.",
    "usernameLabel": "Nama pengguna",
    "usernamePlaceholder": "mis. layla.haddad"
```

- [ ] **Step 3: Run type check to confirm no broken `$t()` calls**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

---

### Task 3: Add create-user state and logic to admin page

**Files:**
- Modify: `src/routes/admin/+page.svelte` — script block only

- [ ] **Step 1: Add Modal import**

In `src/routes/admin/+page.svelte`, add to the imports block:
```svelte
	import Modal from '$lib/components/ui/Modal.svelte';
```

- [ ] **Step 2: Add create-user state variables after `onMount(fetchAllUsers)`**

```svelte
	// Create user modal
	let createOpen = $state(false);
	let createError = $state('');
	let createLoading = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);

	// Shared fields
	let newFullName = $state('');
	let newUsername = $state('');
	let newPassword = $state('');
	let showNewPassword = $state(false);

	// Teacher-only fields
	let newBio = $state('');
	let newSubjects = $state<string[]>([]);
	let newSubjectInput = $state('');

	// Student-only field
	let newDob = $state('');
```

- [ ] **Step 3: Add create-user functions after the `statusVariant` function**

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
		newDob = '';
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		createError = '';
		createLoading = true;
		try {
			if (activeTab === 'teachers') {
				await api.post('/admin/users/teacher', {
					full_name: newFullName,
					username: newUsername,
					password: newPassword,
					bio: newBio,
					subjects: newSubjects,
					credentials: [],
				});
			} else {
				await api.post('/admin/users/student', {
					full_name: newFullName,
					username: newUsername,
					password: newPassword,
					date_of_birth: newDob,
				});
			}
			createOpen = false;
			await fetchAllUsers();
		} catch (err: unknown) {
			createError = err instanceof Error ? err.message : $t('auth.login.errors.unknown');
		} finally {
			createLoading = false;
		}
	}

	function addNewTag() {
		const val = newSubjectInput.trim().replace(/,+$/, '');
		if (val && !newSubjects.includes(val)) newSubjects = [...newSubjects, val];
		newSubjectInput = '';
	}

	function removeNewTag(i: number) {
		newSubjects = newSubjects.filter((_, idx) => idx !== i);
	}

	function handleNewTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addNewTag(); }
		else if (e.key === 'Backspace' && !newSubjectInput) newSubjects = newSubjects.slice(0, -1);
	}
```

---

### Task 4: Add Create button to All Users card header

**Files:**
- Modify: `src/routes/admin/+page.svelte` — All Users card `{#snippet head()}` block

The All Users card head currently ends with the status filter `</select>`. Add the Create button after the select, inside the wrapping flex div.

- [ ] **Step 1: Add the button**

Find this line in the All Users card head:
```svelte
				</select>
				</div>
			{/snippet}
```

Replace with:
```svelte
				</select>
				<Button variant="primary" size="sm" onclick={openCreate}>
					{activeTab === 'teachers' ? $t('dashboard.admin.createTeacher') : $t('dashboard.admin.createStudent')}
				</Button>
				</div>
			{/snippet}
```

---

### Task 5: Add Create User modal markup

**Files:**
- Modify: `src/routes/admin/+page.svelte` — add Modal at the end, before `</div>` closing tag

- [ ] **Step 1: Add the modal at the very end of the template (after the All Users card closing `</Card>` tag)**

```svelte
	<!-- Create User Modal -->
	<Modal
		open={createOpen}
		title={activeTab === 'teachers' ? $t('dashboard.admin.createTeacherTitle') : $t('dashboard.admin.createStudentTitle')}
		onclose={() => (createOpen = false)}
	>
		{#if createError}
			<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">
				{createError}
			</div>
		{/if}
		<form bind:this={formEl} onsubmit={handleCreate} class="flex flex-col gap-4">
			<!-- Full name -->
			<div class="flex flex-col gap-1.5">
				<label for="newFullName" class="text-[13px] font-medium">{$t('auth.registerTeacher.fullName')}</label>
				<input id="newFullName" type="text" bind:value={newFullName} required
					placeholder={$t('auth.registerTeacher.fullNamePlaceholder')}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
			</div>

			<!-- Username -->
			<div class="flex flex-col gap-1.5">
				<label for="newUsername" class="text-[13px] font-medium">{$t('dashboard.admin.usernameLabel')}</label>
				<input id="newUsername" type="text" bind:value={newUsername} required
					placeholder={$t('dashboard.admin.usernamePlaceholder')}
					autocomplete="off"
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
			</div>

			<!-- Password -->
			<div class="flex flex-col gap-1.5">
				<label for="newPassword" class="text-[13px] font-medium">{$t('auth.registerTeacher.password')}</label>
				<div class="relative">
					<input id="newPassword" type={showNewPassword ? 'text' : 'password'} bind:value={newPassword} required
						autocomplete="new-password"
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					<button type="button" onclick={() => (showNewPassword = !showNewPassword)}
						class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded"
						aria-label={showNewPassword ? $t('common.hide') + ' password' : $t('common.show') + ' password'}>
						{showNewPassword ? $t('common.hide') : $t('common.show')}
					</button>
				</div>
			</div>

			{#if activeTab === 'teachers'}
				<!-- Bio (optional) -->
				<div class="flex flex-col gap-1.5">
					<label for="newBio" class="text-[13px] font-medium">{$t('auth.registerTeacher.bio')}</label>
					<textarea id="newBio" bind:value={newBio} rows={3}
						placeholder={$t('auth.registerTeacher.bioPlaceholder')}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical min-h-[84px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
				</div>

				<!-- Subjects (optional) -->
				<div class="flex flex-col gap-1.5">
					<label for="newSubjectInput" class="text-[13px] font-medium">{$t('auth.registerTeacher.subjects')}</label>
					<div role="group" aria-label={$t('auth.registerTeacher.subjects')}
						class="flex flex-wrap gap-1.5 items-center p-2 border border-border rounded-sm bg-white min-h-[44px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
						{#each newSubjects as subject, i}
							<span class="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 bg-primary-light text-primary-dark text-xs font-medium rounded-pill">
								{subject}
								<button type="button" onclick={() => removeNewTag(i)}
									class="w-4 h-4 grid place-items-center rounded-pill hover:bg-primary-dark/20 transition-colors"
									aria-label="Remove {subject}">×</button>
							</span>
						{/each}
						<input id="newSubjectInput" type="text" bind:value={newSubjectInput}
							onkeydown={handleNewTagKeydown} onblur={addNewTag}
							placeholder={newSubjects.length === 0 ? $t('auth.registerTeacher.subjectsPlaceholder') : ''}
							class="flex-1 min-w-[100px] border-0 outline-none bg-transparent text-sm text-text placeholder:text-text3"
							aria-label={$t('auth.registerTeacher.subjects')} />
					</div>
				</div>
			{:else}
				<!-- Date of birth -->
				<div class="flex flex-col gap-1.5">
					<label for="newDob" class="text-[13px] font-medium">{$t('auth.registerStudent.dob')}</label>
					<input id="newDob" type="date" bind:value={newDob} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					<p class="text-xs text-text2">{$t('auth.registerStudent.dobHelper')}</p>
				</div>
			{/if}
		</form>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>
				{$t('common.cancel')}
			</Button>
			<Button variant="primary" size="sm" loading={createLoading} onclick={() => formEl?.requestSubmit()}>
				{activeTab === 'teachers' ? $t('dashboard.admin.createTeacher') : $t('dashboard.admin.createStudent')}
			</Button>
		{/snippet}
	</Modal>
```

---

### Task 6: Verify and commit

- [ ] **Step 1: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

- [ ] **Step 2: Commit**

```powershell
git add src/routes/admin/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: admin create teacher/student modal + wire All Users list"
```

---

## Self-Review

**Spec coverage:**
- ✅ Remove notification dot → Task 1
- ✅ Contextual create button in All Users card header → Task 4
- ✅ Create Teacher modal (full name, username, password, bio, subjects) → Task 5
- ✅ Create Student modal (full name, username, password, dob) → Task 5
- ✅ `POST /admin/users/teacher` and `POST /admin/users/student` → Task 3 `handleCreate`
- ✅ Close modal + refresh list on success → Task 3 `handleCreate`
- ✅ Error display inside modal → Task 5
- ✅ Locale keys EN + ID → Task 2

**Placeholder scan:** None found. All code blocks are complete and self-contained.

**Type consistency:** `formEl` typed as `HTMLFormElement | null`, `createError` as `string`, `newSubjects` as `string[]` — consistent throughout Tasks 3 and 5.
