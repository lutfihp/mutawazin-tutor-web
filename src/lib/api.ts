const BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		...options,
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...options.headers },
	});

	if (res.status === 401 && retry) {
		const refreshRes = await fetch(`${BASE}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
		if (refreshRes.ok) return request<T>(path, options, false);
		if (typeof window !== 'undefined') window.location.href = '/login';
		throw new Error('Session expired');
	}

	if (!res.ok) {
		const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
		throw new Error(err.detail ?? `HTTP ${res.status}`);
	}

	return res.json() as Promise<T>;
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
	put: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
	patch: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
	upload: <T>(path: string, formData: FormData) =>
		request<T>(path, { method: 'POST', body: formData, headers: {} }),
};

export type AuditLogEntry = {
	id: string;
	actor_id: string;
	actor_email: string | null;
	actor_username: string | null;
	actor_role: string;
	action: 'CREATE' | 'UPDATE' | 'DELETE';
	resource_type: string;
	resource_id: string | null;
	before: Record<string, unknown> | null;
	after: Record<string, unknown> | null;
	endpoint: string;
	method: string;
	timestamp: string;
};

export type AuditLogListResponse = {
	total: number;
	page: number;
	page_size: number;
	items: AuditLogEntry[];
};
