<script lang="ts">
	import { t } from 'svelte-i18n';
	import { formatDate } from '$lib/utils/date';
	import Logo from '$lib/components/Logo.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();
	const report = $derived(data.report);

	function ulVariant(level: string): 'success' | 'active' | 'warning' | 'error' | 'gray' {
		const map: Record<string, 'success' | 'active' | 'warning' | 'error'> = {
			A: 'success', B: 'active', C: 'warning', D: 'error', E: 'error',
		};
		return map[level] ?? 'gray';
	}
</script>

<svelte:head>
	<title>Report — Mutawazin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-bgGray py-10 px-6">
	<div class="max-w-[680px] mx-auto">
		<a href="/" class="inline-block mb-8"><Logo /></a>

		{#if data.error === 'expired'}
			<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-8 text-center">
				<div class="w-16 h-16 bg-errorBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
				</div>
				<h1 class="text-xl font-semibold mb-2">{$t('reports.shareExpiredTitle')}</h1>
				<p class="text-sm text-text2">{$t('reports.shareExpiredBody')}</p>
			</div>
		{:else if data.error === 'invalid' || !report}
			<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-8 text-center">
				<h1 class="text-xl font-semibold mb-2">404</h1>
				<p class="text-sm text-text2">{$t('reports.shareInvalidBody')}</p>
			</div>
		{:else}
			<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-5">
				<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
					<div>
						<div class="font-semibold text-base">{report.session_title ?? 'Session'}</div>
						<div class="text-xs text-text2 mt-0.5 tabular">{report.created_at ? formatDate(report.created_at) : ''}</div>
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						{#if report.understanding_level}
							<Badge variant={ulVariant(report.understanding_level)}
								label={`${report.understanding_level} — ${$t(`reports.understanding_${report.understanding_level}`)}`} />
						{/if}
					</div>
				</div>

				{#if report.scores?.length}
					<div class="grid sm:grid-cols-3 gap-2 mb-4">
						{#each report.scores as sc}
							<div class="bg-bgGray rounded-sm px-3.5 py-3">
								<div class="text-[11px] uppercase font-medium text-text2 tracking-wide mb-1">{sc.topic}</div>
								<div class="text-xl font-bold tabular">{sc.score} <span class="text-[13px] text-text2 font-normal">/ {sc.max_score}</span></div>
								<div class="mt-1.5 h-1 bg-border rounded-full">
									<div class="h-1 bg-primary rounded-full" style="width: {Math.min(100, (sc.score / sc.max_score) * 100)}%;"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if report.notes}
					<blockquote class="text-sm text-text2 italic border-l-[3px] border-primary-light pl-3 whitespace-pre-line">
						{report.notes}
					</blockquote>
				{/if}
			</div>
		{/if}
	</div>
</div>
