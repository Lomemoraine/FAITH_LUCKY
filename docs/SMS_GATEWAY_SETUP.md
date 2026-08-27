# 📱 TFL SafeSpace - httpSMS Gateway Setup (Self-Hosted Docker)

This guide explains how to self-host the **httpSMS Gateway** using Docker and connect an Android phone to provide zero-cost SMS capabilities for **TFL SafeSpace**.

---

## 🏗️ Architecture Overview

```
[ TFL SafeSpace Next.js ] ──▶ HTTP POST /v1/messages/send ──▶ [ httpSMS Docker API ]
                                                                       │ (FCM Push)
                                                                       ▼
                                                          [ Android Phone (Local SIM) ]
                                                                       │ (GSM Network)
                                                                       ▼
                                                          [ User / Counselor Phone ]
                                                                       │
                                                          (Incoming SMS / M-Pesa / HELP)
                                                                       │
                                                          [ Android Phone ]
                                                                       │ (HTTP Webhook)
                                                                       ▼
[ TFL SafeSpace Next.js ] ◀── POST /api/webhooks/sms ───────── [ httpSMS Docker API ]
```

---

## 📋 Prerequisites

1. **Server**: A VPS or local machine with **Docker** and **Docker Compose** installed.
2. **Android Phone**: Running Android 6.0+ with a Safaricom or Airtel SIM card (active SMS bundle).
3. **Firebase Project**: Used for sending push notifications from your self-hosted server to the Android app.

---

## 🚀 Step 1: Self-Host httpSMS with Docker

Clone the official open-source repository into your server or docker directory:

```bash
git clone https://github.com/NdoleStudio/httpsms.git
cd httpsms
```

### Configure Environment Variables

```bash
cp api/.env.docker api/.env
cp web/.env.docker web/.env
```

Fill in the `.env` variables (Database, Firebase credentials, SMTP).

### Start the Docker Containers

```bash
docker compose up -d --build
```

The API will now be running on port `8080` (or `http://localhost:8080`).

---

## 📱 Step 2: Install & Connect Android App

1. Download and install the [httpSMS APK](https://github.com/NdoleStudio/httpsms/releases) on your dedicated Android phone.
2. Open the app, set your custom API URL (e.g. `https://sms-api.yourdomain.com` or local IP).
3. Log in with your admin account created during Docker initialization.
4. Keep the phone plugged in to power and connected to Wi-Fi.

---

## ⚙️ Step 3: Configure TFL SafeSpace Environment

Add the following to your `.env.local` in `tfl-safespace`:

```env
# httpSMS Gateway
HTTPSMS_API_URL=http://localhost:8080 # or https://sms-api.yourdomain.com
HTTPSMS_API_KEY=your_generated_api_key
HTTPSMS_FROM_NUMBER=+254712345678
DUTY_COUNSELOR_PHONE=+254700000000
```

---

## 🔄 Step 4: Configure Webhook in httpSMS

In your httpSMS dashboard or settings, set the **Incoming SMS Webhook URL** to:

```text
https://your-safespace-domain.org/api/webhooks/sms
```

---

## 🧪 Testing the Integration

1. **Test Emergency Helpline Reply**:
   - Send an SMS with `HELP` to your SafeSpace Android phone number.
   - You should receive an immediate SMS reply with crisis helpline numbers (*Befrienders, Red Cross 1199*).

2. **Test Voucher Lookup**:
   - Text `VOUCHER <CODE>` to check status offline.

3. **Test Crisis Trigger Alert**:
   - Creating a high-distress post in the app will automatically text the `DUTY_COUNSELOR_PHONE`.
