# Admin Sidebar Disappears on Teacher Profile — Design

**Date:** 2026-06-11  
**Status:** Approved

## Problem

When an admin navigates to `/teachers/[id]/`, the admin sidebar disappears. The page renders using the public layout (Navbar only), losing all admin navigation.

## Root Cause

`src/routes/teachers/[id]/+layout.svelte` computes `useAuthLayout` as:

```svelte
const useAuthLayout = $derived(role === 'teacher' || role === 'student');
```

Admins fall into the `else` branch (public layout). This was an intentional but overly broad fix from session 27, which aimed to prevent unauthenticated visitors from seeing a sidebar on public teacher profiles. It incorrectly grouped authenticated admins together with unauthenticated visitors.

## Previous Bug (Must Not Recur)

Unauthenticated users viewing `/teachers/[id]/` were previously shown a sidebar. The fix must preserve the public layout for unauthenticated visitors (`role === undefined`).

## Fix

Add `admin` to the `useAuthLayout` condition:

```svelte
const useAuthLayout = $derived(role === 'teacher' || role === 'student' || role === 'admin');
```

**Why this is safe:**
- `unauthenticated` → `role = undefined` → `undefined === 'admin'` is `false` → still gets public layout
- `admin` → `role = 'admin'` → `true` → gets `<AuthLayout role="admin">` with full admin sidebar
- `teacher`/`student` → unchanged

`AuthLayout` already handles `role="admin"` — it is used by all `/admin/*` routes — so no other component changes are needed.

## Architecture Decision Update

The existing note in `CLAUDE.md` says:

> Do NOT apply `<AuthLayout>` for admin on public pages — the admin sidebar would appear on a public profile.

This is updated to:

> Do NOT apply `<AuthLayout>` for unauthenticated visitors on public pages. Authenticated admins, teachers, and students all get their role-appropriate sidebar, even on pages with public-facing content.

## Files Changed

| File | Change |
|------|--------|
| `src/routes/teachers/[id]/+layout.svelte` | Line 11: add `\|\| role === 'admin'` to `useAuthLayout` |
| `CLAUDE.md` (frontend repo) | Update architecture decision note for public pages |

## Out of Scope

- No changes to `AuthLayout.svelte`, `Sidebar.svelte`, or any other layout component
- No routing changes
- No backend changes
