<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allCourses = $state<any[]>([]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allTeachers = $state<any[]>([]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allSubjects = $state<any[]>([]);
	let teacherMap = $state<Record<string, string>>({});
	let loading = $state(true);

	const AGE_CATEGORIES = ['pre-school', 'elementary', 'middle-school', 'high-school', 'general'];

	async function fetchAll() {
		loading = true;
		try {
			const [coursesRes, teachersRes, subjectsRes] = await Promise.all([
				api.get<any[]>('/courses'),
				api.get<any[]>('/admin/teachers'),
				api.get<any[]>('/subjects?status=verified'),
			]);
			allCourses = Array.isArray(coursesRes) ? coursesRes : [];
			allTeachers = (Array.isArray(teachersRes) ? teachersRes : [])
				.filter((t: any) => t.status !== 'deleted' && t.status !== 'pending' && t.status !== 'email_verified');
			allSubjects = (Array.isArray(subjectsRes) ? subjectsRes : [])
				.filter((s: any) => s.status !== 'deleted');
			teacherMap = Object.fromEntries(
				allTeachers.map((t: any) => [t.user_id ?? t.id, t.full_name ?? t.name ?? '—'])
			);
		} catch {
			allCourses = [];
		} finally {
			loading = false;
		}
	}

	function statusVariant(s: string): 'success' | 'gray' {
		return s === 'active' ? 'success' : 'gray';
	}

	// ── Create modal ──────────────────────────────────────────
	let createOpen = $state(false);
	let createError = $state('');
	let createLoading = $state(false);
	let createFormEl = $state<HTMLFormElement | null>(null);
	let newTeacherId = $state('');
	let newSubjectId = $state('');
	let newAgeCategories = $state<string[]>([]);
	let newPrices = $state<Record<string, string>>({});
	let newDescription = $state('');

	function openCreate() {
		createOpen = true;
		createError = '';
		newTeacherId = '';
		newSubjectId = '';
		newAgeCategories = [];
		newPrices = {};
		newDescription = '';
	}

	function toggleAge(cat: string, checked: boolean) {
		if (checked) {
			newAgeCategories = [...newAgeCategories, cat];
		} else {
			newAgeCategories = newAgeCategories.filter(c => c !== cat);
			const { [cat]: _, ...rest } = newPrices;
			newPrices = rest;
		}
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		if (!newTeacherId || !newSubjectId || newAgeCategories.length === 0) return;
		createLoading = true;
		createError = '';
		try {
			const price_by_age_category = Object.fromEntries(
				newAgeCategories.map(cat => [cat, parseFloat(newPrices[cat] ?? '0') || 0])
			);
			const course = await api.post<any>('/admin/courses', {
				teacher_id: newTeacherId,
				subject_id: newSubjectId,
				age_categories: newAgeCategories,
				price_by_age_category,
				description: newDescription || undefined,
			});
			allCourses = [course, ...allCourses];
			createOpen = false;
		} catch (err: unknown) {
			createError = err instanceof Error ? err.message : 'Failed to create course.';
		} finally {
			createLoading = false;
		}
	}

	// ── Edit modal ────────────────────────────────────────────
	let editOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let editTarget = $state<any | null>(null);
	let editError = $state('');
	let editLoading = $state(false);
	let editFormEl = $state<HTMLFormElement | null>(null);
	let editTeacherId = $state('');
	let editOriginalTeacherId = $state('');
	let editSubjectId = $state('');
	let editAgeCategories = $state<string[]>([]);
	let editPrices = $state<Record<string, string>>({});
	let editDescription = $state('');
	let editStatus = $state<'draft' | 'active' | 'archived'>('active');

	function openEdit(course: any) {
		editTarget = course;
		editError = '';
		editTeacherId = course.teacher_id;
		editOriginalTeacherId = course.teacher_id;
		editSubjectId = course.subject_id;
		editAgeCategories = [...(course.age_categories ?? [])];
		editPrices = Object.fromEntries(
			Object.entries(course.price_by_age_category ?? {}).map(([k, v]) => [k, String(v)])
		);
		editDescription = course.description ?? '';
		editStatus = course.status ?? 'active';
		editOpen = true;
	}

	function toggleEditAge(cat: string, checked: boolean) {
		if (checked) {
			editAgeCategories = [...editAgeCategories, cat];
		} else {
			editAgeCategories = editAgeCategories.filter(c => c !== cat);
			const { [cat]: _, ...rest } = editPrices;
			editPrices = rest;
		}
	}

	async function handleEdit(e: SubmitEvent) {
		e.preventDefault();
		if (!editTarget) return;
		editLoading = true;
		editError = '';
		try {
			const price_by_age_category = Object.fromEntries(
				editAgeCategories.map(cat => [cat, parseFloat(editPrices[cat] ?? '0') || 0])
			);
			const updated = await api.put<any>(`/admin/courses/${editTarget.id}`, {
				teacher_id: editTeacherId,
				subject_id: editSubjectId,
				age_categories: editAgeCategories,
				price_by_age_category,
				description: editDescription || undefined,
				status: editStatus,
			});
			allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
			editOpen = false;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409') || msg.toLowerCase().includes('enrolled')) {
				editError = 'Cannot change subject while students are enrolled — unenroll them first.';
			} else {
				editError = msg || 'Failed to save.';
			}
		} finally {
			editLoading = false;
		}
	}

	// ── Delete modal ──────────────────────────────────────────
	let deleteOpen = $state(false);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let deleteLoading = $state(false);
	let deleteError = $state('');

	function openDelete(id: string, name: string) {
		deleteTarget = { id, name };
		deleteError = '';
		deleteOpen = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		deleteLoading = true;
		deleteError = '';
		try {
			await api.delete(`/admin/courses/${deleteTarget.id}`);
			allCourses = allCourses.filter((c: any) => c.id !== deleteTarget!.id);
			deleteOpen = false;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409') || msg.toLowerCase().includes('enrolled')) {
				deleteError = 'Unenroll all students before deleting this course.';
			} else {
				deleteError = msg || 'Failed to delete course.';
			}
		} finally {
			deleteLoading = false;
		}
	}

	// ── Enrollment modal ──────────────────────────────────────
	let enrollOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let enrollTarget = $state<any | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allStudents = $state<any[]>([]);
	let studentsLoading = $state(false);
	let studentMap = $state<Record<string, string>>({});
	let enrollStudentId = $state('');
	let enrollLoading = $state(false);
	let unenrollLoadingId = $state<string | null>(null);
	let enrollError = $state('');

	async function openManageStudents(course: any) {
		enrollTarget = course;
		enrollStudentId = '';
		enrollError = '';
		enrollOpen = true;
		if (allStudents.length > 0) return;
		studentsLoading = true;
		try {
			const res = await api.get<any[]>('/admin/students');
			allStudents = (Array.isArray(res) ? res : [])
				.filter((s: any) => s.status !== 'deleted');
			studentMap = {};
			for (const s of allStudents) {
				const name = s.full_name ?? s.name ?? '—';
				if (s.user_id) studentMap[s.user_id] = name;
				if (s.id && s.id !== s.user_id) studentMap[s.id] = name;
			}
		} catch {
			allStudents = [];
		} finally {
			studentsLoading = false;
		}
	}

	async function handleEnroll() {
		if (!enrollTarget || !enrollStudentId) return;
		enrollLoading = true;
		enrollError = '';
		try {
			await api.post(`/courses/${enrollTarget.id}/enroll`, { student_id: enrollStudentId });
			const updated = {
				...enrollTarget,
				enrolled_student_ids: [...(enrollTarget.enrolled_student_ids ?? []), enrollStudentId],
			};
			enrollTarget = updated;
			allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
			enrollStudentId = '';
		} catch (err: unknown) {
			enrollError = err instanceof Error ? err.message : 'Failed to enroll student.';
		} finally {
			enrollLoading = false;
		}
	}

	async function handleUnenroll(studentId: string) {
		if (!enrollTarget) return;
		unenrollLoadingId = studentId;
		enrollError = '';
		try {
			await api.delete(`/courses/${enrollTarget.id}/enroll/${studentId}`);
			const updated = {
				...enrollTarget,
				enrolled_student_ids: (enrollTarget.enrolled_student_ids ?? []).filter((id: string) => id !== studentId),
			};
			enrollTarget = updated;
			allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
		} catch (err: unknown) {
			enrollError = err instanceof Error ? err.message : 'Failed to unenroll student.';
		} finally {
			unenrollLoadingId = null;
		}
	}

	onMount(fetchAll);
</script>

<svelte:head>
	<title>Courses — Mutawazin Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<h1 class="text-2xl font-bold">Courses</h1>
		<Button variant="primary" onclick={openCreate}>Create Course</Button>
	</div>

	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">All Courses</h2>
		{/snippet}
		{#if loading}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allCourses.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">Course</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">Teacher</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">Age Categories</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('common.status')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">Enrolled</th>
							<th class="px-5 py-3 text-left">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each allCourses as course}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3 font-medium">{course.name}</td>
								<td class="px-5 py-3 text-text2 hidden sm:table-cell">
									{teacherMap[course.teacher_id] ?? '—'}
								</td>
								<td class="px-5 py-3 hidden md:table-cell">
									<div class="flex flex-wrap gap-1">
										{#each (course.age_categories ?? []) as cat}
											<Badge variant="violet" label={cat} />
										{/each}
									</div>
								</td>
								<td class="px-5 py-3 hidden lg:table-cell">
									<Badge variant={statusVariant(course.status ?? '')} label={course.status ?? ''} />
								</td>
								<td class="px-5 py-3 text-text2 hidden lg:table-cell">
									{(course.enrolled_student_ids ?? []).length}
								</td>
								<td class="px-5 py-3">
									<DropdownMenu items={[
										{ label: 'Manage Students', onclick: () => openManageStudents(course) },
										{ label: 'Edit', onclick: () => openEdit(course) },
										{ label: 'Delete', variant: 'danger', onclick: () => openDelete(course.id, course.name) },
									]} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>

<!-- Create Course Modal -->
<Modal open={createOpen} title="Create Course" onclose={() => (createOpen = false)}>
	{#if createError}
		<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert">{createError}</div>
	{/if}
	<form bind:this={createFormEl} onsubmit={handleCreate} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="newTeacher" class="text-[13px] font-medium">Teacher</label>
			<select id="newTeacher" bind:value={newTeacherId} required
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
				<option value="">Select a teacher</option>
				{#each allTeachers as teacher}
					<option value={teacher.user_id ?? teacher.id}>{teacher.full_name ?? teacher.name}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="newSubject" class="text-[13px] font-medium">Subject</label>
			<select id="newSubject" bind:value={newSubjectId} required
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
				<option value="">Select a subject</option>
				{#each allSubjects as subject}
					<option value={subject.id}>{subject.name}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">Age Categories</p>
			<div class="flex flex-col gap-2">
				{#each AGE_CATEGORIES as cat}
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox"
							checked={newAgeCategories.includes(cat)}
							onchange={(e) => toggleAge(cat, (e.target as HTMLInputElement).checked)}
							class="w-4 h-4 rounded text-primary focus:ring-primary/15" />
						<span class="flex-1">{cat}</span>
						{#if newAgeCategories.includes(cat)}
							<input type="number" min="0" step="0.01"
								bind:value={newPrices[cat]}
								placeholder="Price"
								class="w-28 bg-white border border-border rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
						{/if}
					</label>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="newDesc" class="text-[13px] font-medium">
				Description <span class="text-text2 font-normal">(optional)</span>
			</label>
			<textarea id="newDesc" bind:value={newDescription} rows={3}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical min-h-[84px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => createFormEl?.requestSubmit()}>
			Create Course
		</Button>
	{/snippet}
</Modal>

<!-- Edit Course Modal -->
<Modal open={editOpen} title="Edit Course" onclose={() => (editOpen = false)}>
	{#if editError}
		<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert">{editError}</div>
	{/if}
	<form bind:this={editFormEl} onsubmit={handleEdit} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="editTeacher" class="text-[13px] font-medium">Teacher</label>
			<select id="editTeacher" bind:value={editTeacherId}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
				{#each allTeachers as teacher}
					<option value={teacher.user_id ?? teacher.id}>{teacher.full_name ?? teacher.name}</option>
				{/each}
			</select>
			{#if editTeacherId !== editOriginalTeacherId}
				<p class="text-xs text-warningText mt-1">Future scheduled sessions will be reassigned to the new teacher.</p>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="editSubject" class="text-[13px] font-medium">Subject</label>
			<select id="editSubject" bind:value={editSubjectId}
				disabled={(editTarget?.enrolled_student_ids?.length ?? 0) > 0}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50 disabled:cursor-not-allowed">
				{#each allSubjects as subject}
					<option value={subject.id}>{subject.name}</option>
				{/each}
			</select>
			{#if (editTarget?.enrolled_student_ids?.length ?? 0) > 0}
				<p class="text-xs text-text2 mt-1">Subject cannot be changed while students are enrolled.</p>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">Age Categories</p>
			<div class="flex flex-col gap-2">
				{#each AGE_CATEGORIES as cat}
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox"
							checked={editAgeCategories.includes(cat)}
							onchange={(e) => toggleEditAge(cat, (e.target as HTMLInputElement).checked)}
							class="w-4 h-4 rounded text-primary focus:ring-primary/15" />
						<span class="flex-1">{cat}</span>
						{#if editAgeCategories.includes(cat)}
							<input type="number" min="0" step="0.01"
								bind:value={editPrices[cat]}
								placeholder="Price"
								class="w-28 bg-white border border-border rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15" />
						{/if}
					</label>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="editDesc" class="text-[13px] font-medium">
				Description <span class="text-text2 font-normal">(optional)</span>
			</label>
			<textarea id="editDesc" bind:value={editDescription} rows={3}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical min-h-[84px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
		<div class="flex flex-col gap-1.5">
			<p class="text-[13px] font-medium">Status</p>
			<div class="flex gap-2">
				{#each (['draft', 'active', 'archived'] as const) as s}
					<button type="button" onclick={() => (editStatus = s)}
						class="px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors
						       {editStatus === s
							? 'bg-primary-light text-primary-dark border-primary'
							: 'border-border text-text2 hover:bg-bgGray'}">
						{s}
					</button>
				{/each}
			</div>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (editOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={editLoading} onclick={() => editFormEl?.requestSubmit()}>
			Save
		</Button>
	{/snippet}
</Modal>

<!-- Delete Course Modal -->
<Modal open={deleteOpen} title="Delete {deleteTarget?.name ?? ''}?" onclose={() => (deleteOpen = false)}>
	{#if deleteError}
		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
	{/if}
	<p class="text-sm text-text2">Future scheduled sessions will be cancelled. This action cannot be undone.</p>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
	{/snippet}
</Modal>

<!-- Manage Students Modal -->
<Modal open={enrollOpen} title="Manage Students — {enrollTarget?.name ?? ''}" onclose={() => (enrollOpen = false)}>
	{#if enrollError}
		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{enrollError}</div>
	{/if}

	<!-- Enrolled Students -->
	<div class="mb-5">
		<h3 class="text-[13px] font-semibold text-text2 uppercase tracking-wide mb-2">Enrolled Students</h3>
		{#if studentsLoading}
			<p class="text-sm text-text2">{$t('common.loading')}</p>
		{:else if (enrollTarget?.enrolled_student_ids ?? []).length === 0}
			<p class="text-sm text-text2">No students enrolled yet.</p>
		{:else}
			<div class="flex flex-col divide-y divide-border">
				{#each (enrollTarget?.enrolled_student_ids ?? []) as sid}
					<div class="flex items-center justify-between py-2.5">
						<span class="text-sm">{studentMap[sid] ?? sid}</span>
						<button
							onclick={() => handleUnenroll(sid)}
							disabled={unenrollLoadingId === sid}
							class="text-xs font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors disabled:opacity-50"
						>
							{unenrollLoadingId === sid ? 'Removing…' : 'Unenroll'}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Enroll a Student -->
	<div>
		<h3 class="text-[13px] font-semibold text-text2 uppercase tracking-wide mb-2">Enroll a Student</h3>
		{#if studentsLoading}
			<p class="text-sm text-text2">Loading students…</p>
		{:else}
			{@const available = allStudents.filter((s: any) =>
				!(enrollTarget?.enrolled_student_ids ?? []).includes(s.user_id ?? s.id)
			)}
			{#if available.length === 0}
				<p class="text-sm text-text2">All students are already enrolled.</p>
			{:else}
				<div class="flex gap-2">
					<select bind:value={enrollStudentId}
						class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
						<option value="">Select a student</option>
						{#each available as student}
							<option value={student.user_id ?? student.id}>{student.full_name ?? student.name}</option>
						{/each}
					</select>
					<Button variant="primary" size="sm" loading={enrollLoading}
						onclick={handleEnroll} disabled={!enrollStudentId}>
						Enroll
					</Button>
				</div>
			{/if}
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (enrollOpen = false)}>{$t('common.cancel')}</Button>
	{/snippet}
</Modal>
