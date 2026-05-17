# Profile/Session/Rating/Recurring Enhancements

**Date:** 2026-05-18
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-18-fe-handoff-delta-v2.md` sections 4, 5, 6, 9

## Context

Four additive features: teacher profile gains new fields, sessions gain mode/price, students can rate completed sessions, recurring templates gain mode/price.

---

## 1. Teacher profile — new fields

### Edit mode (`src/routes/teachers/[id]/+page.svelte`)

Add to the edit view, below the bio section, as a new "Details" card:

| Field | Input type | API field |
|---|---|---|
| Teaching mode | Radio-pill: Online / Offline / Both | `teaching_mode` |
| City | Text input | `city` |
| Teaching methods | Tag input (same pattern as subjects) | `teaching_methods[]` |
| University | Text input | `university` |
| Achievements | Repeatable text rows + add/remove | `achievements[]` |
| Teaching experience | Repeatable rows: subject, year_from, year_to (blank=present) | `teaching_experience[]` |

All fields optional. Submit all changed fields in `PUT /teachers/me` body.

### Public view

Add below the credentials card:
- Teaching mode badge (Online / Offline / Both) — only if set
- City text — only if set
- Star rating display: `★ {average_rating} ({total_ratings} ratings)` — only if `total_ratings > 0`
- Achievements list — only if non-empty
- Teaching experience timeline — only if non-empty

---

## 2. Session detail modal — mode + price + rating

**`src/routes/calendar/+page.svelte`** session detail modal:

Add to the info grid:
- **Mode** — "Online" or "Offline" badge (only if session has `mode` field)
- **Price** — show if `price` is set

**Rating section** (student view, completed sessions only):
After the info grid, if `session.status === 'completed'` and `data.user.role === 'student'`:
- Show 5-star tap-to-rate UI
- Optional comment textarea
- "Submit Rating" button → `POST /sessions/:id/rating { rating, comment? }`
- On 409 (already rated): show existing rating as read-only

---

## 3. Session ratings on teacher profile

**`src/routes/teachers/[id]/+page.svelte`** — profile header:

Add star rating display next to the subject badges:
```
★★★★☆ 4.2 (28 ratings)
```
Uses `profile.average_rating` and `profile.total_ratings`. Only shown if `total_ratings > 0`.

Also show in landing page search results (teacher cards use `teacher.subjects` already — add `active_course_count` display which already exists; add average_rating display from `/search/teachers` response).

---

## 4. Recurring sessions — mode + price fields

**`src/routes/calendar/+page.svelte`** — Add/Edit Recurring modal:

Add two fields after Duration:
- **Mode** — radio-pills: Online / Offline (default: Online)
- **Price** — number input (optional, in currency units)

Include in `POST /sessions/recurring` and `PUT /sessions/recurring/:id` body as `mode` and `price`.

---

## New locale keys

Under `profile.teacher`:
```json
"teachingMode": "Teaching mode",
"modeOnline": "Online",
"modeOffline": "Offline",
"modeBoth": "Both",
"city": "City",
"teachingMethods": "Teaching methods",
"university": "University",
"achievements": "Achievements",
"addAchievement": "+ Add achievement",
"experience": "Teaching experience",
"addExperience": "+ Add experience",
"experiencePresent": "Present",
"rating": "{rating} ({count} ratings)"
```

Under `calendar.modal`:
```json
"modeLabel": "Session mode",
"priceLabel": "Price (optional)"
```

Under `reports` (reuse existing session detail):
```json
"rateSession": "Rate this session",
"ratingSubmit": "Submit Rating",
"ratingComment": "Comment (optional)",
"ratingAlready": "You rated this session",
"ratingPlaceholder": "Share your experience..."
```

---

## Files changed

| File | Change |
|---|---|
| `src/routes/teachers/[id]/+page.svelte` | Edit: new fields card; Public: mode/city/rating/achievements/experience display |
| `src/routes/calendar/+page.svelte` | Session detail: mode/price/rating section; Recurring modal: mode/price fields |
| `src/routes/+page.svelte` | Search teacher cards: show star rating |
| `src/locales/en.json` | New keys |
| `src/locales/id.json` | New keys (Indonesian) |
