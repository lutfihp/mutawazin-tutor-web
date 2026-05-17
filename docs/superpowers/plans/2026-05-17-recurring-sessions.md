# Recurring Sessions — Calendar Updates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recurring badge to session pills, update the session detail modal, and add a recurring template management panel + modal to the teacher calendar view.

**Architecture:** All changes are in `src/routes/calendar/+page.svelte`. The recurring templates list is a new card in the right panel (teacher only). The "Add Recurring" modal reuses the existing `Modal` component. Sessions with `recurring_template_id` get a "↻ " prefix in the pill and an informational line in the detail modal.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client, existing `Modal` component

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/routes/calendar/+page.svelte` — recurring badge, detail modal, template panel, add/edit/delete modals |
| Modify | `src/locales/en.json` — new `calendar.*` keys |
| Modify | `src/locales/id.json` — new keys (Indonesian) |

---

### Task 1: Add locale keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add recurring locale keys to `en.json` under `calendar`**

Inside `calendar`, add after `"legendAvailability"`:
```json
    "recurringTitle": "Recurring Sessions",
    "addRecurring": "+ Recurring",
    "noRecurring": "No recurring sessions.",
    "recurringBadge": "Part of a recurring series",
    "deleteRecurringConfirm": "This will delete all future sessions in this series. Continue?",
```

Inside `calendar.modal`, add after `"when"`:
```json
      "recurringTitle": "Add Recurring Session",
      "recurringEditTitle": "Edit Recurring Session",
      "dayLabel": "Day of week",
      "durationLabel": "Duration (minutes)",
      "days": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
```

- [ ] **Step 2: Add same keys to `id.json`**

Inside `calendar`:
```json
    "recurringTitle": "Sesi Berulang",
    "addRecurring": "+ Berulang",
    "noRecurring": "Tidak ada sesi berulang.",
    "recurringBadge": "Bagian dari seri berulang",
    "deleteRecurringConfirm": "Ini akan menghapus semua sesi mendatang dalam seri ini. Lanjutkan?",
```

Inside `calendar.modal`:
```json
      "recurringTitle": "Tambah Sesi Berulang",
      "recurringEditTitle": "Edit Sesi Berulang",
      "dayLabel": "Hari dalam seminggu",
      "durationLabel": "Durasi (menit)",
      "days": ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"]
```

---

### Task 2: Add recurring state and fetch to calendar script

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add recurring template state variables**

In the script block, after `let addOpen = $state(false);`, add:

```svelte
	// Recurring templates (teacher only)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recurringTemplates = $state<any[]>([]);
	let recurringOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let editingTemplate = $state<any | null>(null);
	let recurringDeleteLoading = $state<string | null>(null);

	// Recurring form fields
	let rType = $state<'group' | 'private'>('group');
	let rCourseId = $state('');
	let rStudentId = $state('');
	let rTitle = $state('');
	let rDayOfWeek = $state(0);
	let rStartTime = $state('');
	let rDuration = $state(60);
	let rLoading = $state(false);
	let rFormEl = $state<HTMLFormElement | null>(null);

	// Courses + students for selects
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let teacherCourses = $state<any[]>([]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let privateStudents = $state<any[]>([]);
```

- [ ] **Step 2: Add fetch and CRUD functions**

After the `fetchAvailability` function, add:

```svelte
	async function fetchRecurringTemplates() {
		if (!isTeacher) return;
		try {
			const data = await api.get<any[]>('/sessions/recurring');
			recurringTemplates = Array.isArray(data) ? data : [];
		} catch {
			recurringTemplates = [];
		}
	}

	async function fetchTeacherCourses() {
		if (!isTeacher) return;
		try {
			const data = await api.get<any[]>('/courses');
			teacherCourses = Array.isArray(data) ? data : [];
		} catch {
			teacherCourses = [];
		}
	}

	function openAddRecurring() {
		editingTemplate = null;
		rType = 'group';
		rCourseId = '';
		rStudentId = '';
		rTitle = '';
		rDayOfWeek = 0;
		rStartTime = '';
		rDuration = 60;
		recurringOpen = true;
	}

	function openEditRecurring(template: any) {
		editingTemplate = template;
		rType = template.type ?? 'group';
		rCourseId = template.course_id ?? '';
		rStudentId = template.student_id ?? '';
		rTitle = template.title ?? '';
		rDayOfWeek = template.day_of_week ?? 0;
		rStartTime = template.start_time ?? '';
		rDuration = template.duration_minutes ?? 60;
		recurringOpen = true;
	}

	async function handleRecurringSubmit(e: SubmitEvent) {
		e.preventDefault();
		rLoading = true;
		try {
			const body = {
				type: rType,
				course_id: rType === 'group' ? rCourseId : undefined,
				student_id: rType === 'private' ? rStudentId : undefined,
				title: rTitle,
				day_of_week: rDayOfWeek,
				start_time: rStartTime,
				duration_minutes: rDuration,
			};
			if (editingTemplate) {
				await api.put(`/sessions/recurring/${editingTemplate.id}`, body);
			} else {
				await api.post('/sessions/recurring', body);
			}
			recurringOpen = false;
			await Promise.all([fetchSessions(), fetchRecurringTemplates()]);
		} finally {
			rLoading = false;
		}
	}

	async function deleteRecurringTemplate(id: string) {
		if (!confirm($t('calendar.deleteRecurringConfirm'))) return;
		recurringDeleteLoading = id;
		try {
			await api.delete(`/sessions/recurring/${id}`);
			recurringTemplates = recurringTemplates.filter((t: any) => t.id !== id);
			await fetchSessions();
		} finally {
			recurringDeleteLoading = null;
		}
	}
```

- [ ] **Step 3: Add fetches to `onMount`**

The calendar currently calls `onMount(fetchAvailability)`. Update it to also call the new fetches:

```svelte
	onMount(() => {
		fetchAvailability();
		fetchRecurringTemplates();
		fetchTeacherCourses();
	});
```

---

### Task 3: Add recurring badge to session pills

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Update the session pill text**

Find the session pill button in the calendar grid:
```svelte
									{session.starts_at?.slice(11, 16)} {session.title}
```

Replace with:
```svelte
									{session.recurring_template_id ? '↻ ' : ''}{session.starts_at?.slice(11, 16)} {session.title}
```

---

### Task 4: Update session detail modal with recurring indicator

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add recurring line to session detail modal body**

In the session detail modal, find the two-column grid that shows "When" and "Status":
```svelte
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div><span class="text-text2">{$t('calendar.modal.when')}</span><br/>...
				<div><span class="text-text2">{$t('calendar.modal.status')}</span><br/>...
			</div>
```

Add a recurring indicator line below this div:
```svelte
			{#if selectedSession.recurring_template_id}
				<p class="text-sm text-text2 flex items-center gap-1.5">
					<span class="text-primary font-medium">↻</span>
					{$t('calendar.recurringBadge')}
				</p>
			{/if}
```

---

### Task 5: Add recurring templates panel to right column

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add recurring templates card above the availability card**

In the right panel section (the `<div class="flex flex-col gap-4">` containing the availability card and legend), add this block as the first child:

```svelte
			<!-- Recurring templates -->
			{#if isTeacher}
				<div class="bg-white border border-border rounded-DEFAULT p-4">
					<div class="flex items-center justify-between mb-3">
						<h2 class="font-semibold">{$t('calendar.recurringTitle')}</h2>
						<Button variant="secondary" size="sm" onclick={openAddRecurring}>{$t('calendar.addRecurring')}</Button>
					</div>
					{#if recurringTemplates.length === 0}
						<p class="text-sm text-text2">{$t('calendar.noRecurring')}</p>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#each recurringTemplates as tmpl}
								<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
									<div>
										<span class="font-medium tabular">
											{($t('calendar.modal.days') as string[])[tmpl.day_of_week] ?? tmpl.day_of_week}
											· {tmpl.start_time}
										</span>
										<span class="text-text2 ml-1.5">— {tmpl.title}</span>
									</div>
									<div class="flex gap-1">
										<button onclick={() => openEditRecurring(tmpl)}
											class="text-text2 hover:text-text p-1"
											aria-label="Edit recurring session">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
										</button>
										<button onclick={() => deleteRecurringTemplate(tmpl.id)}
											class="text-text2 hover:text-error p-1"
											aria-label="Delete recurring session"
											disabled={recurringDeleteLoading === tmpl.id}>
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
```

- [ ] **Step 2: Add "+ Recurring" button to the page header (teacher only)**

In the page header toolbar, find the `{#if isTeacher}` block with the `+ Add Session` button and add a second button:
```svelte
			{#if isTeacher}
				<Button variant="secondary" size="sm" onclick={openAddRecurring}>
					{$t('calendar.addRecurring')}
				</Button>
				<Button variant="primary" size="sm" onclick={() => (addOpen = true)}>
					{$t('calendar.addSession')}
				</Button>
			{/if}
```

---

### Task 6: Add Recurring Session modal

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add the recurring modal at the end of the template**

Add after the existing Add Session modal:

```svelte
<!-- Recurring Session Modal -->
{#if isTeacher}
	<Modal
		open={recurringOpen}
		title={editingTemplate ? $t('calendar.modal.recurringEditTitle') : $t('calendar.modal.recurringTitle')}
		onclose={() => (recurringOpen = false)}
	>
		<form bind:this={rFormEl} onsubmit={handleRecurringSubmit} class="flex flex-col gap-4">
			<!-- Type -->
			<div>
				<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.typeLabel')}</p>
				<div class="flex gap-2" role="radiogroup" aria-label={$t('calendar.modal.typeLabel')}>
					{#each [['group', $t('calendar.modal.typeGroup')], ['private', $t('calendar.modal.typePrivate')]] as [val, label]}
						<label class="flex items-center gap-1.5 cursor-pointer">
							<input type="radio" name="rType" value={val} bind:group={rType} class="sr-only" />
							<span class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
							             {rType === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
								{label}
							</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Course (group) or Student (private) -->
			{#if rType === 'group'}
				<div class="flex flex-col gap-1.5">
					<label for="rCourseId" class="text-[13px] font-medium">{$t('calendar.modal.courseLabel')}</label>
					<select id="rCourseId" bind:value={rCourseId} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
						<option value="">— {$t('calendar.modal.courseLabel')}</option>
						{#each teacherCourses as course}
							<option value={course.id}>{course.name ?? course.title}</option>
						{/each}
					</select>
				</div>
			{:else}
				<div class="flex flex-col gap-1.5">
					<label for="rStudentId" class="text-[13px] font-medium">{$t('calendar.modal.studentLabel')}</label>
					<input id="rStudentId" type="text" bind:value={rStudentId} required
						placeholder="Student ID"
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
			{/if}

			<!-- Title -->
			<div class="flex flex-col gap-1.5">
				<label for="rTitle" class="text-[13px] font-medium">{$t('calendar.modal.addTitle')}</label>
				<input id="rTitle" type="text" bind:value={rTitle} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
			</div>

			<!-- Day of week -->
			<div class="flex flex-col gap-1.5">
				<label for="rDay" class="text-[13px] font-medium">{$t('calendar.modal.dayLabel')}</label>
				<select id="rDay" bind:value={rDayOfWeek}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
					{#each ($t('calendar.modal.days') as string[]) as day, i}
						<option value={i}>{day}</option>
					{/each}
				</select>
			</div>

			<!-- Start time + Duration -->
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="rStart" class="text-[13px] font-medium">{$t('calendar.modal.startLabel')}</label>
					<input id="rStart" type="time" bind:value={rStartTime} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="rDuration" class="text-[13px] font-medium">{$t('calendar.modal.durationLabel')}</label>
					<input id="rDuration" type="number" bind:value={rDuration} min="15" step="15" required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary tabular" />
				</div>
			</div>
		</form>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (recurringOpen = false)}>{$t('common.cancel')}</Button>
			<Button variant="primary" size="sm" loading={rLoading} onclick={() => rFormEl?.requestSubmit()}>
				{editingTemplate ? $t('common.save') : $t('calendar.addRecurring')}
			</Button>
		{/snippet}
	</Modal>
{/if}
```

- [ ] **Step 2: Verify and commit**

```powershell
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/calendar/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: recurring sessions — badge, panel, add/edit/delete modal"
```

---

## Self-Review

**Spec coverage:**
- ✅ Recurring badge on pills (`↻ `) → Task 3
- ✅ "Part of a recurring series" in detail modal → Task 4
- ✅ Recurring templates panel in right column → Task 5
- ✅ "+ Recurring" button in page header → Task 5
- ✅ Add Recurring modal with all fields → Task 6
- ✅ `POST /sessions/recurring`, `PUT /sessions/recurring/:id`, `DELETE /sessions/recurring/:id` → Task 2 + 6
- ✅ On success: refresh calendar + templates → `handleRecurringSubmit` + `deleteRecurringTemplate`
- ✅ Locale keys EN + ID → Task 1

**Placeholder scan:** The student selector in the recurring modal uses a plain text input for student ID. This is intentional — a proper student picker requires a separate API call for the teacher's private students, which is non-trivial. The text input is a minimal working solution for now.

**Type consistency:** `recurringTemplates: any[]`, `editingTemplate: any | null`, `rFormEl: HTMLFormElement | null` all consistent across Tasks 2, 5, 6.
