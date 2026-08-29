# Deployment (portable single container)

This app is a **full, stateful Reflex application**: per-user state lives in the
backend process and the browser stays connected over a **WebSocket**. The
supported hosting shape is therefore one long-running container that serves the
compiled frontend and the backend behind a single port.

Nothing in the app itself changes for deployment — UI, auth, Supabase, Google
OAuth, OpenAI, database access, messenger state and the routes `/`,
`/onboarding`, `/home`, `/auth/callback` are all untouched. Everything below is
runtime configuration.

## 1. Deployment files at the project root

The deployment files live at the project root, next to `rxconfig.py`, in the
saved project — there is **no generator step to run before deploying**. Their
reviewable sources are kept in `app/deploy/`, and the app materializes any
missing (or empty placeholder) root file on startup via
`ensure_deployment_files()` in `app/deploy_setup.py`. Existing non-empty root
files are never overwritten, and `api/index.py` is left untouched.

Regenerating them by hand is **optional** (useful after editing a template in
`app/deploy/`, or to force-refresh a customized copy):

```bash
python -m app.deploy_setup            # optional; --force overwrites existing files
python -m app.deploy_setup --root /path/to/project
```

The root files are:

| File | Purpose |
| --- | --- |
| `Dockerfile` | Single-container image on **Python 3.12 slim**: installs deps, copies the app, exports the frontend, bundles Caddy |
| `.dockerignore` | Keeps `.web`, `.venv`, `.env`, caches out of the build context |
| `start.sh` | Entrypoint: Caddy on `$PORT` + `reflex run --env prod --backend-only` |
| `Caddyfile` | One-port front door, static frontend + backend proxy (WebSockets pass through) |
| `docker-compose.yml` | Local / VPS run |
| `render.yaml` | Render blueprint |
| `railway.json` | Railway service config |
| `fly.toml` | Fly.io machine config |
| `.env.example` | Every environment variable the app reads |
| `DEPLOYMENT.md` | This guide |
| `vercel.json` | Best-effort serverless config (`@vercel/python` catch-all to `api/index.py`) — **not** the primary target (see below) |

`api/index.py` (the Vercel ASGI entrypoint) is part of the project and is
preserved as-is; nothing here rewrites it.

The image build runs **no scaffolding/initialization step**: the project
already ships `rxconfig.py` and the `app` package, so the Dockerfile only installs
`requirements.txt`, copies the source and runs
`reflex export --frontend-only --no-zip` with `API_URL`/`APP_BASE_URL` supplied
as Docker build args (`--build-arg API_URL=... --build-arg APP_BASE_URL=...`).
Hosts that only reveal the public domain after the first deploy set
`REFLEX_EXPORT_ON_START=1` instead, and `start.sh` re-exports at boot with the
runtime `API_URL`/`APP_BASE_URL`.

Python 3.12 is used in the image on purpose: it is the runtime pinned in
`vercel.json` (`python3.12`) and the version Reflex and its dependency set are
most widely tested against, so container and serverless runs agree.

## 2. How the container runs

```
browser ──HTTPS/WSS──► Caddy  :$PORT (default 8080)
                        ├── /_event*, /_upload*, /_health*, /_all_routes*, /ping*
                        │      └─► reverse_proxy 127.0.0.1:8000  (Reflex backend)
                        └── everything else ─► static files from .web/build/client
```

- **Expose exactly one port**: `$PORT` (hosts inject it; defaults to `8080`).
  The Reflex backend stays internal on `BACKEND_PORT` (default `8000`).
- **WebSockets must stay enabled.** Caddy's `reverse_proxy` forwards the
  `Upgrade`/`Connection` headers automatically. If you put another proxy,
  CDN or load balancer in front, enable WebSocket upgrades and disable
  response buffering for `/_event`.
- **Do not scale to many replicas without sticky sessions**, and do not let the
  host stop the machine when idle: state is in-process (`min_machines_running = 1`
  in `fly.toml`, `auto_stop_machines = false`).

`start.sh` binds the backend explicitly with
`reflex run --env prod --backend-only --backend-host 0.0.0.0 --backend-port $BACKEND_PORT`,
so it listens on all interfaces inside the container. If Caddy or the Caddyfile
is unavailable, `start.sh` falls back to binding the backend directly on `$PORT`
(HTTP + WebSocket on the single public port, without static asset serving).

### `rxconfig.py` reads the origins from the environment

```python
api_url    = API_URL                              or http://localhost:$BACKEND_PORT
deploy_url = APP_BASE_URL / DEPLOY_URL /
             RENDER_EXTERNAL_URL / RAILWAY_PUBLIC_DOMAIN  or http://localhost:3000
```

Bare hostnames (e.g. Railway's `RAILWAY_PUBLIC_DOMAIN`) are normalized to
`https://…` and trailing slashes are stripped. With nothing set, local
development keeps the usual `localhost` defaults, so `reflex run` needs no
environment at all.

## 3. Build and run with Docker

```bash
# Build (bake the public origin into the frontend bundle)
docker build --build-arg API_URL=https://your-domain.com -t inolas-messenger .

# Run
docker run --rm -p 8080:8080 --env-file .env \
  -e API_URL=https://your-domain.com \
  -e APP_BASE_URL=https://your-domain.com \
  inolas-messenger
```

Or locally with Compose (serves http://localhost:8080):

```bash
cp .env.example .env      # fill in real values
docker compose up --build
```

`API_URL` is compiled into the frontend, so it must be the **externally
reachable origin** of the deployment. When the domain is only known after the
first deploy (Render/Railway/Fly generated domains), set
`REFLEX_EXPORT_ON_START=1` and `API_URL=https://<generated-domain>`; the
entrypoint rebuilds the frontend at boot with the correct value.

## 4. Environment variables

Copy `.env.example` and set values in the host's secret manager — never commit
them.

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_KEY` | yes | Supabase anon/public key used by the auth client |
| `GOOGLE_CLIENT_ID` | yes (Google sign-in) | From Google Cloud OAuth credentials |
| `GOOGLE_CLIENT_SECRET` | yes (Google sign-in) | Same credential pair |
| `OPENAI_API_KEY` | yes (OpenAI features) | Read by the OpenAI SDK |
| `REFLEX_DB_URL` | if a database is used | Read-only SQL access |
| `API_URL` | yes | Public origin, baked into the frontend bundle |
| `PORT` | usually injected | Public container port (default `8080`) |
| `BACKEND_PORT` | no | Internal Reflex backend port (default `8000`), also the local `api_url` port |
| `DEPLOY_URL` | no | Alias for `APP_BASE_URL` when resolving the public frontend origin |
| `REFLEX_EXPORT_ON_START` | no | `1` rebuilds the frontend at boot using `API_URL` |
| `APP_BASE_URL` | recommended | Base URL used to build the OAuth callback |
| `OAUTH_REDIRECT_URL` | optional | Pins the full callback URL (highest priority) |

## 5. OAuth callback domains

`app/states/auth_state.py` resolves the callback as `<base>/auth/callback`, in
priority order: `OAUTH_REDIRECT_URL` → `OAUTH_CALLBACK_URL` → `APP_BASE_URL` →
other platform URL variables (`RENDER_EXTERNAL_URL`, `RAILWAY_PUBLIC_DOMAIN`,
`VERCEL_URL`, …) → the request origin → a hardcoded fallback.

For every domain you serve:

1. Set `APP_BASE_URL=https://your-domain.com` (or
   `OAUTH_REDIRECT_URL=https://your-domain.com/auth/callback`).
2. Add `https://your-domain.com/auth/callback` to **Supabase → Authentication →
   URL Configuration → Redirect URLs**.
3. Add the same URL to the **Google Cloud OAuth client** authorized redirect
   URIs if you call Google directly, and keep the Supabase callback
   (`https://<project>.supabase.co/auth/v1/callback`) listed there.
4. Set the Supabase **Site URL** to your primary domain.

Preview/staging domains need their own entries in the same allow-lists.

## 6. Host-specific commands

### Render

```bash
git push                     # then: Render dashboard → New → Blueprint
```

`render.yaml` declares a Docker web service. After the first deploy, set
`API_URL` and `APP_BASE_URL` to `https://<service>.onrender.com` (both are
`sync: false`, i.e. entered in the dashboard) and redeploy. WebSockets are
supported on Render web services with no extra configuration.

### Railway

```bash
railway init
railway up
railway variables set API_URL=https://<app>.up.railway.app \
                      APP_BASE_URL=https://<app>.up.railway.app \
                      REFLEX_EXPORT_ON_START=1
```

`railway.json` pins the Dockerfile builder and `./start.sh`. Railway injects
`PORT`; do not override it.

### Fly.io

```bash
fly launch --no-deploy --copy-config
fly secrets set SUPABASE_URL=... SUPABASE_KEY=... OPENAI_API_KEY=... \
                GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
                REFLEX_DB_URL=... \
                API_URL=https://<app>.fly.dev APP_BASE_URL=https://<app>.fly.dev
fly deploy
```

### Any Docker host / VPS (Cloud Run, Hetzner, EC2, …)

```bash
docker build --build-arg API_URL=https://your-domain.com -t inolas-messenger .
docker run -d --restart unless-stopped -p 80:8080 --env-file .env inolas-messenger
```

Behind nginx/Traefik/ALB, forward `Upgrade` and `Connection: upgrade` headers so
the event WebSocket survives. On Cloud Run, set concurrency ≥ 1, min instances
to 1 and enable session affinity.

## 7. Vercel is not the primary supported target

Vercel's Python runtime is **serverless**: functions are short-lived, cannot
hold per-user Reflex state between requests and do not support long-lived
WebSocket connections. This app depends on both, so a Vercel deployment is
best-effort only and may break session restore, the messenger view and the
OAuth callback flow.

The root `vercel.json` committed with the project is a *valid* configuration (it
routes every path to `api/index.py`, which resolves the Reflex ASGI app in
`app/vercel_asgi.py`) — see `app/VERCEL_DEPLOYMENT.md` for that path. Use it
only for experiments. For anything real, use the single container described
above.

## 8. Post-deploy checklist

- [ ] `https://your-domain.com/` loads the sign-in screen.
- [ ] Browser devtools show a live `wss://your-domain.com/_event` connection.
- [ ] Email/password sign-in, phone OTP and Google sign-in all complete.
- [ ] Google sign-in returns to `/auth/callback` and lands on `/home`.
- [ ] Reload keeps you signed in (session restore works).
- [ ] `/home` messenger view renders and sending a message works.
- [ ] No secrets appear in logs or the client bundle.
