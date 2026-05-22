# Teacher Profile Icon Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace emoji characters and `★` Unicode in the teacher profile page with proper inline SVGs from the design handoff.

**Architecture:** Five targeted string replacements in one file. No logic changes — purely visual. Task 1 handles the three section tile icons; Task 2 handles the two `★` star characters; Task 3 verifies and commits.

**Tech Stack:** Svelte 5, Tailwind v3. No new dependencies.

---

### Task 1: Replace section tile emoji with SVG icons

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (lines 217, 252, 303)

The three credential section header tiles currently use emoji as their inner content. Replace each with the inline SVG from the handoff. Also drop the `text-lg` class from each tile span — it was only needed to size the emoji and has no effect on the SVGs (which carry their own `width`/`height`).

- [ ] **Step 1: Replace University tile (line 217)**

  Replace:
  ```svelte
  <span class="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center text-lg flex-none" aria-hidden="true">🎓</span>
  ```

  With:
  ```svelte
  <span class="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-none" aria-hidden="true">
  	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  		<path d="M22 10v6M2 10l10-5 10 5-10 5z" />
  		<path d="M6 12v5c3 3 9 3 12 0v-5" />
  	</svg>
  </span>
  ```

- [ ] **Step 2: Replace Teaching Experience tile (line 252)**

  Replace:
  ```svelte
  <span class="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center text-lg flex-none" aria-hidden="true">💼</span>
  ```

  With:
  ```svelte
  <span class="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center flex-none" aria-hidden="true">
  	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  		<rect x="2" y="7" width="20" height="14" rx="2" />
  		<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  	</svg>
  </span>
  ```

- [ ] **Step 3: Replace Achievements tile (line 303)**

  Replace:
  ```svelte
  <span class="w-9 h-9 rounded-lg bg-gold-bg text-gold-text flex items-center justify-center text-lg flex-none" aria-hidden="true">⭐</span>
  ```

  With:
  ```svelte
  <span class="w-9 h-9 rounded-lg bg-gold-bg text-gold-text flex items-center justify-center flex-none" aria-hidden="true">
  	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  		<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  	</svg>
  </span>
  ```

  Note: Achievements uses `fill="currentColor"` with no stroke — it is a solid filled star, unlike the stroke-based icons above.

---

### Task 2: Replace `★` Unicode with inline SVG star

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte` (lines 147, 158)

The `★` character appears in the featured badge and the rating meta line. Replace both with a `12×12` filled SVG star that inherits the surrounding colour via `currentColor`.

- [ ] **Step 1: Replace `★` in featured badge (line 147)**

  Replace:
  ```svelte
  <Badge variant="gold">★ {$t('status.featured')}</Badge>
  ```

  With:
  ```svelte
  <Badge variant="gold">
  	<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
  	{$t('status.featured')}
  </Badge>
  ```

  The `Badge` component uses `inline-flex items-center gap-1`, so the SVG and text align automatically — no extra alignment class needed on the SVG.

- [ ] **Step 2: Replace `★` in rating meta line (line 158)**

  Replace:
  ```svelte
  			· ★ {$t('profile.teacher.rating', { values: { rating: (profile.average_rating ?? 0).toFixed(1), count: profile.total_ratings } })}
  ```

  With:
  ```svelte
  			· <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="inline-block align-middle" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
  			{$t('profile.teacher.rating', { values: { rating: (profile.average_rating ?? 0).toFixed(1), count: profile.total_ratings } })}
  ```

  This is inside a `<p>` element (inline context), so `inline-block align-middle` keeps the star vertically centred with the surrounding text.

---

### Task 3: Type-check and commit

**Files:**
- No new edits — verification only.

- [ ] **Step 1: Run type check**

  ```bash
  npm run check
  ```

  Expected: 0 errors (same pre-existing 10 warnings as before). If you see errors, check the SVG elements aren't missing closing tags.

- [ ] **Step 2: Commit**

  ```bash
  git add "src/routes/teachers/[id]/+page.svelte"
  git commit -m "feat: replace emoji and unicode star with SVG icons in teacher profile"
  ```
