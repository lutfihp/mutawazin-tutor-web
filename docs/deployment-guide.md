# Frontend Deployment Guide — DigitalOcean Droplet

**Assumes:** Backend (FastAPI) already deployed following `mutawazin-tutor-api/docs/deployment-guide.md`. That means:
- Droplet exists, SSH access confirmed
- `mutawazin` non-root user created and added to `docker` group
- Docker + Docker Compose v2 installed
- Nginx installed on host
- Certbot installed with the nginx plugin
- Backend container running on port 8000

---

## Step 1: Create the deploy directory and runtime env on the VPS

SSH in as `mutawazin`:

```bash
ssh mutawazin@YOUR_DROPLET_IP
```

Create the deploy directory and write the runtime env file:

```bash
mkdir -p /home/mutawazin/mutawazin-web
echo "ORIGIN=https://mutawazinprivate.com" > /home/mutawazin/mutawazin-web/.env
```

The `.env` file is the only runtime config the container needs. `VITE_API_URL` is baked into the build by CI — it does not go here.

---

## Step 2: Set up the deploy SSH key for GitHub Actions

Since the backend CI already uses the `github_deploy` keypair on the VPS, the frontend CI can reuse the **same key** (same droplet, same user). No new key needs to be generated.

To confirm the key exists:

```bash
ls ~/.ssh/github_deploy.pub
```

If the file is missing (unlikely), generate a new one:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
```

Print the private key — you'll paste this into the **frontend** GitHub repo's secrets:

```bash
cat ~/.ssh/github_deploy
```

Copy the entire output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

---

## Step 3: Add GitHub Actions secrets

Go to: **frontend GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Add all five secrets:

| Secret name | Value |
|---|---|
| `SSH_HOST` | Your droplet IP address (same as backend) |
| `SSH_USER` | `mutawazin` |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/github_deploy` (same private key as backend) |
| `DEPLOY_PATH` | `/home/mutawazin/mutawazin-web` |
| `VITE_API_URL` | `https://api.mutawazinprivate.com` |

> **Note:** `SSH_HOST`, `SSH_USER`, and `SSH_PRIVATE_KEY` will have the same values as the backend repo's secrets — they point to the same droplet and user. `DEPLOY_PATH` and `VITE_API_URL` are frontend-specific.

---

## Step 4: Configure Nginx + SSL for the frontend domain

On the VPS (as `mutawazin`), create the frontend site config:

```bash
sudo nano /etc/nginx/sites-available/mutawazin-web
```

Paste this:

```nginx
server {
    listen 80;
    server_name mutawazinprivate.com www.mutawazinprivate.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mutawazin-web /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Obtain the SSL certificate (Certbot is already installed from the backend setup):

```bash
sudo certbot --nginx -d mutawazinprivate.com -d www.mutawazinprivate.com
```

Certbot will verify domain ownership, obtain the Let's Encrypt certificate, and rewrite the nginx config for HTTPS + HTTP→HTTPS redirect automatically.

When prompted, choose to redirect all HTTP traffic to HTTPS.

Verify:

```bash
curl -I https://mutawazinprivate.com
```

Expected: `HTTP/2 301` or `HTTP/2 200` (the app isn't running yet — a 502 is fine at this stage, it just means nginx is up).

---

## Step 5: Enable the GitHub Actions workflow

On your **local machine** (in the frontend repo):

```powershell
git mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "ci: enable deploy workflow"
git push origin main
```

This push triggers the first deployment.

---

## Step 6: Watch the first deploy

1. Go to **GitHub repo → Actions tab**
2. Click the running `Deploy` workflow
3. Watch each step complete:
   - `Install dependencies` (~30s)
   - `Build` (~2 min — VITE_API_URL baked into the bundle)
   - `Setup SSH`
   - `Sync artifacts to VPS` — rsync transfers `build/`, `Dockerfile`, `docker-compose.yml`, etc.
   - `Rebuild and restart container` — runs `docker compose up --build -d` on the VPS

Total time: ~2–3 minutes.

---

## Step 7: Verify the container is running

SSH into the VPS and run:

```bash
docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml ps
```

Expected:

```
NAME                    COMMAND                  SERVICE   STATUS    PORTS
mutawazin-web-web-1     "node build/index.js"    web       running   0.0.0.0:3000->3000/tcp
```

Test the app responds directly:

```bash
curl -I http://localhost:3000
```

Expected: `HTTP/1.1 200 OK` or `HTTP/1.1 302 Found` (redirect to `/login`).

---

## Step 8: Verify the full URL

Open `https://mutawazinprivate.com` in a browser. The Mutawazin landing page should load with a valid padlock.

If login works end-to-end (frontend → backend), the deployment is complete.

---

## Subsequent deploys

Every push to `main` automatically triggers a full redeploy. No manual steps needed.

To redeploy manually without a code change:

```bash
git commit --allow-empty -m "chore: trigger redeploy" && git push origin main
```

---

## Ongoing operations

**View running containers:**
```bash
docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml ps
```

**View app logs:**
```bash
docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml logs -f
```

**Manual deploy (if needed):**
```bash
# Run from your local machine — this triggers GitHub Actions
git commit --allow-empty -m "chore: trigger redeploy" && git push origin main
```

**Restart the app:**
```bash
docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml restart
```

**Update runtime env (ORIGIN):**
```bash
nano /home/mutawazin/mutawazin-web/.env
docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml up -d
```

---

## Troubleshooting

**Workflow fails at "Sync artifacts to VPS"**
- Confirm `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` secrets are correct in the **frontend** repo (separate from backend repo secrets)
- Test SSH manually from local: `ssh -i ~/.ssh/github_deploy mutawazin@<vps-ip> "echo ok"`
- Confirm `/home/mutawazin/mutawazin-web/` directory exists on the VPS

**Workflow fails at "Rebuild and restart container"**
- SSH into VPS: `cd /home/mutawazin/mutawazin-web && docker compose up --build -d`
- Check logs: `docker compose logs web`
- Confirm `mutawazin` user is in the `docker` group: `groups mutawazin`

**App returns 502 Bad Gateway from Nginx**
- Container may not be running: `docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml ps`
- Check container logs: `docker compose -f /home/mutawazin/mutawazin-web/docker-compose.yml logs web`
- Confirm nginx is forwarding to port 3000: `sudo nginx -t`

**App loads but API calls fail (CORS / 404 on API routes)**
- Confirm `VITE_API_URL` secret in the frontend GitHub repo is exactly `https://api.mutawazinprivate.com`
- Confirm the backend container is running: `docker compose -f /home/mutawazin/mutawazin-tutor-api/docker-compose.yml ps`
- Check browser DevTools Network tab for the actual request URL

**HTTPS shows "Not Secure" or certificate error**
- Confirm Certbot ran successfully: `sudo certbot certificates`
- Re-run if needed: `sudo certbot --nginx -d mutawazinprivate.com -d www.mutawazinprivate.com`
- Confirm auto-renewal timer: `sudo systemctl status certbot.timer`
