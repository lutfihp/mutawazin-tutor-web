<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let { data } = $props();
	const isTeacher = $derived(data.user?.role === 'teacher' || data.user?.role === 'admin');

	// Course band gradient classes — static for Tailwind purge
	const BAND_VARIANTS = [
		'bg-[linear-gradient(135deg,#2563EB_0%,#1D4ED8_60%,#0D9488_100%)]',
		'bg-[linear-gradient(135deg,#0D9488_0%,#2563EB_100%)]',
		'bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]',
		'bg-[linear-gradient(135deg,#0F766E_0%,#1D4ED8_100%)]',
		'bg-[linear-gradient(135deg,#2563EB_0%,#0F172A_100%)]',
		'bg-[linear-gradient(135deg,#0D9488_0%,#115E59_100%)]',
	];

	function bandVariant(id: string): string {
		let hash = 0;
		for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
		return BAND_VARIANTS[hash % BAND_VARIANTS.length];
	}

	// Filter state
	let query = $state('');
	let subjectFilter = $state('');
	let ageFilters = $state<string[]>([]);
	let statusFilter = $state('');

	// Course data
	let courses = $state<any[]>([]);
	let loading = $state(true);

	// Create modal
	let createOpen = $state(false);
	let newCatalogId = $state('');
	let newDesc = $state('');
	let createLoading = $state(false);
	let catalogEntries = $state<{ id: string; name: string; subject: string }[]>([]);
	let catalogLoading = $state(false);

	async function loadCatalog() {
		if (catalogEntries.length > 0) return;
		catalogLoading = true;
		try {
			const entries = await api.get<{ id: string; name: string; subject: string; age_categories: string[]; status: string }[]>('/catalog?status=verified');
			catalogEntries = Array.isArray(entries) ? entries : [];
		} catch {
			catalogEntries = [];
		} finally {
			catalogLoading = false;
		}
	}

	let debounceTimer: ReturnType<typeof setTimeout>;

	async function fetchCourses() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (query) params.set('search', query);
			if (subjectFilter) params.set('subject', subjectFilter);
			if (statusFilter) params.set('status', statusFilter);
			ageFilters.forEach((a) => params.append('age_category', a));
			const data = await api.get<any[]>(`/courses?${params}`);
			courses = Array.isArray(data) ? data : [];
		} catch {
			courses = [];
		} finally {
			loading = false;
		}
	}

	function scheduleRefetch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(fetchCourses, 300);
	}

	function toggleAge(age: string) {
		ageFilters = ageFilters.includes(age) ? ageFilters.filter((a) => a !== age) : [...ageFilters, age];
		scheduleRefetch();
	}

	async function createCourse(e: SubmitEvent) {
		e.preventDefault();
		createLoading = true;
		try {
			await api.post('/courses', {
				catalog_entry_id: newCatalogId,
				description: newDesc,
			});
			createOpen = false;
			newCatalogId = '';
			newDesc = '';
			await fetchCourses();
		} finally {
			createLoading = false;
		}
	}

	onMount(fetchCourses);

	$effect(() => {
		subjectFilter;
		statusFilter;
		scheduleRefetch();
	});
</script>

<svelte:head>
	<title>{$t('courses.title')} — Mutawazin</title>
</svelte:head>

<div>
	<!-- Page header -->
	<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
		<div>
			<h1 class="text-2xl font-bold">{$t('courses.title')}</h1>
			{#if !loading}
				<p class="text-sm text-text2 mt-0.5">{$t('courses.resultCount', { values: { n: courses.length } })}</p>
			{/if}
		</div>
		{#if isTeacher}
			<Button variant="primary" onclick={() => { createOpen = true; loadCatalog(); }}>
				{$t('courses.createNew')}
			</Button>
		{/if}
	</div>

	<!-- Toolbar -->
	<div class="flex gap-3 items-center flex-wrap mb-6">
		<!-- Search -->
		<div class="relative flex-1 min-w-[200px] max-w-[360px]">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text2 w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
			<input
				type="search"
				bind:value={query}
				oninput={scheduleRefetch}
				placeholder={$t('courses.searchPlaceholder')}
				aria-label={$t('courses.searchPlaceholder')}
				class="w-full h-10 pl-9 pr-3 bg-white border border-border rounded-sm text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
			/>
		</div>

		<!-- Subject select -->
		<select
			bind:value={subjectFilter}
			aria-label={$t('courses.allSubjects')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
			<option value="">{$t('courses.allSubjects')}</option>
			<option value="Math">Math</option>
			<option value="English">English</option>
			<option value="Science">Science</option>
			<option value="Arabic">Arabic</option>
		</select>

		<!-- Age chip group -->
		<div class="inline-flex bg-white border border-border rounded-sm p-0.5 gap-0.5 h-10 items-center" role="group" aria-label="Age category filter">
			{#each [['Kids', $t('courses.ageKids')], ['Teens', $t('courses.ageTeens')], ['Adults', $t('courses.ageAdults')]] as [val, label]}
				<button
					onclick={() => toggleAge(val)}
					aria-pressed={ageFilters.includes(val)}
					class="px-3 h-8 text-[13px] font-medium rounded-sm transition-colors
					       {ageFilters.includes(val) ? 'bg-primary-light text-primary-dark font-semibold' : 'text-text2 hover:text-text'}"
				>
					{label}
				</button>
			{/each}
		</div>

		<div class="flex-1"></div>

		<!-- Status select -->
		<select
			bind:value={statusFilter}
			aria-label={$t('courses.allStatuses')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
			<option value="">{$t('courses.allStatuses')}</option>
			<option value="Active">Active</option>
			<option value="Draft">Draft</option>
		</select>
	</div>

	<!-- Course grid -->
	{#if loading}
		<div class="flex items-center justify-center py-20" role="status" aria-label={$t('common.loading')}>
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if courses.length === 0}
		<div class="text-center py-20 bg-white border border-border rounded-DEFAULT">
			<p class="text-text2">{$t('courses.noResults')}</p>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
			{#each courses as course}
				{@const bandClass = bandVariant(course.id ?? 'default')}
				<div class="bg-white border border-border rounded-DEFAULT shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden">
					<!-- Band -->
					<div class="h-[88px] relative flex items-start justify-between p-3.5 {bandClass}">
						<!-- Radial overlay -->
						<div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(140px 140px at 90% 130%, rgba(255,255,255,.18), transparent 60%), radial-gradient(80px 80px at 10% -20%, rgba(255,255,255,.16), transparent 60%);" aria-hidden="true"></div>
						<span class="relative z-10 text-white text-xs font-medium rounded-pill px-2.5 py-1" style="background: rgba(255,255,255,.18); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.25);">
							{course.subject}
						</span>
						<span class="relative z-10 bg-white text-xs font-medium rounded-pill px-2.5 py-1 {course.status === 'Active' ? 'text-successText' : 'text-muted'}">
							{course.status ?? 'Active'}
						</span>
					</div>

					<!-- Body -->
					<div class="p-4 flex-1 flex flex-col gap-2.5">
						<div class="font-semibold text-[17px] leading-snug">{course.name ?? course.title}</div>
						{#if course.teacher_name}
							<div class="flex items-center gap-2">
								<Avatar name={course.teacher_name} id={course.teacher_id ?? ''} size="sm" />
								<span class="text-sm font-medium">{course.teacher_name}</span>
							</div>
						{/if}
						<div class="flex flex-wrap gap-1.5">
							{#each (course.age_categories ?? []) as age}
								<Badge variant="violet" label={age} />
							{/each}
						</div>
						{#if course.enrolled_count !== undefined}
							<div class="flex items-center gap-1.5 text-sm text-text2">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
								{$t('courses.enrolled', { values: { n: course.enrolled_count } })}
							</div>
						{/if}
					</div>

					<!-- Footer -->
					<div class="bg-bgGray px-4 py-3 border-t border-border">
						<Button variant="primary" size="sm" href="/courses/{course.id}" class="w-full">
							{$t('courses.viewCourse')}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Course Modal -->
<Modal open={createOpen} title={$t('courses.modal.createTitle')} onclose={() => (createOpen = false)} maxWidth="lg">
	<form onsubmit={createCourse} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="catalogEntry" class="text-[13px] font-medium">{$t('courses.modal.catalogLabel')}</label>
			{#if catalogLoading}
				<p class="text-sm text-text2">{$t('common.loading')}</p>
			{:else}
				<select id="catalogEntry" bind:value={newCatalogId} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
					<option value="">{$t('courses.modal.catalogPlaceholder')}</option>
					{#each catalogEntries as entry}
						<option value={entry.id}>{entry.name} ({entry.subject})</option>
					{/each}
				</select>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="courseDesc" class="text-[13px] font-medium">{$t('courses.modal.descLabel')}</label>
			<textarea id="courseDesc" bind:value={newDesc} rows={3} placeholder={$t('courses.modal.descPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => { document.getElementById('catalogEntry')?.closest('form')?.requestSubmit(); }}>
			{$t('courses.modal.createTitle')}
		</Button>
	{/snippet}
</Modal>
