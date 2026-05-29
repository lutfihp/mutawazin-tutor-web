# Delta v9 — Attendance Field Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `attendance` from all report-related frontend code following the delta v9 backend change that dropped the field entirely.

**Architecture:** Pure deletion work across four Svelte components and two i18n files. No new logic, no new components. Each task is independent.

**Tech Stack:** SvelteKit, Svelte 5 runes, Tailwind v3, svelte-i18n

---

### Task 1: Clean up `reports/[studentId]/+page.svelte`

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

This file has the most attendance-related code: filter state, modal state, payload field, helper function, filter dropdown UI, and modal radio section.

- [ ] **Step 1: Remove attendance state variables and helper**

In the `<script>` block, remove these lines:

```
let attendanceFilter = $state('');          // line ~19
let attendance = $state<'Present' | 'Late' | 'Absent'>('Present');  // line ~26
```

Also remove the `attendanceVariant` function entirely:

```
function attendanceVariant(a: string): 'success' | 'warning' | 'error' {
    if (a === 'Present') return 'success';
    if (a === 'Late') return 'warning';
    return 'error';
}
```

- [ ] **Step 2: Remove attendance from `fetchReports`**

In `fetchReports()`, remove this line:

```
if (attendanceFilter) params.set('attendance', attendanceFilter);
```

- [ ] **Step 3: Remove attendance from `openCreate` and `openEdit`**

In `openCreate()`, remove:
```
attendance = 'Present';
```

In `openEdit(report)`, remove:
```
attendance = report.attendance ?? 'Present';
```

- [ ] **Step 4: Remove attendance from `saveReport` payload**

In `saveReport()`, remove `attendance,` from the payload object. The payload becomes:

```typescript
const payload = {
    student_id: data.studentId,
    scores: scores.filter((s) => s.topic).map((s) => ({ topic: s.topic, score: Number(s.score), max_score: Number(s.max) })),
    notes,
    understanding_level: understandingLevel || undefined,
};
```

- [ ] **Step 5: Remove `attendanceFilter` from `$effect` reactive tracking**

Change:
```svelte
$effect(() => {
    attendanceFilter; fromDate; toDate;
    fetchReports();
});
```

To:
```svelte
$effect(() => {
    fromDate; toDate;
    fetchReports();
});
```

- [ ] **Step 6: Remove the attendance filter `<select>` from the template**

Find and delete the entire `<select>` block (the dropdown with Present/Late/Absent options). The filters div becomes date-only:

```svelte
<!-- Filters -->
<div class="flex gap-3 items-center flex-wrap mb-6">
    <div class="flex items-center gap-2 text-sm text-text2">
        <span>{$t('reports.from')}</span>
        <input type="date" bind:value={fromDate} aria-label="From date"
            class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary" />
        <span>{$t('reports.to')}</span>
        <input type="date" bind:value={toDate} aria-label="To date"
            class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary" />
    </div>
</div>
```

- [ ] **Step 7: Remove the attendance radio section from the modal**

In the `<Modal>` form, delete the entire attendance block — the `<div>` containing the `<p>` label and the `{#each [...Present/Late/Absent...]}` radio group:

```svelte
<!-- DELETE this entire block -->
<div>
    <p class="text-[13px] font-medium mb-2">{$t('reports.modal.attendance')}</p>
    <div class="flex gap-2" role="radiogroup" aria-label={$t('reports.modal.attendance')}>
        {#each [
            { val: 'Present', label: $t('reports.modal.presentOption'), bg: 'bg-successBg border-successText text-successText' },
            { val: 'Late',    label: $t('reports.modal.lateOption'),    bg: 'bg-warningBg border-warningText text-warningText' },
            { val: 'Absent',  label: $t('reports.modal.absentOption'),  bg: 'bg-errorBg border-errorText text-errorText' },
        ] as opt}
            <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="attendance" value={opt.val} bind:group={attendance} class="sr-only" />
                <span class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
                             {attendance === opt.val ? opt.bg : 'border-border text-text2 hover:bg-bgGray'}">
                    {opt.label}
                </span>
            </label>
        {/each}
    </div>
</div>
```

- [ ] **Step 8: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS` (same warning count as before).

- [ ] **Step 9: Commit**

```bash
git add "src/routes/reports/[studentId]/+page.svelte"
git commit -m "feat: remove attendance from report list page (delta v9)"
```

---

### Task 2: Clean up `students/[id]/+page.svelte`

**Files:**
- Modify: `src/routes/students/[id]/+page.svelte`

The recent reports section in the student profile still shows an attendance badge and has an `attendanceVariant` helper.

- [ ] **Step 1: Remove `attendanceVariant` function**

Delete this function from the `<script>` block:

```typescript
function attendanceVariant(a: string): 'success' | 'warning' | 'error' {
    if (a === 'Present' || a === 'present') return 'success';
    if (a === 'Late' || a === 'late') return 'warning';
    return 'error';
}
```

- [ ] **Step 2: Remove the attendance badge from the recent reports section**

In the recent reports `{#each reports.slice(0, 3) as report}` block, find and delete:

```svelte
<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
```

The report row header becomes:

```svelte
<div class="flex items-center justify-between mb-1">
    <div class="font-medium text-sm">{report.subject_name ?? '—'}</div>
</div>
```

- [ ] **Step 3: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS`.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/students/[id]/+page.svelte"
git commit -m "feat: remove attendance badge from student profile recent reports (delta v9)"
```

---

### Task 3: Clean up `report/share/[token]/+page.svelte`

**Files:**
- Modify: `src/routes/report/share/[token]/+page.svelte`

This page has the attendance badge plus two carryover bugs: `sc.max` (should be `sc.max_score`) and `report.date` (should use `formatDate(report.created_at)`).

- [ ] **Step 1: Add `formatDate` import**

Add to the imports at the top of `<script>`:

```typescript
import { formatDate } from '$lib/utils/date';
```

- [ ] **Step 2: Remove `attendanceVariant` function**

Delete:

```typescript
function attendanceVariant(a: string): 'success' | 'warning' | 'error' {
    if (a === 'Present' || a === 'present') return 'success';
    if (a === 'Late' || a === 'late') return 'warning';
    return 'error';
}
```

- [ ] **Step 3: Remove the attendance badge and fix date**

Find this block in the template:

```svelte
<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
    <div>
        <div class="font-semibold text-base">{report.session_title ?? 'Session'}</div>
        <div class="text-xs text-text2 mt-0.5 tabular">{report.date ?? ''}</div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
        <Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
        {#if report.understanding_level}
```

Replace with:

```svelte
<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
    <div>
        <div class="font-semibold text-base">{report.session_title ?? 'Session'}</div>
        <div class="text-xs text-text2 mt-0.5 tabular">{report.created_at ? formatDate(report.created_at) : ''}</div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
        {#if report.understanding_level}
```

- [ ] **Step 4: Fix `sc.max` → `sc.max_score` in score cards**

Find:

```svelte
<div class="text-xl font-bold tabular">{sc.score} <span class="text-[13px] text-text2 font-normal">/ {sc.max}</span></div>
<div class="mt-1.5 h-1 bg-border rounded-full">
    <div class="h-1 bg-primary rounded-full" style="width: {Math.min(100, (sc.score / sc.max) * 100)}%;"></div>
</div>
```

Replace with:

```svelte
<div class="text-xl font-bold tabular">{sc.score} <span class="text-[13px] text-text2 font-normal">/ {sc.max_score}</span></div>
<div class="mt-1.5 h-1 bg-border rounded-full">
    <div class="h-1 bg-primary rounded-full" style="width: {Math.min(100, (sc.score / sc.max_score) * 100)}%;"></div>
</div>
```

- [ ] **Step 5: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS`.

- [ ] **Step 6: Commit**

```bash
git add "src/routes/report/share/[token]/+page.svelte"
git commit -m "feat: remove attendance badge from share page, fix sc.max_score and date (delta v9)"
```

---

### Task 4: Clean up `dashboard/+page.svelte`

**Files:**
- Modify: `src/routes/dashboard/+page.svelte`

The student dashboard's Latest Report card has a hardcoded "Present" badge in the card header snippet.

- [ ] **Step 1: Remove the hardcoded Present badge**

Find in the Latest Report Card section (around line 277):

```svelte
{#snippet head()}
    <h2 class="font-semibold">{$t('dashboard.student.latestReport')}</h2>
    {#if d.latest_report}
        <Badge variant="success" label={$t('status.present')} />
    {/if}
{/snippet}
```

Replace with:

```svelte
{#snippet head()}
    <h2 class="font-semibold">{$t('dashboard.student.latestReport')}</h2>
{/snippet}
```

- [ ] **Step 2: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/dashboard/+page.svelte
git commit -m "feat: remove hardcoded present badge from dashboard latest report (delta v9)"
```

---

### Task 5: Remove dead i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

Remove all attendance-related keys now that no template references them.

- [ ] **Step 1: Remove keys from `en.json`**

Remove `"attendanceFilter"` from the `reports` object (line ~387):
```
"attendanceFilter": "All attendance",
```

Remove `"attendance"`, `"presentOption"`, `"lateOption"`, `"absentOption"` from `reports.modal` (lines ~412-415):
```
"attendance": "Attendance",
"presentOption": "Present",
"lateOption": "Late",
"absentOption": "Absent",
```

Remove `"present"`, `"late"`, `"absent"` from the `status` object (lines ~194-196):
```
"present": "Present",
"late": "Late",
"absent": "Absent",
```

- [ ] **Step 2: Remove the same keys from `id.json`**

Remove `"attendanceFilter": "Semua kehadiran",` from the `reports` object.

Remove from `reports.modal`:
```
"attendance": "Kehadiran",
"presentOption": "Hadir",
"lateOption": "Terlambat",
"absentOption": "Absen",
```

Remove from `status`:
```
"present": "Hadir",
"late": "Terlambat",
"absent": "Absen",
```

- [ ] **Step 3: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS`.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/id.json
git commit -m "chore: remove dead attendance i18n keys (delta v9)"
```
