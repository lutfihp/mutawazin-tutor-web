<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'teal' | 'ghost' | 'danger' | 'success';
	type Size = 'sm' | 'default' | 'lg';

	let {
		variant = 'primary',
		size = 'default',
		loading = false,
		disabled = false,
		type = 'button' as 'button' | 'submit' | 'reset',
		href = '',
		class: extraClass = '',
		onclick,
		children,
	}: {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	} = $props();

	const variantClasses: Record<Variant, string> = {
		primary:   'bg-primary hover:bg-primary-dark text-white border-transparent hover:shadow-btn-primary',
		secondary: 'bg-white hover:bg-primary-light text-primary border-primary',
		teal:      'bg-teal hover:bg-teal-dark text-white border-transparent',
		ghost:     'bg-transparent hover:bg-bgGray text-muted hover:text-text border-transparent',
		danger:    'bg-white hover:bg-errorBg text-error border-border hover:border-error',
		success:   'bg-success hover:bg-[#059669] text-white border-transparent',
	};

	const sizeClasses: Record<Size, string> = {
		sm:      'h-8 px-3 text-[13px] gap-1.5',
		default: 'h-10 px-4 text-sm gap-2',
		lg:      'h-11 px-5 text-[15px] gap-2',
	};

	const base =
		'inline-flex items-center justify-center font-semibold rounded-sm border-[1.5px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
</script>

{#if href}
	<a
		{href}
		class="{base} {variantClasses[variant]} {sizeClasses[size]} {extraClass}"
		aria-disabled={disabled}
	>
		{#if children}{@render children()}{/if}
	</a>
{:else}
	<button
		{type}
		{disabled}
		{onclick}
		class="{base} {variantClasses[variant]} {sizeClasses[size]} {extraClass}"
		aria-busy={loading}
	>
		{#if loading}
			<svg
				class="animate-spin"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" />
			</svg>
		{/if}
		{#if children}{@render children()}{/if}
	</button>
{/if}
