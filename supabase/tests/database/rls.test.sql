begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select extensions.ok(
  not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname not like 'spatial_ref_sys'
      and not c.relrowsecurity
  ),
  'every public application table has row-level security enabled'
);

select extensions.ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  ),
  'the exposed public schema contains no security-definer functions'
);

select extensions.ok(
  to_regclass('public.top_up_requests') is not null,
  'top-up requests are persisted in a dedicated RLS table'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.top_up_requests', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.top_up_requests', 'DELETE'),
  'authenticated clients cannot directly review or delete top-up requests'
);

select extensions.ok(
  (
    select count(*) = 3
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in ('approve_top_up','reject_top_up','checkout_and_hold')
      and p.prosecdef
  ),
  'financial mutations run through private security-definer routines'
);

select extensions.ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'postings'
      and t.tgname = 'postings_balanced' and t.tgdeferrable
  ),
  'journal balance is checked by a deferred constraint trigger'
);

select extensions.ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and tablename = 'top_up_requests'
      and indexname = 'top_up_unique_transfer_reference'
  ),
  'transfer references are protected against duplicate credit'
);

select * from extensions.finish();
rollback;
