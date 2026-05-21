<script lang="ts">
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let pendingTeachers: any[] = $state([...(data.pendingTeachers ?? [])]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let pendingStudents: any[] = $state([...(data.pendingStudents ?? [])]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let pendingSubjects: any[] = $state([...(data.pendingSubjects ?? [])]);
	let actionLoading = $state<string | null>(null);
	let subjectActionLoading = $state<string | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const s = $derived((data.stats as any) ?? {});
	const stats = $derived([
		{ labelKey: 'dashboard.admin.totalTeachers', value: s.total_teachers ?? 0, meta: s.teachers_this_month, color: 'bg-primary-light text-primary' },
		{ labelKey: 'dashboard.admin.totalStudents',  value: s.total_students ?? 0,  meta: s.students_this_month, color: 'bg-teal-light text-teal' },
		{ labelKey: 'dashboard.admin.activeCourses',  value: s.active_courses ?? 0,  meta: s.courses_this_week,   color: 'bg-violet-bg text-violet-text' },
	]);

	async function handleAction(type: 'teacher' | 'student', id: string, action: 'approve' | 'reject') {
		actionLoading = `${type}-${id}-${action}`;
		try {
			await api.patch(`/admin/${type}s/${id}/verify`, { action });
			if (type === 'teacher') {
				pendingTeachers = pendingTeachers.filter((t: any) => t.id !== id);
			} else {
				pendingStudents = pendingStudents.filter((s: any) => s.id !== id);
			}
		} catch {
			// keep state
		} finally {
			actionLoading = null;
		}
	}

	async function handleSubjectAction(id: string, action: 'approve' | 'reject') {
		subjectActionLoading = `${id}-${action}`;
		try {
			await api.patch(`/admin/subjects/${id}/verify`, { action });
			pendingSubjects = pendingSubjects.filter((e: any) => e.id !== id);
		} catch {
			// keep state
		} finally {
			subjectActionLoading = null;
		}
	}
</script>

<svelte:head>
	<title>{$t('dashboard.admin.title')} — Mutawazin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">{$t('dashboard.admin.title')}</h1>
		<p class="text-sm text-text2 mt-1 tabular">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
	</div>

	<!-- Stats grid -->
	<div class="grid grid-cols-2 xl:grid-cols-3 gap-4">
		{#each stats as stat}
			<Card padding="default">
				<div class="flex items-start gap-3">
					<div class="w-10 h-10 rounded-DEFAULT flex items-center justify-center flex-none {stat.color}">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
						</svg>
					</div>
					<div>
						<p class="text-[13px] text-text2">{$t(stat.labelKey)}</p>
						<p class="text-[28px] font-bold leading-none tabular">{stat.value}</p>
						{#if stat.meta}
							<p class="text-xs text-successText mt-0.5">↑ {stat.meta}</p>
						{/if}
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Pending Teacher Approvals -->
	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('dashboard.admin.pendingTeachers')}</h2>
			{#if pendingTeachers.length > 0}
				<Badge variant="warning" label={$t('dashboard.admin.waitingTeachers', { values: { n: pendingTeachers.length } })} />
			{/if}
		{/snippet}
		{#if pendingTeachers.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('common.name')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.email')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('dashboard.admin.subjects')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('common.registered')}</th>
							<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each pendingTeachers as teacher}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3">
									<div class="flex items-center gap-2.5">
										<Avatar name={teacher.full_name ?? teacher.name} id={teacher.id} size="sm" />
										<span class="font-medium">{teacher.full_name ?? teacher.name}</span>
									</div>
								</td>
								<td class="px-5 py-3 text-text2 hidden sm:table-cell">{teacher.email}</td>
								<td class="px-5 py-3 hidden md:table-cell">
									<div class="flex flex-wrap gap-1">
										{#each (teacher.subjects ?? []).slice(0, 2) as s}
											<Badge variant="teal" label={s} />
										{/each}
									</div>
								</td>
								<td class="px-5 py-3 text-text2 text-xs hidden lg:table-cell tabular">{teacher.date ?? teacher.created_at}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<Button variant="success" size="sm"
											loading={actionLoading === `teacher-${teacher.id}-approve`}
											onclick={() => handleAction('teacher', teacher.id, 'approve')}>
											{$t('common.approve')}
										</Button>
										<Button variant="danger" size="sm"
											loading={actionLoading === `teacher-${teacher.id}-reject`}
											onclick={() => handleAction('teacher', teacher.id, 'reject')}>
											{$t('common.reject')}
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.admin.noPendingTeachers')}</p>
		{/if}
	</Card>

	<!-- Pending Student Approvals -->
	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('dashboard.admin.pendingStudents')}</h2>
			{#if pendingStudents.length > 0}
				<Badge variant="warning" label={$t('dashboard.admin.waitingStudents', { values: { n: pendingStudents.length } })} />
			{/if}
		{/snippet}
		{#if pendingStudents.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('common.name')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.email')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('dashboard.admin.ageCategory')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('common.registered')}</th>
							<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each pendingStudents as student}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3">
									<div class="flex items-center gap-2.5">
										<Avatar name={student.full_name ?? student.name} id={student.id} size="sm" />
										<span class="font-medium">{student.full_name ?? student.name}</span>
									</div>
								</td>
								<td class="px-5 py-3 text-text2 hidden sm:table-cell">{student.email}</td>
								<td class="px-5 py-3 hidden md:table-cell">
									<Badge variant="violet" label={student.age_category ?? ''} />
								</td>
								<td class="px-5 py-3 text-text2 text-xs hidden lg:table-cell tabular">{student.date ?? student.created_at}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<Button variant="success" size="sm"
											loading={actionLoading === `student-${student.id}-approve`}
											onclick={() => handleAction('student', student.id, 'approve')}>
											{$t('common.approve')}
										</Button>
										<Button variant="danger" size="sm"
											loading={actionLoading === `student-${student.id}-reject`}
											onclick={() => handleAction('student', student.id, 'reject')}>
											{$t('common.reject')}
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.admin.noPendingStudents')}</p>
		{/if}
	</Card>

	<!-- Pending Subject Suggestions -->
	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('dashboard.admin.pendingSubjects')}</h2>
			{#if pendingSubjects.length > 0}
				<Badge variant="warning" label={$t('dashboard.admin.waitingSubjects', { values: { n: pendingSubjects.length } })} />
			{/if}
		{/snippet}
		{#if pendingSubjects.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.admin.noPendingSubjects')}</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('dashboard.admin.subjectName')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.status')}</th>
							<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each pendingSubjects as entry}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3 font-medium">{entry.name}</td>
								<td class="px-5 py-3 hidden sm:table-cell">
									<Badge variant="warning" label={entry.status ?? 'pending'} />
								</td>
								<td class="px-5 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<Button variant="success" size="sm"
											loading={subjectActionLoading === `${entry.id}-approve`}
											onclick={() => handleSubjectAction(entry.id, 'approve')}>
											{$t('dashboard.admin.subjectApprove')}
										</Button>
										<Button variant="danger" size="sm"
											loading={subjectActionLoading === `${entry.id}-reject`}
											onclick={() => handleSubjectAction(entry.id, 'reject')}>
											{$t('dashboard.admin.subjectReject')}
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>
