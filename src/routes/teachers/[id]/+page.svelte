<script lang="ts">
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();
	const profile = $derived(data.profile);
	const isOwn = $derived(data.user?.id === profile?.user_id);

	let editMode = $state(false);
	let editingBio = $state(false);
	let bioValue = $state(profile?.bio ?? '');
	let savingBio = $state(false);

	// New profile fields
	let teachingMode = $state<'online' | 'offline' | 'both'>(profile?.teaching_mode ?? 'online');
	let city = $state(profile?.city ?? '');
	let methodInput = $state('');
	let teachingMethods = $state<string[]>(profile?.teaching_methods ?? []);
	let university = $state(profile?.university ?? '');
	let achievements = $state<string[]>(profile?.achievements ?? []);
	let experience = $state<Array<{ year_from: number; year_to: number | null; subject: string }>>(profile?.teaching_experience ?? []);
	let savingDetails = $state(false);

	function addMethod() {
		const val = methodInput.trim();
		if (val && !teachingMethods.includes(val)) teachingMethods = [...teachingMethods, val];
		methodInput = '';
	}

	function removeMethod(i: number) { teachingMethods = teachingMethods.filter((_, idx) => idx !== i); }
	function addExperience() { experience = [...experience, { year_from: new Date().getFullYear(), year_to: null, subject: '' }]; }
	function removeExperience(i: number) { experience = experience.filter((_, idx) => idx !== i); }

	async function saveDetails() {
		savingDetails = true;
		try {
			await api.put('/teachers/me', {
				teaching_mode: teachingMode,
				city: city || undefined,
				teaching_methods: teachingMethods,
				university: university || undefined,
				achievements: achievements.filter(Boolean),
				teaching_experience: experience.filter((e) => e.subject),
			});
		} finally {
			savingDetails = false;
		}
	}

	async function saveBio() {
		savingBio = true;
		try {
			await api.put('/teachers/me', { bio: bioValue });
		} finally {
			savingBio = false;
			editingBio = false;
		}
	}

	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		api.upload('/teachers/me/photo', fd);
	}
</script>

<svelte:head>
	<title>{profile?.full_name ?? 'Teacher Profile'} — Mutawazin</title>
</svelte:head>

<div class="max-w-profile mx-auto py-8">
	{#if !profile}
		<p class="text-text2 text-center py-20">Teacher not found.</p>
	{:else}
		<!-- Own-edit toggle -->
		{#if isOwn}
			<div class="flex justify-end mb-4">
				<div class="inline-flex bg-bgGray border border-border rounded-pill p-0.5 gap-0.5" role="tablist">
					{#each [{ key: false, label: $t('profile.teacher.publicPreview') }, { key: true, label: $t('profile.teacher.editView') }] as tab}
						<button
							role="tab"
							aria-selected={editMode === tab.key}
							onclick={() => (editMode = tab.key)}
							class="px-3 py-1.5 text-sm font-medium rounded-pill transition-colors {editMode === tab.key ? 'bg-white text-text shadow-sm' : 'text-text2 hover:text-text'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Profile header -->
		<div class="flex flex-wrap gap-5 items-start mb-8">
			<div class="relative flex-none">
				<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={profile.photo_url} />
				{#if isOwn && editMode}
					<label
						class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-pill flex items-center justify-center cursor-pointer border-2 border-white hover:bg-primary-dark transition-colors"
						aria-label="Upload photo"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
							<circle cx="12" cy="13" r="4"/>
						</svg>
						<input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} />
					</label>
				{/if}
			</div>

			<div class="flex-1 min-w-0">
				<div class="flex flex-wrap items-center gap-3 mb-2">
					<h1 class="text-[32px] font-bold tracking-tight">{profile.full_name}</h1>
					{#if profile.is_featured}
						<Badge variant="gold">★ {$t('status.featured')}</Badge>
					{/if}
				</div>
				<div class="flex flex-wrap gap-1.5 mb-3">
					{#each (profile.subjects ?? []) as subject}
						<Badge variant="teal" label={subject} />
					{/each}
				</div>
				<p class="text-sm text-text2">
					{$t('profile.teacher.yearsExperience', { values: { n: profile.years_experience ?? 0 } })}
					·
					{$t('profile.teacher.sessionsCompleted', { values: { n: profile.sessions_completed ?? 0 } })}
				</p>
				{#if (profile.total_ratings ?? 0) > 0}
					<p class="text-sm text-text2 mt-1">
						{'★'.repeat(Math.round(profile.average_rating ?? 0))}{'☆'.repeat(5 - Math.round(profile.average_rating ?? 0))}
						{$t('profile.teacher.rating', { values: { rating: (profile.average_rating ?? 0).toFixed(1), count: profile.total_ratings } })}
					</p>
				{/if}
			</div>

			{#if !isOwn}
				<div class="flex gap-2">
					<Button variant="secondary">Message</Button>
					<Button variant="primary">{$t('profile.teacher.bookSession')}</Button>
				</div>
			{/if}
		</div>

		<!-- About -->
		<Card padding="lg" class="mb-4">
			<div class="flex items-start justify-between gap-4">
				<h2 class="font-semibold text-lg">{$t('profile.teacher.about')}</h2>
				{#if isOwn && editMode && !editingBio}
					<button onclick={() => (editingBio = true)} class="text-text2 hover:text-text transition-colors" aria-label="Edit bio">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
						</svg>
					</button>
				{/if}
			</div>
			{#if editingBio}
				<textarea
					bind:value={bioValue}
					rows={4}
					class="w-full mt-3 bg-white border border-primary rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-primary/15"
					aria-label="Bio"
				></textarea>
				<div class="flex gap-2 mt-2">
					<Button variant="primary" size="sm" loading={savingBio} onclick={saveBio}>{$t('common.save')}</Button>
					<Button variant="ghost" size="sm" onclick={() => (editingBio = false)}>{$t('common.cancel')}</Button>
				</div>
			{:else}
				<p class="mt-3 text-[15px] leading-relaxed text-text2">{bioValue || profile.bio}</p>
			{/if}
		</Card>

		<!-- Credentials -->
		<Card padding="lg" class="mb-4">
			<h2 class="font-semibold text-lg mb-4">{$t('profile.teacher.credentials')}</h2>
			{#if profile.credentials?.length}
				<div class="flex flex-col divide-y divide-border">
					{#each profile.credentials as cred}
						<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
							<div class="w-8 h-8 bg-primary-light text-primary rounded-sm flex items-center justify-center flex-none">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									<path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9v5c3 3 9 3 12 0V9"/>
								</svg>
							</div>
							<div>
								<div class="font-semibold text-sm">{cred.title}</div>
								<div class="text-xs text-text2">{cred.institution} · {cred.year}</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text2">{$t('profile.teacher.noCredentials')}</p>
			{/if}
		</Card>

		<!-- Current Courses -->
		<!-- Details edit card (own edit mode only) -->
		{#if isOwn && editMode}
			<Card padding="lg" class="mb-4">
				<h2 class="font-semibold text-lg mb-4">{$t('profile.teacher.teachingMode')}</h2>
				<div class="flex flex-col gap-4">
					<div class="flex gap-2">
						{#each [['online', $t('profile.teacher.modeOnline')], ['offline', $t('profile.teacher.modeOffline')], ['both', $t('profile.teacher.modeBoth')]] as [val, label]}
							<button type="button" onclick={() => (teachingMode = val as typeof teachingMode)}
								class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
								       {teachingMode === val ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
								{label}
							</button>
						{/each}
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="teacherCity" class="text-[13px] font-medium">{$t('profile.teacher.city')}</label>
						<input id="teacherCity" type="text" bind:value={city} placeholder={$t('profile.teacher.cityPlaceholder')}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="teacherUni" class="text-[13px] font-medium">{$t('profile.teacher.university')}</label>
						<input id="teacherUni" type="text" bind:value={university} placeholder={$t('profile.teacher.universityPlaceholder')}
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="methodInput" class="text-[13px] font-medium">{$t('profile.teacher.teachingMethods')}</label>
						<div class="flex flex-wrap gap-1.5 items-center p-2 border border-border rounded-sm bg-white min-h-[44px] focus-within:border-primary">
							{#each teachingMethods as method, i}
								<span class="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 bg-primary-light text-primary-dark text-xs font-medium rounded-pill">
									{method}
									<button type="button" onclick={() => removeMethod(i)} class="w-4 h-4 grid place-items-center" aria-label="Remove">×</button>
								</span>
							{/each}
							<input id="methodInput" type="text" bind:value={methodInput}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addMethod(); } }}
								onblur={addMethod}
								placeholder={$t('profile.teacher.teachingMethodsPlaceholder')}
								class="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm placeholder:text-text3" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<p class="text-[13px] font-medium">{$t('profile.teacher.achievements')}</p>
						{#each achievements as ach, i}
							<div class="flex gap-2">
								<input type="text" bind:value={achievements[i]}
									class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
								<button type="button" onclick={() => (achievements = achievements.filter((_, idx) => idx !== i))}
									class="px-2 text-text2 hover:text-error" aria-label="Remove">×</button>
							</div>
						{/each}
						<button type="button" onclick={() => (achievements = [...achievements, ''])}
							class="text-sm font-semibold text-primary hover:text-primary-dark text-left">{$t('profile.teacher.addAchievement')}</button>
					</div>
					<div class="flex flex-col gap-2">
						<p class="text-[13px] font-medium">{$t('profile.teacher.experience')}</p>
						{#each experience as exp, i}
							<div class="grid grid-cols-[80px_80px_1fr_auto] gap-2 items-center">
								<input type="number" bind:value={exp.year_from} placeholder="2020" aria-label="Year from"
									class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
								<input type="number" bind:value={exp.year_to} placeholder={$t('profile.teacher.experiencePresent')} aria-label="Year to"
									class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
								<input type="text" bind:value={exp.subject} placeholder="e.g. Mathematics" aria-label="Subject"
									class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary" />
								<button type="button" onclick={() => removeExperience(i)} class="px-2 text-text2 hover:text-error" aria-label="Remove">×</button>
							</div>
						{/each}
						<button type="button" onclick={addExperience}
							class="text-sm font-semibold text-primary hover:text-primary-dark text-left">{$t('profile.teacher.addExperience')}</button>
					</div>
					<div class="flex gap-2 pt-2">
						<Button variant="primary" size="sm" loading={savingDetails} onclick={saveDetails}>{$t('common.save')}</Button>
					</div>
				</div>
			</Card>
		{/if}

		<!-- Public details (mode/city/achievements/experience) -->
		{#if profile.teaching_mode || profile.city || profile.achievements?.length || profile.teaching_experience?.length}
			<Card padding="lg" class="mb-4">
				<div class="flex flex-col gap-3 text-sm">
					{#if profile.teaching_mode}
						<div class="flex gap-2 items-center">
							<span class="text-text2 min-w-[110px]">{$t('profile.teacher.teachingMode')}</span>
							<Badge variant="active" label={$t(`profile.teacher.mode${profile.teaching_mode.charAt(0).toUpperCase() + profile.teaching_mode.slice(1)}`)} />
						</div>
					{/if}
					{#if profile.city}
						<div class="flex gap-2">
							<span class="text-text2 min-w-[110px]">{$t('profile.teacher.city')}</span>
							<span>{profile.city}</span>
						</div>
					{/if}
					{#if profile.achievements?.length}
						<div>
							<p class="text-text2 mb-1">{$t('profile.teacher.achievements')}</p>
							<ul class="list-disc list-inside flex flex-col gap-0.5 text-text2">
								{#each profile.achievements as ach}<li>{ach}</li>{/each}
							</ul>
						</div>
					{/if}
					{#if profile.teaching_experience?.length}
						<div>
							<p class="text-text2 mb-1">{$t('profile.teacher.experience')}</p>
							<div class="flex flex-col gap-1">
								{#each profile.teaching_experience as exp}
									<div class="text-text2">
										<span class="font-medium text-text">{exp.subject}</span>
										· {exp.year_from}–{exp.year_to ?? $t('profile.teacher.experiencePresent')}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</Card>
		{/if}

		<Card padding="lg">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold text-lg">{$t('profile.teacher.currentCourses')}</h2>
				{#if isOwn && editMode}
					<Button variant="secondary" size="sm" href="/courses">{$t('profile.teacher.newCourse')}</Button>
				{/if}
			</div>
			{#if profile.courses?.length}
				<div class="grid sm:grid-cols-2 gap-3">
					{#each profile.courses as course}
						<div class="border border-border rounded-sm p-3 relative">
							<Badge variant="active" label={course.subject} class="mb-2" />
							<div class="font-medium text-sm">{course.title}</div>
							{#if course.age_category}
								<Badge variant="violet" label={course.age_category} class="mt-1" />
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text2">{$t('profile.teacher.noCourses')}</p>
			{/if}
		</Card>
	{/if}
</div>
