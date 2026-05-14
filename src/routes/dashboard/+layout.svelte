<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';

	let { data, children }: { data: App.PageData; children?: Snippet } = $props();
	const role = $derived((data.user?.role ?? 'student') as 'admin' | 'teacher' | 'student');
</script>

<AuthLayout {role}>
	{#if children}{@render children()}{/if}
</AuthLayout>
