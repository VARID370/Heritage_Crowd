# HeritageConnect — Heritage Site Discovery, Ticket Booking and Crowd Management System

An individual third-year Computer Science Engineering college capstone project.

[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-24%2F24%20Passing-brightgreen)](#)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-blue)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-emerald)](#)

---

## 🏛️ Project Overview

**HeritageConnect** is a full-stack cultural preservation and ticketing platform designed for Indian historical landmarks.

Key features:
1. **Dynamic OpenStreetMap Discovery**: Real-time queries to discover forts, palaces, monuments, archaeological sites, and heritage temples across India via the Overpass API without relying on hardcoded monument lists.
2. **Atomic Capacity Reservation**: Concurrency-safe ticket reservations preventing overbooking through atomic MongoDB operators.
3. **Single-Restoration Cancellation**: Safe slot capacity restoration that cannot be exploited through repeated requests.
4. **Standardized Crowd Management**: Server-side crowd classification (*Low*, *Moderate*, *High*, *Peak*) derived strictly from database reservations.
5. **Real QR Gate Verification**: Camera-based and manual reference ticket verification for authorized staff, ensuring one-time entry and duplicate prevention.
6. **College Viva Demo Ready**: One-click demo credentials for Admin, Gate Staff, and Visitor accounts.

---

## 💻 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Recharts, html5-qrcode.
- **Backend**: Node.js, Express.js REST API, Mongoose (MongoDB), JWT, bcryptjs, Zod validation, Axios, QRCode.
- **Testing**: Jest v29 & Supertest v7 (24 unit/integration tests with 100% pass rate).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v24.13.0)
- **MongoDB**: Local MongoDB service running on `localhost:27017` or MongoDB Atlas URI

---

### Step 1: Clone or Navigate to the Project

```bash
cd "c:\Users\varid\OneDrive\Desktop\New folder (2)"
```

---

### Step 2: Backend Setup & Database Seeding

1. Open a terminal and enter the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   A `.env` file is already created. For reference, copy from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Run the seed script to create initial demo accounts and verified bookable sites:
   ```bash
   npm run seed
   ```
5. Run backend tests to verify system integrity:
   ```bash
   npm test
   ```
6. Start the Express server:
   ```bash
   npm run dev
   ```
   *The backend will be running at:* `http://localhost:5000`  
   *Health check:* `http://localhost:5000/api/health`

---

### Step 3: Frontend Setup & Startup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env.local` points to the backend:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Build the application for production verification (optional):
   ```bash
   npm run build
   ```
5. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at:* `http://localhost:3000`

---

## 🔑 Demo Accounts (For Viva Evaluation)

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Director / Admin** | `admin@heritageconnect.org` | `Admin@123456` | Full platform control, configure sites, manage slots, view all bookings |
| **Gate Staff** | `staff@heritageconnect.org` | `Staff@123456` | QR gate scanner, verify tickets, admit visitors |
| **Visitor** | `visitor@heritageconnect.org` | `Visitor@123456` | Explore sites, book tickets, view & print passes, cancel bookings |

*(Note: On the `/login` page, convenient one-click buttons are available to auto-fill these credentials for live demonstrations).*

---

## 📂 Project Structure

```
New folder (2)/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # MongoDB connection
│   │   ├── controllers/              # Auth, sites, bookings, verification, admin
│   │   ├── middleware/               # JWT auth guard, error handling, rate limiting
│   │   ├── models/                   # User, BookableSite, TimeSlot, Booking, VerificationLog
│   │   ├── routes/                   # RESTful API route definitions
│   │   ├── services/                 # OSM Overpass, Wikimedia image, crowd services
│   │   ├── utils/                    # Validators (Zod), QR generator, time formatters
│   │   ├── scripts/seed.js           # Initial demo database seeder
│   │   ├── tests/                    # Jest + Supertest suites (24 tests)
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # Server listener
│   ├── .env.example
│   ├── package.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js 14 App Router public & admin pages
│   │   ├── components/               # Navbar, Footer, SiteCard, CrowdBadge, etc.
│   │   ├── context/AuthContext.js    # JWT session state management
│   │   ├── lib/api.js                # Centralized API fetch wrapper
│   │   ├── lib/utils.js              # Formatting helpers (formatINR, formatDate)
│   │   └── styles/globals.css        # Tailwind styling & print ticket CSS
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js
├── docs/
│   ├── ARCHITECTURE.md               # Technical architecture & database design
│   ├── API_DOCUMENTATION.md          # Full REST API endpoints & schemas
│   ├── TESTING_REPORT.md             # Execution results & assertions
│   └── VIVA_GUIDE.md                 # 3-minute viva walkthrough & Q&A
├── README.md
└── .env.example
```

---

## 🧪 Testing Coverage

The backend automated test suite verifies 24 critical assertions across 4 test suites:
- `npm test` runs in ~5 seconds.
- Validates registration, authentication, role authorization, Overpass discovery failover, image resolution, price calculation, atomic concurrency protection, single-restoration cancellation, QR verification, duplicate check-in rejection, and manual reference fallback.

To execute tests:
```bash
cd backend
npm test
```

---

## 🛠️ Troubleshooting

- **MongoDB connection refused**: Ensure the MongoDB service is running via Windows Services (`MongoDB Server`) or run `mongod` in a separate command line.
- **Overpass API slow or timing out**: HeritageConnect automatically fails over between multiple Overpass servers and caches query results in-memory for 15 minutes.
- **Webcam not starting on Gate Verification**: If running on desktop without a webcam or if camera permissions are denied, use the **Manual Reference Fallback** input with the booking reference code (e.g. `HC-20261029-XXXX`).

