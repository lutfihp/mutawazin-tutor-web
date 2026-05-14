import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async () => {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const res = await fetch(`${BASE}/teachers/featured`, { signal: controller.signal });
		clearTimeout(timeout);
		const featuredTeachers = res.ok ? await res.json() : [];
		return { featuredTeachers };
	} catch {
		return { featuredTeachers: [] };
	}
};
