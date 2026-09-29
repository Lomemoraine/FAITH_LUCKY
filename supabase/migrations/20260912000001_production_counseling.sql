-- Apply before deploying the counseling persistence changes.
BEGIN;

ALTER TABLE public.counselors ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.counselors ADD COLUMN IF NOT EXISTS show_license_number BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.counselors ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS counselors_auth_user_id_unique ON public.counselors(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Existing sample counselors are not automatically approved as real clinicians.
ALTER TABLE public.counselors ALTER COLUMN is_online SET DEFAULT false;
ALTER TABLE public.counselors ALTER COLUMN rating SET DEFAULT 0;
ALTER TABLE public.counselors ALTER COLUMN sessions_completed SET DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'pending';

-- These records are accessed through authenticated server routes, never directly
-- with the public Supabase key. Service-role requests retain access.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders, public.vouchers, public.counseling_sessions,
  public.counseling_messages, public.counselors, public.products FROM anon, authenticated;
GRANT ALL ON public.orders, public.vouchers, public.counseling_sessions,
  public.counseling_messages, public.counselors, public.products TO service_role;

CREATE INDEX IF NOT EXISTS counseling_sessions_voucher_idx ON public.counseling_sessions(voucher_id);
CREATE INDEX IF NOT EXISTS counseling_messages_session_idx ON public.counseling_messages(session_id, created_at, id);

CREATE OR REPLACE FUNCTION public.start_counseling_session(
  p_client_id UUID, p_counselor_id TEXT, p_voucher_id UUID,
  p_primary_concern TEXT, p_intake_mood TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pass public.vouchers%ROWTYPE;
  consultation public.counseling_sessions%ROWTYPE;
  used_count INTEGER;
BEGIN
  -- Serializes all bookings against this voucher, including simultaneous requests.
  SELECT * INTO pass FROM public.vouchers WHERE id = p_voucher_id FOR UPDATE;
  IF NOT FOUND OR pass.status <> 'redeemed' OR pass.redeemed_by IS DISTINCT FROM p_client_id THEN
    RAISE EXCEPTION 'Care Pass ownership required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id AND status = 'active') THEN
    RAISE EXCEPTION 'Active client required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.counselors WHERE id = p_counselor_id AND is_licensed = true AND auth_user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Verified counselor account required';
  END IF;
  SELECT * INTO consultation FROM public.counseling_sessions
    WHERE voucher_id = p_voucher_id AND client_id = p_client_id
      AND counselor_id = p_counselor_id AND status = 'active'
    ORDER BY created_at LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(consultation); END IF;
  SELECT count(*) INTO used_count FROM public.counseling_sessions WHERE voucher_id = p_voucher_id;
  IF used_count >= pass.therapy_sessions THEN RAISE EXCEPTION 'Care Pass exhausted'; END IF;
  INSERT INTO public.counseling_sessions(client_id,counselor_id,voucher_id,primary_concern,intake_mood,status)
    VALUES(p_client_id,p_counselor_id,p_voucher_id,p_primary_concern,p_intake_mood,'active') RETURNING * INTO consultation;
  RETURN to_jsonb(consultation);
END;
$$;
REVOKE ALL ON FUNCTION public.start_counseling_session(UUID,TEXT,UUID,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_counseling_session(UUID,TEXT,UUID,TEXT,TEXT) TO service_role;

COMMIT;
