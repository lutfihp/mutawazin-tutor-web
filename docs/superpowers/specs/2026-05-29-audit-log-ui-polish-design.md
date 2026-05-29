# Design Spec — Audit Log UI Polish

**Date:** 2026-05-29
**Scope:** Three targeted edits to `src/routes/admin/settings/audit-log/+page.svelte` — replace role pill badge with a colored dot, remove resource ID, add a dot legend.

---

## Context

The audit log table currently has two visual redundancies:
1. The Actor column uses a two-row layout: email on top, role as a pill badge below. The role badge takes vertical space and duplicates information that a small color cue can convey.
2. The Resource column shows both `resource_type` and a truncated `resource_id`. The ID is an internal UUID fragment that means nothing to an admin.

The design handoff (`handoffs/design_handoff_mutawazin/audit-log-page.jsx` + `features.css`) already specifies the target pattern.

---

## Changes

### 1. Actor column — colored dot replaces role pill

**Before:** Two-row layout — actor email/username on top, role pill badge (`bg-violet-100 text-violet-800` etc.) below.

**After:** Single inline row — 8×8px colored circle + email/username.

Dot colors (from handoff `features.css`):

| Role | Tailwind class | Hex |
|---|---|---|
| admin | `bg-violet-600` | `#7C3AED` |
| teacher | `bg-teal-600` | `#0D9488` |
| student | `bg-amber-500` | `#F59E0B` |
| unknown | `bg-border` | fallback |

The dot carries `title={entry.actor_role}` for a tooltip on hover.

Replace the `roleBadge` lookup object with `dotColor`:
```typescript
const dotColor: Record<string, string> = {
    admin:   'bg-violet-600',
    teacher: 'bg-teal-600',
    student: 'bg-amber-500',
};
```

Remove `roleBadge` entirely.

**New actor cell:**
```svelte
<td class="px-4 py-3">
    <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full flex-none {dotColor[entry.actor_role] ?? 'bg-border'}"
              title={entry.actor_role}></span>
        <span class="font-medium">{actorLabel(entry)}</span>
    </div>
</td>
```

### 2. Resource column — type only, no ID

**Before:** Two lines — `resource_type` on top, truncated `resource_id` below in `text-xs text-text2`.

**After:** Single value — `resource_type` only.

**New resource cell:**
```svelte
<td class="px-4 py-3">{entry.resource_type}</td>
```

Note: `truncateId` is still used in the diff panel expanded row (`{entry.resource_type} · {truncateId(entry.resource_id)}`). Do **not** remove it.

### 3. Legend — placed between filter card and table card

A small "Actor role:" key explains the dot colors. Positioned in the gap between the filter `<Card>` and the table `<Card>`, matching the handoff layout.

```svelte
<!-- Role legend -->
<div class="flex items-center gap-4 text-xs text-text2">
    <span>Actor role:</span>
    <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-violet-600"></span> Admin
    </span>
    <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-teal-600"></span> Teacher
    </span>
    <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-amber-500"></span> Student
    </span>
</div>
```

---

## Out of Scope

- No changes to the diff panel, filter bar, action badges, or pagination
- No changes to any other page
- No new i18n keys (legend labels are proper nouns, same in EN and ID)
