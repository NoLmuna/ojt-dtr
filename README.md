# OJT Daily Time Record (DTR) System

A web-based Daily Time Record (DTR) management platform built with Next.js 16, Supabase (PostgreSQL), Prisma ORM, NextAuth.js, and Tailwind CSS. Designed for trainees, interns, and supervisors to track daily attendance, enforce GPS geofence verification, and export standard Philippine Civil Service Commission (CSC) Form 48 PDF reports.

---

## Features

- **Google OAuth Authentication** — Single sign-on using Google accounts via NextAuth v5.
- **GPS Geofence Verification** — Restricts attendance punches to within a 100-meter radius of the registered training agency coordinates using Haversine distance calculations.
- **Attendance Station** — Daily logging for morning (A.M.) and afternoon (P.M.) arrival and departure times.
- **Automated Hour Calculations** — Computes daily rendered hours, handles mandatory 1-hour lunch break deductions, and tracks accumulated progress toward target internship hours.
- **CSC Form 48 PDF Export** — Generates print-ready double-column PDF documents matching official Philippine Civil Service daily attendance requirements with certification and signature blocks.
- **Supervisor Workflow** — Trainees can invite supervisors by email to monitor logs, review records, and verify hours.
- **Progressive Web App (PWA)** — Installable on desktop and mobile devices with service worker caching and offline fallback support.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: Supabase (PostgreSQL with connection pooling)
- **ORM**: Prisma ORM 6.19
- **Authentication**: NextAuth.js v5 Beta (Google OAuth)
- **Styling**: Tailwind CSS 4, Lucide Icons, Radix UI
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Mapping & Geocoding**: OpenStreetMap Nominatim API, Browser Geolocation API
- **Email Service**: Nodemailer (SMTP)

---

## Getting Started

### 1. Prerequisites

- Node.js 20.x or higher
- A Supabase account and project
- A Google Cloud Console project for OAuth credentials

---

### 2. Configure Google OAuth

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and configure the **OAuth consent screen** (External).
3. Under **Credentials**, create an **OAuth client ID** with application type **Web application**.
4. Add the authorized redirect URI:
   ```text
   http://localhost:3000/api/auth/callback/google
   ```
5. Copy the generated **Client ID** and **Client Secret**.

---

### 3. Configure Supabase

1. Create a project on [Supabase](https://supabase.com/).
2. In **Project Settings** > **Database** > **Connection string** > **URI**:
   - Copy the **Transaction pooler URL** (port 6543) for `DATABASE_URL`.
   - Copy the **Session / Direct URL** (port 5432) for `DIRECT_URL`.
3. In **Project Settings** > **API**, copy the **Project URL** and **anon public key**.

---

### 4. Setup Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth & Google OAuth
AUTH_SECRET="your-32-byte-secret"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Application Security (32-character random string)
NEXT_PUBLIC_AES_SECRET="your-32-char-aes-secret-key"
```

---

### 5. Install Dependencies and Push Schema

```bash
npm install
npx prisma db push
```

---

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Author

**Noel John Mateo**  
GitHub: [@NoLmuna](https://github.com/NoLmuna)

---

## License

This project is licensed under the [MIT License](LICENSE).
