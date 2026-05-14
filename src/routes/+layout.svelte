<script lang="ts">
	import '../app.css';
	import { isLoading } from 'svelte-i18n';

	let { children } = $props();
</script>

{#if $isLoading}
	<div class="min-h-screen bg-bgGray flex items-center justify-center" role="status" aria-label="Loading">
		<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else}
	{@render children()}
{/if}
