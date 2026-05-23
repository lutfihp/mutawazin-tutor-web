# Dashboard Stat, Navbar Avatar & Course Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix admin active-courses stat (backend already updated — verify only), replace the Navbar's numeric-ID avatar with a role-aware profile-linked avatar, and create the missing `/courses/:id` detail page.

**Architecture:** Issue 1 requires no code change. Issue 2 is a single-file Navbar change: fetch the user's own profile on mount and render a clickable Avatar for teacher/student, nothing for admin. Issue 3 adds two new files under `src/routes/courses/[id]/` — a server load that fetches `GET /courses/:id` (throwing 404 on failure) and a Svelte page that shows course info with role-conditional enrollment state.

**Tech Stack:** SvelteKit (Svelte 5 runes), TypeScript, Tailwind v3, svelte-i18n, `$lib/api` client.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/components/layout/Navbar.svelte` | Modify | Fetch profile on mount; role-conditional avatar |
| `src/locales/en.json` | Modify | Add `courses.detail.*` keys |
| `src/locales/id.json` | Modify | Add `courses.detail.*` keys (Indonesian) |
| `src/routes/courses/[id]/+page.server.ts` | Create | Auth guard + fetch course + 404 handling |
| `src/routes/courses/[id]/+page.svelte` | Create | Course detail view |

---

## Task 0: Verify Issue 1 — Active Courses stat

No code change required. The backend now returns `active_courses` in `GET /admin/stats` and the frontend already reads `s.active_courses ?? 0` at `src/routes/admin/+page.svelte:25`.

- [ ] **Step 1: Start the dev server**

```powershell
npm run dev
```

- [ ] **Step 2: Log in as admin and open `/admin`**

Credentials: `admin@mutawazin.com` / `changeme123`

Expected: The "Active Courses" stat card shows a non-zero number matching the count of courses with `status === "active"` in the database.

- [ ] **Step 3: Stop dev server if done testing**

Ctrl+C

---

## Task 1: Navbar Avatar — role-conditional with profile fetch

**Files:**
- Modify: `src/lib/components/layout/Navbar.svelte`

The current `<Avatar name={$user.id} id={$user.id} size="sm" />` renders the numeric user ID as initials. Replace with: nothing for admin; a profile-fetched, link-wrapped Avatar for teacher and student.

- [ ] **Step 1: Replace the `<script>` block in Navbar.svelte**

Replace the entire `<script lang="ts">` block (lines 1–37) with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/auth';
	import { sidebarOpen } from '$lib/stores/sidebar';
	import { setLang, type Lang } from '$lib/i18n';
	import { locale, t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	import { Menu, X } from 'lucide-svelte';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';

	let scrolled = $state(false);
	let currentLang = $derived($locale === 'id' ? 'id' : 'en');

	let profileName = $state('');
	let profileSrc = $state('');

	function handleScroll() {
		scrolled = window.scrollY > 4;
	}

	function toggleSidebar() {
		sidebarOpen.update((v) => !v);
	}

	function switchLang(lang: Lang) {
		setLang(lang);
	}

	const isLanding = $derived(!$user);

	async function logout() {
		try { await api.post('/auth/logout', {}); } catch {}
		user.set(null);
		goto('/');
	}

	onMount(async () => {
		if (!$user || $user.role === 'admin') return;
		try {
			const endpoint = $user.role === 'teacher'
				? `/teachers/${$user.id}`
				: `/students/${$user.id}`;
			const profile = await api.get<{ full_name?: string; photo_url?: string }>(endpoint);
			profileName = profile?.full_name ?? '';
			profileSrc = profile?.photo_url ?? '';
		} catch {
			// Avatar renders as blank colored circle — acceptable fallback
		}
	});
</script>
```

- [ ] **Step 2: Replace the authenticated avatar block in the template**

Find the comment `<!-- Authenticated: avatar + logout -->` and the `{#if $user}` block that follows it (lines 99–113). Replace that entire block with:

```svelte
	<!-- Authenticated: avatar + logout -->
	{#if $user}
		{#if $user.role !== 'admin'}
			{@const profileHref = $user.role === 'teacher' ? `/teachers/${$user.id}` : `/students/${$user.id}`}
			<a href={profileHref} class="flex-none rounded-pill focus-visible:ring-2 focus-visible:ring-primary" aria-label="My profile">
				<Avatar name={profileName} src={profileSrc} id={$user.id} size="sm" />
			</a>
		{/if}
		<button
			onclick={logout}
			class="px-3 py-1.5 text-sm font-medium text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors"
		>
			{$t('nav.logout')}
		</button>
	{:else}
		<!-- Landing CTAs -->
		<a href="/login" class="hidden nav-collapse:inline-flex items-center px-3 py-1.5 text-sm font-semibold text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">
			{$t('nav.login')}
		</a>
	{/if}
```

- [ ] **Step 3: Run type check**

```powershell
npm run check
```

Expected: 0 errors (12 pre-existing warnings are acceptable).

- [ ] **Step 4: Verify in browser**

Start dev server (`npm run dev`), log in as:
- **Admin** (`admin@mutawazin.com`): Navbar between lang toggle and Sign out should have NO avatar circle.
- **Teacher**: Avatar circle appears with name initials (or photo if one exists). Clicking it navigates to `/teachers/{id}`.
- **Student**: Same but links to `/students/{id}`.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/components/layout/Navbar.svelte
git commit -m "feat: navbar avatar — remove for admin, link to profile for teacher/student"
```

---

## Task 2: Add i18n keys for course detail page

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add `detail` sub-object to `courses` in `src/locales/en.json`**

Inside the `"courses": { ... }` object, add after `"modal": { ... }`:

```json
    "detail": {
      "back": "← Courses",
      "teacher": "Teacher",
      "pricing": "Pricing",
      "isEnrolled": "Enrolled",
      "manageEnrollments": "Manage enrollments →"
    }
```

- [ ] **Step 2: Add `detail` sub-object to `courses` in `src/locales/id.json`**

Inside the `"courses": { ... }` object, in the same position as the English file:

```json
    "detail": {
      "back": "← Kursus",
      "teacher": "Guru",
      "pricing": "Harga",
      "isEnrolled": "Terdaftar",
      "manageEnrollments": "Kelola pendaftaran →"
    }
```

- [ ] **Step 3: Run type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```powershell
git add src/locales/en.json src/locales/id.json
git commit -m "feat: add i18n keys for course detail page"
```

---

## Task 3: Course detail — server load

**Files:**
- Create: `src/routes/courses/[id]/+page.server.ts`

The parent `src/routes/courses/+layout.svelte` already wraps with `<AuthLayout>`. This load only needs to guard auth, fetch the course, and surface a 404 on failure.

- [ ] **Step 1: Create the file**

Create `src/routes/courses/[id]/+page.server.ts` with this content:

```typescript
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };

	const res = await fetch(`${BASE}/courses/${params.id}`, { headers });
	if (res.status === 404) throw error(404, 'Course not found');
	if (!res.ok) throw error(500, 'Failed to load course');

	const course = await res.json();
	return { course, user: locals.user };
};
```

- [ ] **Step 2: Run type check**

```powershell
npm run check
```

Expected: 0 errors. SvelteKit generates `$types` on the fly — if you see a missing `$types` error, run `npm run dev` once first to trigger type generation, then re-check.

- [ ] **Step 3: Commit**

```powershell
git add src/routes/courses/[id]/+page.server.ts
git commit -m "feat: course detail server load — auth guard + GET /courses/:id + 404"
```

---

## Task 4: Course detail — page component

**Files:**
- Create: `src/routes/courses/[id]/+page.svelte`

Course response shape for reference:
```ts
{
  id: string
  teacher_id: string
  subject_id: string
  name: string                            // resolved subject name
  subject_status: 'active' | 'deleted' | 'unknown'
  age_categories: string[]                // e.g. ["elementary", "high-school"]
  price_by_age_category: Record<string, number>  // e.g. { "elementary": 50000 }
  description: string
  status: 'draft' | 'active' | 'archived'
  enrolled_student_ids: string[]
}
```

- [ ] **Step 1: Create the file**

Create `src/routes/courses/[id]/+page.svelte` with this content:

```svelte
<script lang="ts">
	import { t } from 'svelte-i18n';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();
	const course = $derived(data.course);
	const role = $derived(data.user?.role ?? 'student');
	const userId = $derived(data.user?.id ?? '');

	const isStudent = $derived(role === 'student');
	const isAdmin = $derived(role === 'admin');

	const isEnrolled = $derived(
		isStudent &&
		Array.isArray(course?.enrolled_student_ids) &&
		course.enrolled_student_ids.includes(userId)
	);

	const enrolledCount = $derived(course?.enrolled_student_ids?.length ?? 0);

	// Maps API age category keys to existing i18n keys
	const AGE_KEYS: Record<string, string> = {
		'pre-school':   'courses.agePreSchool',
		'elementary':   'courses.ageElementary',
		'middle-school':'courses.ageMiddleSchool',
		'high-school':  'courses.ageHighSchool',
		'general':      'courses.ageGeneral',
	};

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
			<span class="text-sm text-text2">{$t('courses.detail.teacher')}</span>
			<a
				href="/teachers/{course?.teacher_id}"
				class="text-sm font-semibold text-primary hover:text-primary-dark"
			>
				{$t('common.viewProfile')}
			</a>
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
</div>
```

- [ ] **Step 2: Run type check**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Verify in browser**

Start dev server. Navigate to `/courses`, click "View Course →" on any course card.

Check:
- Page loads without 404
- Course name appears as `h1`
- Status badge is visible (green for active, gray for draft, amber for archived)
- Pricing grid shows age categories with formatted Rp amounts
- Teacher section has a "View Profile →" link to `/teachers/{id}`
- As student: if enrolled, green "Enrolled" badge appears
- As teacher/admin: enrolled count appears ("X students enrolled")
- As admin: "Manage enrollments →" link to `/admin/courses` appears
- Clicking "← Courses" returns to `/courses`

- [ ] **Step 4: Commit**

```powershell
git add src/routes/courses/[id]/+page.svelte
git commit -m "feat: course detail page — info, pricing, role-conditional enrollment state"
```

---

## Self-Review

**Spec coverage:**
- ✅ Issue 1: verified in Task 0 (no code change)
- ✅ Issue 2 — admin: no avatar (Task 1 template, `role !== 'admin'` guard)
- ✅ Issue 2 — teacher/student: fetch on mount, Avatar linked to profile (Task 1 script + template)
- ✅ Issue 2 — photo_url: passed as `src` prop to Avatar (falls back to initials if absent/fails)
- ✅ Issue 3 — server load: auth guard + fetch + 404 (Task 3)
- ✅ Issue 3 — back link, header, description, teacher, pricing (Task 4)
- ✅ Issue 3 — student enrolled badge (Task 4, `isEnrolled`)
- ✅ Issue 3 — teacher/admin count (Task 4, `!isStudent`)
- ✅ Issue 3 — admin manage link (Task 4, `isAdmin`)
- ✅ Issue 3 — no enroll action (omitted by design)

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `profileName`/`profileSrc` defined in Task 1 script and used in Task 1 template only. `course`, `isStudent`, `isAdmin`, `isEnrolled`, `enrolledCount` defined and used within Task 4 only. No cross-task type references.
