# Beral Care — API Reference

Base URL (local): `http://localhost:3000`

All protected routes require: `Authorization: Bearer <JWT>`

---

## Auth (public — no token required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register patient or doctor. Body: `{ full_name, email, phone, password, role }` |
| POST | `/api/auth/login` | Login all roles. Body: `{ email, password }` |

**Register response:**
```json
{ "user": { "id", "full_name", "name", "email", "phone", "role", "patient_id" }, "token" }
```

**Login response:**
```json
{ "user": { "id", "full_name", "name", "email", "role", "patient_id" }, "token" }
```

---

## Admin routes — requires `role: admin`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List all users. Query: `?role=patient\|doctor\|admin` |
| GET | `/api/admin/users/:id` | Get single user |
| GET | `/api/admin/stats` | `{ total_patients, total_doctors, total_consultations }` |
| DELETE | `/api/admin/users/:id` | Delete user (cannot delete self) |
| PATCH | `/api/admin/users/:id/suspend` | Body: `{ suspended: true\|false }` |

---

## Doctor routes — requires `role: doctor`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/doctor/profile` | Own profile |
| GET | `/api/doctor/recent-patients` | Last 10 approved patients |
| GET | `/api/doctor/patient/:patientId` | Patient by health ID (access-controlled) |
| GET | `/api/doctor/appointments` | Own appointments |
| POST | `/api/doctor/create-patient` | Create patient account. Body: `{ full_name, email, phone, password }` |

**Access control on `GET /api/doctor/patient/:patientId`:**
- No request yet → creates pending request, returns `403`
- Pending → returns `403 "Access request pending patient approval"`
- Denied → returns `403 "Access denied by patient"`
- Approved → returns `{ patient, consultations }`

---

## Patient routes — requires `role: patient`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/patient/profile` | Own profile |
| GET | `/api/patient/history` | Medical history (consultations ordered by date DESC) |
| GET | `/api/patient/appointments` | Own appointments |
| POST | `/api/patient/appointments` | Book appointment. Body: `{ doctor_id, consultation_date, notes }` |
| GET | `/api/patient/notifications` | All access requests (all statuses) |
| GET | `/api/patient/access-requests` | Pending access requests only |
| PATCH | `/api/patient/access-requests/:id` | Body: `{ decision: "approved"\|"denied" }` |

---

## Utility

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Health check |
| GET | `/setup-db` | Create all tables (run once after deploy) |
