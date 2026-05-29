# Delta v9 — Attendance Field Removal
**Date:** 2026-05-24
**Handoff:** `handoffs/2026-05-24-fe-handoff-delta-v9.md`
**Scope:** Remove `attendance` from all report-related frontend code following backend model change.

---

## Background

Backend delta v9 removes `attendance` from the Report model entirely. A no-show means no report is created — if a report exists, the student was present by definition. The field is no longer sent, stored, or returned by any report endpoint.

---

## Changes

### 1. `src/routes/reports/[studentId]/+page.svelte`

**State:**
- Remove `let attendance = $state<'Present' | 'Late' | 'Absent'>('Present')`
- Remove `let attendanceFilter = $state('')`

**`fetchReports()`:**
- Remove `if (attendanceFilter) params.set('attendance', attendanceFilter)`

**`openCreate()`:**
- Remove `attendance = 'Present'`

**`openEdit(report)`:**
- Remove `attendance = report.attendance ?? 'Present'`

**`saveReport()` payload:**
- Remove `attendance,` from the payload object

**Helpers:**
- Remove the `attendanceVariant` function entirely

**`$effect`:**
- Remove `attendanceFilter;` from the reactive tracking expression
- Result: `$effect(() => { fromDate; toDate; fetchReports(); })`

**Template — filter bar:**
- Remove the entire attendance `<select>` block (the `bind:value={attendanceFilter}` dropdown with Present/Late/Absent options)

**Template — create/edit modal:**
- Remove the entire attendance radio group section (the `{#each [...Present/Late/Absent...]}` block and its `<p>` label)

---

### 2. `src/routes/students/[id]/+page.svelte`

- Remove `attendanceVariant` function
- Remove `<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />` from the recent reports section

---

### 3. `src/routes/report/share/[token]/+page.svelte`

- Remove `attendanceVariant` function
- Remove `<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />` from the report card
- Fix `sc.max` → `sc.max_score` in score value display (`/ {sc.max}` → `/ {sc.max_score}`)
- Fix `sc.max` → `sc.max_score` in progress bar width calculation
- Fix `report.date ?? ''` → `report.created_at ? formatDate(report.created_at) : ''` (import `formatDate` from `$lib/utils/date`)

---

### 4. `src/routes/dashboard/+page.svelte`

- Remove `<Badge variant="success" label={$t('status.present')} />` from the Latest Report card header snippet

---

### 5. `src/locales/en.json` and `src/locales/id.json`

Remove these keys (all become unused after changes above):

| Key | EN value | ID value |
|-----|----------|----------|
| `reports.attendanceFilter` | "All attendance" | "Semua kehadiran" |
| `reports.modal.attendance` | "Attendance" | "Kehadiran" |
| `reports.modal.presentOption` | "Present" | "Hadir" |
| `reports.modal.lateOption` | "Late" | "Terlambat" |
| `reports.modal.absentOption` | "Absent" | "Absen" |
| `status.present` | "Present" | "Hadir" |
| `status.late` | "Late" | "Terlambat" |
| `status.absent` | "Absent" | "Absen" |

---

## Files touched
- `src/routes/reports/[studentId]/+page.svelte`
- `src/routes/students/[id]/+page.svelte`
- `src/routes/report/share/[token]/+page.svelte`
- `src/routes/dashboard/+page.svelte`
- `src/locales/en.json`
- `src/locales/id.json`
