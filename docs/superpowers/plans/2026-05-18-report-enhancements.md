# Report Enhancements — Understanding Level + Share Link + Public Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `understanding_level` (A–E) to report create/edit/view, add a Share button for teachers, and create a public `/report/share/:token` page.

**Architecture:** All report changes are in one existing file. The public share page is a new standalone route (no Navbar/Sidebar) that uses `+page.server.ts` to fetch the shared report. No new components — reuses Badge, Button, and the existing score grid pattern.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, `api` client

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/locales/en.json` — new report keys |
| Modify | `src/locales/id.json` — same in Indonesian |
| Modify | `src/routes/reports/[studentId]/+page.svelte` — understanding_level + share button |
| Create | `src/routes/report/share/[token]/+page.server.ts` |
| Create | `src/routes/report/share/[token]/+page.svelte` |

---

### Task 1: Add locale keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add to `en.json` inside `reports` object (after `"viewFull"`)**

```json
    "understandingLevel": "Understanding Level",
    "understanding_A": "Excellent understanding",
    "understanding_B": "Good understanding",
    "understanding_C": "Adequate understanding",
    "understanding_D": "Needs improvement",
    "understanding_E": "Significant difficulty",
    "share": "Share",
    "shareLinkTitle": "Share Report",
    "shareCopy": "Copy link",
    "shareCopied": "Copied!",
    "shareExpires": "Expires {date}",
    "shareExpiredTitle": "Link expired",
    "shareExpiredBody": "This report link is no longer valid.",
    "shareInvalidBody": "Report not found.",
```

- [ ] **Step 2: Add to `id.json` inside `reports`**

```json
    "understandingLevel": "Tingkat Pemahaman",
    "understanding_A": "Pemahaman sangat baik",
    "understanding_B": "Pemahaman baik",
    "understanding_C": "Pemahaman cukup",
    "understanding_D": "Perlu peningkatan",
    "understanding_E": "Kesulitan signifikan",
    "share": "Bagikan",
    "shareLinkTitle": "Bagikan Laporan",
    "shareCopy": "Salin tautan",
    "shareCopied": "Disalin!",
    "shareExpires": "Kedaluwarsa {date}",
    "shareExpiredTitle": "Tautan kedaluwarsa",
    "shareExpiredBody": "Tautan laporan ini sudah tidak berlaku.",
    "shareInvalidBody": "Laporan tidak ditemukan.",
```

---

### Task 2: Add `understanding_level` to report create/edit modal

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

The report modal currently has: attendance radio-pills → scores section → notes textarea.

- [ ] **Step 1: Add `understanding_level` state variables**

In the script block, after `let notes = $state('');`, add:
```svelte
	let understandingLevel = $state<'A' | 'B' | 'C' | 'D' | 'E' | ''>('');
```

Update `openEdit` to populate it:
```svelte
	function openEdit(report: any) {
		editingReport = report;
		attendance = report.attendance ?? 'Present';
		scores = report.scores?.map((s: any) => ({ topic: s.topic, score: String(s.score), max: String(s.max) })) ?? [{ topic: '', score: '', max: '10' }];
		notes = report.notes ?? '';
		understandingLevel = report.understanding_level ?? '';
		modalOpen = true;
	}
```

Update `openCreate`:
```svelte
	function openCreate() {
		editingReport = null;
		attendance = 'Present';
		scores = [{ topic: '', score: '', max: '10' }];
		notes = '';
		understandingLevel = '';
		modalOpen = true;
	}
```

- [ ] **Step 2: Add `understanding_level` to submit body**

In `saveReport`, update both POST and PUT payloads:
```svelte
			const payload = {
				student_id: data.studentId,
				attendance,
				scores: scores.filter((s) => s.topic).map((s) => ({ topic: s.topic, score: Number(s.score), max: Number(s.max) })),
				notes,
				understanding_level: understandingLevel || undefined,
			};
```

- [ ] **Step 3: Add understanding level radio group to modal**

In the modal form, after the notes textarea div and before the form closing tag, add:
```svelte
		<!-- Understanding level (optional) -->
		<div>
			<p class="text-[13px] font-medium mb-2">{$t('reports.understandingLevel')}</p>
			<div class="flex gap-2 flex-wrap" role="radiogroup" aria-label={$t('reports.understandingLevel')}>
				{#each [
					['A', $t('reports.understanding_A'), 'bg-successBg text-successText border-successText'],
					['B', $t('reports.understanding_B'), 'bg-primary-light text-primary-dark border-primary'],
					['C', $t('reports.understanding_C'), 'bg-warningBg text-warningText border-warningText'],
					['D', $t('reports.understanding_D'), 'bg-errorBg text-errorText border-errorText'],
					['E', $t('reports.understanding_E'), 'bg-errorBg text-errorText border-errorText'],
				] as [val, label, activeClass]}
					<label class="flex items-center gap-1.5 cursor-pointer">
						<input type="radio" name="understanding" value={val} bind:group={understandingLevel} class="sr-only" />
						<span class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
						             {understandingLevel === val ? activeClass : 'border-border text-text2 hover:bg-bgGray'}">
							{val} — {label}
						</span>
					</label>
				{/each}
				{#if understandingLevel}
					<button type="button" onclick={() => (understandingLevel = '')}
						class="px-2 py-1.5 text-xs text-text2 hover:text-error">✕ clear</button>
				{/if}
			</div>
		</div>
```

---

### Task 3: Display understanding level in report cards

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

- [ ] **Step 1: Add understanding_level badge to report card head**

In the report card template, find the head section:
```svelte
					<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
						<div>
							<div class="font-semibold text-base">{report.session_title ?? 'Session'}</div>
							<div class="text-xs text-text2 mt-0.5 tabular">...</div>
						</div>
						<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
					</div>
```

Add after the attendance badge:
```svelte
					{#if report.understanding_level}
						{@const ulVariant = report.understanding_level === 'A' ? 'success' : report.understanding_level === 'B' ? 'active' : report.understanding_level === 'C' ? 'warning' : 'error'}
						{@const ulLabel = `${report.understanding_level} — ${$t(`reports.understanding_${report.understanding_level}`)}`}
						<Badge variant={ulVariant} label={ulLabel} />
					{/if}
```

---

### Task 4: Add Share button to teacher's report card footer

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

- [ ] **Step 1: Add share state variables**

After `let saveLoading = $state(false);`, add:
```svelte
	let shareLoading = $state<string | null>(null);
	let shareData = $state<Record<string, { url: string; expires_at: string }>>({});
	let copiedId = $state<string | null>(null);

	async function handleShare(reportId: string) {
		shareLoading = reportId;
		try {
			const result = await api.post<{ share_url: string; expires_at: string }>(`/reports/${reportId}/share`, {});
			shareData = { ...shareData, [reportId]: { url: result.share_url, expires_at: result.expires_at } };
		} finally {
			shareLoading = null;
		}
	}

	async function copyShareLink(reportId: string) {
		const url = shareData[reportId]?.url;
		if (url) {
			await navigator.clipboard.writeText(url);
			copiedId = reportId;
			setTimeout(() => (copiedId = null), 2000);
		}
	}
```

- [ ] **Step 2: Add Share button to report footer (teacher view)**

In the report card footer, find:
```svelte
					<div class="flex items-center justify-between pt-3 border-t border-border">
						{#if isTeacher}
							<button onclick={() => openEdit(report)} class="text-sm font-medium text-text2 hover:text-text">
								{$t('reports.editReport')}
							</button>
						{:else}
							<span></span>
						{/if}
						<a href="#report-{report.id}" class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
							{$t('reports.viewFull')}
						</a>
					</div>
```

Replace with:
```svelte
					<div class="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
						{#if isTeacher}
							<div class="flex items-center gap-3">
								<button onclick={() => openEdit(report)} class="text-sm font-medium text-text2 hover:text-text">
									{$t('reports.editReport')}
								</button>
								<button onclick={() => handleShare(report.id)}
									class="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1"
									disabled={shareLoading === report.id}>
									{shareLoading === report.id ? '…' : $t('reports.share')}
								</button>
							</div>
						{:else}
							<span></span>
						{/if}
						<a href="#report-{report.id}" class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
							{$t('reports.viewFull')}
						</a>
					</div>
					{#if shareData[report.id]}
						<div class="mt-2 p-3 bg-bgGray border border-border rounded-sm text-sm flex flex-col gap-2">
							<p class="text-xs font-medium text-text2">{$t('reports.shareLinkTitle')}</p>
							<div class="flex items-center gap-2">
								<input type="text" readonly value={shareData[report.id].url}
									class="flex-1 bg-white border border-border rounded-sm px-2.5 py-1.5 text-xs text-text focus:outline-none" />
								<button onclick={() => copyShareLink(report.id)}
									class="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-sm hover:bg-primary-dark transition-colors">
									{copiedId === report.id ? $t('reports.shareCopied') : $t('reports.shareCopy')}
								</button>
							</div>
							<p class="text-xs text-text2">{$t('reports.shareExpires', { values: { date: new Date(shareData[report.id].expires_at).toLocaleDateString() } })}</p>
						</div>
					{/if}
```

---

### Task 5: Create public share page

**Files:**
- Create: `src/routes/report/share/[token]/+page.server.ts`
- Create: `src/routes/report/share/[token]/+page.svelte`

- [ ] **Step 1: Create `+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const res = await fetch(`${BASE}/reports/share/${params.token}`);
		if (res.ok) {
			const report = await res.json();
			return { report, error: null };
		}
		if (res.status === 410) return { report: null, error: 'expired' };
		return { report: null, error: 'invalid' };
	} catch {
		return { report: null, error: 'invalid' };
	}
};
```

- [ ] **Step 2: Create `+page.svelte`**

```svelte
<script lang="ts">
	import { t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();
	const report = $derived(data.report);

	function attendanceVariant(a: string): 'success' | 'warning' | 'error' {
		if (a === 'Present' || a === 'present') return 'success';
		if (a === 'Late' || a === 'late') return 'warning';
		return 'error';
	}

	const ulVariant = $derived(() => {
		if (!report?.understanding_level) return 'gray' as const;
		const map: Record<string, 'success' | 'active' | 'warning' | 'error'> = { A: 'success', B: 'active', C: 'warning', D: 'error', E: 'error' };
		return map[report.understanding_level] ?? ('gray' as const);
	});
</script>

<svelte:head>
	<title>Report — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray py-10 px-6">
	<div class="max-w-[680px] mx-auto">
		<a href="/" class="inline-block mb-8"><Logo /></a>

		{#if data.error === 'expired'}
			<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-8 text-center">
				<div class="w-16 h-16 bg-errorBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
				</div>
				<h1 class="text-xl font-semibold mb-2">{$t('reports.shareExpiredTitle')}</h1>
				<p class="text-sm text-text2">{$t('reports.shareExpiredBody')}</p>
			</div>
		{:else if data.error === 'invalid' || !report}
			<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-8 text-center">
				<h1 class="text-xl font-semibold mb-2">404</h1>
				<p class="text-sm text-text2">{$t('reports.shareInvalidBody')}</p>
			</div>
		{:else}
			<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-5">
				<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
					<div>
						<div class="font-semibold text-base">{report.session_title ?? 'Session'}</div>
						<div class="text-xs text-text2 mt-0.5 tabular">{report.date ?? ''}</div>
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
						{#if report.understanding_level}
							<Badge variant={ulVariant()} label={`${report.understanding_level} — ${$t(`reports.understanding_${report.understanding_level}`)}`} />
						{/if}
					</div>
				</div>

				{#if report.scores?.length}
					<div class="grid sm:grid-cols-3 gap-2 mb-4">
						{#each report.scores as sc}
							<div class="bg-bgGray rounded-sm px-3.5 py-3">
								<div class="text-[11px] uppercase font-medium text-text2 tracking-wide mb-1">{sc.topic}</div>
								<div class="text-xl font-bold tabular">{sc.score} <span class="text-[13px] text-text2 font-normal">/ {sc.max}</span></div>
								<div class="mt-1.5 h-1 bg-border rounded-full">
									<div class="h-1 bg-primary rounded-full" style="width: {Math.min(100, (sc.score / sc.max) * 100)}%;"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if report.notes}
					<blockquote class="text-sm text-text2 italic border-l-[3px] border-primary-light pl-3">
						{report.notes}
					</blockquote>
				{/if}
			</div>
		{/if}
	</div>
</div>
```

- [ ] **Step 3: Verify and commit**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/reports src/routes/report src/locales/en.json src/locales/id.json
git commit -m "feat: report understanding_level + share link + public share page"
```

---

## Self-Review

**Spec coverage:**
- ✅ `understanding_level` in create/edit modal (radio A–E) → Task 2
- ✅ `understanding_level` badge on report card view → Task 3
- ✅ Share button + inline share panel (teacher only) → Task 4
- ✅ `POST /reports/:id/share` → Task 4
- ✅ Public page `/report/share/:token` → Task 5
- ✅ 410 expired / 404 invalid states → Task 5
- ✅ Locale keys EN + ID → Task 1

**Placeholder scan:** None found.

**Type consistency:** `shareData: Record<string, { url, expires_at }>`, `understandingLevel` typed as `'A'|'B'|'C'|'D'|'E'|''` consistently.
