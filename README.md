# Medfinity 🏥✨

**AI-Powered Integrated Healthcare Ecosystem**

Medfinity is a comprehensive healthcare management platform that connects **Patients, Doctors, and Pharmacists** through a unified digital ecosystem. The platform leverages Google Gemini AI to improve healthcare accessibility, streamline medical services, and enhance patient engagement.

**Live app:** [medfinity.vercel.app](https://medfinity.vercel.app)

---

## 🚀 Features

### 🌐 Landing Page & Multi-Role Authentication

* Marketing landing page with dedicated sections for patients, doctors, and pharmacies
* Patient, Doctor, and Pharmacist registration & login
* Pharmacy registration with map-based location pinning (Leaflet / OpenStreetMap)
* JWT-based authentication with automatic token refresh
* Role-based dashboards and access control
* Global topbar search across doctors and specialties

### 📅 Appointment Management

* Search and discover doctors by specialty, rating, and experience
* Doctor-defined weekly availability slots
* Book, cancel, and track appointment status
* Separate views for patient- and doctor-side appointment history
* Dashboard stats (today's appointments, upcoming appointments, total patients, total consultations)

### 🎥 Video Consultations

* In-browser video consultations via Jitsi
* Optional JaaS (Jitsi as a Service / 8x8.vc) integration for signed, moderator-aware rooms — automatically falls back to public `meet.jit.si` rooms when JaaS isn't configured
* In-consultation text chat with file attachments
* Consultation start/end tracking and duration logging

### 💊 Prescription Management

* Digital prescription creation by doctors, tied to appointments
* Multi-medicine prescriptions with dosage, frequency, duration, and timing instructions
* Prescription history for patients and doctors
* Prescription OCR: extract structured medicine data from photographed/scanned prescriptions

### 📂 Health Records Management

* Upload and categorize medical records (lab reports, scans, discharge summaries, etc.)
* Doctor-scoped record sharing — a doctor can only view a patient's records when there's an existing appointment between them
* Vital signs tracking: blood pressure, heart rate, temperature, weight, height, blood sugar, oxygen saturation
* Latest-vitals summary view

### 🏪 Pharmacy Management

* Pharmacy dashboard with incoming order queue
* Medicine inventory management (stock, pricing, prescription-required flag)
* Patient-side medicine ordering flow, linked to an active prescription
* Nearest-pharmacy discovery using Haversine-distance ranking from the patient's live location
* Pickup or delivery order types, with order status tracking and patient-side cancellation

### ⏰ Medication Reminders & Notifications

* Custom medicine reminders (dosage, time, frequency, start/end date)
* In-app notification center with read/unread tracking
* Notifications tied to appointments, prescriptions, and orders

### 🤖 AI-Powered Healthcare Assistance (Google Gemini)

* **AI Symptom Checker** — structured, schema-based condition likelihoods, recommended specialty, and emergency flag
* **AI Doctor Recommendation & Ranking** — ranks real, currently-available doctors from the database against a patient's symptoms (specialty match, experience, rating)
* **AI Health Chat Assistant** — general-purpose conversational health assistant with safety-first system prompting (always recommends professional care, never diagnoses or prescribes)
* **AI Medical Report Summarizer** — summarizes report text or photographed reports into key findings and recommendations
* **Prescription OCR** — Gemini-powered handwriting/text extraction from prescription images
* Graceful degradation: every AI feature falls back to a safe, clearly-labeled canned response if the Gemini API is unavailable, rate-limited, or unconfigured, instead of failing the request

---

## 🏗️ System Architecture

```text
Frontend (HTML5 / CSS3 / Vanilla JS)
     │  fetch + JWT
     ▼
Django REST Framework API
     │
     ├── apps.users            (auth, profiles, doctor/pharmacist directories)
     ├── apps.appointments      (booking, slots, scheduling)
     ├── apps.consultations     (video rooms via Jitsi / JaaS, chat)
     ├── apps.prescriptions     (digital prescriptions, OCR)
     ├── apps.health_records    (records, vitals)
     ├── apps.pharmacy          (inventory, orders)
     ├── apps.notifications     (alerts, medicine reminders)
     └── apps.ai_services       (Gemini-powered features)
     │
     ▼
PostgreSQL (production) / SQLite (local dev)
     │
     ▼
Cloudinary (media/file storage)
```

---

## 🛠️ Technology Stack

### Frontend
* HTML5, CSS3, vanilla JavaScript (no framework — a lightweight `api.js` client wraps all backend calls)
* Leaflet / OpenStreetMap for pharmacy geolocation

### Backend
* Python, Django, Django REST Framework

### Database
* PostgreSQL in production, SQLite for local development

### Authentication
* JWT via `djangorestframework-simplejwt`, with automatic refresh-token retry on 401s

### AI Services
* Google Gemini API (`google-genai` SDK) — chat, structured JSON generation, and multimodal image analysis

### Video
* Jitsi Meet, with optional JaaS (8x8.vc) for signed moderator JWTs

### Cloud Storage
* Cloudinary (profile pictures, health record files, prescription scans, chat attachments)

### Deployment
* Vercel (Django served through a WSGI entrypoint at `api/index.py`; static frontend served alongside it)

### Development Tools
* Git, GitHub, VS Code

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/medfinity.git
cd medfinity
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

**Windows**
```bash
venv\Scripts\activate
```

**Linux / macOS**
```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file inside `backend/`:

```env
SECRET_KEY=your_django_secret_key
DEBUG=True

# Database (omit both blocks below to fall back to local SQLite)
DATABASE_URL=postgres://user:password@host:5432/dbname
# — or —
DB_NAME=medfinity
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional — enables signed/moderator video rooms via JaaS instead of
# public meet.jit.si rooms. Leave unset to use the public fallback.
JAAS_APP_ID=your_jaas_app_id
JAAS_API_KEY_ID=your_jaas_key_id
```

### 6. Apply Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 7. Run the Development Server

```bash
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000/
```

Open `frontend/pages/login.html` in a browser (or serve the `frontend/` folder with any static file server) to use the UI locally.

---

## ☁️ Deployment (Vercel)

Medfinity deploys as a single Vercel project:

* `api/index.py` boots Django as a WSGI app and runs migrations on cold start
* `vercel.json` routes `/api/*` and `/admin/*` to the Django backend, and everything else to the static `frontend/` folder
* A `requirements.txt` at the **project root** (not just `backend/`) is required for Vercel's Python builder to install dependencies
* All secrets (`SECRET_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, Cloudinary keys, JaaS keys) must be set in the Vercel project's **Environment Variables** — `.env` files are git-ignored and never reach the deployment

---

## 🔒 Security Features

* JWT authentication with access/refresh token rotation
* Secure password hashing via Django's built-in auth
* Role-based access control (patient / doctor / pharmacist)
* Object-level authorization on sensitive endpoints — e.g. doctors can only view a patient's health records if an appointment exists between them; patients can only act on their own prescriptions and orders
* Cloud-based file storage for uploaded documents and images

---

## 📈 Future Enhancements

* Caregiver role support (present in the data model, not yet exposed in the UI)
* Electronic Health Records (EHR) interoperability
* Wearable device integration
* AI disease prediction from longitudinal vitals
* Voice-based AI assistant
* Online payments for consultations and pharmacy orders
* Emergency healthcare module
* Hospital management integration

---

## 👥 Team Zyphix

**Team Members**
* Jerisha M
* Athish K R
* Reeshitha A

**Hackathon Submission**
* **Project Name:** Medfinity
* **Team Name:** Zyphix
---

### "Transforming Healthcare Through AI and Innovation."
