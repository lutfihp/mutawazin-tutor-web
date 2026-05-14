<script lang="ts">
	import type { Snippet } from 'svelte';
	import { focusTrap } from '$lib/actions/focusTrap';
	import { X } from 'lucide-svelte';

	let {
		open = false,
		title = '',
		maxWidth = 'default',
		onclose,
		children,
		footer,
	}: {
		open?: boolean;
		title?: string;
		maxWidth?: 'default' | 'lg';
		onclose?: () => void;
		children?: Snippet;
		footer?: Snippet;
	} = $props();

	const maxWidthClasses: Record<string, string> = {
		default: 'max-w-[520px]',
		lg: 'max-w-[640px]',
	};

	const uid = Math.random().toString(36).slice(2);
	const titleId = `modal-title-${uid}`;

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose?.();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/55"
		onclick={handleBackdrop}
		onkeydown={handleKeydown}
		role="presentation"
	>
		<div
			class="relative w-full {maxWidthClasses[maxWidth]} bg-white rounded-lg shadow-modal flex flex-col max-h-[90vh]"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			use:focusTrap
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
				<h2 id={titleId} class="text-lg font-semibold text-text">{title}</h2>
				<button
					onclick={onclose}
					class="w-8 h-8 flex items-center justify-center rounded-sm text-text2 hover:text-text hover:bg-bgGray transition-colors"
					aria-label="Close"
				>
					<X size={16} aria-hidden="true" />
				</button>
			</div>

			<!-- Body -->
			<div class="px-6 py-5 overflow-y-auto flex-1">
				{#if children}{@render children()}{/if}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="px-6 py-4 border-t border-border bg-bgGray rounded-b-lg flex items-center justify-end gap-3 flex-none">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
