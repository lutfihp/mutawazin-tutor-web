# Report Enhancements — Understanding Level + Share Link + Public Page

**Date:** 2026-05-18
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-18-fe-handoff-delta-v2.md` sections 7, 8

## Context

Reports gain a new `understanding_level` field (A–E) and a share link feature that generates a temporary public URL for parents/guardians.

---

## 1. `understanding_level` on reports

### Display label mapping
| Value | English label |
|---|---|
| A | Excellent understanding |
| B | Good understanding |
| C | Adequate understanding |
| D | Needs improvement |
| E | Significant difficulty |

Badge color mapping: A→success, B→active, C→warning, D→error, E→error

### Create/Edit modal (`src/routes/reports/[studentId]/+page.svelte`)

Add a radio group after the attendance section:
```
Understanding Level (optional):
[A] [B] [C] [D] [E]
```
Selected pill shows colored tint matching the badge color above. Include in `POST /sessions/:id/reports` and `PUT /reports/:id` body as `understanding_level?: string`.

### Report card view

Show a Badge below attendance if `understanding_level` is set, using the label + color from the mapping above.

---

## 2. Share link — teacher view

**In `src/routes/reports/[studentId]/+page.svelte`**, teacher view only:

Add a "Share" icon-button next to the "Edit Report" link in each report card footer.

On click:
- Call `POST /reports/:id/share`
- Response: `{ share_url, expires_at }`
- Show a small inline panel below the footer with:
  - The full URL (read-only input)
  - A "Copy" button (uses `navigator.clipboard.writeText`)
  - "Expires: {date}" text
  - Clicking "Share" again on the same report regenerates the link

---

## 3. Public share page

**New files:**
- `src/routes/report/share/[token]/+page.svelte`
- `src/routes/report/share/[token]/+page.server.ts`

`+page.server.ts`: Fetches `GET /reports/share/:token`. Returns report data on 200, or `{ error: 'expired' | 'invalid' }` on 410/404.

`+page.svelte`: Renders the report card (same visual as the existing report card in `/reports/[studentId]`) with:
- Session title + date
- Attendance badge
- Score grid with progress bars
- Understanding level badge (if set)
- Teacher notes
- No edit controls, no share button
- If `error === 'expired'`: show "This link has expired." message
- If `error === 'invalid'`: show "Report not found." message

No Navbar, no Sidebar — standalone public page with just Logo + card.

---

## New locale keys

Under `reports`:
```json
"understandingLevel": "Understanding Level",
"understanding_A": "Excellent understanding",
"understanding_B": "Good understanding",
"understanding_C": "Adequate understanding",
"understanding_D": "Needs improvement",
"understanding_E": "Significant difficulty",
"share": "Share",
"shareLink": "Share link",
"shareCopy": "Copy",
"shareCopied": "Copied!",
"shareExpires": "Expires {date}",
"shareExpiredTitle": "Link expired",
"shareExpiredBody": "This report link is no longer valid.",
"shareInvalidBody": "Report not found."
```

---

## Files changed

| File | Change |
|---|---|
| `src/routes/reports/[studentId]/+page.svelte` | understanding_level in modal + card display; Share button + inline share panel |
| `src/routes/report/share/[token]/+page.svelte` | New — public report view |
| `src/routes/report/share/[token]/+page.server.ts` | New — fetch shared report |
| `src/locales/en.json` | New report keys |
| `src/locales/id.json` | New keys in Indonesian |
