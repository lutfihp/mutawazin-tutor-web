# Photo Upload — Bug Fix + Crop Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 422 upload error and add a circular photo cropper modal to teacher and student profile pages.

**Architecture:** One-line fix in `api.ts` stops the JSON content-type from being sent on FormData uploads. A new `PhotoCropModal.svelte` component wraps `cropperjs` in the existing `<Modal>` shell with a drag-to-reposition cropper and zoom slider. Both profile pages swap their immediate-upload handler for the modal flow, crop client-side to a 300×300 PNG blob, then upload that blob.

**Tech Stack:** SvelteKit (Svelte 5 runes mode), cropperjs, svelte-i18n, Tailwind v3, existing `<Modal>` + `<Button>` + `<Avatar>` components.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/api.ts` | Modify | Bug fix (FormData Content-Type) + export `assetUrl` helper |
| `src/locales/en.json` | Modify | 4 new i18n keys under `profile` |
| `src/locales/id.json` | Modify | Same 4 keys in Bahasa Indonesia |
| `src/lib/components/ui/PhotoCropModal.svelte` | Create | cropperjs wrapper — accepts imageSrc, emits blob on confirm |
| `src/routes/teachers/[id]/+page.svelte` | Modify | Use PhotoCropModal, add uploading state, fix photo URL display |
| `src/routes/students/[id]/+page.svelte` | Modify | Same as teacher page |

---

## Task 1: Install cropperjs + fix api.ts

**Files:**
- Modify: `src/lib/api.ts`

### Context

The `request()` function in `api.ts` always injects `Content-Type: application/json` for POST bodies. The `api.upload` function passes `headers: {}` hoping to clear it, but an empty spread does nothing. FastAPI's `UploadFile` parameter requires `multipart/form-data`, so it returns 422.

Backend photo URLs look like `/uploads/teacher_xxx.jpg` — a relative path that must be prefixed with the API base URL (`VITE_API_URL`) before being used as an `<img src>`.

- [ ] **Step 1: Install cropperjs**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm install cropperjs
```

Expected: `added 1 package` (or similar). No errors.

- [ ] **Step 2: Fix FormData Content-Type in api.ts**

In `src/lib/api.ts`, find line 10 (inside the `fetch` call's `headers` object):

```ts
			...(hasBody ? { 'Content-Type': 'application/json' } : {}),
```

Replace it with:

```ts
			...(hasBody && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
```

- [ ] **Step 3: Export assetUrl helper from api.ts**

After line 46 (the closing `};` of the `api` object), add:

```ts

export function assetUrl(path: string | null | undefined): string | undefined {
	if (!path) return undefined;
	if (path.startsWith('http')) return path;
	return `${BASE}${path}`;
}
```

- [ ] **Step 4: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors (16 pre-existing warnings are fine).

- [ ] **Step 5: Commit**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
git add src/lib/api.ts package.json package-lock.json
git commit -m "fix: FormData upload 422 — skip JSON content-type for multipart requests; add assetUrl helper"
```

---

## Task 2: Add i18n keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/id.json`

### Context

Both files have a `"profile"` object starting around line 425. New keys go right after `"phoneNumberPlaceholder"` (line 427), before `"teacher"`.

- [ ] **Step 1: Add keys to en.json**

In `src/locales/en.json`, find the block:

```json
    "phoneNumberPlaceholder": "e.g. 081234567890",
    "teacher": {
```

Replace with:

```json
    "phoneNumberPlaceholder": "e.g. 081234567890",
    "cropPhoto": "Adjust profile photo",
    "dragToReposition": "Drag to reposition",
    "savePhoto": "Save photo",
    "zoom": "Zoom",
    "teacher": {
```

- [ ] **Step 2: Add keys to id.json**

In `src/locales/id.json`, find the block:

```json
    "phoneNumberPlaceholder": "Contoh: 081234567890",
    "teacher": {
```

Replace with:

```json
    "phoneNumberPlaceholder": "Contoh: 081234567890",
    "cropPhoto": "Atur foto profil",
    "dragToReposition": "Geser foto untuk memposisikan",
    "savePhoto": "Simpan foto",
    "zoom": "Zoom",
    "teacher": {
```

- [ ] **Step 3: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
git add src/locales/en.json src/locales/id.json
git commit -m "feat: add i18n keys for photo crop modal (EN + ID)"
```

---

## Task 3: Create PhotoCropModal.svelte

**Files:**
- Create: `src/lib/components/ui/PhotoCropModal.svelte`

### Context

This component wraps `cropperjs` inside the existing `<Modal>` component. It accepts an object URL (`imageSrc`), displays a circular crop interface, and calls `onConfirm(blob)` when the user saves.

cropperjs is configured so the crop box is fixed and circular — the user drags the image underneath it. A range slider controls zoom via `cropper.zoomTo()`.

The `<Modal>` component API:
- `open: boolean` — whether shown
- `title: string` — header text
- `onclose: () => void` — close handler
- `{#snippet children()}` — body content
- `{#snippet footer()}` — footer buttons

- [ ] **Step 1: Create the component**

Create `src/lib/components/ui/PhotoCropModal.svelte` with this content:

```svelte
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
			.toBlob((blob) => {
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
```

- [ ] **Step 2: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors. If you see `Cannot find module 'cropperjs'` — run `npm install cropperjs` first (Task 1 Step 1).

- [ ] **Step 3: Commit**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
git add src/lib/components/ui/PhotoCropModal.svelte
git commit -m "feat: add PhotoCropModal component (cropperjs, circular crop, zoom slider)"
```

---

## Task 4: Wire up teacher profile

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte`

### Context

Current `handlePhotoChange` (line 139–145) uploads directly without preview. Replace it with a modal flow: file picked → object URL stored in `cropSrc` state → modal opens → user crops → `handleCropConfirm` receives blob → upload blob to `/teachers/me/photo` → update displayed avatar.

`profile` is `$derived(data.profile)` and cannot be reassigned. Use a `photoUrlOverride` state to reflect the new URL after upload without reloading the page.

- [ ] **Step 1: Add PhotoCropModal import**

In `src/routes/teachers/[id]/+page.svelte`, find the imports block (lines 1–7). Add after line 7 (`import Card ...`):

```ts
	import PhotoCropModal from '$lib/components/ui/PhotoCropModal.svelte';
	import { assetUrl } from '$lib/api';
```

- [ ] **Step 2: Replace the photo upload block**

Find lines 138–145:

```ts
	// ── Photo upload
	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		api.upload('/teachers/me/photo', fd);
	}
```

Replace with:

```ts
	// ── Photo upload
	let cropSrc = $state<string | null>(null);
	let uploading = $state(false);
	let photoUrlOverride = $state<string | null>(null);

	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		cropSrc = URL.createObjectURL(file);
		(e.target as HTMLInputElement).value = '';
	}

	async function handleCropConfirm(blob: Blob) {
		uploading = true;
		cropSrc = null;
		try {
			const fd = new FormData();
			fd.append('file', blob, 'photo.png');
			const res = await api.upload<{ photo_url: string }>('/teachers/me/photo', fd);
			photoUrlOverride = res.photo_url;
		} catch {
			// upload failed silently — avatar stays unchanged
		} finally {
			uploading = false;
		}
	}
```

- [ ] **Step 3: Update Avatar src to use assetUrl + override**

Find line 166:

```svelte
					<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={profile.photo_url} />
```

Replace with:

```svelte
					<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={assetUrl(photoUrlOverride ?? profile.photo_url)} />
```

- [ ] **Step 4: Update the camera label to show uploading state**

Find lines 168–177:

```svelte
						<label
							class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-pill flex items-center justify-center cursor-pointer border-2 border-white hover:bg-primary-dark transition-colors"
							aria-label="Upload photo"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
								<circle cx="12" cy="13" r="4"/>
							</svg>
							<input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} />
						</label>
```

Replace with:

```svelte
						<label
							class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-pill flex items-center justify-center cursor-pointer border-2 border-white hover:bg-primary-dark transition-colors"
							class:opacity-50={uploading}
							class:pointer-events-none={uploading}
							aria-label="Upload photo"
						>
							{#if uploading}
								<svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
									<path d="M12 2a10 10 0 0 1 10 10"/>
								</svg>
							{:else}
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
									<circle cx="12" cy="13" r="4"/>
								</svg>
							{/if}
							<input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} disabled={uploading} />
						</label>
```

- [ ] **Step 5: Add the modal to the template**

Find the line `</script>` (line 146) — the crop modal goes in the template, not the script. Find the very first line of the template (line 148, `<svelte:head>`). Add before it:

```svelte
{#if cropSrc}
	<PhotoCropModal
		imageSrc={cropSrc}
		onConfirm={handleCropConfirm}
		onCancel={() => { cropSrc = null; }}
	/>
{/if}
```

- [ ] **Step 6: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
git add src/routes/teachers/[id]/+page.svelte
git commit -m "feat: teacher profile — photo crop modal + uploading state + assetUrl avatar"
```

---

## Task 5: Wire up student profile

**Files:**
- Modify: `src/routes/students/[id]/+page.svelte`

### Context

Same pattern as Task 4. Student's `handlePhotoChange` is at line 52–58. Camera label is at lines 75–84. Upload endpoint is `/students/me/photo`.

- [ ] **Step 1: Add imports**

In `src/routes/students/[id]/+page.svelte`, find the imports block (lines 1–8). Add after line 8 (`import Card ...`):

```ts
	import PhotoCropModal from '$lib/components/ui/PhotoCropModal.svelte';
	import { assetUrl } from '$lib/api';
```

- [ ] **Step 2: Replace the photo upload block**

Find lines 52–58:

```ts
	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		api.upload('/students/me/photo', fd);
	}
```

Replace with:

```ts
	let cropSrc = $state<string | null>(null);
	let uploading = $state(false);
	let photoUrlOverride = $state<string | null>(null);

	function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		cropSrc = URL.createObjectURL(file);
		(e.target as HTMLInputElement).value = '';
	}

	async function handleCropConfirm(blob: Blob) {
		uploading = true;
		cropSrc = null;
		try {
			const fd = new FormData();
			fd.append('file', blob, 'photo.png');
			const res = await api.upload<{ photo_url: string }>('/students/me/photo', fd);
			photoUrlOverride = res.photo_url;
		} catch {
			// upload failed silently — avatar stays unchanged
		} finally {
			uploading = false;
		}
	}
```

- [ ] **Step 3: Update Avatar src**

Find line 73:

```svelte
				<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={profile.photo_url} />
```

Replace with:

```svelte
				<Avatar name={profile.full_name} id={profile.user_id} size="xxl" src={assetUrl(photoUrlOverride ?? profile.photo_url)} />
```

- [ ] **Step 4: Update the camera label**

Find lines 75–84:

```svelte
					<label
						class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-pill flex items-center justify-center cursor-pointer border-2 border-white hover:bg-primary-dark transition-colors"
						aria-label="Upload photo"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
							<circle cx="12" cy="13" r="4"/>
						</svg>
						<input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} />
					</label>
```

Replace with:

```svelte
					<label
						class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-pill flex items-center justify-center cursor-pointer border-2 border-white hover:bg-primary-dark transition-colors"
						class:opacity-50={uploading}
						class:pointer-events-none={uploading}
						aria-label="Upload photo"
					>
						{#if uploading}
							<svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
								<path d="M12 2a10 10 0 0 1 10 10"/>
							</svg>
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
								<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
								<circle cx="12" cy="13" r="4"/>
							</svg>
						{/if}
						<input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} disabled={uploading} />
					</label>
```

- [ ] **Step 5: Add modal to template**

Find the line `</script>` (line 60) — then the first template line (line 62, `<svelte:head>`). Add before it:

```svelte
{#if cropSrc}
	<PhotoCropModal
		imageSrc={cropSrc}
		onConfirm={handleCropConfirm}
		onCancel={() => { cropSrc = null; }}
	/>
{/if}
```

- [ ] **Step 6: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
git add src/routes/students/[id]/+page.svelte
git commit -m "feat: student profile — photo crop modal + uploading state + assetUrl avatar"
```

---

## Task 6: Manual browser verification

**Files:** None — verification only.

### Prerequisites

Both the frontend dev server and the FastAPI backend must be running:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

- [ ] **Step 1: Start the dev server**

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
npm run dev
```

- [ ] **Step 2: Verify teacher photo upload**

1. Log in as a teacher account
2. Navigate to the teacher's own profile page (`/teachers/:id`)
3. Click the camera icon on the avatar
4. Select any image file from disk
5. The crop modal should open with the image visible and a circular crop overlay
6. Drag the image to reposition — the image should move, the circle should stay fixed
7. Use the zoom slider — the image should zoom in/out within the circle
8. Click "Simpan foto"
9. The modal should close, the camera button should show a spinner briefly, then the avatar should update to show the cropped photo
10. Reload the page — the avatar should still show the photo (confirmed persisted)

- [ ] **Step 3: Verify student photo upload**

Repeat Step 2 logged in as a student account on a student profile page (`/students/:id`). Confirm the same flow works and the endpoint used is `/students/me/photo` (check browser Network tab).

- [ ] **Step 4: Verify the 422 fix (Network tab)**

In the browser DevTools Network tab during the upload:
- The request to `/teachers/me/photo` (or `/students/me/photo`) should show `Status: 200`
- Request headers should show `Content-Type: multipart/form-data; boundary=...` (NOT `application/json`)
- Response body should be `{ "photo_url": "/uploads/..." }`

- [ ] **Step 5: Verify other POST requests are unaffected**

Perform any other form action (e.g., edit bio on teacher profile). Confirm it still sends `Content-Type: application/json` and works correctly. The fix should only skip the header for FormData bodies.

- [ ] **Step 6: Commit if any fixes were made during verification**

If you found and fixed issues during verification, commit them:

```powershell
cd "d:\Codading Repo\mutawazin\mutawazin-tutor-web"
git add -p   # stage only the fix files interactively
git commit -m "fix: <describe what was wrong>"
```
