<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { api, type PaginatedResponse } from '$lib/api';

	let { data } = $props();
	const d = $derived(data.dashboardData ?? {});
	const isTeacher = $derived(data.role === 'teacher');

	function statusVariant(s: string): 'success' | 'warning' | 'error' | 'active' | 'gray' {
		const map: Record<string, 'success' | 'warning' | 'error' | 'active' | 'gray'> = {
			Confirmed: 'active', confirmed: 'active',
			Completed: 'gray', completed: 'gray',
			Cancelled: 'error', cancelled: 'error',
			Pending: 'warning', pending: 'warning',
		};
		return map[s] ?? 'gray';
	}

	let students = $state<any[]>([]);
	let studentsLoading = $state(true);

	onMount(async () => {
		if (!isTeacher) return;
		try {
			const body = await api.get<PaginatedResponse<any>>('/students');
			students = body.data;
		} catch {
			students = [];
		} finally {
			studentsLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{$t('nav.dashboard')} — Mutawazin</title>
</svelte:head>

{#if isTeacher}
	<!-- ── Teacher Dashboard ── -->
	<div class="flex flex-col gap-6">
		<!-- Welcome -->
		<div>
			<h1 class="text-2xl font-bold">{$t('dashboard.teacher.welcome', { values: { name: d.full_name ?? '' } })}</h1>
			<p class="text-sm text-text2 mt-1">
				{$t('dashboard.teacher.sessionMeta', { values: { count: d.upcoming_sessions?.length ?? 0 } })}
			</p>
		</div>

		<!-- Upcoming Sessions -->
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">{$t('dashboard.teacher.upcomingSessions')}</h2>
			{/snippet}
			<div class="divide-y divide-border">
				{#if d.upcoming_sessions?.length}
					{#each d.upcoming_sessions as session}
						<div class="flex items-center gap-4 px-5 py-3.5">
							<div
								class="w-10 h-10 rounded-DEFAULT flex items-center justify-center flex-none
								       {session.type === 'group' ? 'bg-primary-light text-primary' : 'bg-teal-light text-teal'}"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									{#if session.type === 'group'}
										<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
									{:else}
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
									{/if}
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm truncate">{session.title}</div>
								<div class="text-xs text-text2">{session.type === 'group' ? (session.student_count ?? '') + ' students' : session.student_name ?? ''}</div>
							</div>
							<Badge variant={statusVariant(session.status)} label={session.status} />
							<span class="text-xs text-text2 bg-bgGray px-2 py-1 rounded-sm whitespace-nowrap tabular">{session.starts_at}</span>
							<a href="/calendar" class="text-xs font-semibold text-primary hover:text-primary-dark">{$t('common.view')} →</a>
						</div>
					{/each}
				{:else}
					<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.teacher.noSessions')}</p>
				{/if}
			</div>
		</Card>

		<!-- Two-col row -->
		<div class="grid lg:grid-cols-2 gap-6">
			<!-- Private Students -->
			<Card padding="none">
				{#snippet head()}
					<h2 class="font-semibold">{$t('dashboard.teacher.privateStudents')}</h2>
				{/snippet}
				<div class="divide-y divide-border">
					{#if d.private_students?.length}
						{#each d.private_students as student}
							<div class="flex items-center gap-3 px-5 py-3">
								<Avatar name={student.full_name} id={student.user_id} size="md" />
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm">{student.full_name}</div>
									{#if student.last_session_at}
									<div class="text-xs text-text2">{$t('dashboard.teacher.lastSession', { values: { when: student.last_session_at } })}</div>
								{/if}
								</div>
								<Badge variant="violet" label={student.age_category ?? ''} />
								<a href="/students/{student.user_id}" class="text-xs font-semibold text-primary">{$t('dashboard.teacher.openStudent')}</a>
							</div>
						{/each}
					{:else}
						<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.teacher.noPrivateStudents')}</p>
					{/if}
				</div>
			</Card>

			<!-- Recent Reports -->
			<Card padding="none">
				{#snippet head()}
					<h2 class="font-semibold">{$t('dashboard.teacher.recentReports')}</h2>
				{/snippet}
				<div class="divide-y divide-border">
					{#if d.recent_reports?.length}
						{#each d.recent_reports as report}
							<div class="flex items-center gap-3 px-5 py-3">
								<div class="w-8 h-8 rounded-pill bg-primary-light text-primary flex items-center justify-center flex-none">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
									</svg>
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm truncate">{report.student_id} · {report.session_id}</div>
									<div class="text-xs text-text2 tabular">{report.created_at}</div>
								</div>
								<a href="/reports/{report.student_id}" class="text-xs font-semibold text-primary">{$t('common.view')} →</a>
							</div>
						{/each}
					{:else}
						<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.teacher.noRecentReports')}</p>
					{/if}
				</div>
			</Card>
		</div>

		<!-- Quick Actions -->
		<div>
			<h2 class="font-semibold mb-4">{$t('dashboard.teacher.quickActions')}</h2>
			<div class="grid sm:grid-cols-3 gap-4">
				{#each [
					{ titleKey: 'dashboard.teacher.createCourse',       descKey: 'dashboard.teacher.createCourseDesc',       href: '/courses',  icon: 'M2 3h20v18H2z M12 3v18' },
					{ titleKey: 'dashboard.teacher.manageAvailability', descKey: 'dashboard.teacher.manageAvailabilityDesc', href: '/calendar', icon: 'M3 4h18v18H3z M16 2v4M8 2v4M3 10h18' },
					{ titleKey: 'dashboard.teacher.writeReport',        descKey: 'dashboard.teacher.writeReportDesc',        href: '/dashboard#private-students', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6' },
				] as action}
					<a
						href={action.href}
						class="bg-white border border-border rounded-DEFAULT p-5 hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
					>
						<div class="w-10 h-10 bg-primary-light text-primary rounded-DEFAULT flex items-center justify-center mb-3">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d={action.icon}/>
							</svg>
						</div>
						<div class="font-semibold text-sm">{$t(action.titleKey)}</div>
						<div class="text-xs text-text2 mt-0.5">{$t(action.descKey)}</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- My Students roster -->
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">My Students</h2>
			{/snippet}
			{#if studentsLoading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if students.length === 0}
				<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.teacher.noPrivateStudents')}</p>
			{:else}
				<div class="divide-y divide-border">
					{#each students as student}
						<div class="flex items-center gap-3 px-5 py-3">
							<Avatar name={student.full_name} id={student.user_id} size="md" />
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm">{student.full_name}</div>
							</div>
							{#if student.age_category}
								<Badge variant="violet" label={student.age_category} />
							{/if}
							<a href="/students/{student.user_id}" class="text-xs font-semibold text-primary">
								{$t('dashboard.teacher.openStudent')}
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</div>

{:else}
	<!-- ── Student Dashboard ── -->
	<div class="flex flex-col gap-6">
		<div>
			<h1 class="text-2xl font-bold">{$t('dashboard.student.welcome', { values: { name: d.full_name ?? '' } })}</h1>
		</div>

		<!-- Upcoming Sessions -->
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">{$t('dashboard.student.upcomingSessions')}</h2>
			{/snippet}
			<div class="divide-y divide-border">
				{#if d.upcoming_sessions?.length}
					{#each d.upcoming_sessions as session}
						<div class="flex items-center gap-4 px-5 py-3.5">
							<div class="w-10 h-10 rounded-DEFAULT flex items-center justify-center flex-none {session.type === 'group' ? 'bg-primary-light text-primary' : 'bg-teal-light text-teal'}">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm truncate">{session.title}</div>
								<div class="text-xs text-text2">{$t('dashboard.student.withTeacher', { values: { name: session.teacher_name ?? '' } })}</div>
							</div>
							<Badge variant={statusVariant(session.status)} label={session.status} />
							<span class="text-xs text-text2 bg-bgGray px-2 py-1 rounded-sm whitespace-nowrap tabular">{session.starts_at}</span>
						</div>
					{/each}
				{:else}
					<p class="px-5 py-8 text-sm text-text2 text-center">{$t('dashboard.student.noSessions')}</p>
				{/if}
			</div>
		</Card>

		<!-- Two-col row -->
		<div class="grid lg:grid-cols-2 gap-6">
			<!-- Enrolled Courses -->
			<Card padding="none">
				{#snippet head()}
					<div class="flex items-center justify-between w-full">
						<h2 class="font-semibold">{$t('dashboard.student.enrolledCourses')}</h2>
						<a href="/courses" class="text-xs font-semibold text-primary">{$t('dashboard.student.browseCoursesLink')}</a>
					</div>
				{/snippet}
				<div class="divide-y divide-border">
					{#if d.enrolled_courses?.length}
						{#each d.enrolled_courses as course}
							<div class="flex items-center gap-3 px-5 py-3">
								<div class="w-8 h-8 bg-primary-light text-primary rounded-pill flex items-center justify-center flex-none">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 3h20v18H2z"/><path d="M12 3v18"/></svg>
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm truncate">{course.title}</div>
									<div class="text-xs text-text2">
										{$t('dashboard.student.withTeacher', { values: { name: course.teacher_id } })}
										{#if course.next_session} · {$t('dashboard.student.nextSession', { values: { when: course.next_session } })}{/if}
									</div>
								</div>
								<a href="/courses" class="text-xs font-semibold text-primary">{$t('common.view')} →</a>
							</div>
						{/each}
					{:else}
						<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.student.noEnrolledCourses')}</p>
					{/if}
				</div>
			</Card>

			<!-- Latest Report Card -->
			<Card padding="none">
				{#snippet head()}
					<h2 class="font-semibold">{$t('dashboard.student.latestReport')}</h2>
				{/snippet}
				{#if d.latest_report}
					<div class="p-5">
						<div class="font-semibold text-sm mb-0.5">{d.latest_report.session_title ?? ''}</div>
						<div class="text-xs text-text2 mb-4 tabular">{d.latest_report.date ?? ''}</div>
						{#if d.latest_report.scores?.length}
							<div class="grid grid-cols-2 gap-2 mb-4">
								{#each d.latest_report.scores.slice(0, 4) as score}
									<div class="bg-bgGray rounded-sm p-3">
										<div class="text-[11px] uppercase font-medium text-text2 mb-1">{score.topic}</div>
										<div class="font-bold tabular">{score.score} <span class="text-xs text-text2 font-normal">/ {score.max}</span></div>
									</div>
								{/each}
							</div>
						{/if}
						{#if d.latest_report.notes}
							<blockquote class="text-sm text-text2 italic border-l-[3px] border-primary-light pl-3 mb-4">{d.latest_report.notes}</blockquote>
						{/if}
						<a href="/reports/{data.user?.id}" class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
							{$t('dashboard.student.viewFullReport')}
						</a>
					</div>
				{:else}
					<p class="px-5 py-6 text-sm text-text2 text-center">{$t('dashboard.student.noReport')}</p>
				{/if}
			</Card>
		</div>

		<!-- Assigned Teacher -->
		{#if d.assigned_teacher}
			<Card padding="default">
				<div class="flex items-center gap-4 flex-wrap">
					<Avatar name={d.assigned_teacher.full_name} id={d.assigned_teacher.user_id} size="lg" />
					<div class="flex-1 min-w-0">
						<div class="font-semibold text-[17px]">{d.assigned_teacher.full_name}</div>
						<div class="text-sm text-text2 mb-2">{$t('common.tutor')}</div>
						{#if d.assigned_teacher.subjects?.length}
							<div class="flex flex-wrap gap-1.5">
								{#each d.assigned_teacher.subjects as s}
									<Badge variant="teal" label={s} />
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<Button variant="primary" size="sm" href="/teachers/{d.assigned_teacher.user_id}">
							{$t('common.viewProfile')}
						</Button>
					</div>
				</div>
			</Card>
		{/if}
	</div>
{/if}
