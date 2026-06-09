# Landing Page Search & Featured Teachers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the teachers tab from the landing page search section (courses-only) and make the Featured Teachers section always render with a max of 3 cards and a graceful empty state.

**Architecture:** Frontend-only change to `src/routes/+page.svelte` and both locale files. The server load (`+page.server.ts`) is unchanged — it continues fetching `GET /teachers/featured`. No backend changes.

**Tech Stack:** SvelteKit 5 (Svelte runes), svelte-i18n, Tailwind v3

---

## Files

| File | Change |
|---|---|
| `src/routes/+page.svelte` | Remove tab switcher UI, teacher state, teacher fetch; fix featured teachers section |
| `src/locales/en.json` | Add `landing.teachersEmpty` key |
| `src/locales/id.json` | Add `landing.teachersEmpty` key |
| `src/routes/+page.server.ts` | **No change** |

---

### Task 1: Add i18n empty-state keys

**Files:**
- Modify: `src/locales/en.json` (around line 502, after `browseAll`)
- Modify: `src/locales/id.json` (around line 502, after `browseAll`)

- [ ] **Step 1: Add key to en.json**

In `src/locales/en.json`, find the block containing `"browseAll"` and add `"teachersEmpty"` immediately after it:

```json
    "browseAll": "Browse all teachers",
    "teachersEmpty": "No featured teachers yet. Check back soon!",
```

- [ ] **Step 2: Add key to id.json**

In `src/locales/id.json`, find the same block and add:

```json
    "browseAll": "Jelajahi semua guru",
    "teachersEmpty": "Belum ada guru unggulan. Pantau terus!",
```

- [ ] **Step 3: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors, 16 warnings (pre-existing).

- [ ] **Step 4: Commit**

```powershell
git add src/locales/en.json src/locales/id.json
git commit -m "i18n: add landing.teachersEmpty key for featured teachers empty state"
```

---

### Task 2: Fix featured teachers section (always render, max 3)

**Files:**
- Modify: `src/routes/+page.svelte` (the `<!-- ── Featured Teachers ── -->` section, around line 267)

The current section has this structure:
```svelte
{#if data.featuredTeachers?.length > 0}
    <div class="grid ...">
        {#each data.featuredTeachers as teacher}
            ...
        {/each}
    </div>
{/if}
<div class="text-center">
    <Button ...>Browse all</Button>
</div>
```

- [ ] **Step 1: Replace the featured teachers section body**

Find the comment `<!-- ── Featured Teachers ── -->` in `src/routes/+page.svelte`. Replace the block between the opening `<section id="teachers"` and its closing `</section>` with:

```svelte
<!-- ── Featured Teachers ── -->
<section id="teachers" class="py-24 bg-bgGray">
	<div class="max-w-content mx-auto px-6 lg:px-12">
		<div class="text-center mb-14">
			<p class="text-xs font-semibold uppercase tracking-widest text-teal mb-2">{$t('landing.teachersEyebrow')}</p>
			<h2 class="text-3xl font-bold tracking-tight mb-4">{$t('landing.teachersH2')}</h2>
			<p class="text-text2 max-w-lg mx-auto">{$t('landing.teachersSub')}</p>
		</div>

		{#if data.featuredTeachers?.length > 0}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
				{#each data.featuredTeachers.slice(0, 3) as teacher}
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
								{#if teacher.rating}⭐ {teacher.rating}{/if}
							</span>
							<a href="/teachers/{teacher.user_id}" class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">
								{$t('common.viewProfile')}
							</a>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-center text-text2 py-10">{$t('landing.teachersEmpty')}</p>
		{/if}

		<div class="text-center">
			<Button variant="secondary" size="lg" href="/teachers">
				{$t('landing.browseAll')}
			</Button>
		</div>
	</div>
</section>
```

- [ ] **Step 2: Run type check**

```powershell
npm run check
```

Expected: 0 errors, 16 warnings.

- [ ] **Step 3: Commit**

```powershell
git add src/routes/+page.svelte
git commit -m "fix(landing): featured teachers always renders, max 3, graceful empty state"
```

---

### Task 3: Remove search tab switcher — courses only

**Files:**
- Modify: `src/routes/+page.svelte` (the `<script>` block and `<!-- ── Search ── -->` section)

- [ ] **Step 1: Remove teacher state and simplify script block**

In the `<script lang="ts">` block, find and remove these lines:

```ts
let searchTab = $state<'courses' | 'teachers'>('courses');
let teacherResults = $state<any[]>([]);
```

And replace the `runSearch` function:

```ts
// REMOVE this:
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
```

```ts
// REPLACE with:
async function runSearch(q: string) {
    searchLoading = true;
    try {
        const res = await fetch(`${BASE}/search/courses${q ? `?q=${encodeURIComponent(q)}` : ''}`);
        const courses = res.ok ? await res.json() : [];
        courseResults = Array.isArray(courses) ? courses : [];
    } catch {
        courseResults = [];
    } finally {
        searchLoading = false;
    }
}
```

- [ ] **Step 2: Remove tab switcher and teacher results from the template**

In the `<!-- ── Search ── -->` section, find and remove the tab switcher div entirely:

```svelte
<!-- REMOVE this entire block: -->
<!-- Tab switcher -->
<div class="flex gap-1 bg-bgGray border border-border rounded-sm p-0.5 w-fit mx-auto mb-8">
    {#each ([['courses', $t('landing.searchTabCourses')], ['teachers', $t('landing.searchTabTeachers')]] as const) as [tab, label]}
        <button
            onclick={() => (searchTab = tab)}
            class="px-4 py-2 text-sm font-medium rounded-sm transition-colors
                   {searchTab === tab ? 'bg-white text-text shadow-sm' : 'text-text2 hover:text-text'}"
            aria-pressed={searchTab === tab}
        >
            {label}
        </button>
    {/each}
</div>
```

Then find the results block and remove the teachers branch:

```svelte
<!-- CURRENT: -->
{#if searchLoading}
    ...spinner...
{:else if searchTab === 'courses'}
    ...course results...
{:else}
    ...teacher results...
{/if}
```

```svelte
<!-- REPLACE with: -->
{#if searchLoading}
    <div class="flex justify-center py-10" role="status">
        <div class="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
{:else if courseResults.length === 0}
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
```

- [ ] **Step 3: Run type check**

```powershell
npm run check
```

Expected: 0 errors, 16 warnings.

- [ ] **Step 4: Commit**

```powershell
git add src/routes/+page.svelte
git commit -m "fix(landing): search section shows courses only, remove teacher tab"
```
