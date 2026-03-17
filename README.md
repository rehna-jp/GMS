# 🏛️ Government Project Monitoring System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**A GPS-verified government infrastructure project monitoring platform built to prevent fraud and ensure transparency across Ghana.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Screenshots](#-screenshots) • [Architecture](#-architecture) • [Team](#-team)

</div>

---

## 📌 Overview

The Government Project Monitoring System (GMS) is a full-stack web application that enables GPS-verified photo submissions from contractors on government infrastructure projects. Officials can review submissions, verify location authenticity, and approve or flag reports — all with a permanent audit trail.

Built for **Group 12** as part of a university software engineering project.

### The Problem
- Contractors submit **fake progress photos** from locations other than the project site
- Government officials have **no efficient digital tool** to verify submissions
- Citizens have **zero visibility** into how public funds are being spent
- No **audit trail** exists for review decisions

### The Solution
- 📍 **GPS verification** — EXIF data extracted from photos, distance calculated using Haversine formula
- 🔐 **Role-based access** — different interfaces for Admin, Official, Contractor, and Citizen
- 📊 **Live dashboards** — real-time analytics with charts and fraud alerts
- 🌍 **Public transparency portal** — citizens can track projects on an interactive map
- 📱 **Offline PWA** — contractors can capture photos on-site without network connectivity

---

## ✨ Features

### 🔐 Authentication & Security
- Email + password authentication via Supabase Auth
- Force password change on first login
- Role-based route protection via Next.js middleware
- Row Level Security (RLS) on all database tables
- Admin-only user creation

### 🏗️ Project Management
- Create, edit, and manage infrastructure projects
- GPS coordinates required for every project
- 16 Ghana regions + 9 project type categories
- Budget tracking in Ghana Cedis (GH₵)
- Milestone management with deadlines and progress tracking
- Auto-generated project numbers (`PRJ-2026-001`)

### 📸 GPS-Verified Photo Submissions
- Direct rear camera access on mobile (`capture="environment"`)
- Drag & drop upload from gallery on desktop
- EXIF metadata extraction for GPS coordinates
- Haversine formula distance calculation
- Three-tier verification system:
  - ✅ **Verified** — photo taken within 100m of project site
  - ⚠️ **Review** — photo taken 100–500m from site
  - 🚩 **Flagged** — photo taken more than 500m away

### 🔍 Review & Approval Workflow
- Officials can: **Approve**, **Flag as Fraud**, **Request Changes**, **Mark Under Review**
- Contractors can resubmit on the same thread with new photos
- Old photos preserved for side-by-side comparison
- Permanent audit trail for every review action
- Real-time notifications via bell icon

### 📊 Analytics & Live Dashboards
- Role-specific dashboards (Admin / Official / Contractor)
- `force-dynamic` rendering for always-fresh data
- Submission trend line chart (6 months)
- Projects by region bar chart
- Submissions by status donut chart
- Auto-update project completion % on approval

### 🌍 Public Transparency Portal
- `/public/map` — interactive project map (no login required)
- Anonymous citizen tip submission with reference number tracking
- Google Maps integration for site location verification

### 📱 PWA & Offline Support
- Installable as a Progressive Web App on Android and iOS
- Service Worker for offline page caching
- IndexedDB queue stores photos when offline
- Auto-uploads when network connectivity returns
- Floating queue manager with live status indicator

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | React framework with SSR/RSC |
| Language | TypeScript | Type safety across the codebase |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Accessible UI component library |
| Backend | Supabase | Database, Auth, Storage |
| Database | PostgreSQL | Relational data with RLS |
| Charts | Recharts | Analytics dashboards |
| Forms | React Hook Form + Zod | Form handling and validation |
| GPS | exif-parser | EXIF metadata extraction |
| Offline | IndexedDB + Service Worker | PWA offline support |
| Icons | Lucide React | Icon library |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/govt-monitoring-system.git
cd govt-monitoring-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase credentials

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in **Supabase Dashboard → Project Settings → API**.

### Database Setup

Run the SQL setup files in your Supabase SQL Editor in order:

```
Week1-SETUP.sql   → Users, auth tables, RLS policies
Week2-SETUP.sql   → Projects, milestones
Week3-SETUP.sql   → Submissions, storage bucket
Week4-SETUP.sql   → Notifications, audit logs
```

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, user management, all reports |
| **Official** | Create/edit projects, review submissions, manage tips |
| **Contractor** | View assigned projects, upload progress photos, resubmit |
| **Citizen** | View public map, submit anonymous tips (no login needed) |

### Test Credentials

```
Admin:      admin@gov.gh        / admin123
Official:   official@gov.gh     / official123
Contractor: contractor@example.com / contractor123
```

> ⚠️ Change these credentials before any production deployment.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App Router                 │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  RSC Pages  │  │Server Actions│  │  Middleware    │  │
│  │ (dashboard, │  │ (auth, CRUD, │  │ (auth guard,  │  │
│  │  projects,  │  │  reviews,    │  │  role check)  │  │
│  │  submissions│  │  analytics)  │  │               │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                      Supabase                            │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │PostgreSQL│  │   Auth   │  │ Storage  │              │
│  │ + RLS    │  │  (JWT)   │  │ (Photos) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### GPS Verification Flow

```
Contractor takes photo
        ↓
EXIF data extracted (client-side)
        ↓
GPS coordinates parsed
        ↓
Haversine distance calculated
        ↓
< 100m  →  ✅ Verified
100–500m → ⚠️  Needs Review
> 500m  →  🚩 Flagged
No GPS  →  ⚠️  Manual Review Required
```

### Offline Flow

```
No network detected
        ↓
Amber banner shown to contractor
        ↓
Photo captured via camera
        ↓
GPS extracted + saved to IndexedDB
        ↓
"📶 QUEUED" badge shown
        ↓
Network returns
        ↓
Auto-upload triggers (< 2 seconds)
        ↓
Submission created + Official notified ✅
```

---

## 📁 Project Structure

```
govt-monitoring-system/
├── app/
│   ├── (dashboard)/          # Protected authenticated routes
│   │   ├── dashboard/        # Role-based live dashboards
│   │   ├── projects/         # Project CRUD + details
│   │   ├── submissions/      # Photo submissions + review
│   │   ├── users/            # Admin user management
│   │   ├── tips/             # Citizen tips management
│   │   └── reports/          # Analytics + print/PDF
│   ├── public/
│   │   ├── map/              # Public project map
│   │   └── tips/             # Anonymous tip submission
│   └── login/                # Authentication
│
├── components/
│   ├── dashboard/            # Charts, stats cards, activity feed
│   ├── submissions/          # PhotoUpload, ReviewPanel, GPSVerification
│   ├── projects/             # ProjectForm, MilestonesList
│   ├── users/                # UserStatusButton
│   ├── tips/                 # TipActionButton
│   └── public/               # PublicMapClient, TipSubmissionForm
│
├── lib/
│   ├── actions/              # All server actions
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── submissions.ts
│   │   ├── reviews.ts
│   │   ├── notifications.ts
│   │   ├── analytics.ts
│   │   ├── users.ts
│   │   └── tips.ts
│   ├── utils/
│   │   ├── gps.ts            # Haversine formula
│   │   ├── exif.ts           # EXIF GPS extraction
│   │   └── offline-queue.ts  # IndexedDB offline queue
│   └── supabase/             # Client + server Supabase instances
│
├── public/
│   ├── sw.js                 # Service Worker
│   └── manifest.json         # PWA manifest
│
└── middleware.ts             # Auth + role protection
```

---

## 🗺️ Development Roadmap

| Week | Feature | Status |
|------|---------|--------|
| Week 1 | Authentication & Setup | ✅ Complete |
| Week 2 | Projects & Milestones | ✅ Complete |
| Week 3 | Photo Upload + GPS Verification | ✅ Complete |
| Week 4 | Review & Approval Workflow | ✅ Complete |
| Week 5 | Analytics & Live Dashboards | ✅ Complete |
| Week 6 | Maps, Reports, Tips, User Management | ✅ Complete |
| PWA | Offline Support & Camera Capture | ✅ Complete |

---

## 🔒 Security

- **Row Level Security** — Supabase RLS policies on all tables
- **JWT Authentication** — Tokens managed by Supabase, never in localStorage
- **Server-side role checks** — All sensitive actions verify role server-side
- **GPS anti-fraud** — EXIF data cannot be spoofed through the UI
- **Audit trail** — Every review action permanently logged
- **Private storage** — Photos in private Supabase bucket, signed URLs required

---

## 📱 PWA Installation

### On Android
1. Open the app in Chrome
2. Tap the **⋮ menu** → **Add to Home Screen**
3. App installs with offline support

### On iOS
1. Open the app in Safari
2. Tap the **Share button** → **Add to Home Screen**
3. App installs with offline support

---

## 🧪 Quick Test Guide

```bash
# 1. Login as admin → verify dashboard stats
# 2. Create a project with GPS coordinates
# 3. Login as contractor → submit photos
# 4. Login as official → review submission
# 5. Approve → verify project completion % updates
# 6. Visit /public/map → verify project is visible
# 7. Submit tip from /public/tips → verify in /tips
```

**Test offline:**
1. Chrome DevTools → Network → set **Offline**
2. Upload a photo → see **📶 QUEUED** badge
3. Switch back to **No throttling**
4. Watch auto-upload within 2 seconds ✅

---

## 👨‍💻 Team

**Group 12** — 10 members

| Area | Responsibility | Size |
|------|---------------|------|
| Frontend | React components, UI/UX, responsive layout | 4 members |
| Backend | Server actions, database, RLS policies | 3 members |
| Integration | GPS verification, testing, PWA | 2 members |
| Documentation | README, UML diagrams, presentation | 1 member |

---

## 📄 License

This project was built for academic purposes by Group 12.

---

<div align="center">

**Built with ❤️ in Ghana 🇬🇭**

Next.js + Supabase + TypeScript • Group 12 • 2026

</div>