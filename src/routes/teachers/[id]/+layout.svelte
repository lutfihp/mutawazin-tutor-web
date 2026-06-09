<script lang="ts">
	import type { Snippet } from 'svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';

	let { data, children }: { data: App.PageData; children?: Snippet } = $props();
</script>

<div class="min-h-screen bg-bgGray">
	<Navbar />
	<main id="main-content" tabindex="-1" class="max-w-profile mx-auto px-6 py-10">
		{#if children}{@render children()}{/if}
	</main>
</div>
