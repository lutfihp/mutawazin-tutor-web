# Teacher Profile Page Redesign — Design Spec

**Date:** 2026-05-22
**Route:** `/teachers/[id]`
**File:** `src/routes/teachers/[id]/+page.svelte`
**Scope:** Visual layout only — no new API endpoints, no data model changes.

---

## Goal

Align the teacher profile page with the updated design handoff (`handoffs/design_handoff_mutawazin/`). This is a layout and visual redesign of an existing page; all API calls and data loading remain unchanged.

---

## Data Strategy

The design handoff specifies richer credential structures than the API currently provides. Decided to **adapt the display to existing API data** rather than request backend changes:

| Section | Design Handoff Intent | API Data Available | Display Approach |
|---|---|---|---|
| University | degree · institution · year per entry | `university: string` | Single row: university name only |
| Teaching Experience | role · org · period per entry | `[{ subject, year_from, year_to }]` | Row per entry: subject as title, "year_from – year_to" (or "year_from – present" if `year_to` is null) as sub-line |
| Achievements | title · org · year per entry | `string[]` | Row per entry: plain string as title |
| Profile header stats | — | `years_experience`, `sessions_completed`, `average_rating`, `total_ratings` | All available, render as meta line |
| Current Courses | — | `courses[]: { name, age_categories, description? }` | Subject name as primary text, age categories as meta, description as optional secondary text |

---

## Section Order

**Public and own-edit views use the same order:**

1. Profile Header (card)
2. About
3. University
4. Teaching Experience
5. Achievements
6. Current Courses

---

## Public View

> "Hide if empty" rules in this section apply to the **public view only**. Own-edit view shows an empty state with a pencil button instead — see [Empty / Loading States](#empty--loading-states).

### Profile Header Card

A single card containing:

- **Avatar** — `photo_url` if set, else initials from `full_name`. 88px circle.
- **Name** — `full_name`, 26px bold.
- **Badges row** — Featured badge (`⭐ Featured Teacher`, gold) if `is_featured`, then subject badge pills (teal) for each entry in `subjects[]`.
- **Meta line** — `{years_experience} yrs experience · {sessions_completed} sessions completed · ★ {average_rating} ({total_ratings} reviews)`. 13px, muted. If `total_ratings` is 0, omit the rating segment entirely.
- **Divider** — 1px `#f1f5f9` line.
- **Chips row** — shown only when at least one of the three fields is set:
  - Mode chip (blue tint): `🌐 Online` / `🔴 Offline` / `🔄 Online & Offline` depending on `teaching_mode`.
  - City chip (green tint): `📍 {city}` — omit if `city` is empty.
  - Method chips (purple tint): one chip per entry in `teaching_methods[]` — omit entirely if array is empty.
- **No action buttons** (Book session / Message removed per design decision).

### About

Card with heading "About" and `bio` text. If `bio` is empty or null, hide the entire section (do not show an empty card).

### University

Card with graduation cap icon tile (blue tint, `🎓`), heading "University".

- If `university` is set: one row showing the university name.
- If `university` is empty or null: hide the entire section.

### Teaching Experience

Card with briefcase icon tile (teal tint, `💼`), heading "Teaching Experience".

- One row per entry in `teaching_experience[]`.
- Row structure: `subject` as title (14px bold), year range as sub-line (`{year_from} – present` if `year_to` is null, else `{year_from} – {year_to}`).
- If array is empty: hide the entire section.

### Achievements

Card with star icon tile (gold tint, `⭐`), heading "Achievements".

- One row per entry in `achievements[]`. Row shows the string as the title line only.
- If array is empty: hide the entire section.

### Current Courses

Card with heading "Current Courses".

- Grid: 2 columns on ≥ sm breakpoint, 1 column on mobile.
- One card per entry in `courses[]`:
  - **Subject name** — `name` field, 15px bold teal (`#0f766e`). Treat this as the primary identifier.
  - **Age categories** — `age_categories` joined as `·`-separated string, 11px muted.
  - **Description** — `description` if set and non-empty, 12px muted, optional. Omit if missing.
- If `courses` is empty or null: hide the entire section.

---

## Own-Edit View

Shown when `data.user?.id === profile?.user_id`.

### Header differences

- **Camera overlay** on avatar (📷, blue circle, bottom-right). Clicking triggers the existing photo upload flow (`PUT /teachers/me/photo`).
- No action buttons (same as public).
- All other header elements identical to public view.

### Per-section pencil editing

Each editable section (About, University, Teaching Experience, Achievements) has a **pencil button** (✏️) in the top-right of its card. Only one section can be in edit mode at a time — opening a new section closes any previously open one.

**Edit state for a section:**
- Card gets a blue focus ring (`box-shadow: 0 0 0 3px #eff6ff`, `border-color: #93c5fd`).
- Pencil button turns blue (active state).
- Content area replaces display with editable inputs.
- **Save** and **Cancel** buttons appear below the inputs.
- Saving calls `PUT /teachers/me` with the relevant field(s). On success: close edit state, refresh display value. On error: keep edit state open (do not discard input).
- Cancel discards local edits, returns to display state.

**Per-section edit inputs:**

| Section | Edit UI |
|---|---|
| About | `<textarea>` pre-filled with `bio`. Saves `{ bio }`. |
| University | Single `<input>` pre-filled with `university`. Saves `{ university }`. |
| Teaching Experience | Repeatable rows: `<input>` for subject, `<input>` for `year_from` (number), `<input>` for `year_to` (number, placeholder "present" to mean null). ✕ button to remove a row. "+ Add entry" to append a blank row. Saves `{ teaching_experience: [...] }`. |
| Achievements | Repeatable rows: single `<input>` per string. ✕ to remove, "+ Add achievement" to append. Saves `{ achievements: [...] }`. |

### Current Courses (own)

Same grid as public view, but a **"+ New course"** link appears at the top-right of the section heading (links to `/courses/new`).

---

## Existing Edit-Mode Toggle

The current implementation has a top-level "Edit View / Public Preview" tab toggle and a `savingDetails` form for teaching_mode, city, university, and teaching_methods. This block is **removed** — replaced by the per-section pencil approach above. The `teaching_mode`, `city`, and `teaching_methods` fields become read-only on the profile page (editable through a separate settings flow, or future iteration).

---

## Empty / Loading States

- If `profile` is null (load failed or 404): show a simple "Teacher not found" message, no crash.
- Sections with no data are hidden entirely — no "nothing here yet" placeholder cards on the public view.
- On own view, hidden sections with no data still show a pencil-enabled empty state: e.g. University card shows "Not set" with the pencil to add.

---

## Design Tokens Used

All values come from `tailwind.config.js`:

| Use | Token / Value |
|---|---|
| Blue accent (University icon, chips, focus ring) | `#2563eb` / `#eff6ff` / `#bfdbfe` |
| Teal accent (Experience icon, subject chips, course name) | `#0d9488` / `#ccfbf1` / `#5eead4` / `#0f766e` |
| Gold accent (Achievements icon, featured badge) | `#c9a35a` / `#fef3c7` / `#fcd34d` |
| Card border | `#e2e8f0` |
| Card radius | `12px` |
| Body text | `#0f172a` |
| Muted text | `#64748b` |
| Divider | `#f1f5f9` |

---

## Out of Scope

- No changes to routing, SSR load function, or auth guard.
- No changes to `teaching_mode`, `city`, or `teaching_methods` editability on this page (read-only display only in this iteration).
- No new API endpoints.
- No mobile-specific layout changes beyond the existing responsive grid behaviour.
