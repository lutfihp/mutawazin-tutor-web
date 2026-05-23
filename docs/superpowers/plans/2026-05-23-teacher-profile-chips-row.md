# Teacher Profile Chips Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace emoji icons with SVGs, remove teaching methods badges, and add inline editing for teaching mode and city in the teacher profile header chips row.

**Architecture:** All changes are confined to a single file (`src/routes/teachers/[id]/+page.svelte`). Script changes add state and a save function following the existing per-section pencil pattern. Template changes replace the chips row block in-place. Two i18n locale files get one new key each.

**Tech Stack:** SvelteKit 5 (runes mode), Tailwind v3, svelte-i18n, TypeScript

---

## Files touched

| Action | Path |
|---|---|
| Modify | `src/routes/teachers/[id]/+page.svelte` |
| Modify | `src/locales/en.json` |
| Modify | `src/locales/id.json` |

---

### Task 1: Script — remove modeIcon, add teaching-info edit state + save function

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

- [ ] **Step 1: Remove modeIcon derived state**

  In the `<script lang="ts">` block, find and delete these four lines (currently around line 44):
  ```svelte
  const modeIcon = $derived(
    profile?.teaching_mode === 'offline' ? '🔴' :
    profile?.teaching_mode === 'both' ? '🔄' : '🌐'
  );
  ```
  `modeLabel` stays — do not touch it.

- [ ] **Step 2: Add teaching-info state variables**

  Directly after the `// ── Achievements` block (after `let savingAchievements = $state(false);`), insert:
  ```svelte
  // ── Teaching Info (mode + city)
  let editingTeachingInfo = $state(false);
  let teachingModeValue = $state<string>(profile?.teaching_mode ?? 'online');
  let cityValue = $state(profile?.city ?? '');
  let savingTeachingInfo = $state(false);
  ```

- [ ] **Step 3: Extend openSection to include 'teachingInfo'**

  Replace the current `openSection` function:
  ```svelte
  function openSection(name: 'bio' | 'university' | 'experience' | 'achievements') {
    editingBio = name === 'bio';
    editingUniversity = name === 'university';
    editingExperience = name === 'experience';
    editingAchievements = name === 'achievements';
  }
  ```
  With:
  ```svelte
  function openSection(name: 'bio' | 'university' | 'experience' | 'achievements' | 'teachingInfo') {
    editingBio = name === 'bio';
    editingUniversity = name === 'university';
    editingExperience = name === 'experience';
    editingAchievements = name === 'achievements';
    editingTeachingInfo = name === 'teachingInfo';
  }
  ```

- [ ] **Step 4: Add saveTeachingInfo function**

  After the `saveAchievements` function, add:
  ```svelte
  async function saveTeachingInfo() {
    savingTeachingInfo = true;
    try {
      await api.put('/teachers/me', {
        teaching_mode: teachingModeValue || undefined,
        city: cityValue || undefined,
      });
      editingTeachingInfo = false;
    } finally {
      savingTeachingInfo = false;
    }
  }
  ```

- [ ] **Step 5: Run type check**

  ```powershell
  npm run check
  ```
  Expected: 0 errors (same warning count as before — pre-existing warnings are fine).

- [ ] **Step 6: Commit**

  ```powershell
  git add src/routes/teachers/`[id`]/+page.svelte
  git commit -m "feat: add teaching-info edit state and save function to teacher profile"
  ```

---

### Task 2: i18n — add cityPlaceholder key

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add key to en.json**

  Open `src/locales/en.json`. Find the `profile.teacher` object. Add `cityPlaceholder` alongside the other profile.teacher keys:
  ```json
  "cityPlaceholder": "City"
  ```

- [ ] **Step 2: Add key to id.json**

  Open `src/locales/id.json`. Find the `profile.teacher` object. Add:
  ```json
  "cityPlaceholder": "Kota"
  ```

- [ ] **Step 3: Run type check**

  ```powershell
  npm run check
  ```
  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```powershell
  git add src/locales/en.json src/locales/id.json
  git commit -m "feat: add profile.teacher.cityPlaceholder i18n key"
  ```

---

### Task 3: Template — replace chips row block

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

This task replaces the entire `{#if profile.teaching_mode || profile.city ...}` block inside the profile header Card.

- [ ] **Step 1: Locate the block to replace**

  In the template, find this block (currently around line 165):
  ```svelte
  {#if profile.teaching_mode || profile.city || (profile.teaching_methods ?? []).length > 0}
    <hr class="border-border mt-3 mb-3" />
    <div class="flex flex-wrap gap-2">
      {#if profile.teaching_mode}
        <Badge variant="active">{modeIcon} {modeLabel}</Badge>
      {/if}
      {#if profile.city}
        <Badge variant="teal">📍 {profile.city}</Badge>
      {/if}
      {#each (profile.teaching_methods ?? []) as method}
        <Badge variant="violet" label={method} />
      {/each}
    </div>
  {/if}
  ```

- [ ] **Step 2: Replace the entire block**

  Replace everything from `{#if profile.teaching_mode || ...}` to its closing `{/if}` with:
  ```svelte
  {#if profile.teaching_mode || profile.city || isOwn}
    <hr class="border-border mt-3 mb-3" />
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
    {:else}
      <div class="flex flex-wrap gap-2 items-center">
        {#if profile.teaching_mode}
          <Badge variant="active">
            <svg
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="inline-block align-middle -mt-px{profile.teaching_mode === 'offline' ? ' opacity-50' : ''}"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {modeLabel}
          </Badge>
        {/if}
        {#if profile.city}
          <Badge variant="teal">
            <svg
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="inline-block align-middle -mt-px" aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {profile.city}
          </Badge>
        {/if}
        {#if isOwn}
          <button
            onclick={() => openSection('teachingInfo')}
            class="text-text2 hover:text-text transition-colors p-1"
            aria-label={$t('common.edit')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
            </svg>
          </button>
        {/if}
      </div>
    {/if}
  {/if}
  ```

- [ ] **Step 3: Run type check**

  ```powershell
  npm run check
  ```
  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```powershell
  git add src/routes/teachers/`[id`]/+page.svelte
  git commit -m "feat: replace emoji chips with SVG icons, add inline edit for mode + city, remove teaching methods"
  ```

---

### Task 4: Manual smoke test

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

  ```powershell
  npm run dev
  ```

- [ ] **Step 2: Test public view (no login)**

  Open `http://localhost:5173/teachers/<any-id>`.
  - Verify the chips row shows globe SVG + label for mode, map-pin SVG + city name
  - Offline mode: globe should appear at ~50% opacity
  - No emoji characters anywhere in the row
  - No teaching methods chips
  - No pencil button visible

- [ ] **Step 3: Test edit view (own profile)**

  Log in as a teacher, navigate to own profile (`/teachers/<own-id>`).
  - Chips row shows globe + city badges
  - A pencil button appears at the end of the chips row
  - Clicking pencil: mode `<select>` and city `<input>` replace the badges; other sections close
  - Changing mode and clicking Save: row returns to badge view with updated value
  - Clicking Cancel: values revert, row returns to badge view
  - Clicking pencil while another section (e.g. Bio) is in edit mode: Bio edit closes, teaching-info edit opens

- [ ] **Step 4: Test as admin**

  Log in as admin (`admin@mutawazin.com` / `changeme123`), navigate to any teacher profile.
  - No pencil button
  - Chips row renders badges with SVG icons only
