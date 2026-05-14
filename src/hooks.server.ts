import type { Handle } from '@sveltejs/kit';

function decodeJwtPayload(token: string) {
	try {
		const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = atob(base64);
		return JSON.parse(json);
	} catch {
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('access_token');

	if (token) {
		const payload = decodeJwtPayload(token);
		if (payload && payload.exp > Date.now() / 1000) {
			event.locals.user = {
				id: payload.sub as string,
				role: payload.role as string,
				status: payload.status as string,
			};
		} else {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
