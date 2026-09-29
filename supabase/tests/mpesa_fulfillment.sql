-- Run AFTER 20260912000002_mpesa_payments.sql. No provider calls; all fixtures roll back.
BEGIN;
DO $$
DECLARE
  buyer UUID := gen_random_uuid();
  attempt UUID := gen_random_uuid();
  product TEXT := 'payment-test-'||gen_random_uuid()::text;
  prepared JSONB;
  repeated JSONB;
  order_id UUID;
  checkout TEXT := 'checkout-test-'||gen_random_uuid()::text;
  merchant TEXT := 'merchant-test-'||gen_random_uuid()::text;
  token_hash TEXT := repeat('a',64);
  event JSONB;
  voucher_one UUID;
  voucher_two UUID;
  rejected BOOLEAN := false;
BEGIN
  INSERT INTO auth.users(id) VALUES(buyer);
  INSERT INTO public.profiles(id,anonymous_handle,status) VALUES(buyer,'test_'||buyer::text,'active');
  INSERT INTO public.products(id,name,description,price_kes,care_perk,therapy_sessions_count,category,is_active)
    VALUES(product,'Payment test','Transaction fixture',500,'One test session',1,'service',true);
  prepared := public.prepare_mpesa_order(buyer,attempt,product,'254712345678','Digital Session','sandbox','174379','174379','CustomerPayBillOnline',token_hash);
  order_id := (prepared->'order'->>'id')::uuid;
  IF prepared->>'isNew'<>'true' OR prepared->'order'->>'payment_status'<>'pending' THEN RAISE EXCEPTION 'FAIL: new order must be pending'; END IF;
  IF (SELECT voucher_id FROM public.orders WHERE id=order_id) IS NOT NULL THEN RAISE EXCEPTION 'FAIL: unpaid voucher issued'; END IF;
  UPDATE public.products SET price_kes=900 WHERE id=product;
  repeated := public.prepare_mpesa_order(buyer,attempt,product,'254712345678','Digital Session','sandbox','174379','174379','CustomerPayBillOnline',repeat('b',64));
  IF repeated->>'isNew'<>'false' OR (repeated->'order'->>'id')::uuid<>order_id
    OR (repeated->'order'->>'amount_kes')::int<>500 THEN RAISE EXCEPTION 'FAIL: retry did not reuse immutable order'; END IF;
  BEGIN
    PERFORM public.prepare_mpesa_order(buyer,attempt,product,'254711111111','Digital Session','sandbox','174379','174379','CustomerPayBillOnline',token_hash);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'Idempotency key belongs to a different checkout' THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: conflicting attempt accepted'; END IF;

  event := jsonb_build_object('checkoutRequestId',checkout,'merchantRequestId',merchant,'resultCode',0,
    'amount',500,'phone','254712345678','receipt','TEST'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)));
  -- Callback may arrive before acceptance is persisted.
  PERFORM public.record_mpesa_callback(order_id,token_hash,event);
  PERFORM public.record_mpesa_acceptance(order_id,checkout,merchant);
  IF (SELECT payment_status FROM public.orders WHERE id=order_id)<>'pending' THEN RAISE EXCEPTION 'FAIL: callback alone completed payment'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.record_mpesa_callback(order_id,token_hash,event||jsonb_build_object('amount',1));
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'Callback payment details mismatch' THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: amount mismatch accepted'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.record_mpesa_callback(order_id,repeat('c',64),event);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'Invalid callback' THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: invalid callback token accepted'; END IF;

  voucher_one := public.finish_mpesa_payment(order_id,checkout,merchant,0,'TEST-PASS-'||gen_random_uuid()::text);
  voucher_two := public.finish_mpesa_payment(order_id,checkout,merchant,0,'TEST-PASS-'||gen_random_uuid()::text);
  PERFORM public.record_mpesa_callback(order_id,token_hash,event);
  IF voucher_one IS NULL OR voucher_one<>voucher_two THEN RAISE EXCEPTION 'FAIL: duplicate fulfillment'; END IF;
  IF (SELECT count(*) FROM public.vouchers WHERE id IN(voucher_one,voucher_two))<>1 THEN RAISE EXCEPTION 'FAIL: incorrect voucher count'; END IF;
  IF (SELECT payment_verified_at FROM public.orders WHERE id=order_id) IS NULL THEN RAISE EXCEPTION 'FAIL: missing verification'; END IF;
  IF has_function_privilege('anon','public.finish_mpesa_payment(uuid,text,text,integer,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.finish_mpesa_payment(uuid,text,text,integer,text)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: public fulfillment access';
  END IF;

  prepared := public.prepare_mpesa_order(buyer,gen_random_uuid(),product,'254712345678','Digital Session','sandbox','174379','174379','CustomerPayBillOnline',token_hash);
  order_id := (prepared->'order'->>'id')::uuid;
  checkout := 'checkout-failed-'||gen_random_uuid()::text;
  PERFORM public.record_mpesa_acceptance(order_id,checkout,merchant);
  PERFORM public.finish_mpesa_payment(order_id,checkout,merchant,1032,'TEST-NO-VOUCHER-'||gen_random_uuid()::text);
  IF (SELECT payment_status FROM public.orders WHERE id=order_id)<>'failed'
    OR (SELECT voucher_id FROM public.orders WHERE id=order_id) IS NOT NULL THEN RAISE EXCEPTION 'FAIL: cancelled payment minted a voucher'; END IF;
  RAISE NOTICE 'PASS: pending checkout, immutable snapshot, idempotency, early callback, token/amount validation, one voucher and cancelled payment';
END; $$;
ROLLBACK;
