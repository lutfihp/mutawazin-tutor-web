<script lang="ts">
	import { page } from '$app/stores';
	import { t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
	<title>Error — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href="/" class="mb-8"><Logo /></a>
	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8 text-center">
		<div class="text-5xl font-bold text-primary mb-4">{$page.status}</div>
		<h1 class="text-[22px] font-semibold mb-3">
			{$page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="text-sm text-text2 mb-8">{$page.error?.message ?? 'An unexpected error occurred.'}</p>
		<Button variant="primary" href="/">Back to Home</Button>
	</div>
</div>
