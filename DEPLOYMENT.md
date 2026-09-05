# Deployment

Beral Care runs across four hosted pieces. This document records where
each one lives, how to redeploy it, and the limitations of the current setup.

No secrets are stored in this file. Every credential lives in the relevant
provider's dashboard, and locally in the gitignored `.env` files.

---

## Live services

| Piece | Provider | URL |
|---|---|---|
| Backend API | Render (web service, Virginia) | https://beral-care-api.onrender.com |
| Web app | Vercel (Vite build) | https://beral-care.vercel.app |
| USSD gateway | Vercel (Python serverless) | https://beral-care-ussd.vercel.app |
| Database | Railway MySQL 9.4 (US East) | private TCP proxy, see Railway dashboard |
| Session store | Upstash Redis (us-east-1) | `included-doe-161931.upstash.io` |

Everything is deployed in US East so the backend, gateway, database, and Redis
sit in the same region.

---

## Backend (Render)

Deployed from the `main` branch of this repository, `rootDir: backend`.
Render's GitHub integration auto-deploys on push to `main`.

- **Build:** `npm install`
- **Start:** `node backend-server.js`
- **Health check:** `/`
- **Blueprint:** [render.yaml](render.yaml) describes the same service, for
  recreating it from scratch via Render's Blueprint flow.

Environment variables are set in the Render dashboard (Environment tab):
`ALLOWED_ORIGINS`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
`DB_SEED_SAMPLE_DATA`, `JWT_TOKEN`, `ANTHROPIC_API_KEY`, `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SENDGRID_API_KEY`,
`SENDGRID_FROM_EMAIL`, `DB_SETUP_KEY`, `NODE_VERSION`.

`PORT` is injected by Render and must not be set manually.

**Changing an environment variable does not redeploy the service.** Update the
value, then trigger a manual deploy for it to take effect.

### First-time database setup

Run once against a new database:

```
GET https://beral-care-api.onrender.com/setup-db?key=YOUR_DB_SETUP_KEY
```

This creates the six tables and their foreign keys. It is safe to re-run.

---

## Both Vercel projects are deliberately disconnected from GitHub

`beral-care` and `beral-care-ussd` deploy **only** via the CLI. Their Git
integrations were disconnected on purpose.

When a Vercel project is linked to this repository, its Root Directory defaults
to the repository root, so a push deploys the repo root rather than the intended
subdirectory. That silently replaces the working production deployment: the USSD
gateway once began serving a frontend entry file instead of Flask, and `/ussd`
returned 404.

If you want push-to-deploy back, reconnect Git **and** set each project's Root
Directory in the Vercel dashboard first — `web` for the site, `ussd-gateway` for
the gateway.

---

## Web app (Vercel)

Vercel builds the Vite app from source; nothing is uploaded from a local `dist`.

```bash
npx vercel deploy --prod --cwd web
```

Configuration lives in `web/vercel.json`: the build command, the output
directory, the SPA rewrite that sends every path to `index.html`, immutable
caching for hashed assets, and a small set of security headers.

The API base URL comes from `VITE_API_URL`, set as a Vercel environment variable
for the production environment and baked in at build time. To change it:

```bash
npx vercel env rm VITE_API_URL production --cwd web
printf '%s' 'https://your-api-host' | npx vercel env add VITE_API_URL production --cwd web
npx vercel deploy --prod --cwd web
```

Locally, `web/.env.local` sets the same variable; the dev server also proxies
`/api` to `localhost:3000`, so local work needs no CORS configuration at all.

Any new web origin must be added to `ALLOWED_ORIGINS` on the backend, or the
browser will be blocked by CORS. The current value already includes the Vite dev
ports (5173, 4173).

---

## USSD gateway (Vercel)

Deployed from `ussd-gateway/` as a Python serverless function.

```bash
npx vercel deploy --prod --cwd ussd-gateway
```

Environment variables (set via `vercel env add <NAME> production`):

- `API_BASE_URL` — the Render backend URL
- `REDIS_URL` — Upstash connection string, `rediss://` scheme (TLS required)
- `DEFAULT_COUNTRY_CODE` — country code applied to local numbers, e.g. `+250`

Point your USSD aggregator (Africa's Talking or equivalent) at:

```
POST https://beral-care-ussd.vercel.app/ussd
```

Note that Vercel protects deployment-specific URLs behind SSO; only the
production alias above is publicly reachable, which is what the aggregator needs.

---

## Database (Railway)

MySQL 9.4 with a public TCP proxy enabled so Render can reach it from outside
Railway's private network. The `mysql.railway.internal` hostname only works
between Railway services and will not work from Render.

Connection values live in the MySQL service's **Variables** tab. The public host
and port are `RAILWAY_TCP_PROXY_DOMAIN` and `RAILWAY_TCP_PROXY_PORT` — not
`MYSQLHOST`/`MYSQLPORT`, which are internal.

---

## Known limitations

These are consequences of the current (free/trial) hosting tiers, not bugs:

- **Uploaded files do not persist.** Profile images are written to `uploads/` on
  the Render instance's local disk, which is wiped on every deploy and restart.
  Making this durable requires either a Render persistent disk (paid) or moving
  uploads to object storage such as S3 or Cloudinary.
- **The backend sleeps when idle.** Render's free tier spins the service down
  after inactivity; the next request takes roughly 50 seconds to wake it. This
  affects the first USSD dial or app login after a quiet period.
- **Railway is on trial credit.** The database stops when the trial credit is
  exhausted, which takes the whole platform down. Check the Railway dashboard's
  usage indicator.
- **Rate limiting is per-instance.** `express-rate-limit` keeps its counters in
  memory, so limits reset on restart and are not shared if the service is ever
  scaled to more than one instance.
- **The AI assistants need a provider key.** They are wired to Google Gemini by
  default, which has a free tier, but the key is not set yet. Create one at
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and set
  `GEMINI_API_KEY` on the Render service, then redeploy for it to take effect.
  `GET /api/ai/status` shows which provider is currently active.

  The previous Anthropic integration is still available (`AI_PROVIDER=anthropic`)
  but that account has no credit, so it returns
  `invalid_request_error: Your credit balance is too low`.

---

## Demo accounts

Seeded so the platform can be shown without creating data on the spot. Both use
the password `DemoPass123!`.

| Role | Email | ID |
|---|---|---|
| Patient | `demo.patient@beralcare.test` | `BC-2026-00001` |
| Clinician | `demo.doctor@beralcare.test` | `DR-2026-00001` |

The patient has two written-up consultations (malaria, hypertension) and two
upcoming appointments, and has approved the clinician's access — so both the
patient record and the clinical view show real content rather than empty states.

Delete them from the Railway database when they are no longer wanted; removing
the two user rows cascades to their consultations, requests, and notifications.
