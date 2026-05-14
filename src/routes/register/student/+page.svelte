<script lang="ts">
	import { t } from 'svelte-i18n';
	import { api } from '$lib/api';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let dob = $state('');
	let loading = $state(false);
	let success = $state(false);
	let error = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await api.post('/auth/register/student', {
				full_name: fullName,
				email,
				password,
				date_of_birth: dob,
			});
			success = true;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409') || msg.toLowerCase().includes('already')) {
				error = $t('auth.registerStudent.errors.emailTaken');
			} else {
				error = $t('auth.registerStudent.errors.unknown');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('auth.registerStudent.title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href="/" class="mb-6"><Logo /></a>

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-successBg rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.verifyEmail.successRegister.title')}</h1>
				<p class="text-sm text-text2 mb-6">{$t('auth.verifyEmail.successRegister.body')}</p>
				<Button variant="secondary" href="/">{$t('auth.verifyEmail.successRegister.cta')}</Button>
			</div>
		{:else}
			<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.registerStudent.title')}</h1>
			<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.registerStudent.subtitle')}</p>

			{#if error}
				<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">{error}</div>
			{/if}

			<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="fullName" class="text-[13px] font-medium">{$t('auth.registerStudent.fullName')}</label>
					<input id="fullName" type="text" bind:value={fullName} required placeholder={$t('auth.registerStudent.fullNamePlaceholder')}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="regEmail" class="text-[13px] font-medium">{$t('auth.registerStudent.email')}</label>
					<input id="regEmail" type="email" bind:value={email} required placeholder={$t('auth.registerStudent.emailPlaceholder')} autocomplete="email"
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="regPassword" class="text-[13px] font-medium">{$t('auth.registerStudent.password')}</label>
					<div class="relative">
						<input id="regPassword" type={showPassword ? 'text' : 'password'} bind:value={password} required placeholder={$t('auth.registerStudent.passwordPlaceholder')} autocomplete="new-password"
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
						<button type="button" onclick={() => (showPassword = !showPassword)}
							class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded"
							aria-label={showPassword ? $t('common.hide') + ' password' : $t('common.show') + ' password'}>
							{showPassword ? $t('common.hide') : $t('common.show')}
						</button>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="dob" class="text-[13px] font-medium">{$t('auth.registerStudent.dob')}</label>
					<input id="dob" type="date" bind:value={dob} required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
					<p class="text-xs text-text2">{$t('auth.registerStudent.dobHelper')}</p>
				</div>

				<Button type="submit" variant="primary" {loading} class="w-full mt-2">
					{$t('auth.registerStudent.submit')}
				</Button>
			</form>

			<div class="mt-6 pt-5 border-t border-border text-sm text-text2 text-center">
				{$t('auth.registerStudent.alreadyHaveAccount')}
				<a href="/login" class="ml-1 font-semibold text-primary hover:text-primary-dark hover:underline">
					{$t('auth.registerStudent.logIn')}
				</a>
			</div>
		{/if}
	</div>
</div>
