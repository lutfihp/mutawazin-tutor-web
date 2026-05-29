# Docker + GitHub Actions CI/CD — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

---

## Overview

Set up a CI/CD pipeline for the Mutawazin frontend SvelteKit app. `npm run build` runs in GitHub Actions; the compiled artifact is rsynced to the DigitalOcean VPS; Docker rebuilds the image and restarts the container on the VPS. No Docker image registry is used.

---

## Context

- **Frontend:** SvelteKit 2 / Svelte 5, Tailwind v3, svelte-i18n — SSR with adapter-node
- **Backend:** FastAPI on the same VPS, Docker on port 8000 (separate repo/compose)
- **VPS:** DigitalOcean, Nginx on host as reverse proxy
- **Domain:** `mutawazinprivate.com` (Cloudflare DNS, SSL terminated at Cloudflare edge)
- **API URL:** `https://api.mutawazinprivate.com` — baked into bundle at build time via `VITE_API_URL`
- **Latency note:** All API calls are client-side (browser → Cloudflare → backend). `hooks.server.ts` only decodes JWT locally. No server-to-server API calls, so Cloudflare round-trip is not a concern.

---

## Required Code Changes

### 1. Switch adapter

Replace `@sveltejs/adapter-auto` with `@sveltejs/adapter-node`.

`svelte.config.js`:
```js
import adapter from '@sveltejs/adapter-node';

const config = {
  compilerOptions: {
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
  },
  kit: { adapter: adapter() }
};

export default config;
```

Install: `npm install -D @sveltejs/adapter-node`  
Uninstall: `npm uninstall @sveltejs/adapter-auto`

Build output: `build/` directory. Entry point: `build/index.js`. Default port: `3000`.

---

## Files to Create

### `Dockerfile`

```dockerfile
FROM node:22-alpine

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY build ./build

USER app
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "build/index.js"]
```

**Notes:**
- Receives pre-built `build/` from CI — no `npm run build` inside Docker
- `npm ci --omit=dev` layer is cached unless `package.json` changes
- Runs as non-root `app` user (consistent with backend `appuser` pattern)

---

### `docker-compose.yml`

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

---

### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Sync artifacts to VPS
        run: |
          rsync -avz -e "ssh -i ~/.ssh/deploy_key" \
            build package.json package-lock.json Dockerfile docker-compose.yml \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:${{ secrets.DEPLOY_PATH }}/

      - name: Rebuild and restart container
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            docker compose up --build -d
```

---

## GitHub Actions Secrets

Set in GitHub → repository → Settings → Secrets and variables → Actions:

| Secret | Shared with backend repo? | Value |
|---|---|---|
| `SSH_HOST` | ✅ same VPS IP | VPS IP address |
| `SSH_USER` | ✅ same user | SSH username (e.g. `root`) |
| `SSH_PRIVATE_KEY` | ✅ same key | SSH private key |
| `DEPLOY_PATH` | separate value | e.g. `/root/mutawazin-web` |
| `VITE_API_URL` | frontend only | `https://api.mutawazinprivate.com` |

---

## VPS One-Time Setup

Run once on the VPS before the first deploy:

```bash
mkdir -p /root/mutawazin-web
echo "ORIGIN=https://mutawazinprivate.com" > /root/mutawazin-web/.env
```

`ORIGIN` is required by adapter-node for CSRF protection. It is the only runtime env var — `VITE_API_URL` is baked into the bundle at build time.

Ensure Docker and Docker Compose (v2) are installed on the VPS.

---

## Nginx Config (host-level, not in Docker)

```nginx
server {
    listen 80;
    server_name mutawazinprivate.com www.mutawazinprivate.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Cloudflare handles SSL termination — Nginx only needs port 80.

---

## Deploy Flow Summary

```
push to main
  └─ GitHub Actions
       ├─ npm ci
       ├─ npm run build  (VITE_API_URL baked in)
       ├─ rsync build/ package.json package-lock.json Dockerfile docker-compose.yml → VPS
       └─ SSH: docker compose up --build -d
                └─ Docker: COPY artifacts → npm ci --omit=dev → node build/index.js
```

---

## What Is NOT in Scope

- Docker image registry (intentionally excluded)
- Running tests in CI (no test suite currently exists)
- Nginx configuration management via CI (managed manually on VPS)
- Backend deployment (separate repo, separate workflow)
