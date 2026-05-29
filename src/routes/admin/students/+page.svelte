<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from 'svelte-i18n';
	import { api, type PaginatedResponse } from '$lib/api';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allStudents = $state<any[]>([]);
	let allStudentsLoading = $state(true);
	let statusFilter = $state('');
	let page = $state(1);
	let totalPages = $state(1);
	const pageSize = 25;

	async function fetchStudents() {
		allStudentsLoading = true;
		try {
			const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
			if (statusFilter) params.set('status', statusFilter);
			const body = await api.get<PaginatedResponse<any>>(`/admin/students?${params}`);
			allStudents = body.data
				.filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending' && s.status !== 'deleted');
			totalPages = body.pagination.totalPages;
		} catch {
			allStudents = [];
			totalPages = 1;
		} finally {
			allStudentsLoading = false;
		}
	}

	// Create student modal
	let createOpen = $state(false);
	let createError = $state('');
	let createLoading = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);
	let newFullName = $state('');
	let newUsername = $state('');
	let newPassword = $state('');
	let showNewPassword = $state(false);
	let newDob = $state('');
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
		newDob = '';
		usernameAvailable = null;
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		if (usernameAvailable === false) return;
		createError = '';
		createLoading = true;
		try {
			await api.post('/admin/users/student', {
				full_name: newFullName,
				username: newUsername,
				password: newPassword,
				date_of_birth: newDob,
			});
			createOpen = false;
			await fetchStudents();
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
			await api.delete(`/admin/students/${deleteTarget.id}`);
			allStudents = allStudents.filter((s: any) => (s.user_id ?? s.id) !== deleteTarget!.id);
			deleteOpen = false;
		} catch {
			deleteError = 'Failed to delete student. Please try again.';
		} finally {
			deleteLoading = false;
		}
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

	onMount(fetchStudents);
</script>

<svelte:head>
	<title>Students — Mutawazin Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<h1 class="text-2xl font-bold">{$t('nav.students')}</h1>
		<Button variant="primary" onclick={openCreate}>{$t('dashboard.admin.createStudent')}</Button>
	</div>

	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('dashboard.admin.allUsers')}</h2>
			<select
				bind:value={statusFilter}
				onchange={() => { page = 1; fetchStudents(); }}
				aria-label={$t('common.status')}
				class="h-8 px-2 text-sm bg-white border border-border rounded-sm focus:outline-none focus:border-primary"
			>
				<option value="">{$t('dashboard.admin.allStatuses')}</option>
				<option value="verified">{$t('status.verified')}</option>
				<option value="active">{$t('status.active')}</option>
				<option value="rejected">{$t('status.rejected')}</option>
			</select>
		{/snippet}
		{#if allStudentsLoading && allStudents.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allStudents.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto" class:opacity-50={allStudentsLoading} class:pointer-events-none={allStudentsLoading}>
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('common.name')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.contact')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('common.status')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('common.age')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('common.type')}</th>
							<th class="px-5 py-3 text-left">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each allStudents as user}
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
								<td class="px-5 py-3 hidden md:table-cell text-sm text-text2">
									{user.age != null ? String(user.age) : '—'}
								</td>
								<td class="px-5 py-3 text-text2 text-xs hidden lg:table-cell">
									{user.auth_type === 'username' || user.account_type === 'admin-created'
										? $t('common.adminCreated')
										: $t('common.selfRegistered')}
								</td>
								<td class="px-5 py-3 text-right">
									<DropdownMenu items={[
										{ label: $t('common.viewProfile'), onclick: () => goto(`/students/${user.user_id ?? user.id}`) },
										{ label: 'Delete', variant: 'danger', onclick: () => openDelete(user.user_id ?? user.id, user.full_name ?? user.name ?? '') },
									]} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchStudents(); }} />
	</Card>
</div>

<!-- Create Student Modal -->
<Modal open={createOpen} title={$t('dashboard.admin.createStudentTitle')} onclose={() => (createOpen = false)}>
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
			<label for="newDob" class="text-[13px] font-medium">{$t('auth.registerStudent.dob')}</label>
			<input id="newDob" type="date" bind:value={newDob} required
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
			<p class="text-xs text-text2">{$t('auth.registerStudent.dobHelper')}</p>
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createLoading} onclick={() => formEl?.requestSubmit()}>
			{$t('dashboard.admin.createStudent')}
		</Button>
	{/snippet}
</Modal>

<!-- Delete Student Modal -->
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
