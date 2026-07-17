import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { user } from '$lib/stores/auth';
import { setupI18n } from '$lib/i18n';

export const load: LayoutLoad = async ({ data }) => {
	user.set(data.user as Parameters<typeof user.set>[0]);
	setupI18n(data.lang);
	// svelte-i18n loads locale JSON async; without this, server-rendered
	// HTML can contain raw i18n keys instead of translated text.
	await waitLocale();
	return data;
};
