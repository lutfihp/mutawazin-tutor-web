# First-Load Glitch Fix + Mobile-First Best-Practice Pass — Design

**Date:** 2026-07-18
**Status:** Approved by user (brainstorming session)
**Scope:** Frontend only (`mutawazin-tutor-web`). No backend changes.

## Problem

1. **First-load glitch (user-reported, root cause confirmed):** On a first visit in incognito (cold cache), the page briefly flashes/blanks — content appears, is replaced by a spinner, then reappears. On refresh it never happens. Root cause: `src/routes/+layout.svelte` wraps the whole app in `{#if $isLoading}` (svelte-i18n). During cold-cache hydration the locale JSON dynamic import briefly flips `isLoading` to true, so the hydrated server-rendered page is swapped for a spinner and re-rendered. The guard is redundant: `src/routes/+layout.ts` already does `await waitLocale()` before rendering, on both server and client.
2. **Best-practice gaps found in audit:** external Google Fonts request chain (render-blocking, FOUT), one table missing a horizontal-scroll wrapper, no verified mobile behavior at phone widths, month calendars unusable at 360px, thin SEO/social meta on public pages.

**Priority decided by user:** mobile-first, all pages (public and authenticated). Fix everything found, structured as one spec with a phased plan.

## Non-Goals

- No visual redesigns; Phase 2 fixes are bounded to layout/overflow/spacing corrections.
- No shared-component extraction for the two calendar pages (their pill content and modals have diverged; a forced abstraction would couple them).
- No backend or API contract changes.

## Phase 1 — First-load glitch + self-hosted fonts

### 1a. Remove the `$isLoading` guard

`src/routes/+layout.svelte`: delete the `{#if $isLoading}` wrapper and its spinner markup; render `{@render children()}` unconditionally. Drop the now-unused `isLoading` import. `+layout.ts`'s `await waitLocale()` remains the single mechanism guaranteeing translations are loaded before render.

### 1b. Self-host Inter

- Add `@fontsource/inter` (weights 400, 500, 600, 700) as a dependency; import the four weight CSS files at the top of `src/app.css`.
- Remove from `src/app.html`: both `fonts.googleapis.com`/`fonts.gstatic.com` preconnects and the Google Fonts stylesheet `<link>`.
- `tailwind.config.js` `fontFamily.sans` is unchanged (`Inter, system-ui, -apple-system, sans-serif`).
- Vite bundles the woff2 files same-origin with hashed immutable URLs; `@fontsource` CSS uses `font-display: swap`.

### Phase 1 verification

Incognito + DevTools disabled cache + Slow 4G: no spinner swap, no blank frame, no raw i18n keys; network tab shows zero requests to Google Fonts domains.

## Phase 2 — Mobile pass over every route

1. **EarningsTable:** wrap the `<table>` in `src/lib/components/EarningsTable.svelte` in a `<div class="overflow-x-auto">`. It is the only table in the app without one (used by `/reports` and `/admin/reports`).
2. **360px walk of every route**, fixing layout/overflow issues found: landing `/`, `/login`, `/register/teacher`, `/register/student`, `/forgot-password`, `/reset-password`, `/verify-email`, `/teachers`, `/teachers/[id]`, `/students/[id]`, `/dashboard`, `/courses`, `/courses/[id]`, `/calendar` (non-grid parts; grid is Phase 3), `/reports`, `/reports/new`, `/reports/[studentId]`, `/report/share/[token]`, and all admin pages (`/admin`, teachers, students, subjects, courses, calendar non-grid, reports, audit-log). Fix categories: horizontal overflow, cramped base padding (e.g. `p-6` → `p-4 sm:p-6` where needed), chip/badge wrapping, modal fit within viewport, form field widths.
3. Verify the hamburger sidebar drawer at 375px (closes CLAUDE.md known gap #4).

### Phase 2 verification

Each route renders without horizontal body scroll at 360px; interactive elements reachable and tappable; `npm run check` still 0 errors.

## Phase 3 — Calendar mobile: dots + day panel

Applies to `/calendar` and `/admin/calendar`, same pattern implemented in place on each page. Breakpoint: `md` (768px).

- **Below `md`:** day cells hide session pills and instead render up to 3 dots (one per session, using the session's existing color semantics) plus a `+N` overflow count. Tapping a day sets a `selectedDay` state; a **day panel rendered below the grid** lists that day's sessions — time range, `display_title`, recurring `↻` badge. Tapping a session in the panel opens the existing detail/edit modal for that page, unchanged.
- **Selected day default:** today, when the displayed month is the current month; otherwise no selection until tapped.
- **At/above `md`:** current pill rendering and behavior untouched.

### Phase 3 verification

At 360px: month grid fits without overflow, dots visible, day tap opens panel, session tap opens the same modal as desktop; admin flows (edit/delete/recurring) still work from the panel path. Desktop unchanged at 1280px.

## Phase 4 — SEO / social meta

1. **Extend `src/lib/components/SeoAlternates.svelte`** with optional props `title`, `description`, `image`. When provided, additionally emit `<meta name="description">`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale` from current lang), and Twitter card (`summary_large_image`). Existing call sites without the new props keep emitting only canonical/hreflang — backward compatible.
2. **Public pages** pass localized descriptions via i18n keys (EN + ID): landing, `/teachers`, `/teachers/[id]` (description derived from teacher bio when present), `/login`, both registers, `/forgot-password`. `/report/share/[token]` keeps `noindex` and gets no OG tags.
3. **OG image** — the brand kit already ships `static/brand-kit/png/social-card-1200x630.png` (1200×630); use it as the default `og:image` (absolute URL built from the page origin). No new image is produced.
4. **`static/robots.txt`** — allow all, `Sitemap:` pointing at `/sitemap.xml`.
5. **`src/routes/sitemap.xml/+server.ts`** — emits public routes (both language variants: unprefixed ID + `/en` prefix) and featured teacher profile URLs from `GET /teachers/featured`. Origin taken from the request URL.

### Phase 4 verification

`curl` the SSR HTML of `/`, `/en`, `/teachers`, one teacher profile: description/OG/Twitter tags present with correct locale; `curl /sitemap.xml` and `/robots.txt` return valid content; authenticated pages emit no OG tags.

## Delivery

- One or more commits per phase, in phase order; each phase leaves `npm run check` at 0 errors and the app verified in-browser at 360/768/1280.
- All commits local; **no push without explicit user approval** (standing rule).
