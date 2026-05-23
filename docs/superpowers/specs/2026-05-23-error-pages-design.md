# Error Pages — Nginx Translation + SvelteKit Full-Page Upgrade

**Date:** 2026-05-23
**Source handoff:** `handoffs/error_pages_handoff/`

## Goal

Two independent deliverables:
1. Translate the 3 nginx static error pages to Bahasa Indonesia and place them in `static/errors/`
2. Upgrade `src/routes/+error.svelte` from a bare placeholder to the handoff's full status-specific design, and create the `ErrorState.svelte` component it depends on

## Scope boundary

**Part 2 does NOT affect:**
- Inline form errors (login, register, etc.)
- Modal error states (delete confirmations, admin modals)
- Toast notifications
- Any component that handles its own error display

`+error.svelte` is SvelteKit's error boundary — it only renders when a `load()` function throws or a route doesn't match. All inline/modal errors are handled inside their own components and are unaffected.

---

## Part 1 — Nginx static error pages

### Files

| Source (handoff) | Destination |
|---|---|
| `handoffs/error_pages_handoff/nginx/502.html` | `static/errors/502.html` |
| `handoffs/error_pages_handoff/nginx/503.html` | `static/errors/503.html` |
| `handoffs/error_pages_handoff/nginx/504.html` | `static/errors/504.html` |

Copy each file as-is, then apply the string substitutions below. Structure, CSS, SVG, and layout are unchanged.

### String substitutions (EN → ID)

**All three files:**
- `<html lang="en">` → `<html lang="id">`
- Button "Try again" → "Coba lagi"

**502.html:**
- `<title>` → `Terjadi kesalahan — Mutawazin`
- Pill label: `Error <strong>502</strong>` → stays `Error <strong>502</strong>` (code is universal)
- `<h1>` → `Terjadi kesalahan di sistem kami.`
- Body `<p>` → `Server kami mengalami gangguan. Silakan coba lagi sebentar — ini hampir pasti bersifat sementara.`
- Help `<p>` → `Jika masalah berlanjut, silakan <a href="mailto:hello@mutawazin.com">hubungi kami</a>.`

**503.html:**
- `<title>` → `Sedang pemeliharaan — Mutawazin`
- Pill label: `Maintenance <strong>503</strong>` → `Pemeliharaan <strong>503</strong>`
- `<h1>` → `Kami sedang dalam pemeliharaan.`
- Body `<p>` → `Kami sedang melakukan perbaikan di balik layar. Kami akan segera kembali — terima kasih atas kesabaran Anda.`
- Help `<p>` → `Untuk keperluan mendesak, silakan <a href="mailto:hello@mutawazin.com">hubungi kami</a>.`

**504.html:**
- `<title>` → `Respons terlalu lama — Mutawazin`
- Pill label: `Timeout <strong>504</strong>` → stays `Timeout <strong>504</strong>`
- `<h1>` → `Respons terlalu lama.`
- Body `<p>` → `Saat ini sistem berjalan sedikit lambat. Muat ulang halaman untuk mencoba lagi — kami akan lebih cepat lain kali.`
- Help `<p>` → `Jika masalah berlanjut, silakan <a href="mailto:hello@mutawazin.com">hubungi kami</a>.`

### What does NOT change in nginx files

- All CSS, SVG brand mark, layout structure
- Status codes (502 / 503 / 504) in the pill
- Email address `hello@mutawazin.com`
- Button `href="/"`
- Dot colors (gold / teal / sage per page)

---

## Part 2 — SvelteKit full-page error upgrade

### Files

| Action | Path |
|---|---|
| Create | `src/lib/components/ErrorState.svelte` |
| Replace | `src/routes/+error.svelte` |

### ErrorState.svelte

New presentational component. Converted from Svelte 4 (named slots) to Svelte 5 (snippet props).

**Props (via `$props()`):**
- `tone: 'blue' | 'teal' | 'amber' | 'rose' | 'slate'` — icon tile color
- `code: string | null` — status code eyebrow (optional)
- `title: string` — H1 message
- `body: string` — single-sentence explanation
- `noTile: boolean = false` — when true, renders icon bare (no tinted circle)
- `icon?: Snippet` — SVG icon (28×28)
- `actions?: Snippet` — buttons / links below body
- `extra?: Snippet` — anything below actions (e.g. wait pill)

**Tone → Tailwind class map:**
```
blue:  'bg-blue-100 text-blue-600'
teal:  'bg-teal-100 text-teal-700'
amber: 'bg-amber-100 text-amber-700'
rose:  'bg-rose-100 text-rose-600'
slate: 'bg-slate-200 text-slate-600'
```

**Layout:** `<main class="flex-1 grid place-items-center px-6 py-16 bg-slate-50">` with a `max-w-[480px]` centered text block.

### +error.svelte

Replace the current placeholder with the handoff's full status-specific branching. Uses `$page` from `$app/stores` (still valid in Svelte 5).

**Status → copy mapping:**

| Code | Tone | Title | Body | Action |
|---|---|---|---|---|
| 401 | amber | Your session has expired. | For your security, we signed you out after a period of inactivity. Sign back in to pick up where you left off. | "Log in again" → `/login?from=<current path>` |
| 403 | rose | You don't have permission to view this page. | If you think this is a mistake, please reach out to your admin or get in touch with support. | "Go home" + "Contact support" → `mailto:support@mutawazin.com` |
| 404 | blue | This page doesn't exist. | The page might have moved, been deleted, or never existed. Let's get you back on track. | "Go home" + "Browse courses" → `/courses` |
| 429 | teal | Too many requests. Please slow down. | You're going a little fast for us. Take a quick breather and try again in a moment — no action needed. | (none — wait pill: "Please wait about 30 seconds") |
| 500 | rose | Something went wrong on our end. | We've been notified and we're looking into it. Give it another try, or come back in a moment. | "Try again" (reload) + "Go home" |
| other | slate | Something went wrong. | `$page.error?.message` or "An unexpected error occurred. Please try again." | "Go home" |

**Svelte 5 conversion notes:**
- `export let` → `$props()`
- `$: status = $page.status` → `const status = $derived($page.status)` (or just `$page.status` inline)
- Named slot `slot="icon"` → `{#snippet icon()}...{/snippet}` in +error.svelte; `{@render icon?.()}` in ErrorState
- `on:click={() => location.reload()}` → `onclick={() => location.reload()}`
- Content language: English (no new i18n keys; matching handoff as-is)
- Drop unused `import { t } from 'svelte-i18n'` from the placeholder

---

## What does NOT change

- All inline error handling in forms, modals, and components
- `src/hooks.server.ts` auth logic
- Any existing component that shows errors in-place
