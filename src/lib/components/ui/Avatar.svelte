<script lang="ts">
	import { avatarColor, initials as getInitials } from '$lib/utils/avatar';

	type Size = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

	let {
		name = '',
		src = '',
		size = 'md',
		id = '',
		class: extraClass = '',
	}: {
		name?: string;
		src?: string;
		size?: Size;
		id?: string;
		class?: string;
	} = $props();

	const sizeClasses: Record<Size, string> = {
		sm:  'w-7 h-7 text-[10px]',
		md:  'w-10 h-10 text-xs',
		lg:  'w-14 h-14 text-base',
		xl:  'w-16 h-16 text-lg',
		xxl: 'w-24 h-24 text-2xl',
	};

	const color = $derived(id ? avatarColor(id) : avatarColor(name));
	const letters = $derived(getInitials(name));

	let imgFailed = $state(false);
</script>

{#if src && !imgFailed}
	<img
		{src}
		alt={name}
		class="rounded-pill object-cover {sizeClasses[size]} {extraClass}"
		onerror={() => (imgFailed = true)}
	/>
{:else}
	<span
		class="rounded-pill inline-flex items-center justify-center font-semibold text-white select-none
		       {sizeClasses[size]} {extraClass}"
		style="background-color: {color};"
		aria-label={name}
		aria-hidden={!name ? 'true' : undefined}
	>
		{letters}
	</span>
{/if}
