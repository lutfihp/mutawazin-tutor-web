# Content Cleanup + Hero Brand Mark

**Date:** 2026-05-17
**Status:** Approved

## Context

The content audit (`docs/content-audit.csv`) identified fake/placeholder data and dead links across the app. This spec covers only the items marked `remove` in the audit decision column, plus the hero replacement that results from those removals. Items marked `pre-mvp` or `post-mvp` are out of scope.

---

## What Changes

### 1. Copy brand kit assets to `static/`

**Source:** `brand_kit_handoff/brand-kit/`
**Destination:** `static/brand-kit/`

Copies the full folder so all assets are served as static files:
- `/brand-kit/png/logo-mark-1024.png` — used in the hero
- `/brand-kit/svg/mark-primary.svg` — available for future use
- All other PNG/SVG variants for favicon, OG, etc. (future)

---

### 2. `src/routes/+page.svelte`

**Remove — trust row** (in hero left column, below the CTA buttons):
```svelte
<div class="flex items-center gap-3">
  <div class="flex -space-x-2" aria-hidden="true">
    {#each ['#2563EB', '#0D9488', '#7C3AED', '#E11D48'] as color}
      <span ...></span>
    {/each}
  </div>
  <p class="text-[13px] text-text2">
    {$t('landing.trustedBy', { values: { ... } })}
  </p>
</div>
```

**Replace — hero right column** (the `hidden lg:block` vignette with 3 fake cards):
```svelte
<!-- Before: 3 absolutely-positioned fake cards -->
<div class="relative hidden lg:block" style="aspect-ratio: 5/4.4;" aria-hidden="true">
  <!-- Teacher card, Progress card, Session card, decorative dots -->
</div>

<!-- After: brand mark PNG -->
<div class="hidden lg:flex items-center justify-center">
  <img
    src="/brand-kit/png/logo-mark-1024.png"
    alt="Mutawazin"
    class="w-full max-w-sm drop-shadow-md"
  />
</div>
```

**Remove — footer Blog link** from the Company column links array:
```svelte
// Remove this entry:
['landing.footerBlog', '#']
```

---

### 3. `src/locales/en.json` — remove keys under `landing`

Remove these keys (and their values):
- `trustedStudents`
- `trustedTeachers`
- `trustedBy`
- `heroTeacherCard` (entire object)
- `heroProgressCard` (entire object)
- `heroSessionCard` (entire object)

Also remove the unused import reference to `avatarColor` from `+page.svelte` if no longer used after trust row removal.

---

### 4. `src/locales/id.json` — same keys removed

Mirror of the en.json changes — remove the same 6 key groups under `landing`.

---

## Out of Scope

The following `pre-mvp` items from the audit are **not changed** in this spec:
- Navbar `/#courses` anchor fix
- Footer `/teachers` route (needs API)
- Footer Contact/Privacy links
- Login "Forgot password?" link
- Dashboard welcome names (Layla, Nour)
- Teacher profile "Tutor" label
- "Write Report" quick action URL

---

## Verification

1. `npm run check` — 0 errors (no broken `$t()` references)
2. Open `http://localhost:5173` — hero right column shows brand mark PNG, no fake cards
3. Trust row is gone from hero left column
4. Footer Company column has no Blog link
5. Hero left column still has both CTAs (Join as Teacher, Join as Student)
