<script lang="ts">
	import type { Snippet } from 'svelte';
	import Navbar from './Navbar.svelte';
	import Sidebar from './Sidebar.svelte';
	import { sidebarOpen } from '$lib/stores/sidebar';

	let {
		role,
		userId = '',
		children,
	}: {
		role: 'admin' | 'teacher' | 'student';
		userId?: string;
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
		<Sidebar {role} {userId} />
		<main
			id="main-content"
			tabindex="-1"
			class="flex-1 min-w-0 sidebar-collapse:ml-60 p-4 sm:p-6 lg:p-8 focus:outline-none"
		>
			<div class="max-w-app mx-auto">
				{#if children}{@render children()}{/if}
			</div>
		</main>
	</div>
</div>
