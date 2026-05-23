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

	// ── Bio
	let editingBio = $state(false);
	let bioValue = $state(profile?.bio ?? '');
	let savingBio = $state(false);

	// ── University
	let editingUniversity = $state(false);
	let universityValue = $state(profile?.university ?? '');
	let savingUniversity = $state(false);

	// ── Teaching Experience
	let editingExperience = $state(false);
	let experienceValue = $state<Array<{ year_from: number; year_to: number | null; subject: string }>>(
		profile?.teaching_experience ?? []
	);
	let savingExperience = $state(false);

	// ── Achievements
	let editingAchievements = $state(false);
	let achievementsValue = $state<string[]>(profile?.achievements ?? []);
	let savingAchievements = $state(false);

	// ── Teaching Info (mode + city)
	let editingTeachingInfo = $state(false);
	let teachingModeValue = $state<string>(profile?.teaching_mode ?? 'online');
	let cityValue = $state(profile?.city ?? '');
	let savingTeachingInfo = $state(false);

	// ── Mutual exclusion: only one section editable at a time
	function openSection(name: 'bio' | 'university' | 'experience' | 'achievements' | 'teachingInfo') {
		editingBio = name === 'bio';
		editingUniversity = name === 'university';
		editingExperience = name === 'experience';
		editingAchievements = name === 'achievements';
		editingTeachingInfo = name === 'teachingInfo';
	}

	// ── Mode display
	const modeLabel = $derived(
		profile?.teaching_mode === 'offline' ? $t('profile.teacher.modeOffline') :
		profile?.teaching_mode === 'both' ? $t('profile.teacher.modeBoth') :
		$t('profile.teacher.modeOnline')
	);

	// ── Save functions
	async function saveBio() {
		savingBio = true;
		try {
			await api.put('/teachers/me', { bio: bioValue });
			editingBio = false;
		} finally {
			savingBio = false;
		}
	}

	async function saveUniversity() {
		savingUniversity = true;
		try {
			await api.put('/teachers/me', { university: universityValue || undefined });
			editingUniversity = false;
		} finally {
			savingUniversity = false;
		}
	}

	async function saveExperience() {
		savingExperience = true;
		try {
			await api.put('/teachers/me', {
				teaching_experience: experienceValue.filter((e) => e.subject)
			});
			editingExperience = false;
		} finally {
			savingExperience = false;
		}
	}

	async function saveAchievements() {
		savingAchievements = true;
		try {
			await api.put('/teachers/me', { achievements: achievementsValue.filter(Boolean) });
			editingAchievements = false;
		} finally {
			savingAchievements = false;
		}
	}

	async function saveTeachingInfo() {
		savingTeachingInfo = true;
		try {
			await api.put('/teachers/me', {
				teaching_mode: teachingModeValue || undefined,
				city: cityValue || undefined,
			});
			editingTeachingInfo = false;
		} finally {
			savingTeachingInfo = false;
		}
	}

	// ── Experience helpers
	function addExperience() {
		experienceValue = [...experienceValue, { year_from: new Date().getFullYear(), year_to: null, subject: '' }];
	}
	function removeExperience(i: number) {
		experienceValue = experienceValue.filter((_, idx) => idx !== i);
	}

	// ── Photo upload
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

		<!-- ── Profile Header ── -->
		<Card padding="lg" class="mb-4">
			<div class="flex gap-5 items-start">
				<div class="relative flex-none">
					<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={profile.photo_url} />
					{#if isOwn}
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
					<h1 class="text-[26px] font-bold tracking-tight mb-2">{profile.full_name}</h1>
					<div class="flex flex-wrap gap-1.5 mb-2">
						{#if profile.is_featured}
							<Badge variant="gold">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
							{$t('status.featured')}
						</Badge>
						{/if}
						{#each (profile.subjects ?? []) as subject}
							<Badge variant="teal" label={subject} />
						{/each}
					</div>
					<p class="text-sm text-text2">
						{$t('profile.teacher.yearsExperience', { values: { n: profile.years_experience ?? 0 } })}
						·
						{$t('profile.teacher.sessionsCompleted', { values: { n: profile.sessions_completed ?? 0 } })}
						{#if (profile.total_ratings ?? 0) > 0}
							· <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="inline-block align-middle" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
							{$t('profile.teacher.rating', { values: { rating: (profile.average_rating ?? 0).toFixed(1), count: profile.total_ratings } })}
						{/if}
					</p>
					{#if profile.teaching_mode || profile.city || isOwn}
						<hr class="border-border mt-3 mb-3" />
						{#if editingTeachingInfo}
							<div class="flex flex-wrap gap-2 items-center">
								<select
									bind:value={teachingModeValue}
									class="bg-white border border-primary rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
								>
									<option value="online">{$t('profile.teacher.modeOnline')}</option>
									<option value="offline">{$t('profile.teacher.modeOffline')}</option>
									<option value="both">{$t('profile.teacher.modeBoth')}</option>
								</select>
								<input
									type="text"
									bind:value={cityValue}
									placeholder={$t('profile.teacher.cityPlaceholder')}
									class="bg-white border border-border rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"
								/>
								<Button variant="primary" size="sm" loading={savingTeachingInfo} onclick={saveTeachingInfo}>{$t('common.save')}</Button>
								<Button variant="ghost" size="sm" onclick={() => {
									editingTeachingInfo = false;
									teachingModeValue = profile?.teaching_mode ?? 'online';
									cityValue = profile?.city ?? '';
								}}>{$t('common.cancel')}</Button>
							</div>
						{:else}
							<div class="flex flex-wrap gap-2 items-center">
								{#if profile.teaching_mode}
									<Badge variant="active">
										<svg
											width="12" height="12" viewBox="0 0 24 24"
											fill="none" stroke="currentColor" stroke-width="2"
											stroke-linecap="round" stroke-linejoin="round"
											class="inline-block align-middle -mt-px{profile.teaching_mode === 'offline' ? ' opacity-50' : ''}"
											aria-hidden="true"
										>
											<circle cx="12" cy="12" r="10"/>
											<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
										</svg>
										{modeLabel}
									</Badge>
								{/if}
								{#if profile.city}
									<Badge variant="teal">
										<svg
											width="12" height="12" viewBox="0 0 24 24"
											fill="none" stroke="currentColor" stroke-width="2"
											stroke-linecap="round" stroke-linejoin="round"
											class="inline-block align-middle -mt-px" aria-hidden="true"
										>
											<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
											<circle cx="12" cy="10" r="3"/>
										</svg>
										{profile.city}
									</Badge>
								{/if}
								{#if isOwn}
									<button
										onclick={() => openSection('teachingInfo')}
										class="text-text2 hover:text-text transition-colors p-1"
										aria-label={$t('common.edit')}
									>
										<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
											<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
										</svg>
									</button>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</Card>

		<!-- ── About ── -->
		{#if profile.bio || isOwn}
			<Card padding="lg" class="mb-4">
				<div class="flex items-center justify-between gap-4 mb-3">
					<h2 class="font-semibold text-lg">{$t('profile.teacher.about')}</h2>
					{#if isOwn && !editingBio}
						<button
							onclick={() => openSection('bio')}
							class="text-text2 hover:text-text transition-colors p-1"
							aria-label={$t('common.edit')}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
							</svg>
						</button>
					{/if}
				</div>
				{#if editingBio}
					<textarea
						bind:value={bioValue}
						rows={4}
						class="w-full bg-white border border-primary rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-primary/15"
						aria-label={$t('profile.teacher.about')}
					></textarea>
					<div class="flex gap-2 mt-2">
						<Button variant="primary" size="sm" loading={savingBio} onclick={saveBio}>{$t('common.save')}</Button>
						<Button variant="ghost" size="sm" onclick={() => { editingBio = false; bioValue = profile?.bio ?? ''; }}>{$t('common.cancel')}</Button>
					</div>
				{:else}
					<p class="text-[15px] leading-relaxed text-text2">{bioValue || $t('profile.teacher.notSet')}</p>
				{/if}
			</Card>
		{/if}

		<!-- ── University ── -->
		{#if profile.university || isOwn}
			<Card padding="lg" class="mb-4">
				<div class="flex items-center gap-2.5 mb-3">
					<span class="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-none" aria-hidden="true">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 10v6M2 10l10-5 10 5-10 5z" />
					<path d="M6 12v5c3 3 9 3 12 0v-5" />
				</svg>
			</span>
					<h2 class="font-semibold text-lg flex-1">{$t('profile.teacher.university')}</h2>
					{#if isOwn && !editingUniversity}
						<button
							onclick={() => openSection('university')}
							class="text-text2 hover:text-text transition-colors p-1"
							aria-label={$t('common.edit')}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
							</svg>
						</button>
					{/if}
				</div>
				{#if editingUniversity}
					<input
						type="text"
						bind:value={universityValue}
						placeholder={$t('profile.teacher.universityPlaceholder')}
						class="w-full bg-white border border-primary rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
					/>
					<div class="flex gap-2 mt-2">
						<Button variant="primary" size="sm" loading={savingUniversity} onclick={saveUniversity}>{$t('common.save')}</Button>
						<Button variant="ghost" size="sm" onclick={() => { editingUniversity = false; universityValue = profile?.university ?? ''; }}>{$t('common.cancel')}</Button>
					</div>
				{:else}
					<p class="text-sm font-medium text-text">{universityValue || $t('profile.teacher.notSet')}</p>
				{/if}
			</Card>
		{/if}

		<!-- ── Teaching Experience ── -->
		{#if profile.teaching_experience?.length || isOwn}
			<Card padding="lg" class="mb-4">
				<div class="flex items-center gap-2.5 mb-3">
					<span class="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center flex-none" aria-hidden="true">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="7" width="20" height="14" rx="2" />
					<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
				</svg>
			</span>
					<h2 class="font-semibold text-lg flex-1">{$t('profile.teacher.experience')}</h2>
					{#if isOwn && !editingExperience}
						<button
							onclick={() => openSection('experience')}
							class="text-text2 hover:text-text transition-colors p-1"
							aria-label={$t('common.edit')}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
							</svg>
						</button>
					{/if}
				</div>
				{#if editingExperience}
					{#each experienceValue as exp, i}
						<div class="grid grid-cols-[80px_80px_1fr_auto] gap-2 items-center mb-2">
							<input type="number" bind:value={exp.year_from} placeholder="2020" aria-label="Year from"
								class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
							<input type="number" bind:value={exp.year_to} placeholder={$t('profile.teacher.experiencePresent')} aria-label="Year to"
								class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary tabular" />
							<input type="text" bind:value={exp.subject} placeholder="e.g. Mathematics" aria-label="Subject"
								class="bg-white border border-border rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary" />
							<button type="button" onclick={() => removeExperience(i)} class="px-2 text-text2 hover:text-error" aria-label={$t('common.removeRow')}>×</button>
						</div>
					{/each}
					<button type="button" onclick={addExperience}
						class="text-sm font-semibold text-primary hover:text-primary-dark text-left mb-3">{$t('profile.teacher.addExperience')}</button>
					<div class="flex gap-2">
						<Button variant="primary" size="sm" loading={savingExperience} onclick={saveExperience}>{$t('common.save')}</Button>
						<Button variant="ghost" size="sm" onclick={() => { editingExperience = false; experienceValue = profile?.teaching_experience ?? []; }}>{$t('common.cancel')}</Button>
					</div>
				{:else if experienceValue.length > 0}
					<div class="flex flex-col divide-y divide-border">
						{#each experienceValue as exp}
							<div class="py-2.5">
								<p class="text-sm font-semibold text-text">{exp.subject}</p>
								<p class="text-xs text-text2 mt-0.5">{exp.year_from} – {exp.year_to ?? $t('profile.teacher.experiencePresent')}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-text2">{$t('profile.teacher.notSet')}</p>
				{/if}
			</Card>
		{/if}

		<!-- ── Achievements ── -->
		{#if profile.achievements?.length || isOwn}
			<Card padding="lg" class="mb-4">
				<div class="flex items-center gap-2.5 mb-3">
					<span class="w-9 h-9 rounded-lg bg-gold-bg text-gold-text flex items-center justify-center flex-none" aria-hidden="true">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
				</svg>
			</span>
					<h2 class="font-semibold text-lg flex-1">{$t('profile.teacher.achievements')}</h2>
					{#if isOwn && !editingAchievements}
						<button
							onclick={() => openSection('achievements')}
							class="text-text2 hover:text-text transition-colors p-1"
							aria-label={$t('common.edit')}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
							</svg>
						</button>
					{/if}
				</div>
				{#if editingAchievements}
					{#each achievementsValue as ach, i}
						<div class="flex gap-2 mb-2">
							<input type="text" bind:value={achievementsValue[i]}
								class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
							<button type="button" onclick={() => (achievementsValue = achievementsValue.filter((_, idx) => idx !== i))}
								class="px-2 text-text2 hover:text-error" aria-label={$t('common.removeRow')}>×</button>
						</div>
					{/each}
					<button type="button" onclick={() => (achievementsValue = [...achievementsValue, ''])}
						class="text-sm font-semibold text-primary hover:text-primary-dark text-left mb-3">{$t('profile.teacher.addAchievement')}</button>
					<div class="flex gap-2">
						<Button variant="primary" size="sm" loading={savingAchievements} onclick={saveAchievements}>{$t('common.save')}</Button>
						<Button variant="ghost" size="sm" onclick={() => { editingAchievements = false; achievementsValue = profile?.achievements ?? []; }}>{$t('common.cancel')}</Button>
					</div>
				{:else if achievementsValue.length > 0}
					<div class="flex flex-col divide-y divide-border">
						{#each achievementsValue as ach}
							<div class="py-2.5">
								<p class="text-sm font-medium text-text">{ach}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-text2">{$t('profile.teacher.notSet')}</p>
				{/if}
			</Card>
		{/if}

		<!-- ── Current Courses ── -->
		{#if profile.courses?.length || isOwn}
			<Card padding="lg">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-semibold text-lg">{$t('profile.teacher.currentCourses')}</h2>
					{#if isOwn}
						<Button variant="secondary" size="sm" href="/courses">{$t('profile.teacher.newCourse')}</Button>
					{/if}
				</div>
				{#if profile.courses?.length}
					<div class="grid sm:grid-cols-2 gap-3">
						{#each profile.courses as course}
							<div class="border border-border rounded-sm p-3">
								<p class="text-[15px] font-bold text-teal">{course.name}</p>
								<p class="text-xs text-text3 mt-0.5">{(course.age_categories ?? []).join(' · ')}</p>
								{#if course.description}
									<p class="text-xs text-text2 mt-1.5 leading-relaxed">{course.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-text2">{$t('profile.teacher.noCourses')}</p>
				{/if}
			</Card>
		{/if}

	{/if}
</div>
