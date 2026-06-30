# Beral Care: Telemedicine and USSD App

Beral Care is a mobile health platform that connects patients with doctors across Africa. It also works for people who do not have a smartphone, thanks to a USSD service they can dial from any basic phone.

---

## Mobile App (React Native + Expo)

### Roles

The app supports three types of users: patients, doctors, and admins.

**Patient features:**
- Dashboard with Patient ID card (copy or share as QR code)
- Doctor access request approval/denial with full notification history
- Medical history summary (diagnoses, prescriptions, consultations)
- Appointment booking and history
- Profile page with tap-to-copy Patient ID

**Doctor features:**
- Patient lookup by `BC-YYYY-NNNNN` ID or QR code scan
- Access control flow: the patient must approve before any records become visible
- Today's appointments shown on the dashboard
- Recently accessed patients list
- Appointment management and consultation record creation

**Admin features:**
- User management: search, filter by role, view details, suspend, or delete
- System stats dashboard (patients, doctors, consultations)
- Hidden login page that is not linked from any public screen

---

## USSD Gateway (Python + Flask)

This service lets users without smartphones dial in and:
- Register a new patient account
- Log in with a password
- Request a consultation
- View their consultation history
- Log out

It is built with Flask, Redis for session storage, and python-dotenv. It deploys to Vercel. The country code prefix is configurable through the `DEFAULT_COUNTRY_CODE` environment variable, so it works across different African countries.

---

## Backend (Node.js + Express + MySQL)

- JWT authentication with a 24-hour expiry and bcrypt password hashing
- Rate limiting on login and registration: max 20 attempts per 15 minutes per IP
- CORS restricted to configured origins only (set `ALLOWED_ORIGINS` in your `.env`)
- Role-based access control on all routes (`/api/admin/*`, `/api/doctor/*`, `/api/patient/*`)
- Auto-generated Patient IDs in `BC-YYYY-NNNNN` format, generated inside a database transaction to prevent duplicates
- Doctor to patient access request system: patients approve or deny doctor access to their records
- SMS notifications via Twilio (optional)
- Email notifications via SendGrid (optional)
- Automated tests using Jest and supertest (`npm test` inside the `backend/` folder)

---

## Setup

### 1. Mobile app: root `.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 2. Backend: `backend/.env`

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Database
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=beral_care
DB_SEED_SAMPLE_DATA=false

# Auth
JWT_TOKEN=replace_with_a_long_random_secret

# Twilio (SMS, optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# SendGrid (Email, optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=you@example.com

# Admin seeder (only needed when running backend/seeders/createAdmin.js)
ADMIN_EMAIL=admin@beralcare.local
ADMIN_PASSWORD=replace_with_strong_admin_password

# Database setup protection: if set, GET /setup-db requires ?key=YOUR_KEY
DB_SETUP_KEY=your_secret_setup_key
```

### 3. USSD gateway: `ussd-gateway/.env`

```env
API_BASE_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
# Country code prefix for local phone numbers (e.g. +250 for Rwanda, +234 for Nigeria)
DEFAULT_COUNTRY_CODE=+250
```

### 4. Run

```bash
# Backend
cd backend && npm install && node backend-server.js

# Create database tables (run once after first deploy)
# Add ?key=YOUR_KEY if you set DB_SETUP_KEY in your .env
GET http://localhost:3000/setup-db

# Create the admin account (run once, then keep the file out of version control)
node backend/seeders/createAdmin.js

# Run backend tests
cd backend && npm test

# Mobile app
npm install && npx expo start
```

---

## Project Structure

```
Beral-Care/
├── backend/                  # Node.js/Express API
│   ├── routes/               # auth, admin, doctor, patient, profile
│   ├── middleware/            # roleGuard.js
│   ├── utils/                # auth, db, consultation, email, twilio
│   ├── database/             # SQL schema
│   ├── tests/                # Jest test suite
│   └── seeders/              # createAdmin.js (gitignored)
├── client-services/          # Axios API instance and auth service
├── src/
│   ├── components/           # Layouts, ProtectedRoute, RoleGuard, QR components
│   ├── context/              # AuthContext, LanguageContext (EN/FR)
│   └── pages/                # admin/, doctor/, patient/, Login, Register, Splash
├── ussd-gateway/             # Python/Flask USSD service
└── main-app.js               # Root navigator with role-based routing
```

---

Created and maintained by Adossi Fred William
