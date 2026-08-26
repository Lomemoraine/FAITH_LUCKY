-- Migration: Add store products, orders, care vouchers, and 1-on-1 counseling
-- Date: 2026-08-25

-- 1. TFL MERCHANDISE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_kes INT NOT NULL,
    care_perk TEXT NOT NULL,
    therapy_sessions_count INT NOT NULL DEFAULT 1,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'merchandise',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CARE VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    therapy_sessions INT NOT NULL DEFAULT 1,
    perk_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    buyer_phone TEXT,
    redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. STORE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    amount_kes INT NOT NULL,
    phone_number TEXT NOT NULL,
    shipping_address TEXT,
    payment_method TEXT NOT NULL DEFAULT 'mpesa_stk',
    payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    mpesa_receipt_number TEXT,
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. VERIFIED COUNSELORS TABLE
CREATE TABLE IF NOT EXISTS public.counselors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    license_number TEXT NOT NULL,
    specialty TEXT NOT NULL,
    bio TEXT NOT NULL,
    avatar_initials TEXT NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(2,1) NOT NULL DEFAULT 4.9,
    sessions_completed INT NOT NULL DEFAULT 120,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. COUNSELING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.counseling_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    counselor_id TEXT NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    primary_concern TEXT,
    intake_mood TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ
);

-- 6. COUNSELING MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.counseling_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.counseling_sessions(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'counselor', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SEED INITIAL PRODUCTS
INSERT INTO public.products (id, name, description, price_kes, care_perk, therapy_sessions_count, category)
VALUES
  ('hoodie-rose', 'TFL Signature Hope Hoodie', 'Ultra-soft fleece hoodie with discreet embroidered mental health affirmation. Premium warmth and comfort.', 2800, 'Unlocks 2 Private 1-on-1 Counseling Sessions', 2, 'apparel'),
  ('journal-healing', 'Daily Guided Healing & Gratitude Journal', '180-day guided prompts for emotional processing, anxiety tracking, and mindfulness.', 1200, 'Unlocks 1 Private 1-on-1 Counseling Session', 1, 'stationery'),
  ('tee-affirmation', '“You Are Heard” Affirmation T-Shirt', '100% breathable organic cotton tee with minimalist mental wellness badge.', 1500, 'Unlocks 1 Private 1-on-1 Counseling Session', 1, 'apparel'),
  ('bracelet-serenity', 'TFL Serenity Hope Band', 'Matte black and rose-gold engraved band reminding you to breathe and take it one moment at a time.', 650, 'Unlocks 1 Guided Audio Session & Care Pass', 1, 'accessories'),
  ('tote-safespace', 'SafeSpace Canvas Affirmation Tote', 'Heavy-duty eco-friendly canvas bag designed for everyday errands and book carrying.', 950, 'Unlocks 1 Guided Audio Session & Care Pass', 1, 'accessories'),
  ('direct-therapy-pass', 'Direct 1-on-1 Counseling Session (No Merch)', 'Subsidized 45-minute private tele-counseling session with a licensed Kenyan psychologist.', 500, 'Immediate 1-on-1 Therapist Access', 1, 'service')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_kes = EXCLUDED.price_kes,
  care_perk = EXCLUDED.care_perk,
  therapy_sessions_count = EXCLUDED.therapy_sessions_count;

-- SEED INITIAL VERIFIED COUNSELORS
INSERT INTO public.counselors (id, name, title, license_number, specialty, bio, avatar_initials, is_online, rating, sessions_completed)
VALUES
  ('counselor-1', 'Dr. Faith Mwangi', 'Licensed Clinical Psychologist', 'KPsyA-4821', 'Anxiety, Panic & Trauma Support', 'Specialized in cognitive behavioral techniques and trauma-informed compassionate listening for young adults.', 'FM', true, 4.9, 184),
  ('counselor-2', 'David Otieno, MA', 'Certified Counseling Psychologist', 'KPsyA-3109', 'Grief, Career Burnout & Stress', 'Dedicated to helping individuals navigate acute life transitions, workplace overwhelm, and complex loss.', 'DO', true, 4.8, 142),
  ('counselor-3', 'Sarah Chebet, MSc', 'Family & Wellness Specialist', 'KPsyA-5520', 'Relationships, Depression & Self-Esteem', 'Warm, non-judgmental guidance focused on emotional resilience, healthy boundaries, and self-worth restoration.', 'SC', true, 5.0, 210)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  specialty = EXCLUDED.specialty,
  bio = EXCLUDED.bio,
  is_online = EXCLUDED.is_online;
