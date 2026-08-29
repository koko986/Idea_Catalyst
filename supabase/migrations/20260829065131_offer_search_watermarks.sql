alter table public.listings
  add column transaction_type text not null default 'Escrow Delivery'
    check (transaction_type in ('Escrow Delivery','SafeZone Locker Pickup','Direct Meetup','Free / Give-away')),
  add column pricing_tier text not null default 'Fixed Price'
    check (pricing_tier in ('Fixed Price','Open to Offers','Price Dropped Recently')),
  add column price_dropped_at timestamptz,
  add column search_keywords_mm text[] not null default '{}',
  add column negotiation_round integer not null default 0 check (negotiation_round >= 0);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  amount_mmk bigint not null check (amount_mmk >= 0),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'active'
    check (status in ('active','countered','selected','waiting','confirmed','declined','expired','cancelled')),
  round integer not null default 0 check (round >= 0),
  confirmation_deadline timestamptz,
  selected_at timestamptz,
  confirmed_at timestamptz,
  cancelled_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

alter table public.listings add column selected_offer_id uuid references public.offers(id);
create unique index one_open_offer_per_buyer on public.offers(listing_id,buyer_id)
  where status in ('active','countered','selected','waiting');
create unique index one_selected_buyer_per_listing on public.offers(listing_id)
  where status = 'selected';
create index offers_seller_status on public.offers(seller_id,status,created_at desc);
create index offers_buyer_status on public.offers(buyer_id,status,created_at desc);
create trigger offers_updated before update on public.offers for each row execute function private.updated_at();

alter table public.offers enable row level security;
create policy offers_participant_read on public.offers for select to authenticated
  using (buyer_id=auth.uid() or seller_id=auth.uid() or private.is_admin());
create policy offers_buyer_create on public.offers for insert to authenticated
  with check (
    buyer_id=auth.uid()
    and exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active')
  );

create or replace function private.select_offer(p_offer_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare chosen public.offers;
begin
  select * into chosen from public.offers where id=p_offer_id for update;
  if chosen.id is null then raise exception 'offer_not_found'; end if;
  if chosen.seller_id <> auth.uid() and not private.is_admin() then raise exception 'not_offer_seller'; end if;
  if chosen.status not in ('active','countered') then raise exception 'offer_not_available'; end if;
  if exists(select 1 from public.offers where listing_id=chosen.listing_id and status='selected') then
    raise exception 'selection_already_pending';
  end if;
  update public.listings set selected_offer_id=chosen.id, negotiation_round=negotiation_round+1 where id=chosen.listing_id;
  update public.offers
    set status=case when id=chosen.id then 'selected' else 'waiting' end,
        round=(select negotiation_round from public.listings where id=chosen.listing_id),
        selected_at=case when id=chosen.id then now() else selected_at end,
        confirmation_deadline=case when id=chosen.id then now()+interval '24 hours' else null end
  where listing_id=chosen.listing_id and status in ('active','countered','waiting');
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
    values(auth.uid(),'offer.selected','offer',chosen.id::text,jsonb_build_object('deadline',now()+interval '24 hours'));
end;
$$;

create or replace function private.confirm_selected_offer(p_offer_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare chosen public.offers;
begin
  select * into chosen from public.offers where id=p_offer_id for update;
  if chosen.id is null or chosen.status <> 'selected' then raise exception 'offer_not_selected'; end if;
  if chosen.buyer_id <> auth.uid() then raise exception 'not_selected_buyer'; end if;
  if chosen.confirmation_deadline <= now() then raise exception 'confirmation_expired'; end if;
  update public.offers set status='confirmed',confirmed_at=now() where id=chosen.id;
  update public.offers set status='declined' where listing_id=chosen.listing_id and status='waiting';
  update public.listings set status='reserved' where id=chosen.listing_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
    values(auth.uid(),'offer.confirmed','offer',chosen.id::text,jsonb_build_object('amount_mmk',chosen.amount_mmk));
end;
$$;

create or replace function private.release_offer_selection(p_listing_id uuid, p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare chosen public.offers;
begin
  select * into chosen from public.offers where listing_id=p_listing_id and status='selected' for update;
  if chosen.id is null then raise exception 'no_pending_selection'; end if;
  if p_reason='expired' then
    if chosen.confirmation_deadline > now() then raise exception 'confirmation_still_active'; end if;
  elsif auth.uid() not in (chosen.buyer_id,chosen.seller_id) and not private.is_admin() then
    raise exception 'not_transaction_participant';
  end if;
  update public.offers set status=case when id=chosen.id then p_reason else 'active' end,
    cancelled_by=case when id=chosen.id and p_reason='cancelled' then auth.uid() else cancelled_by end
  where listing_id=p_listing_id and status in ('selected','waiting');
  update public.listings set selected_offer_id=null,status='active' where id=p_listing_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
    values(auth.uid(),'offer.selection_released','listing',p_listing_id::text,jsonb_build_object('reason',p_reason));
end;
$$;

create or replace function public.select_offer(p_offer_id uuid)
returns void language sql security invoker set search_path='' as $$ select private.select_offer(p_offer_id); $$;
create or replace function public.confirm_selected_offer(p_offer_id uuid)
returns void language sql security invoker set search_path='' as $$ select private.confirm_selected_offer(p_offer_id); $$;
create or replace function public.cancel_offer_selection(p_listing_id uuid)
returns void language sql security invoker set search_path='' as $$ select private.release_offer_selection(p_listing_id,'cancelled'); $$;
create or replace function public.expire_offer_selection(p_listing_id uuid)
returns void language sql security invoker set search_path='' as $$ select private.release_offer_selection(p_listing_id,'expired'); $$;

grant execute on function private.select_offer(uuid) to authenticated;
grant execute on function private.confirm_selected_offer(uuid) to authenticated;
grant execute on function private.release_offer_selection(uuid,text) to authenticated;
grant execute on function public.select_offer(uuid) to authenticated;
grant execute on function public.confirm_selected_offer(uuid) to authenticated;
grant execute on function public.cancel_offer_selection(uuid) to authenticated;
grant execute on function public.expire_offer_selection(uuid) to authenticated;

create or replace function private.expire_stale_offer_selections()
returns integer language plpgsql security definer set search_path='' as $$
declare expired_count integer;
begin
  with expired as (
    select listing_id,id from public.offers
    where status='selected' and confirmation_deadline <= now()
    for update
  ), expire_chosen as (
    update public.offers o set status='expired'
    from expired e where o.id=e.id returning o.listing_id,o.id
  ), reopen_waiting as (
    update public.offers o set status='active'
    where o.status='waiting' and o.listing_id in (select listing_id from expired)
  ), reopen_listings as (
    update public.listings l set selected_offer_id=null,status='active'
    where l.id in (select listing_id from expired)
  )
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
    select null,'offer.selection_released','listing',listing_id::text,jsonb_build_object('reason','expired','offer_id',id)
    from expire_chosen;
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;
revoke all on function private.expire_stale_offer_selections() from public,anon,authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'expire-stale-offer-selections',
  '*/5 * * * *',
  'select private.expire_stale_offer_selections()'
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('listing-watermarked','listing-watermarked',true,20971520,array['image/webp'])
on conflict (id) do update set public=true;
create policy watermarked_public_read on storage.objects for select
  using (bucket_id='listing-watermarked');
create policy watermarked_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id='listing-watermarked' and (storage.foldername(name))[1]=auth.uid()::text);

create index listings_search_attributes on public.listings
  (condition,transaction_type,pricing_tier,created_at desc) where status='active';

revoke update on public.listings from authenticated;
grant update (
  title,description,category,condition,price_mmk,coarse_area,coarse_radius_m,
  imei_hash,imei_last4,imei_status,trial_eligible,weight_kg,carbon_kg,
  transaction_type,pricing_tier,price_dropped_at,search_keywords_mm,updated_at
) on public.listings to authenticated;
