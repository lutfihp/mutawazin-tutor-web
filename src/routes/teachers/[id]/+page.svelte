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
					{#if isOwn && editMode}
						<button class="inline-flex items-center gap-1 px-2.5 py-0.5 border border-dashed border-primary text-primary text-xs font-medium rounded-pill hover:bg-primary-light transition-colors">
							{$t('profile.teacher.addSubject')}
						</button>
					{/if}
				</div>
				<p class="text-sm text-text2">
					{$t('profile.teacher.yearsExperience', { values: { n: profile.years_experience ?? 0 } })}
					·
					{$t('profile.teacher.sessionsCompleted', { values: { n: profile.sessions_completed ?? 0 } })}
				</p>
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
