<script lang="ts">
	let {
		href = '/',
		class: extraClass = '',
	}: {
		href?: string;
		class?: string;
	} = $props();
</script>

<a {href} class="inline-flex items-center gap-2.5 font-bold text-lg tracking-tight text-text no-underline {extraClass}" aria-label="Mutawazin home">
	<!-- Logo mark: top-half blue, bottom-half teal, white lines SVG -->
	<span
		class="relative w-7 h-7 rounded-sm overflow-hidden grid place-items-center flex-none"
		style="background: #2563EB;"
		aria-hidden="true"
	>
		<span
			class="absolute inset-x-0 bottom-0 h-1/2"
			style="background: #0D9488;"
		></span>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="relative z-10" aria-hidden="true">
			<path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="white" stroke-width="1.6" stroke-linecap="round" />
		</svg>
	</span>
	<span>Mutawazin</span>
</a>
