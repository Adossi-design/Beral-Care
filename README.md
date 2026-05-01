# 🩺 Beral Care — Telemedicine & USSD App

Beral Care is a mobile health platform that connects patients with doctors across Africa, with offline access via USSD for users without smartphones.

---

## 📱 Mobile App (React Native + Expo)

### Roles
- **Patient** — registers, books appointments, manages health records, controls doctor access
- **Doctor** — searches patients by ID or QR scan, views approved patient records, manages appointments
- **Admin** — manages all users (view, suspend, delete), views system stats

### Patient Features
- Dashboard with Patient ID card (copy or share as QR code)
- Doctor access request approval/denial with full notification history
- Medical history summary (diagnoses, prescriptions, consultations)
- Appointment booking and history
- Profile page with tap-to-copy Patient ID

### Doctor Features
- Patient lookup by `BC-YYYY-NNNNN` ID or QR code scan
- Access control flow — patient must approve before records are visible
- Recently accessed patients list
- Appointment management
- Create patient accounts directly

### Admin Features
- User management — search, filter by role, view details, suspend, delete
- System stats dashboard (patients, doctors, consultations)
- Hidden login page (not linked from any public screen)

---

## ✳️ USSD Gateway (Python + Flask)

For users without smartphones. Dial the USSD code to:
- Register (creates a patient account)
- Login
- Request a consultation
- View consultation history
- Logout

Built with Flask, Redis (sessions), python-dotenv. Deployed via Vercel.

---

## 🗄️ Backend (Node.js + Express + MySQL)

- JWT authentication (24h expiry), bcrypt password hashing
- Role-based access control on all routes (`/api/admin/*`, `/api/doctor/*`, `/api/patient/*`)
- Auto-generated Patient IDs in `BC-YYYY-NNNNN` format
- Doctor–patient access request system
- SMS notifications via Twilio (optional)
- Email notifications via SendGrid (optional)

---

## 🚀 Setup

### 1. Mobile App — root `.env`
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 2. Backend — `backend/.env`
```env
PORT=3000
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=beral_care
DB_SEED_SAMPLE_DATA=false
JWT_TOKEN=replace_with_a_long_random_secret

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=you@example.com

# Admin seeder (only needed when running backend/seeders/createAdmin.js)
ADMIN_EMAIL=admin@beralcare.local
ADMIN_PASSWORD=replace_with_strong_admin_password

# Database setup protection (optional - if set, /setup-db requires ?key=YOUR_KEY)
DB_SETUP_KEY=your_secret_setup_key
```

### 3. USSD Gateway — `ussd-gateway/.env`
```env
API_BASE_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
```

### 4. Run

```bash
# Backend
cd backend && npm install && node backend-server.js

# Initialize DB tables (run once)
# If you set DB_SETUP_KEY in .env, add ?key=YOUR_KEY to the URL
GET http://localhost:3000/setup-db

# Create admin account (run once, then delete the file)
node backend/seeders/createAdmin.js

# Mobile app
npm install && npx expo start
```

---

## 📁 Project Structure

```
Beral-Care/
├── backend/              # Node.js/Express API
│   ├── routes/           # auth, admin, doctor, patient
│   ├── middleware/        # roleGuard.js
│   ├── utils/            # auth, db, consultation, email, twilio
│   ├── database/         # SQL schema + bootstrap scripts
│   └── seeders/          # createAdmin.js (gitignored)
├── client-services/      # Axios API instance + auth service
├── src/
│   ├── components/       # Layouts, ProtectedRoute, RoleGuard, QR components
│   ├── context/          # AuthContext
│   └── pages/            # admin/, doctor/, patient/, Landing, Login, Register
├── ussd-gateway/         # Python/Flask USSD service
└── main-app.js           # Root navigator
```

---

Created and maintained by Adossi Fred William
