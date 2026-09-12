-- Run in the Supabase SQL editor AFTER all migrations. Fixtures roll back.
-- Success: all assertions pass; no fixture users/sessions remain.
BEGIN;
DO $$
DECLARE
  client_one UUID := gen_random_uuid();
  client_two UUID := gen_random_uuid();
  clinician UUID := gen_random_uuid();
  counselor_key TEXT := 'test-' || gen_random_uuid()::text;
  pass_id UUID := gen_random_uuid();
  first_session JSONB;
  retry_session JSONB;
  rejected BOOLEAN := false;
BEGIN
  INSERT INTO auth.users(id) VALUES(client_one),(client_two),(clinician);
  INSERT INTO public.profiles(id,anonymous_handle,status) VALUES
    (client_one,'test_' || client_one::text,'active'),
    (client_two,'test_' || client_two::text,'active');
  INSERT INTO public.counselors(id,name,title,license_number,specialty,bio,avatar_initials,is_licensed,auth_user_id)
    VALUES(counselor_key,'TEST FIXTURE','TEST ONLY','TEST-ONLY','Test','Test fixture','TT',true,clinician);
  INSERT INTO public.vouchers(id,code,therapy_sessions,perk_description,status,redeemed_by)
    VALUES(pass_id,'TEST-' || pass_id::text,1,'TEST ONLY','redeemed',client_one);

  first_session := public.start_counseling_session(client_one,counselor_key,pass_id,'Test','neutral');
  IF first_session->>'client_id' <> client_one::text THEN RAISE EXCEPTION 'FAIL: wrong client'; END IF;
  retry_session := public.start_counseling_session(client_one,counselor_key,pass_id,'Test retry','neutral');
  IF first_session->>'id' <> retry_session->>'id' THEN RAISE EXCEPTION 'FAIL: retry created duplicate session'; END IF;

  BEGIN
    PERFORM public.start_counseling_session(client_two,counselor_key,pass_id,'Other client','neutral');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Care Pass ownership required' THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: other client used voucher'; END IF;

  UPDATE public.counseling_sessions SET status='completed' WHERE id=(first_session->>'id')::uuid;
  rejected := false;
  BEGIN
    PERFORM public.start_counseling_session(client_one,counselor_key,pass_id,'Exhausted pass','neutral');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Care Pass exhausted' THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: session quota bypassed'; END IF;
  IF (SELECT count(*) FROM public.counseling_sessions WHERE voucher_id=pass_id) <> 1 THEN
    RAISE EXCEPTION 'FAIL: unexpected session count';
  END IF;
  IF has_table_privilege('anon','public.counseling_messages','SELECT') OR
     has_table_privilege('authenticated','public.counseling_messages','SELECT') OR
     has_table_privilege('anon','public.vouchers','SELECT') OR
     has_table_privilege('authenticated','public.orders','SELECT') THEN
    RAISE EXCEPTION 'FAIL: public API roles have sensitive table access';
  END IF;
  RAISE NOTICE 'PASS: ownership, retry deduplication, quota, and restricted table access';
END;
$$;
ROLLBACK;
