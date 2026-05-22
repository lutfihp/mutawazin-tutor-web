# Teacher Profile Icon Fixes — Design Spec

**Date:** 2026-05-22
**File:** `src/routes/teachers/[id]/+page.svelte`
**Scope:** Two cosmetic changes — replace emoji in section icon tiles with handoff SVGs, and replace `★` Unicode with an inline SVG star.

---

## Change 1 — Section icon tiles: emoji → SVG

The three credential section headers currently use emoji characters (`🎓`, `💼`, `⭐`) inside a coloured tile `<span>`. Replace each with the inline SVG specified in `handoffs/design_handoff_mutawazin/profile-pages.jsx`. The tile wrapper (`<span class="w-9 h-9 rounded-lg ... flex items-center justify-center ... flex-none">`) is unchanged — only the inner content changes.

### University tile

Current inner content: `🎓`

Replace with:
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
  <path d="M6 12v5c3 3 9 3 12 0v-5" />
</svg>
```

Tile classes stay: `bg-primary-light text-primary`

### Teaching Experience tile

Current inner content: `💼`

Replace with:
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="2" y="7" width="20" height="14" rx="2" />
  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
</svg>
```

Tile classes stay: `bg-teal-light text-teal`

### Achievements tile

Current inner content: `⭐`

Replace with (filled star, `fill="currentColor"` — no stroke):
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
</svg>
```

Tile classes stay: `bg-gold-bg text-gold-text`

---

## Change 2 — Replace `★` Unicode with inline SVG star

The `★` character appears in two places in the same file. Both are replaced with a `12×12px` filled SVG star that inherits the surrounding text colour via `currentColor`.

**SVG to use (both places):**
```html
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="inline-block align-middle" aria-hidden="true">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
</svg>
```

### Location A — Rating meta line

Current:
```svelte
· ★ {$t('profile.teacher.rating', { values: { ... } })}
```

After:
```svelte
· <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="inline-block align-middle" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
{$t('profile.teacher.rating', { values: { ... } })}
```

### Location B — Featured badge

`Badge` accepts children via `{@render children()}` and already uses `inline-flex items-center gap-1`, so no alignment class is needed on the SVG.

Current:
```svelte
<Badge variant="gold">★ {$t('status.featured')}</Badge>
```

After:
```svelte
<Badge variant="gold">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
  {$t('status.featured')}
</Badge>
```

---

## Out of Scope

- Sidebar count badge removal (deferred)
- Any other pages referencing `★`
