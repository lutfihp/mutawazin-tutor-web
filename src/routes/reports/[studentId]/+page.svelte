<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
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

	// Filters
	let attendanceFilter = $state('');
	let fromDate = $state('');
	let toDate = $state('');

	// Modal
	let modalOpen = $state(false);
	let editingReport = $state<any | null>(null);
	let attendance = $state<'Present' | 'Late' | 'Absent'>('Present');
	let scores = $state([{ topic: '', score: '', max: '10' }]);
	let notes = $state('');
	let saveLoading = $state(false);

	async function fetchReports() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (attendanceFilter) params.set('attendance', attendanceFilter);
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			const result = await api.get<any[]>(`/students/${data.studentId}/reports?${params}`);
			reports = Array.isArray(result) ? result : [];
		} catch {
			reports = [];
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editingReport = null;
		attendance = 'Present';
		scores = [{ topic: '', score: '', max: '10' }];
		notes = '';
		modalOpen = true;
	}

	function openEdit(report: any) {
		editingReport = report;
		attendance = report.attendance ?? 'Present';
		scores = report.scores?.map((s: any) => ({ topic: s.topic, score: String(s.score), max: String(s.max) })) ?? [{ topic: '', score: '', max: '10' }];
		notes = report.notes ?? '';
		modalOpen = true;
	}

	async function saveReport(e: SubmitEvent) {
		e.preventDefault();
		saveLoading = true;
		try {
			const payload = {
				student_id: data.studentId,
				attendance,
				scores: scores.filter((s) => s.topic).map((s) => ({ topic: s.topic, score: Number(s.score), max: Number(s.max) })),
				notes,
			};
			if (editingReport) {
				await api.put(`/reports/${editingReport.id}`, payload);
			} else {
				await api.post(`/sessions/${null}/reports`, payload);
			}
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

	function attendanceVariant(a: string): 'success' | 'warning' | 'error' {
		if (a === 'Present') return 'success';
		if (a === 'Late') return 'warning';
		return 'error';
	}

	function avgScore(rpt: any): string {
		if (!rpt.scores?.length) return '';
		const total = rpt.scores.reduce((s: number, sc: any) => s + sc.score, 0);
		const maxTotal = rpt.scores.reduce((s: number, sc: any) => s + sc.max, 0);
		return `${total} / ${maxTotal}`;
	}

	onMount(fetchReports);

	$effect(() => {
		attendanceFilter; fromDate; toDate;
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
		{#if isTeacher}
			<Button variant="primary" onclick={openCreate}>{$t('reports.createReport')}</Button>
		{/if}
	</div>

	<!-- Filters -->
	<div class="flex gap-3 items-center flex-wrap mb-6">
		<select
			bind:value={attendanceFilter}
			aria-label={$t('reports.attendanceFilter')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
			<option value="">{$t('reports.attendanceFilter')}</option>
			<option value="Present">{$t('status.present')}</option>
			<option value="Late">{$t('status.late')}</option>
			<option value="Absent">{$t('status.absent')}</option>
		</select>
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
				<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-5">
					<!-- Head -->
					<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
						<div>
							<div class="font-semibold text-base">{report.session_title ?? 'Session'}</div>
							<div class="text-xs text-text2 mt-0.5 tabular">
								{report.date ?? ''} · {$t('reports.averageScore', { values: { score: avgScore(report).split('/')[0]?.trim(), max: avgScore(report).split('/')[1]?.trim() } })}
							</div>
						</div>
						<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
					</div>

					<!-- Score grid -->
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

					<!-- Notes -->
					{#if report.notes}
						<blockquote class="text-sm text-text2 italic border-l-[3px] border-primary-light pl-3 mb-4 line-clamp-2">
							{report.notes}
						</blockquote>
					{/if}

					<!-- Footer -->
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
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create/Edit report modal -->
<Modal
	open={modalOpen}
	title={editingReport ? $t('reports.modal.editTitle') : $t('reports.modal.createTitle')}
	onclose={() => (modalOpen = false)}
	maxWidth="lg"
>
	<form onsubmit={saveReport} class="flex flex-col gap-4">
		<!-- Attendance -->
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
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (modalOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={saveLoading} onclick={(e: MouseEvent) => { const f = document.querySelector('form'); f?.requestSubmit(); }}>
			{editingReport ? $t('common.save') : $t('reports.modal.createTitle')}
		</Button>
	{/snippet}
</Modal>
