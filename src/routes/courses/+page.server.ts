import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');

	const token = cookies.get('access_token');
	const headers: HeadersInit = token ? { Cookie: `access_token=${token}` } : {};

	try {
		const res = await fetch(`${BASE}/courses?page=1&limit=12`, { headers });
		const body = res.ok ? await res.json() : null;
		return {
			courses: body?.data ?? [],
			totalPages: body?.pagination?.totalPages ?? 1,
		};
	} catch {
		return { courses: [], totalPages: 1 };
	}
};
