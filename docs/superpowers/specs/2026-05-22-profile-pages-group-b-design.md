# Design: Profile Pages Group B — Credentials Removal + Student Age Fix

**Date:** 2026-05-22  
**Status:** Approved

## Overview

Two targeted fixes to align teacher and student profile pages with the handoff design:

1. **Teacher profile** — remove the Credentials section (empty state was always showing; data not surfaced by the API in practice)
2. **Student profile** — replace the `age_category` badge with age calculated from `date_of_birth`

## Out of Scope (deferred)

- **Teacher profile — Current Courses section:** Pending backend confirmation on whether `GET /teachers/:user_id` returns course data or a separate endpoint is needed.

## Files Changed

| File | Change |
|---|---|
| `src/routes/teachers/[id]/+page.svelte` | Delete Credentials `<Card>` block (lines 177–199) |
| `src/routes/students/[id]/+page.svelte` | Replace `age_category` badge with DOB-calculated age |

---

## Change 1: Teacher Profile — Remove Credentials

**File:** `src/routes/teachers/[id]/+page.svelte`

Delete the entire Credentials card block:

```svelte
<!-- Credentials -->
<Card padding="lg" class="mb-4">
	<h2 class="font-semibold text-lg mb-4">{$t('profile.teacher.credentials')}</h2>
	{#if profile.credentials?.length}
		<div class="flex flex-col divide-y divide-border">
			{#each profile.credentials as cred}
				<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
					<div class="w-8 h-8 bg-primary-light text-primary rounded-sm flex items-center justify-center flex-none">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
							<path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9v5c3 3 9 3 12 0V9"/>
						</svg>
					</div>
					<div>
						<div class="font-semibold text-sm">{cred.title}</div>
						<div class="text-xs text-text2">{cred.institution} · {cred.year}</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-text2">{$t('profile.teacher.noCredentials')}</p>
	{/if}
</Card>
```

After deletion, the About card flows directly into the Details edit card (own edit mode) or the public details card.

---

## Change 2: Student Profile — Age from DOB

**File:** `src/routes/students/[id]/+page.svelte`

**Before** (lines 87–89):
```svelte
{#if profile.age_category}
	<Badge variant="violet" label={profile.age_category} />
{/if}
```

**After:**
```svelte
{#if profile.date_of_birth}
	{@const age = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))}
	{#if Number.isFinite(age) && age >= 0}
		<Badge variant="violet" label={String(age)} />
	{/if}
{/if}
```

Same formula used in the admin/students table fix. Shows nothing if `date_of_birth` is absent or produces an invalid result.
