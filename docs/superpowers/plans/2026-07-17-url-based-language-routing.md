# URL-Based Language Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve Indonesian at unprefixed URLs and English at `/en/*` on public pages, with hreflang/canonical tags and fully-translated SSR HTML, so both language versions are crawlable.

**Architecture:** A SvelteKit `reroute` hook strips the `/en` prefix before route matching (no route files move). `hooks.server.ts` derives the locale from the URL on public pages (cookie on authenticated pages), sets the `lang` cookie, and stamps `<html lang>`. A derived store `lhref` localizes public-page links; a `SeoAlternates` component emits hreflang/canonical tags. `waitLocale()` guarantees translated SSR output, and `/teachers` moves its data fetch server-side.

**Tech Stack:** SvelteKit 2.57, Svelte 5 (runes), svelte-i18n, TypeScript.

**Spec:** `docs/superpowers/specs/2026-07-17-url-based-language-design.md`

**Repo:** All paths relative to `mutawazin-tutor-web/`. There is no unit-test framework in this repo — verification is `npm run check` (must stay at 0 errors) plus curl checks against the dev server (final task).

---

### Task 1: Reroute hook — `/en/*` matches existing routes

**Files:**
- Create: `src/hooks.ts`

- [ ] **Step 1: Create the universal reroute hook**

`src/hooks.ts` (new file — SvelteKit picks up `reroute` from here automatically):

```ts
import type { Reroute } from '@sveltejs/kit';

// /en/* serves the English version of public pages. Strip the prefix so
// /en/teachers matches src/routes/teachers — no route files are duplicated.
// The browser URL and event.url keep the /en prefix; only matching changes.
export const reroute: Reroute = ({ url }) => {
	if (url.pathname === '/en') return '/';
	if (url.pathname.startsWith('/en/')) return url.pathname.slice(3);
};
```

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks.ts
git commit -m "feat(i18n): reroute hook maps /en/* to existing routes"
```

---

### Task 2: Server-side locale resolution + `<html lang>`

**Files:**
- Modify: `src/hooks.server.ts`
- Modify: `src/app.d.ts`
- Modify: `src/app.html:2`

- [ ] **Step 1: Add `lang` to `App.Locals`**

`src/app.d.ts` — replace the `Locals` interface:

```ts
		interface Locals {
			user: { id: string; role: string; status: string } | null;
			lang: 'en' | 'id';
		}
```

- [ ] **Step 2: Derive locale in `hooks.server.ts`**

Replace the whole `handle` export in `src/hooks.server.ts` (keep `decodeJwtPayload` unchanged above it):

```ts
// Paths reachable without auth. On these, the URL decides the language
// (crawlers have no cookies — URL must be authoritative, never redirect).
const PUBLIC_PREFIXES = [
	'/teachers',
	'/login',
	'/register',
	'/forgot-password',
	'/reset-password',
	'/verify-email',
	'/report/share',
];

function isPublicPath(path: string): boolean {
	return path === '/' || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('access_token');

	if (token) {
		const payload = decodeJwtPayload(token);
		if (payload && payload.exp > Date.now() / 1000) {
			event.locals.user = {
				id: payload.sub as string,
				role: payload.role as string,
				status: payload.status as string,
			};
		} else {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	// --- locale resolution ---
	const rawPath = event.url.pathname; // reroute does NOT strip /en here
	const isEn = rawPath === '/en' || rawPath.startsWith('/en/');
	const stripped = isEn ? rawPath.slice(3) || '/' : rawPath;
	const cookieLang = event.cookies.get('lang');

	let lang: 'en' | 'id';
	if (isEn) {
		lang = 'en';
	} else if (isPublicPath(stripped)) {
		lang = 'id';
	} else {
		lang = cookieLang === 'en' ? 'en' : 'id';
	}
	event.locals.lang = lang;

	// Cookie rules (spec §1): /en visit is an explicit signal → set cookie.
	// Unprefixed public visit sets 'id' only when NO cookie exists — never
	// overwrite an authenticated user's preference just because they passed
	// through the landing page. httpOnly:false — the Navbar toggle overwrites
	// this cookie from document.cookie.
	const cookieOpts = { path: '/', maxAge: 31536000, httpOnly: false, sameSite: 'lax' } as const;
	if (isEn && cookieLang !== 'en') {
		event.cookies.set('lang', 'en', cookieOpts);
	} else if (!isEn && isPublicPath(stripped) && !cookieLang) {
		event.cookies.set('lang', 'id', cookieOpts);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang),
	});
};
```

- [ ] **Step 3: Placeholder in `app.html`**

`src/app.html` line 2 — change:

```html
<html lang="en" class="h-full">
```

to:

```html
<html lang="%lang%" class="h-full">
```

- [ ] **Step 4: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks.server.ts src/app.d.ts src/app.html
git commit -m "feat(i18n): URL-derived locale, lang cookie rules, dynamic html lang"
```

---

### Task 3: Layout wiring — locale from locals + `waitLocale()`

**Files:**
- Modify: `src/routes/+layout.server.ts`
- Modify: `src/routes/+layout.ts`

- [ ] **Step 1: Simplify `+layout.server.ts`**

The JWT decode here duplicates `hooks.server.ts` (which already populates `locals`). Replace the entire file:

```ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user, lang: locals.lang };
};
```

- [ ] **Step 2: Await translations before SSR renders**

Replace `src/routes/+layout.ts`:

```ts
import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { user } from '$lib/stores/auth';
import { setupI18n } from '$lib/i18n';

export const load: LayoutLoad = async ({ data }) => {
	user.set(data.user as Parameters<typeof user.set>[0]);
	setupI18n(data.lang);
	// svelte-i18n loads locale JSON async; without this, server-rendered
	// HTML can contain raw i18n keys instead of translated text.
	await waitLocale();
	return data;
};
```

- [ ] **Step 3: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.server.ts src/routes/+layout.ts
git commit -m "feat(i18n): locale from locals + waitLocale for translated SSR"
```

---

### Task 4: i18n helpers — `lhref`, `altLangHref`, cookie-only persistence

**Files:**
- Modify: `src/lib/i18n.ts`

- [ ] **Step 1: Rewrite `src/lib/i18n.ts`**

Full new content (changes: `lhref` derived store, `altLangHref`, `setLang` drops localStorage, unused `detectLang` deleted):

```ts
import { browser } from '$app/environment';
import { derived } from 'svelte/store';
import { init, register, locale } from 'svelte-i18n';

const SUPPORTED = ['en', 'id'] as const;
export type Lang = (typeof SUPPORTED)[number];
export const DEFAULT_LANG: Lang = 'id';

register('en', () => import('../locales/en.json'));
register('id', () => import('../locales/id.json'));

export function setupI18n(lang: string = DEFAULT_LANG) {
	const l = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : DEFAULT_LANG;
	init({
		fallbackLocale: 'en',
		initialLocale: l,
	});
}

export function setLang(lang: Lang) {
	locale.set(lang);
	if (browser) {
		document.cookie = `lang=${lang};path=/;max-age=31536000;samesite=lax`;
	}
}

/** Strip a leading /en prefix from a pathname. */
export function stripLangPrefix(pathname: string): string {
	if (pathname === '/en') return '/';
	if (pathname.startsWith('/en/')) return pathname.slice(3);
	return pathname;
}

/**
 * Localize an internal link for the current locale. PUBLIC pages only —
 * Indonesian URLs are unprefixed, English gets /en. Usage: href={$lhref('/login')}
 */
export const lhref = derived(locale, ($locale) => (path: string): string => {
	if ($locale !== 'en') return path;
	return path === '/' ? '/en' : `/en${path}`;
});

/** The current page's URL in a target language (Navbar language toggle). */
export function altLangHref(pathname: string, target: Lang): string {
	const base = stripLangPrefix(pathname);
	if (target === 'en') return base === '/' ? '/en' : `/en${base}`;
	return base;
}
```

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: 0 errors (`detectLang` had no call sites; `localStorage` reads are gone).

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n.ts
git commit -m "feat(i18n): lhref/altLangHref helpers, cookie-only lang persistence"
```

---

### Task 5: Navbar — crawlable toggle links + localized landing links

**Files:**
- Modify: `src/lib/components/layout/Navbar.svelte`

- [ ] **Step 1: Update imports and add toggle branching**

In the `<script>` block, change the i18n import line:

```ts
	import { setLang, altLangHref, lhref, type Lang } from '$lib/i18n';
```

The `switchLang` function stays (used by the authenticated button variant).

- [ ] **Step 2: Language switcher — links when logged out, buttons when logged in**

Replace the `{#each (['en', 'id'] as Lang[]) as lang}` block (lines ~99–111) with:

```svelte
		{#each (['en', 'id'] as Lang[]) as lang}
			{#if $user}
				<button
					onclick={() => switchLang(lang)}
					class="px-2.5 py-1 text-xs font-medium rounded-pill transition-all duration-120
					       {currentLang === lang
						? 'bg-white text-text shadow-sm'
						: 'text-text2 hover:text-text'}"
					aria-pressed={currentLang === lang}
					aria-label={lang === 'en' ? 'English' : 'Bahasa Indonesia'}
				>
					{lang.toUpperCase()}
				</button>
			{:else}
				<!-- Public pages: real links so crawlers discover both language versions.
				     data-sveltekit-reload forces SSR so the server re-resolves the locale.
				     onclick sets the cookie so an explicit switch survives into the app. -->
				<a
					href={altLangHref($page.url.pathname, lang)}
					data-sveltekit-reload
					onclick={() => setLang(lang)}
					class="px-2.5 py-1 text-xs font-medium rounded-pill transition-all duration-120
					       {currentLang === lang
						? 'bg-white text-text shadow-sm'
						: 'text-text2 hover:text-text'}"
					aria-current={currentLang === lang ? 'page' : undefined}
					aria-label={lang === 'en' ? 'English' : 'Bahasa Indonesia'}
				>
					{lang.toUpperCase()}
				</a>
			{/if}
		{/each}
```

- [ ] **Step 3: Localize the logged-out links**

- `<Logo />` (line ~79) → `<Logo href={$lhref('/')} />`
- Landing nav (lines ~84–87): `href="/"` → `href={$lhref('/')}`; `href="/#courses"` → `href="{$lhref('/')}#courses"` (same for `#teachers`, `#about`; note `$lhref('/')` returns `/en`, so the English result is `/en#courses`).
- Login CTA (line ~130): `href="/login"` → `href={$lhref('/login')}`.

Leave all authenticated-branch links (`profileHref`, logout) untouched.

- [ ] **Step 4: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/layout/Navbar.svelte
git commit -m "feat(i18n): Navbar language toggle is link-based on public pages"
```

---

### Task 6: Localize internal links on all public pages

**Files (all Modify):**
- `src/routes/+page.svelte` (landing)
- `src/routes/login/+page.svelte`
- `src/routes/register/teacher/+page.svelte`
- `src/routes/register/student/+page.svelte`
- `src/routes/forgot-password/+page.svelte`
- `src/routes/reset-password/+page.svelte`
- `src/routes/verify-email/+page.svelte`
- `src/routes/teachers/+page.svelte`

- [ ] **Step 1: Add the import to each file**

In each file's `<script>` block add:

```ts
	import { lhref } from '$lib/i18n';
```

- [ ] **Step 2: Wrap every internal href**

Exact call sites (verified by grep — if you find another internal `href="/..."` on these pages, wrap it the same way; skip `#hash`, `mailto:`, and external URLs):

| File | Line (approx) | Change |
|---|---|---|
| `+page.svelte` | 92 | `href="/register/student"` → `href={$lhref('/register/student')}` |
| `+page.svelte` | 95 | `href="/register/teacher"` → `href={$lhref('/register/teacher')}` |
| `+page.svelte` | 247 | `href="/teachers/{teacher.user_id}"` → `href={$lhref(`/teachers/${teacher.user_id}`)}` |
| `+page.svelte` | 259 | `href="/teachers"` → `href={$lhref('/teachers')}` |
| `login/+page.svelte` | 48 | `href="/"` → `href={$lhref('/')}` |
| `login/+page.svelte` | 107 | `href="/forgot-password"` → `href={$lhref('/forgot-password')}` |
| `login/+page.svelte` | 120 | `href="/register/teacher"` → `href={$lhref('/register/teacher')}` |
| `login/+page.svelte` | 124 | `href="/register/student"` → `href={$lhref('/register/student')}` |
| `register/teacher/+page.svelte` | 67, 79 | both `href="/"` → `href={$lhref('/')}` |
| `register/teacher/+page.svelte` | 193 | `href="/login"` → `href={$lhref('/login')}` |
| `register/student/+page.svelte` | 49, 61 | both `href="/"` → `href={$lhref('/')}` |
| `register/student/+page.svelte` | 125 | `href="/login"` → `href={$lhref('/login')}` |
| `forgot-password/+page.svelte` | 34 | `href="/"` → `href={$lhref('/')}` |
| `forgot-password/+page.svelte` | 47, 67 | both `href="/login"` → `href={$lhref('/login')}` |
| `reset-password/+page.svelte` | 52 | `href="/"` → `href={$lhref('/')}` |
| `reset-password/+page.svelte` | 73 | `href="/forgot-password"` → `href={$lhref('/forgot-password')}` |
| `verify-email/+page.svelte` | 66 | `href="/"` → `href={$lhref('/')}` |
| `verify-email/+page.svelte` | 84 | `href={cfg.ctaHref}` → `href={$lhref(cfg.ctaHref)}` |
| `teachers/+page.svelte` | 81 | `href="/teachers/{teacher.user_id}"` → `href={$lhref(`/teachers/${teacher.user_id}`)}` |
| `teachers/+page.svelte` | 93 | `href="/"` → `href={$lhref('/')}` |

(`{$lhref(\`/teachers/${teacher.user_id}\`)}` uses a JS template literal inside the Svelte expression.)

- [ ] **Step 3: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes
git commit -m "feat(i18n): localize internal links on public pages via lhref"
```

---

### Task 7: hreflang/canonical tags + noindex on share page

**Files:**
- Create: `src/lib/components/SeoAlternates.svelte`
- Modify: `src/routes/+page.svelte`, `src/routes/teachers/+page.svelte`, `src/routes/teachers/[id]/+page.svelte`, `src/routes/login/+page.svelte`, `src/routes/register/teacher/+page.svelte`, `src/routes/register/student/+page.svelte`, `src/routes/forgot-password/+page.svelte`
- Modify: `src/routes/report/share/[token]/+page.svelte`

- [ ] **Step 1: Create the component**

`src/lib/components/SeoAlternates.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { stripLangPrefix } from '$lib/i18n';

	// $page.url keeps the original /en prefix (reroute only changes matching).
	const base = $derived(stripLangPrefix($page.url.pathname));
	const isEn = $derived($page.url.pathname === '/en' || $page.url.pathname.startsWith('/en/'));
	const idUrl = $derived($page.url.origin + base);
	const enUrl = $derived($page.url.origin + (base === '/' ? '/en' : `/en${base}`));
</script>

<svelte:head>
	<!-- Each language version is its own canonical (alternates, not duplicates). -->
	<link rel="canonical" href={isEn ? enUrl : idUrl} />
	<link rel="alternate" hreflang="id" href={idUrl} />
	<link rel="alternate" hreflang="en" href={enUrl} />
	<link rel="alternate" hreflang="x-default" href={idUrl} />
</svelte:head>
```

- [ ] **Step 2: Render it on the indexable public pages**

In each of these 7 files — `src/routes/+page.svelte`, `teachers/+page.svelte`, `teachers/[id]/+page.svelte`, `login/+page.svelte`, `register/teacher/+page.svelte`, `register/student/+page.svelte`, `forgot-password/+page.svelte` — add the import:

```ts
	import SeoAlternates from '$lib/components/SeoAlternates.svelte';
```

and render `<SeoAlternates />` as the first element after the `<script>` block. Where a `<svelte:head>` already exists (e.g. `teachers/+page.svelte:28`), place `<SeoAlternates />` adjacent to it — multiple `<svelte:head>` blocks merge fine.

- [ ] **Step 3: noindex the token share page**

`src/routes/report/share/[token]/+page.svelte` — inside its `<svelte:head>` (add the block if missing):

```svelte
<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>
```

- [ ] **Step 4: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SeoAlternates.svelte src/routes
git commit -m "feat(seo): hreflang + canonical tags on public pages, noindex share page"
```

---

### Task 8: `/teachers` — server-side data load

**Files:**
- Create: `src/routes/teachers/+page.server.ts`
- Modify: `src/routes/teachers/+page.svelte`

- [ ] **Step 1: Create the server load**

`src/routes/teachers/+page.server.ts` (same pattern as the landing `src/routes/+page.server.ts`, minus the dashboard redirect — this page is viewable while logged in):

```ts
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async () => {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const res = await fetch(`${BASE}/teachers/featured`, { signal: controller.signal });
		clearTimeout(timeout);
		const data = res.ok ? await res.json() : [];
		return { featuredTeachers: Array.isArray(data) ? data : [] };
	} catch {
		return { featuredTeachers: [] };
	}
};
```

- [ ] **Step 2: Consume SSR data in the page**

`src/routes/teachers/+page.svelte` — replace the top of the `<script>` block. Delete the `onMount` import/usage, `BASE`, `teachers` state, and `loading` state; add:

```ts
	let { data } = $props();
	const teachers = $derived(data.featuredTeachers ?? []);
```

In the template, delete the `{#if loading}` spinner branch entirely, so it reads:

```svelte
		{#if teachers.length === 0}
			<p class="text-center text-text2 py-20">{$t('common.noResults')}</p>
		{:else}
```

(the rest of the grid is unchanged).

- [ ] **Step 3: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/teachers/+page.server.ts src/routes/teachers/+page.svelte
git commit -m "feat(seo): /teachers renders teacher grid server-side"
```

---

### Task 9: Docs + end-to-end verification

**Files:**
- Modify: `CLAUDE.md` (mutawazin-tutor-web)

- [ ] **Step 1: Update the architecture note**

In `CLAUDE.md`'s "Architecture Decisions" table, replace the **svelte-i18n** row's description with:

```
**svelte-i18n + URL-based locale on public pages** | Indonesian = unprefixed URLs (default/x-default), English = `/en` prefix, stripped by the `reroute` hook in `src/hooks.ts` (no route files move). Locale resolution in `hooks.server.ts`: `/en/*` → en; other public paths → id (URL-authoritative, never redirect); authenticated paths → `lang` cookie. Public-page links use `$lhref('/path')` from `src/lib/i18n.ts`; the Navbar toggle is a crawlable `<a data-sveltekit-reload>` when logged out, a button when logged in. `SeoAlternates.svelte` emits canonical + hreflang. `+layout.ts` awaits `waitLocale()` so SSR HTML is always translated. `$t('key')` usage everywhere is unchanged.
```

- [ ] **Step 2: Full type check**

Run: `npm run check`
Expected: 0 errors, 16 pre-existing warnings.

- [ ] **Step 3: Start the dev server (background)**

Run: `npm run dev` (background). Backend at `localhost:8000` should be running for the `/teachers` data check; if it isn't, that single check shows an empty grid instead — note it and continue.

- [ ] **Step 4: Verify SSR output with curl (view-source level, no JS)**

```bash
curl -s http://localhost:5173/ | grep -E 'html lang|hreflang|canonical'
# Expect: lang="id", canonical → /, hreflang id → /, en → /en, x-default → /

curl -s http://localhost:5173/en | grep -E 'html lang|hreflang|canonical'
# Expect: lang="en", canonical → /en

curl -s http://localhost:5173/en/teachers | grep -E 'html lang|/en/teachers'
# Expect: lang="en"; page renders (reroute matched /teachers)

curl -s http://localhost:5173/ | grep -E 'landing\.|nav\.'
# Expect: NO output — raw i18n keys in HTML would mean waitLocale failed

curl -s http://localhost:5173/teachers | grep 'teachers/'
# Expect: teacher profile links present in initial HTML (SSR data load works)

curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/en/en/teachers
# Expect: 404
```

- [ ] **Step 5: Browser checks (manual)**

1. On `/teachers`, click **EN** → lands on `/en/teachers`, content in English; click **ID** → back to `/teachers`, Indonesian.
2. Log in from `/en/login` → dashboard renders in English. Log out; clear cookies; log in from `/login` → dashboard in Indonesian.
3. As the logged-in English user, visit `/` → redirected to dashboard (unchanged behavior); visit `/teachers` → page shows Indonesian? **No** — `/teachers` is public so it renders Indonesian by URL, but the dashboard stays English (cookie untouched). Verify the dashboard is still English afterwards.
4. `/report/share/<any-token>` view-source contains `noindex`.

- [ ] **Step 6: Commit docs**

```bash
git add CLAUDE.md
git commit -m "docs: record URL-based language routing architecture decision"
```
