# Beral Care: Project Documentation

---

## The Problem This Project Was Built to Solve

Access to quality healthcare remains one of the most urgent and least resolved challenges across Africa, with millions of people living in communities where the nearest clinic is hours away, where a doctor may be managing hundreds of patients with no digital tools to support that workload, and where the systems meant to coordinate care are either absent or too fragile to be relied upon consistently. The result is a healthcare gap that affects not just patients but every person involved: the nurse who cannot retrieve a patient's records, the doctor who has to make a critical decision without a colleague to consult, and the patient who receives a prescription they do not fully understand and has no easy way to ask about it afterward.

This project was built as a direct, practical answer to that gap, not as a broad vision statement but as a working platform that addresses three specific failure points: the lack of accessible patient records for doctors, the lack of control that patients have over their own health data, and the lack of basic healthcare access for the large portion of the continent's population that does not own a smartphone.

---

## Who This Platform Was Designed For

**Patients** are the foundation of everything built here. Every feature begins with the question of what a patient genuinely needs in order to feel informed, safe, and in control of their own health, and that question shaped decisions at every level of the design. Beral Care gives patients a personal health ID in the format BC-YYYY-NNNNN that they can carry in their pocket or share as a QR code, a complete record of every consultation they have had, and direct control over which doctors are permitted to view those records. The HealthGuide AI companion goes one step further, allowing patients to ask questions about their diagnoses, medications, and health habits in plain language and receive answers that are connected to their actual medical history, not a generic response built for no one in particular.

**Doctors** benefit from a platform that organises the information they need and brings it to them at the moment they need it. A doctor using Beral Care can pull up a patient's complete consultation history instantly by typing their ID or scanning their QR code, create detailed records with diagnosis, prescription, and clinical notes, and manage their appointment schedule from the same interface. The MedAssist AI assistant is available on every screen, providing differential diagnoses, treatment protocol recommendations based on WHO Africa region guidelines, drug interaction checks, and dosage guidance, all calibrated to the specific disease burden and medication availability of the African clinical context.

**Administrators** have the tools to keep the platform trustworthy and well managed: system-wide statistics, user search and filtering by role, account suspension and deletion with confirmation steps, and a deliberately enforced privacy wall that prevents any administrative user from accessing patient medical records.

---

## What Sets This Platform Apart

Most digital health tools available today were designed for environments with reliable internet, modern devices, and healthcare systems that already have functional infrastructure. Beral Care was designed for a different set of conditions, and three specific features reflect that difference most clearly.

The **USSD gateway** is the most consequential of these. USSD is a communication protocol that functions on any mobile phone, including the cheapest feature phones available, and requires nothing more than a basic cellular signal to operate. Through it, a user can register a patient account, log in with a password, request a consultation, and review their recent history, all by dialling a short code and navigating a numbered menu. The country code used to format local phone numbers is a single environment variable, which means the gateway can be deployed across different African countries without any modification to the codebase.

The **patient-controlled access system** distinguishes this platform from the assumption common to most healthcare software, where a doctor's right to access patient data is treated as automatic. Here, a doctor who wants to view a patient's records must send an access request, the patient receives a notification, and the records remain locked until the patient explicitly approves. This is not a technical limitation but a deliberate design principle: patients own their data, and the system behaves accordingly at every level, including the AI layer, where patient context is only injected into a doctor's assistant session after access has been confirmed by the server.

The **AI assistants** are tuned for their specific contexts rather than serving as general-purpose chatbots applied to a health setting. MedAssist understands that malaria, typhoid fever, and tuberculosis are among the most likely explanations for common presentations in sub-Saharan Africa, that available first-line treatments differ from those assumed in Western clinical guidelines, and that emergency escalation needs to be flagged immediately and unambiguously. HealthGuide communicates at the level of a patient who may have had limited formal education, uses no unexplained medical terminology, and treats every question as worth answering carefully, because it was built for people who may have very few other places to turn with their health concerns.

---

## Technology and Architecture

The platform is composed of three integrated systems, each built to function independently while sharing a common data layer.

The **mobile and web application** is built with React Native and Expo, producing a single codebase that runs on Android, iOS, and any modern web browser. The application supports English and French, with the selected language stored in local storage and applied immediately across every screen. Navigation is managed with React Navigation's native stack, which provides a smooth experience on both mobile and web while keeping the route structure clear and easy to follow.

The **backend API** is a Node.js and Express server connected to a MySQL database, with security built into the architecture rather than layered on top. Authentication uses JSON Web Tokens with a 24-hour expiry, passwords are stored with bcrypt at a cost factor of 10, and login and registration endpoints are protected by a rate limiter that allows a maximum of 20 attempts per 15-minute window per IP address. Role-based access is enforced on every protected route at the server level, meaning a patient cannot reach a doctor endpoint and a doctor cannot reach an admin endpoint regardless of what the front end does. Patient ID generation runs inside a full database transaction using a SELECT FOR UPDATE lock, ensuring that two simultaneous registrations can never produce duplicate identifiers.

The **USSD gateway** is a Python Flask application that bridges the dial-in phone experience with the main API, handling session continuity through Redis and calling the same endpoints used by the mobile application. This means USSD users are not second-class participants on a separate system: they interact with the same patient records, the same consultation history, and the same infrastructure as every other user on the platform.

The **AI layer** uses the Anthropic model for both assistants, accessed through the official Anthropic SDK on the backend server. The API key never leaves the server environment, and all context injection, including the loading of a patient's medical history into a conversation, happens only after the server has verified that the necessary access permissions are in place. If the database is unavailable for any reason, context loading fails silently and the assistant continues to respond without patient-specific context, rather than returning an error to the user.

---

## The Real-World Impact

The clearest way to understand what this platform is capable of is to imagine the specific people it was designed to serve.

A doctor working in a district hospital on a busy Wednesday afternoon sees a patient whose presentation does not fit any single clear diagnosis: a combination of fever, abdominal pain, and a rash that could indicate several different conditions, some of them serious. Without any support tools, that doctor makes the best call they can under time pressure, relying entirely on training and memory. With MedAssist, they describe the presentation in plain language, receive a ranked list of differentials with brief clinical reasoning for each, a recommended workup, and a first-line protocol referenced to its evidence source, all within a few seconds and without leaving the consultation.

A patient recently diagnosed with hypertension goes home after a ten-minute appointment holding two prescriptions and a vague sense that something important was explained but not fully understood. That evening, using HealthGuide on their phone, they ask what hypertension actually means for their body, what each medication does, and what they should do if they forget a dose. The answers they receive are clear, warm, grounded in their actual prescription history, and given without any implication that the question was obvious or unimportant.

A woman in a rural district who does not own a smartphone and cannot afford the journey to the nearest clinic dials a short code on the basic phone she uses every day. She registers herself as a patient, describes her health concern, and receives confirmation that a consultation request has been submitted. She has not been excluded from the platform because of the device in her pocket, and that is not an accident.

---

## Complete Feature List

**Patient features:**
- Personal health ID card in BC-YYYY-NNNNN format, copyable and shareable as a QR code
- Doctor access request management with approve and deny controls and full notification history
- Complete medical history view with expandable consultation entries showing diagnosis, prescription, and notes
- Appointment booking with a doctor selection modal, a native date picker, and optional notes
- In-app notification centre with the ability to mark individual items as read
- Profile management including name, phone number, and optional profile photo
- HealthGuide AI companion with personalised context from the patient's own medical history

**Doctor features:**
- Patient lookup by typed ID or QR code camera scan
- Access-controlled record viewing: records are visible only after the patient approves
- Consultation creation form with required diagnosis and prescription fields and optional notes
- Dashboard filtered to show only today's appointments, with full history accessible separately
- Recently accessed patients list for quick re-entry into active cases
- MedAssist AI assistant with six clinical prompt shortcuts and automatic patient context injection

**Admin features:**
- System statistics showing live counts of patients, doctors, and total consultations
- User list with search by name or email and role filter
- Account suspension and unsuspension with confirmation
- Account deletion with confirmation and a safeguard preventing self-deletion
- Privacy wall: no path from admin tools to patient medical records

**USSD gateway:**
- Patient registration by phone
- Session-based login with Redis storage
- Consultation request submission with a free-text health description
- Recent consultation history review
- Logout with immediate session clearance
- Country code configurable via environment variable

**Backend:**
- JWT authentication with 24-hour expiry and automatic token removal on 401 responses
- bcrypt password hashing at cost factor 10
- Rate limiting: 20 attempts per 15 minutes on auth routes, 30 requests per minute on AI routes
- Role-based access control enforced server-side on every protected endpoint
- Atomic patient ID generation with SELECT FOR UPDATE to prevent duplicates
- Patient-controlled access request and notification system
- Profile image upload with MIME type validation and a 5 MB size limit
- MedAssist endpoint: doctor role guard, silent DB fallback, patient context injection
- HealthGuide endpoint: patient role guard, silent DB fallback, personal history injection
- Twilio integration for SMS notifications
- SendGrid integration for email notifications
- 13 automated tests covering registration, login, role enforcement, and edge cases

---

## Reading the Codebase

Three files give any new developer a complete map of the system before they read anything else.

`main-app.js` at the project root defines the entire navigation structure, registers every screen by name, and shows exactly how the initial route is determined by the authenticated user's role, which makes the overall flow of the application immediately clear.

`src/context/AuthContext.js` is where the authenticated user object and token are stored in local storage and restored when the app reopens, and understanding this file explains how every protected screen knows who is logged in and what they are permitted to do.

`backend/backend-server.js` is where the Express server is configured, all route groups are mounted with their middleware, rate limiters are applied, and the environment is loaded, giving a complete view of the API surface and the security layer in front of it.

From there, the six files in `backend/routes/` contain the actual logic: `auth.js` for public registration and login, `patient.js` and `doctor.js` for role-specific actions, `admin.js` for platform management, `profile.js` for user profile and image handling, and `ai.js` for both AI assistants. On the front end, `src/components/AIChat.jsx` is a good example of how the shared component pattern works: the doctor and patient versions pass in different configuration as props, but the message state, API calls, and interface logic live in one place.

---

## What Comes Next

Every core system in this platform is in place and working: authentication, access control, consultation records, the USSD gateway, the AI assistants, and the test suite. What comes next will be shaped by the people who use it, and the architecture was built to support the growth that will follow once those users have been heard.

Possibilities include real-time video consultations, a telemedicine scheduling system with calendar integration, a country-specific drug formulary built into MedAssist, a community health worker portal for outreach programs, and expanded language support beyond English and French. The foundation is ready for all of it.

---

*Created and maintained by Adossi Fred William*
