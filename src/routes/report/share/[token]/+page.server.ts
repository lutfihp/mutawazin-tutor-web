import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const res = await fetch(`${BASE}/reports/share/${params.token}`);
		if (res.ok) {
			const report = await res.json();
			return { report, error: null };
		}
		if (res.status === 410) return { report: null, error: 'expired' };
		return { report: null, error: 'invalid' };
	} catch {
		return { report: null, error: 'invalid' };
	}
};
