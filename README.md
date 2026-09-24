# LifeBridge AI

### Bridging Lives To Care
**AI-Powered Emergency Healthcare Intelligence & Real-Time Hospital Dispatch**

> **Notice:** LifeBridge AI is a healthcare decision-support prototype using simulated hospital resource data. It does not provide medical diagnosis or replace emergency medical professionals. Hospital availability shown in this prototype is simulated and should not be treated as real-time hospital availability.

---

## 1. Problem Overview

During critical emergencies, patients and ambulance crews lose invaluable golden-hour minutes repeatedly calling regional hospitals to locate available ICU beds, mechanical ventilators, crossmatched blood groups, and on-duty trauma surgeons.

**LifeBridge AI** solves this by converting natural language emergency symptoms into clinical resource requirements, calculating dynamic multi-criteria suitability scores across connected regional hospitals, and automatically reserving life-support resources upon hospital acceptance in real time via WebSockets.

---

## 2. End-to-End Workflow

```text
Patient / Ambulance
       ↓
Emergency Information Entered
       ↓
AI Analyzes Emergency (Category, Severity, Priority: CRITICAL/HIGH/MODERATE/LOW)
       ↓
Required Medical Resources Identified (ICU, Ventilator, Blood, Trauma Surgeon)
       ↓
Current Hospital Resources Checked (Simulated Real-Time Sync)
       ↓
AI Calculates Hospital Suitability (Resource Match 35%, Cap 20%, ETA 20%, ICU 10%)
       ↓
Nearby Hospitals Ranked & Displayed with Leaflet OpenStreetMap
       ↓
User Selects Hospital
       ↓
Hospital Receives Emergency Request Instantly via WebSockets
       ↓
Hospital Accepts & Prepares Resources
       ↓
Resources Temporarily Reserved (ICU: 4 → 3, Ventilator: 2 → 1)
       ↓
Patient / Ambulance Receives Live Confirmation with ETA Countdown
       ↓
Hospital, Ambulance, and Admin Dashboards Sync Without Refreshing
```

---

## 3. Technology Stack

* **Frontend**: React 18 + Vite
* **Styling**: Tailwind CSS (Healthcare & Teal theme)
* **Icons**: Lucide React
* **Maps**: Leaflet + OpenStreetMap (No paid Google Maps API required)
* **Voice Input**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with live transcription
* **Text-to-Speech**: Web SpeechSynthesis engine for audible AI clinical assessment briefing
* **Audio Alerts**: Web Audio API (medical alert sirens & positive triage chimes)
* **Backend**: Python FastAPI + Uvicorn
* **Database**: SQLite (SQLAlchemy ORM)
* **AI / ML / NLP**: Clinical Named Entity Recognition (NER) & Parser, Scikit-learn (TF-IDF & Multinomial Naive Bayes), Multi-Criteria Decision Analysis (MCDA)
* **Real-time Protocol**: Native WebSockets (`ws://localhost:8000/ws`)

* **Simulation Engine**: Async background task realistically updating bed, ICU, ventilator counts, and department loads every 12–15 seconds

---

## 4. Project Structure

```text
LifeBridge AI/
│
├── backend/
│   ├── main.py                     # FastAPI application, REST endpoints & WebSocket /ws
│   ├── database.py                 # SQLite engine & session dependency
│   ├── models.py                   # SQLAlchemy tables: Hospital, Specialist, BloodStock, EmergencyRequest, etc.
│   ├── schemas.py                  # Pydantic schemas for requests, responses & analytics
│   ├── seed_data.py                # Database seeder (10 hospitals, 250+ history records, blood banks)
│   ├── ai_engine.py                # Clinical NLP triage & resource extraction engine
│   ├── recommendation_engine.py    # Weighted suitability scoring & transparent explainability
│   ├── simulation_engine.py        # Background random-walk resource simulation loop
│   ├── websocket_manager.py        # Real-time WebSocket connection manager & broadcaster
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Live sync indicator, sound toggle, tab router, demo trigger
│   │   │   ├── AIAnalysisCard.jsx  # Clinical assessment, priority badge, resource checklist
│   │   │   ├── HospitalCard.jsx    # Hospital recommendation card with score breakdown & why matches
│   │   │   ├── HospitalMap.jsx     # Leaflet OpenStreetMap with custom patient/hospital pins & route
│   │   │   ├── HospitalDetailModal.jsx # Detailed modal with live SVG resource trend chart
│   │   │   └── DemoModal.jsx       # 10-step automated hackathon walkthrough controller
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Hero page, 1-click demo, live preview of 10 hospitals
│   │   │   ├── EmergencyPage.jsx   # Patient intake, natural language symptoms, AI analysis, routing
│   │   │   ├── PatientTrackerPage.jsx # 8-stage progress tracker, ETA countdown, reserved resources
│   │   │   ├── HospitalDashboardPage.jsx # Hospital login, live requests, Accept & Prepare workflow
│   │   │   ├── AdminDashboardPage.jsx # Live capacity table with inline resource override
│   │   │   ├── SimulatorPage.jsx   # What-If scenario simulator with capacity & traffic sliders
│   │   │   └── AnalyticsPage.jsx   # Shortage threshold alerts (ICU < 20%, Load > 80%), demand charts
│   │   ├── services/
│   │   │   └── api.js              # Fetch client for all backend REST endpoints
│   │   ├── hooks/
│   │   │   └── useWebSocket.js     # React hook with auto-reconnection and secondsAgo ticker
│   │   ├── utils/
│   │   │   └── audio.js            # Web Audio API sound effect generator
│   │   ├── App.jsx                 # Main application root
│   │   ├── main.jsx                # React DOM entrypoint
│   │   └── index.css               # Tailwind CSS & Leaflet map styling
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── data/
│   └── lifebridge.db               # SQLite database file
│
└── README.md
```

---

## 5. Quick Start Instructions (Windows)

### Prerequisites
* Python 3.11+ (installed)
* Node.js v18+ & npm (installed)

### Step 1: Start Backend Server

Open a terminal in the project directory:

```powershell
cd backend
py -3.11 -m pip install -r requirements.txt
py -3.11 -m uvicorn main:app --reload --port 8000
```

*(On first run, `seed_data.py` executes automatically to create `data/lifebridge.db` and populate 10 hospitals with clinical specialists, blood stocks, and history).*

Backend will be available at:
* **API Root**: [http://localhost:8000](http://localhost:8000)
* **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **WebSocket**: `ws://localhost:8000/ws`

---

### Step 2: Start Frontend Application

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend will be available at:
* **Web App URL**: [http://localhost:5173](http://localhost:5173)

---

## 6. Demo & Test Scenario (Section 35 Verification)

To test the exact hackathon scenario:

1. Click **🚨 Find Emergency Care** (or **🎬 Start Demo** for the automated 60-90s tour).
2. Enter or select the test scenario:
   * **Patient**: Arun Kumar
   * **Age**: 42
   * **Location**: Central Hub / Connaught Place (Demo Location)
   * **Emergency Description**: `Road accident with severe bleeding and difficulty breathing.`
3. Click **Analyze Emergency**:
   * AI Engine detects **Trauma / Road Accident**
   * Priority marked: **🔴 CRITICAL (Severity 95/100)**
   * Resources required: **ICU, Ventilator, Blood (O+), Trauma Surgeon, Trauma Care**
   * Clinical rationale displayed for ICU and Ventilator.
4. Review ranked hospitals on the Leaflet map and suitability score cards.
5. Click **Request Support** on the top recommended hospital (e.g. *Metro Life Super Specialty Hospital* or *Apollo Care Hospital*).
6. Patient is navigated to the **Live Patient Tracking Page** showing Case ID `LB-1042`.
7. In another tab or clicking **🏥 Hospital Login**:
   * **Username**: `admin`
   * **Password**: `admin123`
   * View the incoming critical dispatch alert.
   * Click **Accept & Prepare**.
8. Notice that **1 ICU Bed**, **1 Ventilator**, and **1 Emergency Bed** are immediately deducted/reserved.
9. Without refreshing, the Patient tracking page displays:
   * `🟢 Hospital Accepted & Preparing Resources`
   * Reserved resources badge (ICU Bed Confirmed #1, Ventilator Reserved #1)
   * Live ETA countdown (~8-9 mins).
10. Open **⚙️ Admin Dashboard** or **📊 Analytics** to see network loads and shortage alerts updating live via WebSockets.

---

## 7. Key System Modules

* **AI Emergency Engine (`backend/ai_engine.py`)**: Uses multi-modal clinical pattern matching and scikit-learn NLP classification to assess acuity without diagnosing.
* **Recommendation Engine (`backend/recommendation_engine.py`)**: Multi-criteria weighted ranking:
  * Resource Match (35%)
  * Emergency Department Capability (20%)
  * Travel Time & Haversine Distance (20%)
  * ICU Availability (10%)
  * Specialist Match (10%)
  * Current Department Load (5%)
* **Background Simulation (`backend/simulation_engine.py`)**: Realistic fluctuations of bed, ventilator, and blood counts every 12 seconds with WebSocket broadcasting.
* **What-If Emergency Scenario Simulator (`frontend/src/pages/SimulatorPage.jsx`)**: Interactive sandbox to stress-test capacity shortages, traffic congestion, and re-weighting policies.
