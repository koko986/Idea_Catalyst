begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

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

select * from extensions.finish();
rollback;
