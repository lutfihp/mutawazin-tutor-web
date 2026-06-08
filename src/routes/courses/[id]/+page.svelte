<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import { AGE_KEYS } from '$lib/utils/ageCategories';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let { data } = $props();
	const course = $derived(data.course);
	const role = $derived(data.user?.role ?? 'student');
	const userId = $derived(data.user?.id ?? '');

	const isStudent = $derived(role === 'student');
	const isAdmin = $derived(role === 'admin');
	const isTeacherOwner = $derived(role === 'teacher' && userId === course?.teacher_id);
	const enrolledCount = $derived(course?.enrolled_student_ids?.length ?? 0);
	const canDelete = $derived(isTeacherOwner && enrolledCount === 0);

	const isEnrolled = $derived(
		isStudent &&
		Array.isArray(course?.enrolled_student_ids) &&
		course.enrolled_student_ids.includes(userId)
	);

	function formatPrice(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(amount);
	}

	function courseStatusVariant(s: string): 'success' | 'warning' | 'gray' {
		if (s === 'active') return 'success';
		if (s === 'draft') return 'gray';
		return 'warning';
	}

	function subjectStatusVariant(s: string): 'error' | 'teal' {
		return s === 'deleted' || s === 'unknown' ? 'error' : 'teal';
	}

	let deleteOpen = $state(false);
	let deleteLoading = $state(false);
	let deleteError = $state('');

	async function handleDelete() {
		deleteLoading = true;
		deleteError = '';
		try {
			await api.delete(`/courses/${course.id}`);
			goto('/courses');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('403')) {
				deleteError = "You don't have permission to delete this course.";
			} else if (msg.includes('409') || msg.toLowerCase().includes('enrolled')) {
				deleteError = 'This course has enrolled students and cannot be deleted.';
			} else {
				deleteError = msg || 'Failed to delete course.';
			}
		} finally {
			deleteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{course?.name ?? 'Course'} — Mutawazin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Back -->
	<a href="/courses" class="text-sm text-text2 hover:text-text">
		{$t('courses.detail.back')}
	</a>

	<!-- Header -->
	<div>
		<div class="flex items-center gap-2 flex-wrap mb-2">
			<Badge variant={courseStatusVariant(course?.status ?? '')} label={course?.status ?? ''} />
			{#if course?.subject_status && course.subject_status !== 'active'}
				<Badge variant={subjectStatusVariant(course.subject_status)} label={course.subject_status} />
			{/if}
		</div>
		<h1 class="text-2xl font-bold">{course?.name ?? ''}</h1>
	</div>

	<!-- Description -->
	{#if course?.description}
		<Card padding="default">
			<p class="text-sm text-text2 leading-relaxed">{course.description}</p>
		</Card>
	{/if}

	<!-- Teacher -->
	<Card padding="default">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs text-text2 mb-0.5">{$t('courses.detail.teacher')}</p>
				<p class="font-semibold">{course?.teacher_name ?? '—'}</p>
			</div>
			{#if course?.teacher_id}
				<a
					href="/teachers/{course.teacher_id}"
					class="text-sm font-semibold text-primary hover:text-primary-dark"
				>
					{$t('common.viewProfile')}
				</a>
			{/if}
		</div>
	</Card>

	<!-- Pricing -->
	{#if course?.age_categories?.length}
		<Card padding="none">
			{#snippet head()}
				<h2 class="font-semibold">{$t('courses.detail.pricing')}</h2>
			{/snippet}
			<div class="divide-y divide-border">
				{#each course.age_categories as cat}
					<div class="flex items-center justify-between px-5 py-3 text-sm">
						<span>{$t(AGE_KEYS[cat] ?? cat)}</span>
						<span class="font-semibold tabular">
							{formatPrice(course.price_by_age_category?.[cat] ?? 0)}
						</span>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Enrollment info -->
	{#if isStudent && isEnrolled}
		<div>
			<Badge variant="success" label={$t('courses.detail.isEnrolled')} />
		</div>
	{/if}

	{#if !isStudent}
		<p class="text-sm text-text2">
			{$t('courses.enrolled', { values: { n: enrolledCount } })}
		</p>
	{/if}

	{#if isAdmin}
		<a href="/admin/courses" class="text-sm font-semibold text-primary hover:text-primary-dark">
			{$t('courses.detail.manageEnrollments')}
		</a>
	{/if}

	{#if canDelete}
		<div class="pt-2">
			<Button variant="danger" size="sm" onclick={() => (deleteOpen = true)}>Delete Course</Button>
		</div>
	{/if}
</div>

<Modal open={deleteOpen} title="Delete Course?" onclose={() => (deleteOpen = false)}>
	{#if deleteError}
		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
	{/if}
	<p class="text-sm text-text2">Future scheduled sessions will also be deleted. This action cannot be undone.</p>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
	{/snippet}
</Modal>
