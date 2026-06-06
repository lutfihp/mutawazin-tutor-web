# Delta v13 — Phone Number Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional private `phone_number` field to teacher and student profiles — type definitions, i18n strings, display (owner/admin only), and inline editing on own profile.

**Architecture:** Four isolated tasks — types first, then i18n, then teacher profile (script then template), then student profile (combined). Each task committed separately. No new files, no new routes, no layout changes.

**Tech Stack:** SvelteKit 5 (runes mode), TypeScript, svelte-i18n, Tailwind v3. Verify with `npm run check` after each task.

---

## Task 1: Add TypeScript Types and i18n Strings

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Append four type exports to `src/lib/api.ts`**

  The file currently ends at line 88 after `DashboardReportItem`. Append after that last `};`:

  ```typescript
  export type TeacherProfileResponse = {
    id: string;
    user_id: string;
    full_name: string;
    photo_url: string | null;
    bio: string;
    teaching_mode: string;
    city: string | null;
    university: string | null;
    teaching_experience: Array<{ year_from: number; year_to: number | null; subject: string }>;
    achievements: string[];
    subjects: string[];
    credentials: Array<{ title: string; institution: string; year: number | null }>;
    is_featured: boolean;
    courses: Array<{ id: string; name: string; age_categories: string[]; description: string | null }>;
    average_rating: number | null;
    total_ratings: number;
    sessions_completed: number;
    years_experience: number;
    phone_number: string | null;
  };

  export type UpdateTeacherProfileRequest = {
    full_name?: string;
    bio?: string;
    teaching_mode?: string;
    city?: string;
    university?: string;
    teaching_experience?: Array<{ year_from: number; year_to: number | null; subject: string }>;
    achievements?: string[];
    phone_number?: string;
  };

  export type StudentProfileResponse = {
    id: string;
    user_id: string;
    full_name: string;
    photo_url: string | null;
    age: number | null;
    age_category: string | null;
    assigned_teacher_id: string | null;
    enrolled_courses: Array<{ id: string; name: string }>;
    phone_number: string | null;
  };

  export type UpdateStudentProfileRequest = {
    full_name?: string;
    date_of_birth?: string;
    phone_number?: string;
  };
  ```

- [ ] **Step 2: Add two keys to `src/locales/en.json` under `"profile"`**

  The `"profile"` object starts at line 432. Add two keys before the existing `"teacher"` key:

  ```json
  "profile": {
    "phoneNumber": "Phone Number",
    "phoneNumberPlaceholder": "e.g. 081234567890",
    "teacher": {
  ```

  (Keep everything after `"teacher": {` unchanged.)

- [ ] **Step 3: Add two keys to `src/locales/id.json` under `"profile"`**

  Same location in `id.json` (line 432). Add before `"teacher"`:

  ```json
  "profile": {
    "phoneNumber": "Nomor Telepon",
    "phoneNumberPlaceholder": "Contoh: 081234567890",
    "teacher": {
  ```

- [ ] **Step 4: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors (14 pre-existing warnings are OK).

- [ ] **Step 5: Commit**

  ```powershell
  git add src/lib/api.ts src/locales/en.json src/locales/id.json
  git commit -m "feat(delta-v13): add phone_number types and i18n strings"
  ```

---

## Task 2: Teacher Profile — Script Changes

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (script block only, lines 1–129)

- [ ] **Step 1: Add `isAdmin` derived after `isOwn` (line 11)**

  Current line 11:
  ```typescript
  const isOwn = $derived(data.user?.id === profile?.user_id);
  ```

  Add immediately after:
  ```typescript
  const isAdmin = $derived(data.user?.role === 'admin');
  ```

- [ ] **Step 2: Add phone number state variables after the `editingTeachingInfo` block**

  Current block ends at line 39:
  ```typescript
  let savingTeachingInfo = $state(false);
  ```

  Add after that line:
  ```typescript
  // ── Phone Number
  let editingPhoneNumber = $state(false);
  let phoneNumberValue = $state(profile?.phone_number ?? '');
  let savingPhoneNumber = $state(false);
  ```

- [ ] **Step 3: Update `openSection()` to include `'phoneNumber'`**

  Current line 42:
  ```typescript
  function openSection(name: 'bio' | 'university' | 'experience' | 'achievements' | 'teachingInfo') {
  ```

  Replace with:
  ```typescript
  function openSection(name: 'bio' | 'university' | 'experience' | 'achievements' | 'teachingInfo' | 'phoneNumber') {
  ```

  Current body (lines 43–48):
  ```typescript
  	editingBio = name === 'bio';
  	editingUniversity = name === 'university';
  	editingExperience = name === 'experience';
  	editingAchievements = name === 'achievements';
  	editingTeachingInfo = name === 'teachingInfo';
  ```

  Add one line at the end of the body, before the closing `}`:
  ```typescript
  	editingPhoneNumber = name === 'phoneNumber';
  ```

- [ ] **Step 4: Add `savePhoneNumber()` function after `saveTeachingInfo()` (after line 111)**

  Current code at lines 100–111:
  ```typescript
  async function saveTeachingInfo() {
  	savingTeachingInfo = true;
  	try {
  		await api.put('/teachers/me', {
  			teaching_mode: teachingModeValue || undefined,
  			city: cityValue || undefined,
  		});
  		editingTeachingInfo = false;
  	} finally {
  		savingTeachingInfo = false;
  	}
  }
  ```

  Add after the closing `}` of `saveTeachingInfo`:
  ```typescript
  async function savePhoneNumber() {
  	savingPhoneNumber = true;
  	try {
  		await api.put('/teachers/me', { phone_number: phoneNumberValue || undefined });
  		editingPhoneNumber = false;
  	} finally {
  		savingPhoneNumber = false;
  	}
  }
  ```

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors.

- [ ] **Step 6: Commit**

  ```powershell
  git add src/routes/teachers/[id]/+page.svelte
  git commit -m "feat(delta-v13): add phone number state and save logic to teacher profile"
  ```

---

## Task 3: Teacher Profile — Phone Number Card (Template)

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (template block, after line 438)

- [ ] **Step 1: Add phone number card between Achievements and Current Courses**

  The Achievements card ends at line 438 (`</Card>`). Current Courses card starts at line 441 (`<!-- ── Current Courses ── -->`).

  Insert the following block between them (after line 439, which is the empty line after `</Card>`):

  ```svelte
  <!-- ── Phone Number ── -->
  {#if isOwn || isAdmin}
  	<Card padding="lg" class="mb-4">
  		<div class="flex items-center gap-2.5 mb-3">
  			<span class="w-9 h-9 rounded-lg bg-bgGray text-text2 flex items-center justify-center flex-none" aria-hidden="true">
  				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  					<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.06 6.06l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  				</svg>
  			</span>
  			<h2 class="font-semibold text-lg flex-1">{$t('profile.phoneNumber')}</h2>
  			{#if isOwn && !editingPhoneNumber}
  				<button
  					onclick={() => openSection('phoneNumber')}
  					class="text-text2 hover:text-text transition-colors p-1"
  					aria-label={$t('common.edit')}
  				>
  					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  						<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  					</svg>
  				</button>
  			{/if}
  		</div>
  		{#if editingPhoneNumber}
  			<input
  				type="tel"
  				bind:value={phoneNumberValue}
  				placeholder={$t('profile.phoneNumberPlaceholder')}
  				class="w-full bg-white border border-primary rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
  			/>
  			<div class="flex gap-2 mt-2">
  				<Button variant="primary" size="sm" loading={savingPhoneNumber} onclick={savePhoneNumber}>{$t('common.save')}</Button>
  				<Button variant="ghost" size="sm" onclick={() => { editingPhoneNumber = false; phoneNumberValue = profile?.phone_number ?? ''; }}>{$t('common.cancel')}</Button>
  			</div>
  		{:else}
  			<p class="text-sm font-medium text-text">{phoneNumberValue || $t('profile.teacher.notSet')}</p>
  		{/if}
  	</Card>
  {/if}
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```powershell
  git add src/routes/teachers/[id]/+page.svelte
  git commit -m "feat(delta-v13): add phone number card to teacher profile"
  ```

---

## Task 4: Student Profile — Script and Template Changes

**Files:**
- Modify: `src/routes/students/[id]/+page.svelte`

- [ ] **Step 1: Add phone number state variables and `savePhone()` after the `savingDob` block**

  Current code ends at line 36:
  ```typescript
  	} finally {
  		savingDob = false;
  	}
  }
  ```

  Add after the closing `}` of `saveDob`:
  ```typescript
  let editingPhone = $state(false);
  let phoneValue = $state(profile?.phone_number ?? '');
  let savingPhone = $state(false);

  async function savePhone() {
  	savingPhone = true;
  	try {
  		await api.put('/students/me', { phone_number: phoneValue || undefined });
  		editingPhone = false;
  	} finally {
  		savingPhone = false;
  	}
  }
  ```

- [ ] **Step 2: Add cross-cancel — close phone edit when DOB opens**

  Current code at line 113 (the DOB pencil button's onclick):
  ```svelte
  onclick={() => { editingDob = true; dobValue = ''; }}
  ```

  Replace with:
  ```svelte
  onclick={() => { editingDob = true; dobValue = ''; editingPhone = false; }}
  ```

- [ ] **Step 3: Add phone display block after the DOB/age badges `</div>` (after line 123)**

  Current lines 122–124:
  ```svelte
  		{/if}
  	</div>
  	{#if profile.assigned_teacher}
  ```

  Insert between the closing `</div>` and `{#if profile.assigned_teacher}`:

  ```svelte
  	{#if isOwn}
  		<div class="flex items-center gap-2 flex-wrap mt-1">
  			<span class="text-sm text-text2">{$t('profile.phoneNumber')}:</span>
  			{#if editingPhone}
  				<input
  					type="tel"
  					bind:value={phoneValue}
  					placeholder={$t('profile.phoneNumberPlaceholder')}
  					class="bg-white border border-border rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"
  				/>
  				<Button variant="primary" size="sm" loading={savingPhone} onclick={savePhone}>{$t('common.save')}</Button>
  				<Button variant="ghost" size="sm" onclick={() => { editingPhone = false; phoneValue = profile?.phone_number ?? ''; }}>{$t('common.cancel')}</Button>
  			{:else}
  				<span class="text-sm font-medium text-text">{phoneValue || $t('profile.teacher.notSet')}</span>
  				<button
  					onclick={() => { editingPhone = true; editingDob = false; }}
  					class="text-text2 hover:text-text transition-colors"
  					aria-label={$t('common.edit')}
  				>
  					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  						<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  					</svg>
  				</button>
  			{/if}
  		</div>
  	{:else if data.user?.role === 'admin' && profile.phone_number}
  		<div class="mt-1">
  			<span class="text-sm text-text2">{$t('profile.phoneNumber')}: </span>
  			<span class="text-sm font-medium text-text">{profile.phone_number}</span>
  		</div>
  	{/if}
  ```

- [ ] **Step 4: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors.

- [ ] **Step 5: Commit**

  ```powershell
  git add src/routes/students/[id]/+page.svelte
  git commit -m "feat(delta-v13): add phone number display and edit to student profile"
  ```

---

## Manual Smoke Test Checklist

After all tasks are committed, verify end-to-end with a running dev server (`npm run dev`):

- [ ] Log in as **teacher** → own profile `/teachers/:id` → Phone Number card visible → pencil opens input → enter a number → Save → card shows the number without reload
- [ ] Log in as **admin** → view any teacher profile → Phone Number card visible (no pencil) → shows number or "Not set"
- [ ] Log in as **another teacher** → view a teacher profile → Phone Number card NOT visible
- [ ] Log in as **student** → own profile `/students/:id` → Phone row visible → pencil opens tel input → enter number → Save → row shows number
- [ ] Open DOB edit → Phone edit closes; open Phone edit → DOB edit closes
- [ ] Log in as **admin** → view student profile → phone row visible only if phone is set; if null, row hidden
- [ ] Log in as **teacher** → view student profile → phone row NOT visible (API returns null, row not rendered)
