<script lang="ts">
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();
	const profile = $derived(data.profile);
	const reports = $derived(data.reports ?? []);
	const isOwn = $derived(data.user?.id === profile?.user_id);
	const canShowEmail = $derived(isOwn && data.user?.status === 'active');

	let editingName = $state(false);
	let nameValue = $state(profile?.full_name ?? '');

	async function saveName() {
		await api.put('/students/me', { full_name: nameValue });
		editingName = false;
	}

	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		api.upload('/students/me/photo', fd);
	}

	function attendanceVariant(a: string): 'success' | 'warning' | 'error' {
		if (a === 'Present' || a === 'present') return 'success';
		if (a === 'Late' || a === 'late') return 'warning';
		return 'error';
	}
</script>

<svelte:head>
	<title>{profile?.full_name ?? 'Student Profile'} — Mutawazin</title>
</svelte:head>

<div class="max-w-profile mx-auto py-8">
	{#if !profile}
		<p class="text-text2 text-center py-20">Student not found.</p>
	{:else}
		<!-- Profile header -->
		<div class="flex flex-wrap gap-5 items-start mb-8">
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
				<div class="flex items-center gap-2 mb-2">
					{#if editingName}
						<input
							type="text"
							bind:value={nameValue}
							onblur={saveName}
							class="text-[32px] font-bold tracking-tight border-b-2 border-primary bg-transparent focus:outline-none"
							aria-label="Edit name"
							autofocus
						/>
					{:else}
						<h1 class="text-[32px] font-bold tracking-tight">{profile.full_name}</h1>
						{#if isOwn}
							<button onclick={() => (editingName = true)} class="text-text2 hover:text-text transition-colors" aria-label="Edit name">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
								</svg>
							</button>
						{/if}
					{/if}
				</div>
				<div class="flex items-center gap-2 flex-wrap mb-2">
					{#if profile.age_category}
						<Badge variant="violet" label={profile.age_category} />
					{/if}
				</div>
				{#if profile.assigned_teacher}
					<p class="text-sm text-text2">
						{$t('profile.student.assignedTo', { values: { name: '' } })}
						<a href="/teachers/{profile.assigned_teacher_id}" class="font-semibold text-primary hover:text-primary-dark hover:underline">
							{profile.assigned_teacher}
						</a>
					</p>
				{/if}
			</div>

			<div class="flex gap-2">
				{#if canShowEmail}
					<Button variant="teal" href="/account/step-up">{$t('profile.student.setUpEmail')}</Button>
				{/if}
				{#if !isOwn && data.user?.role === 'teacher'}
					<Button variant="primary">{$t('profile.student.messageStudent')}</Button>
				{/if}
			</div>
		</div>

		<!-- Enrolled Courses -->
		<Card padding="lg" class="mb-4">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold text-lg">{$t('profile.student.enrolledCourses')}</h2>
				<a href="/courses" class="text-sm font-semibold text-primary hover:text-primary-dark">{$t('profile.student.browseMore')}</a>
			</div>
			{#if profile.enrolled_courses?.length}
				<div class="grid sm:grid-cols-2 gap-3">
					{#each profile.enrolled_courses as course}
						<div class="border border-border rounded-sm p-3">
							<Badge variant="active" label={course.subject} class="mb-2" />
							<div class="font-medium text-sm">{course.title}</div>
							<div class="text-xs text-text2 mt-0.5">with {course.teacher_name}</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text2">{$t('profile.student.noEnrolledCourses')}</p>
			{/if}
		</Card>

		<!-- Recent Reports -->
		<Card padding="lg">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-semibold text-lg">{$t('profile.student.recentReports')}</h2>
				<a href="/reports/{profile.user_id}" class="text-sm font-semibold text-primary">{$t('profile.student.viewAllReports')}</a>
			</div>
			{#if reports.length > 0}
				<div class="flex flex-col gap-3">
					{#each reports.slice(0, 3) as report}
						<div class="bg-bgGray rounded-sm p-4">
							<div class="flex items-center justify-between mb-1">
								<div class="font-medium text-sm">{report.session_title}</div>
								<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
							</div>
							<div class="text-xs text-text2 tabular mb-1">{report.date}</div>
							{#if report.average_score !== undefined}
								<div class="text-xs text-text2">
									{$t('profile.student.avgScore', { values: { score: report.average_score, max: report.max_score ?? 10 } })}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text2">{$t('profile.student.noReports')}</p>
			{/if}
		</Card>
	{/if}
</div>
