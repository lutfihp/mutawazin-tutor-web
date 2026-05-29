<script lang="ts">
	import { page } from '$app/stores';
	import { t } from 'svelte-i18n';
	import { sidebarOpen } from '$lib/stores/sidebar';
	import { focusTrap } from '$lib/actions/focusTrap';
	import {
		Home,
		User,
		BookOpen,
		Calendar,
		FileText,
		Users,
		Shield,
	} from 'lucide-svelte';
	import { pendingApprovalCount } from '$lib/stores/adminBadge';

	let { role, userId = '' }: { role: 'admin' | 'teacher' | 'student'; userId?: string } = $props();

	type NavItem = {
		id: string;
		labelKey: string;
		href: string;
		icon: typeof Home;
		count?: number;
		sectionLabel?: string;
	};

	const items = $derived(({
		admin: [
			{ id: 'overview',  labelKey: 'nav.overview',   href: '/admin',           icon: Home },
			{ id: 'teachers',  labelKey: 'nav.teachers',   href: '/admin/teachers',  icon: Users },
			{ id: 'students',  labelKey: 'nav.students',   href: '/admin/students',  icon: User },
			{ id: 'subjects',  labelKey: 'nav.subjects',   href: '/admin/subjects',  icon: BookOpen },
			{ id: 'courses',   labelKey: 'nav.courses',    href: '/admin/courses',   icon: BookOpen },
		{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/admin/calendar',             icon: Calendar },
			{ id: 'audit-log', labelKey: 'nav.auditLog',  href: '/admin/settings/audit-log',   icon: Shield, sectionLabel: 'nav.settings' },
		],
		teacher: [
			{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',                  icon: Home },
			{ id: 'profile',   labelKey: 'nav.myProfile',  href: `/teachers/${userId}`,          icon: User },
			{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',                     icon: BookOpen },
			{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',                    icon: Calendar },
			{ id: 'reports',   labelKey: 'nav.reports',    href: '/dashboard#private-students',  icon: FileText },
		],
		student: [
			{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',          icon: Home },
			{ id: 'profile',   labelKey: 'nav.myProfile',  href: `/students/${userId}`, icon: User },
			{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',            icon: BookOpen },
			{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',           icon: Calendar },
			{ id: 'reports',   labelKey: 'nav.myReports',  href: `/reports/${userId}`,  icon: FileText },
		],
	} as Record<'admin' | 'teacher' | 'student', NavItem[]>)[role] ?? []);

	function isActive(href: string): boolean {
		const [path, hash] = href.split('#');
		if (hash) return $page.url.pathname === path && $page.url.hash === `#${hash}`;
		return $page.url.pathname === path && !$page.url.hash;
	}

	function closeSidebar() {
		sidebarOpen.set(false);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeSidebar();
	}
</script>

<!-- Desktop sidebar -->
<aside
	class="hidden sidebar-collapse:flex flex-col fixed left-0 top-16 bottom-0 w-60 bg-bgGray border-r border-border overflow-y-auto z-30"
	aria-label="Sidebar navigation"
>
	<nav class="p-3 flex flex-col gap-0.5">
		<p class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-text2">
			{role === 'admin' ? 'Admin' : 'Menu'}
		</p>
		{#each items as item}
			{#if item.sectionLabel}
				<p class="px-3 py-1.5 mt-2 text-[11px] font-semibold uppercase tracking-widest text-text2">
					{$t(item.sectionLabel)}
				</p>
			{/if}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				class="relative flex items-center gap-2.5 h-10 px-3 rounded-sm text-sm font-medium transition-colors
				       {active
					? 'bg-primary-light text-primary-dark font-semibold'
					: 'text-text2 hover:text-text hover:bg-border/50'}"
				aria-current={active ? 'page' : undefined}
			>
				{#if active}
					<span class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" aria-hidden="true"></span>
				{/if}
				<item.icon size={18} aria-hidden="true" />
				{$t(item.labelKey)}
				{#if item.id === 'approvals' && $pendingApprovalCount > 0}
					<span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
						{$pendingApprovalCount}
					</span>
				{:else if item.id !== 'approvals' && item.count && item.count > 0}
					<span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
						{item.count}
					</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>

<!-- Mobile drawer -->
{#if $sidebarOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="sidebar-collapse:hidden fixed inset-0 z-40 bg-text/40"
		onclick={closeSidebar}
		onkeydown={handleKeydown}
		role="presentation"
		aria-hidden="true"
	></div>
	<div
		id="sidebar-drawer"
		class="sidebar-collapse:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-lg flex flex-col"
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		use:focusTrap
	>
		<div class="flex items-center justify-between px-4 h-16 border-b border-border">
			<span class="font-bold text-base">Menu</span>
			<button
				onclick={closeSidebar}
				class="w-9 h-9 flex items-center justify-center rounded-sm text-text2 hover:text-text hover:bg-bgGray"
				aria-label="Close navigation menu"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>
		<nav class="p-3 flex flex-col gap-0.5 overflow-y-auto flex-1">
			{#each items as item}
				{#if item.sectionLabel}
					<p class="px-3 py-1.5 mt-2 text-[11px] font-semibold uppercase tracking-widest text-text2">
						{$t(item.sectionLabel)}
					</p>
				{/if}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					onclick={closeSidebar}
					class="relative flex items-center gap-2.5 h-11 px-3 rounded-sm text-sm font-medium transition-colors
					       {active
						? 'bg-primary-light text-primary-dark font-semibold'
						: 'text-text2 hover:text-text hover:bg-bgGray'}"
					aria-current={active ? 'page' : undefined}
				>
					{#if active}
						<span class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" aria-hidden="true"></span>
					{/if}
					<item.icon size={18} aria-hidden="true" />
					{$t(item.labelKey)}
				</a>
			{/each}
		</nav>
	</div>
{/if}
