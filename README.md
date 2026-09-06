# Beral Care

Beral Care is a telemedicine platform where patients hold their own
medical records and decide which doctors are allowed to read them. It runs as a
website on any phone or computer, and the core services also work over USSD, so
someone with a basic handset and no internet can still register, ask for a
consultation, and check their recent visits.

Live at [beral-care.vercel.app](https://beral-care.vercel.app).
That address is the hosting name the project was first deployed under. The
application itself is Beral Care, and the address can move to a Beral Care
domain whenever one is ready.

In development since 27 April 2026. There is a fuller write up of the problem,
the architecture, and the technical decisions in [REPORT.md](REPORT.md).

## Where the idea came from

I was being treated at Kanombe Military Hospital in Rwanda, and I needed
information about my earlier treatment. The doctor who had been treating me was
in meetings and I was told she would not be available for several weeks, until
the following month. That was difficult on its own, but the part that stayed
with me was different. I was sick at that moment, and I could not get hold of my
own medical information so that I could go and seek help somewhere else. I ended
up waiting, still in pain, until she was back and could tell me what I needed to
know.

Afterwards I kept thinking about what would have happened if my condition had
been more serious, or if I had urgently needed to see a different doctor who knew
nothing about what had already happened to me.

I have also been given medical papers before and lost some of them later. Once
enough time passes it becomes hard to remember what condition you had, what
medicine you were given, what the doctor told you, or what was said during a
consultation. When I looked around, I saw relatives, siblings, cousins, and
other people close to me running into the same thing. That was the point where
it stopped feeling like a personal inconvenience and started to look like a
problem worth building something around.

## What I wanted to solve first

The first idea was much smaller than what exists now. I simply wanted people to
have one place where they could keep track of their own medical history, so that
someone could look back a few years later and still know what happened during a
consultation, what was diagnosed, what medicine was prescribed, which doctor
treated them, and what notes were written. Health information should not become
useless because a piece of paper went missing.

That original idea is still the centre of the application.

## What I decided to build

If the record belongs to the patient rather than to a building, then it can go
with them, and the question of who may read it becomes the patient's decision
rather than an assumption.

That single choice shaped most of the rest of the system:

Every patient gets a permanent health ID in the form `BC-2026-00001`, which they
can show as text or as a QR code. A doctor opens a file by typing that ID or
scanning the code, which removes the step where someone types a name and a date
of birth by hand.

Patients can search their own history by illness, medicine, or doctor, and print
it. Printing matters because this project should not assume every facility will
use the platform. If someone needs to go somewhere that has never heard of
Beral Care, they should still be able to take something useful with them.

A doctor cannot read a record just because they are a doctor. They send a
request, the patient approves or declines it, and the record stays closed until
that decision is made. The check runs on the server on every request, so it
cannot be worked around by changing the interface. A patient can see who
currently has access and withdraw it at any time. Making health information
easier to reach should not mean making it available to everybody.

Appointments came from the same experience that started the project. Being told
that the person you need is unavailable for weeks is hard when you are already
unwell, so patients can request a consultation with a chosen doctor for a
preferred day, and doctors manage those requests and follow up visits from their
side. This does not promise anyone immediate treatment. It is meant to make the
path between needing help and reaching someone clearer.

The platform is reachable three ways: the full website on a computer, the same
website on a small screen, and a USSD short code for people with no internet.
All three read and write the same records. Accessibility is not something I
wanted to mention in a readme and then quietly ignore in the design. Someone
should not lose access to their own health information because they cannot
afford a newer phone or reliable mobile data.

Two assistants came later, once the record itself worked. They answer a question
that only appears after the first problem is solved: what happens when someone
can finally reach their information but does not understand it. HealthGuide
explains a diagnosis or a medicine to a patient in plain language and sends
anything serious back to their doctor. MedAssist helps a doctor during a
consultation with possible diagnoses, drug interactions, dosing, and treatment
guidance. Both work from the real record, and MedAssist only receives a
patient's history after the server has confirmed that patient approved that
doctor, so the AI cannot become a way around consent.

## Who it is for

Patients who want their history in one place and control over who sees it, and
doctors who need that background quickly. Administrators keep accounts in order
but, by design, cannot read anyone's medical information.

The people I think about most are those with fewer options. Someone with more
money can often go to another hospital, see a specialist, or travel to a
different provider when one door is closed. Someone with fewer resources may
have no alternative at all, which is when losing access to your own information
hurts most.

The idea came out of my own experience in Rwanda, and I am interested in whether
it is useful more widely across Africa, particularly where distance, cost,
connectivity, or the availability of specialists make care harder to reach. I
want to be careful here though. Health systems differ enormously from one
country to another, and I am not claiming to know how they all work. My
experience and what I have seen around me are what motivated this. Anything
broader than that would need proper research with patients and health workers,
which I have not done.

## How it is built

| Part | Technology | Location |
|---|---|---|
| Website | React, Vite, React Router, plain CSS | `web/` |
| API | Node, Express, MySQL | `backend/` |
| USSD gateway | Python, Flask, Redis | `ussd-gateway/` |

The website is the only client. It is responsive from small phones up to
widescreen and can be installed to a phone's home screen, so a smartphone user
does not need anything from an app store.

There is no UI framework. The design system is a set of CSS custom properties in
`web/src/styles/tokens.css` covering colour, type scale, spacing, and elevation,
and no component file contains a raw colour value. The application shell
provides three navigation layouts, a full sidebar, a collapsed icon rail, and a
bottom tab bar, switched by CSS media query rather than JavaScript.

The API uses JWT authentication with a 24 hour expiry, bcrypt password hashing,
rate limiting on the authentication and AI routes, and a CORS allow list. Role
checks run in middleware on every protected route. Patient IDs are generated
inside a database transaction so that two people registering at the same moment
cannot receive the same ID.

### Decisions worth explaining

**Why a web app rather than a native app.** An earlier version of this project
was built with React Native and Expo, which produced a single codebase for
Android, iOS, and the browser. In practice the browser was where people actually
used it, and rendering React Native into a browser limited what the web
experience could be: no CSS grid, no media queries, no real hover or focus
states, and every element rendered as a generic `div`, which made the site hard
to use with a screen reader. Rebuilding it as a normal web application fixed all
of that. The cost is that there are no app store builds. Since the site works
well in a phone browser and USSD covers people without smartphones, that felt
like the right trade.

**Why the AI provider is swappable.** `backend/utils/ai/` holds one adapter per
provider behind a shared interface, and the routes call `ask()` without knowing
which model answers. This started as a practical problem rather than an
architectural preference: the project was using a paid API that ran out of
credit, and the assistants stopped working. Being able to change provider with an
environment variable instead of a code change means that cannot take the feature
down again. It currently runs on Google Gemini through AI Studio, whose free tier
covers this workload.

**Why USSD talks to the same API.** It would have been simpler to give the USSD
gateway its own small database. Doing that would have created two versions of
the truth and made the people on basic phones second class users of their own
records, which is the opposite of the point.

## How it was built, month by month

The commit history follows this, and each stage below is a real step the
project went through rather than a plan written afterwards.

**April 2026.** Project setup. The Expo application shell and navigation, the
Express API, the MySQL schema, registration and login with JWT sessions,
role based access control, the first patient, doctor, and administrator
screens, and the USSD gateway for basic phones.

**May 2026.** Consultations and access. Doctors recording diagnoses and
prescriptions, patients approving or refusing access to their records,
appointment booking, the administrator tools for accounts and statistics,
profile management, and French alongside English.

**June 2026.** Identification. QR codes for patients and doctors so a file
opens by scanning instead of typing, doctor IDs issued automatically, profile
photo uploads, and the first automated tests. Prototype files left over from
the early web attempt were removed.

**July 2026.** The two assistants, HealthGuide for patients and MedAssist for
doctors, and a full pass over the documentation so someone new could
understand the project and run it.

**August 2026.** Away from the project. Exams and other coursework.

**September 2026.** Deployment and rebuild. The platform went live on Render,
Vercel, and Railway. The interface was rebuilt as a web application, the AI
layer was made swappable and moved to the free Gemini tier, the wording was
rewritten in plainer English, reporting and moderation were added, connecting
was separated from access to health records, and the project was renamed to
Beral Care.

## Current state

This is a student project, and I want to be accurate about where it stands.

It is deployed and working end to end, but it has no real patients or clinics
using it. The accounts in it are demo accounts I created to show how the system
behaves. It has not been reviewed by a medical professional, it has not been
through any privacy or regulatory assessment, and it is not ready to hold real
patient information.

It also runs entirely on free hosting tiers, which has practical limits:

Uploaded profile photos are written to the server's local disk, so they are lost
whenever the service restarts. Making that durable needs object storage such as
S3, or a paid persistent disk.

The API sleeps when idle, so the first request after a quiet period takes about
fifty seconds to wake up.

The Gemini free tier is rate limited per minute and per day, so under load the
assistants will report that they are busy.

Rate limit counters are kept in memory, so they reset when the service restarts
and would not be shared if it ever ran on more than one instance.

SMS and email notifications are not switched on yet, although the Twilio and
SendGrid integrations are prepared. There is no audit trail yet showing a
patient who opened their record and when, and there is no offline mode.

The security measures already in place, hashed passwords, expiring sessions,
rate limited logins, server side role checks, and patient approved access, are
deliberate steps towards handling sensitive information responsibly. They are
not a claim that the application is secure enough for real patients. Working
with real medical information would need a proper security review, compliance
work, clinical governance, and professional oversight that this project has not
had.

### Demo accounts

Both use the password `DemoPass123!`.

| Role | Email |
|---|---|
| Patient | `demo.patient@beralcare.test` |
| Doctor | `demo.doctor@beralcare.test` |

The patient has two written up consultations and two upcoming visits, and has
approved the doctor's access, so both sides show real content.

## Where it could go

I would rather let the remaining problems decide this than list technologies I
would like to try.

An audit trail is the one I care about most, because it follows directly from
the rest. Letting a patient choose who can read their record is more meaningful
when they can also see who actually opened it and when. Reliable file storage
would stop uploads disappearing on restart, and SMS notifications would make the
platform useful to people who are not online all day. More work on the USSD side
would widen access from basic phones further.

Everything after that is less about code. Security testing and stronger privacy
protection would be necessary before any real medical information went near
this. Health professionals would need to judge whether the clinical features and
the two assistants are actually useful and safe. Real users would need to try it
and tell me whether it makes sense to them, including whether the access
approval step genuinely works or just becomes another prompt people tap through
without reading. Research with patients and health workers would show whether
the assumptions behind the project match what people actually experience.

I have not solved healthcare. What I have is an early answer to a problem I ran
into myself, and a much clearer view of what would need to happen before
something like this could responsibly serve real people.

## Running it locally

The API needs a MySQL database.

```bash
cd backend && npm install && npm start
curl "http://localhost:3000/setup-db?key=$DB_SETUP_KEY"   # creates the tables, run once

cd web && npm install && npm run dev                       # http://localhost:5173
```

The dev server proxies `/api` to `localhost:3000`, so local work needs no CORS
setup. Backend tests run with `cd backend && npm test`.

### Environment

`backend/.env`

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173

DB_HOST=        DB_PORT=3306
DB_USER=        DB_PASSWORD=
DB_NAME=        DB_SEED_SAMPLE_DATA=false

JWT_TOKEN=              # long random string
DB_SETUP_KEY=           # protects /setup-db

AI_PROVIDER=gemini
GEMINI_API_KEY=         # free key from aistudio.google.com/apikey

TWILIO_ACCOUNT_SID=     TWILIO_AUTH_TOKEN=     TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=       SENDGRID_FROM_EMAIL=
```

`web/.env.local` needs `VITE_API_URL=http://localhost:3000`.

`ussd-gateway/.env` needs `API_BASE_URL`, `REDIS_URL`, and
`DEFAULT_COUNTRY_CODE`.

## Deployment

| Part | Host |
|---|---|
| API | Render, built from `backend/`, redeploys on push to `main` |
| Website | Vercel, `npx vercel deploy --prod --cwd web` |
| USSD gateway | Vercel, `npx vercel deploy --prod --cwd ussd-gateway` |
| Database | Railway MySQL, reached over its public TCP proxy |
| USSD sessions | Upstash Redis |

Both Vercel projects deploy from the command line rather than from GitHub. When
a Vercel project is linked to this repository its root directory defaults to the
repository root, which deploys the wrong folder and replaces the working site.
If you reconnect them, set the root directory first.

Changing an environment variable on Render does not redeploy the service. Update
the value, then trigger a deploy for it to take effect. `GET /api/ai/status`
reports which AI provider is currently active.

Point your USSD aggregator at `POST /ussd` on the deployed gateway.

## Language

The interface is available in English and French, since French is an official
language across much of West and Central Africa. Missing French strings fall
back to English rather than showing a raw key.

---

Built by Adossi Fred William, software engineer and machine learning engineer at
African Leadership University, Rwanda.
