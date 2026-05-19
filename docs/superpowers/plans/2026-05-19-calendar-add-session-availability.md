# Calendar — Add Session + Availability CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the calendar's placeholder Add Session modal with a full 7-field form, and wire the availability panel's Add Slot / edit / delete buttons to their respective API endpoints.

**Architecture:** All changes live in `src/routes/calendar/+page.svelte`. New state follows the existing `s`-prefix (Add Session) and `slot`-prefix (Availability) conventions, mirroring the `r`-prefixed recurring form already in the file. Two locale files get two new keys each.

**Tech Stack:** SvelteKit (Svelte 5 runes), `$lib/api` (`api.get/post/put/delete`), svelte-i18n `$t`, Tailwind v3.

---

## File Map

| File | Change |
|---|---|
| `src/locales/en.json` | Add `titleLabel` + `titlePlaceholder` inside `calendar.modal` |
| `src/locales/id.json` | Same two keys in Indonesian |
| `src/routes/calendar/+page.svelte` | New state, new functions, replace Add Session modal, update availability panel, add slot modal |

---

## Task 1: Add missing i18n keys

**Files:**
- Modify: `src/locales/en.json:361` (after `priceLabel`)
- Modify: `src/locales/id.json:361` (after `priceLabel`)

Note: `studentLabel`, `dateLabel`, `startLabel`, `endLabel` already exist in `calendar.modal`. Only `titleLabel` and `titlePlaceholder` are missing.

- [ ] **Step 1: Add keys to en.json**

Find (line 361):
```json
      "priceLabel": "Price (optional)",
```
Replace with:
```json
      "priceLabel": "Price (optional)",
      "titleLabel": "Title",
      "titlePlaceholder": "e.g. Calculus — Limits",
```

- [ ] **Step 2: Add keys to id.json**

Find (line 361):
```json
      "priceLabel": "Harga (opsional)",
```
Replace with:
```json
      "priceLabel": "Harga (opsional)",
      "titleLabel": "Judul",
      "titlePlaceholder": "mis. Kalkulus — Limit",
```

- [ ] **Step 3: Verify type check**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/id.json
git commit -m "i18n: add calendar.modal titleLabel + titlePlaceholder keys"
```

---

## Task 2: Add Session — state variables + functions

**Files:**
- Modify: `src/routes/calendar/+page.svelte:175` (after `teacherCourses` declaration)
- Modify: `src/routes/calendar/+page.svelte:195` (after `fetchTeacherCourses`)
- Modify: `src/routes/calendar/+page.svelte:258-262` (onMount block)

- [ ] **Step 1: Add Add Session state after `teacherCourses` (line 175)**

Find:
```svelte
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let teacherCourses = $state<any[]>([]);
```
Replace with:
```svelte
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let teacherCourses = $state<any[]>([]);

	// Add Session form state
	let sType = $state<'group' | 'private'>('group');
	let sTitle = $state('');
	let sCourseId = $state('');
	let sStudentId = $state('');
	let sDate = $state('');
	let sStartTime = $state('');
	let sEndTime = $state('');
	let sMode = $state<'online' | 'offline'>('online');
	let sPrice = $state('');
	let sLoading = $state(false);
	let sFormEl = $state<HTMLFormElement | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let calendarStudents = $state<any[]>([]);
```

- [ ] **Step 2: Add `fetchCalendarStudents` after `fetchTeacherCourses` (after line 195)**

Find:
```svelte
	function openAddRecurring() {
```
Replace with:
```svelte
	async function fetchCalendarStudents() {
		if (!isTeacher) return;
		try {
			const d = await api.get<any[]>('/students');
			calendarStudents = Array.isArray(d) ? d : [];
		} catch {
			calendarStudents = [];
		}
	}

	function openAddRecurring() {
```

- [ ] **Step 3: Add `handleAddSession` after `deleteRecurringTemplate` (after line 256)**

Find:
```svelte
	onMount(() => {
		fetchAvailability();
		fetchRecurringTemplates();
		fetchTeacherCourses();
	});
```
Replace with:
```svelte
	async function handleAddSession(e: SubmitEvent) {
		e.preventDefault();
		if (!sDate || !sStartTime || !sEndTime) return;
		sLoading = true;
		try {
			const starts_at = new Date(`${sDate}T${sStartTime}:00`).toISOString();
			const ends_at = new Date(`${sDate}T${sEndTime}:00`).toISOString();
			await api.post('/sessions', {
				type: sType,
				title: sTitle,
				starts_at,
				ends_at,
				mode: sMode,
				course_id: sType === 'group' ? sCourseId : undefined,
				student_id: sType === 'private' ? sStudentId : undefined,
				price: sPrice ? Number(sPrice) : undefined,
			});
			addOpen = false;
			sType = 'group'; sTitle = ''; sCourseId = ''; sStudentId = '';
			sDate = ''; sStartTime = ''; sEndTime = '';
			sMode = 'online'; sPrice = '';
			await fetchSessions();
		} finally {
			sLoading = false;
		}
	}

	onMount(() => {
		fetchAvailability();
		fetchRecurringTemplates();
		fetchTeacherCourses();
		fetchCalendarStudents();
	});
```

- [ ] **Step 4: Verify type check**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/calendar/+page.svelte
git commit -m "feat: add session state + handleAddSession + fetchCalendarStudents"
```

---

## Task 3: Add Session — modal template

**Files:**
- Modify: `src/routes/calendar/+page.svelte:556-563` (the placeholder Modal block)

- [ ] **Step 1: Replace the placeholder Add Session modal**

Find:
```svelte
	<Modal open={addOpen} title={$t('calendar.modal.addTitle')} onclose={() => (addOpen = false)}>
		<div class="flex flex-col gap-4 text-sm text-text2">
			<p>Use the calendar to create sessions by selecting a date.</p>
		</div>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (addOpen = false)}>{$t('common.cancel')}</Button>
		{/snippet}
	</Modal>
```

Replace with:
```svelte
	<Modal open={addOpen} title={$t('calendar.modal.addTitle')} onclose={() => (addOpen = false)}>
		<form bind:this={sFormEl} onsubmit={handleAddSession} class="flex flex-col gap-4">
			<!-- Type -->
			<div>
				<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.typeLabel')}</p>
				<div class="flex gap-2" role="radiogroup" aria-label={$t('calendar.modal.typeLabel')}>
					{#each ([['group', $t('calendar.modal.typeGroup')], ['private', $t('calendar.modal.typePrivate')]] as const) as [val, label]}
						<label class="flex items-center gap-1.5 cursor-pointer">
							<input type="radio" name="sType" value={val} bind:group={sType} class="sr-only" />
							<span class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
							             {sType === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
								{label}
							</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Title -->
			<div class="flex flex-col gap-1.5">
				<label for="sTitle" class="text-[13px] font-medium">{$t('calendar.modal.titleLabel')}</label>
				<input id="sTitle" bind:value={sTitle} required
					placeholder={$t('calendar.modal.titlePlaceholder')}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
			</div>

			<!-- Course (group) or Student (private) -->
			{#if sType === 'group'}
				<div class="flex flex-col gap-1.5">
					<label for="sCourseId" class="text-[13px] font-medium">{$t('calendar.modal.courseLabel')}</label>
					<select id="sCourseId" bind:value={sCourseId} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
						<option value="">— {$t('calendar.modal.courseLabel')}</option>
						{#each teacherCourses as course}
							<option value={course.id}>{course.name ?? course.title}</option>
						{/each}
					</select>
				</div>
			{:else}
				<div class="flex flex-col gap-1.5">
					<label for="sStudentId" class="text-[13px] font-medium">{$t('calendar.modal.studentLabel')}</label>
					<select id="sStudentId" bind:value={sStudentId} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
						<option value="">— {$t('calendar.modal.studentLabel')}</option>
						{#each calendarStudents as student}
							<option value={student.user_id}>{student.full_name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Date -->
			<div class="flex flex-col gap-1.5">
				<label for="sDate" class="text-[13px] font-medium">{$t('calendar.modal.dateLabel')}</label>
				<input id="sDate" type="date" bind:value={sDate} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
			</div>

			<!-- Start + End time -->
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="sStartTime" class="text-[13px] font-medium">{$t('calendar.modal.startLabel')}</label>
					<input id="sStartTime" type="time" bind:value={sStartTime} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="sEndTime" class="text-[13px] font-medium">{$t('calendar.modal.endLabel')}</label>
					<input id="sEndTime" type="time" bind:value={sEndTime} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
			</div>

			<!-- Mode -->
			<div>
				<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.modeLabel')}</p>
				<div class="flex gap-2" role="radiogroup" aria-label={$t('calendar.modal.modeLabel')}>
					{#each ([['online', $t('calendar.modal.modeOnline')], ['offline', $t('calendar.modal.modeOffline')]] as const) as [val, label]}
						<label class="flex items-center gap-1.5 cursor-pointer">
							<input type="radio" name="sMode" value={val} bind:group={sMode} class="sr-only" />
							<span class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
							             {sMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
								{label}
							</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Price (optional) -->
			<div class="flex flex-col gap-1.5">
				<label for="sPrice" class="text-[13px] font-medium">{$t('calendar.modal.priceLabel')}</label>
				<input id="sPrice" type="number" min="0" step="0.01" bind:value={sPrice}
					placeholder="0"
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
			</div>
		</form>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (addOpen = false)}>{$t('common.cancel')}</Button>
			<Button variant="primary" size="sm" loading={sLoading} onclick={() => sFormEl?.requestSubmit()}>
				{$t('common.save')}
			</Button>
		{/snippet}
	</Modal>
```

- [ ] **Step 2: Verify type check**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/calendar/+page.svelte
git commit -m "feat: calendar Add Session modal — full 7-field form"
```

---

## Task 4: Availability CRUD — state variables + functions

**Files:**
- Modify: `src/routes/calendar/+page.svelte` — insert after Add Session state block

- [ ] **Step 1: Add slot state after the Add Session state block**

Find:
```svelte
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let calendarStudents = $state<any[]>([]);
```
Replace with:
```svelte
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let calendarStudents = $state<any[]>([]);

	// Availability slot form state
	let slotOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let editingSlot = $state<any | null>(null);
	let slotMode = $state<'weekly' | 'specific'>('weekly');
	let slotDayOfWeek = $state('0');
	let slotSpecificDate = $state('');
	let slotStartTime = $state('');
	let slotEndTime = $state('');
	let slotLoading = $state(false);
	let slotDeleteLoading = $state<string | null>(null);
	let slotConfirmDelete = $state<string | null>(null);
```

- [ ] **Step 2: Add slot helper functions after `fetchCalendarStudents`**

Find:
```svelte
	function openAddRecurring() {
```
Replace with:
```svelte
	function openAddSlot() {
		editingSlot = null;
		slotMode = 'weekly'; slotDayOfWeek = '0';
		slotSpecificDate = ''; slotStartTime = ''; slotEndTime = '';
		slotOpen = true;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function openEditSlot(slot: any) {
		editingSlot = slot;
		slotMode = slot.specific_date ? 'specific' : 'weekly';
		slotDayOfWeek = String(slot.day_of_week ?? 0);
		slotSpecificDate = slot.specific_date ?? '';
		slotStartTime = slot.start_time ?? '';
		slotEndTime = slot.end_time ?? '';
		slotOpen = true;
	}

	async function handleSlotSubmit() {
		slotLoading = true;
		try {
			if (editingSlot) {
				await api.put(`/availability/${editingSlot.id}`, {
					start_time: slotStartTime,
					end_time: slotEndTime,
				});
			} else {
				await api.post('/availability', {
					day_of_week: slotMode === 'weekly' ? Number(slotDayOfWeek) : undefined,
					specific_date: slotMode === 'specific' ? slotSpecificDate : undefined,
					start_time: slotStartTime,
					end_time: slotEndTime,
				});
			}
			slotOpen = false;
			await fetchAvailability();
		} finally {
			slotLoading = false;
		}
	}

	async function deleteSlot(id: string) {
		slotDeleteLoading = id;
		try {
			await api.delete(`/availability/${id}`);
			availability = availability.filter((s: any) => s.id !== id);
		} finally {
			slotDeleteLoading = null;
			slotConfirmDelete = null;
		}
	}

	function openAddRecurring() {
```

- [ ] **Step 3: Verify type check**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/calendar/+page.svelte
git commit -m "feat: availability CRUD state + handler functions"
```

---

## Task 5: Availability — panel template + slot modal

**Files:**
- Modify: `src/routes/calendar/+page.svelte:411-435` (availability panel)
- Modify: `src/routes/calendar/+page.svelte:668-669` (add slot modal before `{/if}`)

- [ ] **Step 1: Replace the availability panel (lines 411–435)**

Find:
```svelte
				<div class="bg-white border border-border rounded-DEFAULT p-4">
					<div class="flex items-center justify-between mb-3">
						<h2 class="font-semibold">{$t('calendar.myAvailability')}</h2>
						<Button variant="secondary" size="sm">{$t('calendar.addSlot')}</Button>
					</div>
					{#if availability.length}
						<div class="flex flex-col gap-1.5">
							{#each availability as slot}
								<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
									<span class="text-text2 tabular">{slot.day_of_week ?? slot.specific_date} · {slot.start_time}–{slot.end_time}</span>
									<div class="flex gap-1">
										<button class="text-text2 hover:text-text" aria-label="Edit slot">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
										</button>
										<button class="text-text2 hover:text-error" aria-label="Delete slot">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-text2">{$t('calendar.noAvailability')}</p>
					{/if}
				</div>
```

Replace with:
```svelte
				<div class="bg-white border border-border rounded-DEFAULT p-4">
					<div class="flex items-center justify-between mb-3">
						<h2 class="font-semibold">{$t('calendar.myAvailability')}</h2>
						<Button variant="secondary" size="sm" onclick={openAddSlot}>{$t('calendar.addSlot')}</Button>
					</div>
					{#if availability.length}
						<div class="flex flex-col gap-1.5">
							{#each availability as slot}
								{@const slotId = slot.id ?? slot.slot_id ?? ''}
								<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
									<span class="text-text2 tabular">
										{slot.day_of_week !== undefined && slot.day_of_week !== null
											? ($t('calendar.modal.days') as unknown as string[])[slot.day_of_week]
											: slot.specific_date}
										· {slot.start_time}–{slot.end_time}
									</span>
									{#if slotConfirmDelete === slotId}
										<div class="flex items-center gap-1">
											<span class="text-xs text-text2">Sure?</span>
											<button onclick={() => (slotConfirmDelete = null)}
												class="text-xs text-text2 hover:text-text px-1">✕</button>
											<button onclick={() => deleteSlot(slotId)}
												disabled={slotDeleteLoading === slotId}
												class="text-xs text-error font-medium px-1 disabled:opacity-50">
												{slotDeleteLoading === slotId ? '…' : 'Delete'}
											</button>
										</div>
									{:else}
										<div class="flex gap-1">
											<button onclick={() => openEditSlot(slot)}
												class="text-text2 hover:text-text p-1" aria-label="Edit slot">
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
											</button>
											<button onclick={() => (slotConfirmDelete = slotId)}
												class="text-text2 hover:text-error p-1" aria-label="Delete slot">
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
											</button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-text2">{$t('calendar.noAvailability')}</p>
					{/if}
				</div>
```

- [ ] **Step 2: Add the slot modal inside `{#if isTeacher}`, after the recurring modal closing `</Modal>` (after line 668)**

Find:
```svelte
		{/snippet}
	</Modal>
{/if}
```

Replace with:
```svelte
		{/snippet}
	</Modal>

	<!-- Add/Edit Slot modal -->
	<Modal
		open={slotOpen}
		title={editingSlot ? 'Edit Availability Slot' : $t('calendar.addSlot')}
		onclose={() => (slotOpen = false)}
	>
		<div class="flex flex-col gap-4">
			<!-- Mode toggle — add only -->
			{#if !editingSlot}
				<div>
					<p class="text-[13px] font-medium mb-2">Slot type</p>
					<div class="flex gap-2" role="radiogroup" aria-label="Slot type">
						{#each ([['weekly', 'Weekly (day of week)'], ['specific', 'Specific date']] as const) as [val, label]}
							<label class="flex items-center gap-1.5 cursor-pointer">
								<input type="radio" name="slotMode" value={val} bind:group={slotMode} class="sr-only" />
								<span class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
								             {slotMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
									{label}
								</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Day of week or specific date -->
				{#if slotMode === 'weekly'}
					<div class="flex flex-col gap-1.5">
						<label for="slotDayOfWeek" class="text-[13px] font-medium">{$t('calendar.modal.dayLabel')}</label>
						<select id="slotDayOfWeek" bind:value={slotDayOfWeek}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
							{#each ($t('calendar.modal.days') as unknown as string[]) as day, i}
								<option value={String(i)}>{day}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="flex flex-col gap-1.5">
						<label for="slotSpecificDate" class="text-[13px] font-medium">{$t('calendar.modal.dateLabel')}</label>
						<input id="slotSpecificDate" type="date" bind:value={slotSpecificDate}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
					</div>
				{/if}
			{:else}
				<!-- Edit mode: show current slot label read-only -->
				<p class="text-sm text-text2 font-medium">
					{editingSlot.day_of_week !== undefined && editingSlot.day_of_week !== null
						? ($t('calendar.modal.days') as unknown as string[])[editingSlot.day_of_week]
						: editingSlot.specific_date}
				</p>
			{/if}

			<!-- Start + End time -->
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="slotStartTime" class="text-[13px] font-medium">{$t('calendar.modal.startLabel')}</label>
					<input id="slotStartTime" type="time" bind:value={slotStartTime}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="slotEndTime" class="text-[13px] font-medium">{$t('calendar.modal.endLabel')}</label>
					<input id="slotEndTime" type="time" bind:value={slotEndTime}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
			</div>
		</div>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (slotOpen = false)}>{$t('common.cancel')}</Button>
			<Button variant="primary" size="sm" loading={slotLoading} onclick={handleSlotSubmit}>
				{$t('common.save')}
			</Button>
		{/snippet}
	</Modal>
{/if}
```

- [ ] **Step 3: Verify type check**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/calendar/+page.svelte
git commit -m "feat: availability CRUD — Add Slot modal + wired edit/delete"
```

---

## Final Verification

- [ ] **Full type check + build**

```powershell
npm run check && npm run build
```
Expected: 0 errors, build succeeds.

- [ ] **Manual smoke test**

Start dev server:
```powershell
npm run dev
```

Log in as a teacher and go to `/calendar`.

**Add Session:**
1. Click "+ Add Session" in the toolbar → modal opens with 7 fields
2. Select "Private" → student dropdown appears (populated from `GET /students`)
3. Select "Group" → course dropdown appears (populated from `GET /courses`)
4. Fill all fields, click Save → session appears on the calendar for the selected date
5. Network tab: `POST /sessions` fires with `starts_at`/`ends_at` as ISO strings

**Availability CRUD:**
1. Click "+ Add Slot" in the right panel → slot modal opens
2. Select "Weekly" → day-of-week dropdown; select "Specific date" → date picker
3. Fill start/end time, Save → slot appears in right panel with day name (not raw number)
4. Click edit pencil → modal re-opens pre-filled with existing times
5. Change time, Save → slot updates in panel
6. Click delete trash → "Sure?" confirm appears; click Delete → slot removed
7. Click ✕ on confirm → confirm dismisses, slot remains
