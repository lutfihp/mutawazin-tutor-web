import type { Handle } from '@sveltejs/kit';

function decodeJwtPayload(token: string) {
	try {
		const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = atob(base64);
		return JSON.parse(json);
	} catch {
		return null;
	}
}

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

	// A /en visit is an explicit language signal → set cookie. An unprefixed
	// public visit sets 'id' only when NO cookie exists — never overwrite an
	// authenticated user's preference just because they passed through the
	// landing page. httpOnly:false — the Navbar toggle overwrites this cookie
	// from document.cookie.
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
