# Dead Links & No-Op Buttons — Audit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 28 items from the content audit — dead links, no-op buttons, fake data, and missing features — across 17 files.

**Architecture:** Changes fall into five buckets: removals (delete elements with no replacement), link fixes (update href values), a userId prop chain threaded through AuthLayout → Sidebar, data wiring (names/labels from API), and two new feature implementations (logout + /teachers page).

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind v3, svelte-i18n, `$lib/api` (exports `api.get/post/patch/delete`)

---

## File Map

| File | What changes |
|---|---|
| `src/locales/en.json` | Add `nav.logout`, `common.tutor` |
| `src/locales/id.json` | Add `nav.logout`, `common.tutor` |
| `src/lib/components/layout/Navbar.svelte` | Remove Bell, fix Home href `/#`→`/`, add Logout button |
| `src/lib/components/layout/Sidebar.svelte` | Add `userId` prop, fix profile/reports hrefs, remove My Students, fix Reports href |
| `src/lib/components/layout/AuthLayout.svelte` | Add `userId` prop, forward to Sidebar |
| `src/routes/dashboard/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` |
| `src/routes/courses/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` |
| `src/routes/calendar/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` |
| `src/routes/reports/[studentId]/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` |
| `src/routes/students/[id]/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` |
| `src/routes/teachers/[id]/+layout.svelte` | Pass `userId={data.user?.id ?? ''}` (authenticated branch) |
| `src/routes/+page.svelte` | Remove Company footer column, fix Tutor label in featured teachers |
| `src/routes/dashboard/+page.svelte` | Fix welcome names, remove streak/Message button, fix Write Report href, fix Tutor label |
| `src/routes/teachers/[id]/+page.svelte` | Remove Message button |
| `src/routes/courses/+page.svelte` | Replace hardcoded subject options with dynamic `/subjects` fetch |
| `src/routes/calendar/+page.svelte` | Implement Cancel Session + Mark Completed handlers |
| `src/routes/teachers/+page.svelte` | **New** — public featured teachers directory |

---

## Task 1: Add i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add `nav.logout` and `common.tutor` to en.json**

In `src/locales/en.json`, add `"logout"` inside the `"nav"` object (after the last existing key in nav):

```json
"catalog": "Subjects",
"logout": "Sign out"
```

And add `"tutor"` inside the `"common"` object (after the last existing key in common):

```json
"more": "+{n} more",
"tutor": "Tutor"
```

- [ ] **Step 2: Add the same keys to id.json**

In `src/locales/id.json`, add `"logout"` inside `"nav"`:

```json
"catalog": "Mata Pelajaran",
"logout": "Keluar"
```

And add `"tutor"` inside `"common"`:

```json
"tutor": "Guru"
```

- [ ] **Step 3: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/id.json
git commit -m "i18n: add nav.logout and common.tutor keys"
```

---

## Task 2: Navbar — remove Bell, fix Home anchor, add Logout

**Files:**
- Modify: `src/lib/components/layout/Navbar.svelte`

- [ ] **Step 1: Fix the Home anchor href**

Find line 61:
```svelte
<a href="/#" class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">{$t('nav.home')}</a>
```

Replace `href="/#"` with `href="/"`:
```svelte
<a href="/" class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">{$t('nav.home')}</a>
```

- [ ] **Step 2: Remove the Bell notification button**

Find and delete the entire bell button block (lines 92–98):
```svelte
<button
	class="relative w-9 h-9 flex items-center justify-center rounded-pill border border-border text-text2 hover:text-text transition-colors"
	aria-label="Notifications"
>
	<Bell size={16} aria-hidden="true" />
</button>
```

Also remove `Bell` from the import at the top of the script:
```svelte
import { Bell, Menu, X } from 'lucide-svelte';
```
→
```svelte
import { Menu, X } from 'lucide-svelte';
```

- [ ] **Step 3: Add Logout function and button**

In the `<script>` block, add these imports after the existing imports:
```svelte
import { api } from '$lib/api';
import { goto } from '$app/navigation';
```

Add the logout function before the closing `</script>`:
```svelte
async function logout() {
	try { await api.post('/auth/logout', {}); } catch {}
	user.set(null);
	goto('/');
}
```

In the template, in the `{#if $user}` block, add a logout button after the `<Avatar>` element (line ~99). The full `{#if $user}` block should now read:

```svelte
{#if $user}
	<Avatar name={$user.id} id={$user.id} size="sm" />
	<button
		onclick={logout}
		class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors"
	>
		{$t('nav.logout')}
	</button>
{:else}
```

- [ ] **Step 4: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/layout/Navbar.svelte
git commit -m "feat: add logout button, remove bell icon, fix home anchor"
```

---

## Task 3: Sidebar — add userId prop, fix hrefs, remove My Students

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte`

- [ ] **Step 1: Add `userId` prop and update navByRole**

Replace the current props declaration line:
```svelte
let { role }: { role: 'admin' | 'teacher' | 'student' } = $props();
```
with:
```svelte
let { role, userId = '' }: { role: 'admin' | 'teacher' | 'student'; userId?: string } = $props();
```

- [ ] **Step 2: Update `navByRole` — teacher items**

Replace the current `teacher` array in `navByRole`:
```svelte
teacher: [
	{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',  icon: Home },
	{ id: 'profile',   labelKey: 'nav.myProfile',  href: '/dashboard',  icon: User },
	{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',    icon: BookOpen },
	{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',   icon: Calendar },
	{ id: 'students',  labelKey: 'nav.students',   href: '/dashboard',  icon: Users },
	{ id: 'reports',   labelKey: 'nav.reports',    href: '/dashboard',  icon: FileText },
],
```
with (removed `students`, fixed `profile` and `reports` hrefs):
```svelte
teacher: [
	{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',                     icon: Home },
	{ id: 'profile',   labelKey: 'nav.myProfile',  href: `/teachers/${userId}`,             icon: User },
	{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',                        icon: BookOpen },
	{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',                       icon: Calendar },
	{ id: 'reports',   labelKey: 'nav.reports',    href: '/dashboard#private-students',     icon: FileText },
],
```

- [ ] **Step 3: Update `navByRole` — student items**

Replace the current `student` array:
```svelte
student: [
	{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard', icon: Home },
	{ id: 'profile',   labelKey: 'nav.myProfile',  href: '/dashboard', icon: User },
	{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',   icon: BookOpen },
	{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',  icon: Calendar },
	{ id: 'reports',   labelKey: 'nav.myReports',  href: '/dashboard', icon: FileText },
],
```
with:
```svelte
student: [
	{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',          icon: Home },
	{ id: 'profile',   labelKey: 'nav.myProfile',  href: `/students/${userId}`, icon: User },
	{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',            icon: BookOpen },
	{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',           icon: Calendar },
	{ id: 'reports',   labelKey: 'nav.myReports',  href: `/reports/${userId}`,  icon: FileText },
],
```

Note: `navByRole` is defined as a `const` at module level but uses `userId` which is a prop (runtime value). Change `const navByRole` to use `$derived`:

Replace the entire `const navByRole: Record<...> = { ... }` block and the `const items = $derived(...)` line with:

```svelte
const items = $derived(({
	admin: [
		{ id: 'overview',  labelKey: 'nav.overview',              href: '/admin',                   icon: Home },
		{ id: 'approvals', labelKey: 'nav.pendingApprovals',      href: '/admin#pending-approvals', icon: ShieldCheck },
		{ id: 'users',     labelKey: 'dashboard.admin.allUsers',  href: '/admin#all-users',         icon: Users },
		{ id: 'catalog',   labelKey: 'nav.catalog',               href: '/admin#catalog',           icon: BookOpen },
	],
	teacher: [
		{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',                  icon: Home },
		{ id: 'profile',   labelKey: 'nav.myProfile',  href: `/teachers/${userId}`,          icon: User },
		{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',                     icon: BookOpen },
		{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',                    icon: Calendar },
		{ id: 'reports',   labelKey: 'nav.reports',    href: '/dashboard#private-students',  icon: FileText },
	],
	student: [
		{ id: 'dashboard', labelKey: 'nav.dashboard',  href: '/dashboard',          icon: Home },
		{ id: 'profile',   labelKey: 'nav.myProfile',  href: `/students/${userId}`, icon: User },
		{ id: 'courses',   labelKey: 'nav.myCourses',  href: '/courses',            icon: BookOpen },
		{ id: 'calendar',  labelKey: 'nav.calendar',   href: '/calendar',           icon: Calendar },
		{ id: 'reports',   labelKey: 'nav.myReports',  href: `/reports/${userId}`,  icon: FileText },
	],
} as Record<'admin' | 'teacher' | 'student', NavItem[]>)[role] ?? []);
```

Also remove the `Users` import since we no longer use it in teacher nav (admin still uses it — keep it).

- [ ] **Step 4: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/layout/Sidebar.svelte
git commit -m "feat: sidebar userId prop — fix profile/reports hrefs, remove My Students"
```

---

## Task 4: AuthLayout — add userId prop, forward to Sidebar

**Files:**
- Modify: `src/lib/components/layout/AuthLayout.svelte`

- [ ] **Step 1: Add `userId` prop and forward it**

Replace the current props declaration:
```svelte
let {
	role,
	children,
}: {
	role: 'admin' | 'teacher' | 'student';
	children?: Snippet;
} = $props();
```
with:
```svelte
let {
	role,
	userId = '',
	children,
}: {
	role: 'admin' | 'teacher' | 'student';
	userId?: string;
	children?: Snippet;
} = $props();
```

Update the `<Sidebar>` usage in the template:
```svelte
<Sidebar {role} />
```
→
```svelte
<Sidebar {role} {userId} />
```

- [ ] **Step 2: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/layout/AuthLayout.svelte
git commit -m "feat: AuthLayout forwards userId to Sidebar"
```

---

## Task 5: Update all sub-layouts to pass userId

**Files:**
- Modify: `src/routes/dashboard/+layout.svelte`
- Modify: `src/routes/courses/+layout.svelte`
- Modify: `src/routes/calendar/+layout.svelte`
- Modify: `src/routes/reports/[studentId]/+layout.svelte`
- Modify: `src/routes/students/[id]/+layout.svelte`
- Modify: `src/routes/teachers/[id]/+layout.svelte`

All five of `dashboard`, `courses`, `calendar`, `reports/[studentId]`, `students/[id]` share the same pattern. Update each one:

- [ ] **Step 1: Update dashboard/+layout.svelte**

Current:
```svelte
<AuthLayout {role}>
	{#if children}{@render children()}{/if}
</AuthLayout>
```
→
```svelte
<AuthLayout {role} userId={data.user?.id ?? ''}>
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 2: Update courses/+layout.svelte** (same change)

```svelte
<AuthLayout {role} userId={data.user?.id ?? ''}>
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 3: Update calendar/+layout.svelte** (same change)

```svelte
<AuthLayout {role} userId={data.user?.id ?? ''}>
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 4: Update reports/[studentId]/+layout.svelte** (same change)

```svelte
<AuthLayout {role} userId={data.user?.id ?? ''}>
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 5: Update students/[id]/+layout.svelte** (same change)

```svelte
<AuthLayout {role} userId={data.user?.id ?? ''}>
	{#if children}{@render children()}{/if}
</AuthLayout>
```

- [ ] **Step 6: Update teachers/[id]/+layout.svelte**

This layout conditionally renders AuthLayout only when a user is logged in. Update only the authenticated branch:

Current:
```svelte
{#if data.user}
	<AuthLayout role={data.user.role as 'admin' | 'teacher' | 'student'}>
		{#if children}{@render children()}{/if}
	</AuthLayout>
```
→
```svelte
{#if data.user}
	<AuthLayout role={data.user.role as 'admin' | 'teacher' | 'student'} userId={data.user.id ?? ''}>
		{#if children}{@render children()}{/if}
	</AuthLayout>
```

- [ ] **Step 7: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/routes/dashboard/+layout.svelte src/routes/courses/+layout.svelte src/routes/calendar/+layout.svelte src/routes/reports/[studentId]/+layout.svelte src/routes/students/[id]/+layout.svelte src/routes/teachers/[id]/+layout.svelte
git commit -m "feat: pass userId through all sub-layouts to AuthLayout"
```

---

## Task 6: Landing page — footer cleanup + Tutor label fix

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Remove the Company footer column**

In the footer `{#each}` array (around line 335), remove the entire Company column entry:
```svelte
{ titleKey: 'landing.footerCompanyTitle', links: [['landing.footerContact', '#'], ['landing.footerPrivacy', '#']] },
```

The footer `{#each}` array should now have only two columns:
```svelte
{#each [
	{ titleKey: 'landing.footerPlatformTitle', links: [['landing.footerHome', '/'], ['landing.footerCourses', '/courses'], ['landing.footerTeachers', '/teachers']] },
	{ titleKey: 'landing.footerGetStartedTitle', links: [['landing.footerJoinTeacher', '/register/teacher'], ['landing.footerJoinStudent', '/register/student']] },
] as col}
```

- [ ] **Step 2: Fix the Tutor label in featured teachers cards**

In the featured teachers section (around line 285), find:
```svelte
<div class="text-xs text-text2">Tutor</div>
```

Replace with:
```svelte
<div class="text-xs text-text2">{$t('common.tutor')}</div>
```

- [ ] **Step 3: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "fix: remove dead footer links, use i18n for teacher role label"
```

---

## Task 7: Dashboard — names, streak, Message, Write Report, Tutor

**Files:**
- Modify: `src/routes/dashboard/+page.svelte`

- [ ] **Step 1: Fix teacher welcome name (line 32)**

Replace:
```svelte
<h1 class="text-2xl font-bold">{$t('dashboard.teacher.welcome', { values: { name: 'Layla' } })}</h1>
```
with:
```svelte
<h1 class="text-2xl font-bold">{$t('dashboard.teacher.welcome', { values: { name: d.full_name ?? data.user?.name ?? '' } })}</h1>
```

- [ ] **Step 2: Fix last session timing label (line 88)**

Replace:
```svelte
<div class="text-xs text-text2">{$t('dashboard.teacher.lastSession', { values: { when: 'recently' } })}</div>
```
with:
```svelte
{#if student.last_session_at}
	<div class="text-xs text-text2">{$t('dashboard.teacher.lastSession', { values: { when: student.last_session_at } })}</div>
{/if}
```

- [ ] **Step 3: Fix student welcome name (line 158)**

Replace:
```svelte
<h1 class="text-2xl font-bold">{$t('dashboard.student.welcome', { values: { name: 'Nour' } })}</h1>
```
with:
```svelte
<h1 class="text-2xl font-bold">{$t('dashboard.student.welcome', { values: { name: d.full_name ?? data.user?.name ?? '' } })}</h1>
```

- [ ] **Step 4: Remove streak count line (line 159)**

Delete the entire line:
```svelte
<p class="text-sm text-text2 mt-1">{$t('dashboard.student.streakMeta', { values: { weeks: 5 } })}</p>
```

- [ ] **Step 5: Fix Write Report quick action href (line 135)**

Find the quick actions array entry for `writeReport`:
```svelte
{ titleKey: 'dashboard.teacher.writeReport', descKey: 'dashboard.teacher.writeReportDesc', href: '/reports/', icon: 'M14 2H6a2 2 0 0 0-2 2v16...' },
```
Change `href: '/reports/'` to `href: '/dashboard#private-students'`:
```svelte
{ titleKey: 'dashboard.teacher.writeReport', descKey: 'dashboard.teacher.writeReportDesc', href: '/dashboard#private-students', icon: 'M14 2H6a2 2 0 0 0-2 2v16...' },
```

- [ ] **Step 6: Fix Tutor label in assigned teacher card (line 265)**

Replace:
```svelte
<div class="text-sm text-text2 mb-2">Tutor</div>
```
with:
```svelte
<div class="text-sm text-text2 mb-2">{$t('common.tutor')}</div>
```

- [ ] **Step 7: Remove the Message button (line 275)**

Delete:
```svelte
<Button variant="secondary" size="sm">Message</Button>
```

The `<div class="flex gap-2">` block should now contain only the "View Profile" button:
```svelte
<div class="flex gap-2">
	<Button variant="primary" size="sm" href="/teachers/{d.assigned_teacher.user_id}">
		{$t('common.viewProfile')}
	</Button>
</div>
```

- [ ] **Step 8: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add src/routes/dashboard/+page.svelte
git commit -m "fix: dashboard — real names from API, remove fake streak/Message, fix report link"
```

---

## Task 8: Teachers[id] profile — remove Message button

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

- [ ] **Step 1: Remove the Message button**

Find the `{#if !isOwn}` block (around line 142):
```svelte
{#if !isOwn}
	<div class="flex gap-2">
		<Button variant="secondary">Message</Button>
		<Button variant="primary">{$t('profile.teacher.bookSession')}</Button>
	</div>
{/if}
```

Replace with (remove Message button, keep Book Session):
```svelte
{#if !isOwn}
	<div class="flex gap-2">
		<Button variant="primary">{$t('profile.teacher.bookSession')}</Button>
	</div>
{/if}
```

- [ ] **Step 2: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/teachers/[id]/+page.svelte
git commit -m "fix: remove no-op Message button from teacher profile"
```

---

## Task 9: Courses — dynamic subject filter

**Files:**
- Modify: `src/routes/courses/+page.svelte`

- [ ] **Step 1: Add subjects state**

In the script block, after the existing state declarations (around line 36), add:
```svelte
let subjects = $state<{ id: string; name: string }[]>([]);
```

- [ ] **Step 2: Add subjects fetch in onMount**

Change `onMount(fetchCourses)` to:
```svelte
onMount(async () => {
	await fetchCourses();
	try {
		const result = await api.get<{ id: string; name: string; status: string }[]>('/subjects?status=verified');
		subjects = Array.isArray(result) ? result : [];
	} catch {
		subjects = [];
	}
});
```

- [ ] **Step 3: Replace hardcoded `<select>` options**

Find the subject `<select>` block (lines 177–187):
```svelte
<select
	bind:value={subjectFilter}
	aria-label={$t('courses.allSubjects')}
	class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
>
	<option value="">{$t('courses.allSubjects')}</option>
	<option value="Math">Math</option>
	<option value="English">English</option>
	<option value="Science">Science</option>
	<option value="Arabic">Arabic</option>
</select>
```

Replace with:
```svelte
<select
	bind:value={subjectFilter}
	aria-label={$t('courses.allSubjects')}
	class="h-10 px-3 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
>
	<option value="">{$t('courses.allSubjects')}</option>
	{#each subjects as subject}
		<option value={subject.name}>{subject.name}</option>
	{/each}
</select>
```

- [ ] **Step 4: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "feat: courses subject filter loaded dynamically from /subjects"
```

---

## Task 10: Calendar — Cancel Session and Mark Completed handlers

**Files:**
- Modify: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Add action state variables**

In the script block, after the existing `detailOpen` and `addOpen` state declarations (around line 23), add:

```svelte
let sessionActionLoading = $state(false);
let sessionActionError = $state('');
let cancelConfirming = $state(false);
```

- [ ] **Step 2: Add the Cancel Session handler**

After the `fetchSessions` function, add:

```svelte
async function cancelSession() {
	if (!selectedSession) return;
	sessionActionLoading = true;
	sessionActionError = '';
	try {
		await api.patch(`/sessions/${selectedSession.id}`, { status: 'cancelled' });
		selectedSession = { ...selectedSession, status: 'cancelled' };
		sessions = sessions.map(s => s.id === selectedSession!.id ? { ...s, status: 'cancelled' } : s);
		detailOpen = false;
	} catch (e: any) {
		sessionActionError = e?.message ?? 'Failed to cancel session.';
	} finally {
		sessionActionLoading = false;
		cancelConfirming = false;
	}
}
```

- [ ] **Step 3: Add the Mark Completed handler**

```svelte
async function markCompleted() {
	if (!selectedSession) return;
	sessionActionLoading = true;
	sessionActionError = '';
	try {
		await api.patch(`/sessions/${selectedSession.id}`, { status: 'completed' });
		selectedSession = { ...selectedSession, status: 'completed' };
		sessions = sessions.map(s => s.id === selectedSession!.id ? { ...s, status: 'completed' } : s);
		detailOpen = false;
	} catch (e: any) {
		sessionActionError = e?.message ?? 'Failed to update session.';
	} finally {
		sessionActionLoading = false;
	}
}
```

- [ ] **Step 4: Update the modal footer buttons**

Find the `{#snippet footer()}` inside the session detail modal (around line 496):
```svelte
{#snippet footer()}
	{#if isTeacher && (selectedSession.status === 'Confirmed' || selectedSession.status === 'confirmed')}
		<Button variant="danger" size="sm" onclick={() => {}}>{$t('calendar.modal.cancelSession')}</Button>
		<Button variant="primary" size="sm" onclick={() => {}}>{$t('calendar.modal.markCompleted')}</Button>
	{:else}
		<Button variant="secondary" size="sm" onclick={() => (detailOpen = false)}>{$t('common.close')}</Button>
	{/if}
{/snippet}
```

Replace with:
```svelte
{#snippet footer()}
	{#if isTeacher && (selectedSession.status === 'Confirmed' || selectedSession.status === 'confirmed')}
		{#if sessionActionError}
			<p class="text-xs text-error mr-auto">{sessionActionError}</p>
		{/if}
		{#if cancelConfirming}
			<span class="text-sm text-text2 mr-auto">Are you sure?</span>
			<Button variant="ghost" size="sm" onclick={() => (cancelConfirming = false)}>{$t('common.cancel')}</Button>
			<Button variant="danger" size="sm" loading={sessionActionLoading} onclick={cancelSession}>Confirm</Button>
		{:else}
			<Button variant="danger" size="sm" onclick={() => (cancelConfirming = true)}>{$t('calendar.modal.cancelSession')}</Button>
			<Button variant="primary" size="sm" loading={sessionActionLoading} onclick={markCompleted}>{$t('calendar.modal.markCompleted')}</Button>
		{/if}
	{:else}
		<Button variant="secondary" size="sm" onclick={() => (detailOpen = false)}>{$t('common.close')}</Button>
	{/if}
{/snippet}
```

- [ ] **Step 5: Reset confirm state when modal closes**

Find the `detailOpen` close handler. The modal uses `onclose={() => (detailOpen = false)}`. Update it to also reset state:

Find:
```svelte
<Modal open={detailOpen} title={$t('calendar.modal.detailTitle')} onclose={() => (detailOpen = false)}>
```

Replace with:
```svelte
<Modal open={detailOpen} title={$t('calendar.modal.detailTitle')} onclose={() => { detailOpen = false; cancelConfirming = false; sessionActionError = ''; }}>
```

- [ ] **Step 6: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/routes/calendar/+page.svelte
git commit -m "feat: calendar — implement cancel session and mark completed handlers"
```

---

## Task 11: New /teachers public directory page

**Files:**
- Create: `src/routes/teachers/+page.svelte`

- [ ] **Step 1: Create the file**

Create `src/routes/teachers/+page.svelte` with the following content:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	let teachers = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await fetch(`${BASE}/teachers/featured`);
			const data = res.ok ? await res.json() : [];
			teachers = Array.isArray(data) ? data : [];
		} catch {
			teachers = [];
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{$t('nav.teachers')} — Mutawazin</title>
	<meta name="description" content="Browse featured Mutawazin teachers." />
</svelte:head>

<div class="min-h-screen flex flex-col bg-bgGray">
	<Navbar />

	<main class="max-w-content mx-auto px-6 lg:px-12 py-12 w-full">
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight">{$t('nav.teachers')}</h1>
			<p class="text-text2 mt-1">{$t('landing.teachersSub')}</p>
		</div>

		{#if loading}
			<div class="flex justify-center py-20" role="status">
				<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else if teachers.length === 0}
			<p class="text-center text-text2 py-20">{$t('common.noResults')}</p>
		{:else}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each teachers as teacher}
					<div class="bg-white border border-border rounded-DEFAULT shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 transition-all duration-150 flex flex-col">
						<div class="p-5 flex-1">
							<div class="flex items-center gap-3 mb-3">
								<Avatar name={teacher.full_name} id={teacher.user_id} size="lg" src={teacher.photo_url} />
								<div>
									<div class="font-semibold">{teacher.full_name}</div>
									<div class="text-xs text-text2">{$t('common.tutor')}</div>
								</div>
							</div>
							{#if teacher.subjects?.length}
								<div class="flex flex-wrap gap-1.5 mb-3">
									{#each teacher.subjects.slice(0, 3) as subject}
										<Badge variant="teal" label={subject} />
									{/each}
									{#if teacher.is_featured}
										<Badge variant="gold">★ {$t('status.featured')}</Badge>
									{/if}
								</div>
							{/if}
							{#if teacher.bio}
								<p class="text-sm text-text2 line-clamp-2">{teacher.bio}</p>
							{/if}
						</div>
						<div class="px-5 py-3 border-t border-border flex items-center justify-between">
							<span class="text-xs text-text2 tabular">
								{#if teacher.average_rating && (teacher.total_ratings ?? 0) > 0}
									⭐ {Number(teacher.average_rating).toFixed(1)}
								{/if}
							</span>
							<a
								href="/teachers/{teacher.user_id}"
								class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
							>
								{$t('common.viewProfile')}
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-10 text-center">
			<Button variant="secondary" href="/">{$t('landing.footerHome')} ←</Button>
		</div>
	</main>
</div>
```

- [ ] **Step 2: Verify type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/teachers/+page.svelte
git commit -m "feat: public /teachers directory page with featured teachers grid"
```

---

## Final Verification

- [ ] **Run full type check**

```powershell
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Run build**

```powershell
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Manual browser smoke test**

Start the dev server:
```powershell
npm run dev
```

Test each item:
1. `/` — Footer has no Contact/Privacy links; "Browse all teachers" and footer Teachers link both go to `/teachers`
2. `/teachers` — Page loads, shows featured teacher cards, each card links to `/teachers/{id}`
3. Navbar (logged out) — "Home" link goes to `/`, no Bell icon
4. Navbar (logged in) — No Bell icon; "Sign out" button appears; clicking it POSTs to `/auth/logout` and redirects to `/`
5. Sidebar (teacher, logged in) — "My Profile" goes to `/teachers/{id}`; "Reports" goes to `/dashboard#private-students`; no "My Students" item
6. Sidebar (student, logged in) — "My Profile" goes to `/students/{id}`; "My Reports" goes to `/reports/{id}`
7. `/dashboard` (teacher) — Welcome uses real name; no "recently" if `last_session_at` absent
8. `/dashboard` (student) — Welcome uses real name; no streak line; no Message button; assigned teacher shows `$t('common.tutor')` label
9. `/courses` — Subject filter populates from `/subjects` endpoint
10. `/calendar` — Session detail modal: "Cancel Session" asks for confirmation before calling API; "Mark Completed" calls API and closes modal
11. `/teachers/{id}` — No Message button shown when viewing another teacher's profile
