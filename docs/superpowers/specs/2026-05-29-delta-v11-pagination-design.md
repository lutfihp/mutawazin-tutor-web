# Design Spec — Delta v11: Pagination Migration

**Date:** 2026-05-29
**Backend handoff:** `handoffs/2026-05-29-fe-handoff-delta-v11.md`
**Design handoff:** `handoffs/design_handoff_mutawazin/pagination-frontend.md`
**Scope:** Migrate all list endpoints from plain-array responses to `PaginatedResponse<T>`, add Prev/Next pagination UI to main list pages, and fix the audit log's additional breaking changes.

---

## Context

Delta v11 is a **breaking change** across all list endpoints. Every `GET` endpoint that previously returned a plain array now returns a paginated envelope:

```typescript
{
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

Any page that reads a list endpoint without unwrapping `.data` will silently break (iterating over `undefined` instead of the array).

The audit log endpoint has an additional breaking change: the query param `page_size` is renamed to `limit`.

---

## Architecture

**Two categories of work:**

**Category A — Pagination UI (5 pages):** Main list pages that benefit from Prev/Next controls. These get `$state` page tracking and the new shared `<Pagination />` component.

**Category B — Data shape fix only (9 call sites):** Dropdown data, calendar lookups, background data. These just need `.data` unwrapped — no pagination UI.

**New files:** 1 (`src/lib/components/ui/Pagination.svelte`)
**Modified files:** 14

---

## New Types (`src/lib/api.ts`)

Add to the end of `src/lib/api.ts`:

```typescript
export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};
```

Remove `AuditLogListResponse` (retired — replaced by `PaginatedResponse<AuditLogEntry>`).

---

## Shared `<Pagination />` Component

**File:** `src/lib/components/ui/Pagination.svelte`

**Props:**
```typescript
{
  page: number;        // current page, 1-indexed
  totalPages: number;
  onPage: (n: number) => void;
}
```

**Behaviour:**
- Hidden entirely when `totalPages <= 1`
- Prev button disabled when `page === 1`
- Next button disabled when `page >= totalPages`
- Uses `<Button variant="secondary">` matching the existing audit log style
- Container: `flex items-center justify-between px-4 py-3 border-t border-border`
- Center label: `text-sm text-text2` — "Page {page} of {totalPages}"

**Usage:**
```svelte
<Pagination {page} {totalPages} onPage={(n) => { page = n; fetchData(); }} />
```

---

## Category A — Pages with Pagination UI

### Pagination pattern (same on all 5 pages)

```typescript
let page = $state(1);
let totalPages = $state(1);
const pageSize = N; // see table below

async function fetchItems() {
    loading = true;
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
        // add any existing filter params
        const body = await api.get<PaginatedResponse<ItemType>>(`/endpoint?${params}`);
        items = body.data;
        totalPages = body.pagination.totalPages;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Error';
    } finally {
        loading = false;
    }
}
```

**Filter changes reset `page = 1`** before calling fetch.

**`<Pagination />` placement:** inside the Card, below the table/grid, above the card's closing tag.

### Per-page configuration

| File | Endpoint | `pageSize` | Reason |
|---|---|---|---|
| `src/routes/admin/teachers/+page.svelte` | `GET /admin/teachers` | 25 | Design handoff default |
| `src/routes/admin/students/+page.svelte` | `GET /admin/students` | 25 | Design handoff default |
| `src/routes/admin/subjects/+page.svelte` | `GET /subjects?status=verified` | 25 | Design handoff default |
| `src/routes/courses/+page.svelte` | `GET /courses` | 12 | 3-col grid × 4 rows |
| `src/routes/reports/[studentId]/+page.svelte` | `GET /students/:id/reports` | 20 | Design handoff default |

No URL state sync — page resets on refresh, matching the existing audit log behaviour.

---

## Category B — Data Shape Fix Only

These call sites unwrap `.data` but do not add pagination UI (they populate dropdowns, calendars, or background lists where showing all items is correct behaviour).

| File | Endpoints | Variable(s) |
|---|---|---|
| `src/routes/admin/courses/+page.svelte` | `/admin/teachers`, `/subjects?status=verified`, `/courses` | `teachersRes`, `subjectsRes`, `coursesRes` |
| `src/routes/admin/calendar/+page.svelte` | `/admin/teachers`, `/admin/students` | `teachersRes`, `studentsRes` |
| `src/routes/calendar/+page.svelte` | `/courses`, `/students`, `/sessions/recurring` | various |
| `src/routes/dashboard/+page.svelte` | `/students` | `result` |
| `src/routes/register/teacher/+page.svelte` | `/subjects?status=verified` | `entries` |
| `src/routes/courses/+page.svelte` (sub-calls) | `/subjects?status=verified`, `/admin/students` | `entries`, `result` (adminStudents) |
| `src/routes/admin/+page.server.ts` | `/admin/teachers?status=…`, `/admin/students?status=…`, `/admin/subjects?status=…` | server-side fetch |
| `src/routes/students/[id]/+page.server.ts` | `/students/:id/reports` | server-side fetch |

**Migration pattern:**
```typescript
// Before
const items = await api.get<ItemType[]>('/endpoint');

// After
const body = await api.get<PaginatedResponse<ItemType>>('/endpoint');
const items = body.data;
```

For server-side `fetch()` calls in `+page.server.ts`, the same unwrap applies:
```typescript
const body = res.ok ? await res.json() : { data: [], pagination: {} };
const items = body.data ?? [];
```

---

## Audit Log Migration

**File:** `src/routes/admin/settings/audit-log/+page.svelte`

### 1. Query param rename
```typescript
// Before
params.set('page_size', String(pageSize));
// After
params.set('limit', String(pageSize));
```

### 2. Type change
```typescript
// Before
import type { AuditLogListResponse } from '$lib/api';
const data = await api.get<AuditLogListResponse>(`/admin/audit-logs?${params}`);
entries = data.items;
total = data.total;

// After
import type { PaginatedResponse, AuditLogEntry } from '$lib/api';
const body = await api.get<PaginatedResponse<AuditLogEntry>>(`/admin/audit-logs?${params}`);
entries = body.data;
totalPages = body.pagination.totalPages;
```

### 3. Field reference map

| Old | New |
|---|---|
| `data.total` | `body.pagination.totalItems` (only used for pagination calc) |
| `data.items` | `body.data` |
| `Math.ceil(total / pageSize)` | `body.pagination.totalPages` (drop `total` state var) |

### 4. Pagination UI
Replace existing inline Prev/Next buttons with `<Pagination {page} {totalPages} onPage={changePage} />`.

The `pageSize` constant stays at `50` (matches the audit log default limit).

---

## Out of Scope

- URL state sync — page resets on refresh (future delta)
- Windowed page numbers / page-size selector (design handoff full spec — future delta)
- Sorting columns — no sort UI changes in this delta
- Bulk selection — no checkbox columns added
- Calendar pages — not paginated (date-range queries, per design handoff)
- `/teachers` public directory — not in the affected endpoints list for this delta
