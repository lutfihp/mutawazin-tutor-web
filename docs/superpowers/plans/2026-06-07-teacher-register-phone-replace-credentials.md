# Teacher Registration: Replace Credentials with Phone Number

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the optional credentials collapsible section from the teacher registration form and add a phone number field (after Bio) in its place.

**Architecture:** Three-file change — remove 7 i18n keys from both locale files, then rewrite the registration page to drop credential state/functions/UI and add a `phoneNumber` state + tel input. Phone number is sent as `phone_number: phoneNumber || null` in the POST payload. Backend needs a parallel delta (prompt provided at the end).

**Tech Stack:** SvelteKit (Svelte 5 runes), svelte-i18n, Tailwind v3

---

## File Map

| File | Change |
|---|---|
| `src/locales/en.json` | Remove 7 credential keys under `auth.registerTeacher` |
| `src/locales/id.json` | Same removals |
| `src/routes/register/teacher/+page.svelte` | Remove credentials section; add phone number field |

---

### Task 1: Remove credential i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Remove credential keys from en.json**

In `src/locales/en.json`, under `auth.registerTeacher`, delete these 7 lines:

```json
"credentials": "Add Credentials (optional)",
"credTitle": "Title",
"credTitlePlaceholder": "e.g. M.Sc. Mathematics",
"credInstitution": "Institution",
"credInstitutionPlaceholder": "e.g. University of Jordan",
"credYear": "Year",
"addCredential": "+ Add another credential",
```

The `auth.registerTeacher` block should now contain only: `title`, `subtitle`, `fullName`, `fullNamePlaceholder`, `email`, `emailPlaceholder`, `password`, `passwordPlaceholder`, `bio`, `bioPlaceholder`, `subjects`, `subjectsPlaceholder`, `subjectHelper`, `submit`, `reviewNotice`, `alreadyHaveAccount`, `logIn`, `successTitle`, `success`, `errors`.

- [ ] **Step 2: Remove credential keys from id.json**

In `src/locales/id.json`, under `auth.registerTeacher`, delete these 7 lines:

```json
"credentials": "Tambahkan Kredensial (opsional)",
"credTitle": "Gelar/Sertifikat",
"credTitlePlaceholder": "mis. S2 Matematika",
"credInstitution": "Institusi",
"credInstitutionPlaceholder": "mis. Universitas Indonesia",
"credYear": "Tahun",
"addCredential": "+ Tambahkan kredensial lain",
```

- [ ] **Step 3: Verify check passes**

```powershell
npm run check
```

Expected: 0 errors (16 pre-existing warnings are fine).

- [ ] **Step 4: Commit**

```powershell
git add src/locales/en.json src/locales/id.json
git commit -m "feat(register): remove credential i18n keys from teacher registration"
```

---

### Task 2: Rewrite teacher registration page

**Files:**
- Modify: `src/routes/register/teacher/+page.svelte`

- [ ] **Step 1: Replace the script block**

Replace the entire `<script lang="ts">` block (lines 1–76) with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let bio = $state('');
	let phoneNumber = $state('');
	let subjectIds = $state<string[]>([]);
	let subjectEntries = $state<{ id: string; name: string }[]>([]);
	let loading = $state(false);
	let success = $state(false);
	let error = $state('');
	let emailAvailable = $state<boolean | null>(null);
	let emailDebounce: ReturnType<typeof setTimeout>;
	let loadingSubjects = $state(true);

	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string }>>('/subjects?status=verified');
			subjectEntries = body.data;
		} catch {
			subjectEntries = [];
		} finally {
			loadingSubjects = false;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (emailAvailable === false) return;
		error = '';
		loading = true;
		try {
			await api.post('/auth/register/teacher', {
				full_name: fullName,
				email,
				password,
				bio,
				phone_number: phoneNumber || null,
				subject_ids: subjectIds,
			});
			success = true;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409') || msg.toLowerCase().includes('already')) {
				error = $t('auth.registerTeacher.errors.emailTaken');
			} else {
				error = $t('auth.registerTeacher.errors.unknown');
			}
		} finally {
			loading = false;
		}
	}
</script>
```

- [ ] **Step 2: Replace the credentials collapsible with the phone number field**

In the template, find the entire credentials collapsible block (from `<!-- Collapsible credentials -->` down to and including the closing `</div>` of that section — lines 188–226) and replace it with the phone number field:

```svelte
				<!-- Phone number -->
				<div class="flex flex-col gap-1.5">
					<label for="phoneNumber" class="text-[13px] font-medium">{$t('profile.phoneNumber')}</label>
					<input id="phoneNumber" type="tel" bind:value={phoneNumber} placeholder={$t('profile.phoneNumberPlaceholder')}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>
```

This block goes **after** the Bio field and **before** the Subject multi-select.

- [ ] **Step 3: Verify check passes**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```powershell
git add src/routes/register/teacher/+page.svelte
git commit -m "feat(register): replace credentials section with phone number field on teacher registration"
```

---

### Task 3: Backend delta prompt

This task produces no code in this repo. Paste the prompt below into the **backend Claude Code session** (`d:\Codading Repo\mutawazin-tutor-api`):

---

> **Backend task — delta v14: add `phone_number` to teacher registration**
>
> Add `phone_number: str | None = None` to `TeacherRegisterRequest` (Pydantic model).
> In the register teacher endpoint, save the value to the teacher record on creation — the same way `bio` is saved.
> No additional validation needed beyond `str | None`.
> This is a non-breaking additive change: existing callers that omit the field receive `null`.

---

- [ ] **Step 1: Paste the prompt above into the backend session and confirm the change is done before proceeding to live verification.**

---

## Live verification checklist

After both frontend and backend are deployed/running:

1. Open `/register/teacher` — credentials accordion is gone, phone number field appears between Bio and Subjects
2. Submit with a phone number → registration succeeds, teacher record has `phone_number` set
3. Submit with phone number left blank → registration succeeds, `phone_number` is `null` on the record
4. Log in as the new teacher → own profile shows the phone number value in the Phone Number card
5. Run `npm run check` one final time → 0 errors
