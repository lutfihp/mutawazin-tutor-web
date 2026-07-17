<script lang="ts">
	import { page } from '$app/stores';
	import { stripLangPrefix } from '$lib/i18n';

	// $page.url keeps the original /en prefix (reroute only changes matching).
	// Cast: SvelteKit types pathname as the known-routes union, which never
	// includes /en because reroute strips it before matching.
	const pathname = $derived($page.url.pathname as string);
	const base = $derived(stripLangPrefix(pathname));
	const isEn = $derived(pathname === '/en' || pathname.startsWith('/en/'));
	const idUrl = $derived($page.url.origin + base);
	const enUrl = $derived($page.url.origin + (base === '/' ? '/en' : `/en${base}`));
</script>

<svelte:head>
	<!-- Each language version is its own canonical (alternates, not duplicates). -->
	<link rel="canonical" href={isEn ? enUrl : idUrl} />
	<link rel="alternate" hreflang="id" href={idUrl} />
	<link rel="alternate" hreflang="en" href={enUrl} />
	<link rel="alternate" hreflang="x-default" href={idUrl} />
</svelte:head>
