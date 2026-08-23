# 🎨 TFL SafeSpace - Design Tokens, Schema & System Specification

## 1. Design System & Theme Tokens

### CSS Variables
```css
:root {
  /* Brand Core */
  --tfl-gold: #c99326;
  --tfl-gold-hover: #b3801d;
  --tfl-gold-light: #fbbf24;
  --tfl-gold-soft: #fef9ee;
  --tfl-gold-border: #f3d48d;

  /* Surfaces & Dark Foundations */
  --tfl-slate-950: #090d16;
  --tfl-slate-900: #0f172a;
  --tfl-slate-800: #1e293b;
  --tfl-slate-700: #334155;
  --tfl-slate-600: #475569;
  --tfl-slate-400: #94a3b8;
  --tfl-slate-100: #f1f5f9;
  --tfl-slate-50: #f8fafc;

  /* Light Theme Surfaces */
  --tfl-bg-light: #faf9f6;
  --tfl-card-light: #ffffff;
  --tfl-border-light: #e2e8f0;

  /* Emotional & Safety Accents */
  --tfl-sage: #10b981;       /* Healing, Recovery, Verified */
  --tfl-sage-light: #ecfdf5;
  --tfl-rose: #f43f5e;       /* Crisis Alert, Empathy, Love */
  --tfl-rose-light: #fff1f2;
  --tfl-sky: #0284c7;        /* Psychologist Portal */
}
```

---

## 2. Supabase Database Schema (PostgreSQL)

```sql
-- 1. Anonymous Users Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_handle TEXT NOT NULL UNIQUE, -- e.g. "GentleEagle82"
  avatar_id TEXT NOT NULL DEFAULT 'avatar-1',
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'psychologist', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Community Topic Rooms
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY, -- e.g. 'anxiety', 'grief', 'relationships'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  post_count INT DEFAULT 0
);

-- 3. Anonymous Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES public.rooms(id),
  content TEXT NOT NULL,
  voice_url TEXT,
  is_flagged_for_crisis BOOLEAN DEFAULT FALSE,
  crisis_severity TEXT DEFAULT 'none', -- 'none', 'moderate', 'critical'
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Post Replies
CREATE TABLE public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TFL Merchandise Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price_kes NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT,
  stock INT DEFAULT 50,
  unlocks_care_pass BOOLEAN DEFAULT TRUE
);

-- 6. Store Orders & M-Pesa Transactions
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  phone_number TEXT NOT NULL,
  mpesa_receipt_number TEXT,
  amount_kes NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'delivered'
  voucher_code TEXT UNIQUE, -- Care Pass code generated for buyer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Psychologist Consultations & Private Chats
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  psychologist_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active', -- 'active', 'completed'
  voucher_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 3. Crisis Keyword Safety Filter Matrix
The crisis detection engine matches high-distress trigger patterns:
* **High Severity Triggers:** Phrases indicating self-harm, ending life, extreme hopelessness.
* **Action:** 
  1. Instantly renders 1-tap **Emergency Crisis Help Banner** on the user's screen.
  2. Flags post into the **Psychologist Crisis Escalation Queue**.
  3. Provides hotline shortcuts (*Befrienders Kenya: +254 722 178 177, Red Cross: 1199*).
