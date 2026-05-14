<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		padding = 'default',
		class: extraClass = '',
		head,
		foot,
		children,
	}: {
		padding?: 'sm' | 'default' | 'lg' | 'xl' | 'none';
		class?: string;
		head?: Snippet;
		foot?: Snippet;
		children?: Snippet;
	} = $props();

	const paddingClasses: Record<string, string> = {
		none:    '',
		sm:      'p-3',
		default: 'p-5',
		lg:      'p-6',
		xl:      'p-8',
	};
</script>

<div class="bg-white border border-border rounded-DEFAULT shadow-sm {extraClass}">
	{#if head}
		<div class="px-5 py-4 border-b border-border flex items-center justify-between">
			{@render head()}
		</div>
	{/if}

	<div class="{paddingClasses[padding]}">
		{#if children}{@render children()}{/if}
	</div>

	{#if foot}
		<div class="px-5 py-3 border-t border-border bg-bgGray rounded-b-DEFAULT flex items-center justify-center">
			{@render foot()}
		</div>
	{/if}
</div>
