# MediSlot Appointment Booking UI

A modern, role-based Doctor & Patient Appointment Booking Web Application built with **Next.js (App Router)**, **Tailwind CSS**, and **MongoDB / Mongoose**.

---

## 📁 Project Architecture & File Directory

```
medislot-appointment-booking-ui/
├── app/                              # Next.js App Router (Pages & API routes)
│   ├── layout.jsx                    # Root layout with font setup & AuthProvider
│   ├── globals.css                   # Global styles (Tailwind CSS v4)
│   ├── page.jsx                      # Public Landing / Home page
│   │   # --- Authentication ---
│   ├── login/page.jsx            # Multi-role Login (Patient / Doctor) + Google Auth
│   ├── register/page.jsx         # Registration (Patient / Doctor)
│   ├── forgot-password/page.jsx  # Forgot password request
│   ├── reset-password/page.jsx   # Reset password with token
│   │
│   │   # --- Patient Portal ---
│   ├── dashboard/page.jsx        # Patient overview, stats, next appointment
│   ├── find-doctors/page.jsx     # Doctor directory with department/search filter
│   │   ├── doctors/[id]/             # Doctor profile & schedule
│   │   │   ├── page.jsx              # Profile details & consultation fee
│   │   │   └── availability/page.jsx # Live slot selector & date picker
│   │   ├── book-appointment/page.jsx # Slot confirmation & booking form
│   │   ├── appointment-confirmation/ # Booking success confirmation card
│   │   ├── my-appointments/page.jsx  # Appointments list (Upcoming, Completed, Cancelled)
│   │   ├── appointment/[id]/page.jsx # Appointment details & clinical prescription view
│   │   └── profile/page.jsx          # Patient profile settings & password change
│   │
│   ├── doctor/                       # Doctor Portal
│   │   ├── page.jsx                  # Redirects to /doctor/dashboard
│   │   ├── dashboard/page.jsx        # OPD queue, live availability toggle, metrics
│   │   ├── appointments/page.jsx     # Full queue management & prescription notes
│   │   ├── schedule/page.jsx         # Weekly practice hours & shift setup
│   │   ├── patients/page.jsx         # Patient medical records directory
│   │   └── profile/page.jsx          # Doctor profile & credentials management
│   │
│   ├── admin/                        # Admin Portal
│   │   ├── page.jsx                  # Redirects to /admin/dashboard
│   │   ├── login/page.jsx            # Admin login screen
│   │   ├── dashboard/page.jsx        # Hospital ops overview, revenue, doctors, queues
│   │   ├── doctors/page.jsx          # Doctor management (Add / Edit / Remove)
│   │   ├── appointments/page.jsx     # Master appointment scheduling & triage
│   │   ├── availability/page.jsx     # Department & hospital availability overview
│   │   └── settings/page.jsx         # Hospital configurations & preferences
│   │
│   └── api/                          # Backend REST API Routes
│       ├── auth/                     # Auth: login, register, me, password management
│       ├── doctors/                  # Doctor directory & availability toggles
│       ├── appointments/             # Booking, cancellations, status updates
│       ├── doctor/                   # Doctor-specific endpoints (schedule, profile)
│       ├── admin/                    # Admin operations (manage doctors)
│       ├── seed/                     # Demo data seeder
│       └── db-status/                # Database health check & latency
│
├── components/                       # Reusable React UI Components
│   ├── layout/                       # Navbars and role-specific sidebars
│   │   ├── Navbar.jsx                # Public header with auth awareness
│   │   ├── PatientLayout.jsx         # Patient portal shell
│   │   ├── PatientSidebar.jsx        # Patient navigation sidebar
│   │   ├── DoctorLayout.jsx          # Doctor portal shell
│   │   ├── DoctorSidebar.jsx         # Doctor navigation sidebar
│   │   ├── AdminLayout.jsx           # Admin portal shell
│   │   └── AdminSidebar.jsx          # Admin navigation sidebar
│   ├── security/                     # Security modals and password tools
│   │   ├── ChangePasswordModal.jsx   # Change password dialog
│   │   └── PasswordSecurityCard.jsx  # Security & session management card
│   └── ui/                           # Atoms & shared UI elements
│       ├── DatabaseBadge.jsx         # Live MongoDB status pill & diagnostics popover
│       ├── DoctorCard.jsx            # Doctor search & booking card
│       └── StatusBadge.jsx           # Colored appointment status badges
│
├── context/                          # Global React Context
│   └── AuthContext.jsx               # Auth state, role synchronization & offline fallback
│
├── data/                             # Mock & Fallback Data
│   └── mockData.js                   # In-memory doctors, departments & appointment data
│
├── lib/                              # Core Utility Modules
│   ├── auth.js                       # JWT session signing & token verification
│   ├── mongodb.js                    # Mongoose connection pooling & failover
│   ├── rate-limit.js                 # In-memory rate limiting for API endpoints
│   └── security-logger.js            # Security audit logging
│
├── models/                           # Mongoose Schemas & Models
│   ├── User.js                       # User model (patient, doctor, admin)
│   ├── Doctor.js                     # Doctor profile & availability schedules
│   ├── Appointment.js                # Appointment records with prescription notes
│   └── Department.js                 # Hospital clinical departments
│
└── scripts/                          # Automation & Maintenance Scripts
    ├── db/                           # Database utilities
    │   ├── start-mongo.mjs           # Local MongoDB runner
    │   └── clean-demo-data.mjs       # Demo data reset utility
    └── tests/                        # Automated endpoint verification suites
        ├── test-google-auth.mjs      # Google OAuth verification
        ├── test-doctor-mgmt.mjs      # Doctor CRUD verification
        ├── test-password-management.mjs # Password change & reset flow tests
        ├── test-registration-e2e.mjs # Registration end-to-end verification
        └── verify-e2e-workflow.mjs   # Full booking workflow test
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
The app will run on [http://localhost:8443](http://localhost:8443).

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on port 8443 |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs production server on port 8443 |
| `npm run format` | Formats codebase with oxfmt |
| `npm run db:clean` | Resets demo data in MongoDB |
| `npm run test:auth` | Runs Google OAuth authentication test |
| `npm run test:e2e` | Runs end-to-end booking verification test |

---

## 🗄️ Database Setup & Offline Fallback

* **Local MongoDB**: Ensure `mongod` is running on `mongodb://127.0.0.1:27017/medislot`.
* **MongoDB Atlas**: Configure `MONGODB_URI` in `.env.local`.
* **Automatic In-Memory Fallback**: If MongoDB is unavailable, MediSlot automatically switches to mock data so you can test all features without database setup.

---

## 🔐 Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@medislot.com` | `admin123` |
| **Doctor** | `dr.amit@medislot.com` | `doctor123` |
| **Patient** | `adarsh@example.com` | `patient123` |
#   M e d i s l o t - a p p o i n t m e n t - b o o k i n g  
 