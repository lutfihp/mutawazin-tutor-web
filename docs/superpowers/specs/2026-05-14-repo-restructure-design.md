# Repo Restructure — SvelteKit to Root

**Date:** 2026-05-14
**Status:** Approved

## Problem

The SvelteKit app currently lives in `mutawazin-tutor-web/mutawazin-fe/`. The GitHub repo should be named `mutawazin-tutor-web` (to match the backend `mutawazin-tutor-api`), which means the SvelteKit project must live at the repo root — not in a subfolder.

## Approved Approach

Move all SvelteKit files from `mutawazin-fe/` up to the repo root. Gitignore the design handoff files so they stay locally but are never committed.

## Target Structure

```
mutawazin-tutor-web/              ← repo root = SvelteKit project root
├── src/
├── static/
├── package.json
├── package-lock.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── .npmrc
├── .env                          ← gitignored (already in .gitignore)
├── .env.example
├── CLAUDE.md                     ← committed, updated paths
├── README.md
├── .gitignore                    ← merged from mutawazin-fe/.gitignore + handoff entries
├── docs/                         ← spec files (committed)
│   └── superpowers/specs/
├── design_handoff_mutawazin/     ← local only, gitignored
└── 2026-05-13-fe-handoff-sveltekit.md  ← local only, gitignored
```

## Steps

1. **Copy SvelteKit files to root** — move `src/`, `static/`, all config files and `package*.json` from `mutawazin-fe/` to root. Skip `node_modules/` and `.svelte-kit/`.
2. **Write merged `.gitignore`** — combine the existing `mutawazin-fe/.gitignore` with two new entries: `design_handoff_mutawazin/` and `2026-05-13-fe-handoff-sveltekit.md`.
3. **Run `npm install`** at the new root to regenerate `node_modules/`.
4. **Delete `mutawazin-fe/`** — the subfolder is now redundant.
5. **Update `CLAUDE.md`** — change all path references from `mutawazin-fe/src/...` to `src/...`.
6. **Verify** — `npm run check` and `npm run build` must pass at root.

## Constraints

- `design_handoff_mutawazin/` and `2026-05-13-fe-handoff-sveltekit.md` stay on disk locally but are never pushed to GitHub.
- `CLAUDE.md` is committed and updated.
- `docs/` (this spec) is committed.
- No code changes — purely a file system restructure.
