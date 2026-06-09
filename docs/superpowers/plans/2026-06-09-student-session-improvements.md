# Student & Session Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make student birthday optional on admin create, replace the session student multi-select with a search+chip picker component, and fix student name display in the Edit Session modal.

**Architecture:** Backend model and schema changes (Tasks 1–2) are independent of the frontend (Tasks 3–5). Tasks 4–5 are frontend-only. The StudentPicker component (Task 4) is created first, then wired into the calendar page (Task 5).

**Tech Stack:** FastAPI + Beanie ODM + pytest (backend); SvelteKit 5 runes + TypeScript + Tailwind v3 (frontend)

---

## File Map

| File | Change |
|---|---|
| `mutawazin-tutor-api/app/students/models.py` | Make `date_of_birth` and `age_category` Optional |
| `mutawazin-tutor-api/app/admin/schemas.py` | Make `date_of_birth` Optional on request |
| `mutawazin-tutor-api/app/admin/service.py` | Guard DOB computation in `create_student` |
| `mutawazin-tutor-api/tests/test_admin/test_user_management.py` | Add no-DOB test |
| `mutawazin-tutor-web/src/routes/admin/students/+page.svelte` | Remove `required` from DOB input; omit field when empty |
| `mutawazin-tutor-web/src/lib/components/ui/StudentPicker.svelte` | New component |
| `mutawazin-tutor-web/src/routes/admin/calendar/+page.svelte` | Replace both `<select multiple>` with `<StudentPicker>` |

---

### Task 1: Backend — Make StudentProfile fields optional

**Files:**
- Modify: `mutawazin-tutor-api/app/students/models.py:29-30`

- [ ] **Step 1: Update StudentProfile model**

  In `app/students/models.py`, change lines 29–30:

  ```python
  # Before
  date_of_birth: str  # ISO date string "YYYY-MM-DD"
  age_category: str   # "pre-school"|"elementary"|"middle-school"|"high-school"|"general"

  # After
  date_of_birth: Optional[str] = None
  age_category: Optional[str] = None
  ```

  The `calculate_age` function already guards against empty/None (`if not dob_str: return None`), so no changes needed there.

- [ ] **Step 2: Run tests to confirm nothing broke**

  ```powershell
  cd mutawazin-tutor-api
  venv\Scripts\python.exe -m pytest tests/ -x -q
  ```

  Expected: all 284 tests pass.

---

### Task 2: Backend — Make admin create student DOB optional

**Files:**
- Modify: `mutawazin-tutor-api/app/admin/schemas.py:27`
- Modify: `mutawazin-tutor-api/app/admin/service.py:65-73`
- Test: `mutawazin-tutor-api/tests/test_admin/test_user_management.py`

- [ ] **Step 1: Write the failing test**

  In `tests/test_admin/test_user_management.py`, add after the existing `test_admin_create_student` test:

  ```python
  @pytest.mark.asyncio
  async def test_admin_create_student_without_dob(admin_client: AsyncClient):
      resp = await admin_client.post("/admin/users/student", json={
          "username": "student_nodob",
          "password": "password123",
          "full_name": "No DOB Student",
      })
      assert resp.status_code == 201
      data = resp.json()
      assert data["status"] == "active"
      assert data["role"] == "student"
      profile = await StudentProfile.find_one({"user_id": data["id"]})
      assert profile is not None
      assert profile.date_of_birth is None
      assert profile.age_category is None
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```powershell
  venv\Scripts\python.exe -m pytest tests/test_admin/test_user_management.py::test_admin_create_student_without_dob -v
  ```

  Expected: FAIL with `422 Unprocessable Entity` (field currently required).

- [ ] **Step 3: Update the request schema**

  In `app/admin/schemas.py`, change line 27:

  ```python
  # Before
  date_of_birth: str

  # After
  date_of_birth: Optional[str] = None
  ```

- [ ] **Step 4: Guard DOB computation in service**

  In `app/admin/service.py`, replace lines 65–73:

  ```python
  # Before
  from app.students.models import StudentProfile, calculate_age_category
  from datetime import date
  dob = date.fromisoformat(data.date_of_birth)
  await StudentProfile(
      user_id=str(user.id),
      full_name=data.full_name,
      date_of_birth=data.date_of_birth,
      age_category=calculate_age_category(dob),
  ).insert()

  # After
  from app.students.models import StudentProfile, calculate_age_category
  from datetime import date
  if data.date_of_birth:
      dob = date.fromisoformat(data.date_of_birth)
      age_cat: Optional[str] = calculate_age_category(dob)
  else:
      age_cat = None
  await StudentProfile(
      user_id=str(user.id),
      full_name=data.full_name,
      date_of_birth=data.date_of_birth,
      age_category=age_cat,
  ).insert()
  ```

  Also add `Optional` to the import at the top of service.py if not already present. Check line 1:
  ```python
  from typing import Optional
  ```
  If missing, add it.

- [ ] **Step 5: Run test to verify it passes**

  ```powershell
  venv\Scripts\python.exe -m pytest tests/test_admin/test_user_management.py::test_admin_create_student_without_dob -v
  ```

  Expected: PASS.

- [ ] **Step 6: Run full test suite**

  ```powershell
  venv\Scripts\python.exe -m pytest tests/ -x -q
  ```

  Expected: 285 tests pass (one new test added).

- [ ] **Step 7: Commit backend changes**

  ```powershell
  cd mutawazin-tutor-api
  git add app/students/models.py app/admin/schemas.py app/admin/service.py tests/test_admin/test_user_management.py
  git commit -m "feat: make student date_of_birth optional on admin create"
  ```

---

### Task 3: Frontend — DOB optional in create student form

**Files:**
- Modify: `mutawazin-tutor-web/src/routes/admin/students/+page.svelte:78,248`

- [ ] **Step 1: Remove `required` from the DOB input**

  In `src/routes/admin/students/+page.svelte`, line 248, change:

  ```svelte
  <!-- Before -->
  <input id="newDob" type="date" bind:value={newDob} required
    class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />

  <!-- After -->
  <input id="newDob" type="date" bind:value={newDob}
    class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
  ```

- [ ] **Step 2: Omit `date_of_birth` from payload when empty**

  In `src/routes/admin/students/+page.svelte`, line 74–79, change the `handleCreate` payload:

  ```svelte
  <!-- Before -->
  await api.post('/admin/users/student', {
      full_name: newFullName,
      username: newUsername,
      password: newPassword,
      date_of_birth: newDob,
  });

  <!-- After -->
  await api.post('/admin/users/student', {
      full_name: newFullName,
      username: newUsername,
      password: newPassword,
      ...(newDob ? { date_of_birth: newDob } : {}),
  });
  ```

- [ ] **Step 3: Run type check**

  ```powershell
  cd mutawazin-tutor-web
  npm run check
  ```

  Expected: 0 errors, 16 pre-existing warnings.

- [ ] **Step 4: Commit**

  ```powershell
  git add src/routes/admin/students/+page.svelte
  git commit -m "feat: make date of birth optional in admin create student form"
  ```

---

### Task 4: Frontend — Create StudentPicker component

**Files:**
- Create: `mutawazin-tutor-web/src/lib/components/ui/StudentPicker.svelte`

- [ ] **Step 1: Create the component**

  Create `src/lib/components/ui/StudentPicker.svelte` with this content:

  ```svelte
  <script lang="ts">
    import { avatarColor, initials } from '$lib/utils/avatar';

    type Student = { id: string; full_name: string | null; username: string | null };

    let {
      students,
      value = $bindable([]),
    }: {
      students: Student[];
      value: string[];
    } = $props();

    let query = $state('');
    let open = $state(false);

    const filtered = $derived(
      query.length === 0
        ? []
        : students
            .filter((s) => !value.includes(s.id))
            .filter((s) => {
              const name = (s.full_name ?? s.username ?? '').toLowerCase();
              return name.includes(query.toLowerCase());
            })
            .slice(0, 6)
    );

    const selected = $derived(
      value.map(
        (id) => students.find((s) => s.id === id) ?? { id, full_name: null, username: id }
      )
    );

    function displayName(s: Student): string {
      return s.full_name ?? s.username ?? s.id;
    }

    function add(student: Student) {
      value = [...value, student.id];
      query = '';
      open = false;
    }

    function remove(id: string) {
      value = value.filter((v) => v !== id);
    }
  </script>

  <div class="relative flex flex-col gap-2">
    <div class="relative">
      <input
        type="text"
        bind:value={query}
        oninput={() => { open = query.length > 0; }}
        onblur={() => { setTimeout(() => { open = false; }, 150); }}
        placeholder="Type name to search..."
        class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {#if open && filtered.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-sm shadow-md z-20 max-h-48 overflow-y-auto">
          {#each filtered as student}
            <button
              type="button"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bgGray text-left"
              onmousedown={() => add(student)}
            >
              <span
                class="w-7 h-7 rounded-pill flex items-center justify-center text-white text-xs flex-shrink-0"
                style="background-color: {avatarColor(student.id)}"
              >
                {initials(displayName(student))}
              </span>
              {displayName(student)}
            </button>
          {/each}
          <div class="px-3 py-1.5 text-xs text-text2 bg-bgGray border-t border-border">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
          </div>
        </div>
      {/if}
    </div>

    {#if selected.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each selected as student}
          <span class="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-pill px-2.5 py-1 text-xs">
            <span
              class="w-5 h-5 rounded-pill flex items-center justify-center text-white text-[9px] flex-shrink-0"
              style="background-color: {avatarColor(student.id)}"
            >
              {initials(displayName(student))}
            </span>
            <span class="text-primary font-medium">{displayName(student)}</span>
            <button
              type="button"
              onclick={() => remove(student.id)}
              class="text-primary/50 hover:text-primary ml-0.5 leading-none"
              aria-label="Remove {displayName(student)}"
            >×</button>
          </span>
        {/each}
      </div>
    {/if}
  </div>
  ```

- [ ] **Step 2: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors, 16 pre-existing warnings.

- [ ] **Step 3: Commit**

  ```powershell
  git add src/lib/components/ui/StudentPicker.svelte
  git commit -m "feat: add StudentPicker search+chip component"
  ```

---

### Task 5: Frontend — Wire StudentPicker into admin calendar

**Files:**
- Modify: `mutawazin-tutor-web/src/routes/admin/calendar/+page.svelte`

- [ ] **Step 1: Import StudentPicker**

  At the top of the `<script>` block in `src/routes/admin/calendar/+page.svelte`, add the import alongside existing component imports:

  ```svelte
  import StudentPicker from '$lib/components/ui/StudentPicker.svelte';
  ```

- [ ] **Step 2: Replace Edit Session student picker (lines 569–586)**

  Find this block in the Edit Session modal:

  ```svelte
  <div class="flex flex-col gap-1.5">
  	<label for="eStudentIds" class="text-[13px] font-medium">Students</label>
  	<select
  		id="eStudentIds"
  		multiple
  		class="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary h-28"
  		onchange={(e) => {
  			eStudentIds = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value);
  		}}
  	>
  		{#each adminStudents as student}
  			<option value={student.user_id ?? student.id} selected={eStudentIds.includes(student.user_id ?? student.id)}>
  				{student.full_name ?? student.username ?? student.id}
  			</option>
  		{/each}
  	</select>
  	<p class="text-xs text-text2">Hold Ctrl/Cmd to select multiple</p>
  </div>
  ```

  Replace with:

  ```svelte
  <div class="flex flex-col gap-1.5">
  	<label class="text-[13px] font-medium">Students</label>
  	<StudentPicker students={adminStudents} bind:value={eStudentIds} />
  </div>
  ```

- [ ] **Step 3: Replace Add Session student picker (lines 659–676)**

  Find this block in the Add Session modal:

  ```svelte
  <div class="flex flex-col gap-1.5">
  	<label for="sStudentIds" class="text-[13px] font-medium">Students</label>
  	<select
  		id="sStudentIds"
  		multiple
  		class="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary h-28"
  		onchange={(e) => {
  			sStudentIds = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value);
  		}}
  	>
  		{#each adminStudents as student}
  			<option value={student.user_id ?? student.id} selected={sStudentIds.includes(student.user_id ?? student.id)}>
  				{student.full_name ?? student.username ?? student.id}
  			</option>
  		{/each}
  	</select>
  	<p class="text-xs text-text2">Hold Ctrl/Cmd to select multiple</p>
  </div>
  ```

  Replace with:

  ```svelte
  <div class="flex flex-col gap-1.5">
  	<label class="text-[13px] font-medium">Students</label>
  	<StudentPicker students={adminStudents} bind:value={sStudentIds} />
  </div>
  ```

- [ ] **Step 4: Run type check**

  ```powershell
  npm run check
  ```

  Expected: 0 errors, 16 pre-existing warnings.

- [ ] **Step 5: Manual verification**

  Start dev server: `npm run dev`

  Test in browser at `http://localhost:5173`:

  | Scenario | Steps | Expected |
  |---|---|---|
  | Add Session — search | Open Add Session modal → Students field → type a name | Dropdown shows filtered results (max 6) |
  | Add Session — select | Click a result | Chip appears below with student name and avatar |
  | Add Session — remove | Click × on chip | Chip disappears, student back in search results |
  | Edit Session — pre-populate | Click an existing session that has assigned students | Chips show immediately with student names |
  | Edit Session — add/remove | Type to add another student, × to remove | Works same as Add Session |
  | Admin create student — no DOB | Fill form without DOB, submit | Student created successfully (status 201) |

- [ ] **Step 6: Commit**

  ```powershell
  git add src/routes/admin/calendar/+page.svelte
  git commit -m "feat: replace session student multi-select with StudentPicker component"
  ```
