# Forgot Password + Reset Password Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/forgot-password` and `/reset-password` pages to complete the password reset flow; the login page dead link is already pointing to `/forgot-password`.

**Architecture:** Two new public routes (no auth guards). Both use the existing auth card pattern (bgGray page, centered max-w-auth card, Logo above). `forgot-password` is pure CSR. `reset-password` has a `+page.server.ts` to read the token from the URL query string.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v3, svelte-i18n, native `fetch` (public endpoints, no auth cookie needed)

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/locales/en.json` — new `auth.forgotPassword` and `auth.resetPassword` keys |
| Modify | `src/locales/id.json` — same in Indonesian |
| Create | `src/routes/forgot-password/+page.svelte` |
| Create | `src/routes/reset-password/+page.server.ts` |
| Create | `src/routes/reset-password/+page.svelte` |

---

### Task 1: Add locale keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

- [ ] **Step 1: Add to `en.json` under `auth` object**

After the `"stepUp"` block (before the closing `}` of `auth`):
```json
    "forgotPassword": {
      "title": "Forgot your password?",
      "subtitle": "Enter your email and we'll send you a reset link.",
      "emailLabel": "Email",
      "emailPlaceholder": "you@example.com",
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
      "successTitle": "Password updated!",
      "successBody": "Redirecting you to login…"
    }
```

- [ ] **Step 2: Add same keys to `id.json`**

```json
    "forgotPassword": {
      "title": "Lupa kata sandi?",
      "subtitle": "Masukkan email Anda dan kami akan mengirimkan tautan reset.",
      "emailLabel": "Email",
      "emailPlaceholder": "anda@contoh.com",
      "submit": "Kirim Tautan Reset",
      "successTitle": "Periksa kotak masuk Anda",
      "successBody": "Jika akun dengan email tersebut ada, tautan reset sedang dalam perjalanan."
    },
    "resetPassword": {
      "title": "Buat kata sandi baru",
      "subtitle": "Pilih kata sandi yang kuat untuk akun Anda.",
      "newPassword": "Kata sandi baru",
      "confirmPassword": "Konfirmasi kata sandi baru",
      "submit": "Perbarui Kata Sandi",
      "mismatch": "Kata sandi tidak cocok.",
      "invalidToken": "Tautan reset ini tidak valid.",
      "expiredToken": "Tautan reset ini telah kedaluwarsa.",
      "requestNew": "Minta yang baru",
      "successTitle": "Kata sandi diperbarui!",
      "successBody": "Mengalihkan Anda ke halaman masuk…"
    }
```

---

### Task 2: Create `/forgot-password` page

**Files:**
- Create: `src/routes/forgot-password/+page.svelte`

- [ ] **Step 1: Create the page**

```svelte
<script lang="ts">
	import { t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	let email = $state('');
	let loading = $state(false);
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		try {
			await fetch(`${BASE}/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			// Always show success — backend never reveals if email exists
			success = true;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('auth.forgotPassword.title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href="/" class="mb-6"><Logo /></a>

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-successBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
						<polyline points="22,6 12,13 2,6"/>
					</svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.forgotPassword.successTitle')}</h1>
				<p class="text-sm text-text2 mb-6">{$t('auth.forgotPassword.successBody')}</p>
				<Button variant="secondary" href="/login">{$t('auth.login.submit')}</Button>
			</div>
		{:else}
			<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.forgotPassword.title')}</h1>
			<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.forgotPassword.subtitle')}</p>

			<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="fpEmail" class="text-[13px] font-medium">{$t('auth.forgotPassword.emailLabel')}</label>
					<input id="fpEmail" type="email" bind:value={email} required
						placeholder={$t('auth.forgotPassword.emailPlaceholder')}
						autocomplete="email"
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>
				<Button type="submit" variant="primary" {loading} class="w-full">
					{$t('auth.forgotPassword.submit')}
				</Button>
			</form>

			<div class="mt-6 pt-5 border-t border-border text-sm text-text2 text-center">
				<a href="/login" class="font-semibold text-primary hover:text-primary-dark hover:underline">
					{$t('auth.login.submit')}
				</a>
			</div>
		{/if}
	</div>
</div>
```

---

### Task 3: Create `/reset-password` server and page

**Files:**
- Create: `src/routes/reset-password/+page.server.ts`
- Create: `src/routes/reset-password/+page.svelte`

- [ ] **Step 1: Create `+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	return { token };
};
```

- [ ] **Step 2: Create `+page.svelte`**

```svelte
<script lang="ts">
	import { t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	let newPassword = $state('');
	let confirmPassword = $state('');
	let showNew = $state(false);
	let showConfirm = $state(false);
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			error = $t('auth.resetPassword.mismatch');
			return;
		}
		error = '';
		loading = true;
		try {
			const res = await fetch(`${BASE}/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: data.token, new_password: newPassword }),
			});
			if (res.ok) {
				success = true;
				setTimeout(() => { window.location.href = '/login'; }, 2000);
			} else if (res.status === 404) {
				error = $t('auth.resetPassword.invalidToken');
			} else if (res.status === 400) {
				error = $t('auth.resetPassword.expiredToken');
			} else {
				error = $t('auth.login.errors.unknown');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('auth.resetPassword.title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href="/" class="mb-6"><Logo /></a>

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-successBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.resetPassword.successTitle')}</h1>
				<p class="text-sm text-text2">{$t('auth.resetPassword.successBody')}</p>
			</div>
		{:else}
			<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.resetPassword.title')}</h1>
			<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.resetPassword.subtitle')}</p>

			{#if error}
				<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">
					{error}
					{#if error === $t('auth.resetPassword.expiredToken')}
						<a href="/forgot-password" class="ml-1 font-semibold underline">{$t('auth.resetPassword.requestNew')}</a>
					{/if}
				</div>
			{/if}

			{#if !data.token}
				<p class="text-sm text-errorText">{$t('auth.resetPassword.invalidToken')}</p>
			{:else}
				<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="rpNew" class="text-[13px] font-medium">{$t('auth.resetPassword.newPassword')}</label>
						<div class="relative">
							<input id="rpNew" type={showNew ? 'text' : 'password'} bind:value={newPassword} required
								autocomplete="new-password"
								class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
							<button type="button" onclick={() => (showNew = !showNew)}
								class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded">
								{showNew ? $t('common.hide') : $t('common.show')}
							</button>
						</div>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="rpConfirm" class="text-[13px] font-medium">{$t('auth.resetPassword.confirmPassword')}</label>
						<div class="relative">
							<input id="rpConfirm" type={showConfirm ? 'text' : 'password'} bind:value={confirmPassword} required
								autocomplete="new-password"
								class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
							<button type="button" onclick={() => (showConfirm = !showConfirm)}
								class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded">
								{showConfirm ? $t('common.hide') : $t('common.show')}
							</button>
						</div>
					</div>
					<Button type="submit" variant="primary" {loading} class="w-full">
						{$t('auth.resetPassword.submit')}
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</div>
```

- [ ] **Step 3: Verify and commit**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npx svelte-kit sync; npx svelte-check --tsconfig ./tsconfig.json 2>&1 | Select-Object -Last 3
```
Expected: `0 ERRORS`

```powershell
git add src/routes/forgot-password src/routes/reset-password src/locales/en.json src/locales/id.json
git commit -m "feat: forgot password + reset password pages"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/forgot-password` page, email form, success state → Task 2
- ✅ `POST /auth/forgot-password` always 200 → Task 2
- ✅ `/reset-password?token=` page reads token from URL → Task 3
- ✅ `POST /auth/reset-password` 404/400 error handling → Task 3
- ✅ Redirect to `/login` on success → Task 3
- ✅ Locale keys EN + ID → Task 1

**Placeholder scan:** None found.

**Type consistency:** `data.token: string` passed from server, used in fetch body consistently.
