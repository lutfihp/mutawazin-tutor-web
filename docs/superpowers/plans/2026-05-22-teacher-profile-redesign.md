# Teacher Profile Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `src/routes/teachers/[id]/+page.svelte` to match the approved design handoff — Card-based layout, per-section pencil editing, chips row in header, subject-first course cards, and removal of the old edit-mode toggle and bulk details form.

**Architecture:** Single-file rewrite. The script block gains per-section edit state (one `editing*` / `saving*` pair per editable section) and loses the global `editMode` toggle and the bulk `saveDetails()` form. The template is restructured section-by-section in the approved order: Header → About → University → Teaching Experience → Achievements → Current Courses.

**Tech Stack:** Svelte 5 runes (`$props`, `$state`, `$derived`), Tailwind v3, existing `api.put('/teachers/me', {...})` helper, existing `Button`, `Card`, `Avatar`, `Badge` UI components, svelte-i18n `$t`.

---

### Task 1: Add `notSet` i18n key to both locale files

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add key to en.json**

  In `src/locales/en.json`, inside the `"teacher"` object (after `"experiencePresent"`), add:

  ```json
  "notSet": "Not set"
  ```

- [ ] **Step 2: Add key to id.json**

  In `src/locales/id.json`, inside the `"teacher"` object at the same position, add:

  ```json
  "notSet": "Belum diisi"
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/locales/en.json src/locales/id.json
  git commit -m "i18n: add profile.teacher.notSet key"
  ```

---

### Task 2: Replace the script block

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (lines 1–71)

This replaces the entire `<script lang="ts">` block. The old block had a global `editMode` toggle, a bulk `saveDetails()` call, and state for `teachingMode`, `city`, `methodInput`, `teachingMethods`. The new block has one `editing*` / `saving*` / save-function triple per editable section (bio, university, experience, achievements).

- [ ] **Step 1: Replace the script block**

  Replace lines 1–71 (everything from `<script lang="ts">` through `</script>`) with:

  ```svelte
  <script lang="ts">
  	import { t } from 'svelte-i18n';
  	import { api } from '$lib/api';
  	import Avatar from '$lib/components/ui/Avatar.svelte';
  	import Badge from '$lib/components/ui/Badge.svelte';
  	import Button from '$lib/components/ui/Button.svelte';
  	import Card from '$lib/components/ui/Card.svelte';

  	let { data } = $props();
  	const profile = $derived(data.profile);
  	const isOwn = $derived(data.user?.id === profile?.user_id);

  	// ── Bio
  	let editingBio = $state(false);
  	let bioValue = $state(profile?.bio ?? '');
  	let savingBio = $state(false);

  	// ── University
  	let editingUniversity = $state(false);
  	let universityValue = $state(profile?.university ?? '');
  	let savingUniversity = $state(false);

  	// ── Teaching Experience
  	let editingExperience = $state(false);
  	let experienceValue = $state<Array<{ year_from: number; year_to: number | null; subject: string }>>(
  		profile?.teaching_experience ?? []
  	);
  	let savingExperience = $state(false);

  	// ── Achievements
  	let editingAchievements = $state(false);
  	let achievementsValue = $state<string[]>(profile?.achievements ?? []);
  	let savingAchievements = $state(false);

  	// ── Mutual exclusion: only one section editable at a time
	function openSection(name: 'bio' | 'university' | 'experience' | 'achievements') {
		editingBio = name === 'bio';
		editingUniversity = name === 'university';
		editingExperience = name === 'experience';
		editingAchievements = name === 'achievements';
	}

	// ── Mode display (derived so it re-runs if profile changes)
  	const modeIcon = $derived(
  		profile?.teaching_mode === 'offline' ? '🔴' :
  		profile?.teaching_mode === 'both' ? '🔄' : '🌐'
  	);
  	const modeLabel = $derived(
  		profile?.teaching_mode === 'offline' ? $t('profile.teacher.modeOffline') :
  		profile?.teaching_mode === 'both' ? $t('profile.teacher.modeBoth') :
  		$t('profile.teacher.modeOnline')
  	);

  	// ── Save functions
  	async function saveBio() {
  		savingBio = true;
  		try {
  			await api.put('/teachers/me', { bio: bioValue });
  			editingBio = false;
  		} finally {
  			savingBio = false;
  		}
  	}

  	async function saveUniversity() {
  		savingUniversity = true;
  		try {
  			await api.put('/teachers/me', { university: universityValue || undefined });
  			editingUniversity = false;
  		} finally {
  			savingUniversity = false;
  		}
  	}

  	async function saveExperience() {
  		savingExperience = true;
  		try {
  			await api.put('/teachers/me', {
  				teaching_experience: experienceValue.filter((e) => e.subject)
  			});
  			editingExperience = false;
  		} finally {
  			savingExperience = false;
  		}
  	}

  	async function saveAchievements() {
  		savingAchievements = true;
  		try {
  			await api.put('/teachers/me', { achievements: achievementsValue.filter(Boolean) });
  			editingAchievements = false;
  		} finally {
  			savingAchievements = false;
  		}
  	}

  	// ── Experience helpers
  	function addExperience() {
  		experienceValue = [...experienceValue, { year_from: new Date().getFullYear(), year_to: null, subject: '' }];
  	}
  	function removeExperience(i: number) {
  		experienceValue = experienceValue.filter((_, idx) => idx !== i);
  	}

  	// ── Photo upload
  	function handlePhotoChange(e: Event) {
  		const file = (e.target as HTMLInputElement).files?.[0];
  		if (!file) return;
  		const fd = new FormData();
  		fd.append('file', file);
  		api.upload('/teachers/me/photo', fd);
  	}
  </script>
  ```

  > **Note:** After this step the old template (lines 73–320) still references removed variables (`editMode`, `savingDetails`, etc.). TypeScript check will fail until the template is replaced in the remaining tasks. Run `npm run check` only after Task 6.

---

### Task 3: Replace the template — head + profile header card

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (lines 73–147)

Replace everything from `<svelte:head>` through the closing `</div>` of the old profile header (line 147) with the new Card-based header. The new header:
- wraps everything in `<Card padding="lg" class="mb-4">`
- shows camera overlay whenever `isOwn` (no `editMode` guard)
- no "Book a session" / "Message" buttons
- adds a divider + chips row for `teaching_mode`, `city`, and `teaching_methods[]`

- [ ] **Step 1: Replace head + header markup**

  Replace lines 73–147 with:

  ```svelte
  <svelte:head>
  	<title>{profile?.full_name ?? 'Teacher Profile'} — Mutawazin</title>
  </svelte:head>

  <div class="max-w-profile mx-auto py-8">
  	{#if !profile}
  		<p class="text-text2 text-center py-20">Teacher not found.</p>
  	{:else}

  		<!-- ── Profile Header ── -->
  		<Card padding="lg" class="mb-4">
  			<div class="flex gap-5 items-start">
  				<div class="relative flex-none">
  					<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={profile.photo_url} />
  					{#if isOwn}
  						<label
  							class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-pill flex items-center justify-center cursor-pointer border-2 border-white hover:bg-primary-dark transition-colors"
  							aria-label="Upload photo"
  						>
  							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  								<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
  								<circle cx="12" cy="13" r="4"/>
  							</svg>
  							<input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} />
  						</label>
  					{/if}
  				</div>

  				<div class="flex-1 min-w-0">
  					<h1 class="text-[26px] font-bold tracking-tight mb-2">{profile.full_name}</h1>
  					<div class="flex flex-wrap gap-1.5 mb-2">
  						{#if profile.is_featured}
  							<Badge variant="gold">★ {$t('status.featured')}</Badge>
  						{/if}
  						{#each (profile.subjects ?? []) as subject}
  							<Badge variant="teal" label={subject} />
  						{/each}
  					</div>
  					<p class="text-sm text-text2">
  						{$t('profile.teacher.yearsExperience', { values: { n: profile.years_experience ?? 0 } })}
  						·
  						{$t('profile.teacher.sessionsCompleted', { values: { n: profile.sessions_completed ?? 0 } })}
  						{#if (profile.total_ratings ?? 0) > 0}
  							· ★ {$t('profile.teacher.rating', { values: { rating: (profile.average_rating ?? 0).toFixed(1), count: profile.total_ratings } })}
  						{/if}
  					</p>
  					{#if profile.teaching_mode || profile.city || (profile.teaching_methods ?? []).length > 0}
  						<hr class="border-border mt-3 mb-3" />
  						<div class="flex flex-wrap gap-2">
  							{#if profile.teaching_mode}
  								<Badge variant="active">{modeIcon} {modeLabel}</Badge>
  							{/if}
  							{#if profile.city}
  								<Badge variant="teal">📍 {profile.city}</Badge>
  							{/if}
  							{#each (profile.teaching_methods ?? []) as method}
  								<Badge variant="violet" label={method} />
  							{/each}
  						</div>
  					{/if}
  				</div>
  			</div>
  		</Card>
  ```

---

### Task 4: Replace About section

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (old lines 149–175)

The old About card only shows the pencil button when `isOwn && editMode`. The new About card shows it whenever `isOwn`. The section is hidden on public view when `bio` is empty.

- [ ] **Step 1: Replace About card markup**

  Replace the old About `<Card>` block (from `<!-- About -->` through its closing `</Card>`) with:

  ```svelte
  		<!-- ── About ── -->
  		{#if profile.bio || isOwn}
  			<Card padding="lg" class="mb-4">
  				<div class="flex items-center justify-between gap-4 mb-3">
  					<h2 class="font-semibold text-lg">{$t('profile.teacher.about')}</h2>
  					{#if isOwn && !editingBio}
  						<button
  							onclick={() => openSection('bio')}
  							class="text-text2 hover:text-text transition-colors p-1"
  							aria-label={$t('common.edit')}
  						>
  							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  							</svg>
  						</button>
  					{/if}
  				</div>
  				{#if editingBio}
  					<textarea
  						bind:value={bioValue}
  						rows={4}
  						class="w-full bg-white border border-primary rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-primary/15"
  						aria-label={$t('profile.teacher.about')}
  					></textarea>
  					<div class="flex gap-2 mt-2">
  						<Button variant="primary" size="sm" loading={savingBio} onclick={saveBio}>{$t('common.save')}</Button>
  						<Button variant="ghost" size="sm" onclick={() => { editingBio = false; bioValue = profile?.bio ?? ''; }}>{$t('common.cancel')}</Button>
  					</div>
  				{:else}
  					<p class="text-[15px] leading-relaxed text-text2">{bioValue || $t('profile.teacher.notSet')}</p>
  				{/if}
  			</Card>
  		{/if}
  ```

---

### Task 5: Remove old detail blocks; add University, Teaching Experience, Achievements sections

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

Delete the old "Details edit card" (the `{#if isOwn && editMode}` block with teaching mode radios, city, university, methods, achievements, experience inputs) and the old "Public details" card (`{#if profile.teaching_mode || profile.city || ...}`). Replace both with three new per-section cards.

- [ ] **Step 1: Remove old blocks and insert three new sections**

  Delete everything from `<!-- Current Courses -->` comment / `<!-- Details edit card -->` comment down to and including the closing `{/if}` of the public details card (the block ending before `<Card padding="lg">`).

  Insert in their place:

  ```svelte
  		<!-- ── University ── -->
  		{#if profile.university || isOwn}
  			<Card padding="lg" class="mb-4">
  				<div class="flex items-center gap-2.5 mb-3">
  					<span class="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center text-lg flex-none" aria-hidden="true">🎓</span>
  					<h2 class="font-semibold text-lg flex-1">{$t('profile.teacher.university')}</h2>
  					{#if isOwn && !editingUniversity}
  						<button
  							onclick={() => openSection('university')}
  							class="text-text2 hover:text-text transition-colors p-1"
  							aria-label={$t('common.edit')}
  						>
  							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  							</svg>
  						</button>
  					{/if}
  				</div>
  				{#if editingUniversity}
  					<input
  						type="text"
  						bind:value={universityValue}
  						placeholder={$t('profile.teacher.universityPlaceholder')}
  						class="w-full bg-white border border-primary rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
  					/>
  					<div class="flex gap-2 mt-2">
  						<Button variant="primary" size="sm" loading={savingUniversity} onclick={saveUniversity}>{$t('common.save')}</Button>
  						<Button variant="ghost" size="sm" onclick={() => { editingUniversity = false; universityValue = profile?.university ?? ''; }}>{$t('common.cancel')}</Button>
  					</div>
  				{:else}
  					<p class="text-sm font-medium text-text">{universityValue || $t('profile.teacher.notSet')}</p>
  				{/if}
  			</Card>
  		{/if}

  		<!-- ── Teaching Experience ── -->
  		{#if profile.teaching_experience?.length || isOwn}
  			<Card padding="lg" class="mb-4">
  				<div class="flex items-center gap-2.5 mb-3">
  					<span class="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center text-lg flex-none" aria-hidden="true">💼</span>
  					<h2 class="font-semibold text-lg flex-1">{$t('profile.teacher.experience')}</h2>
  					{#if isOwn && !editingExperience}
  						<button
  							onclick={() => openSection('experience')}
  							class="text-text2 hover:text-text transition-colors p-1"
  							aria-label={$t('common.edit')}
  						>
  							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  							</svg>
  						</button>
  					{/if}
  				</div>
  				{#if editingExperience}
  					{#each experienceValue as exp, i}
  						<div class="grid grid-cols-[80px_80px_1fr_auto] gap-2 items-center mb-2">
  							<input type="number" bind:value={exp.year_from} placeholder="2020" aria-label="Year from"
  								class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
  							<input type="number" bind:value={exp.year_to} placeholder={$t('profile.teacher.experiencePresent')} aria-label="Year to"
  								class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
  							<input type="text" bind:value={exp.subject} placeholder="e.g. Mathematics" aria-label="Subject"
  								class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary" />
  							<button type="button" onclick={() => removeExperience(i)} class="px-2 text-text2 hover:text-error" aria-label={$t('common.removeRow')}>×</button>
  						</div>
  					{/each}
  					<button type="button" onclick={addExperience}
  						class="text-sm font-semibold text-primary hover:text-primary-dark text-left mb-3">{$t('profile.teacher.addExperience')}</button>
  					<div class="flex gap-2">
  						<Button variant="primary" size="sm" loading={savingExperience} onclick={saveExperience}>{$t('common.save')}</Button>
  						<Button variant="ghost" size="sm" onclick={() => { editingExperience = false; experienceValue = profile?.teaching_experience ?? []; }}>{$t('common.cancel')}</Button>
  					</div>
  				{:else if experienceValue.length > 0}
  					<div class="flex flex-col divide-y divide-border">
  						{#each experienceValue as exp}
  							<div class="py-2.5">
  								<p class="text-sm font-semibold text-text">{exp.subject}</p>
  								<p class="text-xs text-text2 mt-0.5">{exp.year_from} – {exp.year_to ?? $t('profile.teacher.experiencePresent')}</p>
  							</div>
  						{/each}
  					</div>
  				{:else}
  					<p class="text-sm text-text2">{$t('profile.teacher.notSet')}</p>
  				{/if}
  			</Card>
  		{/if}

  		<!-- ── Achievements ── -->
  		{#if profile.achievements?.length || isOwn}
  			<Card padding="lg" class="mb-4">
  				<div class="flex items-center gap-2.5 mb-3">
  					<span class="w-9 h-9 rounded-lg bg-gold-bg text-gold-text flex items-center justify-center text-lg flex-none" aria-hidden="true">⭐</span>
  					<h2 class="font-semibold text-lg flex-1">{$t('profile.teacher.achievements')}</h2>
  					{#if isOwn && !editingAchievements}
  						<button
  							onclick={() => openSection('achievements')}
  							class="text-text2 hover:text-text transition-colors p-1"
  							aria-label={$t('common.edit')}
  						>
  							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  							</svg>
  						</button>
  					{/if}
  				</div>
  				{#if editingAchievements}
  					{#each achievementsValue as ach, i}
  						<div class="flex gap-2 mb-2">
  							<input type="text" bind:value={achievementsValue[i]}
  								class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
  							<button type="button" onclick={() => (achievementsValue = achievementsValue.filter((_, idx) => idx !== i))}
  								class="px-2 text-text2 hover:text-error" aria-label={$t('common.removeRow')}>×</button>
  						</div>
  					{/each}
  					<button type="button" onclick={() => (achievementsValue = [...achievementsValue, ''])}
  						class="text-sm font-semibold text-primary hover:text-primary-dark text-left mb-3">{$t('profile.teacher.addAchievement')}</button>
  					<div class="flex gap-2">
  						<Button variant="primary" size="sm" loading={savingAchievements} onclick={saveAchievements}>{$t('common.save')}</Button>
  						<Button variant="ghost" size="sm" onclick={() => { editingAchievements = false; achievementsValue = profile?.achievements ?? []; }}>{$t('common.cancel')}</Button>
  					</div>
  				{:else if achievementsValue.length > 0}
  					<div class="flex flex-col divide-y divide-border">
  						{#each achievementsValue as ach}
  							<div class="py-2.5">
  								<p class="text-sm font-medium text-text">{ach}</p>
  							</div>
  						{/each}
  					</div>
  				{:else}
  					<p class="text-sm text-text2">{$t('profile.teacher.notSet')}</p>
  				{/if}
  			</Card>
  		{/if}
  ```

---

### Task 6: Replace Current Courses section and close template

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (old lines 295–320)

The new course card leads with the subject name as large teal text, then age categories as small meta, then an optional description. The "New course" button no longer requires `editMode` — visible to `isOwn` always. The section hides on public view when `courses` is empty.

- [ ] **Step 1: Replace Current Courses card and close the template**

  Replace the old Current Courses `<Card>` block through the end of the file with:

  ```svelte
  		<!-- ── Current Courses ── -->
  		{#if profile.courses?.length || isOwn}
  			<Card padding="lg">
  				<div class="flex items-center justify-between mb-4">
  					<h2 class="font-semibold text-lg">{$t('profile.teacher.currentCourses')}</h2>
  					{#if isOwn}
  						<Button variant="secondary" size="sm" href="/courses">{$t('profile.teacher.newCourse')}</Button>
  					{/if}
  				</div>
  				{#if profile.courses?.length}
  					<div class="grid sm:grid-cols-2 gap-3">
  						{#each profile.courses as course}
  							<div class="border border-border rounded-sm p-3">
  								<p class="text-[15px] font-bold text-teal">{course.name}</p>
  								<p class="text-xs text-text3 mt-0.5">{(course.age_categories ?? []).join(' · ')}</p>
  								{#if course.description}
  									<p class="text-xs text-text2 mt-1.5 leading-relaxed">{course.description}</p>
  								{/if}
  							</div>
  						{/each}
  					</div>
  				{:else}
  					<p class="text-sm text-text2">{$t('profile.teacher.noCourses')}</p>
  				{/if}
  			</Card>
  		{/if}

  	{/if}
  </div>
  ```

---

### Task 7: Type-check, visual verify, and commit

**Files:**
- No new edits — verification only.

- [ ] **Step 1: Run type check**

  ```bash
  npm run check
  ```

  Expected: 0 errors, 0 warnings. If you see `'editMode' is not defined` or similar — a stale reference was left in the template. Search for `editMode` / `savingDetails` / `teachingMode` / `methodInput` in the file and remove any remaining uses.

- [ ] **Step 2: Start the dev server and visually verify**

  ```bash
  npm run dev
  ```

  Open `http://localhost:5173` and log in as `admin@mutawazin.com` / `changeme123`. Navigate to a teacher profile page (e.g. `/teachers/<some-id>`).

  Check public view:
  - Profile header card: name, featured badge, subject badges, meta line (yrs · sessions · rating), divider + chips (mode, city, methods)
  - No "Book a session" or "Message" buttons
  - About section visible when bio is set; hidden when empty
  - University, Teaching Experience, Achievements: each is its own card with icon tile + heading; hidden when empty and not own
  - Current Courses: subject name in teal as primary text, age categories as meta, description below if present

  Check own view (log in as a teacher, visit your own profile):
  - Camera icon overlays the avatar
  - Every section (About, University, Experience, Achievements) shows a pencil button top-right
  - Clicking pencil opens inline editing; Save/Cancel appear; other sections remain closed
  - Cancel resets the field to the last saved value (not blank)
  - "New course" link appears in Current Courses header

- [ ] **Step 3: Commit**

  ```bash
  git add src/routes/teachers/[id]/+page.svelte src/locales/en.json src/locales/id.json
  git commit -m "feat: redesign teacher profile page — per-section editing, chips header, subject-first course cards"
  ```
