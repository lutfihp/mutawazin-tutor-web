# Navbar Login Button Mobile Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Login link in the public navbar visible on all screen sizes, not just ≥ 900px.

**Architecture:** Single class-string change in `Navbar.svelte` — remove the `hidden nav-collapse:` visibility guards from the Login `<a>` element so it renders as `inline-flex` at every breakpoint.

**Tech Stack:** SvelteKit, Tailwind CSS v3

---

### Task 1: Remove responsive hiding from Login link

**Files:**
- Modify: `src/lib/components/layout/Navbar.svelte:132`

- [ ] **Step 1: Open the file and locate the Login link**

In `src/lib/components/layout/Navbar.svelte`, find the `{:else}` branch of the `{#if $user}` block (around line 130–135). The Login `<a>` currently reads:

```svelte
<a href="/login" class="hidden nav-collapse:inline-flex items-center px-3 py-1.5 text-sm font-semibold text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">
    {$t('nav.login')}
</a>
```

- [ ] **Step 2: Remove `hidden nav-collapse:` from the class string**

Replace the class attribute so the link is always `inline-flex`:

```svelte
<a href="/login" class="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors">
    {$t('nav.login')}
</a>
```

- [ ] **Step 3: Verify the build passes**

```powershell
npm run check
```

Expected: 0 errors (14 pre-existing warnings are fine).

- [ ] **Step 4: Smoke-test in the browser**

```powershell
npm run dev
```

Open `http://localhost:5173` in DevTools. Toggle between:
- **375px (mobile):** Login link must be visible in the navbar to the right of the EN/ID switcher.
- **768px (tablet):** Login link must be visible.
- **1024px (desktop):** Login link must still be visible (no regression).

Log in as any user → confirm the Login link is gone (replaced by avatar + Logout as before).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/components/layout/Navbar.svelte
git commit -m "fix(navbar): show login link on all screen sizes"
```
