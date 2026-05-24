import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, locals, request }) => {
	if (!locals.user) throw redirect(302, '/login');

	const cookie = request.headers.get('cookie') ?? '';
	const headers = { Cookie: cookie };

	try {
		const [profile, reports] = await Promise.all([
			fetch(`${BASE}/students/${params.id}`, { headers }).then((r) => (r.ok ? r.json() : null)),
			fetch(`${BASE}/students/${params.id}/reports`, { headers }).then((r) =>
				r.ok ? r.json() : []
			),
		]);
		return { profile, reports };
	} catch {
		return { profile: null, reports: [] };
	}
};
