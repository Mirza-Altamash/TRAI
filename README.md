# TRAI Complaint & Workflow Management Portal

An internal ticketing, assignment, escalation, and SLA tracking system built for the Telecom Regulatory Authority of India (TRAI). The application features dynamic split-panel interfaces for User, L2 (Developer/Network), L3 (SRO/Advisor), and Admin roles with full action audit trails.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18, TypeScript
- **Routing**: TanStack Start / React Router
- **State Management**: TanStack Query (React Query)
- **Styling**: Vanilla CSS + TailwindCSS (for utility layouts)
- **Analytics & Graphs**: Recharts
- **Exports**: jsPDF, XLSX (SheetJS), AutoTable

### Backend
- **Runtime & Language**: Node.js, Express, TypeScript
- **Database**: MongoDB (via Mongoose ODM)
- **Real-Time Communication**: Socket.IO
- **Security**: JWT (Access Tokens + 7-Day Expires Refresh Tokens), bcryptjs
- **Scheduling**: Node-Cron (15-day inactivity closure checking)

---

## 🛠️ Key Features
1. **Per-Tab Auth Isolation**: Uses tab-scoped `sessionStorage` rather than a shared `localStorage` state, enabling admins to open multiple browser tabs logged in as different users simultaneously.
2. **Tab Re-Validation**: Intercepts window focus triggers to validate credentials against the server (`GET /auth/me`), instantly routing expired or changed tokens to the login screen.
3. **Role Integration**: Seamlessly maps L3 roles into the administrative portal, embedding access to assigned ticket boards and dynamic reports.
4. **SLA Tracking**: Monitors ticket durations and automatically transitions open/resolved tickets to closed status after 15 days of user inactivity.
5. **Interactive Charts**: Interactive analytical dashboards showing labeled category totals, status ratios, and volume metrics.
6. **CSV/Excel/PDF Exporting**: Direct download utilities for ticket histories, SLA metrics, and full complete audit trails.

---

## 📂 Project Structure

```text
TRAI Citizen Hub/
├── src/                          # Frontend React Source
│   ├── components/               # Layout, UI components, and Table cards
│   ├── hooks/                    # Theme, Layout hooks
│   ├── lib/                      # Auth, API client, and exporter configurations
│   ├── routes/                   # Routing endpoints (TanStack Start)
│   ├── services/                 # Frontend API services (employee, ticket, trail)
│   └── types/                    # Common TypeScript type definitions
├── trai-backend/                 # MERN API Backend Source
│   ├── src/
│   │   ├── config/               # DB and Socket configurations
│   │   ├── controllers/          # Express route controllers (Auth, Ticket, Employee)
│   │   ├── jobs/                 # Auto-close cron runner
│   │   ├── middleware/           # Authenticated token filter and role validators
│   │   ├── models/               # Mongoose DB models (Ticket, Employee, TrailLog)
│   │   └── routes/               # Express routing tables
│   ├── tsconfig.json             # Backend TypeScript rules
│   └── package.json
├── docker-compose.yml            # Production deployment config
└── Dockerfile                    # Containerization instructions
```

---

## 💻 Local Setup & Running Instructions

### Prerequisites
- Node.js (v18 or above)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Step 1: Install Dependencies
Install packages in both frontend and backend workspace folders:
```bash
# Frontend root
npm install

# Backend root
cd trai-backend
npm install
```

### Step 2: Seed the Database
Populate MongoDB with default accounts, departments, and sample tickets:
```bash
cd trai-backend
npm run seed
```

### Step 3: Start the Backend Dev Server
```bash
cd trai-backend
npm run dev
```
The API server will listen on **`http://localhost:5000`**.

### Step 4: Start the Frontend Dev Server
Run this from the project root folder:
```bash
npm run dev
```
The application will launch on **`http://localhost:3000`**.

---

## 🐳 Docker Deployment (Production)

You can spin up the entire production bundle (MongoDB + Express Backend + React SSR Frontend) using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: accessible at `http://localhost:3000`
- **Backend API**: accessible at `http://localhost:5000`

---

## 🔑 Seeding Credentials
All accounts are configured with the password **`Password123`**:

| Role | Employee ID | Name | Email |
| :--- | :--- | :--- | :--- |
| **USER** (Creator) | `TRAI-USR-001` | Mirza Ahmed | `mirza.ahmed@trai.gov.in` |
| **L2** (Developer) | `TRAI-L2-001` | Sandeep Rao | `sandeep.rao@trai.gov.in` |
| **L3** (SRO / Admin eq.) | `TRAI-L3-001` | Neha Gupta | `neha.gupta@trai.gov.in` |
| **ADMIN** | `TRAI-ADM-001` | Anil Sharma | `anil.sharma@trai.gov.in` |
