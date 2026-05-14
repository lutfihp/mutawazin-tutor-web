<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<AuthLayout role="admin">
	{#if children}{@render children()}{/if}
</AuthLayout>
