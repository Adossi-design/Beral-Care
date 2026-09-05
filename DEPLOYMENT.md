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
| Web app | Vercel (static export) | https://beral-care.vercel.app |
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
to the repository root, so a push deploys the repo root as a static site. That
silently replaces the working production deployment: the USSD gateway starts
serving the Expo entry file instead of Flask, and `/ussd` returns 404. This
happened once and was fixed by disconnecting Git and redeploying from the CLI.

If you want push-to-deploy back, reconnect Git **and** set the project's Root
Directory in the Vercel dashboard first — `ussd-gateway` for the gateway. The web
project cannot use Git deploys at all, because it ships the prebuilt `dist/`
directory, which is gitignored.

---

## Web app (Vercel)

The Expo web export is built locally and deployed as static files, because the
build needs the Expo toolchain rather than a plain Vercel build step.

```bash
npx expo export --platform web        # writes to dist/
npx vercel deploy --prod --cwd dist
```

`dist/` is gitignored, so it also holds a small `vercel.json` that rewrites all
routes to `index.html` for client-side routing. **That file is recreated by the
export, so re-add it after each build** if client-side routes start 404ing on
refresh.

The API base URL is baked in at build time from `EXPO_PUBLIC_API_BASE_URL` in
the root `.env`. Point it at the Render URL before exporting for production, and
back at `http://localhost:3000` for local development.

Any new web origin must be added to `ALLOWED_ORIGINS` on the backend, or the
browser will be blocked by CORS.

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
- **The AI assistants are not working yet.** MedAssist and HealthGuide return
  "AI assistant is currently unavailable" because the Anthropic account has no
  credit: the API responds `invalid_request_error: Your credit balance is too
  low to access the Anthropic API`. The key itself is valid and correctly
  configured — purchase credits at console.anthropic.com and the feature starts
  working with no code or deployment change.

  Separately, the assistants pin the pinned model. That is a valid model, but
  a newer model is both newer and cheaper ($2/$10 per million input/output
  tokens versus $3/$15), so it is worth switching in `backend/routes/ai.js` when
  there is credit available to test the change.
