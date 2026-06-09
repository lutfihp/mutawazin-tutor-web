<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import { AGE_KEYS } from '$lib/utils/ageCategories';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let { data } = $props();
	const isTeacher = $derived(data.user?.role === 'teacher' || data.user?.role === 'admin');
	const isAdmin = $derived(data.user?.role === 'admin');

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

	// Course data — initialized from SSR, updated by client fetches
	let courses = $state<any[]>(data.courses ?? []);
	let loading = $state(false);
	let subjects = $state<{ id: string; name: string }[]>([]);
	let page = $state(1);
	let totalPages = $state(data.totalPages ?? 1);
	const pageSize = 12;

	// Create modal
	let createOpen = $state(false);
	let newSubjectId = $state('');
	let newDesc = $state('');
	let newCourseAges = $state<string[]>([]);
	let createLoading = $state(false);

	// Enrollment modal state
	let enrollOpen = $state(false);
	let enrollCourseId = $state('');
	let enrollStudentId = $state('');
	let enrollLoading = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let adminStudents = $state<any[]>([]);
	let adminStudentsLoading = $state(false);

	async function openEnroll(courseId: string) {
		enrollCourseId = courseId;
		enrollStudentId = '';
		enrollOpen = true;
		if (adminStudents.length > 0) return;
		adminStudentsLoading = true;
		try {
			const body = await api.get<PaginatedResponse<any>>('/admin/students');
			adminStudents = body.data;
		} catch {
			adminStudents = [];
		} finally {
			adminStudentsLoading = false;
		}
	}

	async function submitEnroll() {
		if (!enrollStudentId) return;
		enrollLoading = true;
		try {
			await api.post(`/courses/${enrollCourseId}/enroll`, { student_id: enrollStudentId });
			courses = courses.map((c: any) =>
				c.id === enrollCourseId
					? { ...c, enrolled_count: (c.enrolled_count ?? 0) + 1 }
					: c
			);
			enrollOpen = false;
		} finally {
			enrollLoading = false;
		}
	}

	function toggleCourseAge(age: string) {
		newCourseAges = newCourseAges.includes(age)
			? newCourseAges.filter((a) => a !== age)
			: [...newCourseAges, age];
	}
	let subjectEntries = $state<{ id: string; name: string; status: string }[]>([]);
	let suggestMode = $state(false);
	let suggestName = $state('');
	let suggestLoading = $state(false);
	let suggestSuccess = $state(false);
	let subjectLoading = $state(false);

	async function loadSubjects() {
		if (subjectEntries.length > 0) return;
		subjectLoading = true;
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string; status: string }>>('/subjects?status=verified');
			subjectEntries = body.data;
		} catch {
			subjectEntries = [];
		} finally {
			subjectLoading = false;
		}
	}

	let debounceTimer: ReturnType<typeof setTimeout>;

	async function fetchCourses() {
		loading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (query) params.set('search', query);
			if (subjectFilter) params.set('subject', subjectFilter);
			if (statusFilter) params.set('status', statusFilter);
			ageFilters.forEach((a) => params.append('age_category', a));
			const body = await api.get<PaginatedResponse<any>>(`/courses?${params}`);
			courses = body.data;
			totalPages = body.pagination.totalPages;
		} catch {
			courses = [];
			totalPages = 1;
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
				subject_id: newSubjectId,
				age_categories: newCourseAges,
				description: newDesc,
			});
			createOpen = false;
			newSubjectId = '';
			newCourseAges = [];
			newDesc = '';
			await fetchCourses();
		} finally {
			createLoading = false;
		}
	}

	async function suggestSubjectEntry(e: SubmitEvent) {
		e.preventDefault();
		suggestLoading = true;
		try {
			await api.post('/subjects/suggest', { name: suggestName });
			suggestSuccess = true;
			suggestName = '';
			await fetchCourses();
		} finally {
			suggestLoading = false;
		}
	}

	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string; status: string }>>('/subjects?status=verified');
			subjects = body.data;
		} catch {
			subjects = [];
		}
	});
</script>

<svelte:head>
	<title>{$t('courses.title')} — Mutawazin</title>
</svelte:head>

<div>
	{#if data.user?.role === 'teacher' && data.user?.status === 'email_verified'}
		<div class="mb-5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			{$t('pendingReview.coursesBanner')}
		</div>
	{/if}
	<!-- Page header -->
	<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
		<div>
			<h1 class="text-2xl font-bold">{$t('courses.title')}</h1>
			{#if !loading}
				<p class="text-sm text-text2 mt-0.5">{$t('courses.resultCount', { values: { n: courses.length } })}</p>
			{/if}
		</div>
		{#if isAdmin}
			<Button variant="primary" onclick={() => { createOpen = true; loadSubjects(); }}>
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
			onchange={() => { page = 1; scheduleRefetch(); }}
			aria-label={$t('courses.allSubjects')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
			<option value="">{$t('courses.allSubjects')}</option>
			{#each subjects as subject}
				<option value={subject.name}>{subject.name}</option>
			{/each}
		</select>

		<!-- Age chip group -->
		<div class="inline-flex bg-white border border-border rounded-sm p-0.5 gap-0.5 h-10 items-center" role="group" aria-label="Age category filter">
			{#each [['pre-school', $t('courses.agePreSchool')], ['elementary', $t('courses.ageElementary')], ['middle-school', $t('courses.ageMiddleSchool')], ['high-school', $t('courses.ageHighSchool')], ['general', $t('courses.ageGeneral')]] as [val, label]}
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
			onchange={() => { page = 1; scheduleRefetch(); }}
			aria-label={$t('courses.allStatuses')}
			class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
		>
			<option value="">{$t('courses.allStatuses')}</option>
			<option value="Active">Active</option>
			<option value="Draft">Draft</option>
		</select>
	</div>

	<!-- Course grid -->
	{#if loading && courses.length === 0}
		<div class="flex items-center justify-center py-20" role="status" aria-label={$t('common.loading')}>
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if courses.length === 0}
		<div class="text-center py-20 bg-white border border-border rounded-DEFAULT">
			<p class="text-text2">{$t('courses.noResults')}</p>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5" class:opacity-50={loading} class:pointer-events-none={loading}>
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
								<Badge variant="violet" label={$t(AGE_KEYS[age] ?? age)} />
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
					<div class="bg-bgGray px-4 py-3 border-t border-border flex gap-2">
						<Button variant="primary" size="sm" href="/courses/{course.id}" class="flex-1">
							{$t('courses.viewCourse')}
						</Button>
						{#if data.user?.role === 'admin'}
							<Button variant="secondary" size="sm" onclick={() => openEnroll(course.id)}>
								{$t('courses.enrollStudent')}
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
	<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchCourses(); }} />
</div>

<!-- Enroll Student Modal -->
{#if data.user?.role === 'admin'}
	<Modal open={enrollOpen} title={$t('courses.enrollStudent')} onclose={() => (enrollOpen = false)}>
		<div class="flex flex-col gap-4">
			{#if adminStudentsLoading}
				<div class="flex justify-center py-6" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else}
				<div class="flex flex-col gap-1.5">
					<label for="enrollStudentId" class="text-[13px] font-medium">
						{$t('courses.enrollSelectStudent')}
					</label>
					<select id="enrollStudentId" bind:value={enrollStudentId}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
						<option value="">— {$t('courses.enrollSelectStudent')}</option>
						{#each adminStudents as student}
							<option value={student.user_id ?? student.id}>
								{student.full_name ?? student.name}
							</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (enrollOpen = false)}>
				{$t('common.cancel')}
			</Button>
			<Button variant="primary" size="sm" loading={enrollLoading}
				disabled={!enrollStudentId} onclick={submitEnroll}>
				{$t('courses.enrollStudent')}
			</Button>
		{/snippet}
	</Modal>
{/if}

<!-- Create Course Modal -->
<Modal open={createOpen} title={$t('courses.modal.createTitle')} onclose={() => { createOpen = false; suggestMode = false; suggestSuccess = false; newCourseAges = []; }} maxWidth="lg">
	<form onsubmit={createCourse} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="subjectEntry" class="text-[13px] font-medium">{$t('courses.modal.subjectPickerLabel')}</label>
			{#if subjectLoading}
				<p class="text-sm text-text2">{$t('common.loading')}</p>
			{:else}
				<select id="subjectEntry" bind:value={newSubjectId} required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
					<option value="">{$t('courses.modal.subjectPickerPlaceholder')}</option>
					{#each subjectEntries as entry}
						<option value={entry.id}>{entry.name}</option>
					{/each}
				</select>
			{/if}
		</div>
		<!-- Age categories for course -->
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">{$t('courses.suggestAgeLabel')}</p>
			<div class="flex flex-wrap gap-2">
				{#each [['pre-school', $t('courses.agePreSchool')], ['elementary', $t('courses.ageElementary')], ['middle-school', $t('courses.ageMiddleSchool')], ['high-school', $t('courses.ageHighSchool')], ['general', $t('courses.ageGeneral')]] as [val, label]}
					<button type="button" onclick={() => toggleCourseAge(val)}
						class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
						       {newCourseAges.includes(val) ? 'bg-primary-light text-primary-dark border-primary' : 'border-border text-text2 hover:bg-bgGray'}">
						{label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Suggest toggle -->
		{#if !suggestMode && !suggestSuccess}
			<button type="button" onclick={() => (suggestMode = true)}
				class="text-sm font-semibold text-primary hover:text-primary-dark text-left">
				{$t('courses.suggestEntry')}
			</button>
		{/if}

		<!-- Suggest form -->
		{#if suggestMode}
			<div class="border border-border rounded-sm p-4 bg-bgGray flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<p class="text-sm font-semibold">{$t('courses.suggestTitle')}</p>
					<button type="button" onclick={() => (suggestMode = false)}
						class="text-xs font-semibold text-primary hover:text-primary-dark">
						{$t('courses.suggestCancelBack')}
					</button>
				</div>
				{#if suggestSuccess}
					<p class="text-sm text-successText">{$t('courses.suggestSuccess')}</p>
				{:else}
					<div class="flex flex-col gap-3">
						<div class="flex flex-col gap-1.5">
							<label for="suggestName" class="text-[13px] font-medium">{$t('courses.suggestNameLabel')}</label>
							<input id="suggestName" type="text" bind:value={suggestName} required
								placeholder={$t('courses.suggestNamePlaceholder')}
								class="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
						</div>
						<Button variant="teal" size="sm" loading={suggestLoading}
							onclick={(e: MouseEvent) => { e.preventDefault(); suggestSubjectEntry(new SubmitEvent('submit')); }}>
							{$t('courses.suggestEntry')}
						</Button>
					</div>
				{/if}
			</div>
		{/if}

		<div class="flex flex-col gap-1.5">
			<label for="courseDesc" class="text-[13px] font-medium">{$t('courses.modal.descLabel')}</label>
			<textarea id="courseDesc" bind:value={newDesc} rows={3} placeholder={$t('courses.modal.descPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => { document.getElementById('subjectEntry')?.closest('form')?.requestSubmit(); }}>
			{$t('courses.modal.createTitle')}
		</Button>
	{/snippet}
</Modal>
