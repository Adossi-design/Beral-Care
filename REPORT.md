# Beral Care: Project Report

**Author:** Adossi Fred William
**Started:** 27 April 2026
**Status:** Working prototype, deployed, no real users

---

## 1. Summary

Beral Care is a telemedicine platform built around one idea: the
medical record should belong to the patient rather than to a clinic, and the
patient should decide who is allowed to read it.

A patient receives a permanent health ID, keeps their full consultation history
in one place, and approves or refuses each doctor who asks for access. A doctor
opens a patient's file by typing that ID or scanning a code, writes up
consultations, and can consult an assistant for clinical support during the
visit. Someone with no smartphone and no internet reaches the same record by
dialling a USSD short code.

The project has been in development since April 2026 and is currently deployed
and working end to end. It has not been used by real patients or clinics.

---

## 2. Where the idea came from

This project started from something that happened to me.

I was being treated at Kanombe Military Hospital in Rwanda and needed
information about my earlier treatment. The doctor who had been treating me was
attending meetings, and I was told she would not be available for several weeks,
until the following month.

The unavailability was not really the problem. I was sick at the time, and what
troubled me was that I could not get hold of my own medical information so that
I could go and look for help elsewhere. I waited, still in pain, until she was
back and could tell me what I needed to know.

Afterwards I kept turning over what would have happened if my condition had been
more serious, or if I had urgently needed a different doctor who knew nothing
about what had already happened to me.

There was a second version of the same problem. I have been given medical papers
before and lost some of them later, and once enough time has passed it becomes
very hard to remember what condition you had, what medicine you were given, what
the doctor said, or what was recorded during a consultation. When I looked
around I saw relatives, siblings, cousins, and other people close to me running
into the same thing.

That was when it stopped looking like a personal inconvenience and started
looking like a problem I might be able to build something around.

### The first problem I wanted to solve

The original idea was much smaller than the application that exists now. I
wanted people to have one place where they could keep track of their own medical
history, so that someone could look back several years later and still know what
happened during a consultation, what condition was recorded, what medicine was
prescribed, which doctor treated them, and what notes were written.

Health information should not become useless because a piece of paper went
missing. That idea is still at the centre of the application.

### The problems that appeared while building

Three more problems surfaced while working on it, and each one shaped part of
the system.

Making health information easier to reach should not mean making it available to
everybody. Health information is personal, and digitising it creates a privacy
problem that paper never had, which is why the patient controls access.

Not everyone has reliable internet or a modern smartphone, and a platform that
assumes both would exclude some of the people I am most interested in helping.
USSD works on any GSM handset with no internet at all.

Finally, reaching your information is not the same as understanding it. A doctor
may record a diagnosis and prescribe medicine, and the patient can still leave
with questions they did not feel able to ask. That is where the assistants came
from, and they came late rather than first.

---

## 3. What the platform does

### For patients

A patient signs up and immediately receives a health ID in the form
`BC-2026-00001`, which they can copy or display as a QR code. From their account
they can:

- read every consultation recorded for them, with the diagnosis, the medicine
  prescribed, and the doctor's notes
- book a visit with any doctor on the platform
- see which doctors currently have access to their records, and withdraw that
  access at any time
- approve or refuse each new access request
- ask HealthGuide to explain a diagnosis or a medicine in plain language

### For doctors

A doctor opens a patient's file by typing the health ID or scanning the QR code.
They can then:

- read the consultation history of patients who have approved them
- write up a consultation with diagnosis, prescription, and notes
- manage their schedule and book follow up visits
- accept or decline requests from patients asking for their help
- consult MedAssist for possible diagnoses, drug interactions, dosing, and WHO
  Africa treatment guidance

### For administrators

Administrators manage accounts, see platform totals, and can block or delete
users. They cannot read anyone's medical information. This is enforced by the
API rather than hidden in the interface.

### Over USSD

By dialling a short code from any phone, a person can register, log in, request
a consultation, and review their recent visits. These actions write to the same
database as the website.

---

## 4. Architecture

The system has three deployable parts sharing one database.

| Part | Technology | Responsibility |
|---|---|---|
| `web/` | React 18, Vite, React Router | The interface, for all three roles |
| `backend/` | Node, Express 5, MySQL | Data, authentication, access rules, AI |
| `ussd-gateway/` | Python, Flask, Redis | Menu flow for basic phones |

The website is the only client. It is responsive from small phones to
widescreen and can be installed to a phone's home screen.

The USSD gateway does not have its own database. It calls the same API
endpoints the website uses, holding only the state of the current call in Redis.
That decision was deliberate: giving it a separate store would have created two
versions of the truth and made people on basic phones second class users of
their own records.

---

## 5. Technology choices

### The website

React with Vite, and no UI framework. The design system is a set of CSS custom
properties covering colour, type scale, spacing, radius, and elevation, defined
in one file. No component contains a raw colour value, which is what keeps forty
screens visually consistent.

The application shell provides three navigation layouts: a full sidebar on
desktop, a collapsed icon rail on tablets, and a bottom tab bar on phones. The
switch between them happens in CSS media queries rather than JavaScript, so
there is no layout flash while the page loads and no resize listener re-running
the component tree.

Routes are split per role, so a patient never downloads the code for the doctor
or administrator areas. The production bundle is about 89 kB compressed.

Icons are inline SVG drawn on a shared grid rather than an icon font, so there
is no additional network request and each icon inherits the colour of its
context.

**An earlier version of this project used React Native and Expo**, producing one
codebase for Android, iOS, and the browser. In practice the browser was where
the application was actually used, and rendering React Native components into a
browser placed real limits on the result: no CSS grid, no media queries, no
genuine hover or focus states, and every element rendered as a generic `div`,
which made the site difficult to use with a screen reader. Rebuilding it as a
normal web application removed those constraints. The cost is that there are no
app store builds, which is acceptable because the site works well in a phone
browser and USSD reaches people without smartphones.

### The API

Node with Express 5 and MySQL.

MySQL was chosen over a serverless alternative for a specific reason. The schema
depends on foreign keys with `ON DELETE CASCADE` so that removing a user
correctly removes their consultations, requests, and notifications. Several
managed MySQL-compatible services do not enforce foreign key constraints, which
would have silently broken that guarantee.

Patient and doctor IDs are generated inside a database transaction, so two
people registering at the same moment cannot receive the same identifier.

### The USSD gateway

Flask with Redis for session state. A USSD session is a short sequence of menu
steps, and the gateway needs to remember where the caller is between requests.
Redis suits that well because the state is small, short lived, and can expire on
its own.

---

## 6. Security and privacy

Security decisions here follow from the central idea of the project, which is
that the patient controls the record.

**Authentication.** Passwords are hashed with bcrypt. Sessions use JSON Web
Tokens with a 24 hour expiry. A 401 response from any request clears the stored
session rather than leaving the interface half signed in.

**Access control by role.** Middleware checks the caller's role on every
protected route. A patient cannot reach a doctor endpoint, and a doctor cannot
reach an administrator endpoint, regardless of what the interface allows.

**Patient-granted access.** This is the part that matters most. A doctor may
only read a patient's records after that patient has approved their request, and
the check runs on the server on every request that touches a record. It cannot
be bypassed by modifying the front end. The patient can withdraw access later.

**Administrators cannot read records.** The API does not return diagnoses,
prescriptions, or notes to an administrator account at all. An administrator can
block an account, which prevents that person logging in, but cannot see what the
account contains.

**Rate limiting.** Authentication routes allow twenty attempts per fifteen
minutes per address, and AI routes thirty requests per minute. Because the
service runs behind a hosting proxy, Express is configured to trust one proxy
hop, otherwise every request would appear to come from the proxy and the limit
would not distinguish between callers.

**CORS.** Only listed origins are accepted.

---

## 7. The AI layer

Two assistants sit on top of the record.

**MedAssist** supports a doctor during a consultation with possible diagnoses,
drug interaction checks, dosing guidance, and treatment steps that prefer WHO
Africa guidance and take account of which medicines are actually available. Each
answer states the basis for its recommendation and closes by reminding the
doctor that the final decision is theirs.

**HealthGuide** explains a diagnosis or a medicine to a patient in plain
language, defines any medical term it uses, and directs anything potentially
serious back to their doctor. It never recommends a medicine or suggests
changing a dose.

Both are grounded in the patient's real record. MedAssist receives a patient's
history only after the server has confirmed that the patient approved that
doctor, so the access rules apply to the AI exactly as they apply to the
interface.

### Why the provider is swappable

`backend/utils/ai/` holds one adapter per provider behind a shared interface,
and the route handlers call `ask()` without knowing which model answers.
Changing provider is an environment variable rather than a code change.

This came from a practical failure rather than a design preference. The project
originally called a paid API directly from the route handler. That account ran
out of credit and both assistants stopped working, and because the provider,
the model name, the prompts, and the HTTP handling were all mixed into one file,
there was no quick way to move to something else. Separating them meant the same
problem could not take the feature down again.

The platform now runs on Google Gemini through AI Studio, whose free tier covers
this workload. `GET /api/ai/status` reports which provider is currently active.

Building this surfaced a failure mode worth recording. Current Gemini flash
models reason before answering, and those reasoning tokens count against the
output limit. With the limit set too low, the model can spend the entire budget
thinking and return a successful response containing no text at all. A fifty
token ceiling produced forty six reasoning tokens and an empty reply. The limit
is now set with clear headroom, and the truncation case reports a specific
configuration error rather than an empty answer.

---

## 8. Development timeline

The project began on 27 April 2026 and has 163 commits.

| Period | Focus |
|---|---|
| April 2026 | Project setup, database schema, authentication, the first screens |
| May 2026 | Core features: consultations, access requests, appointments, admin tools |
| June 2026 | QR identification for patients and doctors, profile images, USSD gateway |
| July 2026 | Documentation and refinement |
| September 2026 | Deployment, rebuild of the front end as a web application, AI provider layer, interface and language revision |

---

## 9. Testing and verification

The backend has an automated test suite of thirteen tests covering registration,
login, and the role guards, run with `npm test`.

Beyond the automated tests, the deployed system was checked end to end with a
real browser driving the live site: signing in as both a patient and a doctor,
loading the overview, records, care team, appointments, patient lookup, and the
clinical record, at desktop, tablet, and phone widths. The database schema was
applied against the live MySQL instance and its foreign keys confirmed present
with the correct cascade rules. The USSD gateway was exercised against the
deployed API to confirm the full path from a dialled menu through to the
database.

Several defects were found this way rather than by reading the code, including
a database migration that used syntax MySQL does not support and failed silently,
rate limiting that could not distinguish between callers behind the hosting
proxy, and an interface that listed future bookings among past visits.

---

## 10. Current limitations

This is a student project and the following are genuine constraints rather than
oversights.

It has no real users. The accounts in the system are demo accounts created to
show how it behaves. It has not been reviewed by a medical professional, has not
been through any privacy or regulatory assessment, and is not ready to hold real
patient information.

The whole system runs on free hosting tiers, which sets some hard limits.
Uploaded profile photos are written to the server's local disk and are lost when
the service restarts, so they need object storage to become durable. The API
sleeps when idle and takes roughly fifty seconds to wake. The Gemini free tier
is rate limited per minute and per day. Rate limit counters are held in memory,
so they reset on restart and would not be shared across more than one instance.

The AI assistants are useful for explanation and for structuring a doctor's
thinking, but they are language models rather than clinical decision systems.
They have not been validated against clinical outcomes, and the interface is
explicit about that in both assistants.

---

## 11. Next steps

The clearest next tasks are the known weaknesses: moving uploaded files to
object storage and rate limit state to Redis.

Beyond that, the additions that would matter most are offline support in the
website so a facility with an unreliable connection can keep working and
synchronise later, SMS reminders before an appointment using the Twilio
integration that is already configured, and an audit trail that shows a patient
exactly when their record was opened and by whom. The last of these follows
naturally from letting patients control access: knowing who may read your record
is more useful when you can also see who actually did.

The question that cannot be answered from the code is whether the access
approval step works for real people, or whether it becomes one more prompt that
gets tapped through without being read. Answering that needs the platform in
front of real patients, with the consent and clinical oversight that would
properly require.
