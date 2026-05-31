<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/auth';
	import { sidebarOpen } from '$lib/stores/sidebar';
	import { setLang, type Lang } from '$lib/i18n';
	import { locale, t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	import { Menu, X } from 'lucide-svelte';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';

	let scrolled = $state(false);
	let currentLang = $derived($locale === 'id' ? 'id' : 'en');

	let profileName = $state('');
	let profileSrc = $state('');

	function handleScroll() {
		scrolled = window.scrollY > 4;
	}

	function toggleSidebar() {
		sidebarOpen.update((v) => !v);
	}

	function switchLang(lang: Lang) {
		setLang(lang);
	}

	const isLanding = $derived(!$user);

	async function logout() {
		try { await api.post('/auth/logout', {}); } catch {}
		user.set(null);
		goto('/');
	}

	onMount(async () => {
		if (!$user || $user.role === 'admin') return;
		try {
			const endpoint = $user.role === 'teacher'
				? `/teachers/${$user.id}`
				: `/students/${$user.id}`;
			const profile = await api.get<{ full_name?: string; photo_url?: string }>(endpoint);
			profileName = profile?.full_name ?? '';
			profileSrc = profile?.photo_url ?? '';
		} catch {
			// Avatar renders as blank colored circle — acceptable fallback
		}
	});
</script>

<svelte:window onscroll={handleScroll} />

<header
	class="sticky top-0 z-40 h-16 flex items-center gap-4 px-6
	       {isLanding
		? `bg-white/80 backdrop-blur-md transition-shadow duration-150 ${scrolled ? 'border-b border-border shadow-sm' : ''}`
		: 'bg-white border-b border-border'}"
>
	<!-- Hamburger (authenticated, mobile only) -->
	{#if $user}
		<button
			onclick={toggleSidebar}
			class="sidebar-collapse:hidden w-9 h-9 flex items-center justify-center rounded-sm text-text2 hover:text-text hover:bg-bgGray transition-colors"
			aria-label={$sidebarOpen ? $t('common.close') + ' navigation menu' : 'Open navigation menu'}
			aria-expanded={$sidebarOpen}
			aria-controls="sidebar-drawer"
		>
			{#if $sidebarOpen}
				<X size={20} aria-hidden="true" />
			{:else}
				<Menu size={20} aria-hidden="true" />
			{/if}
		</button>
	{/if}

	<Logo />

	<!-- Landing nav links (desktop only) -->
	{#if isLanding}
		<nav class="hidden nav-collapse:flex items-center gap-1 ml-4" aria-label="Main navigation">
			<a href="/" class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">{$t('nav.home')}</a>
			<a href="/#courses" class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">{$t('nav.courses')}</a>
			<a href="/#teachers" class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">{$t('nav.teachers')}</a>
			<a href="/#about" class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">{$t('nav.about')}</a>
		</nav>
	{/if}

	<div class="flex-1"></div>

	<!-- Language switcher -->
	<div
		class="inline-flex bg-bgGray border border-border rounded-pill p-0.5 gap-0.5"
		role="group"
		aria-label="Language selection"
	>
		{#each (['en', 'id'] as Lang[]) as lang}
			<button
				onclick={() => switchLang(lang)}
				class="px-2.5 py-1 text-xs font-medium rounded-pill transition-all duration-120
				       {currentLang === lang
					? 'bg-white text-text shadow-sm'
					: 'text-text2 hover:text-text'}"
				aria-pressed={currentLang === lang}
				aria-label={lang === 'en' ? 'English' : 'Bahasa Indonesia'}
			>
				{lang.toUpperCase()}
			</button>
		{/each}
	</div>

	<!-- Authenticated: avatar + logout -->
	{#if $user}
		{#if $user.role !== 'admin'}
			{@const profileHref = $user.role === 'teacher' ? `/teachers/${$user.id}` : `/students/${$user.id}`}
			<a href={profileHref} class="flex-none rounded-pill focus-visible:ring-2 focus-visible:ring-primary" aria-label="My profile">
				<Avatar name={profileName} src={profileSrc} id={$user.id} size="sm" />
			</a>
		{/if}
		<button
			onclick={logout}
			class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors"
		>
			{$t('nav.logout')}
		</button>
	{:else}
		<!-- Landing CTAs -->
		<a href="/login" class="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">
			{$t('nav.login')}
		</a>
	{/if}
</header>
