<script lang="ts">
	import { page } from '$app/stores';
	import ErrorState from '$lib/components/ErrorState.svelte';
</script>

<svelte:head>
	<title>Error — Mutawazin</title>
</svelte:head>

{#if $page.status === 401}
	<ErrorState
		tone="amber"
		code="401"
		title="Your session has expired."
		body="For your security, we signed you out after a period of inactivity. Sign back in to pick up where you left off."
	>
		{#snippet icon()}
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<rect x="3" y="11" width="18" height="11" rx="2" />
				<path d="M7 11V7a5 5 0 0 1 10 0v4" />
				<circle cx="12" cy="16.5" r="1" fill="currentColor" />
			</svg>
		{/snippet}
		{#snippet actions()}
			<a
				href="/login?from={encodeURIComponent($page.url.pathname)}"
				class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
			>
				Log in again
			</a>
		{/snippet}
	</ErrorState>

{:else if $page.status === 403}
	<ErrorState
		tone="rose"
		code="403"
		title="You don't have permission to view this page."
		body="If you think this is a mistake, please reach out to your admin or get in touch with support."
	>
		{#snippet icon()}
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				<line x1="9" y1="9" x2="15" y2="15" />
				<line x1="15" y1="9" x2="9" y2="15" />
			</svg>
		{/snippet}
		{#snippet actions()}
			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Go home</a>
			<a href="mailto:support@mutawazin.com" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-slate-500 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 transition-colors">Contact support</a>
		{/snippet}
	</ErrorState>

{:else if $page.status === 404}
	<ErrorState
		tone="blue"
		code="404"
		title="This page doesn't exist."
		body="The page might have moved, been deleted, or never existed. Let's get you back on track."
	>
		{#snippet icon()}
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.15" />
				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
			</svg>
		{/snippet}
		{#snippet actions()}
			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Go home</a>
			<a href="/courses" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-slate-500 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 transition-colors">Browse courses</a>
		{/snippet}
	</ErrorState>

{:else if $page.status === 429}
	<ErrorState
		tone="teal"
		code="429"
		title="Too many requests. Please slow down."
		body="You're going a little fast for us. Take a quick breather and try again in a moment — no action needed."
	>
		{#snippet icon()}
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M5 22h14" />
				<path d="M5 2h14" />
				<path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
				<path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
			</svg>
		{/snippet}
		{#snippet extra()}
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mt-6">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				Please wait about 30 seconds
			</div>
		{/snippet}
	</ErrorState>

{:else if $page.status === 500}
	<ErrorState
		tone="rose"
		code="500"
		title="Something went wrong on our end."
		body="We've been notified and we're looking into it. Give it another try, or come back in a moment."
		noTile
	>
		{#snippet icon()}
			<img
				src="/brand-kit/png/logo-mark-512.png"
				alt=""
				aria-hidden="true"
				class="block w-28 h-auto"
			/>
		{/snippet}
		{#snippet actions()}
			<button
				type="button"
				onclick={() => location.reload()}
				class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<polyline points="23 4 23 10 17 10" />
					<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
				</svg>
				Try again
			</button>
			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-slate-500 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 transition-colors">Go home</a>
		{/snippet}
	</ErrorState>

{:else}
	<ErrorState
		tone="slate"
		code={String($page.status)}
		title="Something went wrong."
		body={$page.error?.message ?? 'An unexpected error occurred. Please try again.'}
	>
		{#snippet icon()}
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
		{/snippet}
		{#snippet actions()}
			<a href="/" class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Go home</a>
		{/snippet}
	</ErrorState>
{/if}
