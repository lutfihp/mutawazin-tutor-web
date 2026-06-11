<script lang="ts">
	import type { Snippet } from 'svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';

	let { data, children }: { data: App.PageData; children?: Snippet } = $props();

	// Teachers, students, and admins keep their sidebar when viewing a teacher profile.
	// Unauthenticated visitors get the public layout (no sidebar).
	const role = $derived(data.user?.role as 'admin' | 'teacher' | 'student' | undefined);
	const useAuthLayout = $derived(role === 'teacher' || role === 'student' || role === 'admin');
</script>

{#if useAuthLayout}
	<AuthLayout role={role!} userId={data.user?.id ?? ''}>
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
