# Profile/Session/Rating/Recurring Enhancements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add teacher profile new fields (edit + display), session mode/price display, student session rating, and recurring modal mode/price fields.

**Architecture:** Three files modified — `teachers/[id]/+page.svelte` for profile fields + rating, `calendar/+page.svelte` for session mode/price/rating and recurring fields, `+page.svelte` for landing search rating display. No new routes or components.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/locales/en.json` — new profile + session + rating keys |
| Modify | `src/locales/id.json` — same in Indonesian |
| Modify | `src/routes/teachers/[id]/+page.svelte` — new edit fields + public display |
| Modify | `src/routes/calendar/+page.svelte` — session mode/price, student rating, recurring mode/price |
| Modify | `src/routes/+page.svelte` — show star rating on teacher search results |

---

### Task 1: Add locale keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add to `en.json` under `profile.teacher`**

After `"newCourse"`:
```json
      "teachingMode": "Teaching mode",
      "modeOnline": "Online",
      "modeOffline": "Offline",
      "modeBoth": "Both",
      "city": "City",
      "cityPlaceholder": "e.g. Amman",
      "teachingMethods": "Teaching methods",
      "teachingMethodsPlaceholder": "e.g. Socratic, Project-based — press Enter",
      "university": "University",
      "universityPlaceholder": "e.g. University of Jordan",
      "achievements": "Achievements",
      "addAchievement": "+ Add achievement",
      "experience": "Teaching experience",
      "addExperience": "+ Add",
      "experiencePresent": "Present",
      "rating": "{rating} ({count} ratings)",
      "noRating": "No ratings yet"
```

- [ ] **Step 2: Add to `en.json` under `calendar.modal`**

After `"durationLabel"`:
```json
      "modeLabel": "Session mode",
      "modeOnline": "Online",
      "modeOffline": "Offline",
      "priceLabel": "Price (optional)",
      "rateSession": "Rate this session",
      "ratingSubmit": "Submit Rating",
      "ratingComment": "Comment (optional)",
      "ratingAlready": "You've already rated this session.",
      "ratingCommentPlaceholder": "Share your experience..."
```

- [ ] **Step 3: Add Indonesian equivalents to `id.json`**

Under `profile.teacher`, after `"newCourse"`:
```json
      "teachingMode": "Mode mengajar",
      "modeOnline": "Online",
      "modeOffline": "Offline",
      "modeBoth": "Keduanya",
      "city": "Kota",
      "cityPlaceholder": "mis. Jakarta",
      "teachingMethods": "Metode mengajar",
      "teachingMethodsPlaceholder": "mis. Sokratik, Berbasis proyek — tekan Enter",
      "university": "Universitas",
      "universityPlaceholder": "mis. Universitas Indonesia",
      "achievements": "Pencapaian",
      "addAchievement": "+ Tambah pencapaian",
      "experience": "Pengalaman mengajar",
      "addExperience": "+ Tambah",
      "experiencePresent": "Sekarang",
      "rating": "{rating} ({count} penilaian)",
      "noRating": "Belum ada penilaian"
```

Under `calendar.modal`, after `"durationLabel"`:
```json
      "modeLabel": "Mode sesi",
      "modeOnline": "Online",
      "modeOffline": "Offline",
      "priceLabel": "Harga (opsional)",
      "rateSession": "Nilai sesi ini",
      "ratingSubmit": "Kirim Penilaian",
      "ratingComment": "Komentar (opsional)",
      "ratingAlready": "Anda sudah menilai sesi ini.",
      "ratingCommentPlaceholder": "Bagikan pengalaman Anda..."
```

---

### Task 2: Teacher profile — edit mode new fields

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

- [ ] **Step 1: Add new state variables to script**

After `let savingBio = $state(false);`, add:
```svelte
	// New profile fields state
	let teachingMode = $state<'online' | 'offline' | 'both'>(profile?.teaching_mode ?? 'online');
	let city = $state(profile?.city ?? '');
	let methodInput = $state('');
	let teachingMethods = $state<string[]>(profile?.teaching_methods ?? []);
	let university = $state(profile?.university ?? '');
	let achievements = $state<string[]>(profile?.achievements ?? []);
	let newAchievement = $state('');
	let experience = $state<Array<{ year_from: number; year_to: number | null; subject: string }>>(profile?.teaching_experience ?? []);
	let savingDetails = $state(false);

	function addMethod() {
		const val = methodInput.trim();
		if (val && !teachingMethods.includes(val)) teachingMethods = [...teachingMethods, val];
		methodInput = '';
	}

	function removeMethod(i: number) {
		teachingMethods = teachingMethods.filter((_, idx) => idx !== i);
	}

	function addExperience() {
		experience = [...experience, { year_from: new Date().getFullYear(), year_to: null, subject: '' }];
	}

	function removeExperience(i: number) {
		experience = experience.filter((_, idx) => idx !== i);
	}

	async function saveDetails() {
		savingDetails = true;
		try {
			await api.put('/teachers/me', {
				teaching_mode: teachingMode,
				city: city || undefined,
				teaching_methods: teachingMethods,
				university: university || undefined,
				achievements: achievements.filter(Boolean),
				teaching_experience: experience.filter((e) => e.subject),
			});
		} finally {
			savingDetails = false;
		}
	}
```

- [ ] **Step 2: Add "Details" card in edit mode**

After the Credentials card and before the Current Courses card, add a new card that only appears in `editMode`:

```svelte
		{#if isOwn && editMode}
			<Card padding="lg" class="mb-4">
				<h2 class="font-semibold text-lg mb-4">{$t('profile.teacher.teachingMode')}</h2>
				<div class="flex flex-col gap-4">
					<!-- Teaching mode -->
					<div>
						<div class="flex gap-2">
							{#each [['online', $t('profile.teacher.modeOnline')], ['offline', $t('profile.teacher.modeOffline')], ['both', $t('profile.teacher.modeBoth')]] as [val, label]}
								<button type="button" onclick={() => (teachingMode = val as typeof teachingMode)}
									class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
									       {teachingMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
									{label}
								</button>
							{/each}
						</div>
					</div>
					<!-- City -->
					<div class="flex flex-col gap-1.5">
						<label for="teacherCity" class="text-[13px] font-medium">{$t('profile.teacher.city')}</label>
						<input id="teacherCity" type="text" bind:value={city} placeholder={$t('profile.teacher.cityPlaceholder')}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					</div>
					<!-- University -->
					<div class="flex flex-col gap-1.5">
						<label for="teacherUni" class="text-[13px] font-medium">{$t('profile.teacher.university')}</label>
						<input id="teacherUni" type="text" bind:value={university} placeholder={$t('profile.teacher.universityPlaceholder')}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					</div>
					<!-- Teaching methods tag input -->
					<div class="flex flex-col gap-1.5">
						<label for="methodInput" class="text-[13px] font-medium">{$t('profile.teacher.teachingMethods')}</label>
						<div class="flex flex-wrap gap-1.5 items-center p-2 border border-border rounded-sm bg-white min-h-[44px] focus-within:border-primary">
							{#each teachingMethods as method, i}
								<span class="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 bg-primary-light text-primary-dark text-xs font-medium rounded-pill">
									{method}
									<button type="button" onclick={() => removeMethod(i)} class="w-4 h-4 grid place-items-center" aria-label="Remove {method}">×</button>
								</span>
							{/each}
							<input id="methodInput" type="text" bind:value={methodInput}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addMethod(); } }}
								onblur={addMethod}
								placeholder={$t('profile.teacher.teachingMethodsPlaceholder')}
								class="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm placeholder:text-text3" />
						</div>
					</div>
					<!-- Achievements -->
					<div class="flex flex-col gap-2">
						<p class="text-[13px] font-medium">{$t('profile.teacher.achievements')}</p>
						{#each achievements as ach, i}
							<div class="flex gap-2">
								<input type="text" bind:value={achievements[i]}
									class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
								<button type="button" onclick={() => (achievements = achievements.filter((_, idx) => idx !== i))}
									class="px-2 text-text2 hover:text-error" aria-label="Remove achievement">×</button>
							</div>
						{/each}
						<button type="button" onclick={() => (achievements = [...achievements, ''])}
							class="text-sm font-semibold text-primary hover:text-primary-dark text-left">{$t('profile.teacher.addAchievement')}</button>
					</div>
					<!-- Experience -->
					<div class="flex flex-col gap-2">
						<p class="text-[13px] font-medium">{$t('profile.teacher.experience')}</p>
						{#each experience as exp, i}
							<div class="grid grid-cols-[80px_80px_1fr_auto] gap-2 items-center">
								<input type="number" bind:value={exp.year_from} placeholder="2020" aria-label="Year from"
									class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
								<input type="number" bind:value={exp.year_to} placeholder={$t('profile.teacher.experiencePresent')} aria-label="Year to"
									class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
								<input type="text" bind:value={exp.subject} placeholder="e.g. Mathematics" aria-label="Subject"
									class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary" />
								<button type="button" onclick={() => removeExperience(i)}
									class="px-2 text-text2 hover:text-error" aria-label="Remove experience">×</button>
							</div>
						{/each}
						<button type="button" onclick={addExperience}
							class="text-sm font-semibold text-primary hover:text-primary-dark text-left">{$t('profile.teacher.addExperience')}</button>
					</div>
					<div class="flex gap-2 pt-2">
						<Button variant="primary" size="sm" loading={savingDetails} onclick={saveDetails}>{$t('common.save')}</Button>
					</div>
				</div>
			</Card>
		{/if}
```

---

### Task 3: Teacher profile — public display of new fields + rating

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

- [ ] **Step 1: Add star rating to profile header**

In the profile header, after the meta line (`years_experience · sessions_completed`), add:
```svelte
				{#if profile.total_ratings > 0}
					<p class="text-sm text-text2 mt-1">
						{'★'.repeat(Math.round(profile.average_rating ?? 0))}{'☆'.repeat(5 - Math.round(profile.average_rating ?? 0))}
						{$t('profile.teacher.rating', { values: { rating: (profile.average_rating ?? 0).toFixed(1), count: profile.total_ratings } })}
					</p>
				{/if}
```

- [ ] **Step 2: Add new public-view sections after the Credentials card**

After the Credentials card closing tag (`</Card>`) and before the Current Courses card:
```svelte
		<!-- Teaching details (public view) -->
		{#if profile.teaching_mode || profile.city || profile.achievements?.length || profile.teaching_experience?.length}
			<Card padding="lg" class="mb-4">
				<h2 class="font-semibold text-lg mb-4">Details</h2>
				<div class="flex flex-col gap-3 text-sm">
					{#if profile.teaching_mode}
						<div class="flex gap-2 items-center">
							<span class="text-text2 min-w-[100px]">{$t('profile.teacher.teachingMode')}</span>
							<Badge variant="active" label={$t(`profile.teacher.mode${profile.teaching_mode.charAt(0).toUpperCase() + profile.teaching_mode.slice(1)}`)} />
						</div>
					{/if}
					{#if profile.city}
						<div class="flex gap-2">
							<span class="text-text2 min-w-[100px]">{$t('profile.teacher.city')}</span>
							<span>{profile.city}</span>
						</div>
					{/if}
					{#if profile.achievements?.length}
						<div>
							<p class="text-text2 mb-1">{$t('profile.teacher.achievements')}</p>
							<ul class="list-disc list-inside flex flex-col gap-0.5 text-text2">
								{#each profile.achievements as ach}<li>{ach}</li>{/each}
							</ul>
						</div>
					{/if}
					{#if profile.teaching_experience?.length}
						<div>
							<p class="text-text2 mb-1">{$t('profile.teacher.experience')}</p>
							<div class="flex flex-col gap-1">
								{#each profile.teaching_experience as exp}
									<div class="text-text2">
										<span class="font-medium text-text">{exp.subject}</span>
										· {exp.year_from}–{exp.year_to ?? $t('profile.teacher.experiencePresent')}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</Card>
		{/if}
```

---

### Task 4: Session detail modal — mode, price, student rating

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add rating state variables**

After `let rFormEl = $state<HTMLFormElement | null>(null);`, add:
```svelte
	let ratingValue = $state(0);
	let ratingComment = $state('');
	let ratingLoading = $state(false);
	let ratingSubmitted = $state(false);
	let ratingAlready = $state(false);

	async function submitRating() {
		if (!selectedSession || ratingValue === 0) return;
		ratingLoading = true;
		try {
			await api.post(`/sessions/${selectedSession.id}/rating`, {
				rating: ratingValue,
				comment: ratingComment || undefined,
			});
			ratingSubmitted = true;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409')) ratingAlready = true;
		} finally {
			ratingLoading = false;
		}
	}
```

Also reset rating state when opening a session:
```svelte
	function openSession(session: any) {
		selectedSession = session;
		detailOpen = true;
		ratingValue = 0;
		ratingComment = '';
		ratingSubmitted = false;
		ratingAlready = false;
	}
```

- [ ] **Step 2: Add mode + price to session detail modal info grid**

Find the two-column grid in the detail modal body:
```svelte
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div><span class="text-text2">{$t('calendar.modal.when')}</span><br/>...
				<div><span class="text-text2">{$t('calendar.modal.status')}</span><br/>...
			</div>
```

Add after the closing `</div>` of the grid:
```svelte
			{#if selectedSession.mode || selectedSession.price}
				<div class="flex gap-4 text-sm">
					{#if selectedSession.mode}
						<div>
							<span class="text-text2">{$t('calendar.modal.modeLabel')}</span><br/>
							<Badge variant={selectedSession.mode === 'online' ? 'active' : 'gray'} label={selectedSession.mode === 'online' ? $t('calendar.modal.modeOnline') : $t('calendar.modal.modeOffline')} />
						</div>
					{/if}
					{#if selectedSession.price}
						<div>
							<span class="text-text2">{$t('calendar.modal.priceLabel')}</span><br/>
							<span class="font-medium tabular">{selectedSession.price}</span>
						</div>
					{/if}
				</div>
			{/if}
```

- [ ] **Step 3: Add student rating section to session detail modal**

After the mode/price section and before the `{#if selectedSession.recurring_template_id}` block, add:
```svelte
			{#if data.user?.role === 'student' && (selectedSession.status === 'Completed' || selectedSession.status === 'completed')}
				<div class="border-t border-border pt-3 mt-1">
					<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.rateSession')}</p>
					{#if ratingAlready}
						<p class="text-sm text-text2">{$t('calendar.modal.ratingAlready')}</p>
					{:else if ratingSubmitted}
						<p class="text-sm text-successText">{'★'.repeat(ratingValue)} Submitted!</p>
					{:else}
						<div class="flex flex-col gap-2">
							<div class="flex gap-1">
								{#each [1, 2, 3, 4, 5] as star}
									<button type="button" onclick={() => (ratingValue = star)}
										class="text-2xl transition-colors {ratingValue >= star ? 'text-[#F59E0B]' : 'text-border hover:text-[#F59E0B]'}"
										aria-label="Rate {star} stars">★</button>
								{/each}
							</div>
							{#if ratingValue > 0}
								<textarea bind:value={ratingComment} rows={2}
									placeholder={$t('calendar.modal.ratingCommentPlaceholder')}
									class="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"></textarea>
								<Button variant="primary" size="sm" loading={ratingLoading} onclick={submitRating}>
									{$t('calendar.modal.ratingSubmit')}
								</Button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
```

---

### Task 5: Recurring modal — add mode and price fields

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add state variables**

After `let rDuration = $state(60);`, add:
```svelte
	let rMode = $state<'online' | 'offline'>('online');
	let rPrice = $state<number | undefined>(undefined);
```

Update `openAddRecurring` to reset them:
```svelte
	function openAddRecurring() {
		editingTemplate = null;
		rType = 'group'; rCourseId = ''; rStudentId = '';
		rTitle = ''; rDayOfWeek = 0; rStartTime = ''; rDuration = 60;
		rMode = 'online'; rPrice = undefined;
		recurringOpen = true;
	}
```

Update `openEditRecurring` to populate them:
```svelte
	function openEditRecurring(template: any) {
		editingTemplate = template;
		rType = template.type ?? 'group';
		rCourseId = template.course_id ?? '';
		rStudentId = template.student_id ?? '';
		rTitle = template.title ?? '';
		rDayOfWeek = template.day_of_week ?? 0;
		rStartTime = template.start_time ?? '';
		rDuration = template.duration_minutes ?? 60;
		rMode = template.mode ?? 'online';
		rPrice = template.price ?? undefined;
		recurringOpen = true;
	}
```

Update `handleRecurringSubmit` body:
```svelte
			const body = {
				type: rType,
				course_id: rType === 'group' ? rCourseId : undefined,
				student_id: rType === 'private' ? rStudentId : undefined,
				title: rTitle,
				day_of_week: rDayOfWeek,
				start_time: rStartTime,
				duration_minutes: rDuration,
				mode: rMode,
				price: rPrice || undefined,
			};
```

- [ ] **Step 2: Add mode + price fields to recurring modal form**

In the Recurring Session Modal, after the Duration input div, add:
```svelte
				<!-- Mode -->
				<div class="flex flex-col gap-1.5">
					<p class="text-[13px] font-medium">{$t('calendar.modal.modeLabel')}</p>
					<div class="flex gap-2">
						{#each [['online', $t('calendar.modal.modeOnline')], ['offline', $t('calendar.modal.modeOffline')]] as [val, label]}
							<button type="button" onclick={() => (rMode = val as 'online' | 'offline')}
								class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
								       {rMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
								{label}
							</button>
						{/each}
					</div>
				</div>
				<!-- Price -->
				<div class="flex flex-col gap-1.5">
					<label for="rPrice" class="text-[13px] font-medium">{$t('calendar.modal.priceLabel')}</label>
					<input id="rPrice" type="number" bind:value={rPrice} min="0" step="0.01"
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary tabular" />
				</div>
```

---

### Task 6: Landing page search — show teacher rating

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add rating display to teacher search result cards**

In the teacher search result cards section, find the `active_course_count` div:
```svelte
							<div class="text-xs text-text2">{$t('landing.searchActiveCourses', { values: { n: teacher.active_course_count ?? 0 } })}</div>
```

Replace with:
```svelte
							<div class="text-xs text-text2 flex items-center gap-2">
								{$t('landing.searchActiveCourses', { values: { n: teacher.active_course_count ?? 0 } })}
								{#if teacher.average_rating && teacher.total_ratings > 0}
									<span class="text-[#F59E0B]">★</span>
									<span>{(teacher.average_rating).toFixed(1)}</span>
								{/if}
							</div>
```

- [ ] **Step 2: Verify and commit**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/teachers src/routes/calendar/+page.svelte src/routes/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: teacher profile new fields + session rating + recurring mode/price"
```

---

## Self-Review

**Spec coverage:**
- ✅ Teacher edit: teaching_mode, city, methods, university, achievements, experience → Task 2
- ✅ Teacher public: rating stars, mode/city/achievements/experience display → Task 3
- ✅ Session detail: mode badge, price display → Task 4
- ✅ Student session rating (1–5 stars + comment) → Task 4
- ✅ Recurring modal: mode + price fields → Task 5
- ✅ Landing search: star rating display → Task 6

**Placeholder scan:** None found.

**Type consistency:** `rMode: 'online' | 'offline'`, `rPrice: number | undefined` used consistently in Tasks 5. `ratingValue: number` used consistently in Task 4.
