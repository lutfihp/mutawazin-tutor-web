import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Handles logout server-side so cookies are deleted via a same-origin Set-Cookie response.
// Relying on the backend's cross-origin delete_cookie is unreliable in some browsers/configs.
export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('access_token');

	if (token) {
		try {
			await fetch(`${API_URL}/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: '{}',
			});
		} catch {}
	}

	// Build delete options matching the attributes used when the backend set these cookies.
	// In production, the backend sets Domain=COOKIE_DOMAIN (e.g. mutawazinprivate.com) so the
	// cookie is shared across subdomains. Without matching domain here, the browser sees the
	// deletion as targeting a different (host-only) cookie and the domain cookie is never removed.
	const cookieDomain = env.COOKIE_DOMAIN || undefined;
	const cookieSecure = env.COOKIE_SECURE === 'true';
	type DeleteOpts = Parameters<typeof cookies.delete>[1];
	const deleteOpts: DeleteOpts = { path: '/' };
	if (cookieDomain) deleteOpts.domain = cookieDomain;
	if (cookieSecure) {
		deleteOpts.secure = true;
		deleteOpts.sameSite = 'none';
	}

	cookies.delete('access_token', deleteOpts);
	cookies.delete('refresh_token', deleteOpts);

	return json({ ok: true });
};
