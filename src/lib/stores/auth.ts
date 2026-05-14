import { writable } from 'svelte/store';

export type User = {
	id: string;
	role: 'admin' | 'teacher' | 'student';
	status: 'pending' | 'verified' | 'active' | 'rejected' | 'stepped_up';
} | null;

export const user = writable<User>(null);
