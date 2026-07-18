<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { lhref } from '$lib/i18n';
	import SeoAlternates from '$lib/components/SeoAlternates.svelte';
	import { api, type PaginatedResponse } from '$lib/api';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let bio = $state('');
	let phoneNumber = $state('');
	let subjectIds = $state<string[]>([]);
	let subjectEntries = $state<{ id: string; name: string }[]>([]);
	let loading = $state(false);
	let success = $state(false);
	let error = $state('');
	let emailAvailable = $state<boolean | null>(null);
	let emailDebounce: ReturnType<typeof setTimeout>;
	let loadingSubjects = $state(true);

	onMount(async () => {
		try {
			const body = await api.get<PaginatedResponse<{ id: string; name: string }>>('/subjects?status=verified');
			subjectEntries = body.data;
		} catch {
			subjectEntries = [];
		} finally {
			loadingSubjects = false;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (emailAvailable === false) return;
		error = '';
		loading = true;
		try {
			await api.post('/auth/register/teacher', {
				full_name: fullName,
				email,
				password,
				bio,
				phone_number: phoneNumber || null,
				subject_ids: subjectIds,
			});
			success = true;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : '';
			if (msg.includes('409') || msg.toLowerCase().includes('already')) {
				error = $t('auth.registerTeacher.errors.emailTaken');
			} else {
				error = $t('auth.registerTeacher.errors.unknown');
			}
		} finally {
			loading = false;
		}
	}
</script>

<SeoAlternates />

<svelte:head>
	<title>{$t('auth.registerTeacher.title')} — Mutawazin</title>
</svelte:head>

<div class="min-h-screen bg-bgGray flex flex-col items-center justify-start py-10 px-6">
	<Logo href={$lhref('/')} class="mb-6" />

	<div class="w-full max-w-auth bg-white border border-border rounded-lg shadow-sm p-8">
		{#if success}
			<div class="text-center py-4">
				<div class="w-16 h-16 bg-blue-50 rounded-pill flex items-center justify-center mx-auto mb-4">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
					</svg>
				</div>
				<h1 class="text-[22px] font-semibold mb-2">{$t('auth.registerTeacher.successTitle')}</h1>
				<p class="text-sm text-text2 mb-6">{$t('auth.registerTeacher.success')}</p>
				<Button variant="secondary" href={$lhref('/')}>{$t('auth.verifyEmail.successRegister.cta')}</Button>
			</div>
		{:else}
			<h1 class="text-[22px] font-semibold tracking-tight">{$t('auth.registerTeacher.title')}</h1>
			<p class="mt-2 text-sm text-text2 mb-6">{$t('auth.registerTeacher.subtitle')}</p>

			{#if error}
				<div class="mb-4 p-3 bg-errorBg rounded-sm text-sm text-errorText" role="alert" aria-live="assertive">{error}</div>
			{/if}

			<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4">
				<!-- Full name -->
				<div class="flex flex-col gap-1.5">
					<label for="fullName" class="text-[13px] font-medium">{$t('auth.registerTeacher.fullName')}</label>
					<input id="fullName" type="text" bind:value={fullName} required placeholder={$t('auth.registerTeacher.fullNamePlaceholder')}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>

				<!-- Email -->
				<div class="flex flex-col gap-1.5">
					<label for="regEmail" class="text-[13px] font-medium">{$t('auth.registerTeacher.email')}</label>
					<input id="regEmail" type="email" bind:value={email} required placeholder={$t('auth.registerTeacher.emailPlaceholder')} autocomplete="email"
						oninput={(e) => {
							clearTimeout(emailDebounce);
							const val = (e.target as HTMLInputElement).value.trim();
							if (!val) { emailAvailable = null; return; }
							emailDebounce = setTimeout(async () => {
								try {
									const res = await api.get<{ available: boolean }>(`/auth/check/email?email=${encodeURIComponent(val)}`);
									emailAvailable = res.available;
								} catch { emailAvailable = null; }
							}, 400);
						}}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				{#if emailAvailable === false}
					<p class="text-xs text-errorText mt-1">Email is already registered.</p>
				{/if}
				</div>

				<!-- Password -->
				<div class="flex flex-col gap-1.5">
					<label for="regPassword" class="text-[13px] font-medium">{$t('auth.registerTeacher.password')}</label>
					<div class="relative">
						<input id="regPassword" type={showPassword ? 'text' : 'password'} bind:value={password} required placeholder={$t('auth.registerTeacher.passwordPlaceholder')} autocomplete="new-password"
							class="w-full bg-white border border-border rounded-sm px-3 py-2.5 pr-16 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
						<button type="button" onclick={() => (showPassword = !showPassword)}
							class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs font-semibold text-text2 hover:text-text hover:bg-bgGray rounded"
							aria-label={showPassword ? $t('common.hide') + ' password' : $t('common.show') + ' password'}>
							{showPassword ? $t('common.hide') : $t('common.show')}
						</button>
					</div>
				</div>

				<!-- Bio -->
				<div class="flex flex-col gap-1.5">
					<label for="bio" class="text-[13px] font-medium">{$t('auth.registerTeacher.bio')}</label>
					<textarea id="bio" bind:value={bio} placeholder={$t('auth.registerTeacher.bioPlaceholder')} rows={3}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-vertical min-h-[84px]"></textarea>
				</div>

				<!-- Phone number -->
				<div class="flex flex-col gap-1.5">
					<label for="phoneNumber" class="text-[13px] font-medium">{$t('profile.phoneNumber')}</label>
					<input id="phoneNumber" type="tel" bind:value={phoneNumber} placeholder={$t('profile.phoneNumberPlaceholder')}
						class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm placeholder:text-text3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
				</div>

				<!-- Subject multi-select -->
				<div class="flex flex-col gap-1.5">
					<label class="text-[13px] font-medium">{$t('auth.registerTeacher.subjects')}</label>
					{#if loadingSubjects}
						<p class="text-sm text-text2">{$t('common.loading')}</p>
					{:else if subjectEntries.length === 0}
						<p class="text-sm text-text2">No subjects available. Please try refreshing the page.</p>
					{:else}
						<div class="border border-border rounded-sm bg-white max-h-48 overflow-y-auto divide-y divide-border">
							{#each subjectEntries as entry}
								<label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-bgGray">
									<input
										type="checkbox"
										value={entry.id}
										checked={subjectIds.includes(entry.id)}
										onchange={(e) => {
											if ((e.target as HTMLInputElement).checked) {
												subjectIds = [...subjectIds, entry.id];
											} else {
												subjectIds = subjectIds.filter(id => id !== entry.id);
											}
										}}
										class="w-4 h-4 rounded text-primary focus:ring-primary/15"
									/>
									<div class="text-sm font-medium">{entry.name}</div>
								</label>
							{/each}
						</div>
						<p class="text-xs text-text2">{$t('auth.registerTeacher.subjectHelper')}</p>
					{/if}
				</div>

				<Button type="submit" variant="primary" {loading} class="w-full mt-2">
					{$t('auth.registerTeacher.submit')}
				</Button>

				<!-- Notice -->
				<div class="flex gap-2.5 p-3 bg-bgGray border border-border rounded-sm text-[13px] text-text2">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" class="flex-none mt-0.5" aria-hidden="true">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
					{$t('auth.registerTeacher.reviewNotice')}
				</div>
			</form>

			<div class="mt-6 pt-5 border-t border-border text-sm text-text2 text-center">
				{$t('auth.registerTeacher.alreadyHaveAccount')}
				<a href={$lhref('/login')} class="ml-1 font-semibold text-primary hover:text-primary-dark hover:underline">
					{$t('auth.registerTeacher.logIn')}
				</a>
			</div>
		{/if}
	</div>
</div>
