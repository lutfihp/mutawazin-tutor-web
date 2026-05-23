import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };

	const res = await fetch(`${BASE}/courses/${params.id}`, { headers });
	if (res.status === 404) throw error(404, 'Course not found');
	if (!res.ok) throw error(500, 'Failed to load course');

	const course = await res.json();
	return { course, user: locals.user };
};
