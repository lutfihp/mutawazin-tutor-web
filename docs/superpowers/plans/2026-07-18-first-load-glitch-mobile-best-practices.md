# First-Load Glitch Fix + Mobile-First Best-Practice Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the cold-cache first-load glitch, self-host fonts, make every route usable at 360px (including a dots + day-panel mobile calendar), and add social/SEO meta + sitemap.

**Architecture:** Four independent phases, each committed separately. Phase 1 removes the redundant `$isLoading` guard and moves Inter to `@fontsource`. Phase 2 is mechanical mobile fixes plus a 360px verification walk. Phase 3 adds a mobile-only dots + day-panel rendering to both calendar pages (in place, no shared component — the pages' pill content and modals have diverged). Phase 4 extends `SeoAlternates.svelte` with description/OG/Twitter props and adds `robots.txt` + `/sitemap.xml`.

**Tech Stack:** SvelteKit 5 (runes), TypeScript, Tailwind v3, svelte-i18n, `@fontsource/inter`.

**Spec:** `docs/superpowers/specs/2026-07-18-first-load-glitch-mobile-best-practices-design.md`

**Testing note:** This repo has NO unit-test runner (no vitest/jest) — do not introduce one. Verification per task = `npm run check` (must stay 0 errors; ~16-18 pre-existing warnings are OK), `curl` of SSR output, and browser checks at 360/768/1280 widths. All commands run from repo root `D:\Codading Repo\mutawazin\mutawazin-tutor-web`. Dev login for browser checks: `admin@mutawazin.com` / `changeme123` (backend must be running: see parent CLAUDE.md).

**Git:** Commit per task. NEVER push — pushing requires explicit user approval (standing rule).

---

## Phase 1 — First-load glitch + fonts

### Task 1: Remove the `$isLoading` guard from the root layout

The guard causes the glitch: on cold-cache hydration svelte-i18n's `isLoading` flips true while locale JSON loads, swapping the already-rendered page for a spinner. `src/routes/+layout.ts` already `await waitLocale()` on server AND client, so the guard is redundant.

**Files:**
- Modify: `src/routes/+layout.svelte` (entire file)

- [ ] **Step 1: Replace the file content**

Replace the entire content of `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
```

(Deletes the `isLoading` import, the `{#if $isLoading}` spinner branch, and the wrapper markup.)

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: 0 errors (pre-existing warnings only).

- [ ] **Step 3: Verify no other `$isLoading` full-page guards exist**

Run: `grep -rn "isLoading" src/`
Expected: no results (the only usage was the root layout).

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "fix: remove redundant isLoading guard causing first-load flash"
```

### Task 2: Self-host Inter via @fontsource

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/app.css:1` (add imports at very top)
- Modify: `src/app.html:6-11` (remove Google Fonts links)

- [ ] **Step 1: Install**

Run: `npm install @fontsource/inter`
Expected: added to `dependencies` in `package.json`.

- [ ] **Step 2: Import weights in app.css**

At the very top of `src/app.css`, BEFORE `@tailwind base;`, add:

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
```

(Vite resolves bare-module CSS imports and bundles the woff2 files; `@fontsource` CSS already uses `font-display: swap`.)

- [ ] **Step 3: Remove Google Fonts from app.html**

In `src/app.html`, delete these lines (currently lines 6-11):

```html
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
		<link
			href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
			rel="stylesheet"
		/>
```

No change to `tailwind.config.js` — `fontFamily.sans` already lists `Inter, system-ui, ...`.

- [ ] **Step 4: Verify**

Run: `npm run check` → 0 errors.
Run: `npm run build` → succeeds.
Run: `grep -rn "fonts.googleapis" src/ build/ | head -5`
Expected: no matches.
Run: `ls build/client/_app/immutable/assets/ | grep -i inter | head -5`
Expected: hashed `inter-*.woff2` files present.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app.css src/app.html
git commit -m "perf: self-host Inter via @fontsource, drop Google Fonts request chain"
```

- [ ] **Step 6: Cold-load verification (with user or browser tooling)**

Start dev (`npm run dev`) with backend running. In an incognito window with DevTools → Network → "Disable cache" + Slow 4G throttle, load `http://localhost:5173/`. Expected: content renders once — no spinner replacing the page, no blank frame, no raw i18n keys, zero requests to `fonts.googleapis.com`/`fonts.gstatic.com`.

---

## Phase 2 — Mechanical mobile fixes + 360px walk

### Task 3: EarningsTable — horizontal scroll wrapper + mobile-safe totals

**Files:**
- Modify: `src/lib/components/EarningsTable.svelte:44-63` (wrap table), `:66-77` (totals gaps)

- [ ] **Step 1: Wrap the table**

In `src/lib/components/EarningsTable.svelte`, wrap the `<table>…</table>` element (inside the `{:else}` branch) in a scroll container:

```svelte
		<div class="overflow-x-auto">
			<table class="w-full text-sm border-collapse">
				<!-- thead/tbody unchanged -->
			</table>
		</div>
```

- [ ] **Step 2: Reduce totals gap on mobile**

In the totals footer of the same file, change all three `gap-14` occurrences to `gap-6 sm:gap-14`:

```svelte
			<div class="flex justify-end gap-6 sm:gap-14 text-sm text-text2 mb-1.5">
```
```svelte
			<div class="flex justify-end gap-6 sm:gap-14 text-sm text-text2 mb-3">
```
```svelte
			<div class="flex justify-end gap-6 sm:gap-14 border-t border-border pt-3">
```

- [ ] **Step 3: Check + commit**

Run: `npm run check` → 0 errors.

```bash
git add src/lib/components/EarningsTable.svelte
git commit -m "fix: EarningsTable horizontal scroll + mobile totals spacing"
```

### Task 4: Base mobile padding — AuthLayout and Navbar

At 360px, `p-6` (24px) on the main area and `px-6` on the navbar waste ~15% of width.

**Files:**
- Modify: `src/lib/components/layout/AuthLayout.svelte:37`
- Modify: `src/lib/components/layout/Navbar.svelte:57`

- [ ] **Step 1: AuthLayout main padding**

In `src/lib/components/layout/AuthLayout.svelte`, change the `<main>` class from:

```
class="flex-1 sidebar-collapse:ml-60 p-6 lg:p-8 focus:outline-none"
```

to:

```
class="flex-1 sidebar-collapse:ml-60 p-4 sm:p-6 lg:p-8 focus:outline-none"
```

- [ ] **Step 2: Navbar horizontal padding**

In `src/lib/components/layout/Navbar.svelte`, change the `<header>` class opening from:

```
class="sticky top-0 z-40 h-16 flex items-center gap-4 px-6
```

to:

```
class="sticky top-0 z-40 h-16 flex items-center gap-2 sm:gap-4 px-4 sm:px-6
```

- [ ] **Step 3: Check + commit**

Run: `npm run check` → 0 errors.

```bash
git add src/lib/components/layout/AuthLayout.svelte src/lib/components/layout/Navbar.svelte
git commit -m "fix: tighter base padding on mobile for navbar and main content"
```

### Task 5: 360px verification walk of every route

Exploratory-but-bounded task: verify each route at 360×740, fix only layout/overflow defects found. **Fix patterns allowed:** add `flex-wrap`, `overflow-x-auto` wrappers, `w-full`/`max-w-full`, responsive padding (`p-4 sm:p-6`), `truncate`/`break-words`, stack grids (`grid-cols-1 sm:grid-cols-N`). **Not allowed:** visual redesigns, component extraction, color/typography changes.

**Files:** any route `+page.svelte` where a defect is found (list in commit message).

- [ ] **Step 1: Start servers**

Backend: `cd ..\mutawazin-tutor-api; venv\Scripts\activate; uvicorn main:app --reload`
Frontend: `npm run dev` → http://localhost:5173

- [ ] **Step 2: Walk public routes at 360×740 (no login)**

Routes: `/`, `/en`, `/login`, `/register/teacher`, `/register/student`, `/forgot-password`, `/teachers`, one `/teachers/[id]`, one `/report/share/[token]` (if a share token exists in dev data; skip otherwise).

Check per route: (a) no horizontal body scroll — in DevTools console `document.documentElement.scrollWidth` must be ≤ 360; (b) no clipped/overlapping controls; (c) all buttons/links tappable.

- [ ] **Step 3: Walk authenticated routes as admin** (`admin@mutawazin.com` / `changeme123`)

Routes: `/admin`, `/admin/teachers`, `/admin/students`, `/admin/subjects`, `/admin/courses`, `/admin/calendar` (non-grid parts only — grid is Phase 3), `/admin/reports`, `/admin/settings/audit-log`. Also verify the hamburger → sidebar drawer open/close at 375px (closes CLAUDE.md known gap #4).

- [ ] **Step 4: Walk teacher/student routes**

Log in as a dev teacher and student account (check dev DB; if none exists, register fresh accounts via `/register/teacher` and `/register/student`). Routes: `/dashboard`, `/courses`, one `/courses/[id]`, `/calendar` (non-grid parts), `/reports`, `/reports/new`, one `/reports/[studentId]`, own profile page.

- [ ] **Step 5: Fix defects found using the allowed patterns, re-verify each fixed route**

- [ ] **Step 6: Check + commit**

Run: `npm run check` → 0 errors.

```bash
git add -A src/routes src/lib
git commit -m "fix: 360px mobile pass — overflow and spacing fixes across routes"
```

(List each fixed route + defect in the commit body. If zero defects found, commit nothing and note it.)

---

## Phase 3 — Calendar mobile: dots + day panel

Same pattern applied in place to both pages (deliberately no shared component). Breakpoint `md` (768px): below it, pills are hidden, day cells show up to 3 dots + `+N`, tapping a day highlights it and a panel below the grid lists its sessions; tapping a session opens the page's existing modal. Desktop `≥ md` is pixel-identical to today.

### Task 6: Shared i18n key

**Files:**
- Modify: `src/locales/en.json` (inside the existing `"calendar"` object)
- Modify: `src/locales/id.json` (same location)

- [ ] **Step 1: Add key to en.json** — inside the `"calendar": { … }` object add:

```json
		"noSessionsDay": "No sessions on this day.",
```

- [ ] **Step 2: Add key to id.json** — inside `"calendar": { … }` add:

```json
		"noSessionsDay": "Tidak ada sesi pada hari ini.",
```

- [ ] **Step 3: Commit**

```bash
git add src/locales/en.json src/locales/id.json
git commit -m "i18n: add calendar.noSessionsDay key"
```

### Task 7: Teacher/student calendar (`/calendar`) mobile treatment

**Files:**
- Modify: `src/routes/calendar/+page.svelte` — script (~line 30), cell markup (~lines 416-458), insert day panel after the calendar box (~line 459)

- [ ] **Step 1: Add state + helpers to the script**

After the existing `const today = toISODate(new Date());` (line ~30), add:

```ts
	let selectedDayKey = $state<string | null>(null);

	const selectedDaySessions = $derived(
		selectedDayKey ? sessions.filter((s) => s.starts_at?.startsWith(selectedDayKey)) : []
	);

	function dotClass(type: string, status: string): string {
		if (['Completed', 'completed', 'Cancelled', 'cancelled'].includes(status)) return 'bg-text3';
		if (type === 'group') return 'bg-primary';
		return 'bg-teal';
	}

	function dayPanelLabel(key: string): string {
		return new Intl.DateTimeFormat($locale === 'id' ? 'id-ID' : 'en-US', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		}).format(new Date(key + 'T00:00:00Z'));
	}
```

(`locale` is already imported from `svelte-i18n` on line 3 of this file.)

- [ ] **Step 2: Default the selection when the month changes**

Next to the existing `$effect(() => { year; month; fetchSessions(); });` (line ~157), add:

```ts
	$effect(() => {
		const isNowMonth = year === now.getFullYear() && month === now.getMonth();
		selectedDayKey = isNowMonth ? today : null;
	});
```

- [ ] **Step 3: Rework the day-cell markup**

Replace the day-cells block (the `<div class="grid grid-cols-7">…</div>` containing `{#each grid as cell}`, lines ~416-458) with:

```svelte
			<!-- Day cells -->
			<div class="grid grid-cols-7">
				{#each grid as cell}
					{@const isToday = cell ? toISODate(cell) === today : false}
					{@const isCurrentMonth = cell?.getUTCMonth() === month}
					{@const daySessions = cell ? sessionsByDate(cell) : []}
					{@const hasAvail = cell && isTeacher && hasAvailability(cell)}
					{@const dayKey = cell ? toISODate(cell) : ''}

					<div
						class="min-h-[64px] md:min-h-[120px] border-r border-b border-border last:border-r-0 p-1.5 relative
						       {!isCurrentMonth ? 'bg-[#FAFBFC]' : ''}
						       {hasAvail ? 'ring-inset ring-2 ring-primary/20' : ''}
						       {cell && selectedDayKey === dayKey ? 'max-md:bg-primary-light/40' : ''}"
					>
						{#if cell}
							<!-- Mobile: whole cell is a tap target -->
							<button
								class="md:hidden absolute inset-0 z-10"
								onclick={() => (selectedDayKey = dayKey)}
								aria-label={dayPanelLabel(dayKey)}
							></button>

							<span
								class="inline-flex items-center justify-center w-6 h-6 text-sm mb-1 rounded-full
								       {isToday ? 'bg-primary text-white font-semibold' : isCurrentMonth ? 'text-text' : 'text-text3'}"
							>
								{cell.getUTCDate()}
							</span>

							<!-- Mobile: session dots -->
							<div class="flex md:hidden flex-wrap items-center gap-0.5 px-0.5">
								{#each daySessions.slice(0, 3) as session}
									<span class="w-1.5 h-1.5 rounded-full {dotClass(session.type, session.status)}" aria-hidden="true"></span>
								{/each}
								{#if daySessions.length > 3}
									<span class="text-[9px] text-text2 leading-none">+{daySessions.length - 3}</span>
								{/if}
							</div>

							<!-- Desktop: session pills -->
							<div class="hidden md:flex flex-col gap-0.5">
								{#each daySessions.slice(0, 2) as session}
									<button
										onclick={() => openSession(session)}
										class="w-full text-left text-[11px] font-medium rounded px-1.5 py-0.5 truncate tabular {pillClass(session.type, session.status)}"
										title={session.display_title}
									>
										{session.recurring_template_id ? '↻ ' : ''}{session.starts_at?.slice(11, 16)} {session.display_title}
									</button>
								{/each}
								{#if daySessions.length > 2}
									<button
										onclick={() => openSession(daySessions[2])}
										class="text-[11px] text-primary font-medium text-left px-1.5"
									>
										{$t('common.more', { values: { n: daySessions.length - 2 } })}
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
```

(The desktop pill markup is byte-identical to today's — it only gained the `hidden md:flex` wrapper class change from `flex`.)

- [ ] **Step 4: Insert the mobile day panel**

Directly AFTER the calendar box's closing `</div>` (the `bg-white border border-border rounded-DEFAULT overflow-hidden` container, line ~459) and BEFORE the `<!-- Right panel -->` comment, insert as a sibling inside the `calendar-panel:grid-cols-[1fr_280px]` grid:

```svelte
		<!-- Mobile: selected day sessions -->
		{#if selectedDayKey}
			<section class="md:hidden bg-white border border-border rounded-DEFAULT p-4" aria-label={dayPanelLabel(selectedDayKey)}>
				<h2 class="font-semibold mb-3">{dayPanelLabel(selectedDayKey)}</h2>
				{#if selectedDaySessions.length === 0}
					<p class="text-sm text-text2">{$t('calendar.noSessionsDay')}</p>
				{:else}
					<div class="flex flex-col gap-1.5">
						{#each selectedDaySessions as session}
							<button
								onclick={() => openSession(session)}
								class="w-full text-left text-sm rounded-sm px-3 py-2 tabular {pillClass(session.type, session.status)}"
							>
								{session.recurring_template_id ? '↻ ' : ''}{session.starts_at?.slice(11, 16)}–{session.ends_at?.slice(11, 16)} · {session.display_title}
							</button>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
```

- [ ] **Step 5: Check + verify in browser**

Run: `npm run check` → 0 errors.
Browser at 360px (as teacher): grid fits, dots render, day tap highlights + fills panel, session tap opens the existing detail modal, availability ring still visible. At 1280px: identical to before.

- [ ] **Step 6: Commit**

```bash
git add src/routes/calendar/+page.svelte
git commit -m "feat: mobile calendar dots + day panel on /calendar"
```

### Task 8: Admin calendar (`/admin/calendar`) mobile treatment

Same pattern. Differences from Task 7: no availability ring; the cell div needs `relative` added; panel buttons use the existing `pillLabel(session)` helper (includes teacher first name when unfiltered); check that `locale` is imported from `svelte-i18n` (add it to the import if missing).

**Files:**
- Modify: `src/routes/admin/calendar/+page.svelte` — script (near `pillClass`, ~line 38), cell markup (~lines 446-479), day panel insert (~line 480)

- [ ] **Step 1: Ensure `locale` import**

In the `svelte-i18n` import line, make sure both are present: `import { t, locale } from 'svelte-i18n';`

- [ ] **Step 2: Add state + helpers**

Near `pillClass` (~line 38), add (code intentionally duplicated from Task 7 per spec — no shared extraction):

```ts
	let selectedDayKey = $state<string | null>(null);

	const selectedDaySessions = $derived(
		selectedDayKey ? sessions.filter((s) => s.starts_at?.startsWith(selectedDayKey)) : []
	);

	function dotClass(type: string, status: string): string {
		if (['Completed', 'completed', 'Cancelled', 'cancelled'].includes(status)) return 'bg-text3';
		if (type === 'group') return 'bg-primary';
		return 'bg-teal';
	}

	function dayPanelLabel(key: string): string {
		return new Intl.DateTimeFormat($locale === 'id' ? 'id-ID' : 'en-US', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		}).format(new Date(key + 'T00:00:00Z'));
	}
```

Next to this page's existing session-fetch `$effect`, add the month-change default:

```ts
	$effect(() => {
		const isNowMonth = year === now.getFullYear() && month === now.getMonth();
		selectedDayKey = isNowMonth ? today : null;
	});
```

This page also declares `const now = new Date()` and `const today = toISODate(new Date())` near the top — verify the names match before pasting; if this page names them differently, use its names.

- [ ] **Step 3: Rework the day-cell markup**

Replace the day-cells block (lines ~446-479). Same structure as Task 7 Step 3 with three differences: add `relative` to the cell class (this page's cell lacks it), no `hasAvail` line, and the desktop pills keep this page's `title="{teacherMap[session.teacher_id] ?? ''}: {session.display_title}"` and `{pillLabel(session)}` content:

```svelte
			<div class="grid grid-cols-7">
				{#each grid as cell}
					{@const isToday = cell ? toISODate(cell) === today : false}
					{@const isCurrentMonth = cell?.getUTCMonth() === month}
					{@const daySessions = cell ? sessionsByDate(cell) : []}
					{@const dayKey = cell ? toISODate(cell) : ''}
					<div
						class="min-h-[64px] md:min-h-[120px] border-r border-b border-border last:border-r-0 p-1.5 relative
						       {!isCurrentMonth ? 'bg-[#FAFBFC]' : ''}
						       {cell && selectedDayKey === dayKey ? 'max-md:bg-primary-light/40' : ''}"
					>
						{#if cell}
							<button
								class="md:hidden absolute inset-0 z-10"
								onclick={() => (selectedDayKey = dayKey)}
								aria-label={dayPanelLabel(dayKey)}
							></button>

							<span class="inline-flex items-center justify-center w-6 h-6 text-sm mb-1 rounded-full
							             {isToday ? 'bg-primary text-white font-semibold' : isCurrentMonth ? 'text-text' : 'text-text3'}">
								{cell.getUTCDate()}
							</span>

							<div class="flex md:hidden flex-wrap items-center gap-0.5 px-0.5">
								{#each daySessions.slice(0, 3) as session}
									<span class="w-1.5 h-1.5 rounded-full {dotClass(session.type, session.status)}" aria-hidden="true"></span>
								{/each}
								{#if daySessions.length > 3}
									<span class="text-[9px] text-text2 leading-none">+{daySessions.length - 3}</span>
								{/if}
							</div>

							<div class="hidden md:flex flex-col gap-0.5">
								{#each daySessions.slice(0, 2) as session}
									<button
										onclick={() => openSession(session)}
										class="w-full text-left text-[11px] font-medium rounded px-1.5 py-0.5 truncate tabular {pillClass(session.type, session.status)}"
										title="{teacherMap[session.teacher_id] ?? ''}: {session.display_title}"
									>
										{pillLabel(session)}
									</button>
								{/each}
								{#if daySessions.length > 2}
									<button
										onclick={() => openSession(daySessions[2])}
										class="text-[11px] text-primary font-medium text-left px-1.5"
									>
										{$t('common.more', { values: { n: daySessions.length - 2 } })}
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
```

- [ ] **Step 4: Insert the mobile day panel**

After the calendar box's closing `</div>` (~line 480), before `<!-- Right panel -->`, insert the same panel as Task 7 Step 4 but with `{pillLabel(session)}` as the button content:

```svelte
		<!-- Mobile: selected day sessions -->
		{#if selectedDayKey}
			<section class="md:hidden bg-white border border-border rounded-DEFAULT p-4" aria-label={dayPanelLabel(selectedDayKey)}>
				<h2 class="font-semibold mb-3">{dayPanelLabel(selectedDayKey)}</h2>
				{#if selectedDaySessions.length === 0}
					<p class="text-sm text-text2">{$t('calendar.noSessionsDay')}</p>
				{:else}
					<div class="flex flex-col gap-1.5">
						{#each selectedDaySessions as session}
							<button
								onclick={() => openSession(session)}
								class="w-full text-left text-sm rounded-sm px-3 py-2 tabular {pillClass(session.type, session.status)}"
							>
								{pillLabel(session)}
							</button>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
```

- [ ] **Step 5: Check + verify in browser**

Run: `npm run check` → 0 errors.
Browser at 360px (as admin): dots render, day tap fills panel, session tap opens the edit modal, edit/delete/recurring flows work from the panel path. Desktop unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/routes/admin/calendar/+page.svelte
git commit -m "feat: mobile calendar dots + day panel on /admin/calendar"
```

---

## Phase 4 — SEO / social meta

### Task 9: Extend SeoAlternates with description/OG/Twitter props

Backward compatible: call sites without props keep emitting only canonical/hreflang. OG image defaults to the EXISTING brand asset `static/brand-kit/png/social-card-1200x630.png` — do not generate a new image.

**Files:**
- Modify: `src/lib/components/SeoAlternates.svelte` (entire file)

- [ ] **Step 1: Replace the file content**

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { stripLangPrefix } from '$lib/i18n';

	let {
		title = '',
		description = '',
		image = '/brand-kit/png/social-card-1200x630.png',
	}: { title?: string; description?: string; image?: string } = $props();

	// $page.url keeps the original /en prefix (reroute only changes matching).
	// Cast: SvelteKit types pathname as the known-routes union, which never
	// includes /en because reroute strips it before matching.
	const pathname = $derived($page.url.pathname as string);
	const base = $derived(stripLangPrefix(pathname));
	const isEn = $derived(pathname === '/en' || pathname.startsWith('/en/'));
	const idUrl = $derived($page.url.origin + base);
	const enUrl = $derived($page.url.origin + (base === '/' ? '/en' : `/en${base}`));
	const pageUrl = $derived(isEn ? enUrl : idUrl);
	const imageUrl = $derived(image.startsWith('http') ? image : $page.url.origin + image);
</script>

<svelte:head>
	<!-- Each language version is its own canonical (alternates, not duplicates). -->
	<link rel="canonical" href={pageUrl} />
	<link rel="alternate" hreflang="id" href={idUrl} />
	<link rel="alternate" hreflang="en" href={enUrl} />
	<link rel="alternate" hreflang="x-default" href={idUrl} />
	{#if description}
		<meta name="description" content={description} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Mutawazin" />
		<meta property="og:title" content={title || 'Mutawazin'} />
		<meta property="og:description" content={description} />
		<meta property="og:url" content={pageUrl} />
		<meta property="og:image" content={imageUrl} />
		<meta property="og:locale" content={isEn ? 'en_US' : 'id_ID'} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={title || 'Mutawazin'} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:image" content={imageUrl} />
	{/if}
</svelte:head>
```

(Note: `canonical` previously used `isEn ? enUrl : idUrl` inline — `pageUrl` is the same value, no behavior change.)

- [ ] **Step 2: Check + commit**

Run: `npm run check` → 0 errors.

```bash
git add src/lib/components/SeoAlternates.svelte
git commit -m "feat: SeoAlternates emits description/OG/Twitter meta when props given"
```

### Task 10: Localized descriptions + wire the 7 public call sites

**Files:**
- Modify: `src/locales/en.json`, `src/locales/id.json` (new top-level `"seo"` section)
- Modify: `src/routes/+page.svelte:51,55`, `src/routes/teachers/+page.svelte:15,19`, `src/routes/teachers/[id]/+page.svelte:170`, `src/routes/login/+page.svelte:45`, `src/routes/register/teacher/+page.svelte:64`, `src/routes/register/student/+page.svelte:46`, `src/routes/forgot-password/+page.svelte:31`

- [ ] **Step 1: Add `seo` section to en.json** (top-level, alongside `"nav"`, `"landing"`, etc.):

```json
	"seo": {
		"landing": "Mutawazin connects students with verified teachers for group courses and personalized 1-on-1 sessions.",
		"teachers": "Browse Mutawazin's featured, verified private tutors and find the right teacher for you.",
		"teacherProfile": "View {name}'s teaching profile, subjects, and experience on Mutawazin.",
		"login": "Log in to your Mutawazin account to manage courses, sessions, and reports.",
		"registerTeacher": "Join Mutawazin as a teacher and teach group courses and 1-on-1 sessions.",
		"registerStudent": "Create a Mutawazin student account to join courses and book private tutoring.",
		"forgotPassword": "Reset your Mutawazin account password."
	}
```

- [ ] **Step 2: Add `seo` section to id.json**:

```json
	"seo": {
		"landing": "Mutawazin menghubungkan murid dengan guru terverifikasi untuk kursus kelompok dan sesi privat 1-on-1.",
		"teachers": "Jelajahi guru privat unggulan dan terverifikasi Mutawazin, temukan guru yang tepat untuk Anda.",
		"teacherProfile": "Lihat profil mengajar, mata pelajaran, dan pengalaman {name} di Mutawazin.",
		"login": "Masuk ke akun Mutawazin Anda untuk mengelola kursus, sesi, dan laporan.",
		"registerTeacher": "Bergabunglah dengan Mutawazin sebagai guru untuk kursus kelompok dan sesi privat.",
		"registerStudent": "Buat akun murid Mutawazin untuk mengikuti kursus dan memesan les privat.",
		"forgotPassword": "Atur ulang kata sandi akun Mutawazin Anda."
	}
```

- [ ] **Step 3: Wire call sites** — replace each bare `<SeoAlternates />`:

`src/routes/+page.svelte` line 51 → `<SeoAlternates title="Mutawazin" description={$t('seo.landing')} />`, AND delete the now-duplicate inline tag at line ~55: `<meta name="description" content="Mutawazin connects students with verified teachers for group courses and personalized 1-on-1 sessions." />`

`src/routes/teachers/+page.svelte` line 15 → `<SeoAlternates description={$t('seo.teachers')} />`, AND delete the inline tag at line ~19: `<meta name="description" content="Browse featured Mutawazin teachers." />`

`src/routes/teachers/[id]/+page.svelte` line 170 →
```svelte
<SeoAlternates
	title="{profile?.full_name ?? 'Teacher'} — Mutawazin"
	description={profile?.bio || $t('seo.teacherProfile', { values: { name: profile?.full_name ?? '' } })}
/>
```

`src/routes/login/+page.svelte` line 45 → `<SeoAlternates description={$t('seo.login')} />`
`src/routes/register/teacher/+page.svelte` line 64 → `<SeoAlternates description={$t('seo.registerTeacher')} />`
`src/routes/register/student/+page.svelte` line 46 → `<SeoAlternates description={$t('seo.registerStudent')} />`
`src/routes/forgot-password/+page.svelte` line 31 → `<SeoAlternates description={$t('seo.forgotPassword')} />`

(`/report/share/[token]` keeps its `noindex` and gets NO SeoAlternates change.)

- [ ] **Step 4: Check + curl-verify**

Run: `npm run check` → 0 errors.
With dev server running:
`curl -s http://localhost:5173/ | grep -o 'og:locale" content="[^"]*"'` → `id_ID`
`curl -s http://localhost:5173/en | grep -o 'og:locale" content="[^"]*"'` → `en_US`
`curl -s http://localhost:5173/login | grep -c 'og:image'` → `1`
`curl -s http://localhost:5173/ | grep -c 'meta name="description"'` → `1` (no duplicate)

- [ ] **Step 5: Commit**

```bash
git add src/locales/en.json src/locales/id.json src/routes/+page.svelte src/routes/teachers/+page.svelte "src/routes/teachers/[id]/+page.svelte" src/routes/login/+page.svelte src/routes/register/teacher/+page.svelte src/routes/register/student/+page.svelte src/routes/forgot-password/+page.svelte
git commit -m "feat: localized meta descriptions + OG tags on all public pages"
```

### Task 11: robots.txt + sitemap.xml

**Files:**
- Create: `static/robots.txt`
- Create: `src/routes/sitemap.xml/+server.ts`

- [ ] **Step 1: Create `static/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Disallow: /calendar
Disallow: /courses
Disallow: /reports

Sitemap: https://mutawazinprivate.com/sitemap.xml
```

(`/report/share` stays crawlable — its pages carry `noindex`, which crawlers must be able to read.)

- [ ] **Step 2: Create `src/routes/sitemap.xml/+server.ts`**

```ts
import type { RequestHandler } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Public, indexable routes. ID = unprefixed, EN = /en prefix.
const PUBLIC_PATHS = ['/', '/teachers', '/login', '/register/teacher', '/register/student', '/forgot-password'];

export const GET: RequestHandler = async ({ url, fetch }) => {
	let teacherPaths: string[] = [];
	try {
		const res = await fetch(`${BASE}/teachers/featured`);
		if (res.ok) {
			const body = await res.json();
			const list = Array.isArray(body) ? body : (body?.data ?? []);
			teacherPaths = list.map((t: any) => `/teachers/${t.user_id ?? t.id}`);
		}
	} catch {
		// API down — sitemap is still valid with static paths only
	}

	const paths = [...PUBLIC_PATHS, ...teacherPaths];
	const entries = paths
		.flatMap((p) => [url.origin + p, url.origin + (p === '/' ? '/en' : `/en${p}`)])
		.map((loc) => `\t<url><loc>${loc}</loc></url>`)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
```

- [ ] **Step 3: Check + curl-verify**

Run: `npm run check` → 0 errors.
`curl -s http://localhost:5173/robots.txt | head -3` → starts with `User-agent: *`
`curl -s http://localhost:5173/sitemap.xml | head -5` → valid XML with `<urlset`; contains both `/teachers` and `/en/teachers`.

- [ ] **Step 4: Commit**

```bash
git add static/robots.txt src/routes/sitemap.xml/+server.ts
git commit -m "feat: robots.txt and sitemap.xml with both language variants"
```

### Task 12: Final verification sweep

- [ ] **Step 1:** `npm run check` → 0 errors. `npm run build` → succeeds.
- [ ] **Step 2:** Cold-cache incognito load (Slow 4G, cache disabled) of `/` → no flash/spinner/blank, no Google Fonts requests.
- [ ] **Step 3:** 360px spot-check: `/`, `/dashboard`, `/calendar`, `/reports`, `/admin/calendar` — no horizontal body scroll; calendar dots + day panel work.
- [ ] **Step 4:** Curl meta spot-checks from Tasks 10-11 all pass.
- [ ] **Step 5:** Report results to the user, including anything found-but-not-fixed. Do NOT push.
