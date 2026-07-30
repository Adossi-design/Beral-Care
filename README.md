# Beral Care: Telemedicine and AI Health Assistant

Beral Care is a telemedicine platform that connects patients with doctors across the continent, available as a mobile app on any smartphone, as a web application, and through a USSD dial code that works on basic phones without requiring internet access. The platform includes two AI health assistants: MedAssist, which provides real-time clinical support to doctors, and HealthGuide, which helps patients understand their health in plain, accessible language.

For the full account of what this project is, the problem it addresses, and the impact it is designed to create, read the [project documentation](DOCUMENTATION.md).

---

## Why This Project Matters

Across much of Africa, millions of patients live far from the nearest clinic, and the doctors serving those communities frequently work without reliable access to patient records, clinical reference tools, or colleagues to consult on difficult cases. A patient who receives a diagnosis and a prescription often leaves the consultation without fully understanding either, carrying questions they were too uncertain to ask and no accessible way to find answers later. Beral Care was built as a direct response to that reality, equipping every person in the healthcare chain with the tools they need: the patient, the doctor, and the administrator managing the platform.

---

## What the App Does

The platform supports three distinct roles, each with a purpose-built set of features.

**Patients** hold a personal health ID card that they can copy or share as a QR code, book appointments with available doctors, review their complete medical history including all diagnoses and prescriptions, and control precisely which doctors are permitted to access their records through an explicit approve or deny system.

**Doctors** can search for any patient by their unique ID or by scanning a QR code, access the records of patients who have granted permission, create detailed consultation notes covering diagnosis, prescription, and clinical observations, and receive real-time guidance from the MedAssist AI assistant throughout the consultation.

**Admins** can monitor platform-wide statistics, search and filter all registered users, suspend accounts where necessary, and manage deletions, all without access to any patient medical records, which are protected at the system level.

---

## The Two AI Assistants

### MedAssist: Clinical Support for Doctors

A floating **✦ MedAssist** button appears at the bottom right of the doctor dashboard, and tapping it opens a full clinical chat panel that greets the doctor by name and offers six ready-made prompt shortcuts covering the most common clinical needs:

- Differential diagnosis
- Drug interaction check
- Treatment protocol
- Dosage guide
- Lab result interpretation
- Refer or treat?

When the doctor is viewing a patient for whom they hold approved access, MedAssist automatically loads that patient's full consultation history as context, ensuring every response is grounded in the actual case rather than a generic scenario. All guidance follows WHO Africa region protocols, emergency presentations are flagged explicitly at the top of the response, and each recommendation includes its evidence source. Every reply concludes with a reminder that clinical judgment belongs to the treating physician.

### HealthGuide: Health Companion for Patients

A floating **✦ HealthGuide** button appears at the bottom right of the patient dashboard, opening a personal chat that addresses the patient by name and draws on their medical history to give contextually relevant answers. Five prompt shortcuts cover the questions patients ask most often:

- Explain my diagnosis
- Tell me about my medication
- Side effects to watch out for
- Help me prepare for my appointment
- Healthy habits for my condition

HealthGuide communicates entirely in plain language, defines any medical term it uses, and consistently redirects serious or uncertain concerns back to the treating doctor, because that boundary was built into the system intentionally.

---

## USSD Gateway

The USSD gateway extends the platform to users who do not own a smartphone, allowing them to access the following services by dialling a short code from any mobile phone, with no internet connection required:

- Register a new patient account
- Log in with a password
- Request a consultation
- Check recent consultation history
- Log out

The gateway is built with Python and Flask, uses Redis to maintain session state during a call, and deploys to Vercel. The country code applied to local phone numbers is configured through a single environment variable, making the gateway deployable across different African countries without any code changes.

---

## Backend

The backend is a Node.js and Express server connected to a MySQL database, built with security enforced at every layer rather than applied as an afterthought.

- Passwords are hashed with bcrypt, and sessions are managed with JWT tokens carrying a 24-hour expiry
- Authentication attempts are rate-limited to 20 per 15-minute window per IP address to prevent brute force access
- CORS is restricted to explicitly allowed origins, configured through the `ALLOWED_ORIGINS` variable in the environment file
- Access levels for admin, doctor, and patient are enforced on every protected route on the server, independent of any front-end logic
- Patient IDs are generated inside database transactions to guarantee uniqueness even under concurrent registrations
- Patients approve or deny each doctor's access request individually, giving them direct ownership of their data
- SMS notifications are available through Twilio, and email notifications through SendGrid, both optional
- The AI assistants use the Anthropic API and require a valid API key with credits at `console.anthropic.com`
- A test suite of 13 automated tests can be run with `npm test` from the `backend/` directory

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

# AI assistants (get your key at console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

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

# Database setup protection
DB_SETUP_KEY=your_secret_setup_key
```

### 3. USSD gateway: `ussd-gateway/.env`

```env
API_BASE_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
DEFAULT_COUNTRY_CODE=+250
```

### 4. Run

```bash
# Backend
cd backend && npm install && node backend-server.js

# Set up database tables (run once after first deploy)
GET http://localhost:3000/setup-db?key=YOUR_DB_SETUP_KEY

# Create the admin account (run once)
node backend/seeders/createAdmin.js

# Run backend tests
cd backend && npm test

# Mobile and web app
npm install && npx expo start
```

---

## Project Structure

```
Beral-Care/
├── backend/
│   ├── routes/          auth, admin, doctor, patient, profile, ai
│   ├── middleware/       roleGuard.js
│   ├── utils/            auth, db, consultation, email, twilio
│   ├── database/         SQL schema
│   └── tests/            Jest test suite (13 tests)
├── client-services/      Axios API instance and auth service
├── src/
│   ├── components/       Layouts, ProtectedRoute, QR scanner, AIChat
│   ├── context/          AuthContext, LanguageContext (English and French)
│   └── pages/            admin/, doctor/, patient/, Login, Register, Splash
├── ussd-gateway/         Python/Flask USSD service
└── main-app.js           Root navigator with role-based routing
```

---

Created and maintained by Adossi Fred William
