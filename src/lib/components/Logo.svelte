<script lang="ts">
	let {
		href = '/',
		class: extraClass = '',
		compact = false,
	}: {
		href?: string;
		class?: string;
		/** Hide the wordmark below sm — for tight navbars (authenticated mobile). */
		compact?: boolean;
	} = $props();
</script>

<a {href} class="inline-flex items-center gap-2.5 font-bold text-lg tracking-tight text-text no-underline {extraClass}" aria-label="Mutawazin home">
	<svg
		viewBox="0 0 64 64"
		xmlns="http://www.w3.org/2000/svg"
		class="w-7 h-7 flex-none"
		aria-hidden="true"
	>
		<circle cx="32" cy="32" r="32" fill="#173343" />
		<g fill="#f6f3ec">
			<path d="M6 28 Q20 30 32 33 L32 56 Q22 42 6 28 Z" />
			<path d="M58 28 Q44 30 32 33 L32 56 Q42 42 58 28 Z" />
		</g>
		<line x1="32" y1="33" x2="32" y2="55" stroke="#2d6a5e" stroke-width="0.9" stroke-linecap="round" />
		<path d="M32 33 C 28 18, 22 12, 6 14 C 12 28, 20 32, 32 33 Z" fill="#7ba37a" />
		<path d="M32 33 C 36 18, 42 12, 58 14 C 52 28, 44 32, 32 33 Z" fill="#7ba37a" />
		<path d="M32 33 C 25 26, 23 16, 31 6 C 41 16, 39 26, 32 33 Z" fill="#9bb39a" />
		<circle cx="31.5" cy="6.5" r="1.4" fill="#c9a35a" />
	</svg>
	<span class={compact ? 'hidden sm:inline' : ''}>Mutawazin</span>
</a>
