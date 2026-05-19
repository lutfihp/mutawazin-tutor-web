# Mutawazin — QA Smoke Test Checklist

**Test credentials:** `admin@mutawazin.com` / `changeme123`
**Dev server:** `npm run dev` → `http://localhost:5173`
**Backend must be running at:** `http://localhost:8000`

Mark each item ✅ pass / ❌ fail / ⚠️ partial.

---

## Setup

- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:5173` loads the landing page
- [ ] Backend is running at `http://localhost:8000`

---

## 1. Landing Page (public, no login)

- [ ] Landing page loads with hero, benefits, featured teachers, search
- [ ] Navbar "Home" link goes to `/` (not `/#`)
- [ ] Navbar "Courses", "Teachers", "About" scroll to correct page sections
- [ ] "Log in" link in Navbar goes to `/login`
- [ ] "Browse all teachers" button and Footer "Teachers" link both go to `/teachers`
- [ ] Footer has no dead `#` links (Blog / Contact / Privacy columns removed)
- [ ] Public search: typing in the search bar returns courses and teachers
- [ ] Featured teachers cards each have a working "View Profile →" link
- [ ] `/teachers` public directory page loads and shows featured teacher cards

---

## 2. Auth

- [ ] `/login` — log in with `admin@mutawazin.com` / `changeme123` → redirects to `/admin`
- [ ] `/register/teacher` — form loads, password show/hide works, subject tag input works
- [ ] `/register/student` — form loads, date of birth field works
- [ ] `/forgot-password` — page loads, form submits without error
- [ ] Navbar "Sign out" button: clicking it logs out and redirects to `/`
- [ ] After logout, `/dashboard` redirects back to `/login`

---

## 3. Admin Dashboard (`admin@mutawazin.com`)

- [ ] Stats cards load (Total Teachers, Students, Active Courses, Pending Approvals)
- [ ] Pending Teacher Approvals table loads; Approve / Reject buttons work
- [ ] Pending Student Approvals table loads; Approve / Reject buttons work
- [ ] All Users → Teachers tab: teacher rows load with name, email, status, type
- [ ] All Users → Teachers tab: each row has a `☆ Feature` button
  - [ ] Clicking `☆ Feature` → button turns to `★ Featured` (gold)
  - [ ] Clicking `★ Featured` again → toggles back to `☆ Feature`
- [ ] All Users → Students tab: student rows load
- [ ] "View Profile →" links work in both tabs
- [ ] Subjects section: pending suggestions list loads; Approve / Reject work
- [ ] "+ Create Teacher" and "+ Create Student" modals open and submit
- [ ] Sidebar badge count updates when approvals exist

---

## 4. Teacher Dashboard (log in as a teacher)

- [ ] Welcome heading shows the teacher's real name (not "Layla")
- [ ] Upcoming Sessions card loads with real data
- [ ] My Private Students card loads (with last session date if available)
- [ ] Recent Reports card loads
- [ ] Quick Actions: "Create Course" → `/courses`, "Manage Availability" → `/calendar`, "Write Report" → `/dashboard#private-students`
- [ ] **My Students roster** card appears below Quick Actions
  - [ ] Student list loads from `GET /students`
  - [ ] Each row shows name, age badge, "Open →" link
  - [ ] Empty state shows if no students assigned

---

## 5. Student Dashboard (log in as a student)

- [ ] Welcome heading shows the student's real name (not "Nour")
- [ ] No streak count displayed (removed)
- [ ] Upcoming Sessions card loads
- [ ] Enrolled Courses card loads; "Browse courses →" link works
- [ ] Latest Report Card loads (or shows empty state)
- [ ] Assigned Teacher card shows teacher name + subjects
  - [ ] No "Message" button (removed)
  - [ ] "View Profile →" link works

---

## 6. Sidebar Navigation (teacher + student)

- [ ] **Teacher** "My Profile" → `/teachers/{id}` (not `/dashboard`)
- [ ] **Teacher** "Reports" → `/dashboard#private-students`
- [ ] **Teacher** no "My Students" item (removed)
- [ ] **Student** "My Profile" → `/students/{id}` (not `/dashboard`)
- [ ] **Student** "My Reports" → `/reports/{id}`
- [ ] All other sidebar links navigate correctly (Dashboard, My Courses, Calendar)

---

## 7. Teacher Profile (`/teachers/{id}`)

- [ ] Profile header loads with name, subjects, experience, sessions count
- [ ] No "Message" button visible when viewing another teacher's profile
- [ ] Edit mode toggle works (own profile only)
- [ ] Bio edit (pencil icon → textarea → save) works
- [ ] Credentials section loads
- [ ] Rating display shows if ratings exist

---

## 8. Courses (`/courses`)

- [ ] Course grid loads
- [ ] Subject filter dropdown populates from `GET /subjects` (not hardcoded)
- [ ] Age category chip filters work
- [ ] Search input filters results
- [ ] Teacher: "+ Create New Course" button opens modal with subject picker
- [ ] Course subject suggestion form works
- [ ] Each course card renders with gradient band, subject, age badges

---

## 9. Calendar (`/calendar`) — Teacher view

### Month grid
- [ ] Month grid loads with correct month/year
- [ ] Prev/Next month navigation works
- [ ] "Today" button returns to current month
- [ ] Sessions appear as pills on correct dates
- [ ] Clicking a session pill opens the session detail modal

### Session detail modal
- [ ] Session details show (title, type, when, status)
- [ ] Confirmed session: "Cancel Session" button shows
  - [ ] Clicking → "Are you sure?" confirm appears
  - [ ] Clicking "Confirm" → calls `PATCH /sessions/{id}/status` with `cancelled` (check Network tab)
  - [ ] Session status updates to Cancelled in the UI
- [ ] Confirmed session: "Mark Completed" button shows
  - [ ] Clicking → calls `PATCH /sessions/{id}/status` with `completed` (check Network tab)
  - [ ] Session status updates to Completed

### Add Session modal
- [ ] "+ Add Session" button opens modal with 7 fields
- [ ] **Type** radio-pills: Group / Private
- [ ] **Title** text input accepts text
- [ ] Selecting **Group** → Course dropdown populates from `GET /courses`
- [ ] Selecting **Private** → Student dropdown populates from `GET /students`
- [ ] **Date** picker works
- [ ] **Start time** and **End time** pickers work (side by side)
- [ ] **Mode** radio-pills: Online / Offline
- [ ] **Price** number input accepts value (optional)
- [ ] Clicking Save → `POST /sessions` fires (check Network tab with ISO timestamps)
- [ ] New session pill appears on the calendar after save
- [ ] Cancel button closes modal without saving

### Recurring templates panel
- [ ] "+ Recurring" button opens modal
- [ ] Existing templates list with edit/delete
- [ ] Delete shows confirmation dialog

### Availability panel
- [ ] Existing slots display with day name (e.g. "Monday · 09:00–10:00", not raw number)
- [ ] **Add Slot:**
  - [ ] "+ Add Slot" button opens modal
  - [ ] "Weekly (day of week)" mode → day dropdown appears
  - [ ] "Specific date" mode → date picker appears
  - [ ] Fill start/end time → Save → `POST /availability` fires
  - [ ] New slot appears in panel with day name
- [ ] **Edit Slot:**
  - [ ] Pencil icon → modal opens pre-filled with current times
  - [ ] Change time → Save → `PUT /availability/{id}` fires
  - [ ] Slot updates in panel
- [ ] **Delete Slot:**
  - [ ] Trash icon → "Sure?" confirm appears inline
  - [ ] "Delete" → `DELETE /availability/{id}` fires, slot removed
  - [ ] "✕" → confirm dismisses, slot stays

---

## 10. Calendar — Student view

- [ ] Calendar loads in read-only mode (no "+ Add Session" button, no availability panel)
- [ ] Sessions show as pills
- [ ] Clicking a completed session → rating form appears
- [ ] Submitting a rating → `POST /sessions/{id}/rating` fires

---

## 11. Reports (`/reports/{studentId}`)

- [ ] Report cards load with session title, date, scores, notes
- [ ] Teacher: "+ Create Report" button opens modal
  - [ ] Session select, attendance radio-pills, scores table, notes textarea
  - [ ] Save → report appears in list
- [ ] "Edit Report" link opens pre-filled modal
- [ ] "Share" button opens share panel → "Copy link" copies to clipboard
- [ ] Public share link (`/report/share/{token}`) works without login

---

## 12. Language Toggle (EN / ID)

- [ ] EN/ID toggle in Navbar switches all UI text
- [ ] Page refresh preserves the selected language

---

## Known Gaps (not yet implemented — expected to fail)

- Course enrollment button (`POST /courses/:id/enroll`) — not built
- Messaging feature — buttons intentionally removed
- Notification center — bell icon intentionally removed
