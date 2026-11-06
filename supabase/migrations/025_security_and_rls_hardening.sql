-- 025: clear the Supabase advisor warnings that matter, without changing behaviour.
--
-- 1. Pin search_path on the helper functions so they can't be hijacked by a
--    same-named object in another schema.
-- 2. handle_new_user is a trigger function; nobody needs to call it over the API.
-- 3. payment-proofs is a public bucket. Files are read through their public URL,
--    which needs no SELECT policy, so the broad SELECT policy only let anyone
--    list every proof screenshot in the bucket. Uploads still work (insert only).
-- 4. Wrap auth.uid() / auth.role() in RLS policies as (select ...) so Postgres
--    evaluates them once per query instead of once per row. Same rules, faster.
--
-- get_invoice_by_token and submit_proof_by_token stay callable without signing in:
-- that is the no-account tenant pay link, and the token is the secret.

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('generate_invoice_number', 'generate_payment_number', 'set_updated_at',
                        'generate_loan_number', 'generate_loan_payment_number')
  loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;

  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end
$$;

drop policy if exists "Public read payment proofs" on storage.objects;
drop policy if exists "Public read access for payment proofs" on storage.objects;

do $$
declare
  p record;
  q text;
  w text;
  sql text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') ~ 'auth\.(uid|role)\(\)' or coalesce(with_check, '') ~ 'auth\.(uid|role)\(\)')
  loop
    q := p.qual;
    w := p.with_check;
    if q is not null and q !~* 'select auth\.' then
      q := regexp_replace(q, 'auth\.(uid|role)\(\)', '(select auth.\1())', 'g');
    end if;
    if w is not null and w !~* 'select auth\.' then
      w := regexp_replace(w, 'auth\.(uid|role)\(\)', '(select auth.\1())', 'g');
    end if;
    sql := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if q is not null then sql := sql || format(' using (%s)', q); end if;
    if w is not null then sql := sql || format(' with check (%s)', w); end if;
    execute sql;
  end loop;
end
$$;
