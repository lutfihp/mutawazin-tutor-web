<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
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

	const grid = $derived(calendarGrid(year, month));
	const monthLabel = $derived(formatMonth(year, month));
	const today = toISODate(new Date());

	function sessionsByDate(date: Date): any[] {
		const key = toISODate(date);
		return sessions.filter((s) => s.starts_at?.startsWith(key));
	}

	function hasAvailability(date: Date): boolean {
		const key = toISODate(date);
		return availability.some((a) => a.specific_date === key || !a.specific_date);
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

	async function fetchAvailability() {
		if (!isTeacher) return;
		try {
			const data = await api.get<any[]>('/availability');
			availability = Array.isArray(data) ? data : [];
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

	function openSession(session: any) {
		selectedSession = session;
		detailOpen = true;
	}

	function pillClass(type: string, status: string): string {
		if (status === 'Completed' || status === 'completed') return 'bg-bgGray text-text2';
		if (status === 'Cancelled' || status === 'cancelled') return 'bg-bgGray text-text3 line-through';
		if (type === 'group') return 'bg-primary-light text-primary-dark';
		return 'bg-teal-light text-[#115E59]';
	}

	$effect(() => { year; month; fetchSessions(); });
	onMount(fetchAvailability);
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
										title={session.title}
									>
										{session.starts_at?.slice(11, 16)} {session.title}
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
				<div class="bg-white border border-border rounded-DEFAULT p-4">
					<div class="flex items-center justify-between mb-3">
						<h2 class="font-semibold">{$t('calendar.myAvailability')}</h2>
						<Button variant="secondary" size="sm">{$t('calendar.addSlot')}</Button>
					</div>
					{#if availability.length}
						<div class="flex flex-col gap-1.5">
							{#each availability as slot}
								<div class="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
									<span class="text-text2 tabular">{slot.day_of_week ?? slot.specific_date} · {slot.start_time}–{slot.end_time}</span>
									<div class="flex gap-1">
										<button class="text-text2 hover:text-text" aria-label="Edit slot">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
										</button>
										<button class="text-text2 hover:text-error" aria-label="Delete slot">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
										</button>
									</div>
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
	<Modal open={detailOpen} title={$t('calendar.modal.detailTitle')} onclose={() => (detailOpen = false)}>
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-DEFAULT flex items-center justify-center {selectedSession.type === 'group' ? 'bg-primary-light text-primary' : 'bg-teal-light text-teal'}">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
				</div>
				<div>
					<div class="font-semibold">{selectedSession.title}</div>
					<div class="text-sm text-text2">{selectedSession.type === 'group' ? $t('status.group') : $t('status.private')}</div>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3 text-sm">
				<div><span class="text-text2">{$t('calendar.modal.when')}</span><br/><span class="font-medium tabular">{selectedSession.starts_at}</span></div>
				<div><span class="text-text2">{$t('calendar.modal.status')}</span><br/>
					<Badge variant={selectedSession.status === 'Confirmed' ? 'active' : selectedSession.status === 'Completed' ? 'gray' : 'error'} label={selectedSession.status} />
				</div>
			</div>
		</div>
		{#snippet footer()}
			{#if isTeacher && (selectedSession.status === 'Confirmed' || selectedSession.status === 'confirmed')}
				<Button variant="danger" size="sm" onclick={() => {}}>{$t('calendar.modal.cancelSession')}</Button>
				<Button variant="primary" size="sm" onclick={() => {}}>{$t('calendar.modal.markCompleted')}</Button>
			{:else}
				<Button variant="secondary" size="sm" onclick={() => (detailOpen = false)}>{$t('common.close')}</Button>
			{/if}
		{/snippet}
	</Modal>
{/if}

<!-- Add session modal -->
{#if isTeacher}
	<Modal open={addOpen} title={$t('calendar.modal.addTitle')} onclose={() => (addOpen = false)}>
		<div class="flex flex-col gap-4 text-sm text-text2">
			<p>Use the calendar to create sessions by selecting a date.</p>
		</div>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (addOpen = false)}>{$t('common.cancel')}</Button>
		{/snippet}
	</Modal>
{/if}
