import type { LayoutLoad } from './$types';
import { user } from '$lib/stores/auth';
import { setupI18n } from '$lib/i18n';

export const load: LayoutLoad = async ({ data }) => {
	user.set(data.user as Parameters<typeof user.set>[0]);
	setupI18n(data.lang);
	return data;
};
