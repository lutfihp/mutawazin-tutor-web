<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { formatDate } from '$lib/utils/date';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let { data } = $props();
	const isTeacher = $derived(data.user?.role === 'teacher');
	const isOwnStudent = $derived(data.user?.role === 'student');

	let reports = $state<any[]>([]);
	let loading = $state(true);
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 20;

	// Filters
	let fromDate = $state('');
	let toDate = $state('');

	// Modal
	let modalOpen = $state(false);
	let editingReport = $state<any | null>(null);
	let scores = $state([{ topic: '', score: '', max: '10' }]);
	let notes = $state('');
	let understandingLevel = $state<'A' | 'B' | 'C' | 'D' | 'E' | ''>('');
	let saveLoading = $state(false);

	// View modal (read-only)
	let viewOpen = $state(false);
	let viewingReport = $state<any | null>(null);

	function openView(report: any) {
		viewingReport = report;
		viewOpen = true;
	}
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

	async function fetchReports() {
		loading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			const body = await api.get<PaginatedResponse<any>>(`/students/${data.studentId}/reports?${params}`);
			reports = body.data;
			totalPages = body.pagination.totalPages;
		} catch {
			reports = [];
			totalPages = 1;
		} finally {
			loading = false;
		}
	}

	function openEdit(report: any) {
		editingReport = report;
		scores = report.scores?.map((s: any) => ({ topic: s.topic, score: String(s.score), max: String(s.max_score) })) ?? [{ topic: '', score: '', max: '10' }];
		notes = report.notes ?? '';
		understandingLevel = report.understanding_level ?? '';
		modalOpen = true;
	}

	async function saveReport(e: SubmitEvent) {
		e.preventDefault();
		saveLoading = true;
		try {
			const payload = {
				student_id: data.studentId,
				scores: scores.filter((s) => s.topic).map((s) => ({ topic: s.topic, score: Number(s.score), max_score: Number(s.max) })),
				notes,
				understanding_level: understandingLevel || undefined,
			};
			await api.put(`/reports/${editingReport.id}`, payload);
			modalOpen = false;
			await fetchReports();
		} finally {
			saveLoading = false;
		}
	}

	function addScore() {
		scores = [...scores, { topic: '', score: '', max: '10' }];
	}

	function removeScore(i: number) {
		if (scores.length > 1) scores = scores.filter((_, idx) => idx !== i);
	}

	$effect(() => {
		data.studentId; fromDate; toDate;
		page = 1;
		fetchReports();
	});
</script>

<svelte:head>
	<title>{isOwnStudent ? $t('reports.titleStudent') : $t('reports.titleTeacher', { values: { name: '' } })} — Mutawazin</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
		<div>
			<h1 class="text-2xl font-bold">
				{isOwnStudent ? $t('reports.titleStudent') : $t('reports.titleTeacher', { values: { name: 'Student' } })}
			</h1>
		</div>
</div>

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

	<!-- Report cards -->
	{#if loading}
		<div class="flex items-center justify-center py-20" role="status" aria-label={$t('common.loading')}>
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if reports.length === 0}
		<div class="text-center py-16 bg-white border border-border rounded-DEFAULT">
			<p class="text-text2">{$t('reports.noReports')}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each reports as report}
				<div
					class="bg-white border border-border rounded-DEFAULT shadow-sm p-5 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all"
					role="button"
					tabindex="0"
					onclick={() => openView(report)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openView(report); } }}
				>
					<!-- Head -->
					<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
						<div>
							<div class="font-semibold text-base">{[report.subject_name, report.teacher_name].filter(Boolean).join(' — ') || 'Session'}</div>
							<div class="text-xs text-text2 mt-0.5 tabular">
								{report.created_at ? formatDate(report.created_at) : ''}
							</div>
						</div>
						{#if report.understanding_level}
							{@const ulVariant = report.understanding_level === 'A' ? 'success' : report.understanding_level === 'B' ? 'active' : report.understanding_level === 'C' ? 'warning' : 'error'}
							<Badge variant={ulVariant} label={`${report.understanding_level} — ${$t(`reports.understanding_${report.understanding_level}`)}`} />
						{/if}
					</div>

					<!-- Score grid -->
					{#if report.scores?.length}
						<div class="grid sm:grid-cols-3 gap-2 mb-4">
							{#each report.scores as sc}
								<div class="bg-bgGray rounded-sm px-3.5 py-3">
									<div class="text-[11px] uppercase font-medium text-text2 tracking-wide mb-1">{sc.topic}</div>
									<div class="text-xl font-bold tabular">{sc.score}</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Notes -->
					{#if report.notes}
						<blockquote class="text-sm text-text2 italic border-l-[3px] border-primary-light pl-3 mb-4 line-clamp-2 whitespace-pre-line">
							{report.notes}
						</blockquote>
					{/if}

					<!-- Footer -->
					<div class="flex items-center gap-3 pt-3 border-t border-border">
						<button onclick={(e) => { e.stopPropagation(); openView(report); }} class="text-sm font-medium text-primary hover:text-primary-dark">
							{$t('reports.viewReport')}
						</button>
						{#if isTeacher}
							<button onclick={(e) => { e.stopPropagation(); openEdit(report); }} class="text-sm font-medium text-text2 hover:text-text">
								{$t('reports.editReport')}
							</button>
							<button onclick={(e) => { e.stopPropagation(); handleShare(report.id); }}
								class="text-sm font-medium text-text2 hover:text-text"
								disabled={shareLoading === report.id}>
								{shareLoading === report.id ? '…' : $t('reports.share')}
							</button>
						{/if}
					</div>
					{#if shareData[report.id]}
						<div class="mt-2 p-3 bg-bgGray border border-border rounded-sm text-sm flex flex-col gap-2">
							<p class="text-xs font-medium text-text2">{$t('reports.shareLinkTitle')}</p>
							<div class="flex items-center gap-2">
								<input type="text" readonly value={shareData[report.id].url}
									onclick={(e) => e.stopPropagation()}
									class="flex-1 bg-white border border-border rounded-sm px-2.5 py-1.5 text-xs text-text focus:outline-none" />
								<button onclick={(e) => { e.stopPropagation(); copyShareLink(report.id); }}
									class="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-sm hover:bg-primary-dark transition-colors">
									{copiedId === report.id ? $t('reports.shareCopied') : $t('reports.shareCopy')}
								</button>
							</div>
							<p class="text-xs text-text2">{$t('reports.shareExpires', { values: { date: new Date(shareData[report.id].expires_at).toLocaleDateString() } })}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchReports(); }} />
</div>

<!-- Create/Edit report modal -->
<Modal
	open={modalOpen}
	title={editingReport ? $t('reports.modal.editTitle') : $t('reports.modal.createTitle')}
	onclose={() => (modalOpen = false)}
	maxWidth="lg"
>
	<form onsubmit={saveReport} class="flex flex-col gap-4">
		<!-- Scores -->
		<div>
			<p class="text-[13px] font-medium mb-2">{$t('reports.modal.scoresSection')}</p>
			<div class="grid grid-cols-[1fr_80px_80px_32px] gap-2 mb-2 text-[11px] uppercase font-medium text-text2 px-1">
				<span>{$t('reports.modal.topic')}</span>
				<span>{$t('reports.modal.score')}</span>
				<span>{$t('reports.modal.max')}</span>
				<span></span>
			</div>
			{#each scores as sc, i}
				<div class="grid grid-cols-[1fr_80px_80px_32px] gap-2 mb-2">
					<input type="text" bind:value={sc.topic} placeholder={$t('reports.modal.topic')} aria-label="{$t('reports.modal.topic')} {i + 1}"
						class="bg-white border border-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
					<input type="number" bind:value={sc.score} min="0" aria-label="{$t('reports.modal.score')} {i + 1}"
						class="bg-white border border-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 tabular" />
					<input type="number" bind:value={sc.max} min="1" aria-label="{$t('reports.modal.max')} {i + 1}"
						class="bg-white border border-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 tabular" />
					<button type="button" onclick={() => removeScore(i)} disabled={scores.length === 1}
						class="w-8 h-[38px] flex items-center justify-center text-text2 hover:text-error disabled:opacity-40 disabled:cursor-not-allowed"
						aria-label={$t('common.removeRow')}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</button>
				</div>
			{/each}
			<button type="button" onclick={addScore} class="text-sm font-semibold text-primary hover:text-primary-dark">
				{$t('reports.modal.addTopic')}
			</button>
		</div>

		<!-- Notes -->
		<div class="flex flex-col gap-1.5">
			<label for="reportNotes" class="text-[13px] font-medium">{$t('reports.modal.notesLabel')}</label>
			<textarea id="reportNotes" bind:value={notes} rows={4} placeholder={$t('reports.modal.notesPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>

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
						<span class="px-2.5 py-1 text-xs font-medium rounded-sm border transition-colors
						             {understandingLevel === val ? activeClass : 'border-border text-text2 hover:bg-bgGray'}">
							{val} — {label}
						</span>
					</label>
				{/each}
				{#if understandingLevel}
					<button type="button" onclick={() => (understandingLevel = '')}
						class="px-2 py-1 text-xs text-text2 hover:text-error">✕ clear</button>
				{/if}
			</div>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (modalOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={saveLoading} onclick={(e: MouseEvent) => { const f = document.querySelector('form'); f?.requestSubmit(); }}>
			{editingReport ? $t('common.save') : $t('reports.modal.createTitle')}
		</Button>
	{/snippet}
</Modal>

<!-- Read-only view modal -->
<Modal
	open={viewOpen}
	title={$t('reports.viewTitle')}
	onclose={() => (viewOpen = false)}
	maxWidth="lg"
>
	{#if viewingReport}
		<div class="flex flex-col gap-5">
			<div class="flex items-start justify-between flex-wrap gap-2">
				<div>
					<div class="font-semibold text-base">{[viewingReport.subject_name, viewingReport.teacher_name].filter(Boolean).join(' — ') || 'Session'}</div>
					<div class="text-xs text-text2 mt-0.5 tabular">
						{viewingReport.created_at ? formatDate(viewingReport.created_at) : ''}
					</div>
				</div>
				{#if viewingReport.understanding_level}
					{@const ulVariant = viewingReport.understanding_level === 'A' ? 'success' : viewingReport.understanding_level === 'B' ? 'active' : viewingReport.understanding_level === 'C' ? 'warning' : 'error'}
					<Badge variant={ulVariant} label={`${viewingReport.understanding_level} — ${$t(`reports.understanding_${viewingReport.understanding_level}`)}`} />
				{/if}
			</div>

			{#if viewingReport.scores?.length}
				<div>
					<p class="text-[11px] uppercase font-medium text-text2 tracking-wide mb-2">{$t('reports.modal.scoresSection')}</p>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{#each viewingReport.scores as sc}
							<div class="bg-bgGray rounded-sm px-3.5 py-3">
								<div class="text-[11px] uppercase font-medium text-text2 tracking-wide mb-1">{sc.topic}</div>
								<div class="text-xl font-bold tabular">{sc.score}<span class="text-sm font-normal text-text2"> / {sc.max_score}</span></div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if viewingReport.notes}
				<div>
					<p class="text-[11px] uppercase font-medium text-text2 tracking-wide mb-2">{$t('reports.modal.notesLabel')}</p>
					<blockquote class="text-sm text-text2 italic border-l-[3px] border-primary-light pl-3 whitespace-pre-line">
						{viewingReport.notes}
					</blockquote>
				</div>
			{/if}
		</div>
	{/if}
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (viewOpen = false)}>{$t('common.close')}</Button>
		{#if isTeacher && viewingReport}
			<Button variant="primary" size="sm" onclick={() => { viewOpen = false; openEdit(viewingReport); }}>
				{$t('reports.editReport')}
			</Button>
		{/if}
	{/snippet}
</Modal>
