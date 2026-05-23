<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'blue',
		code = null,
		title,
		body,
		noTile = false,
		icon,
		actions,
		extra,
	}: {
		tone?: 'blue' | 'teal' | 'amber' | 'rose' | 'slate';
		code?: string | null;
		title: string;
		body: string;
		noTile?: boolean;
		icon?: Snippet;
		actions?: Snippet;
		extra?: Snippet;
	} = $props();

	const tones: Record<string, string> = {
		blue:  'bg-blue-100 text-blue-600',
		teal:  'bg-teal-100 text-teal-700',
		amber: 'bg-amber-100 text-amber-700',
		rose:  'bg-rose-100 text-rose-600',
		slate: 'bg-slate-200 text-slate-600',
	};
</script>

<main class="flex-1 grid place-items-center px-6 py-16 bg-slate-50">
	<div class="w-full max-w-[480px] text-center">

		{#if noTile}
			<div class="flex justify-center mb-6">
				{@render icon?.()}
			</div>
		{:else}
			<div class="w-20 h-20 rounded-full grid place-items-center mx-auto mb-6 {tones[tone]}">
				{@render icon?.()}
			</div>
		{/if}

		{#if code}
			<div class="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase mb-5">
				<span>Error</span>
				<span class="font-semibold text-slate-500">{code}</span>
			</div>
		{/if}

		<h1 class="text-[28px] sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight mb-3 text-balance">
			{title}
		</h1>

		<p class="text-[15px] sm:text-[16px] text-slate-500 leading-relaxed mb-8 text-pretty">
			{body}
		</p>

		<div class="flex flex-wrap gap-2 justify-center">
			{@render actions?.()}
		</div>

		{@render extra?.()}

	</div>
</main>
