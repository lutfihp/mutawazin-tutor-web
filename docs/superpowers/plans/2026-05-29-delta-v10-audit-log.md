# Delta v10 — Admin Audit Log Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Audit Log page at `/admin/settings/audit-log` with filters, paginated table, inline diff panel, and a "Settings" section header in the admin sidebar.

**Architecture:** Single monolithic `+page.svelte` (matches all existing admin pages). Sidebar extended with an optional `sectionLabel` field on `NavItem` to render section group headers. No new components — types go in `api.ts`, all page logic inline.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind v3, svelte-i18n, lucide-svelte, existing `api` helper from `$lib/api.ts`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/api.ts` | Modify | Add `AuditLogEntry` and `AuditLogListResponse` types |
| `src/locales/en.json` | Modify | Add `nav.auditLog` key + top-level `auditLog` object |
| `src/locales/id.json` | Modify | Same keys in Bahasa Indonesia |
| `src/lib/components/layout/Sidebar.svelte` | Modify | Add `sectionLabel?` to `NavItem`, render group header, add Audit Log entry |
| `src/routes/admin/settings/audit-log/+page.server.ts` | Create | Admin-only auth guard |
| `src/routes/admin/settings/audit-log/+layout.svelte` | Create | Pass-through layout (prevents double `<AuthLayout>` wrap) |
| `src/routes/admin/settings/audit-log/+page.svelte` | Create | Full audit log page — filters, table, diff panel, pagination |

---

## Task 1: Add TypeScript types to `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Append the two types to the end of `src/lib/api.ts`**

The file currently ends with the `api` export object and closing `};`. Add these types **before** the `const BASE` line is fine, but easiest to append after the final `};` line.

Open `src/lib/api.ts`. After the final closing `};` of the `api` export, append:

```typescript
export type AuditLogEntry = {
  id: string;
  actor_id: string;
  actor_email: string | null;
  actor_username: string | null;
  actor_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resource_type: string;
  resource_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  endpoint: string;
  method: string;
  timestamp: string;
};

export type AuditLogListResponse = {
  total: number;
  page: number;
  page_size: number;
  items: AuditLogEntry[];
};
```

- [ ] **Step 2: Verify types compile**

```powershell
npm run check
```

Expected: 0 errors (12 pre-existing warnings are acceptable — do not treat them as failures).

---

## Task 2: Add i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add `nav.auditLog` to `src/locales/en.json`**

In `src/locales/en.json`, find the `"nav"` object. It currently ends with `"logout": "Sign out"`. Add `"auditLog"` before `"logout"`:

```json
"nav": {
    ...existing keys...,
    "auditLog": "Audit Log",
    "logout": "Sign out"
},
```

- [ ] **Step 2: Add the `auditLog` top-level object to `src/locales/en.json`**

The file ends with `}`. Add the new block before the final closing `}` (after the last existing top-level key):

```json
  "auditLog": {
    "title": "Audit Log",
    "filterFrom": "From",
    "filterTo": "To",
    "filterAction": "All actions",
    "filterResource": "All resource types",
    "apply": "Apply",
    "reset": "Reset",
    "empty": "No audit logs found. Try adjusting your filters.",
    "viewDiff": "View diff",
    "colWhen": "When",
    "colActor": "Actor",
    "colAction": "Action",
    "colResource": "Resource",
    "colEndpoint": "Endpoint",
    "colChanges": "Changes",
    "diffKey": "Key",
    "diffBefore": "Before",
    "diffAfter": "After",
    "error": "Failed to load audit logs."
  }
```

- [ ] **Step 3: Add `nav.auditLog` to `src/locales/id.json`**

Same location as en.json — add before `"logout"`:

```json
"auditLog": "Log Audit",
```

- [ ] **Step 4: Add the `auditLog` top-level object to `src/locales/id.json`**

```json
  "auditLog": {
    "title": "Log Audit",
    "filterFrom": "Dari",
    "filterTo": "Sampai",
    "filterAction": "Semua aksi",
    "filterResource": "Semua tipe resource",
    "apply": "Terapkan",
    "reset": "Reset",
    "empty": "Tidak ada log yang ditemukan. Coba ubah filter.",
    "viewDiff": "Lihat perubahan",
    "colWhen": "Waktu",
    "colActor": "Pelaku",
    "colAction": "Aksi",
    "colResource": "Resource",
    "colEndpoint": "Endpoint",
    "colChanges": "Perubahan",
    "diffKey": "Kunci",
    "diffBefore": "Sebelum",
    "diffAfter": "Sesudah",
    "error": "Gagal memuat log audit."
  }
```

- [ ] **Step 5: Verify JSON is valid and check passes**

```powershell
npm run check
```

Expected: 0 errors.

---

## Task 3: Extend Sidebar with Settings group

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte`

The sidebar currently has a flat `NavItem[]` with no section grouping. This task adds an optional `sectionLabel` field so the first item in a new section can carry a label that renders as a visual group header.

- [ ] **Step 1: Add `sectionLabel` to the `NavItem` type and import `Shield`**

In `src/lib/components/layout/Sidebar.svelte`, find the import block at the top of `<script>`:

```typescript
import {
    Home,
    User,
    BookOpen,
    Calendar,
    FileText,
    Users,
} from 'lucide-svelte';
```

Change to:

```typescript
import {
    Home,
    User,
    BookOpen,
    Calendar,
    FileText,
    Users,
    Shield,
} from 'lucide-svelte';
```

Then find the `NavItem` type definition:

```typescript
type NavItem = {
    id: string;
    labelKey: string;
    href: string;
    icon: typeof Home;
    count?: number;
};
```

Change to:

```typescript
type NavItem = {
    id: string;
    labelKey: string;
    href: string;
    icon: typeof Home;
    count?: number;
    sectionLabel?: string;
};
```

- [ ] **Step 2: Add the Audit Log entry to the admin nav array**

Find the `admin` array inside the `items` derived:

```typescript
admin: [
    { id: 'overview',  labelKey: 'nav.overview',   href: '/admin',           icon: Home },
    { id: 'teachers',  labelKey: 'nav.teachers',   href: '/admin/teachers',  icon: Users },
    { id: 'students',  labelKey: 'nav.students',   href: '/admin/students',  icon: User },
    { id: 'subjects',  labelKey: 'nav.subjects',   href: '/admin/subjects',  icon: BookOpen },
    { id: 'courses',   labelKey: 'nav.courses',    href: '/admin/courses',   icon: BookOpen },
    { id: 'calendar',  labelKey: 'nav.calendar',   href: '/admin/calendar',  icon: Calendar },
],
```

Change to (add the audit-log entry at the end):

```typescript
admin: [
    { id: 'overview',   labelKey: 'nav.overview',   href: '/admin',                          icon: Home },
    { id: 'teachers',   labelKey: 'nav.teachers',   href: '/admin/teachers',                 icon: Users },
    { id: 'students',   labelKey: 'nav.students',   href: '/admin/students',                 icon: User },
    { id: 'subjects',   labelKey: 'nav.subjects',   href: '/admin/subjects',                 icon: BookOpen },
    { id: 'courses',    labelKey: 'nav.courses',    href: '/admin/courses',                  icon: BookOpen },
    { id: 'calendar',   labelKey: 'nav.calendar',   href: '/admin/calendar',                 icon: Calendar },
    { id: 'audit-log',  labelKey: 'nav.auditLog',   href: '/admin/settings/audit-log',       icon: Shield, sectionLabel: 'nav.settings' },
],
```

- [ ] **Step 3: Update the desktop sidebar `{#each}` loop to render section headers**

Find the desktop sidebar `<nav>` block. It currently contains:

```svelte
{#each items as item}
    {@const active = isActive(item.href)}
    <a
        href={item.href}
        class="relative flex items-center gap-2.5 h-10 px-3 rounded-sm text-sm font-medium transition-colors
               {active
            ? 'bg-primary-light text-primary-dark font-semibold'
            : 'text-text2 hover:text-text hover:bg-border/50'}"
        aria-current={active ? 'page' : undefined}
    >
        {#if active}
            <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" aria-hidden="true"></span>
        {/if}
        <item.icon size={18} aria-hidden="true" />
        {$t(item.labelKey)}
        {#if item.id === 'approvals' && $pendingApprovalCount > 0}
            <span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
                {$pendingApprovalCount}
            </span>
        {:else if item.id !== 'approvals' && item.count && item.count > 0}
            <span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
                {item.count}
            </span>
        {/if}
    </a>
{/each}
```

Replace with:

```svelte
{#each items as item}
    {#if item.sectionLabel}
        <p class="px-3 py-1.5 mt-2 text-[11px] font-semibold uppercase tracking-widest text-text2">
            {$t(item.sectionLabel)}
        </p>
    {/if}
    {@const active = isActive(item.href)}
    <a
        href={item.href}
        class="relative flex items-center gap-2.5 h-10 px-3 rounded-sm text-sm font-medium transition-colors
               {active
            ? 'bg-primary-light text-primary-dark font-semibold'
            : 'text-text2 hover:text-text hover:bg-border/50'}"
        aria-current={active ? 'page' : undefined}
    >
        {#if active}
            <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" aria-hidden="true"></span>
        {/if}
        <item.icon size={18} aria-hidden="true" />
        {$t(item.labelKey)}
        {#if item.id === 'approvals' && $pendingApprovalCount > 0}
            <span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
                {$pendingApprovalCount}
            </span>
        {:else if item.id !== 'approvals' && item.count && item.count > 0}
            <span class="ml-auto bg-error text-white text-[11px] font-bold rounded-pill px-1.5 py-0.5 min-w-[20px] text-center">
                {item.count}
            </span>
        {/if}
    </a>
{/each}
```

- [ ] **Step 4: Apply the same change to the mobile drawer `{#each}` loop**

Find the mobile drawer `<nav>` block. It has a similar `{#each items as item}` loop:

```svelte
{#each items as item}
    {@const active = isActive(item.href)}
    <a
        href={item.href}
        onclick={closeSidebar}
        class="relative flex items-center gap-2.5 h-11 px-3 rounded-sm text-sm font-medium transition-colors
               {active
            ? 'bg-primary-light text-primary-dark font-semibold'
            : 'text-text2 hover:text-text hover:bg-bgGray'}"
        aria-current={active ? 'page' : undefined}
    >
        {#if active}
            <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" aria-hidden="true"></span>
        {/if}
        <item.icon size={18} aria-hidden="true" />
        {$t(item.labelKey)}
    </a>
{/each}
```

Replace with:

```svelte
{#each items as item}
    {#if item.sectionLabel}
        <p class="px-3 py-1.5 mt-2 text-[11px] font-semibold uppercase tracking-widest text-text2">
            {$t(item.sectionLabel)}
        </p>
    {/if}
    {@const active = isActive(item.href)}
    <a
        href={item.href}
        onclick={closeSidebar}
        class="relative flex items-center gap-2.5 h-11 px-3 rounded-sm text-sm font-medium transition-colors
               {active
            ? 'bg-primary-light text-primary-dark font-semibold'
            : 'text-text2 hover:text-text hover:bg-bgGray'}"
        aria-current={active ? 'page' : undefined}
    >
        {#if active}
            <span class="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" aria-hidden="true"></span>
        {/if}
        <item.icon size={18} aria-hidden="true" />
        {$t(item.labelKey)}
    </a>
{/each}
```

- [ ] **Step 5: Verify**

```powershell
npm run check
```

Expected: 0 errors.

---

## Task 4: Route scaffolding — auth guard and pass-through layout

**Files:**
- Create: `src/routes/admin/settings/audit-log/+page.server.ts`
- Create: `src/routes/admin/settings/audit-log/+layout.svelte`

The folder `src/routes/admin/settings/audit-log/` does not yet exist — create it along with both files.

- [ ] **Step 1: Create `+page.server.ts`**

Create `src/routes/admin/settings/audit-log/+page.server.ts` with this exact content:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');
	return {};
};
```

This is identical to the pattern used by every other admin page (e.g., `src/routes/admin/courses/+page.server.ts`).

- [ ] **Step 2: Create `+layout.svelte`**

Create `src/routes/admin/settings/audit-log/+layout.svelte` with this exact content:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children?: Snippet } = $props();
</script>

{#if children}{@render children()}{/if}
```

This pass-through is required because `src/routes/admin/+layout.svelte` already wraps content in `<AuthLayout>`. Without this file SvelteKit would still work, but having it makes the layout chain explicit and consistent with other admin sub-routes (`courses`, `calendar`, `students`, etc. all have it).

- [ ] **Step 3: Verify**

```powershell
npm run check
```

Expected: 0 errors. SvelteKit will now recognize the route.

---

## Task 5: Audit Log page

**Files:**
- Create: `src/routes/admin/settings/audit-log/+page.svelte`

This is the main task. The page includes a filter bar, paginated table, inline diff panel per row, and loading/empty/error states — all inline, no sub-components.

- [ ] **Step 1: Create the page file**

Create `src/routes/admin/settings/audit-log/+page.svelte` with the full content below:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import type { AuditLogEntry, AuditLogListResponse } from '$lib/api';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	// ── State ────────────────────────────────────────────────────────────────
	let entries = $state<AuditLogEntry[]>([]);
	let total = $state(0);
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

	const roleBadge: Record<string, string> = {
		admin:   'bg-violet-100 text-violet-800',
		teacher: 'bg-teal-100 text-teal-800',
		student: 'bg-amber-100 text-amber-800',
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
			params.set('page_size', String(pageSize));
			const data = await api.get<AuditLogListResponse>(`/admin/audit-logs?${params}`);
			entries = data.items;
			total = data.total;
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

<div class="space-y-6">
	<h1 class="text-2xl font-bold">{$t('auditLog.title')}</h1>

	<!-- Filter bar -->
	<Card padding="default">
		<div class="flex flex-wrap gap-3 items-end">
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium text-text2">{$t('auditLog.filterFrom')}</label>
				<input type="date" bind:value={fromDate} class="border border-border rounded-sm px-3 py-2 text-sm" />
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium text-text2">{$t('auditLog.filterTo')}</label>
				<input type="date" bind:value={toDate} class="border border-border rounded-sm px-3 py-2 text-sm" />
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium text-text2">{$t('auditLog.colAction')}</label>
				<select bind:value={actionFilter} class="border border-border rounded-sm px-3 py-2 text-sm">
					<option value="">{$t('auditLog.filterAction')}</option>
					<option value="CREATE">CREATE</option>
					<option value="UPDATE">UPDATE</option>
					<option value="DELETE">DELETE</option>
				</select>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium text-text2">{$t('auditLog.colResource')}</label>
				<select bind:value={resourceTypeFilter} class="border border-border rounded-sm px-3 py-2 text-sm">
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

	<!-- Error banner -->
	{#if error}
		<div class="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
	{/if}

	<!-- Table -->
	<Card padding="none">
		<div class="overflow-x-auto">
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
					{#if loading}
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
									<div class="flex flex-col gap-1">
										<span>{actorLabel(entry)}</span>
										<span class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium {roleBadge[entry.actor_role] ?? 'bg-bgGray text-muted'}">
											{entry.actor_role}
										</span>
									</div>
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium {actionBadge[entry.action] ?? 'bg-bgGray text-muted'}">
										{entry.action}
									</span>
								</td>
								<td class="px-4 py-3">
									<span>{entry.resource_type}</span>
									<span class="block text-xs text-text2">{truncateId(entry.resource_id)}</span>
								</td>
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
		{#if total > pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<Button variant="secondary" disabled={page === 1} onclick={() => changePage(page - 1)}>Prev</Button>
				<span class="text-sm text-text2">Page {page} of {Math.ceil(total / pageSize)}</span>
				<Button variant="secondary" disabled={page * pageSize >= total} onclick={() => changePage(page + 1)}>Next</Button>
			</div>
		{/if}
	</Card>
</div>
```

- [ ] **Step 2: Verify types and Svelte syntax**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manual smoke test**

```powershell
npm run dev
```

Open `http://localhost:5173` in a browser. Log in as `admin@mutawazin.com` / `changeme123`.

Verify:
1. Admin sidebar shows "SETTINGS" section header below the Calendar item, with "Audit Log" underneath it (Shield icon).
2. Clicking "Audit Log" navigates to `/admin/settings/audit-log`.
3. Page loads — filter bar visible, table shows 5 skeleton rows while fetching (backend must be running at `localhost:8000`).
4. If backend running: table populates. If not: red error banner appears above the table.
5. Filter controls work: selecting an action and clicking Apply re-fetches.
6. Reset clears filters and re-fetches.
7. "View diff" button appears only on rows that have `before` or `after` data; clicking expands the diff panel inline.
8. Language toggle (EN/ID) updates all UI text including filter labels and column headers.
