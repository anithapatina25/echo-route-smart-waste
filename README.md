# ECHO ROUTE SMART WASTE
> **"Smarter Routes. Cleaner Communities."**

A functional full-stack web application prototype for rural and Gram Panchayat-focused smart municipal solid waste management. 

Designed to maximize the operational efficiency of existing Panchayat tractors, tippers, drivers, and local sanitation workers through precision route clustering, mobile-first citizen requests, and verifiable photographic proof of completion.

---

## 🏛️ Three Dedicated Roles (Strict RBAC)

1. **CITIZEN**: Mobile-first portal to schedule waste pickups (Household, Dry/Plastic, Wet/Organic, E-Waste, Bulky), attach geo-tagged site photos, track 6-step collection lifecycle in real time, and submit grievances.
2. **DRIVER**: Dedicated route cockpit with sequenced stop queue for assigned vehicles (e.g. Tata Ace Tipper), waypoint navigation guidance, and mandatory camera proof upload upon pickup.
3. **ADMIN / PANCHAYAT OFFICIAL**: Central Command Center for Panchayat Development Officers (PDO) to oversee the collection queue, verify requests, manage driver rosters, cluster stops for fuel efficiency, and monitor Swachh Bharat metrics.

> **Note**: Exactly three roles are supported. No volunteer or extraneous modules exist.

---

## 🏗️ Project Architecture

The codebase enforces clean separation of concerns across three core tiers:

```
echo-route-smart-waste/
├── database/                    # Dedicated Relational Database Tier
│   ├── migrations/              # SQL DDL Migration scripts (001_initial_schema.sql)
│   ├── seeds/                   # Realistic Gram Panchayat seed scripts
│   ├── client.js                # Database connection wrapper (WAL mode & foreign keys enabled)
│   ├── migrate.js               # Migration runner
│   ├── seed.js                  # Demo seeder runner
│   └── echo_route_smart_waste.db # Dedicated SQLite Database file
├── backend/                     # Node.js & Express API Server
│   ├── src/
│   │   ├── config/              # Environment (env.js) & System Constants (constants.js)
│   │   ├── controllers/         # Auth, Citizen, Driver, Admin, Health controllers
│   │   ├── middleware/          # JWT Auth, Role-Based Access Guard, Centralized Error Handling
│   │   ├── models/              # User, CitizenProfile, DriverProfile, Pickup models
│   │   ├── routes/              # Modular API route definitions (/api/...)
│   │   ├── services/            # Authentication & password hashing (bcryptjs)
│   │   └── app.js               # Express application configuration
│   ├── server.js                # HTTP Server entry point
│   ├── .env                     # Local environment configuration
│   └── .env.example             # Environment template without secrets
├── frontend/                    # Modern Civic-Tech Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                 # Fetch client & Auth API services
│   │   ├── components/          # Reusable Navbar, Footer, Toast, ConfirmationDialog, States
│   │   ├── context/             # AuthContext (JWT session persistence) & ToastContext
│   │   ├── pages/               # LandingPage, LoginPage, Citizen, Driver, Admin Dashboards
│   │   ├── router/              # AppRouter with protected route guards
│   │   └── styles/              # Civic-tech green/earth design system (index.css)
│   ├── index.html
│   └── vite.config.js           # Vite configuration with /api backend proxy
├── test-foundation.js           # Automated 38-assertion verification test suite
└── package.json                 # Root script runner
```

---

## 🗄️ Dedicated Relational Database

Echo Route utilizes a completely separate SQLite relational database:
- **Database Engine**: Node 24 Native ACID-compliant SQLite (`node:sqlite`)
- **Database File**: `database/echo_route_smart_waste.db`
- **Foreign Keys**: Enforced via `PRAGMA foreign_keys = ON;`
- **Performance**: High-concurrency Write-Ahead Logging (`PRAGMA journal_mode = WAL;`)
- **Isolation**: Controlled strictly through `DB_PATH` in `.env`. Does not touch any external or personal database.

### 10 Core Entities Created:
1. `users` (CITIZEN, DRIVER, ADMIN)
2. `citizen_profiles` (Ward, Village, House No, Landmark, GPS coordinates)
3. `driver_profiles` (Vehicle No, Vehicle Type, License, Capacity, Duty status)
4. `pickup_requests` (Status, Priority, Waste Type, Volume, Ward, Scheduled Date)
5. `pickup_photos` (Citizen initial pile photos)
6. `completion_proofs` (Driver photographic proof, weight, verification status)
7. `driver_assignments` (Sequence order, assignment lifecycle status)
8. `routes` (Optimized waypoint sequence JSON, total distance, stop count)
9. `complaints` (Citizen grievance tracking, admin notes, status)
10. `notifications` (User alerts and system notifications)

---

## 🔑 Demo Login Credentials

The Central Login Page features **1-click auto-fill buttons** for testing:

| Portal | Email / Username | Password | Profile / Assigned Fleet |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@echoroute.gov.in` | `citizen123` | Ramesh Patel (Ward 4 - Mandir Mohalla) |
| **Driver** | `driver@echoroute.gov.in` | `driver123` | Suresh Kumar (Tata Ace Tipper `GP-04-E-1024`) |
| **Admin** | `admin@echoroute.gov.in` | `admin123` | Officer Anil Sharma (Panchayat Development Officer) |

---

## 🚀 Quick Start Guide

### 1. Run Migrations & Seed Demo Data
```cmd
npm run db:setup
```

### 2. Launch the Application
Start the backend server (serves both the API and the built frontend SPA):
```cmd
npm start
```
Open your browser to: **[http://localhost:5000](http://localhost:5000)**

### 3. Development Mode (Optional)
To run frontend with Vite hot-module reloading:
```cmd
npm run dev:frontend
```
Open your browser to: **[http://localhost:3000](http://localhost:3000)** (automatically proxies `/api` to port 5000).

---

## 🧪 Automated Foundation Verification Suite

Run the built-in automated test suite:
```cmd
npm test
```
Validates all 38 points:
- Dedicated database connection and file existence
- Integrity of all 10 entity tables
- System health diagnostic endpoint
- Demo login for Citizen, Driver, and Admin
- Portal mismatch rejection (403 Forbidden)
- Role-based authorization and cross-portal access blocks
- Frontend static delivery and SPA routing fallback for `/`, `/login`, `/citizen`, `/driver`, `/admin`
