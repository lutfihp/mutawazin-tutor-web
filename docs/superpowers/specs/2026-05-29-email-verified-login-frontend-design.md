# Design Spec — Email-Verified Login: Frontend Changes

**Date:** 2026-05-29
**Backend handoff:** `handoffs/2026-05-29-email-verified-login-visibility-design.md`
**Scope:** Frontend-only changes to support `email_verified` users being able to log in, and to surface pending-review state to teachers.

---

## Context

The backend now allows users with `email_verified` status to log in (previously they received a 403). Key visibility rules (enforced by the backend):

- `email_verified` **teachers**: profile and courses return 404 to public/other callers; accessible to the owner and admins.
- `email_verified` **students**: no visibility restrictions — full access after email verification.

The frontend must:
1. Redirect `email_verified` teachers to their profile on first login.
2. Show a pending-review banner on their profile page and courses page.
3. Fix copy that is now wrong: the login 403 error (now only for `pending` = unverified email users) and the register success messages (can now say "log in right away").
4. Add `email_verified` to the `User` type.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/stores/auth.ts` | Add `'email_verified'` to status union type |
| `src/routes/dashboard/+page.server.ts` | Redirect `email_verified` teacher → `/teachers/{id}` |
| `src/routes/teachers/[id]/+page.svelte` | Amber banner when `isOwn && status === 'email_verified'` |
| `src/routes/courses/+page.svelte` | Amber banner when teacher + `email_verified` |
| `src/locales/en.json` | New `pendingReview.*` keys + updated login error + updated register success |
| `src/locales/id.json` | Same in Bahasa Indonesia |

---

## Type Change (`src/lib/stores/auth.ts`)

```typescript
export type User = {
    id: string;
    role: 'admin' | 'teacher' | 'student';
    status: 'pending' | 'email_verified' | 'verified' | 'active' | 'rejected' | 'stepped_up';
} | null;
```

`email_verified` was missing from the union. Without this, TypeScript flags `=== 'email_verified'` comparisons as always-false.

---

## Redirect (`src/routes/dashboard/+page.server.ts`)

Append after the existing admin redirect:

```typescript
if (locals.user.role === 'admin') throw redirect(302, '/admin');
if (locals.user.role === 'teacher' && locals.user.status === 'email_verified')
    throw redirect(302, `/teachers/${locals.user.id}`);
```

`locals.user` is populated by `hooks.server.ts` from the JWT, which carries `{ id, role, status }`. No other change to the dashboard load function.

This only fires on the first load after login (subsequent navigations go directly to the target route). A teacher whose status is later upgraded to `verified` by an admin will no longer be redirected here.

---

## Pending-Review Banner

### Teacher profile (`src/routes/teachers/[id]/+page.svelte`)

Render as the **first element** inside the page root `<div>`, before the profile header card.

Condition: `isOwn && data.user?.status === 'email_verified'`

`isOwn` is already derived as `data.user?.id === profile?.user_id`.

```svelte
{#if isOwn && data.user?.status === 'email_verified'}
  <div class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    {$t('pendingReview.teacherBanner')}
  </div>
{/if}
```

### Courses page (`src/routes/courses/+page.svelte`)

Render before the filter/search bar.

Condition: `data.user?.role === 'teacher' && data.user?.status === 'email_verified'`

```svelte
{#if data.user?.role === 'teacher' && data.user?.status === 'email_verified'}
  <div class="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    {$t('pendingReview.coursesBanner')}
  </div>
{/if}
```

`data.user` is provided by the root `+layout.server.ts` and available on every authenticated page — no additional server load needed.

The banner disappears automatically once the admin approves the teacher (status changes to `verified`; next JWT refresh will carry the new status).

---

## i18n Changes

### New keys

**`en.json`:**
```json
"pendingReview": {
  "teacherBanner": "Your account is pending admin approval. Your profile and courses aren't visible to the public yet — but you can set up your profile while you wait.",
  "coursesBanner": "Your courses aren't visible to students yet — your account is pending admin approval."
}
```

**`id.json`:**
```json
"pendingReview": {
  "teacherBanner": "Akun Anda sedang menunggu persetujuan admin. Profil dan kursus Anda belum terlihat oleh publik — namun Anda bisa menyiapkan profil Anda sambil menunggu.",
  "coursesBanner": "Kursus Anda belum terlihat oleh murid — akun Anda sedang menunggu persetujuan admin."
}
```

### Updated keys

| Key | Old EN | New EN |
|---|---|---|
| `auth.login.errors.pendingApproval` | "Your account is pending approval by our team." | "Please verify your email address before logging in." |
| `auth.registerTeacher.success` | "We've sent a verification link to your inbox. Click it to verify your account — our team will then review your application." | "We've sent a verification link to your inbox. Click it to activate your account — you can log in right away while our team reviews your application." |
| `auth.registerStudent.success` | "We've sent a verification link to your inbox. Click it to verify your account." | "We've sent a verification link to your inbox. Click it to activate your account — you can log in immediately after." |

**`id.json` updates:**

| Key | New ID |
|---|---|
| `auth.login.errors.pendingApproval` | "Verifikasi alamat email Anda sebelum masuk." |
| `auth.registerTeacher.success` | "Kami telah mengirimkan tautan verifikasi ke kotak masuk Anda. Klik tautan tersebut untuk mengaktifkan akun — Anda bisa langsung masuk sementara tim kami meninjau lamaran Anda." |
| `auth.registerStudent.success` | "Kami telah mengirimkan tautan verifikasi ke kotak masuk Anda. Klik tautan tersebut untuk mengaktifkan akun — Anda bisa langsung masuk setelahnya." |

---

## Out of Scope

- Admin-side changes — admin already sees all teachers regardless of status.
- Session / calendar / report pages — not publicly browsable; no visibility changes needed.
- Student post-login flow — no restrictions; dashboard as normal, no banner.
- Automatic banner dismissal UI — banner disappears on next login after admin approves (JWT refresh carries new status). No manual dismiss needed.
