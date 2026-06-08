<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import { calendarGrid, toISODate, formatMonth } from '$lib/utils/date';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let { data } = $props();
	const isTeacher = $derived(data.user?.role === 'teacher');

	const now = new Date();
	let year = $state(now.getFullYear());
	let month = $state(now.getMonth());

	let sessions = $state<any[]>([]);
	let availability = $state<any[]>([]);
	let loading = $state(true);

	let selectedSession = $state<any | null>(null);
	let detailOpen = $state(false);
	let addOpen = $state(false);
	let sessionActionLoading = $state(false);
	let sessionActionError = $state('');
	let cancelConfirming = $state(false);

	const grid = $derived(calendarGrid(year, month));
	const monthLabel = $derived(formatMonth(year, month));
	const today = toISODate(new Date());

	function sessionsByDate(date: Date): any[] {
		const key = toISODate(date);
		return sessions.filter((s) => s.starts_at?.startsWith(key));
	}

	function hasAvailability(date: Date): boolean {
		const key = toISODate(date);
		return availability.some((a) =>
			a.specific_date ? a.specific_date === key : a.day_of_week === date.getUTCDay()
		);
	}

	async function fetchSessions() {
		loading = true;
		try {
			const firstDay = new Date(Date.UTC(year, month, 1));
			const lastDay = new Date(Date.UTC(year, month + 1, 0));
			const data = await api.get<any[]>(`/calendar/me?from=${toISODate(firstDay)}&to=${toISODate(lastDay)}`);
			sessions = Array.isArray(data) ? data : [];
		} catch {
			sessions = [];
		} finally {
			loading = false;
		}
	}

	async function cancelSession() {
		if (!selectedSession) return;
		sessionActionLoading = true;
		sessionActionError = '';
		try {
			await api.patch(`/sessions/${selectedSession.id}/status`, { status: 'cancelled' });
			const id = selectedSession.id;
			selectedSession = { ...selectedSession, status: 'cancelled' };
			sessions = sessions.map(s => s.id === id ? { ...s, status: 'cancelled' } : s);
			detailOpen = false;
		} catch (e: any) {
			sessionActionError = e?.message ?? 'Failed to cancel session.';
		} finally {
			sessionActionLoading = false;
			cancelConfirming = false;
		}
	}

	async function markCompleted() {
		if (!selectedSession) return;
		sessionActionLoading = true;
		sessionActionError = '';
		try {
			await api.patch(`/sessions/${selectedSession.id}/status`, { status: 'completed' });
			const id = selectedSession.id;
			selectedSession = { ...selectedSession, status: 'completed' };
			sessions = sessions.map(s => s.id === id ? { ...s, status: 'completed' } : s);
			detailOpen = false;
		} catch (e: any) {
			sessionActionError = e?.message ?? 'Failed to update session.';
		} finally {
			sessionActionLoading = false;
		}
	}

	async function fetchAvailability() {
		if (!isTeacher) return;
		const teacherId = data.user?.id;
		if (!teacherId) return;
		try {
			const result = await api.get<any[]>(`/availability/${teacherId}`);
			availability = Array.isArray(result) ? result : [];
		} catch {
			availability = [];
		}
	}

	function prevMonth() {
		if (month === 0) { year--; month = 11; } else { month--; }
	}

	function nextMonth() {
		if (month === 11) { year++; month = 0; } else { month++; }
	}

	function goToday() {
		year = now.getFullYear();
		month = now.getMonth();
	}

	let ratingValue = $state(0);
	let ratingComment = $state('');
	let ratingLoading = $state(false);
	let ratingSubmitted = $state(false);
	let ratingAlready = $state(false);

	async function submitRating() {
		if (!selectedSession || ratingValue === 0) return;
		ratingLoading = true;
		try {
			await api.post(`/sessions/${selectedSession.id}/rating`, {
				rating: ratingValue,
				comment: ratingComment || undefined,
			});
			ratingSubmitted = true;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409')) ratingAlready = true;
		} finally {
			ratingLoading = false;
		}
	}

	function openSession(session: any) {
		selectedSession = session;
		detailOpen = true;
		ratingValue = 0;
		ratingComment = '';
		ratingSubmitted = false;
		ratingAlready = false;
	}

	function pillClass(type: string, status: string): string {
		if (status === 'Completed' || status === 'completed') return 'bg-bgGray text-text2';
		if (status === 'Cancelled' || status === 'cancelled') return 'bg-bgGray text-text3 line-through';
		if (type === 'group') return 'bg-primary-light text-primary-dark';
		return 'bg-teal-light text-[#115E59]';
	}

	$effect(() => { year; month; fetchSessions(); });

	// Recurring templates (teacher only)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recurringTemplates = $state<any[]>([]);
	let recurringOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let teacherCourses = $state<any[]>([]);

	// Add Session form state
	let sType = $state<'group' | 'private'>('group');
	let sCourseId = $state('');
	let sDate = $state('');
	let sStartTime = $state('');
	let sEndTime = $state('');
	let sMode = $state<'online' | 'offline'>('online');
	let sPrice = $state('');
	let sLoading = $state(false);
	let sFormEl = $state<HTMLFormElement | null>(null);

	// Availability slot form state
	let slotOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let editingSlot = $state<any | null>(null);
	let slotMode = $state<'weekly' | 'specific'>('weekly');
	let slotDayOfWeek = $state('0');
	let slotSpecificDate = $state('');
	let slotStartTime = $state('');
	let slotEndTime = $state('');
	let slotLoading = $state(false);
	let slotDeleteLoading = $state<string | null>(null);
	let slotConfirmDelete = $state<string | null>(null);

	async function fetchRecurringTemplates() {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/sessions/recurring');
			recurringTemplates = body.data;
		} catch {
			recurringTemplates = [];
		}
	}

	async function fetchTeacherCourses() {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/courses');
			teacherCourses = body.data;
		} catch {
			teacherCourses = [];
		}
	}

	function openAddSlot() {
		editingSlot = null;
		slotMode = 'weekly'; slotDayOfWeek = '0';
		slotSpecificDate = ''; slotStartTime = ''; slotEndTime = '';
		slotOpen = true;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

	async function handleAddSession(e: SubmitEvent) {
		e.preventDefault();
		if (!sDate || !sStartTime || !sEndTime) return;
		sLoading = true;
		try {
			const starts_at = new Date(`${sDate}T${sStartTime}:00`).toISOString();
			const ends_at = new Date(`${sDate}T${sEndTime}:00`).toISOString();
			await api.post('/sessions', {
				type: sType,
				starts_at,
				ends_at,
				mode: sMode,
				course_id: sCourseId,
				price: sPrice ? Number(sPrice) : undefined,
			});
			addOpen = false;
			sType = 'group'; sCourseId = '';
			sDate = ''; sStartTime = ''; sEndTime = '';
			sMode = 'online'; sPrice = '';
			await fetchSessions();
		} finally {
			sLoading = false;
		}
	}

	onMount(() => {
		fetchAvailability();
		fetchRecurringTemplates();
		fetchTeacherCourses();
	});
</script>

<svelte:head>
	<title>{$t('calendar.title')} — Mutawazin</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
		<div>
			<h1 class="text-2xl font-bold">{$t('calendar.title')}</h1>
			<p class="text-sm text-text2 mt-0.5">
				{isTeacher ? $t('calendar.teacherSub') : $t('calendar.studentSub')}
			</p>
		</div>
		<div class="flex items-center gap-3 flex-wrap">
			<!-- Month nav -->
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
			{#if isTeacher}
				<Button variant="secondary" size="sm" onclick={openAddRecurring}>
					{$t('calendar.addRecurring')}
				</Button>
				<Button variant="primary" size="sm" onclick={() => (addOpen = true)}>
					{$t('calendar.addSession')}
				</Button>
			{/if}
		</div>
	</div>

	<div class="grid calendar-panel:grid-cols-[1fr_280px] gap-5">
		<!-- Calendar grid -->
		<div class="bg-white border border-border rounded-DEFAULT overflow-hidden">
			<!-- Day headers -->
			<div class="grid grid-cols-7 bg-bgGray">
				{#each $t('calendar.daysShort') as day}
					<div class="py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-text2">{day}</div>
				{/each}
			</div>

			<!-- Day cells -->
			<div class="grid grid-cols-7">
				{#each grid as cell}
					{@const isToday = cell ? toISODate(cell) === today : false}
					{@const isCurrentMonth = cell?.getUTCMonth() === month}
					{@const daySessions = cell ? sessionsByDate(cell) : []}
					{@const hasAvail = cell && isTeacher && hasAvailability(cell)}

					<div
						class="min-h-[120px] border-r border-b border-border last:border-r-0 p-1.5 relative
						       {!isCurrentMonth ? 'bg-[#FAFBFC]' : ''}
						       {hasAvail ? 'ring-inset ring-2 ring-primary/20' : ''}"
					>
						{#if cell}
							<span
								class="inline-flex items-center justify-center w-6 h-6 text-sm mb-1 rounded-full
								       {isToday ? 'bg-primary text-white font-semibold' : isCurrentMonth ? 'text-text' : 'text-text3'}"
							>
								{cell.getUTCDate()}
							</span>

							<div class="flex flex-col gap-0.5">
								{#each daySessions.slice(0, 2) as session}
									<button
										onclick={() => openSession(session)}
										class="w-full text-left text-[11px] font-medium rounded px-1.5 py-0.5 truncate tabular {pillClass(session.type, session.status)}"
										title={session.display_title}
									>
										{session.recurring_template_id ? '↻ ' : ''}{session.starts_at?.slice(11, 16)} {session.display_title}
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
			{#if isTeacher}
				<!-- Recurring templates panel -->
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
											{($t('calendar.modal.days') as unknown as string[])[tmpl.day_of_week] ?? tmpl.day_of_week}
											· {tmpl.start_time}
										</span>
										<span class="text-text2 ml-1.5">— {tmpl.display_title}</span>
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

				<div class="bg-white border border-border rounded-DEFAULT p-4">
					<div class="flex items-center justify-between mb-3">
						<h2 class="font-semibold">{$t('calendar.myAvailability')}</h2>
						<Button variant="secondary" size="sm" onclick={openAddSlot}>{$t('calendar.addSlot')}</Button>
					</div>
					{#if availability.length}
						<div class="flex flex-col gap-1.5">
							{#each availability as slot}
								{@const slotId = slot.id ?? slot.slot_id ?? ''}
								<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
									<span class="text-text2 tabular">
										{slot.day_of_week !== undefined && slot.day_of_week !== null
											? ($t('calendar.modal.days') as unknown as string[])[slot.day_of_week]
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
												class="text-xs text-error font-medium px-1 disabled:opacity-50">
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
			{/if}

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
					{#if isTeacher}
						<div class="flex items-center gap-2 text-sm text-text2">
							<span class="w-3 h-3 rounded border-2 border-dashed border-primary"></span>
							{$t('calendar.legendAvailability')}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Session detail modal -->
{#if selectedSession}
	<Modal open={detailOpen} title={$t('calendar.modal.detailTitle')} onclose={() => { detailOpen = false; cancelConfirming = false; sessionActionError = ''; }}>
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-DEFAULT flex items-center justify-center {selectedSession.type === 'group' ? 'bg-primary-light text-primary' : 'bg-teal-light text-teal'}">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
				</div>
				<div>
					<div class="font-semibold">{selectedSession.display_title}</div>
					<div class="text-sm text-text2">{selectedSession.type === 'group' ? $t('status.group') : $t('status.private')}</div>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div><span class="text-text2">{$t('calendar.modal.when')}</span><br/><span class="font-medium tabular">{selectedSession.starts_at}</span></div>
				<div><span class="text-text2">{$t('calendar.modal.status')}</span><br/>
					<Badge variant={selectedSession.status === 'Confirmed' ? 'active' : selectedSession.status === 'Completed' ? 'gray' : 'error'} label={selectedSession.status} />
				</div>
			</div>
			{#if selectedSession.mode || selectedSession.price}
				<div class="flex gap-4 text-sm">
					{#if selectedSession.mode}
						<div>
							<span class="text-text2">{$t('calendar.modal.modeLabel')}</span><br/>
							<Badge variant={selectedSession.mode === 'online' ? 'active' : 'gray'} label={selectedSession.mode === 'online' ? $t('calendar.modal.modeOnline') : $t('calendar.modal.modeOffline')} />
						</div>
					{/if}
					{#if selectedSession.price}
						<div>
							<span class="text-text2">{$t('calendar.modal.priceLabel')}</span><br/>
							<span class="font-medium tabular">{selectedSession.price}</span>
						</div>
					{/if}
				</div>
			{/if}
			{#if selectedSession.recurring_template_id}
				<p class="text-sm text-text2 flex items-center gap-1.5">
					<span class="text-primary font-medium">↻</span>
					{$t('calendar.recurringBadge')}
				</p>
			{/if}
			{#if data.user?.role === 'student' && (selectedSession.status === 'Completed' || selectedSession.status === 'completed')}
				<div class="border-t border-border pt-3">
					<p class="text-[13px] font-medium mb-2">{$t('calendar.modal.rateSession')}</p>
					{#if ratingAlready}
						<p class="text-sm text-text2">{$t('calendar.modal.ratingAlready')}</p>
					{:else if ratingSubmitted}
						<p class="text-sm text-successText">{'★'.repeat(ratingValue)} Submitted!</p>
					{:else}
						<div class="flex flex-col gap-2">
							<div class="flex gap-1">
								{#each [1, 2, 3, 4, 5] as star}
									<button type="button" onclick={() => (ratingValue = star)}
										class="text-2xl transition-colors {ratingValue >= star ? 'text-[#F59E0B]' : 'text-border hover:text-[#F59E0B]'}"
										aria-label="Rate {star} stars">★</button>
								{/each}
							</div>
							{#if ratingValue > 0}
								<textarea bind:value={ratingComment} rows={2}
									placeholder={$t('calendar.modal.ratingCommentPlaceholder')}
									class="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"></textarea>
								<Button variant="primary" size="sm" loading={ratingLoading} onclick={submitRating}>
									{$t('calendar.modal.ratingSubmit')}
								</Button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
		{#snippet footer()}
			{#if isTeacher && (selectedSession.status === 'Confirmed' || selectedSession.status === 'confirmed')}
				{#if sessionActionError}
					<p class="text-xs text-error mr-auto">{sessionActionError}</p>
				{/if}
				{#if cancelConfirming}
					<span class="text-sm text-text2 mr-auto">Are you sure?</span>
					<Button variant="ghost" size="sm" onclick={() => (cancelConfirming = false)}>{$t('common.cancel')}</Button>
					<Button variant="danger" size="sm" loading={sessionActionLoading} onclick={cancelSession}>Confirm</Button>
				{:else}
					<Button variant="danger" size="sm" onclick={() => (cancelConfirming = true)}>{$t('calendar.modal.cancelSession')}</Button>
					<Button variant="primary" size="sm" loading={sessionActionLoading} onclick={markCompleted}>{$t('calendar.modal.markCompleted')}</Button>
				{/if}
			{:else}
				<Button variant="secondary" size="sm" onclick={() => (detailOpen = false)}>{$t('common.close')}</Button>
			{/if}
		{/snippet}
	</Modal>
{/if}

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

			<!-- Course -->
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

		</form>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (addOpen = false)}>{$t('common.cancel')}</Button>
			<Button variant="primary" size="sm" loading={sLoading} onclick={() => sFormEl?.requestSubmit()}>
				{$t('common.save')}
			</Button>
		{/snippet}
	</Modal>

	<!-- Recurring Session modal -->
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

			<!-- Course -->
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

			<!-- Day of week -->
			<div class="flex flex-col gap-1.5">
				<label for="rDay" class="text-[13px] font-medium">{$t('calendar.modal.dayLabel')}</label>
				<select id="rDay" bind:value={rDayOfWeek}
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
					{#each ($t('calendar.modal.days') as unknown as string[]) as day, i}
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

			<!-- Mode -->
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

		</form>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (recurringOpen = false)}>{$t('common.cancel')}</Button>
			<Button variant="primary" size="sm" loading={rLoading} onclick={() => rFormEl?.requestSubmit()}>
				{editingTemplate ? $t('common.save') : $t('calendar.addRecurring')}
			</Button>
		{/snippet}
	</Modal>

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

				<!-- Day of week or specific date -->
				{#if slotMode === 'weekly'}
					<div class="flex flex-col gap-1.5">
						<label for="slotDayOfWeek" class="text-[13px] font-medium">{$t('calendar.modal.dayLabel')}</label>
						<select id="slotDayOfWeek" bind:value={slotDayOfWeek}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
							{#each ($t('calendar.modal.days') as unknown as string[]) as day, i}
								<option value={String(i)}>{day}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="flex flex-col gap-1.5">
						<label for="slotSpecificDate" class="text-[13px] font-medium">{$t('calendar.modal.dateLabel')}</label>
						<input id="slotSpecificDate" type="date" bind:value={slotSpecificDate}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
					</div>
				{/if}
			{:else}
				<!-- Edit mode: show current slot label read-only -->
				<p class="text-sm text-text2 font-medium">
					{editingSlot.day_of_week !== undefined && editingSlot.day_of_week !== null
						? ($t('calendar.modal.days') as unknown as string[])[editingSlot.day_of_week]
						: editingSlot.specific_date}
				</p>
			{/if}

			<!-- Start + End time -->
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="slotStartTime" class="text-[13px] font-medium">{$t('calendar.modal.startLabel')}</label>
					<input id="slotStartTime" type="time" bind:value={slotStartTime}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="slotEndTime" class="text-[13px] font-medium">{$t('calendar.modal.endLabel')}</label>
					<input id="slotEndTime" type="time" bind:value={slotEndTime}
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
{/if}
