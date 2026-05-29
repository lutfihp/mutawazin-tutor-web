# Audit Log UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the role pill badge in the Actor column with a colored dot, remove the resource ID from the Resource column, and add a dot legend between the filter card and table card.

**Architecture:** Single file edit — `src/routes/admin/settings/audit-log/+page.svelte`. Three targeted HTML/TypeScript changes with no new components, no new i18n keys, and no changes to any other file.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind v3

---

### Task 1: Replace `roleBadge` with `dotColor`, update actor cell, drop resource ID, add legend

**Files:**
- Modify: `src/routes/admin/settings/audit-log/+page.svelte:34-38` (script — replace const)
- Modify: `src/routes/admin/settings/audit-log/+page.svelte:194-201` (actor cell)
- Modify: `src/routes/admin/settings/audit-log/+page.svelte:207-210` (resource cell)
- Modify: `src/routes/admin/settings/audit-log/+page.svelte:152` (after filter Card close tag, add legend)

- [ ] **Step 1: Replace `roleBadge` const with `dotColor` in the script block**

Current code at lines 34–38:
```typescript
const roleBadge: Record<string, string> = {
    admin:   'bg-violet-100 text-violet-800',
    teacher: 'bg-teal-100 text-teal-800',
    student: 'bg-amber-100 text-amber-800',
};
```

Replace with:
```typescript
const dotColor: Record<string, string> = {
    admin:   'bg-violet-600',
    teacher: 'bg-teal-600',
    student: 'bg-amber-500',
};
```

- [ ] **Step 2: Update the actor cell (lines 194–201)**

Current:
```svelte
<td class="px-4 py-3">
    <div class="flex flex-col gap-1">
        <span>{actorLabel(entry)}</span>
        <span class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium {roleBadge[entry.actor_role] ?? 'bg-bgGray text-muted'}">
            {entry.actor_role}
        </span>
    </div>
</td>
```

Replace with:
```svelte
<td class="px-4 py-3">
    <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full flex-none {dotColor[entry.actor_role] ?? 'bg-border'}"
              title={entry.actor_role}></span>
        <span class="font-medium">{actorLabel(entry)}</span>
    </div>
</td>
```

- [ ] **Step 3: Update the resource cell (lines 207–210)**

Current:
```svelte
<td class="px-4 py-3">
    <span>{entry.resource_type}</span>
    <span class="block text-xs text-text2">{truncateId(entry.resource_id)}</span>
</td>
```

Replace with:
```svelte
<td class="px-4 py-3">{entry.resource_type}</td>
```

> **Important:** Do NOT remove `truncateId`. It is still used in the diff panel expanded row at line 229:
> `{entry.resource_type} · {truncateId(entry.resource_id)}`

- [ ] **Step 4: Add the dot legend between the filter Card and the table Card**

Current layout around line 152–160:
```svelte
        </div>
    </Card>

    <!-- Error banner -->
    {#if error}
    ...
    <!-- Table -->
    <Card padding="none">
```

Insert the legend after `</Card>` (filter card close) and before the error banner:
```svelte
        </div>
    </Card>

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

    <!-- Error banner -->
    {#if error}
```

- [ ] **Step 5: Run type check to verify no TypeScript errors**

```powershell
npm run check
```

Expected: 0 errors (pre-existing warnings are fine).

- [ ] **Step 6: Commit**

```powershell
git add src/routes/admin/settings/audit-log/+page.svelte
git commit -m "feat(audit-log): replace role pill with colored dot, remove resource ID, add legend"
```
