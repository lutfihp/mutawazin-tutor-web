<script lang="ts">
	import { t } from 'svelte-i18n';
	import { lhref } from '$lib/i18n';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state('');

	onMount(() => {
		if ($user) window.location.href = '/';
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await api.post('/auth/login', { identifier, password });
			window.location.href = '/dashboard';
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('401') || msg.toLowerCase().includes('invalid')) {
				error = $t('auth.login.errors.invalidCredentials');
			} else if (msg.includes('403') || msg.toLowerCase().includes('pending')) {
				error = $t('auth.login.errors.pendingApproval');
			} else if (msg.toLowerCase().includes('rejected')) {
				error = $t('auth.login.errors.rejected');
			} else {
				error = $t('auth.login.errors.unknown');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Log in — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href={$lhref('/')} class="mb-6" aria-label="Mutawazin home">
		<Logo />
	</a>

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.login.title')}</h1>
		<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.login.subtitle')}</p>

		<!-- Error banner -->
		{#if error}
			<div class="mb-4 p-3 bg-errorBg border border-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} novalidate>
			<!-- Identifier -->
			<div class="flex flex-col gap-1.5 mb-4">
				<label for="identifier" class="text-[13px] font-medium text-text">
					{$t('auth.login.identifier')}
				</label>
				<input
					id="identifier"
					type="text"
					autocomplete="username"
					placeholder={$t('auth.login.identifierPlaceholder')}
					bind:value={identifier}
					required
					class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
				/>
			</div>

			<!-- Password -->
			<div class="flex flex-col gap-1.5 mb-1">
				<label for="password" class="text-[13px] font-medium text-text">
					{$t('auth.login.password')}
				</label>
				<div class="relative">
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						placeholder={$t('auth.login.passwordPlaceholder')}
						bind:value={password}
						required
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded transition-colors"
						aria-label={showPassword ? $t('common.hide') + ' password' : $t('common.show') + ' password'}
					>
						{showPassword ? $t('common.hide') : $t('common.show')}
					</button>
				</div>
			</div>

			<div class="flex justify-end mb-6">
				<a href={$lhref('/forgot-password')} class="text-[13px] text-primary font-semibold hover:text-primary-dark hover:underline">
					{$t('auth.login.forgotPassword')}
				</a>
			</div>

			<Button type="submit" variant="primary" {loading} class="w-full">
				{$t('auth.login.submit')}
			</Button>
		</form>

		<div class="mt-6 pt-5 border-t border-border text-sm text-text2 text-center">
			{$t('auth.login.noAccount')}
			<div class="mt-1.5 flex items-center justify-center gap-3">
				<a href={$lhref('/register/teacher')} class="font-semibold text-primary hover:text-primary-dark hover:underline">
					{$t('nav.joinTeacher')}
				</a>
				<span class="text-border" aria-hidden="true">·</span>
				<a href={$lhref('/register/student')} class="font-semibold text-primary hover:text-primary-dark hover:underline">
					{$t('nav.joinStudent')}
				</a>
			</div>
		</div>
	</div>
</div>
