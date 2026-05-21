<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allSubjects = $state<any[]>([]);
	let subjectsLoading = $state(true);

	let createSubjectOpen = $state(false);
	let newSubjectName = $state('');
	let createSubjectLoading = $state(false);
	let createSubjectFormEl = $state<HTMLFormElement | null>(null);

	let deleteSubjectOpen = $state(false);
	let deleteSubjectTarget = $state<{ id: string; name: string } | null>(null);
	let deleteSubjectLoading = $state(false);
	let deleteSubjectError = $state('');

	async function fetchSubjects() {
		subjectsLoading = true;
		try {
			const result = await api.get<any[]>('/subjects?status=verified');
			allSubjects = (Array.isArray(result) ? result : []).filter((s: any) => s.status !== 'deleted');
		} catch {
			allSubjects = [];
		} finally {
			subjectsLoading = false;
		}
	}

	async function handleCreateSubject(e: SubmitEvent) {
		e.preventDefault();
		createSubjectLoading = true;
		try {
			await api.post('/admin/subjects', { name: newSubjectName });
			createSubjectOpen = false;
			newSubjectName = '';
			await fetchSubjects();
		} catch {
			// stay open on error
		} finally {
			createSubjectLoading = false;
		}
	}

	function openDeleteSubject(id: string, name: string) {
		deleteSubjectTarget = { id, name };
		deleteSubjectError = '';
		deleteSubjectOpen = true;
	}

	async function handleDeleteSubject() {
		if (!deleteSubjectTarget) return;
		deleteSubjectLoading = true;
		deleteSubjectError = '';
		try {
			await api.delete(`/admin/subjects/${deleteSubjectTarget.id}`);
			allSubjects = allSubjects.filter((s: any) => s.id !== deleteSubjectTarget!.id);
			deleteSubjectOpen = false;
		} catch {
			deleteSubjectError = 'Failed to delete subject. Please try again.';
		} finally {
			deleteSubjectLoading = false;
		}
	}

	onMount(fetchSubjects);
</script>

<svelte:head>
	<title>Subjects — Mutawazin Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<h1 class="text-2xl font-bold">{$t('nav.subjects')}</h1>
		<Button variant="primary" onclick={() => (createSubjectOpen = true)}>
			{$t('dashboard.admin.createSubject')}
		</Button>
	</div>

	<Card padding="none">
		{#snippet head()}
			<h2 class="font-semibold">{$t('nav.subjects')}</h2>
		{/snippet}
		{#if subjectsLoading}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if allSubjects.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
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
						{#each allSubjects as subject}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3 font-medium">{subject.name}</td>
								<td class="px-5 py-3 hidden sm:table-cell">
									<Badge variant="success" label={subject.status ?? 'verified'} />
								</td>
								<td class="px-5 py-3 text-right">
									<button
										onclick={() => openDeleteSubject(subject.id, subject.name)}
										class="text-sm font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors"
									>
										Delete
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>

<!-- Create Subject Modal -->
<Modal
	open={createSubjectOpen}
	title={$t('dashboard.admin.createSubjectTitle')}
	onclose={() => (createSubjectOpen = false)}
>
	<form bind:this={createSubjectFormEl} onsubmit={handleCreateSubject} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="subjectNameInput" class="text-[13px] font-medium">{$t('dashboard.admin.subjectName')}</label>
			<input id="subjectNameInput" type="text" bind:value={newSubjectName} required
				placeholder="e.g. Introduction to Algebra"
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
		</div>
	</form>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (createSubjectOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="primary" size="sm" loading={createSubjectLoading} onclick={() => createSubjectFormEl?.requestSubmit()}>
			{$t('dashboard.admin.createSubject')}
		</Button>
	{/snippet}
</Modal>

<!-- Delete Subject Modal -->
<Modal open={deleteSubjectOpen} title="Delete {deleteSubjectTarget?.name ?? ''}?" onclose={() => (deleteSubjectOpen = false)}>
	{#if deleteSubjectError}
		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{deleteSubjectError}</div>
	{/if}
	<p class="text-sm text-text2">This action cannot be undone.</p>
	{#snippet footer()}
		<Button variant="secondary" size="sm" onclick={() => (deleteSubjectOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="danger" size="sm" loading={deleteSubjectLoading} onclick={handleDeleteSubject}>Delete</Button>
	{/snippet}
</Modal>
