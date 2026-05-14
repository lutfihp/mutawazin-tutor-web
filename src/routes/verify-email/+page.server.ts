import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const purpose = url.searchParams.get('purpose');

	if (!token) return { success: false, purpose: null, error: 'missing' };

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const res = await fetch(`${BASE}/auth/verify-email?token=${token}`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (res.ok) {
			const data = await res.json();
			return { success: true, purpose: (data.purpose ?? purpose) as string };
		}
		return { success: false, purpose, error: 'expired' };
	} catch {
		return { success: false, purpose, error: 'expired' };
	}
};
