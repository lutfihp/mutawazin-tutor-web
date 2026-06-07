<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import { calendarGrid, toISODate, formatMonth } from '$lib/utils/date';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	// ── Month navigation
	const now = new Date();
	let year = $state(now.getFullYear());
	let month = $state(now.getMonth());

	// ── Data
	let sessions = $state<any[]>([]);
	let teachers = $state<any[]>([]);
	let adminCourses = $state<any[]>([]);
	let adminStudents = $state<any[]>([]);
	let loading = $state(true);
	let filteredTeacherId = $state(''); // '' = all teachers

	const grid = $derived(calendarGrid(year, month));
	const monthLabel = $derived(formatMonth(year, month));
	const today = toISODate(new Date());

	// Teacher name lookup: teacher.user_id ?? teacher.id → full_name
	const teacherMap = $derived(
		Object.fromEntries(teachers.map((t: any) => [(t.user_id ?? t.id) as string, (t.full_name ?? '') as string]))
	);

	function sessionsByDate(date: Date): any[] {
		const key = toISODate(date);
		return sessions.filter((s) => s.starts_at?.startsWith(key));
	}

	function pillClass(type: string, status: string): string {
		if (status === 'Completed' || status === 'completed') return 'bg-bgGray text-text2';
		if (status === 'Cancelled' || status === 'cancelled') return 'bg-bgGray text-text3 line-through';
		if (type === 'group') return 'bg-primary-light text-primary-dark';
		return 'bg-teal-light text-[#115E59]';
	}

	function pillLabel(session: any): string {
		const time = session.starts_at?.slice(11, 16) ?? '';
		const rec = session.recurring_template_id ? '↻ ' : '';
		if (!filteredTeacherId) {
			const firstName = (teacherMap[session.teacher_id] ?? '').split(' ')[0];
			return `${rec}${firstName ? firstName + ' · ' : ''}${time} ${session.display_title}`;
		}
		return `${rec}${time} ${session.display_title}`;
	}

	// ── Data fetching
	async function fetchSessions() {
		loading = true;
		try {
			const firstDay = new Date(Date.UTC(year, month, 1));
			const lastDay = new Date(Date.UTC(year, month + 1, 0));
			const params = new URLSearchParams({
				from: toISODate(firstDay),
				to: toISODate(lastDay),
			});
			if (filteredTeacherId) params.set('teacher_id', filteredTeacherId);
			const d = await api.get<any[]>(`/calendar/admin?${params}`);
			sessions = Array.isArray(d) ? d : [];
		} catch {
			sessions = [];
		} finally {
			loading = false;
		}
	}

	async function fetchRecurringTemplates() {
		if (!filteredTeacherId) { recurringTemplates = []; return; }
		try {
			const body = await api.get<PaginatedResponse<any>>(`/sessions/recurring?teacher_id=${filteredTeacherId}`);
			recurringTemplates = body.data;
		} catch {
			recurringTemplates = [];
		}
	}

	function prevMonth() { if (month === 0) { year--; month = 11; } else { month--; } }
	function nextMonth() { if (month === 11) { year++; month = 0; } else { month++; } }
	function goToday() { year = now.getFullYear(); month = now.getMonth(); }

	// ── Session edit modal (admin — PUT /sessions/:id)
	let selectedSession = $state<any | null>(null);
	let editOpen = $state(false);
	let eDate = $state('');
	let eStartTime = $state('');
	let eEndTime = $state('');
	let eMode = $state<'online' | 'offline'>('online');
	let ePrice = $state('');
	let eTeacherId = $state('');
	let eCourseId = $state('');
	let eLoading = $state(false);
	let eError = $state('');
	let sessionActionLoading = $state(false);
	let sessionActionError = $state('');
	let cancelConfirming = $state(false);
	let deleteConfirming = $state(false);

	function openSession(session: any) {
		selectedSession = session;
		eDate = session.starts_at?.slice(0, 10) ?? '';
		eStartTime = session.starts_at?.slice(11, 16) ?? '';
		eEndTime = session.ends_at?.slice(11, 16) ?? '';
		eMode = (session.mode ?? 'online') as 'online' | 'offline';
		ePrice = session.price != null ? String(session.price) : '';
		eTeacherId = session.teacher_id ?? '';
		eCourseId = session.course_id ?? '';
		eError = '';
		sessionActionError = '';
		cancelConfirming = false;
		deleteConfirming = false;
		editOpen = true;
	}

	async function saveEdit() {
		if (!selectedSession) return;
		eLoading = true;
		eError = '';
		try {
			const starts_at = eDate && eStartTime
				? new Date(`${eDate}T${eStartTime}:00`).toISOString()
				: undefined;
			const ends_at = eDate && eEndTime
				? new Date(`${eDate}T${eEndTime}:00`).toISOString()
				: undefined;
			await api.put(`/sessions/${selectedSession.id}`, {
				starts_at,
				ends_at,
				mode: eMode,
				price: ePrice ? Number(ePrice) : undefined,
				teacher_id: eTeacherId || undefined,
				course_id: eCourseId || undefined,
			});
			editOpen = false;
			await fetchSessions();
		} catch (err: any) {
			eError = err?.message ?? 'Failed to save session.';
		} finally {
			eLoading = false;
		}
	}

	async function cancelSession() {
		if (!selectedSession) return;
		sessionActionLoading = true;
		sessionActionError = '';
		try {
			await api.patch(`/sessions/${selectedSession.id}/status`, { status: 'cancelled' });
			sessions = sessions.map((s) => s.id === selectedSession!.id ? { ...s, status: 'cancelled' } : s);
			editOpen = false;
		} catch (e: any) {
			sessionActionError = e?.message ?? 'Failed to cancel session.';
		} finally {
			sessionActionLoading = false;
			cancelConfirming = false;
		}
	}

	async function deleteSession() {
		if (!selectedSession) return;
		sessionActionLoading = true;
		sessionActionError = '';
		try {
			await api.delete(`/sessions/${selectedSession.id}`);
			sessions = sessions.filter((s) => s.id !== selectedSession!.id);
			editOpen = false;
		} catch (e: any) {
			sessionActionError = e?.message ?? 'Failed to delete session.';
		} finally {
			sessionActionLoading = false;
			deleteConfirming = false;
		}
	}

	async function markCompleted() {
		if (!selectedSession) return;
		sessionActionLoading = true;
		sessionActionError = '';
		try {
			await api.patch(`/sessions/${selectedSession.id}/status`, { status: 'completed' });
			sessions = sessions.map((s) => s.id === selectedSession!.id ? { ...s, status: 'completed' } : s);
			editOpen = false;
		} catch (e: any) {
			sessionActionError = e?.message ?? 'Failed to update session.';
		} finally {
			sessionActionLoading = false;
		}
	}

	// ── Add session modal (POST /sessions with teacher_id required)
	let addOpen = $state(false);
	let sType = $state<'group' | 'private'>('group');
	let sCourseId = $state('');
	let sDate = $state('');
	let sStartTime = $state('');
	let sEndTime = $state('');
	let sMode = $state<'online' | 'offline'>('online');
	let sPrice = $state('');
	let sTeacherId = $state('');
	let sLoading = $state(false);

	// Courses filtered by selected teacher for create modal
	const filteredCourses = $derived(
		sTeacherId
			? adminCourses.filter((c: any) => c.teacher_id === sTeacherId)
			: adminCourses
	);
	let sFormEl = $state<HTMLFormElement | null>(null);

	function openAddSession() {
		sType = 'group'; sCourseId = '';
		sDate = ''; sStartTime = ''; sEndTime = '';
		sMode = 'online'; sPrice = '';
		sTeacherId = filteredTeacherId;
		addOpen = true;
	}

	async function handleAddSession(e: SubmitEvent) {
		e.preventDefault();
		if (!sTeacherId) return;
		sLoading = true;
		try {
			const starts_at = new Date(`${sDate}T${sStartTime}:00`).toISOString();
			const ends_at = new Date(`${sDate}T${sEndTime}:00`).toISOString();
			await api.post('/sessions', {
				type: sType,
				starts_at,
				ends_at,
				mode: sMode,
				teacher_id: sTeacherId,
				course_id: sCourseId,
				price: sPrice ? Number(sPrice) : undefined,
			});
			addOpen = false;
			await fetchSessions();
		} finally {
			sLoading = false;
		}
	}

	// ── Recurring templates (shown only when teacher filter active)
	let recurringTemplates = $state<any[]>([]);
	let recurringOpen = $state(false);
	let editingTemplate = $state<any | null>(null);
	let recurringDeleteLoading = $state<string | null>(null);
	let rType = $state<'group' | 'private'>('group');
	let rCourseId = $state('');
	let rDayOfWeek = $state(0);
	let rStartTime = $state('');
	let rDuration = $state(60);
	let rMode = $state<'online' | 'offline'>('online');
	let rPrice = $state<number | undefined>(undefined);
	let rLoading = $state(false);
	let rFormEl = $state<HTMLFormElement | null>(null);

	function openAddRecurring() {
		editingTemplate = null;
		rType = 'group'; rCourseId = '';
		rDayOfWeek = 0; rStartTime = ''; rDuration = 60;
		rMode = 'online'; rPrice = undefined;
		recurringOpen = true;
	}

	function openEditRecurring(template: any) {
		editingTemplate = template;
		rType = template.type ?? 'group';
		rCourseId = template.course_id ?? '';
		rDayOfWeek = template.day_of_week ?? 0;
		rStartTime = template.start_time ?? '';
		rDuration = template.duration_minutes ?? 60;
		rMode = (template.mode ?? 'online') as 'online' | 'offline';
		rPrice = template.price ?? undefined;
		recurringOpen = true;
	}

	async function handleRecurringSubmit(e: SubmitEvent) {
		e.preventDefault();
		rLoading = true;
		try {
			const body = {
				type: rType,
				course_id: rCourseId,
				day_of_week: rDayOfWeek,
				start_time: rStartTime,
				duration_minutes: rDuration,
				mode: rMode,
				price: rPrice || undefined,
				teacher_id: filteredTeacherId || undefined,
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

	// ── Reactivity: refetch on month/filter change
	$effect(() => { year; month; filteredTeacherId; fetchSessions(); });
	$effect(() => { filteredTeacherId; fetchRecurringTemplates(); });

	onMount(async () => {
		const [teachersBody, coursesBody, studentsBody] = await Promise.all([
			api.get<PaginatedResponse<any>>('/admin/teachers').catch(() => ({ data: [], pagination: { totalPages: 1 } })),
			api.get<PaginatedResponse<any>>('/courses').catch(() => ({ data: [], pagination: { totalPages: 1 } })),
			api.get<PaginatedResponse<any>>('/admin/students').catch(() => ({ data: [], pagination: { totalPages: 1 } })),
		]);
		teachers = teachersBody.data.filter((t: any) => t.status !== 'deleted' && t.status !== 'pending');
		adminCourses = coursesBody.data;
		adminStudents = studentsBody.data;
	});
</script>

<svelte:head>
	<title>{$t('calendar.title')} — Mutawazin</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex items-center justify-between mb-4 flex-wrap gap-3">
		<h1 class="text-2xl font-bold">{$t('calendar.title')}</h1>
		<div class="flex items-center gap-3 flex-wrap">
			<div class="flex items-center gap-2">
				<button
					onclick={prevMonth}
					class="w-8 h-8 flex items-center justify-center rounded-sm border border-border hover:bg-bgGray transition-colors"
					aria-label="Previous month"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
				</button>
				<span class="text-lg font-semibold min-w-[150px] text-center tabular">{monthLabel}</span>
				<button
					onclick={nextMonth}
					class="w-8 h-8 flex items-center justify-center rounded-sm border border-border hover:bg-bgGray transition-colors"
					aria-label="Next month"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
				</button>
			</div>
			<button
				onclick={goToday}
				class="px-3 h-8 border border-border rounded-sm text-sm font-medium text-text2 hover:text-text hover:bg-bgGray transition-colors"
			>
				{$t('common.today')}
			</button>
			{#if filteredTeacherId}
				<Button variant="secondary" size="sm" onclick={openAddRecurring}>{$t('calendar.addRecurring')}</Button>
			{/if}
			<Button variant="primary" size="sm" onclick={openAddSession}>{$t('calendar.addSession')}</Button>
		</div>
	</div>

	<!-- Teacher picker -->
	<div class="mb-4 flex items-center gap-3 flex-wrap">
		<select
			bind:value={filteredTeacherId}
			class="bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 min-w-[220px]"
			aria-label={$t('dashboard.admin.filterByTeacher')}
		>
			<option value="">{$t('courses.allTeachers')}</option>
			{#each teachers as teacher}
				<option value={teacher.user_id ?? teacher.id}>{teacher.full_name}</option>
			{/each}
		</select>
		{#if filteredTeacherId}
			<button
				onclick={() => (filteredTeacherId = '')}
				class="text-sm text-text2 hover:text-text transition-colors"
			>
				✕ Clear filter
			</button>
		{/if}
		{#if loading}
			<span class="text-sm text-text2">{$t('common.loading')}</span>
		{/if}
	</div>

	<div class="grid calendar-panel:grid-cols-[1fr_280px] gap-5">
		<!-- Calendar grid -->
		<div class="bg-white border border-border rounded-DEFAULT overflow-hidden">
			<div class="grid grid-cols-7 bg-bgGray">
				{#each $t('calendar.daysShort') as day}
					<div class="py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-text2">{day}</div>
				{/each}
			</div>
			<div class="grid grid-cols-7">
				{#each grid as cell}
					{@const isToday = cell ? toISODate(cell) === today : false}
					{@const isCurrentMonth = cell?.getUTCMonth() === month}
					{@const daySessions = cell ? sessionsByDate(cell) : []}
					<div class="min-h-[120px] border-r border-b border-border last:border-r-0 p-1.5 {!isCurrentMonth ? 'bg-[#FAFBFC]' : ''}">
						{#if cell}
							<span class="inline-flex items-center justify-center w-6 h-6 text-sm mb-1 rounded-full
							             {isToday ? 'bg-primary text-white font-semibold' : isCurrentMonth ? 'text-text' : 'text-text3'}">
								{cell.getUTCDate()}
							</span>
							<div class="flex flex-col gap-0.5">
								{#each daySessions.slice(0, 2) as session}
									<button
										onclick={() => openSession(session)}
										class="w-full text-left text-[11px] font-medium rounded px-1.5 py-0.5 truncate tabular {pillClass(session.type, session.status)}"
										title="{teacherMap[session.teacher_id] ?? ''}: {session.display_title}"
									>
										{pillLabel(session)}
									</button>
								{/each}
								{#if daySessions.length > 2}
									<button
										onclick={() => openSession(daySessions[2])}
										class="text-[11px] text-primary font-medium text-left px-1.5"
									>
										{$t('common.more', { values: { n: daySessions.length - 2 } })}
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Right panel -->
		<div class="flex flex-col gap-4">
			<!-- Recurring templates -->
			<div class="bg-white border border-border rounded-DEFAULT p-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="font-semibold">{$t('calendar.recurringTitle')}</h2>
					{#if filteredTeacherId}
						<Button variant="secondary" size="sm" onclick={openAddRecurring}>{$t('calendar.addRecurring')}</Button>
					{/if}
				</div>
				{#if !filteredTeacherId}
					<p class="text-sm text-text2">Select a teacher to view their recurring sessions.</p>
				{:else}
					{#if recurringTemplates.length === 0}
						<p class="text-sm text-text2">{$t('calendar.noRecurring')}</p>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#each recurringTemplates as tmpl}
								<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
									<div>
										<span class="font-medium tabular">
											{($t('calendar.modal.days') as unknown as string[])[tmpl.day_of_week] ?? tmpl.day_of_week}
											· {tmpl.start_time}
										</span>
										<span class="text-text2 ml-1.5">— {tmpl.display_title}</span>
									</div>
									<div class="flex gap-1">
										<button onclick={() => openEditRecurring(tmpl)} class="text-text2 hover:text-text p-1" aria-label="Edit recurring session">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
										</button>
										<button onclick={() => deleteRecurringTemplate(tmpl.id)} class="text-text2 hover:text-error p-1" disabled={recurringDeleteLoading === tmpl.id} aria-label="Delete recurring session">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Legend -->
			<div class="bg-white border border-border rounded-DEFAULT p-4">
				<h3 class="font-semibold text-sm mb-3">{$t('calendar.legend')}</h3>
				<div class="flex flex-col gap-2">
					{#each [
						{ label: $t('calendar.legendGroup'),     color: 'bg-primary-light' },
						{ label: $t('calendar.legendPrivate'),   color: 'bg-teal-light' },
						{ label: $t('calendar.legendCompleted'), color: 'bg-bgGray border border-border' },
					] as item}
						<div class="flex items-center gap-2 text-sm text-text2">
							<span class="w-3 h-3 rounded {item.color}"></span>
							{item.label}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Session edit modal (admin) -->
{#if selectedSession}
	<Modal open={editOpen} title="Edit Session" onclose={() => { editOpen = false; cancelConfirming = false; }}>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<label for="eTeacherId" class="text-[13px] font-medium">Teacher</label>
				<select id="eTeacherId" bind:value={eTeacherId}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
					<option value="">— Select teacher</option>
					{#each teachers as teacher}
						<option value={teacher.user_id ?? teacher.id}>{teacher.full_name}</option>
					{/each}
				</select>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="eDate" class="text-[13px] font-medium">{$t('calendar.modal.dateLabel')}</label>
				<input id="eDate" type="date" bind:value={eDate}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="eStartTime" class="text-[13px] font-medium">{$t('calendar.modal.startLabel')}</label>
					<input id="eStartTime" type="time" bind:value={eStartTime}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="eEndTime" class="text-[13px] font-medium">{$t('calendar.modal.endLabel')}</label>
					<input id="eEndTime" type="time" bind:value={eEndTime}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
			</div>
			<div>
				<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.modeLabel')}</p>
				<div class="flex gap-2">
					{#each [['online', $t('calendar.modal.modeOnline')], ['offline', $t('calendar.modal.modeOffline')]] as [val, label]}
						<button type="button" onclick={() => (eMode = val as 'online' | 'offline')}
							class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
							       {eMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
							{label}
						</button>
					{/each}
				</div>
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="ePrice" class="text-[13px] font-medium">{$t('calendar.modal.priceLabel')}</label>
				<input id="ePrice" type="number" min="0" step="0.01" bind:value={ePrice}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary tabular" />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="eCourseId" class="text-[13px] font-medium">{$t('calendar.modal.courseLabel')}</label>
				<select id="eCourseId" bind:value={eCourseId}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
					<option value="">— {$t('calendar.modal.courseLabel')}</option>
					{#each adminCourses.filter((c: any) => !eTeacherId || c.teacher_id === eTeacherId) as course}
						<option value={course.id}>{course.name ?? course.title}</option>
					{/each}
				</select>
			</div>
			{#if eError}
				<p class="text-sm text-error">{eError}</p>
			{/if}
		</div>
		{#snippet footer()}
			{#if sessionActionError}
				<p class="text-xs text-error mr-auto">{sessionActionError}</p>
			{/if}
			{#if cancelConfirming}
				<span class="text-sm text-text2 mr-auto">Cancel this session?</span>
				<Button variant="ghost" size="sm" onclick={() => (cancelConfirming = false)}>{$t('common.cancel')}</Button>
				<Button variant="danger" size="sm" loading={sessionActionLoading} onclick={cancelSession}>Confirm</Button>
			{:else if deleteConfirming}
				<span class="text-sm text-text2 mr-auto">Permanently delete?</span>
				<Button variant="ghost" size="sm" onclick={() => (deleteConfirming = false)}>{$t('common.cancel')}</Button>
				<Button variant="danger" size="sm" loading={sessionActionLoading} onclick={deleteSession}>Delete</Button>
			{:else}
				{#if selectedSession.status === 'scheduled' || selectedSession.status === 'confirmed' || selectedSession.status === 'Confirmed'}
					<Button variant="danger" size="sm" onclick={() => (cancelConfirming = true)}>{$t('calendar.modal.cancelSession')}</Button>
					<Button variant="secondary" size="sm" loading={sessionActionLoading} onclick={markCompleted}>{$t('calendar.modal.markCompleted')}</Button>
				{/if}
				<Button variant="ghost" size="sm" onclick={() => (deleteConfirming = true)}>Delete</Button>
				<Button variant="primary" size="sm" loading={eLoading} onclick={saveEdit}>{$t('common.save')}</Button>
			{/if}
		{/snippet}
	</Modal>
{/if}

<!-- Add session modal -->
<Modal open={addOpen} title={$t('calendar.modal.addTitle')} onclose={() => (addOpen = false)}>
	<form bind:this={sFormEl} onsubmit={handleAddSession} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="sTeacherId" class="text-[13px] font-medium">Teacher</label>
			{#if filteredTeacherId}
				<div class="flex items-center gap-2 px-3 py-2.5 bg-bgGray border border-border rounded-sm text-sm">
					{teachers.find((t: any) => (t.user_id ?? t.id) === sTeacherId)?.full_name ?? sTeacherId}
					<span class="text-xs text-text2 ml-auto">(from filter)</span>
				</div>
			{:else}
				<select id="sTeacherId" bind:value={sTeacherId} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
					<option value="">— Select teacher</option>
					{#each teachers as teacher}
						<option value={teacher.user_id ?? teacher.id}>{teacher.full_name}</option>
					{/each}
				</select>
			{/if}
		</div>
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
		<div class="flex flex-col gap-1.5">
			<label for="sCourseId" class="text-[13px] font-medium">{$t('calendar.modal.courseLabel')}</label>
			<select id="sCourseId" bind:value={sCourseId} required disabled={!sTeacherId}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-60">
				<option value="">{sTeacherId ? '— ' + $t('calendar.modal.courseLabel') : 'Select a teacher first'}</option>
				{#each filteredCourses as course}
					<option value={course.id}>{course.name ?? course.title}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="sDate" class="text-[13px] font-medium">{$t('calendar.modal.dateLabel')}</label>
			<input id="sDate" type="date" bind:value={sDate} required
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
		</div>
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
		<div class="flex flex-col gap-1.5">
			<label for="sPrice" class="text-[13px] font-medium">{$t('calendar.modal.priceLabel')}</label>
			<input id="sPrice" type="number" min="0" step="0.01" bind:value={sPrice} placeholder="0"
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (addOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={sLoading} onclick={() => sFormEl?.requestSubmit()}>{$t('common.save')}</Button>
	{/snippet}
</Modal>

<!-- Recurring modal -->
<Modal
	open={recurringOpen}
	title={editingTemplate ? $t('calendar.modal.recurringEditTitle') : $t('calendar.modal.recurringTitle')}
	onclose={() => (recurringOpen = false)}
>
	<form bind:this={rFormEl} onsubmit={handleRecurringSubmit} class="flex flex-col gap-4">
		<div>
			<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.typeLabel')}</p>
			<div class="flex gap-2" role="radiogroup" aria-label={$t('calendar.modal.typeLabel')}>
				{#each ([['group', $t('calendar.modal.typeGroup')], ['private', $t('calendar.modal.typePrivate')]] as const) as [val, label]}
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
		<div class="flex flex-col gap-1.5">
			<label for="rCourseId" class="text-[13px] font-medium">{$t('calendar.modal.courseLabel')}</label>
			<select id="rCourseId" bind:value={rCourseId} required
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
				<option value="">— {$t('calendar.modal.courseLabel')}</option>
				{#each adminCourses.filter((c: any) => !filteredTeacherId || c.teacher_id === filteredTeacherId) as course}
					<option value={course.id}>{course.name ?? course.title}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="rDay" class="text-[13px] font-medium">{$t('calendar.modal.dayLabel')}</label>
			<select id="rDay" bind:value={rDayOfWeek}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
				{#each ($t('calendar.modal.days') as unknown as string[]) as day, i}
					<option value={i}>{day}</option>
				{/each}
			</select>
		</div>
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
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">{$t('calendar.modal.modeLabel')}</p>
			<div class="flex gap-2">
				{#each [['online', $t('calendar.modal.modeOnline')], ['offline', $t('calendar.modal.modeOffline')]] as [val, label]}
					<button type="button" onclick={() => (rMode = val as 'online' | 'offline')}
						class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
						       {rMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
						{label}
					</button>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="rPrice" class="text-[13px] font-medium">{$t('calendar.modal.priceLabel')}</label>
			<input id="rPrice" type="number" bind:value={rPrice} min="0" step="0.01"
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary tabular" />
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (recurringOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={rLoading} onclick={() => rFormEl?.requestSubmit()}>
			{editingTemplate ? $t('common.save') : $t('calendar.addRecurring')}
		</Button>
	{/snippet}
</Modal>
