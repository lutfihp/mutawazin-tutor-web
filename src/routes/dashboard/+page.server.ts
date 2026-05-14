import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role === 'admin') throw redirect(302, '/admin');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };
	const endpoint = locals.user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

	try {
		const res = await fetch(`${BASE}${endpoint}`, { headers });
		const dashboardData = res.ok ? await res.json() : {};
		return { dashboardData, role: locals.user.role };
	} catch {
		return { dashboardData: {}, role: locals.user.role };
	}
};
