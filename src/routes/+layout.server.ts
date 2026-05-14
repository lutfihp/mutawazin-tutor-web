import type { LayoutServerLoad } from './$types';

function decodeJwtPayload(token: string) {
	try {
		const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = atob(base64);
		return JSON.parse(json);
	} catch {
		return null;
	}
}

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('access_token');
	const lang = cookies.get('lang') ?? 'en';

	if (!token) return { user: null, lang };

	const payload = decodeJwtPayload(token);
	if (!payload || payload.exp < Date.now() / 1000) return { user: null, lang };

	return {
		user: {
			id: payload.sub as string,
			role: payload.role as string,
			status: payload.status as string,
		},
		lang,
	};
};
