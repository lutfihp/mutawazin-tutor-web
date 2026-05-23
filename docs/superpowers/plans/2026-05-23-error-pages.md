# Error Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the 3 nginx static error pages to Bahasa Indonesia and upgrade the SvelteKit `+error.svelte` from a bare placeholder to the handoff's full status-specific design.

**Architecture:** Part 1 copies the handoff's nginx HTML files into `static/errors/` and applies targeted string substitutions (no structural change). Part 2 creates a new `ErrorState.svelte` presentational component (Svelte 5 snippets) and replaces the existing `+error.svelte` placeholder with the handoff's full branching implementation.

**Tech Stack:** SvelteKit 5 (runes mode), Tailwind v3, TypeScript, plain HTML/CSS (nginx pages)

---

## Files

| Action | Path |
|---|---|
| Create | `static/errors/502.html` |
| Create | `static/errors/503.html` |
| Create | `static/errors/504.html` |
| Create | `src/lib/components/ErrorState.svelte` |
| Replace | `src/routes/+error.svelte` |

---

## Part 1 — Nginx static error pages (Indonesian)

### Task 1: 502 — copy and translate

**Files:**
- Create: `static/errors/502.html`

- [ ] **Step 1: Create static/errors directory and copy 502.html**

  ```powershell
  New-Item -ItemType Directory -Force -Path "static\errors"
  Copy-Item "handoffs\error_pages_handoff\nginx\502.html" "static\errors\502.html"
  ```

- [ ] **Step 2: Change lang attribute**

  In `static/errors/502.html`, find and replace:
  ```
  old: <html lang="en">
  new: <html lang="id">
  ```

- [ ] **Step 3: Translate page title**

  ```
  old: <title>Something went wrong — Mutawazin</title>
  new: <title>Terjadi kesalahan — Mutawazin</title>
  ```

- [ ] **Step 4: Translate h1**

  ```
  old: <h1>Something went wrong on our end.</h1>
  new: <h1>Terjadi kesalahan di sistem kami.</h1>
  ```

- [ ] **Step 5: Translate body paragraph**

  ```
  old: <p>Our server hit a snag. Please try again in a moment — it's almost certainly temporary.</p>
  new: <p>Server kami mengalami gangguan. Silakan coba lagi sebentar — ini hampir pasti bersifat sementara.</p>
  ```

- [ ] **Step 6: Translate button**

  ```
  old: <a class="btn btn-primary" href="/">Try again</a>
  new: <a class="btn btn-primary" href="/">Coba lagi</a>
  ```

- [ ] **Step 7: Translate help text**

  ```
  old: <p class="help">If this keeps happening, please <a href="mailto:hello@mutawazin.com">get in touch</a>.</p>
  new: <p class="help">Jika masalah berlanjut, silakan <a href="mailto:hello@mutawazin.com">hubungi kami</a>.</p>
  ```

- [ ] **Step 8: Commit**

  ```powershell
  git add static/errors/502.html
  git commit -m "feat: add nginx 502 error page in Bahasa Indonesia"
  ```

---

### Task 2: 503 — copy and translate

**Files:**
- Create: `static/errors/503.html`

- [ ] **Step 1: Copy 503.html**

  ```powershell
  Copy-Item "handoffs\error_pages_handoff\nginx\503.html" "static\errors\503.html"
  ```

- [ ] **Step 2: Change lang attribute**

  ```
  old: <html lang="en">
  new: <html lang="id">
  ```

- [ ] **Step 3: Translate page title**

  ```
  old: <title>Under maintenance — Mutawazin</title>
  new: <title>Sedang pemeliharaan — Mutawazin</title>
  ```

- [ ] **Step 4: Translate pill label**

  ```
  old: <span>Maintenance <strong>503</strong></span>
  new: <span>Pemeliharaan <strong>503</strong></span>
  ```

- [ ] **Step 5: Translate h1**

  ```
  old: <h1>We're under maintenance.</h1>
  new: <h1>Kami sedang dalam pemeliharaan.</h1>
  ```

- [ ] **Step 6: Translate body paragraph**

  ```
  old: <p>We're making some improvements behind the scenes. We'll be back online shortly — thanks for your patience.</p>
  new: <p>Kami sedang melakukan perbaikan di balik layar. Kami akan segera kembali — terima kasih atas kesabaran Anda.</p>
  ```

- [ ] **Step 7: Translate button**

  ```
  old: <a class="btn btn-primary" href="/">Try again</a>
  new: <a class="btn btn-primary" href="/">Coba lagi</a>
  ```

- [ ] **Step 8: Translate help text**

  ```
  old: <p class="help">For urgent matters, please <a href="mailto:hello@mutawazin.com">get in touch</a>.</p>
  new: <p class="help">Untuk keperluan mendesak, silakan <a href="mailto:hello@mutawazin.com">hubungi kami</a>.</p>
  ```

- [ ] **Step 9: Commit**

  ```powershell
  git add static/errors/503.html
  git commit -m "feat: add nginx 503 error page in Bahasa Indonesia"
  ```

---

### Task 3: 504 — copy and translate

**Files:**
- Create: `static/errors/504.html`

- [ ] **Step 1: Copy 504.html**

  ```powershell
  Copy-Item "handoffs\error_pages_handoff\nginx\504.html" "static\errors\504.html"
  ```

- [ ] **Step 2: Change lang attribute**

  ```
  old: <html lang="en">
  new: <html lang="id">
  ```

- [ ] **Step 3: Translate page title**

  ```
  old: <title>Taking too long — Mutawazin</title>
  new: <title>Respons terlalu lama — Mutawazin</title>
  ```

- [ ] **Step 4: Translate h1**

  ```
  old: <h1>Taking too long to respond.</h1>
  new: <h1>Respons terlalu lama.</h1>
  ```

- [ ] **Step 5: Translate body paragraph**

  ```
  old: <p>Things are running a little slow right now. Refresh the page to try again — we'll be quicker next time.</p>
  new: <p>Saat ini sistem berjalan sedikit lambat. Muat ulang halaman untuk mencoba lagi — kami akan lebih cepat lain kali.</p>
  ```

- [ ] **Step 6: Translate button**

  ```
  old: <a class="btn btn-primary" href="/">Try again</a>
  new: <a class="btn btn-primary" href="/">Coba lagi</a>
  ```

- [ ] **Step 7: Translate help text**

  ```
  old: <p class="help">If this keeps happening, please <a href="mailto:hello@mutawazin.com">get in touch</a>.</p>
  new: <p class="help">Jika masalah berlanjut, silakan <a href="mailto:hello@mutawazin.com">hubungi kami</a>.</p>
  ```

- [ ] **Step 8: Commit**

  ```powershell
  git add static/errors/504.html
  git commit -m "feat: add nginx 504 error page in Bahasa Indonesia"
  ```

---

## Part 2 — SvelteKit full-page error upgrade

### Task 4: Create ErrorState.svelte

**Files:**
- Create: `src/lib/components/ErrorState.svelte`

- [ ] **Step 1: Create the file with this exact content**

  ```svelte
  <script lang="ts">
  	import type { Snippet } from 'svelte';

  	let {
  		tone = 'blue',
  		code = null,
  		title,
  		body,
  		noTile = false,
  		icon,
  		actions,
  		extra,
  	}: {
  		tone?: 'blue' | 'teal' | 'amber' | 'rose' | 'slate';
  		code?: string | null;
  		title: string;
  		body: string;
  		noTile?: boolean;
  		icon?: Snippet;
  		actions?: Snippet;
  		extra?: Snippet;
  	} = $props();

  	const tones: Record<string, string> = {
  		blue:  'bg-blue-100 text-blue-600',
  		teal:  'bg-teal-100 text-teal-700',
  		amber: 'bg-amber-100 text-amber-700',
  		rose:  'bg-rose-100 text-rose-600',
  		slate: 'bg-slate-200 text-slate-600',
  	};
  </script>

  <main class="flex-1 grid place-items-center px-6 py-16 bg-slate-50">
  	<div class="w-full max-w-[480px] text-center">

  		{#if noTile}
  			<div class="flex justify-center mb-6">
  				{@render icon?.()}
  			</div>
  		{:else}
  			<div class="w-20 h-20 rounded-full grid place-items-center mx-auto mb-6 {tones[tone]}">
  				{@render icon?.()}
  			</div>
  		{/if}

  		{#if code}
  			<div class="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase mb-5">
  				<span>Error</span>
  				<span class="font-semibold text-slate-500">{code}</span>
  			</div>
  		{/if}

  		<h1 class="text-[28px] sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight mb-3 text-balance">
  			{title}
  		</h1>

  		<p class="text-[15px] sm:text-[16px] text-slate-500 leading-relaxed mb-8 text-pretty">
  			{body}
  		</p>

  		<div class="flex flex-wrap gap-2 justify-center">
  			{@render actions?.()}
  		</div>

  		{@render extra?.()}

  	</div>
  </main>
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```
  Expected: 0 errors (same pre-existing warnings as before).

- [ ] **Step 3: Commit**

  ```powershell
  git add src/lib/components/ErrorState.svelte
  git commit -m "feat: add ErrorState presentational component (Svelte 5 snippets)"
  ```

---

### Task 5: Replace +error.svelte

**Files:**
- Replace: `src/routes/+error.svelte`

- [ ] **Step 1: Replace the entire file with this content**

  ```svelte
  <script lang="ts">
  	import { page } from '$app/stores';
  	import ErrorState from '$lib/components/ErrorState.svelte';
  </script>

  <svelte:head>
  	<title>Error — Mutawazin</title>
  </svelte:head>

  {#if $page.status === 401}
  	<ErrorState
  		tone="amber"
  		code="401"
  		title="Your session has expired."
  		body="For your security, we signed you out after a period of inactivity. Sign back in to pick up where you left off."
  	>
  		{#snippet icon()}
  			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  				<rect x="3" y="11" width="18" height="11" rx="2" />
  				<path d="M7 11V7a5 5 0 0 1 10 0v4" />
  				<circle cx="12" cy="16.5" r="1" fill="currentColor" />
  			</svg>
  		{/snippet}
  		{#snippet actions()}
  			<a
  				href="/login?from={encodeURIComponent($page.url.pathname)}"
  				class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
  			>
  				Log in again
  			</a>
  		{/snippet}
  	</ErrorState>

  {:else if $page.status === 403}
  	<ErrorState
  		tone="rose"
  		code="403"
  		title="You don't have permission to view this page."
  		body="If you think this is a mistake, please reach out to your admin or get in touch with support."
  	>
  		{#snippet icon()}
  			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  				<line x1="9" y1="9" x2="15" y2="15" />
  				<line x1="15" y1="9" x2="9" y2="15" />
  			</svg>
  		{/snippet}
  		{#snippet actions()}
  			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Go home</a>
  			<a href="mailto:support@mutawazin.com" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-slate-500 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 transition-colors">Contact support</a>
  		{/snippet}
  	</ErrorState>

  {:else if $page.status === 404}
  	<ErrorState
  		tone="blue"
  		code="404"
  		title="This page doesn't exist."
  		body="The page might have moved, been deleted, or never existed. Let's get you back on track."
  	>
  		{#snippet icon()}
  			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  				<circle cx="12" cy="12" r="10" />
  				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.15" />
  				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  			</svg>
  		{/snippet}
  		{#snippet actions()}
  			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Go home</a>
  			<a href="/courses" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-slate-500 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 transition-colors">Browse courses</a>
  		{/snippet}
  	</ErrorState>

  {:else if $page.status === 429}
  	<ErrorState
  		tone="teal"
  		code="429"
  		title="Too many requests. Please slow down."
  		body="You're going a little fast for us. Take a quick breather and try again in a moment — no action needed."
  	>
  		{#snippet icon()}
  			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  				<path d="M5 22h14" />
  				<path d="M5 2h14" />
  				<path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
  				<path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  			</svg>
  		{/snippet}
  		{#snippet extra()}
  			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mt-6">
  				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  					<circle cx="12" cy="12" r="10" />
  					<polyline points="12 6 12 12 16 14" />
  				</svg>
  				Please wait about 30 seconds
  			</div>
  		{/snippet}
  	</ErrorState>

  {:else if $page.status === 500}
  	<ErrorState
  		tone="rose"
  		code="500"
  		title="Something went wrong on our end."
  		body="We've been notified and we're looking into it. Give it another try, or come back in a moment."
  		noTile
  	>
  		{#snippet icon()}
  			<img
  				src="/brand-kit/png/logo-mark-512.png"
  				alt=""
  				aria-hidden="true"
  				class="block w-28 h-auto"
  			/>
  		{/snippet}
  		{#snippet actions()}
  			<button
  				type="button"
  				onclick={() => location.reload()}
  				class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
  			>
  				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  					<polyline points="23 4 23 10 17 10" />
  					<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  				</svg>
  				Try again
  			</button>
  			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-slate-500 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 transition-colors">Go home</a>
  		{/snippet}
  	</ErrorState>

  {:else}
  	<ErrorState
  		tone="slate"
  		code={String($page.status)}
  		title="Something went wrong."
  		body={$page.error?.message ?? 'An unexpected error occurred. Please try again.'}
  	>
  		{#snippet icon()}
  			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  				<circle cx="12" cy="12" r="10" />
  				<line x1="12" y1="8" x2="12" y2="12" />
  				<line x1="12" y1="16" x2="12.01" y2="16" />
  			</svg>
  		{/snippet}
  		{#snippet actions()}
  			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Go home</a>
  		{/snippet}
  	</ErrorState>
  {/if}
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```
  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```powershell
  git add src/routes/+error.svelte
  git commit -m "feat: upgrade +error.svelte to full status-specific error pages"
  ```

---

### Task 6: Manual smoke test

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

  ```powershell
  npm run dev
  ```

- [ ] **Step 2: Test 404**

  Navigate to `http://localhost:5173/this-page-does-not-exist`.
  Expected: full-page error with blue compass icon, "This page doesn't exist." heading, "Go home" and "Browse courses" buttons. Navbar is visible.

- [ ] **Step 3: Test 500 (trigger manually)**

  In `src/routes/+layout.server.ts` (or any `+page.server.ts`), temporarily add `throw error(500, 'test')`, reload the page, then revert.
  Expected: full-page error with brand mark image, "Something went wrong on our end." heading, "Try again" and "Go home" buttons.

- [ ] **Step 4: Verify nginx files open correctly**

  Open `static/errors/502.html`, `503.html`, `504.html` directly in a browser (double-click or `file://` URL).
  Expected: each page shows the cream brand background, Indonesian text, "Coba lagi" button, and the correct pill dot color (gold / teal / sage).
