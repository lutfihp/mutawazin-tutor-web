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
