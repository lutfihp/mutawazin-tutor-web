// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: { id: string; role: string; status: string } | null;
		}
		interface PageData {
			user: { id: string; role: string; status: string } | null;
			lang: string;
		}
	}
}

export {};
