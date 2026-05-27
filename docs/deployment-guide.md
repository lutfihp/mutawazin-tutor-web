# Frontend Deployment Guide — DigitalOcean Droplet

**Assumes:** Backend (FastAPI) already running in Docker on the VPS. Docker and Docker Compose v2 are already installed. You have SSH access to the server.

---

## Step 1: Create the deploy directory and runtime env on the VPS

SSH into your VPS, then run:

```bash
mkdir -p /root/mutawazin-web
echo "ORIGIN=https://mutawazinprivate.com" > /root/mutawazin-web/.env
```

The `.env` file is the only runtime config the container needs. `VITE_API_URL` is baked into the build by CI — it does not go here.

---

## Step 2: Create a deploy SSH key

Generate a dedicated key for CI deployments (do this on your **local machine**, not the VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/mutawazin_deploy -N ""
```

This creates two files:
- `~/.ssh/mutawazin_deploy` — **private key** (goes into GitHub secrets)
- `~/.ssh/mutawazin_deploy.pub` — **public key** (goes onto the VPS)

---

## Step 3: Add the public key to the VPS

Copy the public key to your VPS:

```bash
cat ~/.ssh/mutawazin_deploy.pub | ssh root@<your-vps-ip> "cat >> ~/.ssh/authorized_keys"
```

Verify it was added:

```bash
ssh -i ~/.ssh/mutawazin_deploy root@<your-vps-ip> "echo connected"
```

Expected output: `connected`

---

## Step 4: Add GitHub Actions secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Add all five secrets:

| Secret name | Value |
|---|---|
| `SSH_HOST` | Your VPS IP address |
| `SSH_USER` | `root` (or whichever user has Docker access) |
| `SSH_PRIVATE_KEY` | Full contents of `~/.ssh/mutawazin_deploy` (the private key file) |
| `DEPLOY_PATH` | `/root/mutawazin-web` |
| `VITE_API_URL` | `https://api.mutawazinprivate.com` |

To print the private key contents for copying:

```bash
cat ~/.ssh/mutawazin_deploy
```

Copy everything including the `-----BEGIN...` and `-----END...` lines.

---

## Step 5: Configure Nginx

On the VPS, create the Nginx site config:

```bash
nano /etc/nginx/sites-available/mutawazin-web
```

Paste this:

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

Enable it and reload Nginx:

```bash
ln -s /etc/nginx/sites-available/mutawazin-web /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

> **Note:** Cloudflare handles HTTPS — Nginx only needs port 80. Make sure Cloudflare's SSL mode is set to **Full** (not Full Strict) since the origin has no certificate.

---

## Step 6: Enable the GitHub Actions workflow

The workflow file is currently disabled. Rename it to activate it:

```powershell
# Run locally
git mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
git commit -m "ci: enable deploy workflow"
git push origin main
```

This push will trigger the first deployment.

---

## Step 7: Watch the first deploy

1. Go to **GitHub repo → Actions tab**
2. Click the running `Deploy` workflow
3. Watch each step complete:
   - `Install dependencies` (~30s)
   - `Build` (~2min — VITE_API_URL baked in)
   - `Setup SSH`
   - `Sync artifacts to VPS` — rsync output lists transferred files
   - `Rebuild and restart container` — runs `docker compose up --build -d` on VPS

Total time: ~2–3 minutes.

---

## Step 8: Verify the container is running

SSH into the VPS and run:

```bash
docker compose -f /root/mutawazin-web/docker-compose.yml ps
```

Expected:

```
NAME                    COMMAND                  SERVICE   STATUS    PORTS
mutawazin-web-web-1     "node build/index.js"    web       running   0.0.0.0:3000->3000/tcp
```

Test the app responds:

```bash
curl -I http://localhost:3000
```

Expected: `HTTP/1.1 200 OK` or `HTTP/1.1 302 Found` (redirect to `/login`).

---

## Step 9: Verify the full URL

Open `https://mutawazinprivate.com` in a browser. The Mutawazin landing page should load.

---

## Subsequent deploys

Every push to `main` automatically triggers a full redeploy. No manual steps needed.

To redeploy manually without a code change:

```bash
git commit --allow-empty -m "chore: trigger redeploy" && git push origin main
```

---

## Troubleshooting

**Workflow fails at "Sync artifacts to VPS"**
- Confirm `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` secrets are correct
- Confirm the public key is in `/root/.ssh/authorized_keys` on the VPS
- Test SSH manually: `ssh -i ~/.ssh/mutawazin_deploy root@<vps-ip> "echo ok"`

**Workflow fails at "Rebuild and restart container"**
- SSH into VPS: `cd /root/mutawazin-web && docker compose up --build -d`
- Check logs: `docker compose -f /root/mutawazin-web/docker-compose.yml logs web`

**App returns 502 Bad Gateway from Nginx**
- Container may not be running: `docker compose -f /root/mutawazin-web/docker-compose.yml ps`
- Check container logs: `docker compose -f /root/mutawazin-web/docker-compose.yml logs web`

**App loads but API calls fail**
- Confirm `VITE_API_URL` secret in GitHub is exactly `https://api.mutawazinprivate.com`
- Check backend container is running: `docker compose -f /root/mutawazin-tutor-api/docker-compose.yml ps`
