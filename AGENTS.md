# medislot-appointment-booking-ui

Next.js (App Router) + Tailwind CSS project in pure JavaScript.

## Development Server

A Next.js development server runs on `$PORT` (default 8443): `npm run dev` (`next dev -p 8443`).

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure:

- `app/layout.jsx` - Root Next.js layout, mounts global font styles and `AuthProvider`
- `app/globals.css` - Global CSS entrypoint with Tailwind CSS v4 and theme tokens
- `app/page.jsx` - Landing / Home page
- `app/login/page.jsx` - Role-based authentication (Patient / Doctor) with Google Sign-In
- `app/register/page.jsx` - Patient / Doctor registration
- `app/dashboard/page.jsx` - Patient dashboard
- `app/find-doctors/page.jsx` - Doctor directory and filtering
- `app/doctors/[id]/page.jsx` - Doctor profile and weekly hours
- `app/doctors/[id]/availability/page.jsx` - Date picker and slot availability
- `app/book-appointment/page.jsx` - Appointment booking form
- `app/appointment-confirmation/page.jsx` - Booking success screen
- `app/my-appointments/page.jsx` - Patient appointments management (upcoming, completed, cancelled)
- `app/appointment/[id]/page.jsx` - Appointment details and clinical prescription view
- `app/profile/page.jsx` - Patient profile settings
- `app/doctor/dashboard/page.jsx` - Doctor portal: OPD queue, availability toggle, and prescription notes
- `app/doctor/schedule/page.jsx` - Doctor practice hours and shift settings
- `app/doctor/patients/page.jsx` - Doctor patient records directory
- `app/admin/dashboard/page.jsx` - Admin operations dashboard
- `app/api/db-status/route.js` - Database health check and ready state endpoint
- `app/api/seed/route.js` - Initial database seeder for doctors, departments, accounts, and appointments
- `app/api/auth/login/route.js` - User authentication verification against MongoDB
- `app/api/auth/register/route.js` - User registration handler in MongoDB
- `app/api/auth/me/route.js` - User profile update endpoint
- `app/api/doctors/route.js` - Doctor directory lookup (GET) and live availability toggle (PATCH)
- `app/api/appointments/route.js` - Appointments listing (GET) and creation (POST)
- `app/api/appointments/[id]/route.js` - Appointment details (GET) and status/prescription updates (PATCH)
- `models/User.js` - Mongoose User schema (patient, doctor, admin)
- `models/Doctor.js` - Mongoose Doctor schema with weekly schedule and availability
- `models/Appointment.js` - Mongoose Appointment schema with consultation prescription fields
- `models/Department.js` - Mongoose Department schema
- `lib/mongodb.js` - Global connection pool caching pattern with fast failover
- `components/ui/DatabaseBadge.jsx` - Interactive database status badge and connection diagnostics popover
- `components/` - Shared UI and layout components (Navbar, PatientLayout, DoctorLayout, AdminLayout)
- `context/AuthContext.jsx` - Full-stack state synchronization, MongoDB sync, and in-browser fallback
- `data/mockData.js` - Hospital doctors, departments, and appointment utilities
- `.env.local` - Environment variables (`MONGODB_URI`)
- `package.json` - Next.js dependencies and scripts

## Dependencies

- Runtime: Next.js 16, React 19, React DOM 19
- Database: Mongoose 8 (`mongoose`), MongoDB
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`
- Formatting: oxfmt

## Database Setup

1. **Local MongoDB**: Ensure `mongod` is running on `mongodb://127.0.0.1:27017/medislot` (default in `.env.local`).
2. **MongoDB Atlas**: Set `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/medislot?retryWrites=true&w=majority` in `.env.local`.
3. **Graceful Fallback**: If MongoDB is unreachable, the system automatically falls back to local storage and in-memory mock data so the app remains fully functional.

## Styling

This project uses **Tailwind CSS v4** through `@tailwindcss/postcss` configured in `postcss.config.mjs`. `app/globals.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind theme customization in `app/globals.css`.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
