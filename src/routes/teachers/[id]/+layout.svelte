<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';

	let { data, children }: { data: App.PageData; children?: Snippet } = $props();
</script>

<!-- Teachers profile is public but can also be viewed authenticated -->
{#if data.user}
	<AuthLayout role={data.user.role as 'admin' | 'teacher' | 'student'}>
		{#if children}{@render children()}{/if}
	</AuthLayout>
{:else}
	<div class="min-h-screen bg-bgGray">
		<Navbar />
		<main id="main-content" tabindex="-1" class="max-w-profile mx-auto px-6 py-10">
			{#if children}{@render children()}{/if}
		</main>
	</div>
{/if}
