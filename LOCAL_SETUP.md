# 🚀 Local Setup & Installation Guide

Welcome to the **TRAI Citizen Hub** repository! Follow these step-by-step instructions to smoothly get the project running on any local machine after cloning.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **Node.js**: v18.x or later (Download from [nodejs.org](https://nodejs.org/))
2. **MongoDB**: A local MongoDB server or MongoDB Compass (Download from [mongodb.com](https://www.mongodb.com/try/download/community))
3. **Git**: To clone the repository (Download from [git-scm.com](https://git-scm.com/))

---

## 📦 Step 1: Clone the Repository

Clone the project to your local machine and navigate into the project directory:

```bash
git clone https://github.com/Mirza-Altamash/TRAI.git
cd TRAI
```

---

## ⚙️ Step 2: Install Dependencies

The project uses a monorepo-style structure. You need to install dependencies for both the backend and frontend separately.

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Return to root and install frontend dependencies
cd ../frontend
npm install
cd ..
```

---

## 🔐 Step 3: Setup Environment Variables

The project relies on `.env` files to store configuration secrets. You need to create these files in both the frontend and backend directories.

### Backend `.env`
Create a `.env` file inside the `backend` folder (`TRAI/backend/.env`) with the following variables:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb://127.0.0.1:27017/trai_citizen_hub

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

# File Upload Limit (5MB)
MAX_FILE_SIZE=5242880
```

### Frontend `.env`
Create a `.env` file inside the `frontend` folder (`TRAI/frontend/.env`) with the following variables:

```env
VITE_API_URL=http://localhost:5002/api
VITE_SOCKET_URL=http://localhost:5002
```

---

## 🌱 Step 4: Seed the Database

Before running the application, you need to populate your local MongoDB database with the initial structured roles (Admin, L2, L3, Users, etc.).

Ensure your local MongoDB server is running, then execute the seed script:

```bash
cd backend
npm run seed
cd ..
```
*Note: This script will create default accounts like `TRAI-ADMIN-01`, `TRAI-L3-001`, `TRAI-JADV-01`, etc. Check the console output or the `backend/src/seed.ts` file for the exact default passwords.*

---

## 🚀 Step 5: Start the Development Servers

You can now start both the frontend and backend development servers. **Open two separate terminal windows/tabs.**

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*(The backend API will run on http://localhost:5002)*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*(The frontend application will run on http://localhost:8085 by default)*

---

## 🎉 Step 6: Access the Application

Open your favorite web browser and navigate to the frontend URL:
👉 **http://localhost:8085**

You can now log in using one of the seeded accounts and begin developing or testing the platform!
