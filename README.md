# 🌟 I'm TFL SafeSpace
> *"Talk freely. While heard freely. Stay anonymous."*

**TFL SafeSpace** is an anonymous mental health community hub and tele-support platform built for **Team Faith Lucky (TFL)**. It provides a warm, safe sanctuary for people to express emotions, share personal struggles, connect with verified psychologists, and support the brand through mental health merchandise.

---

## 🎨 Official Brand Theme & Color System

| Token | Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| `--tfl-gold` | **TFL Royal Gold** | `#C99326` | Primary Brand Color, CTA Buttons, Active Highlights |
| `--tfl-gold-light`| **Warm Honey** | `#FBBF24` | Accents, Badges, Glows, Focus states |
| `--tfl-gold-soft` | **Gold Whisper** | `#FEF9EE` | Soft notification boxes, subtle pill backgrounds |
| `--tfl-slate-900` | **Basalt Obsidian**| `#0F172A` | Primary Dark Headings, Navbar, Dark theme surface |
| `--tfl-slate-800` | **Midnight Navy** | `#1E293B` | Card surfaces, Hero gradients, Modals |
| `--tfl-sand` | **Warm Linen** | `#F8FAF6` | Clean page backgrounds (Warm & calming) |
| `--tfl-sage` | **Healing Sage** | `#10B981` | Mental health recovery indicators, Verified badges |
| `--tfl-rose` | **Empathetic Rose**| `#F43F5E` | Urgent crisis support button, Love reactions |

---

## 👥 Core System Personas

### 1. 👤 Anonymous Community User
* **100% Anonymous:** Auto-generated pseudonyms (e.g., *HopefulCheetah9*, *SilentRiver4*) + custom avatar selection.
* **Topic Hubs (Rooms):** Anxiety, Stress & Burnout, Grief & Loss, Relationships, Daily Wins, Depression.
* **Empathetic Feeds:** Text & voice posts, empathetic reactions (❤️ Empathy, 🫂 Virtual Hug, 💡 Insight, 🙏 Prayers), threaded replies.
* **Emergency Crisis Button:** Instant 1-tap dialer for Kenyan mental health & emergency crisis hotlines.
* **"Merch-to-Care" Unlock:** Entering an M-Pesa order voucher code unlocks free 1-on-1 private therapist consultations.
* **1-on-1 Secure Chat:** Direct, encrypted messaging with verified counselors.

### 2. 🩺 Verified Psychologist / Counselor
* **Therapist Portal:** Onboarding with credentials vetting.
* **Crisis Escalation Queue:** Review posts automatically flagged for severe distress.
* **Direct Consultation Desk:** Private 1-on-1 chats and scheduling.

### 3. 🛍️ TFL Merchandise Store
* **Product Catalog:** T-Shirts, Hoodies, Mental Health Journals, Bracelets.
* **Automated M-Pesa Checkout (STK Push):** Customers pay seamlessly via phone.
* **Care Pass Generator:** Every merchandise order automatically creates a Care Pass code.
* **Direct Booking Alternative:** Option to pay directly for therapy without buying merchandise.

### 4. 🛡️ Admin & Safety Command Center
* **Automated Crisis Flagging:** Keyword engine detects self-harm/severe pain terms and alerts psychologists.
* **Content Moderation:** Pin, lock, or delete posts, manage user bans.
* **Store Management:** Track customer orders, payments, and delivery details.
* **Counselor Approvals:** Onboard and manage verified therapists.

---

## 🏗️ Architecture & Cloud Infrastructure

* **Frontend:** Next.js 14 (App Router) + React + TailwindCSS (Mobile-first PWA).
* **Hosting:** **Vercel** (Global Edge CDN, SSL, 100% Free Tier).
* **Database & Realtime:** **Supabase** (PostgreSQL, Row Level Security, WebSockets, Free Tier).
* **Payments:** Safaricom Daraja M-Pesa API (STK Push).
* **Domain:** Custom domain (.com / .co.ke) + automated HTTPS.

---

## 🚀 Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Run the local development server
npm run dev

# 3. Open browser at http://localhost:3000
```

---

## 📱 Progressive Web App (PWA) Setup
Users can install TFL SafeSpace directly to their Android and iOS home screens:
* **Android:** Tap **"Install TFL SafeSpace"** when prompted.
* **iPhone:** Tap **Share** ➔ **"Add to Home Screen"**.
