import type { PageServerLoad } from './$types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const token = cookies.get('access_token');
	const headers: HeadersInit = token ? { Cookie: `access_token=${token}` } : {};

	try {
		const res = await fetch(`${BASE}/teachers/${params.id}`, { headers });
		const profile = res.ok ? await res.json() : null;
		return { profile };
	} catch {
		return { profile: null };
	}
};
