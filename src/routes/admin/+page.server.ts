import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/login');

	const token = cookies.get('access_token');
	const headers = { Cookie: `access_token=${token}` };

	try {
		const [stats, pendingTeachers, pendingStudents, pendingSubjects] = await Promise.all([
			fetch(`${BASE}/admin/stats`, { headers }).then((r) => (r.ok ? r.json() : {})),
			fetch(`${BASE}/admin/teachers?status=email_verified`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
			fetch(`${BASE}/admin/students?status=email_verified`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
			fetch(`${BASE}/admin/subjects?status=pending`, { headers }).then((r) =>
				r.ok ? r.json().then((b: any) => b.data ?? []) : []
			),
		]);
		return { stats, pendingTeachers, pendingStudents, pendingSubjects };
	} catch {
		return { stats: {}, pendingTeachers: [], pendingStudents: [], pendingSubjects: [] };
	}
};
