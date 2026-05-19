# Calendar — Add Session + Availability CRUD Design

**Date:** 2026-05-19
**Source:** CLAUDE.md Priority 1, design handoff Stage 4 — Features.html
**File:** `src/routes/calendar/+page.svelte` (single file, all changes here)

---

## Scope

Two features, one file:

1. **Add Session modal** — replace the placeholder `<p>` with a full 7-field form that calls `POST /sessions`
2. **Availability CRUD** — wire the "Add Slot" button and edit/delete icons to `POST /availability`, `PUT /availability/:id`, `DELETE /availability/:id`

---

## Context: Existing Patterns to Follow

The recurring session form (already built, lines 163–262) uses:
- `r`-prefixed state: `rType`, `rCourseId`, `rStudentId`, `rTitle`, `rMode`, etc.
- `teacherCourses` state loaded by `fetchTeacherCourses()` in `onMount`
- Radio-pill type selector (Group / Private) with `bind:group`
- A `<form bind:this={rFormEl} onsubmit={handler}>` pattern

Add Session follows the same patterns with `s`-prefixed state.
Availability CRUD follows the `recurringDeleteLoading` pattern (string | null) for per-slot delete loading.

---

## 1. Add Session Modal

### New state (insert after line 175 `let teacherCourses`)

```svelte
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
let calendarStudents = $state<any[]>([]);
```

### New fetch function (insert after `fetchTeacherCourses`, before `openAddRecurring`)

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
```

### onMount update (line 258–262)

Add `fetchCalendarStudents()` to the existing `onMount`:

```svelte
onMount(() => {
	fetchAvailability();
	fetchRecurringTemplates();
	fetchTeacherCourses();
	fetchCalendarStudents();
});
```

### Add Session submit handler (insert alongside other handlers)

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
```

### Add Session modal template (replace lines 554–563)

Replace the entire placeholder modal:

```svelte
<!-- Add session modal -->
{#if isTeacher}
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

### i18n keys to add

Add to `src/locales/en.json` inside `"calendar" > "modal"`:
```json
"titleLabel": "Title",
"titlePlaceholder": "e.g. Calculus — Limits",
"studentLabel": "Student"
```

Add to `src/locales/id.json` inside `"calendar" > "modal"`:
```json
"titleLabel": "Judul",
"titlePlaceholder": "mis. Kalkulus — Limit",
"studentLabel": "Murid"
```

---

## 2. Availability CRUD

### New state (insert after the Add Session state block)

```svelte
// Availability slot form state
let slotOpen = $state(false);
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

### Helper functions (insert before availability panel template)

```svelte
function openAddSlot() {
	editingSlot = null;
	slotMode = 'weekly'; slotDayOfWeek = '0';
	slotSpecificDate = ''; slotStartTime = ''; slotEndTime = '';
	slotOpen = true;
}

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
```

### Availability panel update (replace lines 411–435)

```svelte
<div class="bg-white border border-border rounded-DEFAULT p-4">
	<div class="flex items-center justify-between mb-3">
		<h2 class="font-semibold">{$t('calendar.myAvailability')}</h2>
		<Button variant="secondary" size="sm" onclick={openAddSlot}>{$t('calendar.addSlot')}</Button>
	</div>
	{#if availability.length}
		<div class="flex flex-col gap-1.5">
			{#each availability as slot}
				{@const slotId = slot.id ?? slot.slot_id}
				<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
					<span class="text-text2 tabular">
						{slot.day_of_week !== undefined && slot.day_of_week !== null
							? $t('calendar.modal.days')[slot.day_of_week]
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
								class="text-xs text-error hover:text-error font-medium px-1 disabled:opacity-50">
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

### Availability slot modal (add inside `{#if isTeacher}` after the recurring modal)

```svelte
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
		{/if}

		<!-- Day of week or specific date -->
		{#if !editingSlot}
			{#if slotMode === 'weekly'}
				<div class="flex flex-col gap-1.5">
					<label for="slotDayOfWeek" class="text-[13px] font-medium">{$t('calendar.modal.dayLabel')}</label>
					<select id="slotDayOfWeek" bind:value={slotDayOfWeek}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
						{#each $t('calendar.modal.days') as day, i}
							<option value={String(i)}>{day}</option>
						{/each}
					</select>
				</div>
			{:else}
				<div class="flex flex-col gap-1.5">
					<label for="slotSpecificDate" class="text-[13px] font-medium">{$t('calendar.modal.dateLabel')}</label>
					<input id="slotSpecificDate" type="date" bind:value={slotSpecificDate} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
			{/if}
		{:else}
			<!-- Edit mode: show current slot label read-only -->
			<p class="text-sm text-text2">
				{editingSlot.day_of_week !== undefined && editingSlot.day_of_week !== null
					? $t('calendar.modal.days')[editingSlot.day_of_week]
					: editingSlot.specific_date}
			</p>
		{/if}

		<!-- Start + End time -->
		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1.5">
				<label for="slotStartTime" class="text-[13px] font-medium">{$t('calendar.modal.startLabel')}</label>
				<input id="slotStartTime" type="time" bind:value={slotStartTime} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="slotEndTime" class="text-[13px] font-medium">{$t('calendar.modal.endLabel')}</label>
				<input id="slotEndTime" type="time" bind:value={slotEndTime} required
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
```

---

## Assumption

`GET /availability` response objects must include `id` (or `slot_id`). The template currently reads `slot.day_of_week`, `slot.specific_date`, `slot.start_time`, `slot.end_time` — edit/delete need the ID. The panel uses `slot.id ?? slot.slot_id` as a fallback. Verify the actual field name at runtime.

---

## Files Changed

| File | Change |
|---|---|
| `src/routes/calendar/+page.svelte` | All changes — new state, two new fetch functions, two new submit handlers, Add Session modal replacement, availability panel update, slot modal addition |
| `src/locales/en.json` | Add `titleLabel`, `titlePlaceholder`, `studentLabel` inside `calendar.modal` |
| `src/locales/id.json` | Same three keys in Indonesian |
