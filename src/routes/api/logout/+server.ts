import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

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

	// Delete both auth cookies — same-origin from SvelteKit, always honored by browser
	cookies.delete('access_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });

	return json({ ok: true });
};
