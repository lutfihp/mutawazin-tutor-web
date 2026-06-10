<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import { formatDate } from '$lib/utils/date';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	let { data } = $props();

	type Step = 'sessions' | 'students' | 'form';
	let step = $state<Step>('sessions');

	let sessions = $state<any[]>([]);
	let studentMap = $state<Record<string, string>>({});
	let loading = $state(true);

	let selectedSession = $state<any | null>(null);
	let sessionStudents = $state<{ id: string; name: string }[]>([]);
	let studentsLoading = $state(false);

	let selectedStudent = $state<{ id: string; name: string } | null>(null);
	let scores = $state([{ topic: '', score: '', max: '10' }]);
	let notes = $state('');
	let understandingLevel = $state<'A' | 'B' | 'C' | 'D' | 'E' | ''>('');
	let saveLoading = $state(false);
	let savedOk = $state(false);
	let saveError = $state('');

	onMount(async () => {
		const now = new Date();
		const to = now.toISOString().split('T')[0];
		const from30 = new Date(now);
		from30.setDate(from30.getDate() - 30);
		const from = from30.toISOString().split('T')[0];

		const [sessionsResult, studentsResult] = await Promise.allSettled([
			api.get<any[]>(`/calendar/me?from=${from}&to=${to}`),
			api.get<PaginatedResponse<any>>('/students'),
		]);

		if (sessionsResult.status === 'fulfilled') {
			const all = Array.isArray(sessionsResult.value) ? sessionsResult.value : [];
			const nowMs = Date.now();
			sessions = all
				.filter((s: any) => new Date(s.starts_at).getTime() <= nowMs)
				.filter((s: any) => {
					const total = s.student_ids?.length ?? 0;
					const reported = s.reported_student_ids?.length ?? 0;
					return total === 0 || reported < total;
				})
				.sort((a: any, b: any) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
		}

		if (studentsResult.status === 'fulfilled') {
			const map: Record<string, string> = {};
			for (const s of (studentsResult.value.data ?? [])) {
				map[s.user_id ?? s.id] = s.full_name ?? (s.user_id ?? s.id).slice(0, 8);
			}
			studentMap = map;
		}

		loading = false;
	});

	async function selectSession(session: any) {
		selectedSession = session;
		step = 'students';
		studentsLoading = true;
		sessionStudents = [];

		try {
			const ids: string[] = session.student_ids ?? [];
			const reported = new Set<string>(session.reported_student_ids ?? []);
			sessionStudents = ids
				.filter((id: string) => !reported.has(id))
				.map((id: string) => ({
					id,
					name: studentMap[id] ?? id.slice(0, 8),
				}));
		} catch {
			sessionStudents = [];
		} finally {
			studentsLoading = false;
		}
	}

	function selectStudent(student: { id: string; name: string }) {
		selectedStudent = student;
		scores = [{ topic: '', score: '', max: '10' }];
		notes = '';
		understandingLevel = '';
		savedOk = false;
		saveError = '';
		step = 'form';
	}

	function addScore() {
		scores = [...scores, { topic: '', score: '', max: '10' }];
	}

	function removeScore(i: number) {
		if (scores.length > 1) scores = scores.filter((_, idx) => idx !== i);
	}

	async function saveReport(e: SubmitEvent) {
		e.preventDefault();
		saveLoading = true;
		saveError = '';
		try {
			await api.post(`/sessions/${selectedSession!.id}/reports`, {
				student_id: selectedStudent!.id,
				scores: scores
					.filter((s) => s.topic.trim())
					.map((s) => ({ topic: s.topic, score: Number(s.score), max_score: Number(s.max) })),
				notes,
				understanding_level: understandingLevel || undefined,
			});

			const reportedId = selectedStudent!.id;

			// Update sessions array so re-selecting the same session excludes this student
			sessions = sessions
				.map(s =>
					s.id === selectedSession!.id
						? { ...s, reported_student_ids: [...(s.reported_student_ids ?? []), reportedId] }
						: s
				)
				.filter(s => {
					const total = s.student_ids?.length ?? 0;
					const reported = s.reported_student_ids?.length ?? 0;
					return total === 0 || reported < total;
				});

			// Update sessionStudents so the back-arrow path (form → students) also excludes this student
			sessionStudents = sessionStudents.filter(s => s.id !== reportedId);

			savedOk = true;
		} catch {
			saveError = 'Failed to save report. Please try again.';
		} finally {
			saveLoading = false;
		}
	}

	function reset() {
		step = 'sessions';
		selectedSession = null;
		selectedStudent = null;
		sessionStudents = [];
		savedOk = false;
		saveError = '';
	}
</script>

<svelte:head>
	<title>{$t('reports.new.title')} — Mutawazin</title>
</svelte:head>

<div class="max-w-lg mx-auto flex flex-col gap-4">
	<!-- Page title + back arrow -->
	<div class="flex items-center gap-3">
		{#if step !== 'sessions'}
			<button
				onclick={() => { step = step === 'form' ? 'students' : 'sessions'; }}
				class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bgGray text-text2 hover:text-text transition-colors"
				aria-label="Back"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<polyline points="15 18 9 12 15 6"/>
				</svg>
			</button>
		{/if}
		<h1 class="text-2xl font-bold">
			{#if step === 'sessions'}
				{$t('reports.new.title')}
			{:else if step === 'students'}
				{selectedSession?.display_title ?? ''}
			{:else}
				{$t('reports.new.reportFor', { values: { name: selectedStudent?.name ?? '' } })}
			{/if}
		</h1>
	</div>

	<!-- Step 1: Session list -->
	{#if step === 'sessions'}
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold text-sm text-text2">{$t('reports.new.selectSession')}</h2>
			{/snippet}
			{#if loading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if sessions.length === 0}
				<p class="px-5 py-8 text-sm text-text2 text-center">{$t('reports.new.noCompletedSessions')}</p>
			{:else}
				<div class="divide-y divide-border">
					{#each sessions as session}
						<button
							onclick={() => selectSession(session)}
							class="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-bgGray transition-colors group"
						>
							<div class="w-9 h-9 rounded-DEFAULT flex items-center justify-center flex-none
								{session.type === 'group' ? 'bg-primary-light text-primary' : 'bg-teal-light text-teal'}">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									{#if session.type === 'group'}
										<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
									{:else}
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
									{/if}
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm truncate">{session.display_title}</div>
								<div class="text-xs text-text2 tabular">{formatDate(session.starts_at)}</div>
							</div>
							<Badge variant={session.type === 'group' ? 'active' : 'teal'} label={session.type} />
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-text2 group-hover:text-text flex-none" aria-hidden="true">
								<polyline points="9 18 15 12 9 6"/>
							</svg>
						</button>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}

	<!-- Step 2: Student picker -->
	{#if step === 'students'}
		<Card padding="none">
			{#snippet head()}
				<div>
					<h2 class="font-semibold text-sm text-text2">{$t('reports.new.selectStudent')}</h2>
					<p class="text-xs text-text2 mt-0.5">{formatDate(selectedSession?.starts_at ?? '')}</p>
				</div>
			{/snippet}
			{#if studentsLoading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if sessionStudents.length === 0}
				<p class="px-5 py-8 text-sm text-text2 text-center">{$t('reports.new.noStudents')}</p>
			{:else}
				<div class="divide-y divide-border">
					{#each sessionStudents as student}
						<button
							onclick={() => selectStudent(student)}
							class="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-bgGray transition-colors group"
						>
							<Avatar name={student.name} id={student.id} size="md" />
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm">{student.name}</div>
							</div>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-text2 group-hover:text-text flex-none" aria-hidden="true">
								<polyline points="9 18 15 12 9 6"/>
							</svg>
						</button>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}

	<!-- Step 3: Report form -->
	{#if step === 'form'}
		{#if savedOk}
			<div class="bg-successBg border border-successText/20 rounded-DEFAULT px-5 py-4 flex flex-col gap-3">
				<p class="text-sm font-medium text-successText">{$t('reports.new.saved')}</p>
				<Button variant="secondary" size="sm" onclick={reset}>{$t('reports.new.writeAnother')}</Button>
			</div>
		{:else}
			<Card padding="default">
				<form onsubmit={saveReport} class="flex flex-col gap-5">
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

					<!-- Understanding level -->
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

					{#if saveError}
						<p class="text-sm text-error">{saveError}</p>
					{/if}

					<div class="flex justify-end pt-2">
						<Button variant="primary" loading={saveLoading} onclick={(e: MouseEvent) => { const f = (e.target as HTMLElement).closest('form'); f?.requestSubmit(); }}>
							{$t('reports.modal.createTitle')}
						</Button>
					</div>
				</form>
			</Card>
		{/if}
	{/if}
</div>
