<script lang="ts">
	import { t } from 'svelte-i18n';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	import EarningsTable from '$lib/components/EarningsTable.svelte';
	import { api } from '$lib/api';

	let { data } = $props();
	const role = $derived((data.user?.role ?? 'teacher') as 'admin' | 'teacher' | 'student');

	const now = new Date();
	let year = $state(now.getFullYear());
	let month = $state(now.getMonth());

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
		loading = true;
		try {
			const pad = (n: number) => String(n).padStart(2, '0');
			const from = `${year}-${pad(month + 1)}-01`;
			const to = `${year}-${pad(month + 1)}-${pad(lastDay(year, month))}`;
			const body = await api.get<any[]>(`/calendar/me?from=${from}&to=${to}`);
			sessions = (Array.isArray(body) ? body : []).filter((s: any) => s.status === 'completed');
		} catch {
			sessions = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => { year; month; fetchSessions(); });

</script>

<AuthLayout {role} userId={data.user?.id ?? ''}>
	<div class="max-w-app mx-auto">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-text">{$t('reports.earnings.title')}</h1>
		</div>

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
	</div>
</AuthLayout>
