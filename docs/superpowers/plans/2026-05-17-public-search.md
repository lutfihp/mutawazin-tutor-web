# Public Search — Guest Browse on Landing Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public search section to the landing page between Benefits and Featured Teachers, using `GET /search/courses` and `GET /search/teachers` (no auth required), and fix the dead `/#courses` navbar anchor.

**Architecture:** New `<section id="courses">` added to `+page.svelte`. Data fetched in `onMount` (CSR) with a debounced search input. No new routes or components — the section lives inline in the landing page. Navbar anchor `/#courses` already points to this new section id.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, native `fetch` (no auth needed, not using `api` client)

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/routes/+page.svelte` — new search section, new state, new fetch functions |
| Modify | `src/locales/en.json` — new `landing.search*` keys |
| Modify | `src/locales/id.json` — new keys (Indonesian) |

---

### Task 1: Add locale keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add search keys to `en.json` under `landing`**

Inside the `"landing"` object, add after `"browseAll"`:
```json
    "searchEyebrow": "Browse",
    "searchH2": "Find the right course or teacher",
    "searchTabCourses": "Courses",
    "searchTabTeachers": "Teachers",
    "searchPlaceholder": "Search courses or teachers...",
    "searchButton": "Search",
    "searchEmpty": "No results for '{q}'",
    "searchActiveCourses": "{n} active courses",
    "searchDefaultEmpty": "No courses or teachers available yet.",
```

- [ ] **Step 2: Add same keys to `id.json` under `landing`**

```json
    "searchEyebrow": "Jelajahi",
    "searchH2": "Temukan kursus atau guru yang tepat",
    "searchTabCourses": "Kursus",
    "searchTabTeachers": "Guru",
    "searchPlaceholder": "Cari kursus atau guru...",
    "searchButton": "Cari",
    "searchEmpty": "Tidak ada hasil untuk '{q}'",
    "searchActiveCourses": "{n} kursus aktif",
    "searchDefaultEmpty": "Belum ada kursus atau guru tersedia.",
```

---

### Task 2: Add search state and fetch functions to the landing page script

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add `onMount` import and search state**

In `src/routes/+page.svelte` add `onMount` to the svelte import and add search state variables. After the existing `const year = new Date().getFullYear();` line, add:

```svelte
	import { onMount } from 'svelte';

	// Public search
	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
	let searchQuery = $state('');
	let searchTab = $state<'courses' | 'teachers'>('courses');
	let courseResults = $state<any[]>([]);
	let teacherResults = $state<any[]>([]);
	let searchLoading = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;

	async function runSearch(q: string) {
		searchLoading = true;
		try {
			const [courses, teachers] = await Promise.all([
				fetch(`${BASE}/search/courses${q ? `?q=${encodeURIComponent(q)}` : ''}`)
					.then(r => r.ok ? r.json() : []),
				fetch(`${BASE}/search/teachers${q ? `?q=${encodeURIComponent(q)}` : ''}`)
					.then(r => r.ok ? r.json() : []),
			]);
			courseResults = Array.isArray(courses) ? courses : [];
			teacherResults = Array.isArray(teachers) ? teachers : [];
		} catch {
			courseResults = [];
			teacherResults = [];
		} finally {
			searchLoading = false;
		}
	}

	function handleSearchInput() {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => runSearch(searchQuery), 300);
	}

	onMount(() => runSearch(''));
```

> `onMount` here replaces any previous `onMount` for the landing page if one exists. Check `+page.svelte` — if there is no existing `onMount`, just add this. If there is one, merge the `runSearch('')` call into it.

---

### Task 3: Add search section to the landing page template

**Files:**
- Modify: `src/routes/+page.svelte`

Add the new section between `<!-- ── Benefits ──>` and `<!-- ── Featured Teachers ──>`.

- [ ] **Step 1: Insert section after the closing `</section>` of Benefits**

Find the comment `<!-- ── Featured Teachers ──>` and insert this entire block above it:

```svelte
	<!-- ── Search ── -->
	<section id="courses" class="py-24 bg-white border-t border-border">
		<div class="max-w-content mx-auto px-6 lg:px-12">
			<div class="text-center mb-10">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{$t('landing.searchEyebrow')}</p>
				<h2 class="text-3xl font-bold tracking-tight">{$t('landing.searchH2')}</h2>
			</div>

			<!-- Search bar -->
			<div class="flex gap-3 max-w-xl mx-auto mb-8">
				<input
					type="search"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					placeholder={$t('landing.searchPlaceholder')}
					class="flex-1 h-11 px-4 bg-white border border-border rounded-sm text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
				/>
				<button
					onclick={() => runSearch(searchQuery)}
					class="h-11 px-5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-sm transition-colors"
				>
					{$t('landing.searchButton')}
				</button>
			</div>

			<!-- Tab switcher -->
			<div class="flex gap-1 bg-bgGray border border-border rounded-sm p-0.5 w-fit mx-auto mb-8">
				{#each [['courses', $t('landing.searchTabCourses')], ['teachers', $t('landing.searchTabTeachers')]] as [tab, label]}
					<button
						onclick={() => (searchTab = tab as 'courses' | 'teachers')}
						class="px-4 py-2 text-sm font-medium rounded-sm transition-colors
						       {searchTab === tab ? 'bg-white text-text shadow-sm' : 'text-text2 hover:text-text'}"
						aria-pressed={searchTab === tab}
					>
						{label}
					</button>
				{/each}
			</div>

			<!-- Results -->
			{#if searchLoading}
				<div class="flex justify-center py-10" role="status">
					<div class="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if searchTab === 'courses'}
				{#if courseResults.length === 0}
					<p class="text-center text-text2 py-10">
						{searchQuery ? $t('landing.searchEmpty', { values: { q: searchQuery } }) : $t('landing.searchDefaultEmpty')}
					</p>
				{:else}
					<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{#each courseResults as course}
							<div class="bg-white border border-border rounded-DEFAULT shadow-sm p-5 flex flex-col gap-3">
								<div class="flex flex-wrap gap-1.5">
									<Badge variant="active" label={course.subject} />
									{#each (course.age_categories ?? []) as age}
										<Badge variant="violet" label={age} />
									{/each}
								</div>
								<div class="font-semibold text-base">{course.name}</div>
								{#if course.teachers?.length}
									<div class="flex -space-x-2">
										{#each course.teachers.slice(0, 4) as teacher}
											<Avatar name={teacher.full_name} id={teacher.user_id} size="sm" src={teacher.photo_url} class="border-2 border-white" />
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				{#if teacherResults.length === 0}
					<p class="text-center text-text2 py-10">
						{searchQuery ? $t('landing.searchEmpty', { values: { q: searchQuery } }) : $t('landing.searchDefaultEmpty')}
					</p>
				{:else}
					<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{#each teacherResults as teacher}
							<div class="bg-white border border-border rounded-DEFAULT shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 flex flex-col p-5 gap-3">
								<div class="flex items-center gap-3">
									<Avatar name={teacher.full_name} id={teacher.user_id} size="lg" src={teacher.photo_url} />
									<div>
										<div class="font-semibold">{teacher.full_name}</div>
										<div class="text-xs text-text2">{$t('landing.searchActiveCourses', { values: { n: teacher.active_course_count ?? 0 } })}</div>
									</div>
								</div>
								{#if teacher.subjects?.length}
									<div class="flex flex-wrap gap-1.5">
										{#each teacher.subjects.slice(0, 3) as subject}
											<Badge variant="teal" label={subject} />
										{/each}
									</div>
								{/if}
								<a href="/teachers/{teacher.user_id}" class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
									{$t('common.viewProfile')}
								</a>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</section>
```

- [ ] **Step 2: Verify and commit**

```powershell
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: public search section on landing page (courses + teachers)"
```

---

## Self-Review

**Spec coverage:**
- ✅ Search section between Benefits and Featured Teachers → Task 3
- ✅ Section `id="courses"` (fixes `/#courses` dead link) → Task 3
- ✅ Search bar with debounce 300ms → Task 2 + 3
- ✅ Tab switcher Courses / Teachers → Task 3
- ✅ Course result cards → Task 3
- ✅ Teacher result cards with `active_course_count` → Task 3
- ✅ `GET /search/courses` and `GET /search/teachers` (no auth) → Task 2
- ✅ Default empty state → locale keys in Task 1

**Placeholder scan:** None found.

**Type consistency:** `courseResults: any[]`, `teacherResults: any[]` used consistently.
