# Admin Courses — Student Enrollment Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Manage Students" modal to the admin courses page that lets admin view enrolled students, enroll new students, and unenroll existing ones — all without leaving `/admin/courses`.

**Architecture:** Single file change to `src/routes/admin/courses/+page.svelte`. New state variables and three handler functions are added to the existing script block. A "Manage Students" item is prepended to the existing `<DropdownMenu>` per row. A new modal is appended after the existing Delete modal.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS v3, existing `api` client, `<Modal>`, `<Button>`.

---

### Task 1: Add enrollment state and handler functions

**Files:**
- Modify: `src/routes/admin/courses/+page.svelte:206-208`

- [ ] **Step 1: Insert enrollment state and functions before `onMount`**

  Find this block (lines 206–208):

  ```svelte
  	}

  	onMount(fetchAll);
  </script>
  ```

  Replace with:

  ```svelte
  	}

  	// ── Enrollment modal ──────────────────────────────────────
  	let enrollOpen = $state(false);
  	// eslint-disable-next-line @typescript-eslint/no-explicit-any
  	let enrollTarget = $state<any | null>(null);
  	// eslint-disable-next-line @typescript-eslint/no-explicit-any
  	let allStudents = $state<any[]>([]);
  	let studentsLoading = $state(false);
  	let studentMap = $state<Record<string, string>>({});
  	let enrollStudentId = $state('');
  	let enrollLoading = $state(false);
  	let unenrollLoadingId = $state<string | null>(null);
  	let enrollError = $state('');

  	async function openManageStudents(course: any) {
  		enrollTarget = course;
  		enrollStudentId = '';
  		enrollError = '';
  		enrollOpen = true;
  		if (allStudents.length > 0) return;
  		studentsLoading = true;
  		try {
  			const res = await api.get<any[]>('/admin/students');
  			allStudents = (Array.isArray(res) ? res : [])
  				.filter((s: any) => s.status !== 'deleted');
  			studentMap = Object.fromEntries(
  				allStudents.map((s: any) => [s.user_id ?? s.id, s.full_name ?? s.name ?? '—'])
  			);
  		} catch {
  			allStudents = [];
  		} finally {
  			studentsLoading = false;
  		}
  	}

  	async function handleEnroll() {
  		if (!enrollTarget || !enrollStudentId) return;
  		enrollLoading = true;
  		enrollError = '';
  		try {
  			await api.post(`/courses/${enrollTarget.id}/enroll`, { student_id: enrollStudentId });
  			const updated = {
  				...enrollTarget,
  				enrolled_student_ids: [...(enrollTarget.enrolled_student_ids ?? []), enrollStudentId],
  			};
  			enrollTarget = updated;
  			allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
  			enrollStudentId = '';
  		} catch (err: unknown) {
  			enrollError = err instanceof Error ? err.message : 'Failed to enroll student.';
  		} finally {
  			enrollLoading = false;
  		}
  	}

  	async function handleUnenroll(studentId: string) {
  		if (!enrollTarget) return;
  		unenrollLoadingId = studentId;
  		enrollError = '';
  		try {
  			await api.delete(`/courses/${enrollTarget.id}/enroll/${studentId}`);
  			const updated = {
  				...enrollTarget,
  				enrolled_student_ids: (enrollTarget.enrolled_student_ids ?? []).filter((id: string) => id !== studentId),
  			};
  			enrollTarget = updated;
  			allCourses = allCourses.map((c: any) => c.id === updated.id ? updated : c);
  		} catch (err: unknown) {
  			enrollError = err instanceof Error ? err.message : 'Failed to unenroll student.';
  		} finally {
  			unenrollLoadingId = null;
  		}
  	}

  	onMount(fetchAll);
  </script>
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

---

### Task 2: Add "Manage Students" to the DropdownMenu and add the modal

**Files:**
- Modify: `src/routes/admin/courses/+page.svelte:263-266` (DropdownMenu)
- Modify: `src/routes/admin/courses/+page.svelte:430` (after Delete modal closing tag)

- [ ] **Step 1: Prepend "Manage Students" to the DropdownMenu**

  Find (lines 263–266):

  ```svelte
  								<DropdownMenu items={[
  									{ label: 'Edit', onclick: () => openEdit(course) },
  									{ label: 'Delete', variant: 'danger', onclick: () => openDelete(course.id, course.name) },
  								]} />
  ```

  Replace with:

  ```svelte
  								<DropdownMenu items={[
  									{ label: 'Manage Students', onclick: () => openManageStudents(course) },
  									{ label: 'Edit', onclick: () => openEdit(course) },
  									{ label: 'Delete', variant: 'danger', onclick: () => openDelete(course.id, course.name) },
  								]} />
  ```

- [ ] **Step 2: Add the Manage Students modal after the Delete modal**

  Find the closing tag of the Delete modal (line 430):

  ```svelte
  </Modal>
  ```

  (This is the last line of the file — the closing tag of the Delete Course Modal block.) Append after it:

  ```svelte

  <!-- Manage Students Modal -->
  <Modal open={enrollOpen} title="Manage Students — {enrollTarget?.name ?? ''}" onclose={() => (enrollOpen = false)}>
  	{#if enrollError}
  		<div class="mb-3 p-3 bg-errorBg rounded-sm text-sm text-errorText">{enrollError}</div>
  	{/if}

  	<!-- Enrolled Students -->
  	<div class="mb-5">
  		<h3 class="text-[13px] font-semibold text-text2 uppercase tracking-wide mb-2">Enrolled Students</h3>
  		{#if studentsLoading}
  			<p class="text-sm text-text2">{$t('common.loading')}</p>
  		{:else if (enrollTarget?.enrolled_student_ids ?? []).length === 0}
  			<p class="text-sm text-text2">No students enrolled yet.</p>
  		{:else}
  			<div class="flex flex-col divide-y divide-border">
  				{#each (enrollTarget?.enrolled_student_ids ?? []) as sid}
  					<div class="flex items-center justify-between py-2.5">
  						<span class="text-sm">{studentMap[sid] ?? sid}</span>
  						<button
  							onclick={() => handleUnenroll(sid)}
  							disabled={unenrollLoadingId === sid}
  							class="text-xs font-medium px-2 py-1 rounded-sm text-errorText bg-errorBg hover:bg-error/20 transition-colors disabled:opacity-50"
  						>
  							{unenrollLoadingId === sid ? 'Removing…' : 'Unenroll'}
  						</button>
  					</div>
  				{/each}
  			</div>
  		{/if}
  	</div>

  	<!-- Enroll a Student -->
  	<div>
  		<h3 class="text-[13px] font-semibold text-text2 uppercase tracking-wide mb-2">Enroll a Student</h3>
  		{#if studentsLoading}
  			<p class="text-sm text-text2">Loading students…</p>
  		{:else}
  			{@const available = allStudents.filter((s: any) =>
  				!(enrollTarget?.enrolled_student_ids ?? []).includes(s.user_id ?? s.id)
  			)}
  			{#if available.length === 0}
  				<p class="text-sm text-text2">All students are already enrolled.</p>
  			{:else}
  				<div class="flex gap-2">
  					<select bind:value={enrollStudentId}
  						class="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
  						<option value="">Select a student</option>
  						{#each available as student}
  							<option value={student.user_id ?? student.id}>{student.full_name ?? student.name}</option>
  						{/each}
  					</select>
  					<Button variant="primary" size="sm" loading={enrollLoading}
  						onclick={handleEnroll} disabled={!enrollStudentId}>
  						Enroll
  					</Button>
  				</div>
  			{/if}
  		{/if}
  	</div>

  	{#snippet footer()}
  		<Button variant="secondary" size="sm" onclick={() => (enrollOpen = false)}>{$t('common.cancel')}</Button>
  	{/snippet}
  </Modal>
  ```

- [ ] **Step 3: Run type check**

  ```powershell
  npm run check
  ```

  Expected: `0 errors`

- [ ] **Step 4: Commit**

  ```bash
  git add src/routes/admin/courses/+page.svelte
  git commit -m "feat: add student enrollment management to admin courses page"
  ```

---

### Task 3: Verify

- [ ] **Step 1: Start dev server**

  ```powershell
  npm run dev
  ```

- [ ] **Step 2: Verify Manage Students modal opens**

  Log in as `admin@mutawazin.com / changeme123`. Navigate to `http://localhost:5173/admin/courses`. Click `⋮` on any course — dropdown should show **Manage Students / Edit / Delete**.

  Click "Manage Students" — modal opens with title "Manage Students — [course name]".

- [ ] **Step 3: Verify enrolled student list**

  If the course has `enrolled_student_ids`, those students appear by name with an "Unenroll" button each. If none, "No students enrolled yet." is shown.

- [ ] **Step 4: Verify enroll**

  Select a student from the dropdown and click "Enroll". The student name appears in the enrolled list. The Enrolled count in the table row updates immediately (increments by 1).

- [ ] **Step 5: Verify unenroll**

  Click "Unenroll" next to an enrolled student. The student disappears from the list. The Enrolled count in the table row decrements by 1.

- [ ] **Step 6: Verify student filter**

  Already-enrolled students do not appear in the "Enroll a Student" dropdown.
