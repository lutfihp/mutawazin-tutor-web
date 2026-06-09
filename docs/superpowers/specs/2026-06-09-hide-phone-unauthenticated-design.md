# Hide Phone Number Section for Unauthenticated Users

## Problem

The phone number section on the teacher profile page renders for unauthenticated users, displaying "belum diisi" (not set). This leaks the existence of a private contact field to guests who have no business seeing it.

Root cause: `isOwn` derives from `data.user?.id === profile?.user_id`. When `data.user` is `null` (unauthenticated) and `profile.user_id` is absent or `undefined`, both sides resolve to `undefined`, making `undefined === undefined = true`. The section renders incorrectly.

## Desired Visibility

| Viewer | Phone section visible? |
|---|---|
| Unauthenticated | No |
| Authenticated student | No |
| Authenticated teacher (not owner) | No |
| Owner (the teacher themselves) | Yes |
| Admin | Yes |

## Change

**File:** `src/routes/teachers/[id]/+page.svelte`, line 498

```svelte
<!-- Before -->
{#if isOwn || isAdmin}

<!-- After -->
{#if data.user && (isOwn || isAdmin)}
```

Adding `data.user &&` as an explicit null guard ensures the section is completely hidden when no user session exists, regardless of how `isOwn` evaluates.

## Scope

- Frontend only, one file, one line.
- No backend changes required.
- No other profile sections are affected.
