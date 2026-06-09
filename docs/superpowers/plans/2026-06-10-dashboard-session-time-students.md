# Teacher Dashboard — Session Time & Students Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix session time display (raw ISO → human-readable), remove the broken Private Students card, and repair the My Students section with a proper empty/error state.

**Architecture:** Frontend-only changes to one Svelte page and both locale files. `formatSessionWindow` already exists in `src/lib/utils/date.ts` and just needs to be imported and used. No backend changes.

**Tech Stack:** SvelteKit 5 (Svelte runes), svelte-i18n, Tailwind v3

---

## Files

| File | Change |
|---|---|
| `src/routes/dashboard/+page.svelte` | Import `formatSessionWindow`; fix time spans; remove Private Students card + grid wrapper; fix My Students heading/empty/error states |
| `src/locales/en.json` | Remove `privateStudents`/`noPrivateStudents`; add `myStudents`, `noMyStudents`, `studentsError` |
| `src/locales/id.json` | Same key changes |

---

### Task 1: Update i18n keys in both locale files

**Files:**
- Modify: `src/locales/en.json` (around line 204, inside `dashboard.teacher`)
- Modify: `src/locales/id.json` (same location)

- [ ] **Step 1: Update en.json**

In `src/locales/en.json`, find the `dashboard.teacher` block and replace these two lines:

```json
      "privateStudents": "My Private Students",
      "noPrivateStudents": "No private students yet.",
```

with:

```json
      "myStudents": "My Students",
      "noMyStudents": "No students assigned yet.",
      "studentsError": "Failed to load students.",
```

- [ ] **Step 2: Update id.json**

In `src/locales/id.json`, find the same block and replace:

```json
      "privateStudents": "Murid Privat Saya",
      "noPrivateStudents": "Belum ada murid privat.",
```

with:

```json
      "myStudents": "Murid Saya",
      "noMyStudents": "Belum ada murid yang ditugaskan.",
      "studentsError": "Gagal memuat daftar murid.",
```

- [ ] **Step 3: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```powershell
git add src/locales/en.json src/locales/id.json
git commit -m "i18n: replace privateStudents keys with myStudents/noMyStudents/studentsError"
```

---

### Task 2: Fix session time format in both teacher and student dashboards

**Files:**
- Modify: `src/routes/dashboard/+page.svelte` (line 9 and two `{session.starts_at}` spans)

`formatSessionWindow(starts_at, ends_at)` already exists in `src/lib/utils/date.ts`. It takes two ISO strings and returns a readable string like `"09:05 – 10:00 · Monday, Jun 10, 2026"`. It just needs to be imported and called.

- [ ] **Step 1: Add `formatSessionWindow` to the import**

In `src/routes/dashboard/+page.svelte`, find line 9:

```ts
import { formatDate } from '$lib/utils/date';
```

Replace with:

```ts
import { formatDate, formatSessionWindow } from '$lib/utils/date';
```

- [ ] **Step 2: Fix teacher dashboard session time span**

Find this span in the teacher `Upcoming Sessions` section (inside `{#if isTeacher}` block):

```svelte
<span class="text-xs text-text2 bg-bgGray px-2 py-1 rounded-sm whitespace-nowrap tabular">{session.starts_at}</span>
```

Replace with:

```svelte
<span class="text-xs text-text2 bg-bgGray px-2 py-1 rounded-sm whitespace-nowrap tabular">{formatSessionWindow(session.starts_at, session.ends_at)}</span>
```

- [ ] **Step 3: Fix student dashboard session time span**

Find the identical span in the student `Upcoming Sessions` section (inside `{:else}` / student dashboard block):

```svelte
<span class="text-xs text-text2 bg-bgGray px-2 py-1 rounded-sm whitespace-nowrap tabular">{session.starts_at}</span>
```

Replace with:

```svelte
<span class="text-xs text-text2 bg-bgGray px-2 py-1 rounded-sm whitespace-nowrap tabular">{formatSessionWindow(session.starts_at, session.ends_at)}</span>
```

- [ ] **Step 4: Run type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add src/routes/dashboard/+page.svelte
git commit -m "fix(dashboard): format session start time using formatSessionWindow"
```

---

### Task 3: Remove Private Students card and fix My Students section

**Files:**
- Modify: `src/routes/dashboard/+page.svelte` (script block and teacher dashboard template)

This task has two parts:
- **Part A**: Remove the two-column grid wrapper and the entire Private Students `<Card>`, leaving Recent Reports as a standalone full-width card.
- **Part B**: Add `studentsError` state, update the `onMount` catch block, fix the My Students card heading to use i18n, and add the error branch to the template.

- [ ] **Step 1: Add `studentsError` state variable**

In the `<script lang="ts">` block, find:

```ts
let students = $state<any[]>([]);
let studentsLoading = $state(true);
```

Replace with:

```ts
let students = $state<any[]>([]);
let studentsLoading = $state(true);
let studentsError = $state(false);
```

- [ ] **Step 2: Update `onMount` catch block to set error state**

Find the `onMount` function:

```ts
onMount(async () => {
	if (!isTeacher) return;
	try {
		const body = await api.get<PaginatedResponse<any>>('/students');
		students = body.data;
	} catch {
		students = [];
	} finally {
		studentsLoading = false;
	}
});
```

Replace with:

```ts
onMount(async () => {
	if (!isTeacher) return;
	try {
		const body = await api.get<PaginatedResponse<any>>('/students');
		students = body.data;
	} catch {
		studentsError = true;
	} finally {
		studentsLoading = false;
	}
});
```

- [ ] **Step 3: Remove Private Students card and the two-column grid wrapper**

Find the entire two-column grid section (starts with `<!-- Two-col row -->` and ends just before `<!-- Quick Actions -->`):

```svelte
		<!-- Two-col row -->
		<div class="grid lg:grid-cols-2 gap-6">
			<!-- Private Students -->
			<Card padding="none">
				{#snippet head()}
					<h2 class="font-semibold">{$t('dashboard.teacher.privateStudents')}</h2>
				{/snippet}
				<div class="divide-y divide-border">
					{#if d.private_students?.length}
						{#each d.private_students as student}
							<div class="flex items-center gap-3 px-5 py-3">
								<Avatar name={student.full_name} id={student.user_id} size="md" />
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm">{student.full_name}</div>
									{#if student.last_session_at}
									<div class="text-xs text-text2">{$t('dashboard.teacher.lastSession', { values: { when: student.last_session_at } })}</div>
								{/if}
								</div>
								<Badge variant="violet" label={student.age_category ?? ''} />
								<a href="/students/{student.user_id}" class="text-xs font-semibold text-primary">{$t('dashboard.teacher.openStudent')}</a>
							</div>
						{/each}
					{:else}
						<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.teacher.noPrivateStudents')}</p>
					{/if}
				</div>
			</Card>

			<!-- Recent Reports -->
			<Card padding="none">
				{#snippet head()}
					<h2 class="font-semibold">{$t('dashboard.teacher.recentReports')}</h2>
				{/snippet}
				<div class="divide-y divide-border">
					{#if d.recent_reports?.length}
						{#each d.recent_reports as report}
							<div class="flex items-center gap-3 px-5 py-3">
								<div class="w-8 h-8 rounded-pill bg-primary-light text-primary flex items-center justify-center flex-none">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
									</svg>
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm truncate">
									{report.subject_name ?? 'No subject'} — {report.student_name ?? 'Unknown student'}
								</div>
								<div class="text-xs text-text2 tabular">
									{formatDate(report.session_date ?? report.created_at)}
								</div>
								</div>
								<a href="/reports/{report.student_id}" class="text-xs font-semibold text-primary">{$t('common.view')} →</a>
							</div>
						{/each}
					{:else}
						<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.teacher.noRecentReports')}</p>
					{/if}
				</div>
			</Card>
		</div>
```

Replace the entire block with just the Recent Reports card (no grid wrapper):

```svelte
		<!-- Recent Reports -->
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">{$t('dashboard.teacher.recentReports')}</h2>
			{/snippet}
			<div class="divide-y divide-border">
				{#if d.recent_reports?.length}
					{#each d.recent_reports as report}
						<div class="flex items-center gap-3 px-5 py-3">
							<div class="w-8 h-8 rounded-pill bg-primary-light text-primary flex items-center justify-center flex-none">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm truncate">
								{report.subject_name ?? 'No subject'} — {report.student_name ?? 'Unknown student'}
							</div>
							<div class="text-xs text-text2 tabular">
								{formatDate(report.session_date ?? report.created_at)}
							</div>
							</div>
							<a href="/reports/{report.student_id}" class="text-xs font-semibold text-primary">{$t('common.view')} →</a>
						</div>
					{/each}
				{:else}
					<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.teacher.noRecentReports')}</p>
				{/if}
			</div>
		</Card>
```

- [ ] **Step 4: Fix My Students card — heading, error state, empty state key**

Find the entire My Students card:

```svelte
		<!-- My Students roster -->
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">My Students</h2>
			{/snippet}
			{#if studentsLoading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if students.length === 0}
				<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.teacher.noPrivateStudents')}</p>
			{:else}
				<div class="divide-y divide-border">
					{#each students as student}
						<div class="flex items-center gap-3 px-5 py-3">
							<Avatar name={student.full_name} id={student.user_id} size="md" />
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm">{student.full_name}</div>
							</div>
							{#if student.age_category}
								<Badge variant="violet" label={student.age_category} />
							{/if}
							<a href="/students/{student.user_id}" class="text-xs font-semibold text-primary">
								{$t('dashboard.teacher.openStudent')}
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
```

Replace with:

```svelte
		<!-- My Students roster -->
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">{$t('dashboard.teacher.myStudents')}</h2>
			{/snippet}
			{#if studentsLoading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if studentsError}
				<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.teacher.studentsError')}</p>
			{:else if students.length === 0}
				<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.teacher.noMyStudents')}</p>
			{:else}
				<div class="divide-y divide-border">
					{#each students as student}
						<div class="flex items-center gap-3 px-5 py-3">
							<Avatar name={student.full_name} id={student.user_id} size="md" />
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm">{student.full_name}</div>
							</div>
							{#if student.age_category}
								<Badge variant="violet" label={student.age_category} />
							{/if}
							<a href="/students/{student.user_id}" class="text-xs font-semibold text-primary">
								{$t('dashboard.teacher.openStudent')}
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
```

- [ ] **Step 5: Run type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```powershell
git add src/routes/dashboard/+page.svelte
git commit -m "fix(dashboard): remove private students card, fix my students section"
```
