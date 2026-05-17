# Content Cleanup + Hero Brand Mark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove fake/placeholder content marked `remove` in the content audit and replace the hero right column with the real brand mark PNG.

**Architecture:** Pure markup + asset changes — no logic, no API calls. Four files touched: the landing page Svelte component, two locale JSON files, and brand assets copied to `static/`. All changes verified with `npm run check`.

**Tech Stack:** SvelteKit, Tailwind CSS v3, PowerShell (Windows)

---

## File Map

| Action | File |
|--------|------|
| Create (copy) | `static/brand-kit/` — full brand kit folder served as static assets |
| Modify | `src/routes/+page.svelte` — remove trust row, replace hero right column, remove Blog link, remove unused import |
| Modify | `src/locales/en.json` — remove 6 `landing.*` keys |
| Modify | `src/locales/id.json` — remove same 6 `landing.*` keys |

---

### Task 1: Copy brand kit to `static/`

**Files:**
- Create: `static/brand-kit/` (copied from `brand_kit_handoff/brand-kit/`)

- [ ] **Step 1: Copy the folder**

Run from `d:\Codading Repo\mutawazin-tutor-web`:
```powershell
Copy-Item -Path "brand_kit_handoff\brand-kit" -Destination "static\brand-kit" -Recurse -Force
```
Expected: `static/brand-kit/png/` and `static/brand-kit/svg/` appear with all assets inside.

- [ ] **Step 2: Verify the key file exists**

```powershell
Test-Path "static\brand-kit\png\logo-mark-1024.png"
```
Expected: `True`

---

### Task 2: Remove trust row from hero left column

**Files:**
- Modify: `src/routes/+page.svelte:71-85`

The trust row is the `<div class="flex items-center gap-3">` block at the bottom of the hero left column (after the CTA buttons). It contains the avatar dots and the "Trusted by…" text.

- [ ] **Step 1: Delete the trust row block**

In `src/routes/+page.svelte`, find and delete lines 71–85 (the entire block below):
```svelte
					<div class="flex items-center gap-3">
						<div class="flex -space-x-2" aria-hidden="true">
							{#each ['#2563EB', '#0D9488', '#7C3AED', '#E11D48'] as color}
								<span class="w-7 h-7 rounded-pill border-2 border-white" style="background: {color};"></span>
							{/each}
						</div>
						<p class="text-[13px] text-text2">
							{$t('landing.trustedBy', {
								values: {
									students: $t('landing.trustedStudents'),
									teachers: $t('landing.trustedTeachers'),
								},
							})}
						</p>
					</div>
```

After deletion, the hero left column ends with the CTA buttons `<div class="flex flex-wrap gap-3 mb-8">` block.

- [ ] **Step 2: Remove the unused `avatarColor` import**

In `src/routes/+page.svelte`, find line 3:
```svelte
	import { avatarColor } from '$lib/utils/avatar';
```
Delete that entire line. `avatarColor` is only referenced in the trust row which is now removed.

---

### Task 3: Replace hero right column with brand mark PNG

**Files:**
- Modify: `src/routes/+page.svelte:88-130`

The right column is the `<!-- Right: UI vignette -->` block — a `<div class="relative hidden lg:block"...>` containing 3 absolutely-positioned fake cards.

- [ ] **Step 1: Replace the entire vignette block**

Find and replace the block from `<!-- Right: UI vignette -->` through the closing `</div>` (lines 88–130):

```svelte
				<!-- Right: UI vignette -->
				<div class="relative hidden lg:block" style="aspect-ratio: 5/4.4;" aria-hidden="true">
					<!-- Teacher card -->
					<div class="absolute top-0 left-0 w-[62%] bg-white rounded-DEFAULT shadow-md p-4 border border-border">
						...
					</div>

					<!-- Progress card -->
					<div class="absolute rounded-DEFAULT p-4 text-white" ...>
						...
					</div>

					<!-- Session card -->
					<div class="absolute bottom-0 bg-white rounded-DEFAULT shadow-md p-4 border border-border" ...>
						...
					</div>
				</div>
```

Replace with:

```svelte
				<!-- Right: brand mark -->
				<div class="hidden lg:flex items-center justify-center">
					<img
						src="/brand-kit/png/logo-mark-1024.png"
						alt="Mutawazin"
						class="w-full max-w-sm drop-shadow-md"
					/>
				</div>
```

---

### Task 4: Remove Blog link from footer

**Files:**
- Modify: `src/routes/+page.svelte:245`

The footer Company column currently has 3 links: Blog, Contact, Privacy Policy. Blog is marked `remove`.

- [ ] **Step 1: Remove the Blog entry from the Company links array**

Find line 245:
```svelte
					{ titleKey: 'landing.footerCompanyTitle', links: [['landing.footerBlog', '#'], ['landing.footerContact', '#'], ['landing.footerPrivacy', '#']] },
```

Replace with:
```svelte
					{ titleKey: 'landing.footerCompanyTitle', links: [['landing.footerContact', '#'], ['landing.footerPrivacy', '#']] },
```

---

### Task 5: Remove deleted locale keys from `en.json`

**Files:**
- Modify: `src/locales/en.json`

Six key groups under the `"landing"` object must be removed.

- [ ] **Step 1: Remove `trustedStudents`, `trustedTeachers`, `trustedBy`**

Find and delete these three lines inside the `"landing"` object:
```json
    "trustedStudents": "2,400+",
    "trustedTeachers": "180",
    "trustedBy": "Trusted by {students} students & {teachers} verified teachers",
```

- [ ] **Step 2: Remove `heroTeacherCard` object**

Find and delete:
```json
    "heroTeacherCard": {
      "name": "Layla Haddad",
      "role": "Mathematics Tutor",
      "rating": "4.9 · 128 sessions"
    },
```

- [ ] **Step 3: Remove `heroProgressCard` object**

Find and delete:
```json
    "heroProgressCard": {
      "title": "Your weekly goal",
      "progress": "5 of 7 hours",
      "sub": "This week · 72%"
    },
```

- [ ] **Step 4: Remove `heroSessionCard` object**

Find and delete:
```json
    "heroSessionCard": {
      "badge": "Group session",
      "when": "Tomorrow · 4:00 PM",
      "title": "Intro to Calculus — Limits",
      "with": "with Layla Haddad · 8 students",
      "status": "Confirmed",
      "cta": "View →"
    }
```

> After deletion, also remove the trailing comma from the key that now precedes the closing `}` of the `"landing"` object if needed to keep valid JSON.

---

### Task 6: Remove same locale keys from `id.json`

**Files:**
- Modify: `src/locales/id.json`

Mirror of Task 5 for the Indonesian locale.

- [ ] **Step 1: Remove `trustedStudents`, `trustedTeachers`, `trustedBy`**

Find and delete:
```json
    "trustedStudents": "2.400+",
    "trustedTeachers": "180",
    "trustedBy": "Dipercaya oleh {students} murid & {teachers} guru terverifikasi",
```

- [ ] **Step 2: Remove `heroTeacherCard` object**

Find and delete:
```json
    "heroTeacherCard": {
      "name": "Layla Haddad",
      "role": "Tutor Matematika",
      "rating": "4,9 · 128 sesi"
    },
```

- [ ] **Step 3: Remove `heroProgressCard` object**

Find and delete:
```json
    "heroProgressCard": {
      "title": "Target minggu ini",
      "progress": "5 dari 7 jam",
      "sub": "Minggu ini · 72%"
    },
```

- [ ] **Step 4: Remove `heroSessionCard` object**

Find and delete:
```json
    "heroSessionCard": {
      "badge": "Sesi grup",
      "when": "Besok · 16:00",
      "title": "Pengantar Kalkulus — Limit",
      "with": "dengan Layla Haddad · 8 murid",
      "status": "Dikonfirmasi",
      "cta": "Lihat →"
    }
```

---

### Task 7: Verify and commit

- [ ] **Step 1: Run type check**

```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
npm run check
```
Expected: `0 ERRORS`. The 5 known warnings (autofocus, $state capture, tsconfig node) are acceptable.

- [ ] **Step 2: Commit all changes**

```powershell
git add static/brand-kit src/routes/+page.svelte src/locales/en.json src/locales/id.json
git commit -m "feat: replace hero vignette with brand mark, remove fake data

- Copy brand kit assets to static/brand-kit/
- Replace hero right column fake UI cards with logo-mark-1024.png
- Remove trust row (fake student/teacher counts)
- Remove footer Blog link
- Remove 6 hero locale key groups from en.json + id.json
- Remove unused avatarColor import"
```

---

## Self-Review

**Spec coverage:**
- ✅ Copy brand-kit to static/ → Task 1
- ✅ Remove trust row → Task 2
- ✅ Remove unused `avatarColor` import → Task 2
- ✅ Replace hero right column with brand mark PNG → Task 3
- ✅ Remove footer Blog link → Task 4
- ✅ Remove 6 locale key groups from en.json → Task 5
- ✅ Remove 6 locale key groups from id.json → Task 6
- ✅ npm run check + commit → Task 7

**Placeholder scan:** None found. All steps show exact code to add/remove.

**Type consistency:** No types — markup-only changes.
