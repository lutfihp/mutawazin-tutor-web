<script lang="ts">
	import { MoreVertical } from 'lucide-svelte';

	type Item = { label: string; onclick: () => void; variant?: 'default' | 'danger' };
	let { items }: { items: Item[] } = $props();

	let open = $state(false);

	function select(item: Item) {
		open = false;
		item.onclick();
	}
</script>

<div
	class="relative"
	tabindex="-1"
	onfocusout={(e) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) open = false;
	}}
	onkeydown={(e) => { if (e.key === 'Escape') open = false; }}
	role="none"
>
	<button
		onclick={(e) => { e.stopPropagation(); open = !open; }}
		class="w-8 h-8 rounded-sm text-text2 hover:text-text hover:bg-bgGray flex items-center justify-center transition-colors"
		aria-label="Actions"
		aria-haspopup="true"
		aria-expanded={open}
	>
		<MoreVertical size={16} aria-hidden="true" />
	</button>

	{#if open}
		<div class="absolute right-0 top-full mt-1 bg-white border border-border rounded-sm shadow-md min-w-[140px] py-1 z-50">
			{#each items as item}
				<button
					onclick={() => select(item)}
					class="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bgGray
					       {item.variant === 'danger' ? 'text-errorText' : 'text-text'}"
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
