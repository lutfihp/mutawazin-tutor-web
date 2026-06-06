# Design: Delta v13 — Phone Number Field on Teacher & Student Profiles

**Date:** 2026-06-06
**Handoff:** `handoffs/2026-06-05-fe-handoff-delta-v13.md`
**Scope:** Add optional private `phone_number` field to teacher and student profiles — display (owner/admin only) and editable on own profile.

---

## Overview

Non-breaking additive change. Backend now returns `phone_number: string | null` on single-profile detail endpoints. Field is private: only visible to the profile owner or an admin. No existing fields changed. Six files touched.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/api.ts` | Add `phone_number` to 4 types |
| `src/locales/en.json` | 2 new i18n keys |
| `src/locales/id.json` | 2 new i18n keys |
| `src/routes/teachers/[id]/+page.svelte` | New phone number card |
| `src/routes/students/[id]/+page.svelte` | Inline phone edit row |

---

## Section 1: Types (`src/lib/api.ts`)

Add `phone_number: string | null` to:
- `TeacherProfileResponse` — null unless caller is owner or admin
- `StudentProfileResponse` — null unless caller is owner or admin

Add `phone_number?: string` to:
- `UpdateTeacherProfileRequest`
- `UpdateStudentProfileRequest`

---

## Section 2: i18n

Two new keys under `profile` in both locale files:

```json
"profile": {
  "phoneNumber": "Phone Number",
  "phoneNumberPlaceholder": "e.g. 081234567890"
}
```

```json
"profile": {
  "phoneNumber": "Nomor Telepon",
  "phoneNumberPlaceholder": "Contoh: 081234567890"
}
```

"Not set" text reuses the existing `profile.teacher.notSet` key — no new key needed.

---

## Section 3: Teacher Profile (`src/routes/teachers/[id]/+page.svelte`)

### State (added alongside existing editingBio, editingUniversity, etc.)

```svelte
let editingPhoneNumber = $state(false);
let phoneNumberValue = $state(profile.phone_number ?? '');
let savingPhoneNumber = $state(false);
```

`phoneNumberValue` initialized from `data.profile.phone_number ?? ''`.

### `openSection()` update

Add `'phoneNumber'` to the mutual-exclusion list so opening one section closes all others.

### `savePhoneNumber()` function

```
PUT /teachers/me { phone_number: phoneNumberValue }
→ update profile.phone_number from response
→ editingPhoneNumber = false
```

Error handling: same pattern as saveBio (catch + `savingPhoneNumber = false`).

### New card (placed after Achievements card)

**Visibility:** `{#if isOwn || isAdmin}`

**Structure:**
- Card header: inline phone SVG icon (stroke="currentColor", same style as chips row icons) + `$t('profile.phoneNumber')` + pencil button (shown only when `isOwn`)
- View mode: `{profile.phone_number ?? $t('profile.teacher.notSet')}`
- Edit mode: `<input type="tel">` bound to `phoneNumberValue`, placeholder from `$t('profile.phoneNumberPlaceholder')`, Save button (shows spinner when `savingPhoneNumber`) + Cancel button

**Phone SVG icon** (inline, 20×20, stroke-based):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
    A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72
    c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.06 6.06l.95-.95
    a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
</svg>
```

---

## Section 4: Student Profile (`src/routes/students/[id]/+page.svelte`)

### State (added alongside editingDob, savingDob)

```svelte
let editingPhone = $state(false);
let phoneValue = $state(profile.phone_number ?? '');
let savingPhone = $state(false);
```

### Cross-cancel

Opening phone edit sets `editingDob = false`. Opening DOB edit sets `editingPhone = false`. No shared `openSection()` needed — only two inline edits on this page.

### `savePhone()` function

```
PUT /students/me { phone_number: phoneValue }
→ update profile.phone_number from response
→ editingPhone = false
```

### Display block (placed after DOB row in profile header)

Two separate visibility cases:

**Owner (`isOwn`):** Always shown. View mode shows `profile.phone_number` when set, or `$t('profile.teacher.notSet')` when null — so owner can always see the pencil to add their number. Edit mode: `<input type="tel">` bound to `phoneValue`, placeholder from `$t('profile.phoneNumberPlaceholder')`, Save + Cancel.

**Admin (`isAdmin && !isOwn`):** Only shown when `profile.phone_number` is non-null (admin has no action to take on a null phone; no pencil shown). View mode: `{profile.phone_number}`.

**Other callers (teacher viewing a student):** API returns null; block not rendered.

---

## Privacy Enforcement

Frontend relies on backend privacy rules: the API returns `null` for callers who should not see the value. Frontend only needs to conditionally show the field when the value is non-null and the caller is owner or admin. No client-side masking required.

The `isOwn` and `isAdmin` guards on the edit controls (pencil button) are already in place on both profile pages for other editable fields — same checks apply here.

---

## What Is NOT Changed

- `GET /teachers/featured` — no phone field (public endpoint, not returned by backend)
- `GET /admin/teachers` list page — no phone column (backend doesn't return it on list endpoints)
- `GET /admin/students` list page — same
- No new routes, no layout changes, no API client method changes
