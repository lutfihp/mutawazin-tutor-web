# URL-Based Language Routing (SEO) — Design

**Date:** 2026-07-17
**Status:** Approved
**Repo:** mutawazin-tutor-web (frontend only — no backend changes)

## Goal

Make the public site's language part of the URL for SEO. Indonesian is the
primary language and uses unprefixed URLs (`/teachers`); English uses an `/en`
prefix (`/en/teachers`). Search engines see two crawlable, cross-linked
language versions of every public page instead of one cookie-dependent page.

## Current state (what changes)

- Language is cookie/localStorage-based via `svelte-i18n` (`src/lib/i18n.ts`),
  toggled by buttons in `Navbar.svelte`. URLs never change with language.
- `app.html` hardcodes `<html lang="en">`.
- `+layout.server.ts` falls back to `'en'` when no `lang` cookie exists, even
  though `DEFAULT_LANG` is `'id'`.
- Architecture note in `CLAUDE.md` says "Cookie-based lang (no URL prefix
  changes)" — this decision is deliberately superseded by this spec.

## Decisions made

| Decision | Choice |
|---|---|
| URL scope | Public pages only. Authenticated pages (dashboard, admin, calendar, reports) keep cookie-based language — no SEO benefit behind login. |
| URL scheme | Indonesian = no prefix (default). English = `/en` prefix. No `/id` prefix ever exists. |
| Implementation | SvelteKit `reroute` hook (Approach A). No route-tree restructuring, no i18n library swap. |
| SEO extras | hreflang + canonical tags + correct `<html lang>`. Sitemap and robots.txt deferred to a follow-up. |
| Locale authority | On public pages the URL is authoritative — never redirect based on cookie (search engines penalize this). On authenticated pages the cookie is authoritative. |

## Design

### 1. Routing & locale resolution

- **`src/hooks.ts` (new)** — universal `reroute` hook: if the pathname is
  `/en` or starts with `/en/`, strip the prefix before route matching.
  `/en/teachers` → matches `src/routes/teachers`; `/en` → matches `/`.
  No route files move.
- **`src/hooks.server.ts`** — derive the request locale:
  - Path starts with `/en` → `en`.
  - Otherwise, public path → `id` (URL-authoritative, even if the visitor's
    cookie says `en` — same content for users and crawlers, no cloaking).
  - Otherwise (authenticated pages) → `lang` cookie, default `id`.
  - Public paths are an explicit prefix list in the hook: `/`, `/teachers`,
    `/login`, `/register`, `/forgot-password`, `/reset-password`,
    `/verify-email`, `/report/share`.
  - Cookie updates (so language survives into the authenticated area):
    - Visit to `/en/*` → set `lang=en` (explicit signal).
    - Visit to an unprefixed public page → set `lang=id` **only if no cookie
      exists yet**. Never overwrite an existing cookie from an unprefixed
      visit — otherwise an authenticated English-preference user passing
      through the landing page would have their dashboard flipped to
      Indonesian.
    - The Navbar toggle click also sets the cookie via `setLang()` before
      navigating, so an explicit switch to Indonesian does propagate.
  - Replace the `<html lang>` placeholder per-request via `transformPageChunk`.
- **`src/app.html`** — `lang="en"` becomes a placeholder (e.g. `%lang%`)
  substituted by the handle hook.
- **`src/routes/+layout.server.ts`** — return the locale resolved by the hook;
  fix the `'en'` fallback to `'id'`.

### 2. Links & language toggle

- **`localizeHref(path, locale)` helper in `src/lib/i18n.ts`** — prepends
  `/en` when locale is `en`, returns `path` unchanged for `id`.
- Only links between public pages use it: landing page nav/footer/cards,
  Navbar logo + login/register links, `/teachers` directory cards,
  auth-page cross-links (login ↔ register ↔ forgot-password).
  Authenticated-area links are untouched.
- **Navbar toggle on public pages** becomes real `<a>` links pointing at the
  current page's alternate-language URL (`/teachers` ↔ `/en/teachers`) —
  crawlable language switching. On authenticated pages the toggle keeps its
  current button + `setLang()` cookie behavior.

### 3. hreflang + canonical tags

- **`src/lib/components/SeoAlternates.svelte` (new)** — emits into
  `<svelte:head>`, built from `$page.url.origin` + the unprefixed pathname
  (absolute URLs, no hardcoded domain):
  - `<link rel="canonical">` — the page's own URL (Indonesian pages
    canonicalize unprefixed, English pages to `/en/...` — the versions are
    alternates, not duplicates).
  - `<link rel="alternate" hreflang="id">` → unprefixed URL.
  - `<link rel="alternate" hreflang="en">` → `/en` URL.
  - `<link rel="alternate" hreflang="x-default">` → unprefixed (Indonesian)
    URL.
- Rendered on the indexable public pages: landing, `/teachers`,
  `/teachers/[id]`, `/login`, `/register/teacher`, `/register/student`,
  `/forgot-password`.
- **`/report/share/[token]`** gets `<meta name="robots" content="noindex">`
  instead — token URLs must not be indexed.

### 4. SSR completeness fixes (required for the SEO work to pay off)

- **`await waitLocale()` in `src/routes/+layout.ts`** — svelte-i18n loads
  locale JSON asynchronously and the layout load currently returns without
  waiting, so server-rendered HTML can contain raw i18n keys instead of
  translated text. `setupI18n(lang)` followed by `await waitLocale()` ensures
  every server response contains fully translated content.
- **`/teachers` directory becomes SSR-loaded** — new
  `src/routes/teachers/+page.server.ts` fetches `GET /teachers/featured`
  server-side; `+page.svelte` initializes from `data` and drops the `onMount`
  fetch. Crawlers currently receive an empty grid; after this they get the
  full teacher list (names + profile links) in the initial HTML. Follows the
  existing courses-SSR pattern (`src/routes/courses/+page.server.ts`).

### 5. Cleanup rolled in

- Remove the localStorage read in `detectLang()` and the localStorage write in
  `setLang()` — the `lang` cookie becomes the single client-side persistence.
- Update the `CLAUDE.md` architecture note from "Cookie-based lang (no URL
  prefix changes)" to describe this scheme.

## Edge cases

- `/en` alone → landing page in English.
- `/en/en/...` or unknown prefixed paths → natural 404, no special handling.
- Direct visit to `/en/dashboard` → renders (reroute is global), sets the `en`
  cookie; all in-app links are unprefixed so the prefix self-corrects on the
  next navigation. No guard needed.
- Existing unprefixed bookmarks keep working, rendered Indonesian on public
  pages. Authenticated pages still honor the visitor's `en` cookie.
- Authenticated user with `en` cookie browses the unprefixed landing page →
  page renders Indonesian (URL wins on public pages) but their cookie and
  dashboard language are untouched.

## Out of scope

- sitemap.xml and robots.txt (follow-up work).
- Translating slugs or content URLs (IDs stay language-neutral).
- Any backend change.
- `/id` prefix or any redirect from `/` based on browser language.

## Testing

- `npm run check` — 0 errors (16 pre-existing warnings allowed).
- Manual dev pass:
  1. `/` renders Indonesian; view-source shows `<html lang="id">`, canonical,
     and both hreflang alternates.
  2. `/en` and `/en/teachers` render English with `<html lang="en">` and
     mirrored hreflang tags.
  3. Toggle on `/teachers` navigates to `/en/teachers` and back.
  4. Log in from `/en/login` → dashboard is English; from `/login` →
     dashboard is Indonesian.
  5. `/report/share/<token>` responds with the noindex meta tag.
  6. View-source (not devtools) of `/` and `/en` contains real translated
     text — no raw i18n keys (verifies `waitLocale`).
  7. View-source of `/teachers` contains the featured teachers' names and
     profile links (verifies the SSR data load).
