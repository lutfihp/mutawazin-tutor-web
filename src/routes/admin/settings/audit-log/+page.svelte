<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import type { AuditLogEntry, PaginatedResponse } from '$lib/api';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	// ── State ────────────────────────────────────────────────────────────────
	let entries = $state<AuditLogEntry[]>([]);
	let totalPages = $state(1);
	let page = $state(1);
	const pageSize = 50;
	let loading = $state(false);
	let error = $state('');

	// Filters — applied on "Apply", not live
	let fromDate = $state('');
	let toDate = $state('');
	let actionFilter = $state('');
	let resourceTypeFilter = $state('');

	// Only one diff panel open at a time
	let expandedId = $state<string | null>(null);

	// ── Badge maps ───────────────────────────────────────────────────────────
	const actionBadge: Record<string, string> = {
		CREATE: 'bg-green-100 text-green-800',
		UPDATE: 'bg-blue-100 text-blue-800',
		DELETE: 'bg-red-100 text-red-800',
	};

	const dotColor: Record<string, string> = {
		admin:   'bg-violet-600',
		teacher: 'bg-teal-600',
		student: 'bg-amber-500',
	};

	// ── Helpers ──────────────────────────────────────────────────────────────
	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString('id-ID', {
			day: '2-digit', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}

	function truncateId(id: string | null): string {
		if (!id) return '—';
		return id.length > 8 ? id.slice(0, 8) + '…' : id;
	}

	function actorLabel(entry: AuditLogEntry): string {
		return entry.actor_email ?? entry.actor_username ?? entry.actor_id;
	}

	function getDiffKeys(
		before: Record<string, unknown> | null,
		after: Record<string, unknown> | null
	): string[] {
		const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
		return [...keys].filter(k => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
	}

	// ── Data fetching ────────────────────────────────────────────────────────
	async function fetchLogs() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams();
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);
			if (actionFilter) params.set('action', actionFilter);
			if (resourceTypeFilter) params.set('resource_type', resourceTypeFilter);
			params.set('page', String(page));
			params.set('limit', String(pageSize));
			const body = await api.get<PaginatedResponse<AuditLogEntry>>(`/admin/audit-logs?${params}`);
			entries = body.data;
			totalPages = body.pagination.totalPages;
		} catch (e) {
			error = e instanceof Error ? e.message : $t('auditLog.error');
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		page = 1;
		expandedId = null;
		fetchLogs();
	}

	function resetFilters() {
		fromDate = ''; toDate = ''; actionFilter = ''; resourceTypeFilter = '';
		page = 1;
		expandedId = null;
		fetchLogs();
	}

	function changePage(n: number) {
		page = n;
		expandedId = null;
		fetchLogs();
	}

	onMount(fetchLogs);
</script>

<svelte:head><title>{$t('auditLog.title')} — Mutawazin Admin</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">{$t('auditLog.title')}</h1>

	<!-- Filter bar -->
	<Card padding="default">
		<div class="flex flex-wrap gap-3 items-end">
			<div class="flex flex-col gap-1">
				<label for="audit-from" class="text-xs font-medium text-text2">{$t('auditLog.filterFrom')}</label>
				<input id="audit-from" type="date" bind:value={fromDate} class="border border-border rounded-sm px-3 py-2 text-sm" />
			</div>
			<div class="flex flex-col gap-1">
				<label for="audit-to" class="text-xs font-medium text-text2">{$t('auditLog.filterTo')}</label>
				<input id="audit-to" type="date" bind:value={toDate} class="border border-border rounded-sm px-3 py-2 text-sm" />
			</div>
			<div class="flex flex-col gap-1">
				<label for="audit-action" class="text-xs font-medium text-text2">{$t('auditLog.colAction')}</label>
				<select id="audit-action" bind:value={actionFilter} class="border border-border rounded-sm px-3 py-2 text-sm">
					<option value="">{$t('auditLog.filterAction')}</option>
					<option value="CREATE">CREATE</option>
					<option value="UPDATE">UPDATE</option>
					<option value="DELETE">DELETE</option>
				</select>
			</div>
			<div class="flex flex-col gap-1">
				<label for="audit-resource" class="text-xs font-medium text-text2">{$t('auditLog.colResource')}</label>
				<select id="audit-resource" bind:value={resourceTypeFilter} class="border border-border rounded-sm px-3 py-2 text-sm">
					<option value="">{$t('auditLog.filterResource')}</option>
					<option value="Course">Course</option>
					<option value="Session">Session</option>
					<option value="User">User</option>
					<option value="Subject">Subject</option>
					<option value="TeacherProfile">TeacherProfile</option>
					<option value="StudentProfile">StudentProfile</option>
					<option value="Report">Report</option>
					<option value="Rating">Rating</option>
					<option value="RecurringTemplate">RecurringTemplate</option>
				</select>
			</div>
			<div class="flex gap-2 ml-auto">
				<Button variant="secondary" onclick={resetFilters}>{$t('auditLog.reset')}</Button>
				<Button variant="primary" onclick={applyFilters}>{$t('auditLog.apply')}</Button>
			</div>
		</div>
	</Card>

	<!-- Role legend -->
	<div class="flex items-center gap-4 text-xs text-text2">
		<span>Actor role:</span>
		<span class="flex items-center gap-1.5">
			<span class="w-2 h-2 rounded-full bg-violet-600"></span> Admin
		</span>
		<span class="flex items-center gap-1.5">
			<span class="w-2 h-2 rounded-full bg-teal-600"></span> Teacher
		</span>
		<span class="flex items-center gap-1.5">
			<span class="w-2 h-2 rounded-full bg-amber-500"></span> Student
		</span>
	</div>

	<!-- Error banner -->
	{#if error}
		<div class="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
	{/if}

	<!-- Table -->
	<Card padding="none">
		<div class="overflow-x-auto" class:opacity-50={loading} class:pointer-events-none={loading}>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-bgGray">
						<th class="text-left px-4 py-3 font-medium text-text2">{$t('auditLog.colWhen')}</th>
						<th class="text-left px-4 py-3 font-medium text-text2">{$t('auditLog.colActor')}</th>
						<th class="text-left px-4 py-3 font-medium text-text2">{$t('auditLog.colAction')}</th>
						<th class="text-left px-4 py-3 font-medium text-text2">{$t('auditLog.colResource')}</th>
						<th class="text-left px-4 py-3 font-medium text-text2">{$t('auditLog.colEndpoint')}</th>
						<th class="text-left px-4 py-3 font-medium text-text2">{$t('auditLog.colChanges')}</th>
					</tr>
				</thead>
				<tbody>
					{#if loading && entries.length === 0}
						{#each { length: 5 } as _}
							<tr class="border-b border-border">
								{#each { length: 6 } as _}
									<td class="px-4 py-3">
										<div class="h-4 bg-border rounded animate-pulse"></div>
									</td>
								{/each}
							</tr>
						{/each}
					{:else if entries.length === 0}
						<tr>
							<td colspan="6" class="px-4 py-12 text-center text-sm text-text2">
								{$t('auditLog.empty')}
							</td>
						</tr>
					{:else}
						{#each entries as entry}
							<tr class="border-b border-border hover:bg-bgGray/50">
								<td class="px-4 py-3 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<span class="w-2 h-2 rounded-full flex-none {dotColor[entry.actor_role] ?? 'bg-border'}"
											  title={entry.actor_role}></span>
										<span class="font-medium">{actorLabel(entry)}</span>
									</div>
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium {actionBadge[entry.action] ?? 'bg-bgGray text-muted'}">
										{entry.action}
									</span>
								</td>
								<td class="px-4 py-3">{entry.resource_type}</td>
								<td class="px-4 py-3 text-xs text-text2 whitespace-nowrap">{entry.method} {entry.endpoint}</td>
								<td class="px-4 py-3">
									{#if entry.before !== null || entry.after !== null}
										<button
											class="text-xs font-medium text-primary hover:text-primary-dark"
											onclick={() => { expandedId = expandedId === entry.id ? null : entry.id; }}
										>
											{$t('auditLog.viewDiff')}
										</button>
									{/if}
								</td>
							</tr>
							{#if expandedId === entry.id}
								{@const diffKeys = getDiffKeys(entry.before, entry.after)}
								<tr>
									<td colspan="6" class="px-4 py-0">
										<div class="bg-bgGray rounded-sm my-2 p-4">
											<p class="text-xs font-semibold text-text2 mb-3">
												{entry.resource_type} · {truncateId(entry.resource_id)}
											</p>
											{#if diffKeys.length === 0}
												<p class="text-xs text-text2">No changed fields.</p>
											{:else}
												<div class="overflow-x-auto">
													<table class="w-full text-xs border border-border rounded-sm overflow-hidden">
														<thead>
															<tr class="bg-border/30">
																<th class="text-left px-3 py-2 font-medium">{$t('auditLog.diffKey')}</th>
																{#if entry.action !== 'CREATE'}
																	<th class="text-left px-3 py-2 font-medium">{$t('auditLog.diffBefore')}</th>
																{/if}
																{#if entry.action !== 'DELETE'}
																	<th class="text-left px-3 py-2 font-medium">{$t('auditLog.diffAfter')}</th>
																{/if}
															</tr>
														</thead>
														<tbody>
															{#each diffKeys as key}
																<tr class="border-t border-border">
																	<td class="px-3 py-2 font-mono font-medium">{key}</td>
																	{#if entry.action !== 'CREATE'}
																		<td class="px-3 py-2 font-mono text-red-700 bg-red-50 max-w-xs truncate">
																			{typeof entry.before?.[key] === 'object'
																				? JSON.stringify(entry.before?.[key])
																				: String(entry.before?.[key] ?? '—')}
																		</td>
																	{/if}
																	{#if entry.action !== 'DELETE'}
																		<td class="px-3 py-2 font-mono text-green-700 bg-green-50 max-w-xs truncate">
																			{typeof entry.after?.[key] === 'object'
																				? JSON.stringify(entry.after?.[key])
																				: String(entry.after?.[key] ?? '—')}
																		</td>
																	{/if}
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											{/if}
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		<Pagination {page} {totalPages} onPage={changePage} />
	</Card>
</div>
