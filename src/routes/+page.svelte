<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { lhref } from '$lib/i18n';
	import SeoAlternates from '$lib/components/SeoAlternates.svelte';

	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import { assetUrl } from '$lib/api';

	let { data } = $props();

	const benefitColors = [
		'text-primary bg-primary-light',
		'text-teal bg-teal-light',
		'text-primary bg-primary-light',
	];

	const year = new Date().getFullYear();

	// Public search
	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
	let searchQuery = $state('');
	let courseResults = $state<any[]>([]);
	let searchLoading = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;

	async function runSearch(q: string) {
		searchLoading = true;
		try {
			const res = await fetch(`${BASE}/search/courses${q ? `?q=${encodeURIComponent(q)}` : ''}`);
			const courses = res.ok ? await res.json() : [];
			courseResults = Array.isArray(courses) ? courses : [];
		} catch {
			courseResults = [];
		} finally {
			searchLoading = false;
		}
	}

	function handleSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => runSearch(searchQuery), 300);
	}

	onMount(() => runSearch(''));
</script>

<SeoAlternates />

<svelte:head>
	<title>Mutawazin — Online Tutoring Platform</title>
	<meta name="description" content="Mutawazin connects students with verified teachers for group courses and personalized 1-on-1 sessions." />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<Navbar />

	<!-- ── Hero ── -->
	<section
		class="relative overflow-hidden"
		style="background: linear-gradient(135deg, #F0F9FF 0%, #F0FDFA 100%);"
	>
		<div
			class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(1100px 600px at 90% 0%, rgba(13,148,136,.10), transparent 60%);"
			aria-hidden="true"
		></div>

		<div class="relative max-w-content mx-auto px-6 lg:px-12 py-20 lg:py-28">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div>
					<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-light text-teal rounded-pill text-sm font-medium mb-6">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M2 7l10-4 10 4-10 4z"/>
							<path d="M6 9v5c3 3 9 3 12 0V9"/>
						</svg>
						{$t('landing.eyebrow')}
					</div>

					<h1 class="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.15] tracking-[-0.03em] text-text mb-5">
						{$t('landing.h1Part1')}
						<span class="relative inline-block">
							<span class="relative z-10">{$t('landing.h1Accent')}</span>
							<span class="absolute bottom-1 left-0 right-0 h-2.5 bg-teal-light rounded -z-0" aria-hidden="true"></span>
						</span>{$t('landing.h1Part2')}
					</h1>

					<p class="text-[17px] text-text2 max-w-xl leading-relaxed mb-8">
						{$t('landing.subtext')}
					</p>

					<div class="flex flex-wrap gap-3 mb-8">
						<Button variant="primary" size="lg" href={$lhref('/register/student')}>
							{$t('nav.joinStudent')}
						</Button>
						<Button variant="secondary" size="lg" href={$lhref('/register/teacher')}>
							{$t('nav.joinTeacher')}
						</Button>
					</div>

				</div>

				<!-- Right: brand mark -->
				<div class="hidden lg:flex items-start justify-center">
					<img
						src="/brand-kit/png/logo-mark-1024.png"
						alt="Mutawazin"
						class="w-full max-w-lg"
						style="mix-blend-mode: multiply;"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- ── Benefits ── -->
	<section id="about" class="py-24 bg-white">
		<div class="max-w-content mx-auto px-6 lg:px-12">
			<div class="text-center mb-14">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{$t('landing.benefitsEyebrow')}</p>
				<h2 class="text-3xl font-bold tracking-tight mb-4">{$t('landing.benefitsH2')}</h2>
				<p class="text-text2 max-w-lg mx-auto">{$t('landing.benefitsSub')}</p>
			</div>
			<div class="grid md:grid-cols-3 gap-6">
				{#each [
					{ titleKey: 'landing.benefit1Title', bodyKey: 'landing.benefit1Body', i: 0 },
					{ titleKey: 'landing.benefit2Title', bodyKey: 'landing.benefit2Body', i: 1 },
					{ titleKey: 'landing.benefit3Title', bodyKey: 'landing.benefit3Body', i: 2 },
				] as benefit}
					<div class="bg-white border border-border rounded-DEFAULT p-6 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 transition-all duration-150">
						<div class="w-12 h-12 rounded-DEFAULT flex items-center justify-center mb-4 {benefitColors[benefit.i]}">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								{#if benefit.i === 0}
									<path d="M2 3h20v18H2z"/><path d="M12 3v18"/>
								{:else if benefit.i === 1}
									<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
								{:else}
									<polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/>
								{/if}
							</svg>
						</div>
						<h3 class="text-lg font-semibold mb-2">{$t(benefit.titleKey)}</h3>
						<p class="text-sm text-text2 leading-relaxed">{$t(benefit.bodyKey)}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── Search ── -->
	<section id="courses" class="py-24 bg-white border-t border-border">
		<div class="max-w-content mx-auto px-6 lg:px-12">
			<div class="text-center mb-10">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{$t('landing.searchEyebrow')}</p>
				<h2 class="text-3xl font-bold tracking-tight">{$t('landing.searchH2')}</h2>
			</div>

			<!-- Search bar -->
			<div class="flex gap-3 max-w-xl mx-auto mb-8">
				<input
					type="search"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					placeholder={$t('landing.searchPlaceholder')}
					class="flex-1 h-11 px-4 bg-white border border-border rounded-sm text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
				/>
				<button
					onclick={() => runSearch(searchQuery)}
					class="h-11 px-5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-sm transition-colors"
				>
					{$t('landing.searchButton')}
				</button>
			</div>

			<!-- Results -->
			{#if searchLoading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if courseResults.length === 0}
				<p class="text-center text-text2 py-10">
					{searchQuery ? $t('landing.searchEmpty', { values: { q: searchQuery } }) : $t('landing.searchDefaultEmpty')}
				</p>
			{:else}
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{#each courseResults as course}
						<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-5 flex flex-col gap-3">
							<div class="flex flex-wrap gap-1.5">
								<Badge variant="active" label={course.subject} />
								{#each (course.age_categories ?? []) as age}
									<Badge variant="violet" label={age} />
								{/each}
							</div>
							<div class="font-semibold text-base">{course.name}</div>
							{#if course.teachers?.length}
								<div class="flex -space-x-2">
									{#each course.teachers.slice(0, 4) as teacher}
										<Avatar name={teacher.full_name} id={teacher.user_id} size="sm" src={assetUrl(teacher.photo_url)} class="border-2 border-white" />
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- ── Featured Teachers ── -->
	<section id="teachers" class="py-24 bg-bgGray">
		<div class="max-w-content mx-auto px-6 lg:px-12">
			<div class="text-center mb-14">
				<p class="text-xs font-semibold uppercase tracking-widest text-teal mb-2">{$t('landing.teachersEyebrow')}</p>
				<h2 class="text-3xl font-bold tracking-tight mb-4">{$t('landing.teachersH2')}</h2>
				<p class="text-text2 max-w-lg mx-auto">{$t('landing.teachersSub')}</p>
			</div>

			{#if data.featuredTeachers?.length > 0}
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
					{#each data.featuredTeachers.slice(0, 3) as teacher}
						<div class="bg-white border border-border rounded-DEFAULT shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 transition-all duration-150 flex flex-col">
							<div class="p-5 flex-1">
								<div class="flex items-center gap-3 mb-3">
									<Avatar name={teacher.full_name} id={teacher.user_id} size="lg" src={assetUrl(teacher.photo_url)} />
									<div>
										<div class="font-semibold">{teacher.full_name}</div>
										<div class="text-xs text-text2">{$t('common.tutor')}</div>
									</div>
								</div>
								{#if teacher.subjects?.length}
									<div class="flex flex-wrap gap-1.5 mb-3">
										{#each teacher.subjects.slice(0, 3) as subject}
											<Badge variant="teal" label={subject} />
										{/each}
										{#if teacher.is_featured}
											<Badge variant="gold">★ {$t('status.featured')}</Badge>
										{/if}
									</div>
								{/if}
								{#if teacher.bio}
									<p class="text-sm text-text2 line-clamp-2">{teacher.bio}</p>
								{/if}
							</div>
							<div class="px-5 py-3 border-t border-border flex items-center justify-between">
								<span class="text-xs text-text2 tabular">
									{#if teacher.rating}⭐ {teacher.rating}{/if}
								</span>
								<a href={$lhref(`/teachers/${teacher.user_id}`)} class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
									{$t('common.viewProfile')}
								</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-center text-text2 py-10">{$t('landing.teachersEmpty')}</p>
			{/if}

			<div class="text-center">
				<Button variant="secondary" size="lg" href={$lhref('/teachers')}>
					{$t('landing.browseAll')}
				</Button>
			</div>
		</div>
	</section>

	<!-- ── Footer ── -->
	<footer style="background:#0F172A;" class="text-white pt-16 pb-8">
		<div class="max-w-content mx-auto px-6 lg:px-12">
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
				<div class="col-span-2 lg:col-span-1">
					<a href="/" class="inline-flex items-center gap-2 font-bold text-lg mb-4" aria-label="Mutawazin">
						<img src="/brand-kit/svg/mark-light.svg" alt="" class="w-7 h-7 flex-none" aria-hidden="true" />
						Mutawazin
					</a>
					<p class="text-sm max-w-[280px]" style="color:#94A3B8;">{$t('landing.footerAbout')}</p>
				</div>

				{#each [
					{ titleKey: 'landing.footerPlatformTitle', links: [['landing.footerHome', '/'], ['landing.footerCourses', '/courses'], ['landing.footerTeachers', '/teachers']] },
					{ titleKey: 'landing.footerGetStartedTitle', links: [['landing.footerJoinTeacher', '/register/teacher'], ['landing.footerJoinStudent', '/register/student']] },
				] as col}
					<nav aria-label={$t(col.titleKey)}>
						<h3 class="text-[13px] font-semibold uppercase tracking-[0.06em] mb-4">{$t(col.titleKey)}</h3>
						<ul class="flex flex-col gap-2">
							{#each col.links as [key, href]}
								<li>
									<a {href} class="text-sm hover:text-white transition-colors" style="color:#94A3B8;">{$t(key)}</a>
								</li>
							{/each}
						</ul>
					</nav>
				{/each}

				<nav aria-label={$t('landing.footerContact')}>
					<h3 class="text-[13px] font-semibold uppercase tracking-[0.06em] mb-4">{$t('landing.footerContact')}</h3>
					<ul class="flex flex-col gap-2">
						<li>
							<a href="mailto:info@mutawazinprivate.com" class="text-sm hover:text-white transition-colors break-all" style="color:#94A3B8;">{$t('landing.footerEmailUs')}</a>
						</li>
					</ul>
				</nav>
			</div>

			<div class="pt-6 flex items-center justify-between gap-4 flex-wrap" style="border-top:1px solid #1E293B;">
				<p class="text-[13px]" style="color:#94A3B8;">
					{$t('landing.footerCopyright', { values: { year } })}
				</p>
			</div>
		</div>
	</footer>
</div>
