# i18n Display Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing i18n translations for work experience placeholder, teaching mode/city direction text, mode display labels, and course age category short-form IDs — plus fix two components that display raw un-translated age category strings.

**Architecture:** Pure frontend changes — JSON locale files + one new TypeScript utility + three Svelte component edits. No backend changes. The shared `ageCategories.ts` utility is the only new file; everything else is an edit.

**Tech Stack:** SvelteKit (Svelte 5 runes), svelte-i18n (`$t()`), TypeScript, Tailwind v3.

**Spec:** `docs/superpowers/specs/2026-06-08-i18n-display-updates-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/lib/utils/ageCategories.ts` | **Create** | Shared AGE_KEYS map (API string → i18n key) |
| `src/locales/en.json` | **Modify** | Add 2 keys, update 4 keys |
| `src/locales/id.json` | **Modify** | Add 2 keys, update 7 keys |
| `src/routes/teachers/[id]/+page.svelte` | **Modify** | Wire experience placeholder; add helper text; fix course card age display; import AGE_KEYS |
| `src/routes/courses/+page.svelte` | **Modify** | Fix course card age badge (raw string → translated); import AGE_KEYS |
| `src/routes/courses/[id]/+page.svelte` | **Modify** | Replace inline AGE_KEYS definition with shared import |

---

## Task 1: Create shared AGE_KEYS utility

**Files:**
- Create: `src/lib/utils/ageCategories.ts`

- [ ] **Step 1: Create the file**

`src/lib/utils/ageCategories.ts`:
```ts
export const AGE_KEYS: Record<string, string> = {
	'pre-school':    'courses.agePreSchool',
	'elementary':    'courses.ageElementary',
	'middle-school': 'courses.ageMiddleSchool',
	'high-school':   'courses.ageHighSchool',
	'general':       'courses.ageGeneral',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils/ageCategories.ts
git commit -m "feat: add shared AGE_KEYS utility for age category i18n"
```

---

## Task 2: Update en.json

**Files:**
- Modify: `src/locales/en.json`

Six changes inside the `profile.teacher` object and one inside `courses`.

- [ ] **Step 1: Update cityPlaceholder**

In `src/locales/en.json`, find line:
```json
"cityPlaceholder": "e.g. Amman",
```
Change to:
```json
"cityPlaceholder": "e.g. Jakarta",
```

- [ ] **Step 2: Update modeOnline, modeOffline, modeBoth**

Find:
```json
"modeOnline": "Online",
"modeOffline": "Offline",
"modeBoth": "Both",
```
Change to:
```json
"modeOnline": "Online Session",
"modeOffline": "Offline Session",
"modeBoth": "Online and Offline Session",
```

- [ ] **Step 3: Add experienceSubjectPlaceholder and teachingInfoHelper**

Inside the `profile.teacher` object, after the `"addExperience"` key, add:
```json
"experienceSubjectPlaceholder": "e.g. Teaching Mathematics at ABC Private",
"teachingInfoHelper": "Your teaching preference and city are shown on your public profile",
```

The surrounding context should look like:
```json
"experience": "Teaching experience",
"addExperience": "+ Add",
"experienceSubjectPlaceholder": "e.g. Teaching Mathematics at ABC Private",
"teachingInfoHelper": "Your teaching preference and city are shown on your public profile",
"experiencePresent": "Present",
```

- [ ] **Step 4: Verify JSON is valid**

```bash
node -e "require('./src/locales/en.json'); console.log('OK')"
```
Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/locales/en.json
git commit -m "feat: update en.json — mode labels, city placeholder, experience + helper keys"
```

---

## Task 3: Update id.json

**Files:**
- Modify: `src/locales/id.json`

Nine changes: six in `profile.teacher`, three in `courses`.

- [ ] **Step 1: Update cityPlaceholder**

In `src/locales/id.json`, find:
```json
"cityPlaceholder": "mis. Jakarta",
```
Change to:
```json
"cityPlaceholder": "cth. Jakarta",
```

- [ ] **Step 2: Update modeOnline, modeOffline, modeBoth**

Find:
```json
"modeOnline": "Online",
"modeOffline": "Offline",
"modeBoth": "Keduanya",
```
Change to:
```json
"modeOnline": "Sesi Online",
"modeOffline": "Sesi Offline",
"modeBoth": "Sesi Online dan Offline",
```

- [ ] **Step 3: Add experienceSubjectPlaceholder and teachingInfoHelper**

Inside `profile.teacher`, after `"addExperience"`, add:
```json
"experienceSubjectPlaceholder": "Mengajar Matematika di Lembaga Privat ABC",
"teachingInfoHelper": "Preferensi mengajar dan kota Anda ditampilkan di profil publik Anda",
```

The surrounding context:
```json
"experience": "Pengalaman mengajar",
"addExperience": "+ Tambah",
"experienceSubjectPlaceholder": "Mengajar Matematika di Lembaga Privat ABC",
"teachingInfoHelper": "Preferensi mengajar dan kota Anda ditampilkan di profil publik Anda",
"experiencePresent": "Sekarang",
```

- [ ] **Step 4: Update age category short forms**

Find:
```json
"ageElementary": "Sekolah Dasar",
"ageMiddleSchool": "Sekolah Menengah Pertama",
"ageHighSchool": "Sekolah Menengah Atas",
```
Change to:
```json
"ageElementary": "SD",
"ageMiddleSchool": "SMP",
"ageHighSchool": "SMA",
```

- [ ] **Step 5: Verify JSON is valid**

```bash
node -e "require('./src/locales/id.json'); console.log('OK')"
```
Expected output: `OK`

- [ ] **Step 6: Commit**

```bash
git add src/locales/id.json
git commit -m "feat: update id.json — mode labels, cth. placeholder, SD/SMP/SMA age categories, experience + helper keys"
```

---

## Task 4: Update teachers/[id]/+page.svelte

Three targeted edits in this file: wire the experience placeholder, fix the course card age display, and add the teaching info helper text.

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

- [ ] **Step 1: Import AGE_KEYS**

At the top of the `<script>` block (around line 3, after the existing imports), add:
```svelte
import { AGE_KEYS } from '$lib/utils/ageCategories';
```

The import section should look like:
```svelte
<script lang="ts">
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import { AGE_KEYS } from '$lib/utils/ageCategories';
```

- [ ] **Step 2: Wire experience subject placeholder**

Find line ~418 (the subject text input in the teaching experience edit form):
```svelte
<input type="text" bind:value={exp.subject} placeholder="e.g. Mathematics" aria-label="Subject"
```
Change to:
```svelte
<input type="text" bind:value={exp.subject} placeholder={$t('profile.teacher.experienceSubjectPlaceholder')} aria-label="Subject"
```

- [ ] **Step 3: Fix course card age display**

Find line ~548 (inside the `{#each profile.courses as course}` block):
```svelte
<p class="text-xs text-text2 mt-0.5">{(course.age_categories ?? []).join(' · ')}</p>
```
Change to:
```svelte
<p class="text-xs text-text2 mt-0.5">{(course.age_categories ?? []).map(cat => $t(AGE_KEYS[cat] ?? cat)).join(' · ')}</p>
```

- [ ] **Step 4: Add teaching info helper text**

Find lines ~242–264 — the `{#if editingTeachingInfo}` block. The block ends with `</div>` then `{/if}`. Add a `<p>` between the closing `</div>` and `{/if}`:

Before:
```svelte
			{#if editingTeachingInfo}
				<div class="flex flex-wrap gap-2 items-center">
					<select
						bind:value={teachingModeValue}
						class="bg-white border border-primary rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
					>
						<option value="online">{$t('profile.teacher.modeOnline')}</option>
						<option value="offline">{$t('profile.teacher.modeOffline')}</option>
						<option value="both">{$t('profile.teacher.modeBoth')}</option>
					</select>
					<input
						type="text"
						bind:value={cityValue}
						placeholder={$t('profile.teacher.cityPlaceholder')}
						class="bg-white border border-border rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"
					/>
					<Button variant="primary" size="sm" loading={savingTeachingInfo} onclick={saveTeachingInfo}>{$t('common.save')}</Button>
					<Button variant="ghost" size="sm" onclick={() => {
						editingTeachingInfo = false;
						teachingModeValue = profile?.teaching_mode ?? 'online';
						cityValue = profile?.city ?? '';
					}}>{$t('common.cancel')}</Button>
				</div>
			{/if}
```

After:
```svelte
			{#if editingTeachingInfo}
				<div class="flex flex-wrap gap-2 items-center">
					<select
						bind:value={teachingModeValue}
						class="bg-white border border-primary rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
					>
						<option value="online">{$t('profile.teacher.modeOnline')}</option>
						<option value="offline">{$t('profile.teacher.modeOffline')}</option>
						<option value="both">{$t('profile.teacher.modeBoth')}</option>
					</select>
					<input
						type="text"
						bind:value={cityValue}
						placeholder={$t('profile.teacher.cityPlaceholder')}
						class="bg-white border border-border rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15"
					/>
					<Button variant="primary" size="sm" loading={savingTeachingInfo} onclick={saveTeachingInfo}>{$t('common.save')}</Button>
					<Button variant="ghost" size="sm" onclick={() => {
						editingTeachingInfo = false;
						teachingModeValue = profile?.teaching_mode ?? 'online';
						cityValue = profile?.city ?? '';
					}}>{$t('common.cancel')}</Button>
				</div>
				<p class="text-xs text-text2 mt-1">{$t('profile.teacher.teachingInfoHelper')}</p>
			{/if}
```

- [ ] **Step 5: Run type check**

```bash
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web" && npm run check
```
Expected: 0 errors (16 pre-existing warnings are fine — do not fix them).

- [ ] **Step 6: Commit**

```bash
git add src/routes/teachers/[id]/+page.svelte
git commit -m "feat: i18n experience placeholder, translated course age tags, teaching info helper text"
```

---

## Task 5: Update courses/+page.svelte

Fix the course card age badge — currently renders raw API string (e.g. `"pre-school"`) instead of translated label.

**Files:**
- Modify: `src/routes/courses/+page.svelte`

- [ ] **Step 1: Import AGE_KEYS**

At the top of the `<script>` block (after the existing imports at line ~3), add:
```svelte
import { AGE_KEYS } from '$lib/utils/ageCategories';
```

- [ ] **Step 2: Fix age badge label**

Find lines ~307–310:
```svelte
<div class="flex flex-wrap gap-1.5">
	{#each (course.age_categories ?? []) as age}
		<Badge variant="violet" label={age} />
	{/each}
```
Change to:
```svelte
<div class="flex flex-wrap gap-1.5">
	{#each (course.age_categories ?? []) as age}
		<Badge variant="violet" label={$t(AGE_KEYS[age] ?? age)} />
	{/each}
```

- [ ] **Step 3: Run type check**

```bash
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web" && npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/courses/+page.svelte
git commit -m "feat: translate age category badges in courses browse page"
```

---

## Task 6: Update courses/[id]/+page.svelte

Replace the inline AGE_KEYS definition (lines 27–33) with the shared import.

**Files:**
- Modify: `src/routes/courses/[id]/+page.svelte`

- [ ] **Step 1: Add import**

After the existing imports at the top of the `<script>` block, add:
```svelte
import { AGE_KEYS } from '$lib/utils/ageCategories';
```

- [ ] **Step 2: Remove inline AGE_KEYS definition**

Delete lines 27–33 (the entire inline object):
```ts
const AGE_KEYS: Record<string, string> = {
	'pre-school':    'courses.agePreSchool',
	'elementary':    'courses.ageElementary',
	'middle-school': 'courses.ageMiddleSchool',
	'high-school':   'courses.ageHighSchool',
	'general':       'courses.ageGeneral',
};
```

The usage at line ~133 (`$t(AGE_KEYS[cat] ?? cat)`) stays unchanged — it will now use the imported value.

- [ ] **Step 3: Run type check**

```bash
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web" && npm run check
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/courses/[id]/+page.svelte
git commit -m "refactor: replace inline AGE_KEYS with shared import in course detail page"
```

---

## Task 7: Manual verification

No automated tests cover i18n rendering — verify visually with the dev server.

- [ ] **Step 1: Start dev server**

```bash
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web" && npm run dev
```

- [ ] **Step 2: Check teaching experience placeholder (Item 1)**

1. Log in as a teacher → open own profile
2. Click pencil on "Teaching experience" → click "+ Add"
3. Confirm the subject input shows:
   - EN: `"e.g. Teaching Mathematics at ABC Private"` as placeholder
   - ID: `"Mengajar Matematika di Lembaga Privat ABC"` as placeholder

- [ ] **Step 3: Check teaching mode/city direction (Item 2)**

1. On own teacher profile, click pencil on the mode/city chips row
2. Confirm:
   - City input placeholder shows `"e.g. Jakarta"` (EN) / `"cth. Jakarta"` (ID)
   - Helper text appears below Save/Cancel: `"Your teaching preference and city are shown on your public profile"` (EN) / `"Preferensi mengajar dan kota Anda ditampilkan di profil publik Anda"` (ID)

- [ ] **Step 4: Check teaching mode labels (Item 3)**

1. Still on the mode edit form: confirm the `<select>` options show `"Online Session"` / `"Offline Session"` / `"Online and Offline Session"` (EN) or `"Sesi Online"` / `"Sesi Offline"` / `"Sesi Online dan Offline"` (ID)
2. Save a mode → confirm the display badge also shows the new label (e.g. `"Sesi Online"`)

- [ ] **Step 5: Check age category translations (Item 4)**

1. Switch language to ID (toggle in navbar)
2. Open `/courses` — confirm course cards show `"SD"`, `"SMP"`, `"SMA"`, `"Pra-sekolah"`, `"Umum"` in the badges (not `"Sekolah Dasar"` etc. or raw API strings like `"elementary"`)
3. Open a teacher profile with courses — confirm course cards under "Current Courses" show the translated short forms
4. Open a course detail page (`/courses/:id`) — confirm the pricing table rows show the same short forms
