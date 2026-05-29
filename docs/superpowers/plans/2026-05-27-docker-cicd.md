# Docker + GitHub Actions CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up a CI/CD pipeline where GitHub Actions builds the SvelteKit app and deploys the artifact to a DigitalOcean VPS, which rebuilds a Docker image and restarts the container on every push to `main`.

**Architecture:** npm build runs in CI with the production API URL baked in; the compiled `build/` directory plus supporting files are rsynced to the VPS; Docker rebuilds a lightweight Node.js image from the artifact and restarts. No image registry is used.

**Tech Stack:** SvelteKit 2 / adapter-node, Docker, Docker Compose v2, GitHub Actions, rsync over SSH, appleboy/ssh-action

---

## Prerequisites (Manual — do once on the VPS)

Before the first deploy, SSH into the VPS and run:

```bash
mkdir -p /root/mutawazin-web
echo "ORIGIN=https://mutawazinprivate.com" > /root/mutawazin-web/.env
```

Add the deploy SSH public key to `/root/.ssh/authorized_keys`.

Verify Docker Compose v2 is installed: `docker compose version` (must be v2, not `docker-compose`).

---

## Task 1: Switch from adapter-auto to adapter-node

**Files:**
- Modify: `svelte.config.js`
- Modify: `package.json` (via npm commands)

- [ ] **Step 1: Install adapter-node and remove adapter-auto**

```powershell
npm install -D @sveltejs/adapter-node
npm uninstall @sveltejs/adapter-auto
```

- [ ] **Step 2: Update svelte.config.js**

Replace the entire file with:

```js
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter()
	}
};

export default config;
```

- [ ] **Step 3: Run the build and verify output**

```powershell
npm run build
```

Expected: build completes without errors. Verify these files exist:

```powershell
Test-Path build/index.js        # must be True
Test-Path build/client          # must be True
Test-Path build/server          # must be True
```

- [ ] **Step 4: Run type check to confirm 0 errors**

```powershell
npm run check
```

Expected: `svelte-check found 0 errors` (12 pre-existing warnings are acceptable).

- [ ] **Step 5: Commit**

```powershell
git add svelte.config.js package.json package-lock.json
git commit -m "chore: switch to adapter-node for Docker deployment"
```

---

## Task 2: Add .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

Create `.dockerignore` at the repo root with:

```
node_modules
.svelte-kit
.env
.env.*
docs
handoffs
src
static
*.log
.git
.github
```

This prevents large directories from being sent as Docker build context when `docker compose up --build` runs on the VPS. The VPS build context only needs `build/`, `package.json`, `package-lock.json`.

- [ ] **Step 2: Commit**

```powershell
git add .dockerignore
git commit -m "chore: add .dockerignore for frontend container"
```

---

## Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile at repo root**

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

**Why this order:** `COPY package.json package-lock.json` + `RUN npm ci` is its own layer. Docker caches it and skips reinstall on deploys where only `build/` changed — which is every normal deploy.

- [ ] **Step 2: Verify Dockerfile builds locally (optional — requires Docker Desktop)**

Run from the repo root after `npm run build`:

```powershell
docker build -t mutawazin-web-test .
```

Expected: build completes, image tagged `mutawazin-web-test`. If Docker Desktop is not installed locally, skip this step — the workflow will catch errors on first push.

- [ ] **Step 3: Commit**

```powershell
git add Dockerfile
git commit -m "chore: add Dockerfile for frontend Node.js runtime"
```

---

## Task 4: Create docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml at repo root**

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

The `.env` file on the VPS supplies `ORIGIN=https://mutawazinprivate.com`. It is never committed to git.

- [ ] **Step 2: Verify .env is in .gitignore**

```powershell
Select-String -Path .gitignore -Pattern "^\.env"
```

Expected: at least one match. If not found, add `.env` to `.gitignore`.

- [ ] **Step 3: Commit**

```powershell
git add docker-compose.yml
git commit -m "chore: add docker-compose.yml for frontend service"
```

---

## Task 5: Create GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflows directory**

```powershell
New-Item -ItemType Directory -Force -Path .github/workflows
```

- [ ] **Step 2: Create .github/workflows/deploy.yml**

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
            build package.json package-lock.json Dockerfile .dockerignore docker-compose.yml \
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

- [ ] **Step 3: Add the five GitHub Actions secrets**

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add each of the following:

| Name | Value |
|---|---|
| `SSH_HOST` | VPS IP address |
| `SSH_USER` | SSH username (e.g. `root`) |
| `SSH_PRIVATE_KEY` | Full contents of the SSH private key file |
| `DEPLOY_PATH` | `/root/mutawazin-web` (or wherever you mkdir'd on the VPS) |
| `VITE_API_URL` | `https://api.mutawazinprivate.com` |

- [ ] **Step 4: Commit**

```powershell
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
```

---

## Task 6: First deploy and smoke test

- [ ] **Step 1: Push to main to trigger the workflow**

```powershell
git push origin main
```

- [ ] **Step 2: Watch the workflow run**

Go to GitHub repo → Actions tab. The `Deploy` workflow should appear. Watch each step:
- `Install dependencies` — installs node_modules
- `Build` — produces `build/` with `VITE_API_URL` baked in
- `Setup SSH` — writes deploy key, adds VPS to known_hosts
- `Sync artifacts to VPS` — rsync output shows transferred files
- `Rebuild and restart container` — SSH output shows `docker compose up --build -d`

Expected: all steps green, workflow completes in ~2-3 minutes.

- [ ] **Step 3: Verify container is running on the VPS**

SSH into the VPS and run:

```bash
docker compose -f /root/mutawazin-web/docker-compose.yml ps
```

Expected output:
```
NAME                    IMAGE     COMMAND                  SERVICE   STATUS    PORTS
mutawazin-web-web-1     ...       "node build/index.js"    web       running   0.0.0.0:3000->3000/tcp
```

- [ ] **Step 4: Verify the app responds on port 3000**

From the VPS:

```bash
curl -I http://localhost:3000
```

Expected: `HTTP/1.1 200 OK` or `HTTP/1.1 302 Found` (redirect to `/login`).

- [ ] **Step 5: Verify Nginx routes to the container**

From your browser, open `https://mutawazinprivate.com`. Expected: the Mutawazin landing page loads. If Nginx is not yet configured, add the config to `/etc/nginx/sites-available/mutawazin` and enable it:

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

```bash
ln -s /etc/nginx/sites-available/mutawazin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## What Is Not In Scope

- Docker image registry (intentionally excluded)
- Running tests in CI (no test suite exists)
- Nginx TLS — Cloudflare handles SSL termination; Nginx only needs port 80
- Backend deployment (separate repo, separate workflow)
