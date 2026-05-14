# Repo Restructure — SvelteKit to Root

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the SvelteKit app from `mutawazin-fe/` to the repo root so `mutawazin-tutor-web` on GitHub is the SvelteKit project directly, matching `mutawazin-tutor-api`.

**Architecture:** Pure file system restructure — no code changes. Copy source files from the subfolder to root, write a merged `.gitignore`, reinstall `node_modules` at the new location, delete the empty subfolder, update documentation paths.

**Tech Stack:** PowerShell (Windows), SvelteKit, Node.js

---

## File Map

| Action | Path |
|--------|------|
| Copy (dir) | `mutawazin-fe/src/` → `src/` |
| Copy (dir) | `mutawazin-fe/static/` → `static/` |
| Copy (file) | `mutawazin-fe/package.json` → `package.json` |
| Copy (file) | `mutawazin-fe/package-lock.json` → `package-lock.json` |
| Copy (file) | `mutawazin-fe/svelte.config.js` → `svelte.config.js` |
| Copy (file) | `mutawazin-fe/tailwind.config.js` → `tailwind.config.js` |
| Copy (file) | `mutawazin-fe/tsconfig.json` → `tsconfig.json` |
| Copy (file) | `mutawazin-fe/vite.config.ts` → `vite.config.ts` |
| Copy (file) | `mutawazin-fe/postcss.config.js` → `postcss.config.js` |
| Copy (file) | `mutawazin-fe/.npmrc` → `.npmrc` |
| Copy (file) | `mutawazin-fe/.env` → `.env` (if exists) |
| Copy (file) | `mutawazin-fe/.env.example` → `.env.example` (if exists) |
| Copy (file) | `mutawazin-fe/README.md` → `README.md` |
| Create | `.gitignore` (merged content) |
| Modify | `CLAUDE.md` (update paths) |
| Delete | `mutawazin-fe/` (entire subfolder) |
| Regenerate | `node_modules/` via `npm install` at root |

---

### Task 1: Copy `src/` and `static/` to root

**Files:**
- Create: `src/` (copied from `mutawazin-fe/src/`)
- Create: `static/` (copied from `mutawazin-fe/static/`)

- [ ] **Step 1: Copy the `src/` directory**

Run from `d:\Codading Repo\mutawazin-tutor-web`:
```powershell
Copy-Item -Path "mutawazin-fe\src" -Destination "src" -Recurse -Force
```
Expected: `src/` folder appears at repo root with the full SvelteKit source tree inside.

- [ ] **Step 2: Copy the `static/` directory**

```powershell
Copy-Item -Path "mutawazin-fe\static" -Destination "static" -Recurse -Force
```
Expected: `static/` folder appears at repo root containing `robots.txt`.

- [ ] **Step 3: Verify directory structure**

```powershell
Get-ChildItem -Path "." -Directory | Select-Object Name
```
Expected output includes: `src`, `static`, `design_handoff_mutawazin`, `docs`, `mutawazin-fe`

---

### Task 2: Copy config files to root

**Files:**
- Create: `package.json`, `package-lock.json`, `svelte.config.js`, `tailwind.config.js`, `tsconfig.json`, `vite.config.ts`, `postcss.config.js`, `.npmrc`, `README.md`, `.env`, `.env.example`

- [ ] **Step 1: Copy all config files**

```powershell
$files = @(
    "package.json", "package-lock.json",
    "svelte.config.js", "tailwind.config.js",
    "tsconfig.json", "vite.config.ts",
    "postcss.config.js", ".npmrc",
    "README.md", ".env", ".env.example"
)
foreach ($f in $files) {
    $src = "mutawazin-fe\$f"
    if (Test-Path $src) {
        Copy-Item $src "." -Force
        Write-Host "Copied: $f"
    } else {
        Write-Host "Skipped (not found): $f"
    }
}
```
Expected: Each file that exists in `mutawazin-fe/` is reported as "Copied". `.env.example` will copy; `.env` will copy if it exists.

- [ ] **Step 2: Verify package.json is at root**

```powershell
Get-Content "package.json" | Select-Object -First 5
```
Expected: Shows `"name": "mutawazin-fe"` (name will be updated in Task 5).

---

### Task 3: Write the merged `.gitignore`

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Write `.gitignore` at root**

```powershell
$content = @"
node_modules

# Output
.output
.vercel
.netlify
.wrangler
/.svelte-kit
/build

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Design handoff — local reference only, never committed
design_handoff_mutawazin/
2026-05-13-fe-handoff-sveltekit.md
"@
Set-Content -Path ".gitignore" -Value $content -Encoding utf8
```
Expected: `.gitignore` created at root.

- [ ] **Step 2: Verify the handoff entries are present**

```powershell
Select-String -Path ".gitignore" -Pattern "design_handoff"
```
Expected: `design_handoff_mutawazin/` line appears in output.

---

### Task 4: Install dependencies at root

- [ ] **Step 1: Run `npm install` at repo root**

```powershell
npm install
```
Expected: `node_modules/` created at repo root. Output ends with `added N packages` and no errors.

- [ ] **Step 2: Verify SvelteKit is available**

```powershell
Test-Path "node_modules\.bin\vite"
```
Expected: `True`

---

### Task 5: Update `package.json` name and `CLAUDE.md` paths

**Files:**
- Modify: `package.json` (name field)
- Modify: `CLAUDE.md` (path references)

- [ ] **Step 1: Update `package.json` name to match repo**

Open `package.json` and change:
```json
"name": "mutawazin-fe",
```
to:
```json
"name": "mutawazin-tutor-web",
```

- [ ] **Step 2: Update CLAUDE.md — header line**

In `CLAUDE.md`, find and replace line 8:
```
**SvelteKit app lives at:** `mutawazin-fe/` (subfolder)
```
Replace with:
```
**SvelteKit app is at the repo root** — `src/`, `package.json`, etc. live at `d:\Codading Repo\mutawazin-tutor-web`
```

- [ ] **Step 3: Update CLAUDE.md — Key File Locations tree**

Find the tree block that starts with:
````
```
mutawazin-fe/
├── tailwind.config.js
````
Replace the opening line `mutawazin-fe/` with the repo root label:
````
```
mutawazin-tutor-web/          ← repo root
├── tailwind.config.js
````

- [ ] **Step 4: Update CLAUDE.md — How to Run `cd` command**

Find:
```powershell
cd "d:\Codading Repo\mutawazin-tutor-web\mutawazin-fe"
```
Replace with:
```powershell
cd "d:\Codading Repo\mutawazin-tutor-web"
```

---

### Task 6: Verify build passes at root

- [ ] **Step 1: Run type check**

```powershell
npm run check
```
Expected: `0 ERRORS` in output. Warnings about `$state` capture and `tsconfig.json` node types are known and acceptable.

- [ ] **Step 2: Run production build**

```powershell
npm run build
```
Expected: `✓ built in Xs` with no errors. The `Could not detect a supported production environment` adapter notice is expected and harmless.

---

### Task 7: Delete `mutawazin-fe/` subfolder

> ⚠️ Only run this after Task 6 confirms the build passes at root.

- [ ] **Step 1: Delete the subfolder**

```powershell
Remove-Item -Path "mutawazin-fe" -Recurse -Force
```
Expected: No output. `mutawazin-fe/` no longer appears in directory listing.

- [ ] **Step 2: Confirm it's gone**

```powershell
Test-Path "mutawazin-fe"
```
Expected: `False`

---

### Task 8: Final verification and commit

- [ ] **Step 1: Run check one more time from clean state**

```powershell
npm run check
```
Expected: `0 ERRORS`

- [ ] **Step 2: Run dev server briefly to confirm it starts**

```powershell
npm run dev
```
Expected: `VITE vX.X.X  ready in Xms` and `Local: http://localhost:5173/` — press Ctrl+C after confirming.

- [ ] **Step 3: Initialize git at root (if not already done)**

```powershell
git init
git remote add origin https://github.com/YOUR_USERNAME/mutawazin-tutor-web.git
```
Skip this step if `git status` already works (repo already initialized).

- [ ] **Step 4: Stage and commit**

```powershell
git add src static package.json package-lock.json svelte.config.js tailwind.config.js tsconfig.json vite.config.ts postcss.config.js .npmrc .env.example README.md .gitignore CLAUDE.md docs
git commit -m "chore: move SvelteKit app to repo root

Promotes mutawazin-fe/ to the repo root so the GitHub repo
mutawazin-tutor-web aligns structurally with mutawazin-tutor-api.
Design handoff files gitignored (local reference only)."
```

---

## Self-Review

**Spec coverage:**
- ✅ Copy SvelteKit files to root → Tasks 1–2
- ✅ Write merged `.gitignore` with handoff entries → Task 3
- ✅ `npm install` at root → Task 4
- ✅ Delete `mutawazin-fe/` → Task 7
- ✅ Update `CLAUDE.md` paths → Task 5
- ✅ Verify `npm run check` + `npm run build` → Task 6
- ✅ Handoff files gitignored, not deleted → Task 3 `.gitignore` + handoff files remain on disk

**Placeholder scan:** None found. All steps include exact commands and expected output.

**Type consistency:** No types or method signatures — file-move plan only.
