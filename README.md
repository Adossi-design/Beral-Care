# Beral Care

Telemedicine and patient-held medical records for the continent. Patients carry a
permanent Health ID, hold their own consultation history, and decide which
clinicians may read it. Clinicians look up a patient by ID or QR scan, write
consultations, and get clinical decision support at the point of care. People
without a smartphone reach the same record over USSD on any handset.

**Live:** [beral-care.vercel.app](https://beral-care.vercel.app)

---

## Why it exists

Across much of Africa the nearest clinic can be hours away, a clinician may be
managing hundreds of patients with no digital tools, and a patient's history
lives in a paper file in one building. Three specific failures follow from that,
and the platform is built around them:

**Records do not travel.** A patient changing clinic starts from nothing. Here
the record belongs to the patient and follows them.

**Access is assumed rather than granted.** Most health software treats a
clinician's right to read a file as automatic. Here a clinician requests access,
the patient approves or declines, and the record stays sealed until they do —
enforced by the API, not by the interface.

**Connectivity decides who gets care.** The full platform runs in any browser,
and the essentials run over USSD with no internet at all.

---

## What each role can do

**Patients** hold a Health ID (`BC-YYYY-NNNNN`) they can copy or show as a QR
code, book appointments, read their full consultation history including every
diagnosis and prescription, manage which clinicians have access, and ask
HealthGuide to explain any of it in plain language.

**Clinicians** open a patient record by typing an ID or scanning a code, record
consultations with diagnosis, prescription, and notes, manage their schedule and
incoming access requests, and consult MedAssist for differential diagnoses, drug
interactions, dosing, and WHO Africa treatment protocols.

**Administrators** see platform totals, manage accounts, and suspend or delete
users. They cannot read medical records — the API does not expose consultation
content to that role at all.

---

## Architecture

| Part | Stack | Location |
|---|---|---|
| Web application | React 18, Vite, React Router, plain CSS | `web/` |
| API | Node, Express 5, MySQL | `backend/` |
| USSD gateway | Python, Flask, Redis | `ussd-gateway/` |

The web app is the only client. It is responsive from 360 px to widescreen and
installs to a phone home screen, so a smartphone user needs nothing from an app
store.

### Web application

No UI framework. The design system is CSS custom properties in
`web/src/styles/tokens.css` — colour, type scale, spacing, radii, elevation —
and no component file contains a raw hex value. The application shell provides
three navigation chromes (sidebar, icon rail, bottom tab bar) switched entirely
by CSS media query, so there is no layout flash and no resize listener.

Icons are a hand-drawn stroke set in `web/src/components/ui/Icon.jsx`, not an
icon font and not emoji.

Routes are split per role, so a patient never downloads the clinician or
administrator bundle.

### API

JWT authentication with a 24-hour expiry, bcrypt password hashing, rate limiting
on auth and AI routes, CORS restricted to an allow-list, and role checks enforced
by middleware on every protected route. Patient IDs are generated inside a
transaction so concurrent registrations cannot collide.

### AI assistants

`backend/utils/ai/` holds one adapter per provider behind a common interface.
Routes call `ai.ask()` and never learn which model answered; changing provider is
an environment variable, not a code change.

Default is **Google Gemini** through AI Studio, whose free tier covers this
workload. Anthropic is retained as an alternative.

```
AI_PROVIDER=gemini          # or anthropic; omit to auto-select what is configured
GEMINI_API_KEY=...          # free key from aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.0-flash
```

`GET /api/ai/status` reports which provider is active.

---

## Running locally

```bash
# API — needs a MySQL database
cd backend && npm install && npm start

# Create the schema once
curl "http://localhost:3000/setup-db?key=$DB_SETUP_KEY"

# Web application
cd web && npm install && npm run dev     # http://localhost:5173
```

The dev server proxies `/api` to `localhost:3000`, so there is no CORS setup for
local work.

```bash
cd backend && npm test    # 13 tests
```

### Environment

`backend/.env`

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173

DB_HOST=       DB_PORT=3306
DB_USER=       DB_PASSWORD=
DB_NAME=       DB_SEED_SAMPLE_DATA=false

JWT_TOKEN=              # long random string
DB_SETUP_KEY=           # protects /setup-db

AI_PROVIDER=gemini
GEMINI_API_KEY=

TWILIO_ACCOUNT_SID=     TWILIO_AUTH_TOKEN=     TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=       SENDGRID_FROM_EMAIL=
```

`web/.env.local`

```env
VITE_API_URL=http://localhost:3000
```

`ussd-gateway/.env`

```env
API_BASE_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
DEFAULT_COUNTRY_CODE=+250
```

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the hosted setup, how to redeploy each
piece, and the limitations of the current tiers.

---

Created and maintained by Adossi Fred William.
