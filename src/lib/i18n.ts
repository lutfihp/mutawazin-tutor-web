import { browser } from '$app/environment';
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
		localStorage.setItem('lang', lang);
		document.cookie = `lang=${lang};path=/;max-age=31536000;samesite=lax`;
	}
}

export function detectLang(): Lang {
	if (browser) {
		const stored = localStorage.getItem('lang');
		if (stored && SUPPORTED.includes(stored as Lang)) return stored as Lang;
	}
	return DEFAULT_LANG;
}
