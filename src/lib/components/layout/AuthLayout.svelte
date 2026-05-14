<script lang="ts">
	import type { Snippet } from 'svelte';
	import Navbar from './Navbar.svelte';
	import Sidebar from './Sidebar.svelte';
	import { sidebarOpen } from '$lib/stores/sidebar';

	let {
		role,
		children,
	}: {
		role: 'admin' | 'teacher' | 'student';
		children?: Snippet;
	} = $props();

	// Prevent body scroll when mobile sidebar is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = $sidebarOpen ? 'hidden' : '';
		}
		return () => {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
			}
		};
	});
</script>

<div class="min-h-screen flex flex-col bg-bgGray">
	<Navbar />
	<div class="flex flex-1 pt-16">
		<Sidebar {role} />
		<main
			id="main-content"
			tabindex="-1"
			class="flex-1 sidebar-collapse:ml-60 p-6 lg:p-8 max-w-app mx-auto w-full focus:outline-none"
		>
			{#if children}{@render children()}{/if}
		</main>
	</div>
</div>
