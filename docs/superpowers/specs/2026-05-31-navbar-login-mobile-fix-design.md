# Design: Navbar Login Button Always Visible

**Date:** 2026-05-31  
**Status:** Approved

## Problem

The Login link in `Navbar.svelte` uses `hidden nav-collapse:inline-flex`, hiding it on screens below 900px. Unauthenticated visitors on mobile/tablet have no way to reach the login page from the landing page.

## Solution

Remove the `hidden nav-collapse:` visibility toggle so the Login link is visible at all screen sizes.

## Change

**File:** `src/lib/components/layout/Navbar.svelte` — line 132

```diff
- class="hidden nav-collapse:inline-flex items-center px-3 py-1.5 text-sm font-semibold text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors"
+ class="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-text2 hover:text-text rounded-sm hover:bg-bgGray transition-colors"
```

## Scope

- Only affects unauthenticated visitors on the landing page (`isLanding === true`)
- No change to authenticated nav, sidebar, or any other page
- Nav links (Home, Courses, Teachers, About) stay hidden on mobile — they are anchor links to landing sections and not critical on small screens
- Login link sits to the right of the language switcher on mobile, consistent with existing navbar layout
