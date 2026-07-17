<script lang="ts">
	import { t } from 'svelte-i18n';
	import { lhref } from '$lib/i18n';
	import SeoAlternates from '$lib/components/SeoAlternates.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { assetUrl } from '$lib/api';

	let { data } = $props();
	const teachers = $derived(data.featuredTeachers ?? []);
</script>

<SeoAlternates />

<svelte:head>
	<title>{$t('nav.teachers')} — Mutawazin</title>
	<meta name="description" content="Browse featured Mutawazin teachers." />
</svelte:head>

<div class="min-h-screen flex flex-col bg-bgGray">
	<Navbar />

	<main class="max-w-content mx-auto px-6 lg:px-12 py-12 w-full">
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight">{$t('nav.teachers')}</h1>
			<p class="text-text2 mt-1">{$t('landing.teachersSub')}</p>
		</div>

		{#if teachers.length === 0}
			<p class="text-center text-text2 py-20">{$t('common.noResults')}</p>
		{:else}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each teachers as teacher}
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
								{#if teacher.average_rating && (teacher.total_ratings ?? 0) > 0}
									⭐ {Number(teacher.average_rating).toFixed(1)}
								{/if}
							</span>
							<a
								href={$lhref(`/teachers/${teacher.user_id}`)}
								class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
							>
								{$t('common.viewProfile')}
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-10 text-center">
			<Button variant="secondary" href={$lhref('/')}>{$t('landing.footerHome')} ←</Button>
		</div>
	</main>
</div>
