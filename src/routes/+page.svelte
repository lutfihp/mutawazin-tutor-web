<script lang="ts">
	import { t } from 'svelte-i18n';
	import { avatarColor } from '$lib/utils/avatar';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	let { data } = $props();

	const benefitColors = [
		'text-primary bg-primary-light',
		'text-teal bg-teal-light',
		'text-primary bg-primary-light',
	];

	const year = new Date().getFullYear();
</script>

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
						<Button variant="primary" size="lg" href="/register/student">
							{$t('nav.joinStudent')}
						</Button>
						<Button variant="secondary" size="lg" href="/register/teacher">
							{$t('nav.joinTeacher')}
						</Button>
					</div>

					<div class="flex items-center gap-3">
						<div class="flex -space-x-2" aria-hidden="true">
							{#each ['#2563EB', '#0D9488', '#7C3AED', '#E11D48'] as color}
								<span class="w-7 h-7 rounded-pill border-2 border-white" style="background: {color};"></span>
							{/each}
						</div>
						<p class="text-[13px] text-text2">
							{$t('landing.trustedBy', {
								values: {
									students: $t('landing.trustedStudents'),
									teachers: $t('landing.trustedTeachers'),
								},
							})}
						</p>
					</div>
				</div>

				<!-- Right: UI vignette -->
				<div class="relative hidden lg:block" style="aspect-ratio: 5/4.4;" aria-hidden="true">
					<!-- Teacher card -->
					<div class="absolute top-0 left-0 w-[62%] bg-white rounded-DEFAULT shadow-md p-4 border border-border">
						<div class="flex items-center gap-3 mb-3">
							<span class="w-10 h-10 rounded-pill flex items-center justify-center text-sm font-semibold text-white" style="background:#0D9488;">LH</span>
							<div>
								<div class="font-semibold text-sm">{$t('landing.heroTeacherCard.name')}</div>
								<div class="text-xs text-text2">{$t('landing.heroTeacherCard.role')}</div>
							</div>
						</div>
						<div class="flex gap-1.5 mb-2 flex-wrap">
							<Badge variant="teal" label="Algebra" />
							<Badge variant="teal" label="Calculus" />
							<Badge variant="gold">★ {$t('status.featured')}</Badge>
						</div>
						<div class="text-xs text-text2">⭐⭐⭐⭐⭐ {$t('landing.heroTeacherCard.rating')}</div>
					</div>

					<!-- Progress card -->
					<div class="absolute rounded-DEFAULT p-4 text-white" style="background:#2563EB; top:22%; right:0; width:44%;">
						<div class="text-xs font-medium opacity-80 mb-1">{$t('landing.heroProgressCard.title')}</div>
						<div class="text-xl font-bold mb-2">{$t('landing.heroProgressCard.progress')}</div>
						<div class="h-1.5 bg-white/25 rounded-full mb-1.5">
							<div class="h-1.5 bg-white rounded-full" style="width:72%;"></div>
						</div>
						<div class="text-xs opacity-70">{$t('landing.heroProgressCard.sub')}</div>
					</div>

					<!-- Session card -->
					<div class="absolute bottom-0 bg-white rounded-DEFAULT shadow-md p-4 border border-border" style="right:5%; width:56%;">
						<div class="flex items-center gap-2 mb-2">
							<Badge variant="active" label={$t('landing.heroSessionCard.badge')} />
							<span class="text-[11px] text-text2">{$t('landing.heroSessionCard.when')}</span>
						</div>
						<div class="font-semibold text-sm mb-1">{$t('landing.heroSessionCard.title')}</div>
						<div class="text-xs text-text2 mb-2">{$t('landing.heroSessionCard.with')}</div>
						<div class="flex items-center justify-between">
							<Badge variant="success" label={$t('landing.heroSessionCard.status')} />
							<a href="/courses" class="text-xs font-semibold text-primary hover:text-primary-dark">{$t('landing.heroSessionCard.cta')}</a>
						</div>
					</div>
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
					{#each data.featuredTeachers as teacher}
						<div class="bg-white border border-border rounded-DEFAULT shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 transition-all duration-150 flex flex-col">
							<div class="p-5 flex-1">
								<div class="flex items-center gap-3 mb-3">
									<Avatar name={teacher.full_name} id={teacher.user_id} size="lg" src={teacher.photo_url} />
									<div>
										<div class="font-semibold">{teacher.full_name}</div>
										<div class="text-xs text-text2">Tutor</div>
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
								<a href="/teachers/{teacher.user_id}" class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
									{$t('common.viewProfile')}
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="text-center">
				<Button variant="secondary" size="lg" href="/teachers">
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
						<span class="relative w-7 h-7 rounded-sm overflow-hidden grid place-items-center" style="background:#2563EB;">
							<span class="absolute inset-x-0 bottom-0 h-1/2" style="background:#0D9488;"></span>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="relative z-10" aria-hidden="true">
								<path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
							</svg>
						</span>
						Mutawazin
					</a>
					<p class="text-sm max-w-[280px]" style="color:#94A3B8;">{$t('landing.footerAbout')}</p>
				</div>

				{#each [
					{ titleKey: 'landing.footerPlatformTitle', links: [['landing.footerHome', '/'], ['landing.footerCourses', '/courses'], ['landing.footerTeachers', '/teachers']] },
					{ titleKey: 'landing.footerGetStartedTitle', links: [['landing.footerJoinTeacher', '/register/teacher'], ['landing.footerJoinStudent', '/register/student']] },
					{ titleKey: 'landing.footerCompanyTitle', links: [['landing.footerBlog', '#'], ['landing.footerContact', '#'], ['landing.footerPrivacy', '#']] },
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
			</div>

			<div class="pt-6 flex items-center justify-between gap-4 flex-wrap" style="border-top:1px solid #1E293B;">
				<p class="text-[13px]" style="color:#94A3B8;">
					{$t('landing.footerCopyright', { values: { year } })}
				</p>
			</div>
		</div>
	</footer>
</div>
