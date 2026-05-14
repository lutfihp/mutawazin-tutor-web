<script lang="ts">
	import { t } from 'svelte-i18n';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();

	const state = $derived(() => {
		if (!data.success) return 'expired';
		if (data.purpose === 'step_up') return 'stepUp';
		return 'register';
	});

	type StateConfig = {
		iconBg: string;
		iconColor: string;
		isCheck: boolean;
		titleKey: string;
		bodyKey: string;
		ctaKey: string;
		ctaHref: string;
		ctaVariant: 'primary' | 'secondary';
	};

	const stateConfig: Record<string, StateConfig> = {
		register: {
			iconBg: 'bg-successBg',
			iconColor: '#15803D',
			isCheck: true,
			titleKey: 'auth.verifyEmail.successRegister.title',
			bodyKey: 'auth.verifyEmail.successRegister.body',
			ctaKey: 'auth.verifyEmail.successRegister.cta',
			ctaHref: '/',
			ctaVariant: 'secondary',
		},
		stepUp: {
			iconBg: 'bg-successBg',
			iconColor: '#15803D',
			isCheck: true,
			titleKey: 'auth.verifyEmail.successStepUp.title',
			bodyKey: 'auth.verifyEmail.successStepUp.body',
			ctaKey: 'auth.verifyEmail.successStepUp.cta',
			ctaHref: '/dashboard',
			ctaVariant: 'primary',
		},
		expired: {
			iconBg: 'bg-errorBg',
			iconColor: '#991B1B',
			isCheck: false,
			titleKey: 'auth.verifyEmail.expired.title',
			bodyKey: 'auth.verifyEmail.expired.body',
			ctaKey: 'auth.verifyEmail.expired.cta',
			ctaHref: '/login',
			ctaVariant: 'primary',
		},
	};

	const cfg = $derived(stateConfig[state()]);
</script>

<svelte:head>
	<title>Email Verification — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-center py-10 px-6">
	<a href="/" class="mb-6"><Logo /></a>

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8 text-center">
		<div class="w-16 h-16 {cfg.iconBg} rounded-pill flex items-center justify-center mx-auto mb-5">
			{#if cfg.isCheck}
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{:else}
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			{/if}
		</div>

		<h1 class="text-[22px] font-semibold mb-3">{$t(cfg.titleKey)}</h1>
		<p class="text-sm text-text2 mb-8 max-w-sm mx-auto">{$t(cfg.bodyKey)}</p>
		<Button variant={cfg.ctaVariant} href={cfg.ctaHref} class="min-w-[180px]">
			{$t(cfg.ctaKey)}
		</Button>
	</div>
</div>
