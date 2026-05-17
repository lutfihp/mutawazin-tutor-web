# Forgot Password + Reset Password Pages

**Date:** 2026-05-18
**Status:** Approved
**Handoff ref:** `handoffs/2026-05-18-fe-handoff-delta-v2.md` section 1

## Context

Two new public auth endpoints enable password reset. The login page has a dead "Forgot password?" link (pre-mvp in content audit) — now wired.

---

## 1. Fix login page dead link

**`src/routes/login/+page.svelte`** — the "Forgot password?" link currently points to `/forgot-password` (already correct href, was just a dead route). No change needed to the link itself — the route now exists after this spec is implemented.

---

## 2. `/forgot-password` page

**New file:** `src/routes/forgot-password/+page.svelte`

Layout: same auth card pattern (bg-bgGray, centered card, max-w-auth, Logo above).

States:
1. **Form** — email input + "Send Reset Link" button
2. **Success** — "Check your inbox" state card (same green-check pattern as verify-email page)

On submit: `POST /auth/forgot-password { email }` — always returns 200. Show success state regardless of whether email exists (backend never reveals if email is registered).

No `+page.server.ts` needed — CSR only.

---

## 3. `/reset-password` page

**New files:**
- `src/routes/reset-password/+page.svelte`
- `src/routes/reset-password/+page.server.ts` — reads `?token=` from URL and passes to client

States:
1. **Form** — new password + confirm password (both with show/hide), "Update Password" button
2. **Success** — redirect to `/login` after 2 seconds

Errors:
- 404 (invalid token) — show "This reset link is invalid."
- 400 (expired) — show "This reset link has expired. Request a new one." with link back to `/forgot-password`

Submit: `POST /auth/reset-password { token, new_password }` — validate confirm matches before submitting client-side.

---

## New locale keys

Under `auth`:
```json
"forgotPassword": {
  "title": "Forgot your password?",
  "subtitle": "Enter your email and we'll send you a reset link.",
  "emailLabel": "Email",
  "submit": "Send Reset Link",
  "successTitle": "Check your inbox",
  "successBody": "If an account exists for that email, a reset link is on its way."
},
"resetPassword": {
  "title": "Set a new password",
  "subtitle": "Choose a strong password for your account.",
  "newPassword": "New password",
  "confirmPassword": "Confirm new password",
  "submit": "Update Password",
  "mismatch": "Passwords do not match.",
  "invalidToken": "This reset link is invalid.",
  "expiredToken": "This reset link has expired.",
  "requestNew": "Request a new one",
  "successRedirect": "Password updated. Redirecting to login…"
}
```

---

## Files changed

| File | Change |
|---|---|
| `src/routes/forgot-password/+page.svelte` | New — email form → POST /auth/forgot-password |
| `src/routes/reset-password/+page.svelte` | New — password form → POST /auth/reset-password |
| `src/routes/reset-password/+page.server.ts` | New — reads token from URL |
| `src/locales/en.json` | New auth keys |
| `src/locales/id.json` | New auth keys (Indonesian) |
