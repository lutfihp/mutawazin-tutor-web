<script lang="ts">
	import { t } from 'svelte-i18n';
	import { lhref } from '$lib/i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	let newPassword = $state('');
	let confirmPassword = $state('');
	let showNew = $state(false);
	let showConfirm = $state(false);
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			error = $t('auth.resetPassword.mismatch');
			return;
		}
		error = '';
		loading = true;
		try {
			const res = await fetch(`${BASE}/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: data.token, new_password: newPassword }),
			});
			if (res.ok) {
				success = true;
				setTimeout(() => { window.location.href = '/login'; }, 2000);
			} else if (res.status === 404) {
				error = $t('auth.resetPassword.invalidToken');
			} else if (res.status === 400) {
				error = $t('auth.resetPassword.expiredToken');
			} else {
				error = $t('auth.login.errors.unknown');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('auth.resetPassword.title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<Logo href={$lhref('/')} class="mb-6" />

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-successBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.resetPassword.successTitle')}</h1>
				<p class="text-sm text-text2">{$t('auth.resetPassword.successBody')}</p>
			</div>
		{:else}
			<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.resetPassword.title')}</h1>
			<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.resetPassword.subtitle')}</p>

			{#if error}
				<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">
					{error}
					{#if error === $t('auth.resetPassword.expiredToken')}
						<a href={$lhref('/forgot-password')} class="ml-1 font-semibold underline">{$t('auth.resetPassword.requestNew')}</a>
					{/if}
				</div>
			{/if}

			{#if !data.token}
				<p class="text-sm text-errorText">{$t('auth.resetPassword.invalidToken')}</p>
			{:else}
				<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="rpNew" class="text-[13px] font-medium">{$t('auth.resetPassword.newPassword')}</label>
						<div class="relative">
							<input id="rpNew" type={showNew ? 'text' : 'password'} bind:value={newPassword} required
								autocomplete="new-password"
								class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
							<button type="button" onclick={() => (showNew = !showNew)}
								class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded"
								aria-label={showNew ? $t('common.hide') + ' password' : $t('common.show') + ' password'}>
								{showNew ? $t('common.hide') : $t('common.show')}
							</button>
						</div>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="rpConfirm" class="text-[13px] font-medium">{$t('auth.resetPassword.confirmPassword')}</label>
						<div class="relative">
							<input id="rpConfirm" type={showConfirm ? 'text' : 'password'} bind:value={confirmPassword} required
								autocomplete="new-password"
								class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
							<button type="button" onclick={() => (showConfirm = !showConfirm)}
								class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded"
								aria-label={showConfirm ? $t('common.hide') + ' password' : $t('common.show') + ' password'}>
								{showConfirm ? $t('common.hide') : $t('common.show')}
							</button>
						</div>
					</div>
					<Button type="submit" variant="primary" {loading} class="w-full">
						{$t('auth.resetPassword.submit')}
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</div>
