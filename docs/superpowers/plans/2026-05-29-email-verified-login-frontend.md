# Email-Verified Login: Frontend Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the new `email_verified` login capability to users — redirect teachers to their profile on first login, show pending-review banners on profile and courses pages, and fix copy that no longer matches backend behaviour.

**Architecture:** Four targeted file edits + one i18n task. No new components. `data.user.status` (from the root `+layout.server.ts`) is already available on every authenticated page and carries the JWT `status` field, so all condition checks are one-liners.

**Tech Stack:** SvelteKit (Svelte 5 runes), svelte-i18n, Tailwind v3. Verification via `npm run check` (0 errors baseline).

---

## File Map

| File | Action | Change |
|---|---|---|
| `src/lib/stores/auth.ts` | Modify | Add `'email_verified'` to status union |
| `src/locales/en.json` | Modify | Add `pendingReview.*` keys; update login error + register success strings |
| `src/locales/id.json` | Modify | Same in Bahasa Indonesia |
| `src/routes/dashboard/+page.server.ts` | Modify | Redirect `email_verified` teacher → `/teachers/{id}` |
| `src/routes/teachers/[id]/+page.svelte` | Modify | Amber banner when `isOwn && status === 'email_verified'` |
| `src/routes/courses/+page.svelte` | Modify | Amber banner when teacher + `email_verified` |

---

## Task 1: Add `email_verified` to the User type

**Files:**
- Modify: `src/lib/stores/auth.ts`

The `User` type currently lists `status` as `'pending' | 'verified' | 'active' | 'rejected' | 'stepped_up'`. Without `'email_verified'`, TypeScript treats `=== 'email_verified'` comparisons as always-false and will warn/error.

- [ ] **Step 1: Update the status union**

Open `src/lib/stores/auth.ts`. The current content is:

```typescript
import { writable } from 'svelte/store';

export type User = {
	id: string;
	role: 'admin' | 'teacher' | 'student';
	status: 'pending' | 'verified' | 'active' | 'rejected' | 'stepped_up';
} | null;

export const user = writable<User>(null);
```

Replace the `status` line only:

```typescript
import { writable } from 'svelte/store';

export type User = {
	id: string;
	role: 'admin' | 'teacher' | 'student';
	status: 'pending' | 'email_verified' | 'verified' | 'active' | 'rejected' | 'stepped_up';
} | null;

export const user = writable<User>(null);
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS` (same baseline).

---

## Task 2: i18n — new keys and updated copy

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

Three changes per locale file:
1. Add `pendingReview` top-level object (new banner text).
2. Update `auth.login.errors.pendingApproval` — now only shown to `pending` users (email not yet verified); old text implied admin approval needed, new text tells them to verify their email.
3. Update `auth.registerTeacher.success` and `auth.registerStudent.success` — users can now log in immediately after verifying, so the success messages should say so.

- [ ] **Step 1: Add `pendingReview` keys to `en.json`**

The file currently ends with:

```json
    "error": "Failed to load audit logs."
  }
}
```

Replace with:

```json
    "error": "Failed to load audit logs."
  },
  "pendingReview": {
    "teacherBanner": "Your account is pending admin approval. Your profile and courses aren't visible to the public yet — but you can set up your profile while you wait.",
    "coursesBanner": "Your courses aren't visible to students yet — your account is pending admin approval."
  }
}
```

- [ ] **Step 2: Update `auth.login.errors.pendingApproval` in `en.json`**

Find:

```json
        "pendingApproval": "Your account is pending approval by our team.",
```

Replace with:

```json
        "pendingApproval": "Please verify your email address before logging in.",
```

- [ ] **Step 3: Update `auth.registerTeacher.success` in `en.json`**

Find:

```json
      "success": "We've sent a verification link to your inbox. Click it to verify your account — our team will then review your application.",
```

Replace with:

```json
      "success": "We've sent a verification link to your inbox. Click it to activate your account — you can log in right away while our team reviews your application.",
```

- [ ] **Step 4: Update `auth.registerStudent.success` in `en.json`**

Find:

```json
      "success": "We've sent a verification link to your inbox. Click it to verify your account.",
```

Replace with:

```json
      "success": "We've sent a verification link to your inbox. Click it to activate your account — you can log in immediately after.",
```

- [ ] **Step 5: Add `pendingReview` keys to `id.json`**

The file currently ends with:

```json
    "error": "Gagal memuat log audit."
  }
}
```

Replace with:

```json
    "error": "Gagal memuat log audit."
  },
  "pendingReview": {
    "teacherBanner": "Akun Anda sedang menunggu persetujuan admin. Profil dan kursus Anda belum terlihat oleh publik — namun Anda bisa menyiapkan profil Anda sambil menunggu.",
    "coursesBanner": "Kursus Anda belum terlihat oleh murid — akun Anda sedang menunggu persetujuan admin."
  }
}
```

- [ ] **Step 6: Update `auth.login.errors.pendingApproval` in `id.json`**

Find:

```json
        "pendingApproval": "Akun Anda sedang menunggu persetujuan dari tim kami.",
```

Replace with:

```json
        "pendingApproval": "Verifikasi alamat email Anda sebelum masuk.",
```

- [ ] **Step 7: Update `auth.registerTeacher.success` in `id.json`**

Find:

```json
      "success": "Kami telah mengirimkan tautan verifikasi ke kotak masuk Anda. Klik tautan tersebut untuk memverifikasi akun — tim kami akan meninjau lamaran Anda.",
```

Replace with:

```json
      "success": "Kami telah mengirimkan tautan verifikasi ke kotak masuk Anda. Klik tautan tersebut untuk mengaktifkan akun — Anda bisa langsung masuk sementara tim kami meninjau lamaran Anda.",
```

- [ ] **Step 8: Update `auth.registerStudent.success` in `id.json`**

Find:

```json
      "success": "Kami telah mengirimkan tautan verifikasi ke kotak masuk Anda. Klik tautan tersebut untuk mengaktifkan akun Anda.",
```

Replace with:

```json
      "success": "Kami telah mengirimkan tautan verifikasi ke kotak masuk Anda. Klik tautan tersebut untuk mengaktifkan akun — Anda bisa langsung masuk setelahnya.",
```

- [ ] **Step 9: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 3: Dashboard redirect for `email_verified` teachers

**Files:**
- Modify: `src/routes/dashboard/+page.server.ts`

The dashboard load currently redirects admins to `/admin`. Add an identical pattern below it: `email_verified` teachers go straight to their profile page so they can set it up while awaiting approval.

`locals.user` is populated by `src/hooks.server.ts` from the JWT cookie and carries `{ id, role, status }`. No additional data fetching needed.

- [ ] **Step 1: Add the redirect**

Open `src/routes/dashboard/+page.server.ts`. Current content:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role === 'admin') throw redirect(302, '/admin');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };
	const endpoint = locals.user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

	try {
		const res = await fetch(`${BASE}${endpoint}`, { headers });
		const dashboardData = res.ok ? await res.json() : {};
		return { dashboardData, role: locals.user.role };
	} catch {
		return { dashboardData: {}, role: locals.user.role };
	}
};
```

Replace the two redirect lines with three:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role === 'admin') throw redirect(302, '/admin');
	if (locals.user.role === 'teacher' && locals.user.status === 'email_verified')
		throw redirect(302, `/teachers/${locals.user.id}`);

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };
	const endpoint = locals.user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

	try {
		const res = await fetch(`${BASE}${endpoint}`, { headers });
		const dashboardData = res.ok ? await res.json() : {};
		return { dashboardData, role: locals.user.role };
	} catch {
		return { dashboardData: {}, role: locals.user.role };
	}
};
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 4: Pending-review banner on teacher profile

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

The teacher profile page opens with `<div class="max-w-profile mx-auto py-8">` at line 135. The banner goes immediately after this opening div — before the profile header card — and is shown only when the logged-in user is viewing their own profile and their status is `email_verified`.

`isOwn` is already derived as `data.user?.id === profile?.user_id` near the top of the `<script>` block. `data.user?.status` comes from the root `+layout.server.ts` (available on every authenticated page).

- [ ] **Step 1: Insert the banner**

Find the opening of the template section in `src/routes/teachers/[id]/+page.svelte`:

```svelte
<div class="max-w-profile mx-auto py-8">
```

Replace with:

```svelte
<div class="max-w-profile mx-auto py-8">
	{#if isOwn && data.user?.status === 'email_verified'}
		<div class="mb-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			{$t('pendingReview.teacherBanner')}
		</div>
	{/if}
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

---

## Task 5: Pending-review banner on courses page

**Files:**
- Modify: `src/routes/courses/+page.svelte`

The courses page template starts at line 195 with `<div>` followed immediately by `<!-- Page header -->`. The banner goes after the opening `<div>` and before the page header, shown only when the logged-in user is a teacher with `email_verified` status.

`data.user` comes from the root `+layout.server.ts` and is available via the courses layout which already reads `data.user?.role`.

- [ ] **Step 1: Insert the banner**

Find in `src/routes/courses/+page.svelte`:

```svelte
<div>
	<!-- Page header -->
```

Replace with:

```svelte
<div>
	{#if data.user?.role === 'teacher' && data.user?.status === 'email_verified'}
		<div class="mb-5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			{$t('pendingReview.coursesBanner')}
		</div>
	{/if}
	<!-- Page header -->
```

- [ ] **Step 2: Verify**

```powershell
npm run check
```

Expected: `0 ERRORS 12 WARNINGS`.

- [ ] **Step 3: Manual smoke test**

```powershell
npm run dev
```

With a test account that has `email_verified` status (or mock by temporarily hardcoding `data.user?.status === 'email_verified'` to `true` in the template, then reverting):

1. Log in as an `email_verified` teacher → should be redirected to `/teachers/{id}` instead of `/dashboard`.
2. Teacher profile page shows amber banner at the top: "Your account is pending admin approval. Your profile and courses aren't visible to the public yet..."
3. Navigate to `/courses` → amber banner appears: "Your courses aren't visible to students yet..."
4. Log in as a `verified` teacher → no banner on either page.
5. Log in as a student → no banner on courses page, no redirect from dashboard.
6. Visit `/register/teacher`, complete form → success state says "you can log in right away".
7. Visit `/register/student`, complete form → success state says "you can log in immediately after".
8. Trigger the login 403 error (attempt login as a `pending` user) → message says "Please verify your email address before logging in."
