# Teacher Profile — Chips Row Visual Fix

**Date:** 2026-05-23
**File:** `src/routes/teachers/[id]/+page.svelte`

## Goal

Align the profile header chips row with the handoff visual language:
1. Replace emoji icons with inline SVGs (handoff style: `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`)
2. Remove teaching methods badges (not in the handoff)

## Changes

### 1. Remove `modeIcon` derived state

Delete lines 44–47:
```svelte
const modeIcon = $derived(
  profile?.teaching_mode === 'offline' ? '🔴' :
  profile?.teaching_mode === 'both' ? '🔄' : '🌐'
);
```
`modeLabel` stays unchanged.

### 2. Update chips row guard condition

Old:
```svelte
{#if profile.teaching_mode || profile.city || (profile.teaching_methods ?? []).length > 0}
```
New:
```svelte
{#if profile.teaching_mode || profile.city}
```

### 3. Replace mode badge

Old:
```svelte
<Badge variant="active">{modeIcon} {modeLabel}</Badge>
```
New — globe SVG, `opacity-50` on the icon when offline:
```svelte
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
```

Icon semantics:
- `online` → globe, full opacity
- `both` → globe, full opacity (label differentiates)
- `offline` → globe, `opacity-50` (signals "no online")

### 4. Replace city badge

Old:
```svelte
<Badge variant="teal">📍 {profile.city}</Badge>
```
New — map-pin SVG:
```svelte
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
```

### 5. Remove teaching methods

Delete the entire block:
```svelte
{#each (profile.teaching_methods ?? []) as method}
  <Badge variant="violet" label={method} />
{/each}
```

## What does NOT change

- `modeLabel` derived state — kept as-is
- The `<hr>` divider and chips row flex container
- Badge variants (`active` for mode, `teal` for city)
- All other profile sections (About, University, Experience, Achievements, Courses)
