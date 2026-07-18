<script lang="ts">
	import { page } from '$app/stores';
	import { stripLangPrefix } from '$lib/i18n';

	let {
		title = '',
		description = '',
		image = '/brand-kit/png/social-card-1200x630.png',
	}: { title?: string; description?: string; image?: string } = $props();

	// $page.url keeps the original /en prefix (reroute only changes matching).
	// Cast: SvelteKit types pathname as the known-routes union, which never
	// includes /en because reroute strips it before matching.
	const pathname = $derived($page.url.pathname as string);
	const base = $derived(stripLangPrefix(pathname));
	const isEn = $derived(pathname === '/en' || pathname.startsWith('/en/'));
	const idUrl = $derived($page.url.origin + base);
	const enUrl = $derived($page.url.origin + (base === '/' ? '/en' : `/en${base}`));
	const pageUrl = $derived(isEn ? enUrl : idUrl);
	const imageUrl = $derived(image.startsWith('http') ? image : $page.url.origin + image);
</script>

<svelte:head>
	<!-- Each language version is its own canonical (alternates, not duplicates). -->
	<link rel="canonical" href={pageUrl} />
	<link rel="alternate" hreflang="id" href={idUrl} />
	<link rel="alternate" hreflang="en" href={enUrl} />
	<link rel="alternate" hreflang="x-default" href={idUrl} />
	{#if description}
		<meta name="description" content={description} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Mutawazin" />
		<meta property="og:title" content={title || 'Mutawazin'} />
		<meta property="og:description" content={description} />
		<meta property="og:url" content={pageUrl} />
		<meta property="og:image" content={imageUrl} />
		<meta property="og:locale" content={isEn ? 'en_US' : 'id_ID'} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={title || 'Mutawazin'} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:image" content={imageUrl} />
	{/if}
</svelte:head>
