import type { RequestHandler } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Public, indexable routes. ID = unprefixed, EN = /en prefix.
const PUBLIC_PATHS = ['/', '/teachers', '/login', '/register/teacher', '/register/student', '/forgot-password'];

export const GET: RequestHandler = async ({ url, fetch }) => {
	let teacherPaths: string[] = [];
	try {
		const res = await fetch(`${BASE}/teachers/featured`);
		if (res.ok) {
			const body = await res.json();
			const list = Array.isArray(body) ? body : (body?.data ?? []);
			teacherPaths = list.map((t: any) => `/teachers/${t.user_id ?? t.id}`);
		}
	} catch {
		// API down — sitemap is still valid with static paths only
	}

	const paths = [...PUBLIC_PATHS, ...teacherPaths];
	const entries = paths
		.flatMap((p) => [url.origin + p, url.origin + (p === '/' ? '/en' : `/en${p}`)])
		.map((loc) => `\t<url><loc>${loc}</loc></url>`)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
