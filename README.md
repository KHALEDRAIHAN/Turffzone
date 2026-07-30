# ⚽ TurfZone — Bangladesh's #1 Turf Booking Platform

<div align="center">

![TurfZone Banner](https://img.shields.io/badge/TurfZone-Bangladesh-emerald?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMGI5ODEiLz48L3N2Zz4=)

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Find turfs · Book slots · Buy gear · Watch live scores**

[Live Demo](https://turfzone.vercel.app) · [Report Bug](https://github.com/yourusername/turfzone/issues) · [Request Feature](https://github.com/yourusername/turfzone/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Revenue Model](#-revenue-model)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏟️ About

TurfZone is a full-stack sports platform built for the Bangladesh market. It connects turf owners with players — letting users discover and book futsal, football, and cricket turfs near them, buy sports gear, join tournaments, and follow live international football scores all in one place.

Built as a production-grade, commercially viable web application with a mobile-first design and a clear path to revenue from day one.

---

## ✨ Features

### For Players
- 🔍 **Turf Discovery** — Browse turfs by city, area, sport, and amenities with real-time availability
- 📍 **Interactive Map** — Leaflet-powered map showing all turfs with live slot status
- 📅 **Slot Booking** — Real-time slot availability with booked slots locked out instantly
- 💳 **Online Payment** — Secure checkout via SSLCommerz (bKash, Nagad, Visa, Mastercard, bank transfer)
- 🎟️ **Offer Codes** — Apply discount codes at checkout with real-time price preview
- ⚡ **Dynamic Pricing** — Weekend rates (+30%) and peak hour pricing (+20%, 5–9 PM) applied automatically
- ✉️ **Email Confirmations** — Booking confirmation with full receipt sent instantly via Resend
- ⏱️ **5-Minute Cancellation** — Free cancellation window with live countdown timer
- 🛒 **Sports Marketplace** — Buy jerseys, balls, shoes, and equipment with cart and checkout
- 🏆 **Tournaments** — Browse, register for, and create local tournaments
- 🔴 **Live Scores** — Real-time FIFA World Cup 2026 scores + UCL, EPL, La Liga, Bundesliga via api-football

### For Turf Owners
- 🏟️ **Turf Listing** — 3-step listing form with multiple photo upload (up to 8 images)
- 📊 **Owner Dashboard** — Bookings overview, revenue tracking, slot manager
- 🔔 **Booking Notifications** — Email alert with player details and earnings breakdown every time a slot is booked
- 🏷️ **Offers System** — Create % or fixed discount codes with expiry dates and usage limits
- 💰 **Earnings View** — See gross booking amount, platform fee, and your net earning per booking

### For Admins
- 🖥️ **Admin Panel** — Dark-themed control panel separate from the main site
- ✅ **Turf Approval** — Review and approve/reject new turf submissions
- 👥 **User Management** — View all registered users with roles
- 📦 **Product Management** — Add/edit/delete marketplace products with image upload to Supabase Storage
- 📈 **Platform Revenue** — Track all booking fees and product margins in one dashboard
- 🔄 **Order Status** — Update order status (processing → shipped → delivered) with instant user dashboard sync

### Security
- 🔐 **Row Level Security** — Supabase RLS on every table — users only see their own data
- 🛡️ **Server-side payment validation** — SSLCommerz IPN + server validation before any booking is confirmed
- 🔒 **Pending booking system** — Booking data held server-side during payment redirect to prevent client tampering
- ⛔ **Double-booking prevention** — Unique index on `turf_id + booking_date + start_time`
- 👤 **Role-based routing** — Players, owners, and admins each have separate layouts and protected routes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router, JavaScript) |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Storage** | Supabase Storage (turf images, product images) |
| **Payments** | SSLCommerz (sandbox + live) |
| **Email** | Resend |
| **Maps** | Leaflet + react-leaflet |
| **Live Scores** | api-football v3 via RapidAPI |
| **Deployment** | Vercel |

---

## 📸 Screenshots

| Homepage | Turf Listing | Booking |
|---|---|---|
| Live World Cup scoreboard + turf cards | Filter by city, area, sport, price | Slot picker with dynamic pricing |

| Owner Dashboard | Admin Panel | Marketplace |
|---|---|---|
| Revenue chart + booking list | Turf approval + product management | Cart with offer code support |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- A [Supabase](https://supabase.com) account (free)
- A [Resend](https://resend.com) account (free — 3,000 emails/month)
- A [RapidAPI](https://rapidapi.com) account for live scores (free tier)
- SSLCommerz sandbox credentials ([register here](https://developer.sslcommerz.com/registration/))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/turfzone.git
cd turfzone

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Fill in your keys (see Environment Variables section)

# 4. Run the SQL schema in your Supabase SQL Editor
# (copy from /docs/schema.sql)

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (email)
RESEND_API_KEY=re_your_key

# SSLCommerz (payments)
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false
NEXT_PUBLIC_APP_URL=http://localhost:3000

# RapidAPI (live football scores)
RAPIDAPI_KEY=your_rapidapi_key

# Platform config
NEXT_PUBLIC_PLATFORM_FEE_PERCENT=8
```

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` is used server-side only in API routes. Never expose it to the client.

---

## 🗄️ Database Schema

Core tables in Supabase:

```
profiles          — extends auth.users with role, phone, full_name
turfs             — turf listings with pricing, location, amenities
turf_images       — multiple images per turf (Supabase Storage URLs)
bookings          — confirmed bookings with payment status and transaction IDs
pending_bookings  — temporary store during SSLCommerz payment redirect
orders            — marketplace orders with items JSON
products          — shop inventory managed by admin
offers            — discount codes per turf with usage tracking
platform_earnings — tracks 8% fee per booking and product margin
reviews           — player ratings and comments per turf
tournaments       — tournament listings
```

Run the full schema from `docs/schema.sql` in your Supabase SQL Editor to set up all tables, RLS policies, storage buckets, and seed data.

---

## 📁 Project Structure

```
turfzone/
├── src/
│   ├── app/
│   │   ├── page.js                    # Homepage with live scoreboard
│   │   ├── turfs/
│   │   │   ├── page.js                # Turf listing with filters
│   │   │   └── [id]/page.js           # Turf detail + booking widget
│   │   ├── shop/
│   │   │   ├── page.js                # Marketplace
│   │   │   └── checkout/page.js       # Checkout flow
│   │   ├── booking/
│   │   │   ├── success/page.js        # Payment success
│   │   │   └── failed/page.js         # Payment failure
│   │   ├── dashboard/
│   │   │   ├── page.js                # User dashboard
│   │   │   └── profile/page.js        # Edit profile
│   │   ├── owner/
│   │   │   ├── layout.js              # Owner-specific navbar
│   │   │   ├── page.js                # Owner dashboard
│   │   │   ├── register/page.js       # List a turf (3-step form)
│   │   │   └── offers/page.js         # Manage discount codes
│   │   ├── admin/
│   │   │   ├── layout.js              # Dark admin navbar
│   │   │   ├── page.js                # Admin panel
│   │   │   └── products/page.js       # Product management
│   │   ├── auth/
│   │   │   ├── page.js                # Login / signup / Google OAuth
│   │   │   └── callback/route.js      # OAuth callback handler
│   │   ├── map/page.js                # Interactive Leaflet map
│   │   ├── scores/page.js             # Full live scores page
│   │   ├── tournaments/
│   │   │   ├── page.js                # Tournament listing
│   │   │   └── create/page.js         # Create tournament
│   │   └── api/
│   │       ├── live-scores/route.js   # FIFA WC + league scores proxy
│   │       ├── send-booking/route.js  # Email notifications
│   │       └── payment/
│   │           ├── initiate/route.js  # Start SSLCommerz session
│   │           ├── success/route.js   # Validate + confirm booking
│   │           ├── fail/route.js      # Handle payment failure
│   │           ├── cancel/route.js    # Handle cancellation
│   │           └── ipn/route.js       # Instant payment notification
│   ├── components/
│   │   ├── Navbar.js                  # Role-aware navigation
│   │   ├── ConditionalLayout.js       # Excludes admin/owner from main layout
│   │   ├── WorldCupScoreboard.js      # Live scoreboard widget
│   │   └── MapView.js                 # Leaflet map component
│   └── lib/
│       ├── supabase.js                # Supabase browser client
│       └── sendEmail.js               # Email helper functions
```

---

## 💰 Revenue Model

TurfZone is designed to generate revenue from day one:

| Stream | Details |
|---|---|
| **Booking commission** | 8% platform fee on every confirmed booking, tracked in `platform_earnings` |
| **Marketplace margin** | 15–20% margin on sports goods sold through the shop |
| **Featured listings** | Turf owners pay to appear at the top of search results |
| **Tournament hosting** | Fee per tournament created through the platform |

With 500 bookings/month at ৳3,000 average and 8% fee = **৳1.2 lakh/month** at early stage. Scales linearly with turf and player growth.

---

## 🚢 Deployment

### Deploy to Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables → add all from .env.local
```

### Update SSLCommerz for production

In `.env.local` (production):
```env
SSLCOMMERZ_IS_LIVE=true
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Update Google OAuth for production

In Google Cloud Console → Credentials → your OAuth client:
- Add `https://yourdomain.com/auth/callback` to Authorized redirect URIs

### Update Supabase for production

Supabase → Authentication → URL Configuration:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/callback`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) — for the incredible free tier that makes this possible
- [api-football](https://rapidapi.com/api-sports/api/api-football) — for live football data
- [SSLCommerz](https://www.sslcommerz.com) — for Bangladesh payment gateway
- [Resend](https://resend.com) — for transactional email
- [Leaflet](https://leafletjs.com) — for the open-source map

---

<div align="center">
  Made with ❤️ for Bangladesh · <a href="https://turfzone.vercel.app">turfzone.vercel.app</a>
</div>
