<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allTeachers = $state<any[]>([]);
	let allTeachersLoading = $state(true);
	let statusFilter = $state('');
	let featuredMap = $state<Record<string, boolean>>({});
	let featuredLoading = $state<Record<string, boolean>>({});

	const filteredTeachers = $derived(
		allTeachers.filter((u: any) =>
			statusFilter ? (u.status ?? '').toLowerCase() === statusFilter : true
		)
	);

	async function fetchTeachers() {
		allTeachersLoading = true;
		try {
			const teachers = await api.get<any[]>('/admin/teachers');
			allTeachers = (Array.isArray(teachers) ? teachers : [])
				.filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending' && t.status !== 'deleted');
			featuredMap = Object.fromEntries(
				allTeachers.map((t: any) => [t.user_id ?? t.id, t.is_featured ?? false])
			);
		} catch {
			allTeachers = [];
		} finally {
			allTeachersLoading = false;
		}
	}

	async function toggleFeatured(teacherId: string) {
		featuredLoading = { ...featuredLoading, [teacherId]: true };
		try {
			const res = await api.patch<{ user_id: string; is_featured: boolean }>(
				`/admin/teachers/${teacherId}/featured`, {}
			);
			featuredMap = { ...featuredMap, [res.user_id]: res.is_featured };
		} catch {}
		featuredLoading = { ...featuredLoading, [teacherId]: false };
	}

	// Create teacher modal
	let createOpen = $state(false);
	let createError = $state('');
	let createLoading = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);
	let newFullName = $state('');
	let newUsername = $state('');
	let newPassword = $state('');
	let showNewPassword = $state(false);
	let newBio = $state('');
	let newSubjects = $state<string[]>([]);
	let newSubjectInput = $state('');
	let usernameAvailable = $state<boolean | null>(null);
	let usernameDebounce: ReturnType<typeof setTimeout>;

	let deleteOpen = $state(false);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let deleteLoading = $state(false);
	let deleteError = $state('');

	function openCreate() {
		createOpen = true;
		createError = '';
		newFullName = '';
		newUsername = '';
		newPassword = '';
		showNewPassword = false;
		newBio = '';
		newSubjects = [];
		newSubjectInput = '';
		usernameAvailable = null;
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		if (usernameAvailable === false) return;
		createError = '';
		createLoading = true;
		try {
			await api.post('/admin/users/teacher', {
				full_name: newFullName,
				username: newUsername,
				password: newPassword,
				bio: newBio,
				subjects: newSubjects,
				credentials: [],
			});
			createOpen = false;
			await fetchTeachers();
		} catch (err: unknown) {
			createError = err instanceof Error ? err.message : $t('auth.login.errors.unknown');
		} finally {
			createLoading = false;
		}
	}

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
			await api.delete(`/admin/teachers/${deleteTarget.id}`);
			allTeachers = allTeachers.filter((t: any) => (t.user_id ?? t.id) !== deleteTarget!.id);
			deleteOpen = false;
		} catch {
			deleteError = 'Failed to delete teacher. Please try again.';
		} finally {
			deleteLoading = false;
		}
	}

	function addNewTag() {
		const val = newSubjectInput.trim().replace(/,+$/, '');
		if (val && !newSubjects.includes(val)) newSubjects = [...newSubjects, val];
		newSubjectInput = '';
	}

	function removeNewTag(i: number) {
		newSubjects = newSubjects.filter((_, idx) => idx !== i);
	}

	function handleNewTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addNewTag(); }
		else if (e.key === 'Backspace' && !newSubjectInput) newSubjects = newSubjects.slice(0, -1);
	}

	function statusVariant(s: string): 'success' | 'warning' | 'error' | 'active' | 'gray' {
		const map: Record<string, 'success' | 'warning' | 'error' | 'active' | 'gray'> = {
			verified: 'success', Verified: 'success',
			active: 'active',    Active: 'active',
			rejected: 'error',   Rejected: 'error',
			deleted: 'gray',     Deleted: 'gray',
		};
		return map[s] ?? 'gray';
	}

	onMount(fetchTeachers);
</script>

<svelte:head>
	<title>Teachers — Mutawazin Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<h1 class="text-2xl font-bold">{$t('nav.teachers')}</h1>
		<Button variant="primary" onclick={openCreate}>{$t('dashboard.admin.createTeacher')}</Button>
	</div>

	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('dashboard.admin.allUsers')}</h2>
			<select
				bind:value={statusFilter}
				aria-label={$t('common.status')}
				class="h-8 px-2 text-sm bg-white border border-border rounded-sm focus:outline-none focus:border-primary"
			>
				<option value="">{$t('dashboard.admin.allStatuses')}</option>
				<option value="verified">{$t('status.verified')}</option>
				<option value="active">{$t('status.active')}</option>
				<option value="rejected">{$t('status.rejected')}</option>
			</select>
		{/snippet}
		{#if allTeachersLoading}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if filteredTeachers.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('common.name')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.contact')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('common.status')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('common.type')}</th>
							<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredTeachers as user}
							{@const tid = user.user_id ?? user.id}
							{@const isFeatured = featuredMap[tid] ?? false}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3">
									<div class="flex items-center gap-2.5">
										<Avatar name={user.full_name ?? user.name ?? ''} id={user.user_id ?? user.id ?? ''} size="sm" />
										<span class="font-medium">{user.full_name ?? user.name}</span>
									</div>
								</td>
								<td class="px-5 py-3 text-text2 hidden sm:table-cell">{user.email ?? user.username ?? '—'}</td>
								<td class="px-5 py-3 hidden md:table-cell">
									<Badge variant={statusVariant(user.status ?? '')} label={user.status ?? ''} />
								</td>
								<td class="px-5 py-3 text-text2 text-xs hidden lg:table-cell">
									{user.auth_type === 'username' || user.account_type === 'admin-created'
										? $t('common.adminCreated')
										: $t('common.selfRegistered')}
								</td>
								<td class="px-5 py-3 text-right">
									<button
										onclick={() => openDelete(tid, user.full_name ?? user.name ?? '')}
										class="mr-3 text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
									>
										Delete
									</button>
									<button
										onclick={() => toggleFeatured(tid)}
										disabled={featuredLoading[tid]}
										class="mr-3 text-sm font-medium px-2 py-1 rounded-sm transition-colors
										       {isFeatured
											? 'text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A]'
											: 'text-text2 bg-bgGray hover:bg-border/50'}
										       disabled:opacity-50"
										title={isFeatured ? 'Remove featured' : 'Mark as featured'}
									>
										{isFeatured ? '★' : '☆'} {isFeatured ? 'Featured' : 'Feature'}
									</button>
									<a href="/teachers/{user.user_id ?? user.id}"
										class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
										{$t('common.viewProfile')}
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>

<!-- Create Teacher Modal -->
<Modal open={createOpen} title={$t('dashboard.admin.createTeacherTitle')} onclose={() => (createOpen = false)}>
	{#if createError}
		<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert">{createError}</div>
	{/if}
	<form bind:this={formEl} onsubmit={handleCreate} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="newFullName" class="text-[13px] font-medium">{$t('auth.registerTeacher.fullName')}</label>
			<input id="newFullName" type="text" bind:value={newFullName} required
				placeholder={$t('auth.registerTeacher.fullNamePlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="newUsername" class="text-[13px] font-medium">{$t('dashboard.admin.usernameLabel')}</label>
			<input id="newUsername" type="text" bind:value={newUsername} required
				placeholder={$t('dashboard.admin.usernamePlaceholder')} autocomplete="off"
				oninput={(e) => {
					clearTimeout(usernameDebounce);
					const val = (e.target as HTMLInputElement).value.trim();
					if (!val) { usernameAvailable = null; return; }
					usernameDebounce = setTimeout(async () => {
						try {
							const res = await api.get<{ available: boolean }>(`/auth/check/username?username=${encodeURIComponent(val)}`);
							usernameAvailable = res.available;
						} catch { usernameAvailable = null; }
					}, 400);
				}}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
			{#if usernameAvailable === false}
				<p class="text-xs text-errorText mt-1">Username is already taken.</p>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="newPassword" class="text-[13px] font-medium">{$t('auth.registerTeacher.password')}</label>
			<div class="relative">
				<input id="newPassword" type={showNewPassword ? 'text' : 'password'} bind:value={newPassword} required
					autocomplete="new-password"
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				<button type="button" onclick={() => (showNewPassword = !showNewPassword)}
					class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded">
					{showNewPassword ? $t('common.hide') : $t('common.show')}
				</button>
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="newBio" class="text-[13px] font-medium">{$t('auth.registerTeacher.bio')}</label>
			<textarea id="newBio" bind:value={newBio} rows={3}
				placeholder={$t('auth.registerTeacher.bioPlaceholder')}
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm resize-vertical min-h-[84px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"></textarea>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="newSubjectInput" class="text-[13px] font-medium">{$t('auth.registerTeacher.subjects')}</label>
			<div class="flex flex-wrap gap-1.5 items-center p-2 border border-border rounded-sm bg-white min-h-[44px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
				{#each newSubjects as subject, i}
					<span class="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 bg-primary-light text-primary-dark text-xs font-medium rounded-pill">
						{subject}
						<button type="button" onclick={() => removeNewTag(i)} class="w-4 h-4 grid place-items-center rounded-pill hover:bg-primary-dark/20">×</button>
					</span>
				{/each}
				<input id="newSubjectInput" type="text" bind:value={newSubjectInput}
					onkeydown={handleNewTagKeydown} onblur={addNewTag}
					placeholder={newSubjects.length === 0 ? $t('auth.registerTeacher.subjectsPlaceholder') : ''}
					class="flex-1 min-w-[100px] border-0 outline-none bg-transparent text-sm" />
			</div>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => formEl?.requestSubmit()}>
			{$t('dashboard.admin.createTeacher')}
		</Button>
	{/snippet}
</Modal>

<!-- Delete Teacher Modal -->
<Modal open={deleteOpen} title="Delete {deleteTarget?.name ?? ''}?" onclose={() => (deleteOpen = false)}>
	{#if deleteError}
		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteError}</div>
	{/if}
	<p class="text-sm text-text2">This action cannot be undone.</p>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="danger" size="sm" loading={deleteLoading} onclick={handleDelete}>Delete</Button>
	{/snippet}
</Modal>
