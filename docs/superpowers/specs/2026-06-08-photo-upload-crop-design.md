# Photo Upload — Bug Fix + Crop Modal Design

**Date:** 2026-06-08  
**Status:** Approved  
**Scope:** Frontend only — no backend changes required

---

## Problem

Two issues with the current photo upload flow:

1. **422 error on upload** — `api.ts` injects `Content-Type: application/json` for all POST bodies, including FormData uploads. The `headers: {}` passed by `api.upload` does not override this because it is an empty spread. FastAPI rejects the request with 422 because it expects `multipart/form-data` for `UploadFile` parameters.

2. **No preview or crop** — The camera icon opens a file picker and immediately uploads the raw file with no preview. The user cannot control which part of the photo is used for the circular avatar.

---

## Design

### Part 1 — Bug fix: `src/lib/api.ts`

In the `request()` function, skip injecting `Content-Type: application/json` when the body is a `FormData` instance. The browser will then automatically set the correct `multipart/form-data; boundary=...` header.

**Change** (one line, inside the `headers` spread):
```ts
// Before
...(hasBody ? { 'Content-Type': 'application/json' } : {}),

// After
...(hasBody && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
```

No other changes to `api.ts` or the backend upload endpoints.

---

### Part 2 — New component: `src/lib/components/ui/PhotoCropModal.svelte`

A modal that mounts `cropperjs` on an image element and returns a cropped PNG blob to the caller.

**Props:**
```ts
imageSrc: string              // object URL from URL.createObjectURL(file)
onConfirm: (blob: Blob) => void
onCancel: () => void
```

**cropperjs configuration:**
| Option | Value | Reason |
|---|---|---|
| `aspectRatio` | `1` | Square crop for circular avatar |
| `viewMode` | `1` | Crop box stays inside canvas bounds |
| `dragMode` | `'move'` | User drags the image; crop box stays fixed |
| `cropBoxResizable` | `false` | Fixed circle size |
| `cropBoxMovable` | `false` | Fixed circle position (centered) |
| `autoCropArea` | `1` | Crop box fills the cropper area |

**CSS override** to make the crop box circular:
```css
:global(.cropper-view-box),
:global(.cropper-face) {
  border-radius: 50%;
}
```

**Zoom slider:** `<input type="range" min="0.1" max="3" step="0.05">` — on `input` event calls `cropper.zoomTo(value)`. Initial value set after `ready` event fires.

**Confirm action:** 
```ts
cropper.getCroppedCanvas({ width: 300, height: 300 })
  .toBlob(blob => onConfirm(blob!), 'image/png')
```

**Cleanup:** `onDestroy(() => cropper?.destroy())` to prevent memory leaks.

**Layout:**
- Uses the existing `<Modal>` component as the container
- Header: i18n key `profile.cropPhoto`
- Cropper area: dark background (`bg-slate-800`), fixed height ~240px
- Drag hint text below cropper: i18n key `profile.dragToReposition`
- Zoom row: zoom-out icon · slider · zoom-in icon, labeled with `profile.zoom`
- Footer: "Batal" (ghost button) + "Simpan foto" (primary button, i18n `profile.savePhoto`)

**i18n keys** (added to `en.json` and `id.json`):
| Key | EN | ID |
|---|---|---|
| `profile.cropPhoto` | "Adjust profile photo" | "Atur foto profil" |
| `profile.dragToReposition` | "Drag to reposition" | "Geser foto untuk memposisikan" |
| `profile.savePhoto` | "Save photo" | "Simpan foto" |
| `profile.zoom` | "Zoom" | "Zoom" |

---

### Part 3 — Profile page integration

Applies to both:
- `src/routes/teachers/[id]/+page.svelte`
- `src/routes/students/[id]/+page.svelte`

**New state:**
```ts
let cropSrc = $state<string | null>(null)
let uploading = $state(false)
```

**`handlePhotoChange` rewritten:**
```ts
function handlePhotoChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    cropSrc = URL.createObjectURL(file)
    // Reset input so same file can be re-selected
    ;(e.target as HTMLInputElement).value = ''
}
```

**`handleCropConfirm` (new):**
```ts
async function handleCropConfirm(blob: Blob) {
    uploading = true
    cropSrc = null
    try {
        const fd = new FormData()
        fd.append('file', blob, 'photo.png')
        // Each page hardcodes its own endpoint:
        // teachers/[id]/+page.svelte  → '/teachers/me/photo'
        // students/[id]/+page.svelte  → '/students/me/photo'
        const res = await api.upload<{ photo_url: string }>('/teachers/me/photo', fd)
        profile = { ...profile, photo_url: res.photo_url }
    } catch {
        // silent — avatar simply stays unchanged; no toast infrastructure exists yet
    } finally {
        uploading = false
    }
}
```

**Template additions:**
```svelte
{#if cropSrc}
  <PhotoCropModal
    imageSrc={cropSrc}
    onConfirm={handleCropConfirm}
    onCancel={() => { cropSrc = null }}
  />
{/if}
```

**Avatar upload button during uploading:**
```svelte
<label class="..." class:opacity-50={uploading} class:pointer-events-none={uploading}>
  {#if uploading}
    <!-- small spinner svg -->
  {:else}
    <!-- camera svg -->
  {/if}
  <input type="file" accept="image/*" class="sr-only" onchange={handlePhotoChange} disabled={uploading} />
</label>
```

The avatar `src` prop updates immediately after a successful upload since `profile.photo_url` is reactive state.

---

## Dependencies

Install `cropperjs`:
```
npm install cropperjs
```
Also install types if needed: `npm install --save-dev @types/cropperjs` (or they may be bundled).

Add cropperjs CSS import to the component:
```ts
import 'cropperjs/dist/cropper.css'
```

---

## What is NOT changing

- Backend upload endpoints — no delta required
- The camera icon overlay position and visibility logic (`{#if isOwn}`)
- The `Avatar.svelte` component
- The `api.upload` function signature
- The storage layer (`save_file` in the backend)

---

## File change summary

| File | Change |
|---|---|
| `src/lib/api.ts` | 1-line fix: skip JSON content-type for FormData bodies |
| `src/lib/components/ui/PhotoCropModal.svelte` | New component |
| `src/routes/teachers/[id]/+page.svelte` | Use modal, add uploading state, fix handlePhotoChange |
| `src/routes/students/[id]/+page.svelte` | Same as teacher profile |
| `src/locales/en.json` | 4 new i18n keys |
| `src/locales/id.json` | 4 new i18n keys |
| `package.json` | Add `cropperjs` dependency |
