<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import type { PaginatedResponse } from '$lib/api';
	import EarningsTable from '$lib/components/EarningsTable.svelte';

	let { data } = $props();

	const now = new Date();
	let year = $state(now.getFullYear());
	let month = $state(now.getMonth());

	let teachers = $state<any[]>([]);
	let selectedTeacherId = $state('');
	let sessions = $state<any[]>([]);
	let loading = $state(false);

	const isCurrentMonth = $derived(year === now.getFullYear() && month === now.getMonth());

	function prevMonth() {
		if (month === 0) { year--; month = 11; } else { month--; }
	}
	function nextMonth() {
		if (month === 11) { year++; month = 0; } else { month++; }
	}

	function monthLabel() {
		return new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
	}

	function lastDay(y: number, m: number) {
		return new Date(y, m + 1, 0).getDate();
	}

	async function fetchSessions() {
		if (!selectedTeacherId) { sessions = []; return; }
		loading = true;
		try {
			const pad = (n: number) => String(n).padStart(2, '0');
			const from = `${year}-${pad(month + 1)}-01`;
			const to = `${year}-${pad(month + 1)}-${pad(lastDay(year, month))}`;
			const body = await api.get<any[]>(`/calendar/admin?from=${from}&to=${to}&teacher_id=${selectedTeacherId}`);
			sessions = (Array.isArray(body) ? body : []).filter((s: any) => s.status === 'completed');
		} catch {
			sessions = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => { selectedTeacherId; year; month; fetchSessions(); });

	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<any>>('/admin/teachers');
			teachers = body.data ?? [];
		} catch {}
	});
</script>

<svelte:head>
	<title>{$t('nav.adminReports')} — Mutawazin</title>
</svelte:head>

<div class="max-w-app mx-auto">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-text">{$t('nav.adminReports')}</h1>
	</div>

	<div class="mb-5">
		<select
			bind:value={selectedTeacherId}
			class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"
		>
			<option value="">{$t('reports.earnings.selectTeacher')}</option>
			{#each teachers as teacher}
				<option value={teacher.user_id ?? teacher.id}>{teacher.full_name ?? teacher.email}</option>
			{/each}
		</select>
	</div>

	{#if !selectedTeacherId}
		<div class="bg-white border border-border rounded-DEFAULT px-5 py-10 text-center text-text2 text-sm">
			{$t('reports.admin.selectTeacher')}
		</div>
	{:else}
		<div class="flex items-center gap-3 mb-5">
			<button
				onclick={prevMonth}
				class="border border-border bg-white rounded-md px-3 py-1.5 text-sm text-text2 hover:text-text hover:bg-bgGray"
			>{$t('reports.earnings.prevMonth')}</button>
			<span class="text-base font-semibold text-text min-w-40 text-center capitalize">{monthLabel()}</span>
			<button
				onclick={nextMonth}
				disabled={isCurrentMonth}
				class="border border-border bg-white rounded-md px-3 py-1.5 text-sm text-text2 hover:text-text hover:bg-bgGray disabled:opacity-40 disabled:cursor-not-allowed"
			>{$t('reports.earnings.nextMonth')}</button>
		</div>

		<EarningsTable {sessions} {loading} />
	{/if}
</div>
