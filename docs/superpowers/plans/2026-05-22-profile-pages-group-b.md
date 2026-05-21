# Profile Pages Group B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Credentials section from the teacher profile page and replace the broken age_category badge on the student profile page with age calculated from date_of_birth.

**Architecture:** Two isolated single-file edits — one block deletion, one template substitution. No new components, no API changes, no shared state.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS v3.

---

### Task 1: Teacher profile — remove Credentials card

**Files:**
- Modify: `src/routes/teachers/[id]/+page.svelte:177-199`

- [ ] **Step 1: Delete the Credentials card block**

  Find and remove the entire block from line 177 to 199 (the `<!-- Credentials -->` comment through the closing `</Card>`):

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

  After deletion, the About card (`<!-- About -->`) flows directly into the Details edit card (`<!-- Current Courses --> <!-- Details edit card -->`) with no gap.

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 3: Commit**

  ```bash
  git add src/routes/teachers/[id]/+page.svelte
  git commit -m "feat: remove credentials section from teacher profile"
  ```

---

### Task 2: Student profile — age badge from date_of_birth

**Files:**
- Modify: `src/routes/students/[id]/+page.svelte:87-89`

- [ ] **Step 1: Replace the age_category badge**

  Find this block (lines 87–89):

  ```svelte
  				{#if profile.age_category}
  					<Badge variant="violet" label={profile.age_category} />
  				{/if}
  ```

  Replace with:

  ```svelte
  				{#if profile.date_of_birth}
  					{@const age = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))}
  					{#if Number.isFinite(age) && age >= 0}
  						<Badge variant="violet" label={String(age)} />
  					{/if}
  				{/if}
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 3: Commit**

  ```bash
  git add src/routes/students/[id]/+page.svelte
  git commit -m "feat: show student age from date_of_birth on student profile"
  ```

---

### Task 3: Final verification

- [ ] **Step 1: Start dev server**

  ```powershell
  npm run dev
  ```

- [ ] **Step 2: Verify teacher profile**

  Open any teacher profile page (e.g. `http://localhost:5173/teachers/<id>`).

  - No Credentials card visible in either Public Preview or Edit View
  - About card is followed directly by the Details edit card (own view) or public details card

- [ ] **Step 3: Verify student profile**

  Open any student profile page (e.g. `http://localhost:5173/students/<id>`).

  - If the student has a `date_of_birth`, a violet badge shows their calculated age (e.g. `"17"`)
  - If `date_of_birth` is absent or invalid, no badge is shown (no empty badge)
