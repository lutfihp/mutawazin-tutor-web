<script lang="ts">
	import { onMount } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	import { api } from '$lib/api';
	import type { PaginatedResponse } from '$lib/api';

	let { data } = $props();
	const role = $derived((data.user?.role ?? 'teacher') as 'admin' | 'teacher' | 'student');

	const now = new Date();
	let year = $state(now.getFullYear());
	let month = $state(now.getMonth()); // 0-indexed

	let sessions = $state<any[]>([]);
	let loading = $state(false);
	let studentMap = $state<Record<string, string>>({});

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

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('id-ID', {
			weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
		});
	}

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
		}).format(amount);
	}

	function resolveStudents(ids: string[]) {
		if (!ids?.length) return '—';
		return ids.map(id => studentMap[id] ?? id).join(', ');
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

	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<any>>('/students');
			for (const s of body.data ?? []) {
				studentMap[s.user_id ?? s.id] = s.full_name;
			}
		} catch {}
	});

	const totalBruto = $derived(sessions.reduce((sum: number, s: any) => sum + (s.price ?? 0), 0));
	const platformFee = $derived(totalBruto * 0.1);
	const yangDiterima = $derived(totalBruto * 0.9);
</script>

<AuthLayout {role} userId={data.user?.id ?? ''}>
	<div class="max-w-app mx-auto">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-text">Laporan Sesi</h1>
		</div>

		<!-- Month navigation -->
		<div class="flex items-center gap-3 mb-5">
			<button
				onclick={prevMonth}
				class="border border-border bg-white rounded-md px-3 py-1.5 text-sm text-text2 hover:text-text hover:bg-bgGray"
			>‹ Prev</button>
			<span class="text-base font-semibold text-text min-w-40 text-center capitalize">{monthLabel()}</span>
			<button
				onclick={nextMonth}
				disabled={isCurrentMonth}
				class="border border-border bg-white rounded-md px-3 py-1.5 text-sm text-text2 hover:text-text hover:bg-bgGray disabled:opacity-40 disabled:cursor-not-allowed"
			>Next ›</button>
		</div>

		<!-- Sessions card -->
		<div class="bg-white border border-border rounded-DEFAULT overflow-hidden">
			<div class="px-5 py-3 border-b border-border">
				<span class="text-sm text-text2">{sessions.length} sesi selesai</span>
			</div>

			{#if loading}
				<div class="px-5 py-10 text-center text-text2 text-sm">Memuat...</div>
			{:else if sessions.length === 0}
				<div class="px-5 py-10 text-center text-text2 text-sm">Tidak ada sesi selesai bulan ini.</div>
			{:else}
				<table class="w-full text-sm border-collapse">
					<thead>
						<tr class="bg-bgGray border-b border-border">
							<th class="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">Tanggal</th>
							<th class="text-left px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">Mata Pelajaran</th>
							<th class="text-left px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">Murid</th>
							<th class="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">Harga</th>
						</tr>
					</thead>
					<tbody>
						{#each sessions as session}
							<tr class="border-b border-border last:border-0">
								<td class="px-5 py-3 text-text2 whitespace-nowrap">{formatDate(session.starts_at)}</td>
								<td class="px-2 py-3 font-medium text-text">{session.display_title}</td>
								<td class="px-2 py-3 text-text2">{resolveStudents(session.student_ids)}</td>
								<td class="px-5 py-3 text-right font-semibold text-text">{formatRupiah(session.price ?? 0)}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- Totals -->
				<div class="px-5 py-4 border-t-2 border-border bg-bgGray">
					<div class="flex justify-end gap-14 text-sm text-text2 mb-1.5">
						<span>Total bruto</span>
						<span class="font-semibold text-text min-w-24 text-right">{formatRupiah(totalBruto)}</span>
					</div>
					<div class="flex justify-end gap-14 text-sm text-text2 mb-3">
						<span>Biaya platform (10%)</span>
						<span class="text-error min-w-24 text-right">− {formatRupiah(platformFee)}</span>
					</div>
					<div class="flex justify-end gap-14 border-t border-border pt-3">
						<span class="font-bold text-text">Yang diterima</span>
						<span class="font-bold text-primary min-w-24 text-right text-base">{formatRupiah(yangDiterima)}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</AuthLayout>
