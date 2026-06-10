<script lang="ts">
	import { t } from 'svelte-i18n';

	let { sessions, loading }: {
		sessions: any[];
		loading: boolean;
	} = $props();

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

	function subjectName(displayTitle: string) {
		return displayTitle?.split(' — ')[0] ?? '';
	}

	function studentNames(displayTitle: string) {
		return displayTitle?.split(' — ')[1] ?? '—';
	}

	const totalBruto = $derived(sessions.reduce((sum: number, s: any) => sum + (s.price ?? 0) * (s.student_ids?.length ?? 1), 0));
	const platformFee = $derived(totalBruto * 0.1);
	const yangDiterima = $derived(totalBruto * 0.9);
</script>

<div class="bg-white border border-border rounded-DEFAULT overflow-hidden">
	<div class="px-5 py-3 border-b border-border">
		<span class="text-sm text-text2">{$t('reports.earnings.sessionCount', { values: { count: sessions.length } })}</span>
	</div>

	{#if loading}
		<div class="px-5 py-10 text-center text-text2 text-sm">{$t('reports.earnings.loading')}</div>
	{:else if sessions.length === 0}
		<div class="px-5 py-10 text-center text-text2 text-sm">{$t('reports.earnings.noSessions')}</div>
	{:else}
		<table class="w-full text-sm border-collapse">
			<thead>
				<tr class="bg-bgGray border-b border-border">
					<th class="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">{$t('reports.earnings.colDate')}</th>
					<th class="text-left px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">{$t('reports.earnings.colSubject')}</th>
					<th class="text-left px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">{$t('reports.earnings.colStudent')}</th>
					<th class="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-text2">{$t('reports.earnings.colPrice')}</th>
				</tr>
			</thead>
			<tbody>
				{#each sessions as session}
					<tr class="border-b border-border last:border-0">
						<td class="px-5 py-3 text-text2 whitespace-nowrap">{formatDate(session.starts_at)}</td>
						<td class="px-2 py-3 font-medium text-text">{subjectName(session.display_title)}</td>
						<td class="px-2 py-3 text-text2">{studentNames(session.display_title)}</td>
						<td class="px-5 py-3 text-right font-semibold text-text">{formatRupiah((session.price ?? 0) * (session.student_ids?.length ?? 1))}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="px-5 py-4 border-t-2 border-border bg-bgGray">
			<div class="flex justify-end gap-14 text-sm text-text2 mb-1.5">
				<span>{$t('reports.earnings.totalBruto')}</span>
				<span class="font-semibold text-text min-w-24 text-right">{formatRupiah(totalBruto)}</span>
			</div>
			<div class="flex justify-end gap-14 text-sm text-text2 mb-3">
				<span>{$t('reports.earnings.platformFee')}</span>
				<span class="text-error min-w-24 text-right">− {formatRupiah(platformFee)}</span>
			</div>
			<div class="flex justify-end gap-14 border-t border-border pt-3">
				<span class="font-bold text-text">{$t('reports.earnings.netAmount')}</span>
				<span class="font-bold text-primary min-w-24 text-right text-base">{formatRupiah(yangDiterima)}</span>
			</div>
		</div>
	{/if}
</div>
