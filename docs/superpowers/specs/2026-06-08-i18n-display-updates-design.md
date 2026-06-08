# i18n Display Updates — Design Spec
**Date:** 2026-06-08

## Overview

Four targeted translation and display improvements:
1. Work experience subject field placeholder (i18n)
2. Teaching mode + city direction text
3. Teaching mode display labels (EN + ID)
4. Course age category short-form translations + shared AGE_KEYS utility

---

## 1. Work Experience Subject Placeholder

**Problem:** The subject input in the teaching experience edit form uses a hardcoded English placeholder (`"e.g. Mathematics"`).

**Fix:** Add a new i18n key and wire the input to it.

### New i18n key

| Key | EN | ID |
|---|---|---|
| `profile.teacher.experienceSubjectPlaceholder` | `"e.g. Teaching Mathematics at ABC Private"` | `"Mengajar Matematika di Lembaga Privat ABC"` |

### Component change

File: `src/routes/teachers/[id]/+page.svelte` (experience form, subject input)

```svelte
<!-- Before -->
<input type="text" bind:value={exp.subject} placeholder="e.g. Mathematics" ... />

<!-- After -->
<input type="text" bind:value={exp.subject} placeholder={$t('profile.teacher.experienceSubjectPlaceholder')} ... />
```

---

## 2. Teaching Mode + City Direction Text

**Problem:** The inline teaching info edit form (mode select + city input) has no guidance.

**Fixes:**
- Update `cityPlaceholder` to a simple localized example (no offline-specific hint)
- Add a new helper text key rendered below the Save/Cancel buttons

### Updated i18n key

| Key | EN | ID |
|---|---|---|
| `profile.teacher.cityPlaceholder` | `"e.g. Jakarta"` | `"cth. Jakarta"` |

### New i18n key

| Key | EN | ID |
|---|---|---|
| `profile.teacher.teachingInfoHelper` | `"Your teaching preference and city are shown on your public profile"` | `"Preferensi mengajar dan kota Anda ditampilkan di profil publik Anda"` |

### Component change

File: `src/routes/teachers/[id]/+page.svelte` (teaching info edit block)

Add a `<p class="text-xs text-text2 w-full">` line after the Save/Cancel buttons inside the `{#if editingTeachingInfo}` block.

---

## 3. Teaching Mode Display Labels

**Problem:** Mode labels ("Online", "Offline", "Keduanya/Both") are too terse — they don't communicate that this is about session type.

**Fix:** Update existing `profile.teacher.modeOnline/modeOffline/modeBoth` keys. These keys power both the display badge and the edit form select options — both contexts read naturally with the longer form.

### Updated i18n keys

| Key | EN (before → after) | ID (before → after) |
|---|---|---|
| `profile.teacher.modeOnline` | `"Online"` → `"Online Session"` | `"Online"` → `"Sesi Online"` |
| `profile.teacher.modeOffline` | `"Offline"` → `"Offline Session"` | `"Offline"` → `"Sesi Offline"` |
| `profile.teacher.modeBoth` | `"Both"` → `"Online and Offline Session"` | `"Keduanya"` → `"Sesi Online dan Offline"` |

**Not affected:** `calendar.modal.modeOnline` / `calendar.modal.modeOffline` — these are separate keys for session mode in the calendar and stay as short-form "Online" / "Offline".

---

## 4. Age Category Translations + Shared Utility

### Problem

Two issues:
1. Bahasa translations for age categories use long official names ("Sekolah Dasar", "Sekolah Menengah Pertama", "Sekolah Menengah Atas") — short abbreviations (SD, SMP, SMA) are more natural.
2. Teacher profile course cards and courses browse page cards display raw API strings (`pre-school · elementary`) instead of translated labels — AGE_KEYS mapping is only defined inline in `courses/[id]/+page.svelte`.

### Updated Bahasa translations (`id.json`)

| Key | Before | After |
|---|---|---|
| `courses.agePreSchool` | `"Pra-sekolah"` | `"Pra-sekolah"` *(unchanged)* |
| `courses.ageElementary` | `"Sekolah Dasar"` | `"SD"` |
| `courses.ageMiddleSchool` | `"Sekolah Menengah Pertama"` | `"SMP"` |
| `courses.ageHighSchool` | `"Sekolah Menengah Atas"` | `"SMA"` |
| `courses.ageGeneral` | `"Umum"` | `"Umum"` *(unchanged)* |

English equivalents (`en.json`) are unchanged: Pre-school / Elementary / Middle School / High School / General.

### New shared utility

File: `src/lib/utils/ageCategories.ts`

```ts
export const AGE_KEYS: Record<string, string> = {
  'pre-school':    'courses.agePreSchool',
  'elementary':    'courses.ageElementary',
  'middle-school': 'courses.ageMiddleSchool',
  'high-school':   'courses.ageHighSchool',
  'general':       'courses.ageGeneral',
};
```

### Component fixes

**`src/routes/teachers/[id]/+page.svelte`** — course cards section:
```svelte
<!-- Before -->
{(course.age_categories ?? []).join(' · ')}

<!-- After (import AGE_KEYS + $t from svelte-i18n) -->
{(course.age_categories ?? []).map(cat => $t(AGE_KEYS[cat] ?? cat)).join(' · ')}
```

**`src/routes/courses/+page.svelte`** — course grid cards:
Same pattern — import `AGE_KEYS`, map raw strings through `$t(AGE_KEYS[cat] ?? cat)`.

**`src/routes/courses/[id]/+page.svelte`** — already uses inline `AGE_KEYS`:
Replace inline definition with import from `$lib/utils/ageCategories`.

---

## Files Changed

| File | Change type |
|---|---|
| `src/locales/en.json` | Add `experienceSubjectPlaceholder`, `teachingInfoHelper`; update `modeOnline/modeOffline/modeBoth`; update `cityPlaceholder` |
| `src/locales/id.json` | Same keys; update `ageElementary/ageMiddleSchool/ageHighSchool` to short form |
| `src/lib/utils/ageCategories.ts` | New file — shared AGE_KEYS map |
| `src/routes/teachers/[id]/+page.svelte` | Wire experience placeholder; add helper text; fix course card age display |
| `src/routes/courses/+page.svelte` | Fix course card age display |
| `src/routes/courses/[id]/+page.svelte` | Replace inline AGE_KEYS with shared import |

---

## Out of Scope

- `calendar.modal.modeOnline` / `modeOffline` — not changed (short form correct for session mode selector)
- All other existing `"mis."` occurrences in `id.json` — not changed (only Item 2 keys updated to `"cth."`)
- English age category labels — not changed
