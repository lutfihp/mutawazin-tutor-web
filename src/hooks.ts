import type { Reroute } from '@sveltejs/kit';

// /en/* serves the English version of public pages. Strip the prefix so
// /en/teachers matches src/routes/teachers — no route files are duplicated.
// The browser URL and event.url keep the /en prefix; only matching changes.
export const reroute: Reroute = ({ url }) => {
	if (url.pathname === '/en') return '/';
	if (url.pathname.startsWith('/en/')) return url.pathname.slice(3);
};
