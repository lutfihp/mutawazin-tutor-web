<script lang="ts">
	import Button from './Button.svelte';

	let { page, totalPages, onPage }: {
		page: number;
		totalPages: number;
		onPage: (n: number) => void;
	} = $props();
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-between px-4 py-3 border-t border-border">
		<Button variant="secondary" disabled={page === 1} onclick={() => onPage(page - 1)}>Prev</Button>
		<span class="text-sm text-text2">Page {page} of {totalPages}</span>
		<Button variant="secondary" disabled={page >= totalPages} onclick={() => onPage(page + 1)}>Next</Button>
	</div>
{/if}
