# i18n Bug Fixes: Age Column Header & Calendar Teacher Filter

**Date:** 2026-05-25

## Overview

Two small i18n bugs in the admin area.

---

## Bug 1 — Admin Students: "Age" column header hardcoded

**File:** `src/routes/admin/students/+page.svelte` line 157

**Problem:** `<th>Age</th>` is hardcoded English — not translatable.

**Fix:**
1. Add `"age": "Age"` to the `common` object in `src/locales/en.json`
2. Add `"age": "Usia"` to the `common` object in `src/locales/id.json`
3. Replace the hardcoded `Age` with `{$t('common.age')}` in the template

---

## Bug 2 — Admin Calendar: teacher filter default option shows raw key

**File:** `src/routes/admin/calendar/+page.svelte` line 380–382

**Problem:** Both the `aria-label` and the default `<option value="">` use `$t('admin.filterByTeacher')`. That key path does not exist at the top level — the key lives at `dashboard.admin.filterByTeacher`. svelte-i18n falls back to rendering the key string literally.

**Fix:**
- `aria-label` → `$t('dashboard.admin.filterByTeacher')` (fix the path)
- `<option value="">` text → `$t('courses.allTeachers')` (reuse existing key; EN: "All teachers", ID: "Semua guru" — semantically correct for the default "show all" option)

No new keys needed for Bug 2.
