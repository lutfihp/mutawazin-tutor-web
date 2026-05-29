# Design Spec — Delta v10: Admin Audit Log Page

**Date:** 2026-05-29
**Handoff source:** `handoffs/2026-05-27-fe-handoff-delta-v10.md`
**Scope:** One new read-only admin page at `/admin/settings/audit-log` with sidebar entry, filters, paginated table, inline diff panel.

---

## Files Changed / Created

| File | Change |
|---|---|
| `src/lib/components/layout/Sidebar.svelte` | Add `sectionLabel?: string` to `NavItem` type; render section header before items that carry it; add Audit Log entry to admin nav |
| `src/lib/api.ts` | Add `AuditLogEntry` and `AuditLogListResponse` types |
| `src/locales/en.json` | Add `nav.auditLog` and `auditLog.*` keys |
| `src/locales/id.json` | Same keys in Bahasa Indonesia |
| `src/routes/admin/settings/audit-log/+page.server.ts` | Admin-only auth guard (redirect non-admin to `/login`) |
| `src/routes/admin/settings/audit-log/+layout.svelte` | Pass-through `{@render children()}` — prevents double `<AuthLayout>` wrap |
| `src/routes/admin/settings/audit-log/+page.svelte` | New page — all logic inline (monolithic, matches existing admin page pattern) |

---

## Sidebar Change

`NavItem` type gains an optional `sectionLabel?: string` field.

When rendering the admin nav list, if an item has `sectionLabel`, render a small `<p>` header (same `text-[11px] font-semibold uppercase tracking-widest text-text2 px-3 py-1.5` style as the existing "Admin" / "Menu" label) immediately before that item.

Admin nav entries (append after existing calendar entry):

```typescript
{ id: 'audit-log', labelKey: 'nav.auditLog', href: '/admin/settings/audit-log', icon: Shield, sectionLabel: 'nav.settings' }
```

Use `Shield` from `lucide-svelte` as the icon. Only the first item in a new section carries `sectionLabel`.

`isActive` logic: `/admin/settings/audit-log` — exact path match, consistent with all other admin items.

---

## Auth Guard (`+page.server.ts`)

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  if (locals.user.role !== 'admin') throw redirect(302, '/dashboard');
  return { user: locals.user };
};
```

---

## Pass-through Layout (`+layout.svelte`)

```svelte
<script lang="ts">
  let { children } = $props();
</script>
{@render children()}
```

Parent `/admin/+layout.svelte` already provides `<AuthLayout>`. This file exists solely to satisfy SvelteKit's nested route layout chain without double-wrapping.

---

## Page Structure (`+page.svelte`)

### State

```typescript
let entries = $state<AuditLogEntry[]>([]);
let total = $state(0);
let page = $state(1);
const pageSize = 50;
let loading = $state(false);
let error = $state('');

// Filters (applied on "Apply" click, not live)
let fromDate = $state('');
let toDate = $state('');
let actionFilter = $state('');
let resourceTypeFilter = $state('');

// Diff panel — only one row open at a time
let expandedId = $state<string | null>(null);
```

### Data Fetching

`fetchLogs()` is called in `onMount` and on Apply / page change. Builds `URLSearchParams` from non-empty filter values + `page` + `page_size=50`. Uses `api.get<AuditLogListResponse>`.

```typescript
async function fetchLogs() {
  loading = true;
  error = '';
  try {
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (actionFilter) params.set('action', actionFilter);
    if (resourceTypeFilter) params.set('resource_type', resourceTypeFilter);
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    const data = await api.get<AuditLogListResponse>(`/admin/audit-logs?${params}`);
    entries = data.items;
    total = data.total;
  } catch (e) {
    error = e instanceof Error ? e.message : $t('auditLog.error');
  } finally {
    loading = false;
  }
}

function applyFilters() {
  page = 1;
  expandedId = null;
  fetchLogs();
}

function resetFilters() {
  fromDate = ''; toDate = ''; actionFilter = ''; resourceTypeFilter = '';
  page = 1;
  expandedId = null;
  fetchLogs();
}

function changePage(n: number) {
  page = n;
  expandedId = null;
  fetchLogs();
}
```

### Filter Bar

Inside a `<Card padding="default">`. Two date inputs, two `<select>` elements, Apply + Reset buttons. All labels use `$t()`. Inputs use Tailwind `border border-border rounded-sm px-3 py-2 text-sm` to match existing Input styling.

### Table

`<Card>` wrapping an `overflow-x-auto` table. All `<th>` use `text-left` (consistent with admin table header alignment decision). Columns: When, Actor, Action, Resource, Endpoint, Changes.

**Loading state:** When `loading`, render 5 skeleton rows — each `<td>` contains a `<div class="h-4 bg-border rounded animate-pulse">` bar.

**Empty state:** When `!loading && entries.length === 0 && !error`, render a centered `<p class="text-sm text-text2 py-12 text-center">` with the empty message.

**Error state:** When `error` is set, render a red alert banner above the table:
```svelte
<div class="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
```

### Row Rendering

```
Actor cell:   actorLabel(entry) — plain text + role Badge (violet/teal/amber)
Action cell:  <Badge> with actionBadge color class (green/blue/red)
Resource cell: entry.resource_type + ' ' + truncateId(entry.resource_id) in text-xs text-text2
Endpoint cell: entry.method + ' ' + entry.endpoint in text-xs text-text2
Changes cell: "View diff" button only if entry.before !== null || entry.after !== null
              Clicking toggles expandedId between entry.id and null
```

### Diff Panel

Rendered as an additional `<tr>` immediately after the row when `expandedId === entry.id`. Spans all columns via `colspan="6"`. Contains a `<div class="bg-bgGray p-4 rounded-sm">` with:

- A small heading showing resource type + resource ID
- A `<table>` of changed keys: columns Key / Before / After (Before column omitted entirely for CREATE; After column omitted entirely for DELETE)
- Values: `typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')`

`getDiffKeys` filters to only keys where `JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])`.

### Pagination

Below the table, rendered only when `total > pageSize`:

```svelte
<div class="flex items-center justify-between px-1 pt-4">
  <Button variant="secondary" disabled={page === 1} onclick={() => changePage(page - 1)}>Prev</Button>
  <span class="text-sm text-text2">Page {page} of {Math.ceil(total / pageSize)}</span>
  <Button variant="secondary" disabled={page * pageSize >= total} onclick={() => changePage(page + 1)}>Next</Button>
</div>
```

---

## Badge Styles

```typescript
const actionBadge: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
};

const roleBadge: Record<string, string> = {
  admin:   'bg-violet-100 text-violet-800',
  teacher: 'bg-teal-100 text-teal-800',
  student: 'bg-amber-100 text-amber-800',
};
```

These are applied on raw `<span>` elements (not the `<Badge>` component) to avoid conflicting Tailwind utilities — `<Badge>` always applies a variant background/text, and overriding via `class` prop would produce two competing color classes with unpredictable CSS cascade results. Each `<span>` uses the same base classes as `<Badge>` (`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium`) plus the specific color. Full class strings are hardcoded as static values in the map objects so Tailwind JIT finds them at build time.

---

## Helper Functions

```typescript
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function truncateId(id: string | null): string {
  if (!id) return '—';
  return id.length > 8 ? id.slice(0, 8) + '…' : id;
}

function actorLabel(entry: AuditLogEntry): string {
  return entry.actor_email ?? entry.actor_username ?? entry.actor_id;
}

function getDiffKeys(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].filter(k => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
}
```

---

## i18n Keys

**`en.json`** additions:

```json
"nav": {
  "auditLog": "Audit Log"
},
"auditLog": {
  "title": "Audit Log",
  "filterFrom": "From",
  "filterTo": "To",
  "filterAction": "All actions",
  "filterResource": "All resource types",
  "apply": "Apply",
  "reset": "Reset",
  "empty": "No audit logs found. Try adjusting your filters.",
  "viewDiff": "View diff",
  "colWhen": "When",
  "colActor": "Actor",
  "colAction": "Action",
  "colResource": "Resource",
  "colEndpoint": "Endpoint",
  "colChanges": "Changes",
  "diffKey": "Key",
  "diffBefore": "Before",
  "diffAfter": "After",
  "error": "Failed to load audit logs."
}
```

**`id.json`** additions:

```json
"nav": {
  "auditLog": "Log Audit"
},
"auditLog": {
  "title": "Log Audit",
  "filterFrom": "Dari",
  "filterTo": "Sampai",
  "filterAction": "Semua aksi",
  "filterResource": "Semua tipe resource",
  "apply": "Terapkan",
  "reset": "Reset",
  "empty": "Tidak ada log yang ditemukan. Coba ubah filter.",
  "viewDiff": "Lihat perubahan",
  "colWhen": "Waktu",
  "colActor": "Pelaku",
  "colAction": "Aksi",
  "colResource": "Resource",
  "colEndpoint": "Endpoint",
  "colChanges": "Perubahan",
  "diffKey": "Kunci",
  "diffBefore": "Sebelum",
  "diffAfter": "Sesudah",
  "error": "Gagal memuat log audit."
}
```

API value strings (`CREATE`, `UPDATE`, `DELETE`, resource type names, HTTP methods) are hardcoded — they are backend-canonical values, not locale-dependent copy.

---

## TypeScript Types (added to `src/lib/api.ts`)

```typescript
export type AuditLogEntry = {
  id: string;
  actor_id: string;
  actor_email: string | null;
  actor_username: string | null;
  actor_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resource_type: string;
  resource_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  endpoint: string;
  method: string;
  timestamp: string;
};

export type AuditLogListResponse = {
  total: number;
  page: number;
  page_size: number;
  items: AuditLogEntry[];
};
```

---

## Out of Scope

- URL-based filter sync (query params on the URL) — overkill for an admin-only tool
- Write operations — this page is read-only per the handoff
- Export / download — not in the handoff
- Actor ID click-through to profile page — not specified
