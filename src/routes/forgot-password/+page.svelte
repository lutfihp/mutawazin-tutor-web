<script lang="ts">
	import { t } from 'svelte-i18n';
	import { lhref } from '$lib/i18n';
	import SeoAlternates from '$lib/components/SeoAlternates.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	let email = $state('');
	let loading = $state(false);
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		try {
			await fetch(`${BASE}/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			// Always show success — backend never reveals if email exists
			success = true;
		} finally {
			loading = false;
		}
	}
</script>

<SeoAlternates />

<svelte:head>
	<title>{$t('auth.forgotPassword.title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<Logo href={$lhref('/')} class="mb-6" />

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-successBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2" stroke-linecap="round" aria-hidden="true">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
						<polyline points="22,6 12,13 2,6"/>
					</svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.forgotPassword.successTitle')}</h1>
				<p class="text-sm text-text2 mb-6">{$t('auth.forgotPassword.successBody')}</p>
				<Button variant="secondary" href={$lhref('/login')}>{$t('auth.login.submit')}</Button>
			</div>
		{:else}
			<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.forgotPassword.title')}</h1>
			<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.forgotPassword.subtitle')}</p>

			<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="fpEmail" class="text-[13px] font-medium">{$t('auth.forgotPassword.emailLabel')}</label>
					<input id="fpEmail" type="email" bind:value={email} required
						placeholder={$t('auth.forgotPassword.emailPlaceholder')}
						autocomplete="email"
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>
				<Button type="submit" variant="primary" {loading} class="w-full">
					{$t('auth.forgotPassword.submit')}
				</Button>
			</form>

			<div class="mt-6 pt-5 border-t border-border text-sm text-text2 text-center">
				<a href={$lhref('/login')} class="font-semibold text-primary hover:text-primary-dark hover:underline">
					{$t('auth.login.submit')}
				</a>
			</div>
		{/if}
	</div>
</div>
