create type public.top_up_status as enum ('pending','approved','rejected','cancelled');

create sequence public.top_up_request_number_seq start 1000;
create sequence public.order_number_seq start 3000;

alter table public.listings
  add column slug text unique check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create table public.top_up_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique
    default ('TP-' || lpad(nextval('public.top_up_request_number_seq')::text, 6, '0')),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_mmk bigint not null check (amount_mmk between 1000 and 100000000),
  transfer_method text not null
    check (transfer_method in ('bank_transfer','kpay','wavepay','aya_pay')),
  transfer_reference text not null check (char_length(trim(transfer_reference)) between 4 and 80),
  evidence_path text not null check (evidence_path like user_id::text || '/top-ups/%'),
  status public.top_up_status not null default 'pending',
  rejection_reason text check (rejection_reason is null or char_length(trim(rejection_reason)) between 3 and 500),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  journal_entry_id uuid unique references public.journal_entries(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null and journal_entry_id is null)
    or (status = 'approved' and reviewed_by is not null and reviewed_at is not null and journal_entry_id is not null and rejection_reason is null)
    or (status = 'rejected' and reviewed_by is not null and reviewed_at is not null and journal_entry_id is null and rejection_reason is not null)
    or (status = 'cancelled' and reviewed_by is null and reviewed_at is null and journal_entry_id is null)
  )
);

create unique index top_up_unique_transfer_reference
  on public.top_up_requests (transfer_method, lower(trim(transfer_reference)));
create index top_up_user_created on public.top_up_requests(user_id, created_at desc);
create index top_up_pending_created on public.top_up_requests(created_at)
  where status = 'pending';

create trigger top_up_requests_updated
  before update on public.top_up_requests
  for each row execute function private.updated_at();

create or replace function private.enforce_top_up_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status <> 'pending' or new.status not in ('approved','rejected','cancelled') then
    raise exception 'invalid_top_up_transition';
  end if;
  if new.user_id is distinct from old.user_id
    or new.amount_mmk is distinct from old.amount_mmk
    or new.transfer_method is distinct from old.transfer_method
    or new.transfer_reference is distinct from old.transfer_reference
    or new.evidence_path is distinct from old.evidence_path
    or new.request_number is distinct from old.request_number
    or new.created_at is distinct from old.created_at then
    raise exception 'top_up_identity_is_immutable';
  end if;
  return new;
end;
$$;

create trigger top_up_requests_transition
  before update on public.top_up_requests
  for each row execute function private.enforce_top_up_transition();

alter table public.top_up_requests enable row level security;
create policy top_up_owner_read on public.top_up_requests for select to authenticated
  using (user_id = auth.uid() or private.is_admin());
create policy top_up_owner_create on public.top_up_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

revoke update, delete on public.top_up_requests from authenticated;
grant select, insert on public.top_up_requests to authenticated;
grant usage, select on sequence public.top_up_request_number_seq to authenticated;

alter table public.ledger_accounts
  add constraint ledger_account_scope check (
    (kind = 'user_available' and owner_id is not null and order_id is null)
    or (kind = 'order_escrow' and owner_id is null and order_id is not null)
    or (kind in ('platform_clearing','platform_fee') and owner_id is null and order_id is null)
  );
alter table public.postings
  add constraint one_posting_per_account unique (entry_id, account_id);

create or replace function private.prevent_ledger_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'ledger_rows_are_append_only';
end;
$$;

create trigger journal_entries_immutable
  before update or delete on public.journal_entries
  for each row execute function private.prevent_ledger_mutation();
create trigger ledger_accounts_immutable
  before update or delete on public.ledger_accounts
  for each row execute function private.prevent_ledger_mutation();
create trigger postings_immutable
  before update or delete on public.postings
  for each row execute function private.prevent_ledger_mutation();

create or replace function private.assert_balanced_entry()
returns trigger language plpgsql set search_path = '' as $$
declare target_entry uuid := coalesce(new.entry_id, old.entry_id);
declare posting_count integer;
declare posting_total bigint;
begin
  select count(*), coalesce(sum(amount_mmk), 0)
    into posting_count, posting_total
  from public.postings
  where entry_id = target_entry;
  if posting_count < 2 or posting_total <> 0 then
    raise exception 'journal_entry_not_balanced';
  end if;
  return null;
end;
$$;

create constraint trigger postings_balanced
  after insert on public.postings
  deferrable initially deferred
  for each row execute function private.assert_balanced_entry();

create or replace function private.wallet_available_balance(p_user_id uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select coalesce(sum(p.amount_mmk), 0)::bigint
  from public.ledger_accounts a
  left join public.postings p on p.account_id = a.id
  where a.owner_id = p_user_id and a.kind = 'user_available';
$$;

create or replace function private.wallet_held_balance(p_user_id uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select coalesce(sum(p.amount_mmk), 0)::bigint
  from public.orders o
  join public.ledger_accounts a on a.order_id = o.id and a.kind = 'order_escrow'
  left join public.postings p on p.account_id = a.id
  where o.buyer_id = p_user_id and o.status not in ('released','refunded','cancelled');
$$;

create view public.wallet_balances
with (security_invoker = true) as
select
  p.id as user_id,
  coalesce((
    select sum(po.amount_mmk)
    from public.ledger_accounts a
    join public.postings po on po.account_id = a.id
    where a.owner_id = p.id and a.kind = 'user_available'
  ), 0)::bigint as available_mmk,
  coalesce((
    select sum(po.amount_mmk)
    from public.orders o
    join public.ledger_accounts a on a.order_id = o.id and a.kind = 'order_escrow'
    join public.postings po on po.account_id = a.id
    where o.buyer_id = p.id and o.status not in ('released','refunded','cancelled')
  ), 0)::bigint as held_mmk
from public.profiles p
where p.id = auth.uid() or private.is_admin();

grant select on public.wallet_balances to authenticated;

create or replace function private.approve_top_up(p_request_id uuid)
returns public.top_up_requests
language plpgsql security definer set search_path = '' as $$
declare request_row public.top_up_requests;
declare available_account uuid;
declare clearing_account uuid;
declare entry_id uuid;
begin
  if not private.is_admin() then raise exception 'admin_required'; end if;

  select * into request_row
  from public.top_up_requests
  where id = p_request_id
  for update;

  if request_row.id is null then raise exception 'top_up_not_found'; end if;
  if request_row.status <> 'pending' then raise exception 'top_up_already_reviewed'; end if;

  insert into public.ledger_accounts(owner_id, kind)
    values(request_row.user_id, 'user_available')
    on conflict (owner_id, order_id, kind, currency) do nothing;
  insert into public.ledger_accounts(kind)
    values('platform_clearing')
    on conflict (owner_id, order_id, kind, currency) do nothing;

  select id into available_account from public.ledger_accounts
    where owner_id = request_row.user_id and kind = 'user_available';
  select id into clearing_account from public.ledger_accounts
    where owner_id is null and order_id is null and kind = 'platform_clearing';

  insert into public.journal_entries(
    kind, reference, user_id, evidence_path, idempotency_key, created_by
  ) values (
    'top_up', request_row.request_number, request_row.user_id, request_row.evidence_path,
    'top-up:' || request_row.id::text, auth.uid()
  ) returning id into entry_id;

  insert into public.postings(entry_id, account_id, amount_mmk) values
    (entry_id, clearing_account, -request_row.amount_mmk),
    (entry_id, available_account, request_row.amount_mmk);

  update public.top_up_requests
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), journal_entry_id = entry_id
    where id = request_row.id
    returning * into request_row;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
    values(auth.uid(), 'top_up.approved', 'top_up_request', request_row.id::text,
      jsonb_build_object('amount_mmk', request_row.amount_mmk, 'journal_entry_id', entry_id));
  return request_row;
end;
$$;

create or replace function private.reject_top_up(p_request_id uuid, p_reason text)
returns public.top_up_requests
language plpgsql security definer set search_path = '' as $$
declare request_row public.top_up_requests;
begin
  if not private.is_admin() then raise exception 'admin_required'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'rejection_reason_required'; end if;

  select * into request_row
  from public.top_up_requests
  where id = p_request_id
  for update;

  if request_row.id is null then raise exception 'top_up_not_found'; end if;
  if request_row.status <> 'pending' then raise exception 'top_up_already_reviewed'; end if;

  update public.top_up_requests
    set status = 'rejected', rejection_reason = trim(p_reason),
        reviewed_by = auth.uid(), reviewed_at = now()
    where id = request_row.id
    returning * into request_row;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
    values(auth.uid(), 'top_up.rejected', 'top_up_request', request_row.id::text,
      jsonb_build_object('reason', request_row.rejection_reason));
  return request_row;
end;
$$;

create or replace function private.checkout_and_hold(
  p_listing_id uuid,
  p_trial_mode boolean default false,
  p_offer_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare listing_row public.listings;
declare offer_row public.offers;
declare purchase_price bigint;
declare order_id uuid;
declare available_account uuid;
declare escrow_account uuid;
declare entry_id uuid;
declare current_balance bigint;
declare order_reference text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into listing_row from public.listings where id = p_listing_id for update;
  if listing_row.id is null then raise exception 'listing_not_found'; end if;
  if listing_row.seller_id = auth.uid() then raise exception 'cannot_buy_own_listing'; end if;
  if p_trial_mode and not listing_row.trial_eligible then raise exception 'trial_not_available'; end if;

  if p_offer_id is not null then
    select * into offer_row from public.offers where id = p_offer_id for update;
    if offer_row.id is null or offer_row.listing_id <> listing_row.id
      or offer_row.buyer_id <> auth.uid() or offer_row.status <> 'confirmed' then
      raise exception 'confirmed_offer_required';
    end if;
    if listing_row.status <> 'reserved' then raise exception 'listing_not_reserved'; end if;
    purchase_price := offer_row.amount_mmk;
  else
    if listing_row.status <> 'active' then raise exception 'listing_not_available'; end if;
    purchase_price := listing_row.price_mmk;
  end if;

  insert into public.ledger_accounts(owner_id, kind)
    values(auth.uid(), 'user_available')
    on conflict (owner_id, order_id, kind, currency) do nothing;
  select id into available_account from public.ledger_accounts
    where owner_id = auth.uid() and kind = 'user_available'
    for update;

  current_balance := private.wallet_available_balance(auth.uid());
  if current_balance < purchase_price then raise exception 'insufficient_balance'; end if;

  order_reference := 'RT-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  insert into public.orders(
    order_number, listing_id, buyer_id, seller_id, status, price_mmk, trial_mode
  ) values (
    order_reference, listing_row.id, auth.uid(), listing_row.seller_id,
    'funded', purchase_price, p_trial_mode
  ) returning id into order_id;

  insert into public.ledger_accounts(order_id, kind)
    values(order_id, 'order_escrow')
    returning id into escrow_account;

  insert into public.journal_entries(
    kind, reference, order_id, user_id, idempotency_key, created_by
  ) values (
    'hold', order_reference, order_id, auth.uid(), 'hold:' || order_id::text, auth.uid()
  ) returning id into entry_id;

  insert into public.postings(entry_id, account_id, amount_mmk) values
    (entry_id, available_account, -purchase_price),
    (entry_id, escrow_account, purchase_price);

  update public.orders set status = 'escrow_held' where id = order_id;
  update public.listings set status = 'reserved' where id = listing_row.id;
  insert into public.order_events(order_id, from_status, to_status, actor_id, note)
    values(order_id, 'funded', 'escrow_held', auth.uid(), 'Buyer balance secured in escrow');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
    values(auth.uid(), 'order.funded', 'order', order_id::text,
      jsonb_build_object('amount_mmk', purchase_price, 'journal_entry_id', entry_id));
  return order_id;
end;
$$;

create or replace function public.approve_top_up(p_request_id uuid)
returns public.top_up_requests language sql security invoker set search_path = ''
as $$ select private.approve_top_up(p_request_id); $$;
create or replace function public.reject_top_up(p_request_id uuid, p_reason text)
returns public.top_up_requests language sql security invoker set search_path = ''
as $$ select private.reject_top_up(p_request_id, p_reason); $$;
create or replace function public.checkout_and_hold(
  p_listing_id uuid, p_trial_mode boolean default false, p_offer_id uuid default null
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.checkout_and_hold(p_listing_id, p_trial_mode, p_offer_id); $$;

grant execute on function private.approve_top_up(uuid) to authenticated;
grant execute on function private.reject_top_up(uuid,text) to authenticated;
grant execute on function private.checkout_and_hold(uuid,boolean,uuid) to authenticated;
grant execute on function public.approve_top_up(uuid) to authenticated;
grant execute on function public.reject_top_up(uuid,text) to authenticated;
grant execute on function public.checkout_and_hold(uuid,boolean,uuid) to authenticated;

revoke all on function private.prevent_ledger_mutation() from public, anon, authenticated;
revoke all on function private.assert_balanced_entry() from public, anon, authenticated;
revoke all on function private.enforce_top_up_transition() from public, anon, authenticated;
revoke all on function private.wallet_available_balance(uuid) from public, anon, authenticated;
revoke all on function private.wallet_held_balance(uuid) from public, anon, authenticated;
revoke all on function private.approve_top_up(uuid) from public, anon;
revoke all on function private.reject_top_up(uuid,text) from public, anon;
revoke all on function private.checkout_and_hold(uuid,boolean,uuid) from public, anon;
revoke all on function public.approve_top_up(uuid) from public, anon;
revoke all on function public.reject_top_up(uuid,text) from public, anon;
revoke all on function public.checkout_and_hold(uuid,boolean,uuid) from public, anon;
revoke usage, select on sequence public.order_number_seq from public, anon, authenticated;
