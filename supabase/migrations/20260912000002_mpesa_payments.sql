BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS mpesa_environment TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_shortcode TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_party_b TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_transaction_type TEXT,
  ADD COLUMN IF NOT EXISTS checkout_request_id TEXT,
  ADD COLUMN IF NOT EXISTS merchant_request_id TEXT,
  ADD COLUMN IF NOT EXISTS callback_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS callback_payload JSONB,
  ADD COLUMN IF NOT EXISTS therapy_sessions_snapshot INTEGER,
  ADD COLUMN IF NOT EXISTS care_perk_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS initiation_state TEXT NOT NULL DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS payment_result_code INTEGER,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_state TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sms_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sms_next_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_lease_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_lease_token UUID;
ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS orders_buyer_attempt_unique ON public.orders(buyer_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_unique ON public.orders(checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_verified_receipt_unique ON public.orders(mpesa_receipt_number) WHERE payment_verified_at IS NOT NULL AND mpesa_receipt_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_voucher_unique ON public.orders(voucher_id) WHERE payment_verified_at IS NOT NULL AND voucher_id IS NOT NULL;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders,public.vouchers FROM anon,authenticated;
GRANT ALL ON public.orders,public.vouchers TO service_role;

CREATE OR REPLACE FUNCTION public.prepare_mpesa_order(
  p_buyer_id UUID,p_idempotency_key UUID,p_product_id TEXT,p_phone TEXT,p_shipping TEXT,
  p_environment TEXT,p_shortcode TEXT,p_party_b TEXT,p_transaction_type TEXT,p_token_hash TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE product public.products%ROWTYPE; payment public.orders%ROWTYPE; inserted BOOLEAN := false;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_buyer_id AND status='active') THEN RAISE EXCEPTION 'Active profile required'; END IF;
  SELECT * INTO payment FROM public.orders WHERE buyer_id=p_buyer_id AND idempotency_key=p_idempotency_key;
  IF NOT FOUND THEN
    SELECT * INTO product FROM public.products WHERE id=p_product_id AND is_active=true;
    IF NOT FOUND OR product.price_kes<=0 OR product.therapy_sessions_count<=0 THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    IF product.category<>'service' AND length(trim(coalesce(p_shipping,'')))<5 THEN RAISE EXCEPTION 'Shipping address required'; END IF;
    INSERT INTO public.orders(order_number,buyer_id,idempotency_key,product_id,item_name,amount_kes,phone_number,shipping_address,
      payment_status,mpesa_environment,mpesa_shortcode,mpesa_party_b,mpesa_transaction_type,callback_token_hash,therapy_sessions_snapshot,care_perk_snapshot)
    VALUES('TFL-'||upper(replace(gen_random_uuid()::text,'-','')),p_buyer_id,p_idempotency_key,product.id,product.name,product.price_kes,p_phone,p_shipping,
      'pending',p_environment,p_shortcode,p_party_b,p_transaction_type,p_token_hash,product.therapy_sessions_count,product.care_perk)
    ON CONFLICT DO NOTHING RETURNING * INTO payment;
    inserted := FOUND;
    IF NOT inserted THEN SELECT * INTO payment FROM public.orders WHERE buyer_id=p_buyer_id AND idempotency_key=p_idempotency_key; END IF;
  END IF;
  IF payment.id IS NULL THEN RAISE EXCEPTION 'Order could not be created'; END IF;
  IF payment.product_id IS DISTINCT FROM p_product_id OR payment.phone_number IS DISTINCT FROM p_phone
    OR coalesce(payment.shipping_address,'')<>coalesce(p_shipping,'') OR payment.mpesa_environment IS DISTINCT FROM p_environment THEN
    RAISE EXCEPTION 'Idempotency key belongs to a different checkout';
  END IF;
  RETURN jsonb_build_object('order',to_jsonb(payment),'isNew',inserted);
END; $$;

CREATE OR REPLACE FUNCTION public.record_mpesa_callback(p_order_id UUID,p_token_hash TEXT,p_event JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payment public.orders%ROWTYPE;
BEGIN
  SELECT * INTO payment FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR payment.callback_token_hash IS DISTINCT FROM p_token_hash THEN RAISE EXCEPTION 'Invalid callback'; END IF;
  IF (payment.checkout_request_id IS NOT NULL AND payment.checkout_request_id<>p_event->>'checkoutRequestId')
    OR (payment.merchant_request_id IS NOT NULL AND payment.merchant_request_id<>p_event->>'merchantRequestId') THEN RAISE EXCEPTION 'Callback identifier mismatch'; END IF;
  IF (p_event->>'resultCode')::int=0 AND ((p_event->>'amount')::numeric IS DISTINCT FROM payment.amount_kes
    OR p_event->>'phone' IS DISTINCT FROM payment.phone_number OR p_event->>'receipt' IS NULL) THEN RAISE EXCEPTION 'Callback payment details mismatch'; END IF;
  -- A failed or duplicate notification must not overwrite an existing success event.
  UPDATE public.orders SET checkout_request_id=p_event->>'checkoutRequestId',merchant_request_id=p_event->>'merchantRequestId',
    payment_status=CASE WHEN payment_status='failed' AND (p_event->>'resultCode')::int=0 THEN 'pending' ELSE payment_status END,
    initiation_state='accepted', callback_payload=CASE WHEN callback_payload->>'resultCode'='0' THEN callback_payload ELSE p_event END,
    mpesa_receipt_number=CASE WHEN payment_verified_at IS NOT NULL AND (p_event->>'resultCode')::int=0 THEN p_event->>'receipt' ELSE mpesa_receipt_number END
    WHERE id=p_order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_mpesa_check(p_order_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.orders SET next_check_at=now()+interval '15 seconds'
    WHERE id=p_order_id AND payment_status='pending' AND checkout_request_id IS NOT NULL
      AND (next_check_at IS NULL OR next_check_at<=now());
  RETURN FOUND;
END; $$;

CREATE OR REPLACE FUNCTION public.finish_mpesa_payment(
  p_order_id UUID,p_checkout_id TEXT,p_merchant_id TEXT,p_result_code INTEGER,p_voucher_code TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payment public.orders%ROWTYPE; voucher UUID; receipt TEXT;
BEGIN
  SELECT * INTO payment FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR payment.checkout_request_id IS DISTINCT FROM p_checkout_id
    OR payment.merchant_request_id IS DISTINCT FROM p_merchant_id THEN RAISE EXCEPTION 'Payment correlation failed'; END IF;
  IF payment.payment_status='completed' AND payment.payment_verified_at IS NOT NULL THEN RETURN payment.voucher_id; END IF;
  IF payment.payment_status<>'pending' THEN RAISE EXCEPTION 'Payment already terminal or unverified legacy order'; END IF;
  IF p_result_code IS NULL THEN RAISE EXCEPTION 'Provider result required'; END IF;
  IF p_result_code<>0 THEN
    UPDATE public.orders SET payment_status='failed',payment_result_code=p_result_code WHERE id=p_order_id;
    RETURN NULL;
  END IF;
  IF payment.therapy_sessions_snapshot IS NULL OR payment.therapy_sessions_snapshot<=0 THEN RAISE EXCEPTION 'Missing entitlement snapshot'; END IF;
  receipt := CASE WHEN payment.callback_payload->>'resultCode'='0' THEN payment.callback_payload->>'receipt' ELSE NULL END;
  INSERT INTO public.vouchers(code,therapy_sessions,perk_description,buyer_phone,status)
    VALUES(p_voucher_code,payment.therapy_sessions_snapshot,payment.care_perk_snapshot,payment.phone_number,'active') RETURNING id INTO voucher;
  UPDATE public.orders SET payment_status='completed',payment_verified_at=now(),payment_result_code=0,
    voucher_id=voucher,mpesa_receipt_number=receipt WHERE id=p_order_id;
  RETURN voucher;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_mpesa_sms(p_order_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE token UUID := gen_random_uuid();
BEGIN
  UPDATE public.orders SET sms_lease_token=token,sms_lease_until=now()+interval '2 minutes',sms_attempts=sms_attempts+1
    WHERE id=p_order_id AND payment_status='completed' AND payment_verified_at IS NOT NULL AND sms_state<>'sent'
      AND sms_attempts<5 AND (sms_next_attempt_at IS NULL OR sms_next_attempt_at<=now())
      AND (sms_lease_until IS NULL OR sms_lease_until<=now());
  IF FOUND THEN RETURN token; END IF;
  RETURN NULL;
END; $$;

REVOKE ALL ON FUNCTION public.prepare_mpesa_order(UUID,UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.record_mpesa_callback(UUID,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_mpesa_check(UUID) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_mpesa_payment(UUID,TEXT,TEXT,INTEGER,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_mpesa_sms(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_mpesa_order(UUID,UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_mpesa_callback(UUID,TEXT,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_mpesa_check(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_mpesa_payment(UUID,TEXT,TEXT,INTEGER,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_mpesa_sms(UUID) TO service_role;
CREATE OR REPLACE FUNCTION public.record_mpesa_acceptance(p_order_id UUID,p_checkout_id TEXT,p_merchant_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payment public.orders%ROWTYPE;
BEGIN
  SELECT * INTO payment FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR (payment.checkout_request_id IS NOT NULL AND payment.checkout_request_id<>p_checkout_id)
    OR (payment.merchant_request_id IS NOT NULL AND payment.merchant_request_id<>p_merchant_id) THEN RAISE EXCEPTION 'Request correlation conflict'; END IF;
  UPDATE public.orders SET checkout_request_id=p_checkout_id,merchant_request_id=p_merchant_id,initiation_state='accepted' WHERE id=p_order_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_mpesa_acceptance(UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_mpesa_acceptance(UUID,TEXT,TEXT) TO service_role;
COMMIT;
