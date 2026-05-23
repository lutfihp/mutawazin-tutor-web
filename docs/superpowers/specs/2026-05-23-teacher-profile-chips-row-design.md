# Teacher Profile — Chips Row Visual Fix + Inline Edit

**Date:** 2026-05-23
**File:** `src/routes/teachers/[id]/+page.svelte`

## Goal

1. Replace emoji icons with inline SVGs (handoff style: `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`)
2. Remove teaching methods badges (not in the handoff)
3. Make teaching mode and city editable in edit view (own profile), following the existing per-section pencil pattern

---

## Script changes (`<script lang="ts">`)

### 1. Remove `modeIcon` derived state

Delete:
```svelte
const modeIcon = $derived(
  profile?.teaching_mode === 'offline' ? '🔴' :
  profile?.teaching_mode === 'both' ? '🔄' : '🌐'
);
```
`modeLabel` stays unchanged.

### 2. Add teaching-info edit state

```svelte
// ── Teaching Info (mode + city)
let editingTeachingInfo = $state(false);
let teachingModeValue = $state<string>(profile?.teaching_mode ?? 'online');
let cityValue = $state(profile?.city ?? '');
let savingTeachingInfo = $state(false);
```

### 3. Extend `openSection` to include `'teachingInfo'`

```svelte
function openSection(name: 'bio' | 'university' | 'experience' | 'achievements' | 'teachingInfo') {
  editingBio = name === 'bio';
  editingUniversity = name === 'university';
  editingExperience = name === 'experience';
  editingAchievements = name === 'achievements';
  editingTeachingInfo = name === 'teachingInfo';
}
```

### 4. Add `saveTeachingInfo` function

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

---

## Template changes

### 5. Chips row guard — show when `isOwn` even if both are empty

Old:
```svelte
{#if profile.teaching_mode || profile.city || (profile.teaching_methods ?? []).length > 0}
```
New:
```svelte
{#if profile.teaching_mode || profile.city || isOwn}
```

### 6. Chips row — full replacement

Replace the existing chips row `<div class="flex flex-wrap gap-2">` block (and its `<hr>`) with:

```svelte
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
    {#if isOwn && !editingTeachingInfo}
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
```

Globe icon semantics:
- `online` → full opacity (connected)
- `both` → full opacity (label differentiates)
- `offline` → `opacity-50` (signals no online component)

### 7. Remove teaching methods block

Delete:
```svelte
{#each (profile.teaching_methods ?? []) as method}
  <Badge variant="violet" label={method} />
{/each}
```

---

## i18n keys needed

Add to `src/locales/en.json` and `src/locales/id.json`:

| Key | EN value |
|---|---|
| `profile.teacher.cityPlaceholder` | `"City"` |

(Mode keys `modeOnline`, `modeOffline`, `modeBoth` already exist.)

---

## API

`PUT /teachers/me` already accepts `teaching_mode` and `city` — no backend change needed.

---

## What does NOT change

- `modeLabel` derived state
- Badge variants (`active` for mode, `teal` for city)
- All other profile sections (About, University, Experience, Achievements, Courses)
- Public view rendering — pencil button is gated by `isOwn`
