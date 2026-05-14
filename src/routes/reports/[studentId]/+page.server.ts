import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role === 'student' && locals.user.id !== params.studentId) {
		throw redirect(302, '/dashboard');
	}
	return { studentId: params.studentId };
};
