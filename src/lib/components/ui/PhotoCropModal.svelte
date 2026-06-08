<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { t } from 'svelte-i18n';
	import Cropper from 'cropperjs';
	import 'cropperjs/dist/cropper.css';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	let { imageSrc, onConfirm, onCancel }: {
		imageSrc: string;
		onConfirm: (blob: Blob) => void;
		onCancel: () => void;
	} = $props();

	let imgEl: HTMLImageElement;
	let cropper: Cropper | null = null;
	let zoomValue = $state(0.5);

	onMount(() => {
		cropper = new Cropper(imgEl, {
			aspectRatio: 1,
			viewMode: 1,
			dragMode: 'move',
			cropBoxResizable: false,
			cropBoxMovable: false,
			autoCropArea: 1,
			ready() {
				const imageData = cropper!.getImageData();
				zoomValue = imageData.width / imageData.naturalWidth;
			}
		});
	});

	onDestroy(() => {
		cropper?.destroy();
	});

	function handleZoom(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		zoomValue = val;
		cropper?.zoomTo(val);
	}

	function handleConfirm() {
		if (!cropper) return;
		cropper
			.getCroppedCanvas({ width: 300, height: 300 })
			.toBlob((blob: Blob | null) => {
				if (blob) onConfirm(blob);
			}, 'image/png');
	}
</script>

<Modal open={true} title={$t('profile.cropPhoto')} onclose={onCancel}>
	{#snippet children()}
		<div class="bg-slate-800 overflow-hidden -mx-6 -mt-5 mb-4" style="height: 240px;">
			<!-- svelte-ignore a11y_img_redundant_alt -->
			<img bind:this={imgEl} src={imageSrc} alt="crop preview" style="display: block; max-width: 100%;" />
		</div>

		<p class="text-center text-xs text-text2 mb-4">{$t('profile.dragToReposition')}</p>

		<div class="flex items-center gap-3 mb-1">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<circle cx="11" cy="11" r="8"/>
				<path d="M21 21l-4.35-4.35"/>
				<path d="M8 11h6"/>
			</svg>
			<input
				type="range"
				class="flex-1 accent-primary"
				min="0.1"
				max="3"
				step="0.05"
				value={zoomValue}
				oninput={handleZoom}
				aria-label={$t('profile.zoom')}
			/>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<circle cx="11" cy="11" r="8"/>
				<path d="M21 21l-4.35-4.35"/>
				<path d="M8 11h6"/>
				<path d="M11 8v6"/>
			</svg>
		</div>
		<p class="text-center text-xs text-text2">{$t('profile.zoom')}</p>
	{/snippet}

	{#snippet footer()}
		<Button variant="ghost" onclick={onCancel}>{$t('common.cancel')}</Button>
		<Button variant="primary" onclick={handleConfirm}>{$t('profile.savePhoto')}</Button>
	{/snippet}
</Modal>

<style>
	:global(.cropper-view-box),
	:global(.cropper-face) {
		border-radius: 50%;
	}
</style>
