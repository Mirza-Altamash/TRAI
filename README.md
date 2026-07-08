<div align="center">

# 🏛️ TRAI Citizen Hub

### Complaint & Workflow Management Portal

A full-stack, enterprise-grade internal complaint and ticket workflow management system designed for structured multi-level issue handling, real-time collaboration, auditability, and role-based operations.

**React • TypeScript • Node.js • Express • MongoDB • Socket.IO**

---

`Enterprise Workflow` • `Role-Based Access` • `Real-Time Updates` • `Audit Logging` • `Analytics & Reports` • `Responsive UI`

</div>

---

## 📌 Overview

**TRAI Citizen Hub** is a full-stack Complaint & Workflow Management Portal built to manage structured ticket creation, assignment, escalation, resolution, reopening, and closure across multiple organizational levels.

The platform provides dedicated portals for:

* **Admin**
* **User**
* **L2 Members**
* **L3 Members**

The system focuses on:

* Structured ticket lifecycle management
* Role-based workflow control
* Multi-level assignment and escalation
* Complete ticket trail history
* Centralized audit logging
* Real-time ticket updates
* Attachment management
* Analytics and MIS reporting
* Responsive enterprise-grade UI/UX

The interface follows a clean, professional, government-style design approach suitable for internal organizational workflow management.

---

## ✨ Key Features

### 🎫 Complete Ticket Lifecycle

The portal supports a structured ticket workflow:

**Open → Resolved → Closed**

Tickets can move through multiple organizational levels while maintaining a permanent activity trail.

Supported actions include:

* Ticket creation
* Assignment
* Reassignment
* Comments
* Multiple attachments
* Resolution
* Reopening
* Closure
* Complete trail tracking

---

## 👥 Multi-Portal Architecture

### 🛡️ Admin Portal

The Admin Portal provides centralized management and monitoring capabilities.

Key features include:

* Dashboard overview
* User Management
* Active and Inactive user management
* User creation and editing
* Ticket monitoring
* Analytics
* MIS Reports
* Report & Export functionality
* Audit Logs
* Search and filtering
* Excel and PDF export
* SLA and workflow monitoring

---

### 👤 User Portal

The User Portal allows users to raise and monitor their own tickets.

Features include:

* Raise Ticket
* Add detailed descriptions
* Upload multiple attachments
* View My Tickets
* Search tickets
* Filter by status
* Download ticket reports
* Track complete ticket history
* Add comments
* Reopen resolved tickets
* Close resolved tickets

---

### ⚙️ L2 Portal

The L2 Portal is designed for operational and technical resolution teams.

L2 categories include:

* Developer
* Infra
* Network

Features include:

* Assigned Tickets
* Personal ticket queue
* Ticket comments
* Multiple attachments
* Ticket reassignment
* Complete trail visibility
* Real-time ticket updates
* Raise Ticket
* Track personally raised tickets

---

### 🏢 L3 Portal

The L3 Portal combines advanced workflow handling with administrative visibility.

Supported L3 subroles include:

* SRO
* J.Adv
* D.Adv
* Adv
* TO
* SO
* Assistant

Features include:

* Advanced ticket management
* Assignment monitoring
* Personal assigned ticket queue
* Raise Ticket
* Track personally raised tickets
* Resolve tickets
* Reassign tickets
* Comment and attachment support
* Reopen and close personally raised tickets
* Analytics and administrative capabilities
* Real-time workflow monitoring

Each L3 member receives data based on their authenticated identity and assigned workflow responsibilities.

---

## 🧭 Ticket Trail System

Every important action performed on a ticket is recorded in a permanent trail.

The Ticket Trail contains:

| Field            | Description                   |
| ---------------- | ----------------------------- |
| Date & Time      | Exact action timestamp        |
| Action By & Role | User who performed the action |
| Action           | Ticket activity performed     |
| Comment          | Detailed action comment       |
| Status           | Open, Resolved, or Closed     |
| Attachments      | Related uploaded files        |

The trail supports:

* Long comments
* Multi-line content
* Multiple attachments
* Attachment viewing
* Attachment downloading
* Responsive tabular layout
* Complete workflow transparency

---

## 📎 Multiple Attachment Support

The portal supports multiple file attachments throughout the workflow.

Attachments can be added during:

* Ticket creation
* Comments
* Reassignment
* Resolution
* Reopening
* Closure

Authorized workflow participants can:

* Upload multiple files
* View attachments
* Download attachments
* Access files linked to specific trail entries

---

## 📜 Audit Logging

The platform includes centralized audit logging for administrative monitoring.

Audit logs support:

* Universal search
* Partial name search
* Partial User ID search
* Date search
* Role filter
* Action Type filter
* Month-wise log management

Example searches:

```text
Neha
Gupta
001
L3
30-06-2026
```

This allows administrators to locate activities without entering complete identifiers.

---

## 👥 User Management

The User Management module supports:

* User creation
* User editing
* Active users
* Inactive users
* Role management
* Subrole management
* Designation management

Supported roles:

```text
ADMIN
USER
L2
L3
```

For L3 users, supported subroles include:

```text
SRO
J.Adv
D.Adv
Adv
TO
SO
Assistant
```

The **Designation** field remains independent and supports custom text input.

Inactive users can be managed separately, while active and inactive status changes automatically update the relevant user section.

---

## 📊 Analytics, Reports & MIS

The portal provides analytical visibility into ticket activity.

Capabilities include:

* Ticket status analysis
* Ticket division analysis
* Total ticket counts
* Category-based analysis
* Status-based breakdown
* MIS Reports
* Filtered ticket reports
* Excel export
* PDF export

Reports can be generated based on selected filters and visible ticket data.

---

## ⚡ Real-Time Updates

The portal uses **Socket.IO** for live ticket updates.

Real-time functionality supports:

* Ticket creation updates
* Assignment updates
* Reassignment updates
* Comment updates
* Resolution updates
* Reopen updates
* Closure updates

Users can see relevant workflow changes without manually refreshing the application.

---

## 📱 Responsive UI/UX

The complete application is designed to work across:

* Mobile phones
* Tablets
* Laptops
* Desktop computers
* Large monitors

Responsive behavior includes:

* Collapsible navigation
* Mobile-friendly layouts
* Responsive dashboard cards
* Scrollable tables
* Adaptive forms
* Responsive modals
* Long text wrapping
* Professional status badges
* Touch-friendly controls

The design follows a clean and professional enterprise-style visual system suitable for large organizational workflows.

---

# 🛠️ Tech Stack

## Frontend

| Technology       | Purpose                           |
| ---------------- | --------------------------------- |
| React            | User interface                    |
| TypeScript       | Type-safe development             |
| Vite             | Build tool and development server |
| React Router     | Application routing               |
| Axios            | API communication                 |
| React Query      | Server state management           |
| Recharts         | Analytics visualization           |
| Socket.IO Client | Real-time communication           |

---

## Backend

| Technology | Purpose                 |
| ---------- | ----------------------- |
| Node.js    | Runtime environment     |
| Express.js | REST API framework      |
| TypeScript | Type-safe backend       |
| MongoDB    | Primary database        |
| Mongoose   | MongoDB object modeling |
| Socket.IO  | Real-time communication |
| JWT        | Authentication          |
| Bcrypt     | Password hashing        |
| Multer     | File uploads            |
| Zod        | Data validation         |

---

## Reporting & Export

| Technology | Purpose              |
| ---------- | -------------------- |
| jsPDF      | PDF generation       |
| AutoTable  | PDF table generation |
| XLSX       | Excel export         |

---

# 📁 Project Structure

```text
TRAI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   │
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── deployment/
│   ├── install.bat
│   ├── start.bat
│   ├── stop.bat
│   ├── restart.bat
│   └── deploymentguide.md
│
├── .gitignore
├── package.json
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Ensure the following are installed:

* Node.js
* npm
* MongoDB
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
cd TRAI
```

---

## 2️⃣ Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd ../backend
npm install
```

Alternatively, from the project root:

```bash
npm run install:all
```

---

# 🔐 Environment Configuration

## Backend Environment

Create:

```text
backend/.env
```

Use `backend/.env.example` as reference.

Example:

```env
PORT=5002
HOST=0.0.0.0
NODE_ENV=production

MONGODB_URI=mongodb://127.0.0.1:27017/trai_citizen_hub

CLIENT_URL=http://YOUR_SERVER_IP:8085
CORS_ORIGIN=http://YOUR_SERVER_IP:8085

JWT_ACCESS_SECRET=YOUR_SECURE_ACCESS_SECRET
JWT_REFRESH_SECRET=YOUR_SECURE_REFRESH_SECRET
```

> Never commit `.env` files or expose production secrets.

---

## Frontend Environment

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://YOUR_SERVER_IP:5002/api
VITE_SOCKET_URL=http://YOUR_SERVER_IP:5002
```

---

# 💻 Local Development

## Start Backend

```bash
cd backend
npm run dev
```

## Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The application will be available at the URL displayed by Vite.

---

# 🏗️ Production Build

Build both applications:

```bash
npm run build
```

Or build individually:

### Frontend

```bash
npm run build --prefix frontend
```

### Backend

```bash
npm run build --prefix backend
```

---

# 🖥️ Windows Server / RDP Deployment

The project includes Windows deployment scripts inside:

```text
deployment/
```

## Step 1: Configure Environment Variables

Create:

```text
frontend/.env
backend/.env
```

before running the installation script.

---

## Step 2: Install and Build

Open Command Prompt as Administrator:

```bat
cd deployment
install.bat
```

The installation script:

* Checks Node.js
* Verifies environment files
* Installs frontend dependencies
* Installs backend dependencies
* Creates required upload directories
* Builds frontend
* Builds backend
* Configures Windows Firewall rules

---

## Step 3: Start Application

```bat
start.bat
```

This starts:

* Backend production server
* Frontend production preview server

---

## Step 4: Stop Application

```bat
stop.bat
```

---

## Step 5: Restart Application

```bat
restart.bat
```

---

# 🗄️ Database Backup & Restore

The project uses MongoDB.

> ⚠️ Never run development seed scripts against an existing production database.

## Backup Database

```bash
mongodump --db trai_citizen_hub --out backup_folder/
```

## Restore Database

```bash
mongorestore --db trai_citizen_hub backup_folder/trai_citizen_hub/
```

Always create a backup before database migration or production deployment.

---

# 🔒 Security Practices

The project follows important security practices including:

* JWT-based authentication
* Password hashing
* Role-based authorization
* Protected API routes
* Input validation
* Environment-based secrets
* CORS configuration
* Audit logging
* File upload handling
* Rate limiting
* Security headers

Important:

* Never commit `.env` files.
* Never expose JWT secrets.
* Never commit production database dumps.
* Never run seed scripts against production data.
* Always validate file uploads.
* Keep production dependencies updated.

---

# 🌿 Git Workflow

Recommended development workflow:

```bash
git pull
```

Create a feature branch:

```bash
git checkout -b feature/feature-name
```

Commit changes:

```bash
git add .
git commit -m "feat: add feature description"
```

Push:

```bash
git push origin feature/feature-name
```

Then open a Pull Request for review.

---

# 🎯 Project Highlights

* Full-stack enterprise workflow system
* Four dedicated role-based portals
* Advanced ticket lifecycle management
* Multi-level assignment and escalation
* Complete immutable ticket trail
* Multiple attachment support
* Real-time Socket.IO updates
* Centralized audit logging
* Search and advanced filtering
* Analytics and MIS reports
* Excel and PDF exports
* Active/Inactive user management
* Responsive enterprise UI
* Windows server deployment automation

---

# 📌 Project Status

**Status: Completed & Deployment Ready**

The application currently supports:

* Local development
* Internal network deployment
* Windows server/RDP hosting
* Multi-user browser access
* Real-time workflow updates
* Database backup and restoration

---

## 👨‍💻 Author

**Mirza Altamash Baig**

Full Stack Developer
MERN Stack • TypeScript • REST APIs • Real-Time Applications

---

<div align="center">

### ⭐ TRAI Citizen Hub

**Building structured, transparent, and efficient digital workflows.**

</div>
