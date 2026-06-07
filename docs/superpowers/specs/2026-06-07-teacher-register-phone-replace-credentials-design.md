# Design: Replace Credentials with Phone Number on Teacher Registration

**Date:** 2026-06-07  
**Status:** Approved

---

## Summary

Remove the optional credentials collapsible section from the teacher registration form and replace it with a phone number field placed after Bio. The field is optional but carries no "(optional)" label. Requires a small backend delta to accept `phone_number` at registration.

---

## Frontend changes

### Form field order (new)

Full Name → Email → Password → Bio → **Phone Number** → Subjects

### Phone Number field

- `<input type="tel">` with label `$t('profile.phoneNumber')` (reuses the delta v13 key — "Phone number" / "Nomor telepon")
- Placeholder: `$t('profile.phoneNumberPlaceholder')` (reuses delta v13 key — "+62 812 3456 7890")
- No "(optional)" text on the label or anywhere nearby
- State: `let phoneNumber = $state('')`
- Submit payload: `phone_number: phoneNumber || null` (empty string → null)

### Credentials removal

Remove completely:
- `credentialsOpen` state
- `credentials` state array (`[{ title, institution, year }]`)
- `addCredential()` function
- `removeCredential(i)` function
- Collapsible button + `#credentials-panel` div
- `credentials` mapping in `handleSubmit`
- `ChevronDown` and `Trash2` lucide imports

### i18n changes

**Remove** from `en.json` and `id.json` under `auth.registerTeacher`:
- `credentials`
- `credTitle`, `credTitlePlaceholder`
- `credInstitution`, `credInstitutionPlaceholder`
- `credYear`
- `addCredential`

**No new keys needed** — the phone number field reuses `profile.phoneNumber` and `profile.phoneNumberPlaceholder` already added in delta v13.

---

## Backend delta

A single prompt to paste into the backend Claude Code session:

---

> **Backend task — delta v14: add `phone_number` to teacher registration**
>
> Add `phone_number: str | None = None` to `TeacherRegisterRequest` (Pydantic model).
> In the register teacher endpoint, save the value to the teacher record on creation — the same way `bio` is saved.
> No additional validation needed beyond `str | None`.
> This is a non-breaking additive change: existing callers that omit the field receive `null`.

---

## Files changed

| File | Change |
|---|---|
| `src/routes/register/teacher/+page.svelte` | Remove credentials section, add phone number field after bio |
| `src/locales/en.json` | Remove 7 credential i18n keys under `auth.registerTeacher` |
| `src/locales/id.json` | Same removals |

No new components, no new i18n keys, no layout changes.
