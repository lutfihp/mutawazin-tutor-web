<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant =
		| 'success'
		| 'warning'
		| 'error'
		| 'active'
		| 'teal'
		| 'violet'
		| 'gold'
		| 'gray'
		| 'completed';

	let {
		variant = 'gray',
		label = '',
		class: extraClass = '',
		children,
	}: {
		variant?: Variant;
		label?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	const variantClasses: Record<Variant, string> = {
		success:   'bg-successBg text-successText',
		warning:   'bg-warningBg text-warningText',
		error:     'bg-errorBg text-errorText',
		active:    'bg-primary-light text-primary-dark',
		teal:      'bg-teal-light text-teal-dark',
		violet:    'bg-violet-bg text-violet-text',
		gold:      'bg-gold-bg text-gold-text',
		gray:      'bg-bgGray text-muted',
		completed: 'bg-bgGray text-muted',
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium {variantClasses[variant]} {extraClass}"
>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</span>
