<script lang="ts">
	let {
		label = '',
		id = '',
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		error = '',
		helper = '',
		required = false,
		disabled = false,
		class: extraClass = '',
		rows = 3,
		onchange,
		oninput,
	}: {
		label?: string;
		id?: string;
		type?: string;
		placeholder?: string;
		value?: string;
		error?: string;
		helper?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		rows?: number;
		onchange?: (e: Event) => void;
		oninput?: (e: Event) => void;
	} = $props();

	const _staticId = Math.random().toString(36).slice(2);
	const inputId = $derived(id || `input-${_staticId}`);
	const errorId = $derived(`${inputId}-error`);
	const helperId = $derived(`${inputId}-helper`);

	const baseInput =
		'w-full bg-white border rounded-sm px-3 py-2.5 text-sm text-text placeholder:text-text3 transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
	const normalBorder = 'border-border focus:border-primary focus:ring-2 focus:ring-primary/15';
	const errorBorder = 'border-error focus:border-error focus:ring-2 focus:ring-error/15';
</script>

<div class="flex flex-col gap-1.5 {extraClass}">
	{#if label}
		<label for={inputId} class="text-[13px] font-medium text-text">
			{label}{#if required}<span class="text-error ml-0.5" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	{#if type === 'textarea'}
		<textarea
			id={inputId}
			{placeholder}
			{disabled}
			{required}
			{rows}
			bind:value
			{onchange}
			{oninput}
			class="{baseInput} {error ? errorBorder : normalBorder} resize-vertical min-h-[84px]"
			aria-describedby="{error ? errorId : ''} {helper ? helperId : ''}"
			aria-invalid={!!error}
		></textarea>
	{:else}
		<input
			id={inputId}
			{type}
			{placeholder}
			{disabled}
			{required}
			bind:value
			{onchange}
			{oninput}
			class="{baseInput} {error ? errorBorder : normalBorder}"
			aria-describedby="{error ? errorId : ''} {helper ? helperId : ''}"
			aria-invalid={!!error}
		/>
	{/if}

	{#if error}
		<p id={errorId} class="text-xs text-errorText" role="alert" aria-live="polite">
			{error}
		</p>
	{:else if helper}
		<p id={helperId} class="text-xs text-text2">{helper}</p>
	{/if}
</div>
