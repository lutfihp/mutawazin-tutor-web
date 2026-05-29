# UI Polish — Badges & Text Contrast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three targeted visual fixes — remove attendance badge from report list, add "years old" to student age pill, darken age category text on teacher profile course cards.

**Architecture:** All three are single-line template edits in existing Svelte components. No new components, no data changes, no logic changes. Each task is independent.

**Tech Stack:** SvelteKit, Svelte 5 runes, Tailwind v3, svelte-i18n

---

### Task 1: Remove attendance badge from report card header

**Files:**
- Modify: `src/routes/reports/[studentId]/+page.svelte`

The report card header currently renders an attendance badge alongside the session title. We are removing it entirely — attendance info is already accessible via the filter dropdown.

- [ ] **Step 1: Remove the badge element**

In `src/routes/reports/[studentId]/+page.svelte`, find the report card header block (around line 200). Delete this line:

```svelte
<Badge variant={attendanceVariant(report.attendance)} label={report.attendance} />
```

The surrounding `<div class="flex items-center justify-between mb-3 flex-wrap gap-2">` and the `understanding_level` badge block stay untouched.

- [ ] **Step 2: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS` (same warning count as before).

- [ ] **Step 3: Commit**

```bash
git add src/routes/reports/[studentId]/+page.svelte
git commit -m "feat: remove attendance badge from report card header"
```

---

### Task 2: Add "years old" to student age badge

**Files:**
- Modify: `src/routes/students/[id]/+page.svelte`

The age badge currently shows a bare number (e.g. "12"). We change the label to include the unit so it reads "12 years old".

- [ ] **Step 1: Update the badge label**

In `src/routes/students/[id]/+page.svelte`, find:

```svelte
<Badge variant="violet" label={String(profile.age)} />
```

Replace with:

```svelte
<Badge variant="violet" label={`${profile.age} years old`} />
```

- [ ] **Step 2: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/students/[id]/+page.svelte
git commit -m "feat: add 'years old' label to student age badge"
```

---

### Task 3: Darken age category text on teacher profile course cards

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

Age categories on course cards use `text-text3` (lightest muted tone). Changing to `text-text2` (standard secondary tone) makes them readable without competing with the course name.

- [ ] **Step 1: Update text color class**

In `src/routes/teachers/[id]/+page.svelte`, find (around line 450):

```svelte
<p class="text-xs text-text3 mt-0.5">{(course.age_categories ?? []).join(' · ')}</p>
```

Replace with:

```svelte
<p class="text-xs text-text2 mt-0.5">{(course.age_categories ?? []).join(' · ')}</p>
```

- [ ] **Step 2: Verify type check passes**

```bash
npm run check
```

Expected: `0 ERRORS`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/teachers/[id]/+page.svelte
git commit -m "feat: darken age category text on teacher profile course cards"
```
