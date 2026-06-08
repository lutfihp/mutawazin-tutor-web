const BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
	const method = (options.method ?? 'GET').toUpperCase();
	const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
	const res = await fetch(`${BASE}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			...(hasBody && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
			...options.headers,
		},
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

export function assetUrl(path: string | null | undefined): string | undefined {
	if (!path) return undefined;
	if (path.startsWith('http')) return path;
	return `${BASE}${path}`;
}

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

export type PaginationMeta = {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

export type PaginatedResponse<T> = {
	data: T[];
	pagination: PaginationMeta;
};

export type DashboardReportItem = {
	id: string;
	session_id: string;
	student_id: string;
	teacher_id: string;
	scores: { topic: string; score: number; max_score: number }[];
	notes: string | null;
	created_at: string;
	subject_name: string | null;
	student_name: string | null;
	session_date: string | null;
};

export type TeacherProfileResponse = {
	id: string;
	user_id: string;
	full_name: string;
	photo_url: string | null;
	bio: string;
	teaching_mode: string;
	city: string | null;
	university: string | null;
	teaching_experience: Array<{ year_from: number; year_to: number | null; subject: string }>;
	achievements: string[];
	subjects: string[];
	credentials: Array<{ title: string; institution: string; year: number | null }>;
	is_featured: boolean;
	courses: Array<{ id: string; name: string; age_categories: string[]; description: string | null }>;
	average_rating: number | null;
	total_ratings: number;
	sessions_completed: number;
	years_experience: number;
	phone_number: string | null;
};

export type UpdateTeacherProfileRequest = {
	full_name?: string;
	bio?: string;
	teaching_mode?: string;
	city?: string;
	university?: string;
	teaching_experience?: Array<{ year_from: number; year_to: number | null; subject: string }>;
	achievements?: string[];
	phone_number?: string;
};

export type StudentProfileResponse = {
	id: string;
	user_id: string;
	full_name: string;
	photo_url: string | null;
	age: number | null;
	age_category: string | null;
	assigned_teacher_id: string | null;
	enrolled_courses: Array<{ id: string; name: string }>;
	phone_number: string | null;
};

export type UpdateStudentProfileRequest = {
	full_name?: string;
	date_of_birth?: string;
	phone_number?: string;
};
