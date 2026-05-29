# i18n Bug Fixes: Age Column & Calendar Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two untranslatable strings in the admin area — the "Age" column header in the students list and the raw-key fallback in the admin calendar teacher filter.

**Architecture:** Both fixes are pure i18n: add one new key to both locale files and update three template references to use correct key paths. No logic changes.

**Tech Stack:** SvelteKit (Svelte 5 runes), svelte-i18n (`$t()`), JSON locale files (`src/locales/en.json`, `src/locales/id.json`).

---

### Task 1: Add `common.age` i18n key

**Files:**
- Modify: `src/locales/en.json` (inside `"common"` object)
- Modify: `src/locales/id.json` (inside `"common"` object)

- [ ] **Step 1: Add key to `src/locales/en.json`**

Locate the `"common"` object (around line 152). After the `"tutor": "Tutor"` line (last entry), add:

```json
"tutor": "Tutor",
"age": "Age"
```

- [ ] **Step 2: Add key to `src/locales/id.json`**

Locate the `"common"` object. After the equivalent `"tutor"` line, add:

```json
"tutor": "Tutor",
"age": "Usia"
```

- [ ] **Step 3: Verify type-check passes**

```powershell
npm run check
```

Expected: 0 errors (same as baseline).

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/id.json
git commit -m "feat(i18n): add common.age key (EN: Age, ID: Usia)"
```

---

### Task 2: Use `common.age` in admin students column header

**Files:**
- Modify: `src/routes/admin/students/+page.svelte` (line 157)

- [ ] **Step 1: Replace hardcoded "Age" with `$t('common.age')`**

Find line 157:
```svelte
<th class="px-5 py-3 text-left hidden md:table-cell">Age</th>
```

Replace with:
```svelte
<th class="px-5 py-3 text-left hidden md:table-cell">{$t('common.age')}</th>
```

- [ ] **Step 2: Verify type-check passes**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`npm run dev`), log in as admin, open `/admin/students`. Switch lang to Indonesian (ID) — the Age column header should show "Usia". Switch back to EN — should show "Age".

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/students/+page.svelte
git commit -m "fix(admin/students): translate Age column header via common.age"
```

---

### Task 3: Fix admin calendar teacher filter key paths

**Files:**
- Modify: `src/routes/admin/calendar/+page.svelte` (lines 380–382)

- [ ] **Step 1: Fix `aria-label` and default option text**

Find the `<select>` block (around line 376–385):

```svelte
<select
    bind:value={filteredTeacherId}
    class="bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 min-w-[220px]"
    aria-label={$t('admin.filterByTeacher')}
>
    <option value="">{$t('admin.filterByTeacher')}</option>
```

Replace with:

```svelte
<select
    bind:value={filteredTeacherId}
    class="bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 min-w-[220px]"
    aria-label={$t('dashboard.admin.filterByTeacher')}
>
    <option value="">{$t('courses.allTeachers')}</option>
```

Changes:
- `aria-label`: `admin.filterByTeacher` → `dashboard.admin.filterByTeacher` (correct key path)
- `<option>` text: `admin.filterByTeacher` → `courses.allTeachers` (existing key; EN: "All teachers", ID: "Semua guru")

- [ ] **Step 2: Verify type-check passes**

```powershell
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manual smoke test**

Open `/admin/calendar`. The dropdown's default option should show "All teachers" (EN) or "Semua guru" (ID) — not `admin.filterByTeacher`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/calendar/+page.svelte
git commit -m "fix(admin/calendar): fix teacher filter key path and use courses.allTeachers for default option"
```
