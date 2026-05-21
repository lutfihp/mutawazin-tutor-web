# Admin Page Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `/admin` monolith into four focused pages — Overview (pending approvals), Teachers, Students, Subjects — each with its own route.

**Architecture:** Three new route groups (`admin/teachers`, `admin/students`, `admin/subjects`) each follow the same SvelteKit pattern: `+layout.svelte` wraps `<AuthLayout role="admin">`, `+page.server.ts` does the admin auth guard, `+page.svelte` holds all CSR logic. The existing `/admin` page is stripped to pending-only content. Sidebar nav is updated to match the new routes.

**Tech Stack:** SvelteKit (Svelte 5 runes), `$lib/api`, svelte-i18n `$t`, Tailwind v3, Lucide Svelte icons.

---

## File Map

| File | Action |
|---|---|
| `src/lib/components/layout/Sidebar.svelte` | Modify — update admin nav items |
| `src/routes/admin/+page.server.ts` | Modify — add pendingSubjects fetch |
| `src/routes/admin/+page.svelte` | Modify — strip to stats + 3 pending cards |
| `src/routes/admin/teachers/+layout.svelte` | Create |
| `src/routes/admin/teachers/+page.server.ts` | Create |
| `src/routes/admin/teachers/+page.svelte` | Create |
| `src/routes/admin/students/+layout.svelte` | Create |
| `src/routes/admin/students/+page.server.ts` | Create |
| `src/routes/admin/students/+page.svelte` | Create |
| `src/routes/admin/subjects/+layout.svelte` | Create |
| `src/routes/admin/subjects/+page.server.ts` | Create |
| `src/routes/admin/subjects/+page.svelte` | Create |

---

## Task 1: Update Sidebar nav

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte`

- [ ] **Step 1: Update admin navByRole and remove ShieldCheck import**

Find the `items` `$derived` block. Replace the entire admin array and update the import:

Find:
```svelte
import {
	Home,
	User,
	BookOpen,
	Calendar,
	FileText,
	Users,
	ShieldCheck,
} from 'lucide-svelte';
```
Replace with:
```svelte
import {
	Home,
	User,
	BookOpen,
	Calendar,
	FileText,
	Users,
} from 'lucide-svelte';
```

Then find the admin nav array inside the `$derived` block:
```svelte
		admin: [
			{ id: 'overview',  labelKey: 'nav.overview',              href: '/admin',                   icon: Home },
			{ id: 'approvals', labelKey: 'nav.pendingApprovals',      href: '/admin#pending-approvals', icon: ShieldCheck },
			{ id: 'users',     labelKey: 'dashboard.admin.allUsers',  href: '/admin#all-users',         icon: Users },
			{ id: 'subjects',  labelKey: 'nav.subjects',              href: '/admin#subjects',          icon: BookOpen },
		],
```
Replace with:
```svelte
		admin: [
			{ id: 'overview',  labelKey: 'nav.overview',   href: '/admin',           icon: Home },
			{ id: 'teachers',  labelKey: 'nav.teachers',   href: '/admin/teachers',  icon: Users },
			{ id: 'students',  labelKey: 'nav.students',   href: '/admin/students',  icon: User },
			{ id: 'subjects',  labelKey: 'nav.subjects',   href: '/admin/subjects',  icon: BookOpen },
		],
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/layout/Sidebar.svelte
git commit -m "refactor: update admin sidebar — separate teachers/students/subjects pages"
```

---

## Task 2: Slim the Overview page

**Files:**
- Modify: `src/routes/admin/+page.server.ts`
- Modify: `src/routes/admin/+page.svelte`

### Step 1 — Update `+page.server.ts` to fetch pendingSubjects

- [ ] **Replace the load function**

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };

	try {
		const [stats, pendingTeachers, pendingStudents, pendingSubjects] = await Promise.all([
			fetch(`${BASE}/admin/stats`, { headers }).then((r) => (r.ok ? r.json() : {})),
			fetch(`${BASE}/admin/teachers?status=email_verified`, { headers }).then((r) =>
				r.ok ? r.json() : []
			),
			fetch(`${BASE}/admin/students?status=email_verified`, { headers }).then((r) =>
				r.ok ? r.json() : []
			),
			fetch(`${BASE}/admin/subjects?status=pending`, { headers }).then((r) =>
				r.ok ? r.json() : []
			),
		]);
		return { stats, pendingTeachers, pendingStudents, pendingSubjects };
	} catch {
		return { stats: {}, pendingTeachers: [], pendingStudents: [], pendingSubjects: [] };
	}
};
```

### Step 2 — Rewrite `+page.svelte`

- [ ] **Replace the entire file with the stripped overview**

```svelte
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
```

- [ ] **Step 3: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/+page.server.ts src/routes/admin/+page.svelte
git commit -m "refactor: slim admin overview to pending approvals only"
```

---

## Task 3: Teachers management page

**Files:**
- Create: `src/routes/admin/teachers/+layout.svelte`
- Create: `src/routes/admin/teachers/+page.server.ts`
- Create: `src/routes/admin/teachers/+page.svelte`

- [ ] **Step 1: Create `+layout.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<AuthLayout role="admin">
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 2: Create `+page.server.ts`**

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');
	return {};
};
```

- [ ] **Step 3: Create `+page.svelte`**

```svelte
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
				.filter((t: any) => t.status !== 'email_verified' && t.status !== 'pending');
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
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
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
									{@const tid = user.user_id ?? user.id}
									{@const isFeatured = featuredMap[tid] ?? false}
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
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
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
```

- [ ] **Step 4: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/teachers/
git commit -m "feat: admin teachers management page"
```

---

## Task 4: Students management page

**Files:**
- Create: `src/routes/admin/students/+layout.svelte`
- Create: `src/routes/admin/students/+page.server.ts`
- Create: `src/routes/admin/students/+page.svelte`

- [ ] **Step 1: Create `+layout.svelte`** (identical to teachers layout)

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<AuthLayout role="admin">
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 2: Create `+page.server.ts`** (identical to teachers server)

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');
	return {};
};
```

- [ ] **Step 3: Create `+page.svelte`**

```svelte
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
	let allStudents = $state<any[]>([]);
	let allStudentsLoading = $state(true);
	let statusFilter = $state('');

	const filteredStudents = $derived(
		allStudents.filter((u: any) =>
			statusFilter ? (u.status ?? '').toLowerCase() === statusFilter : true
		)
	);

	async function fetchStudents() {
		allStudentsLoading = true;
		try {
			const students = await api.get<any[]>('/admin/students');
			allStudents = (Array.isArray(students) ? students : [])
				.filter((s: any) => s.status !== 'email_verified' && s.status !== 'pending');
		} catch {
			allStudents = [];
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

	function openCreate() {
		createOpen = true;
		createError = '';
		newFullName = '';
		newUsername = '';
		newPassword = '';
		showNewPassword = false;
		newDob = '';
	}

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
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

	function statusVariant(s: string): 'success' | 'warning' | 'error' | 'active' | 'gray' {
		const map: Record<string, 'success' | 'warning' | 'error' | 'active' | 'gray'> = {
			verified: 'success', Verified: 'success',
			active: 'active',    Active: 'active',
			rejected: 'error',   Rejected: 'error',
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
				aria-label={$t('common.status')}
				class="h-8 px-2 text-sm bg-white border border-border rounded-sm focus:outline-none focus:border-primary"
			>
				<option value="">{$t('dashboard.admin.allStatuses')}</option>
				<option value="verified">{$t('status.verified')}</option>
				<option value="active">{$t('status.active')}</option>
				<option value="rejected">{$t('status.rejected')}</option>
			</select>
		{/snippet}
		{#if allStudentsLoading}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.loading')}</p>
		{:else if filteredStudents.length === 0}
			<p class="px-5 py-8 text-sm text-text2 text-center">{$t('common.noResults')}</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-bgGray text-[13px] font-medium text-text2">
						<tr>
							<th class="px-5 py-3 text-left">{$t('common.name')}</th>
							<th class="px-5 py-3 text-left hidden sm:table-cell">{$t('common.contact')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('common.status')}</th>
							<th class="px-5 py-3 text-left hidden md:table-cell">{$t('dashboard.admin.ageCategory')}</th>
							<th class="px-5 py-3 text-left hidden lg:table-cell">{$t('common.type')}</th>
							<th class="px-5 py-3 text-right">{$t('common.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredStudents as user}
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
								<td class="px-5 py-3 hidden md:table-cell">
									<Badge variant="violet" label={user.age_category ?? ''} />
								</td>
								<td class="px-5 py-3 text-text2 text-xs hidden lg:table-cell">
									{user.auth_type === 'username' || user.account_type === 'admin-created'
										? $t('common.adminCreated')
										: $t('common.selfRegistered')}
								</td>
								<td class="px-5 py-3 text-right">
									<a href="/students/{user.user_id ?? user.id}"
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
				class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
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
```

- [ ] **Step 4: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/students/
git commit -m "feat: admin students management page"
```

---

## Task 5: Subjects management page

**Files:**
- Create: `src/routes/admin/subjects/+layout.svelte`
- Create: `src/routes/admin/subjects/+page.server.ts`
- Create: `src/routes/admin/subjects/+page.svelte`

- [ ] **Step 1: Create `+layout.svelte`** (identical pattern)

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AuthLayout from '$lib/components/layout/AuthLayout.svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<AuthLayout role="admin">
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 2: Create `+page.server.ts`** (identical auth guard)

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');
	return {};
};
```

- [ ] **Step 3: Create `+page.svelte`**

```svelte
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

	// Create subject modal
	let createSubjectOpen = $state(false);
	let newSubjectName = $state('');
	let createSubjectLoading = $state(false);
	let createSubjectFormEl = $state<HTMLFormElement | null>(null);

	async function fetchSubjects() {
		subjectsLoading = true;
		try {
			const result = await api.get<any[]>('/subjects?status=verified');
			allSubjects = Array.isArray(result) ? result : [];
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
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each allSubjects as subject}
							<tr class="hover:bg-bgGray/50 transition-colors">
								<td class="px-5 py-3 font-medium">{subject.name}</td>
								<td class="px-5 py-3 hidden sm:table-cell">
									<Badge variant="success" label={subject.status ?? 'verified'} />
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
```

- [ ] **Step 4: Verify**

```powershell
npm run check
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin/subjects/
git commit -m "feat: admin subjects management page"
```

---

## Final Verification

- [ ] **Full check + build**

```powershell
npm run check && npm run build
```
Expected: 0 errors, build succeeds.

- [ ] **Manual smoke test**

Start dev server: `npm run dev`. Log in as `admin@mutawazin.com` / `changeme123`.

1. Sidebar shows: Overview / Teachers / Students / Subjects (no Pending Approvals, no All Users)
2. `/admin` — shows 3 stats + 3 pending cards (no Create buttons on pending subject card)
3. `/admin/teachers` — shows non-pending teachers, status filter excludes pending, feature toggle works, Create Teacher button opens modal
4. `/admin/students` — shows non-pending students, status filter excludes pending, Create Student button opens modal
5. `/admin/subjects` — shows verified subjects, Create Subject button opens modal
