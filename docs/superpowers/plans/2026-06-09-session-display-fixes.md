# Session Display Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three session UI issues: raw ISO timestamp in teacher calendar modal, student chips missing in admin edit session modal, and private sessions allowing more than 1 student.

**Architecture:** All changes are frontend-only. Task 1 adds a utility function and updates the teacher calendar template. Task 2 is a one-line fix in admin calendar. Task 3 extends the StudentPicker component with a `max` prop and wires it in admin calendar.

**Tech Stack:** SvelteKit 5 runes + TypeScript + Tailwind v3 + svelte-i18n

---

## File Map

| File | Change |
|---|---|
| `mutawazin-tutor-web/src/lib/utils/date.ts` | Add `formatSessionWindow()` |
| `mutawazin-tutor-web/src/routes/calendar/+page.svelte` | Import + use `formatSessionWindow` in "When" cell |
| `mutawazin-tutor-web/src/routes/admin/calendar/+page.svelte` | Spread array fix in `openSession`; add `max` prop wiring; truncate on type switch |
| `mutawazin-tutor-web/src/lib/components/ui/StudentPicker.svelte` | Add `max?: number` prop; hide input when at limit |

---

### Task 1: Date format — teacher calendar session modal

**Files:**
- Modify: `mutawazin-tutor-web/src/lib/utils/date.ts`
- Modify: `mutawazin-tutor-web/src/routes/calendar/+page.svelte:5,598`

- [ ] **Step 1: Add `formatSessionWindow` to `date.ts`**

  In `src/lib/utils/date.ts`, append after the last function:

  ```ts
  export function formatSessionWindow(starts_at: string, ends_at: string, locale = 'en'): string {
    try {
      const startTime = starts_at.slice(11, 16);
      const endTime   = ends_at.slice(11, 16);
      const dateStr   = starts_at.slice(0, 10);
      const date = new Date(dateStr + 'T00:00:00Z');
      const formatted = date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
      });
      return `${startTime} – ${endTime} · ${formatted}`;
    } catch {
      return starts_at;
    }
  }
  ```

  This follows the same `locale === 'id' ? 'id-ID' : 'en-US'` and `try/catch` pattern as `formatDate()`. It extracts time via `.slice(11,16)` (same as admin calendar `openSession`) and uses `timeZone: 'UTC'` to avoid local-timezone date shifting.

  Output examples:
  - `id-ID`: `"09:05 – 10:00 · Senin, 9 Jun 2026"`
  - `en-US`: `"09:05 – 10:00 · Monday, Jun 9, 2026"`

- [ ] **Step 2: Update imports in teacher calendar**

  In `src/routes/calendar/+page.svelte`, change line 3 and line 5:

  ```svelte
  <!-- Before -->
  import { t } from 'svelte-i18n';
  import { calendarGrid, toISODate, formatMonth } from '$lib/utils/date';

  <!-- After -->
  import { t, locale } from 'svelte-i18n';
  import { calendarGrid, toISODate, formatMonth, formatSessionWindow } from '$lib/utils/date';
  ```

  `locale` is the svelte-i18n writable store; using `$locale` in the template auto-subscribes to it.

- [ ] **Step 3: Use `formatSessionWindow` in the "When" cell**

  In `src/routes/calendar/+page.svelte`, line 598, change:

  ```svelte
  <!-- Before -->
  <div><span class="text-text2">{$t('calendar.modal.when')}</span><br/><span class="font-medium tabular">{selectedSession.starts_at}</span></div>

  <!-- After -->
  <div><span class="text-text2">{$t('calendar.modal.when')}</span><br/><span class="font-medium tabular">{formatSessionWindow(selectedSession.starts_at, selectedSession.ends_at, $locale)}</span></div>
  ```

- [ ] **Step 4: Run type check**

  ```powershell
  cd mutawazin-tutor-web
  npm run check
  ```

  Expected: 0 errors, warnings pre-existing.

- [ ] **Step 5: Commit**

  ```powershell
  git add src/lib/utils/date.ts src/routes/calendar/+page.svelte
  git commit -m "feat: format session time range in teacher calendar modal"
  ```

---

### Task 2: Fix edit session — student chips not showing

**Files:**
- Modify: `mutawazin-tutor-web/src/routes/admin/calendar/+page.svelte:116`

- [ ] **Step 1: Spread array in `openSession`**

  In `src/routes/admin/calendar/+page.svelte`, in the `openSession` function (~line 116), change:

  ```svelte
  // Before
  eStudentIds = session.student_ids ?? [];

  // After
  eStudentIds = [...(session.student_ids ?? [])];
  ```

  Assigning the raw API array directly to a Svelte 5 `$state` variable may not trigger reactivity if the reference is not treated as new. Spreading into a fresh array guarantees a distinct reference so the `StudentPicker`'s `$derived(selected)` recomputes.

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors, warnings pre-existing.

- [ ] **Step 3: Commit**

  ```powershell
  git add src/routes/admin/calendar/+page.svelte
  git commit -m "fix: spread student_ids into new array in openSession to trigger reactivity"
  ```

---

### Task 3: Private session — max 1 student

**Files:**
- Modify: `mutawazin-tutor-web/src/lib/components/ui/StudentPicker.svelte`
- Modify: `mutawazin-tutor-web/src/routes/admin/calendar/+page.svelte`

- [ ] **Step 1: Add `max` prop to StudentPicker**

  In `src/lib/components/ui/StudentPicker.svelte`, update the `$props()` destructuring (lines 6–12):

  ```svelte
  <!-- Before -->
  let {
    students,
    value = $bindable([]),
  }: {
    students: Student[];
    value: string[];
  } = $props();

  <!-- After -->
  let {
    students,
    value = $bindable([]),
    max,
  }: {
    students: Student[];
    value: string[];
    max?: number;
  } = $props();
  ```

- [ ] **Step 2: Conditionally hide the search input when at limit**

  In `src/lib/components/ui/StudentPicker.svelte`, replace the `<input>` block (lines 52–59):

  ```svelte
  <!-- Before -->
  <input
    type="text"
    bind:value={query}
    oninput={() => { open = query.length > 0; }}
    onblur={() => { setTimeout(() => { open = false; }, 150); }}
    placeholder="Type name to search..."
    class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
  />

  <!-- After -->
  {#if max === undefined || value.length < max}
    <input
      type="text"
      bind:value={query}
      oninput={() => { open = query.length > 0; }}
      onblur={() => { setTimeout(() => { open = false; }, 150); }}
      placeholder="Type name to search..."
      class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
    />
  {:else}
    <p class="text-xs text-text2 py-1">Private session — 1 student only</p>
  {/if}
  ```

  When `value.length >= max` the input hides and a note appears. Clicking × on the existing chip removes the student, `value.length` drops below `max`, and the input reappears automatically.

- [ ] **Step 3: Wire `max` in the Edit Session modal**

  In `src/routes/admin/calendar/+page.svelte`, update the Edit Session StudentPicker (~lines 571–575):

  ```svelte
  <!-- Before -->
  <StudentPicker
  	students={adminStudents.map((s: any) => ({ id: s.user_id ?? s.id, full_name: s.full_name, username: s.username }))}
  	bind:value={eStudentIds}
  />

  <!-- After -->
  <StudentPicker
  	students={adminStudents.map((s: any) => ({ id: s.user_id ?? s.id, full_name: s.full_name, username: s.username }))}
  	bind:value={eStudentIds}
  	max={selectedSession?.type === 'private' ? 1 : undefined}
  />
  ```

  `selectedSession` is set in `openSession` before `editOpen = true`, so `selectedSession?.type` is always correct when the component renders.

- [ ] **Step 4: Wire `max` and truncation in the Add Session modal**

  In `src/routes/admin/calendar/+page.svelte`, update the Add Session StudentPicker (~lines 650–654):

  ```svelte
  <!-- Before -->
  <StudentPicker
  	students={adminStudents.map((s: any) => ({ id: s.user_id ?? s.id, full_name: s.full_name, username: s.username }))}
  	bind:value={sStudentIds}
  />

  <!-- After -->
  <StudentPicker
  	students={adminStudents.map((s: any) => ({ id: s.user_id ?? s.id, full_name: s.full_name, username: s.username }))}
  	bind:value={sStudentIds}
  	max={sType === 'private' ? 1 : undefined}
  />
  ```

  Also add `oninput` to the private radio button to truncate excess selections immediately when the user switches type. Find the `name="sType"` radio input (~line 630) and add `oninput`:

  ```svelte
  <!-- Before -->
  <input type="radio" name="sType" value={val} bind:group={sType} class="sr-only" />

  <!-- After -->
  <input type="radio" name="sType" value={val} bind:group={sType} class="sr-only"
    oninput={() => { if (val === 'private') sStudentIds = sStudentIds.slice(0, 1); }} />
  ```

  `val` is the loop variable (`'group'` or `'private'`). The truncation only fires for the private radio, so switching group→private drops any extra students immediately before the `max` prop takes effect.

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors, warnings pre-existing.

- [ ] **Step 6: Commit**

  ```powershell
  git add src/lib/components/ui/StudentPicker.svelte src/routes/admin/calendar/+page.svelte
  git commit -m "feat: limit private sessions to 1 student in StudentPicker"
  ```
