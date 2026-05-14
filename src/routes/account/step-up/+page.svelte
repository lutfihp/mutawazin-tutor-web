<script lang="ts">
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Step = 'email-form' | 'check-inbox' | 'change-password';
	let step = $state<Step>('email-form');

	let email = $state('');
	let verifiedEmail = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrent = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function sendVerification(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await api.post('/auth/step-up/add-email', { email });
			verifiedEmail = email;
			step = 'check-inbox';
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : $t('auth.login.errors.unknown');
		} finally {
			loading = false;
		}
	}

	async function changePassword(e: SubmitEvent) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}
		error = '';
		loading = true;
		try {
			await api.post('/auth/change-password', {
				current_password: currentPassword,
				new_password: newPassword,
			});
			success = true;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : $t('auth.login.errors.unknown');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('auth.stepUp.step1Title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href="/" class="mb-6"><Logo /></a>

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-successBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">Password updated!</h1>
				<p class="text-sm text-text2 mb-6">Your password has been changed successfully.</p>
				<Button variant="primary" href="/dashboard">Go to Dashboard</Button>
			</div>
		{:else}
			<!-- Step indicator -->
			<div class="flex items-center gap-3 mb-6" aria-label="Progress steps" role="navigation">
				{#each [
					{ num: 1, labelKey: 'auth.stepUp.step1Label', active: step === 'email-form' || step === 'check-inbox', done: step === 'change-password' },
					{ num: 2, labelKey: 'auth.stepUp.step2Label', active: step === 'change-password', done: false },
				] as s, i}
					<div class="flex items-center gap-2 text-[13px] font-medium {s.active || s.done ? 'text-text' : 'text-text2'}">
						<span
							class="w-6 h-6 rounded-pill flex items-center justify-center text-xs font-semibold
							       {s.done ? 'bg-success text-white' : s.active ? 'bg-primary text-white' : 'bg-border text-text2'}"
						>
							{#if s.done}
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
							{:else}
								{s.num}
							{/if}
						</span>
						{$t(s.labelKey)}
					</div>
					{#if i < 1}
						<div class="flex-1 h-0.5 bg-border rounded {step === 'change-password' ? 'bg-success' : ''}"></div>
					{/if}
				{/each}
			</div>

			{#if error}
				<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">{error}</div>
			{/if}

			{#if step === 'email-form'}
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.stepUp.step1Title')}</h1>
				<p class="text-sm text-text2 mb-6">{$t('auth.stepUp.step1Body')}</p>
				<form onsubmit={sendVerification} class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="stepEmail" class="text-[13px] font-medium">{$t('auth.stepUp.emailLabel')}</label>
						<input id="stepEmail" type="email" bind:value={email} required placeholder={$t('auth.stepUp.emailPlaceholder')} autocomplete="email"
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					</div>
					<Button type="submit" variant="primary" {loading} class="w-full">{$t('auth.stepUp.sendButton')}</Button>
				</form>

			{:else if step === 'check-inbox'}
				<div class="text-center py-4">
					<div class="w-16 h-16 bg-primary-light rounded-pill flex items-center justify-center mx-auto mb-4">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
						</svg>
					</div>
					<h1 class="text-[22px] font-semibold mb-3">{$t('auth.stepUp.checkInboxTitle')}</h1>
					<p class="text-sm text-text2 mb-6">
						{$t('auth.stepUp.checkInboxBody', { values: { email: verifiedEmail } })}
					</p>
					<button
						onclick={() => api.post('/auth/step-up/add-email', { email: verifiedEmail })}
						class="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
					>
						{$t('auth.stepUp.resendLink')}
					</button>
					<div class="mt-6">
						<Button variant="ghost" onclick={() => (step = 'change-password')}>
							I've verified my email →
						</Button>
					</div>
				</div>

			{:else}
				<div class="mb-4 p-3 bg-successBg border border-successBg rounded-sm flex items-center gap-2 text-[13px] text-successText">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
					{$t('auth.stepUp.verifiedBanner')}
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.stepUp.changePasswordTitle')}</h1>
				<p class="text-sm text-text2 mb-6">{$t('auth.stepUp.changePasswordSub')}</p>
				<form onsubmit={changePassword} class="flex flex-col gap-4">
					{#each [
						{ id: 'currentPw', labelKey: 'auth.stepUp.currentPassword', bind: 'current', show: showCurrent, toggleFn: () => (showCurrent = !showCurrent) },
					] as _}
						<div class="flex flex-col gap-1.5">
							<label for="currentPw" class="text-[13px] font-medium">{$t('auth.stepUp.currentPassword')}</label>
							<div class="relative">
								<input id="currentPw" type={showCurrent ? 'text' : 'password'} bind:value={currentPassword} required
									class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
								<button type="button" onclick={() => (showCurrent = !showCurrent)}
									class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded">
									{showCurrent ? $t('common.hide') : $t('common.show')}
								</button>
							</div>
						</div>
					{/each}
					<div class="flex flex-col gap-1.5">
						<label for="newPw" class="text-[13px] font-medium">{$t('auth.stepUp.newPassword')}</label>
						<div class="relative">
							<input id="newPw" type={showNew ? 'text' : 'password'} bind:value={newPassword} required autocomplete="new-password"
								class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
							<button type="button" onclick={() => (showNew = !showNew)}
								class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded">
								{showNew ? $t('common.hide') : $t('common.show')}
							</button>
						</div>
						<p class="text-xs text-text2">{$t('auth.stepUp.newPasswordHelper')}</p>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="confirmPw" class="text-[13px] font-medium">{$t('auth.stepUp.confirmPassword')}</label>
						<div class="relative">
							<input id="confirmPw" type={showConfirm ? 'text' : 'password'} bind:value={confirmPassword} required autocomplete="new-password"
								class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
							<button type="button" onclick={() => (showConfirm = !showConfirm)}
								class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded">
								{showConfirm ? $t('common.hide') : $t('common.show')}
							</button>
						</div>
					</div>
					<Button type="submit" variant="primary" {loading} class="w-full mt-2">{$t('auth.stepUp.updateButton')}</Button>
				</form>
			{/if}
		{/if}
	</div>
</div>
