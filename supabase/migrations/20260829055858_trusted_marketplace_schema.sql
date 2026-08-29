create extension if not exists pgcrypto;
create schema if not exists private;
grant usage on schema private to authenticated;

create type public.verification_status as enum ('draft','pending','needs_resubmission','approved','rejected');
create type public.listing_status as enum ('draft','review','active','reserved','sold','removed');
create type public.order_status as enum ('funded','escrow_held','shipped','delivered','inspecting','trial_active','confirmed','return_review','disputed','released','refunded','cancelled');
create type public.dispute_status as enum ('open','evidence','arbitration','resolved_buyer','resolved_seller','appealed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_path text,
  phone_verified_at timestamptz,
  identity_verified_at timestamptz,
  coarse_area text,
  coarse_radius_m integer not null default 500 check (coarse_radius_m >= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('member','moderator','admin')),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.verification_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.verification_status not null default 'draft',
  nrc_masked text not null,
  nrc_hash text not null unique,
  legal_name_encrypted text not null,
  front_path text not null,
  selfie_path text,
  consent_at timestamptz not null,
  retention_until timestamptz not null,
  ai_result jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id),
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) <= 5000),
  category text not null,
  condition text not null,
  price_mmk bigint not null check (price_mmk > 0),
  status public.listing_status not null default 'draft',
  coarse_area text not null,
  coarse_radius_m integer not null default 500 check (coarse_radius_m >= 500),
  imei_hash text,
  imei_last4 text,
  imei_status text check (imei_status in ('pending','verified','flagged','manual_review')),
  trial_eligible boolean not null default false,
  weight_kg numeric(10,3),
  carbon_kg numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index unique_listing_imei on public.listings (imei_hash) where imei_hash is not null and status <> 'removed';

create table public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  original_path text not null,
  watermarked_path text not null,
  perceptual_hash text not null,
  sort_order integer not null default 0,
  ai_condition jsonb,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id),
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 2000),
  moderation_status text not null default 'allowed' check (moderation_status in ('allowed','blocked','review')),
  risk_result jsonb,
  created_at timestamptz not null default now()
);
create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  kind text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  entity_type text,
  entity_id uuid,
  evidence jsonb not null default '{}',
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  status public.order_status not null default 'funded',
  price_mmk bigint not null check (price_mmk > 0),
  fee_mmk bigint not null default 0 check (fee_mmk >= 0),
  trial_mode boolean not null default false,
  deposit_mmk bigint not null default 0 check (deposit_mmk >= 0),
  inspection_deadline timestamptz,
  buyer_confirmed_at timestamptz,
  seller_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references auth.users(id),
  note text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.shipment_evidence (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_photo_path text not null,
  package_photo_path text not null,
  order_label_path text not null,
  captured_at timestamptz not null default now(),
  ai_match jsonb,
  created_by uuid not null references auth.users(id)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  opened_by uuid not null references auth.users(id),
  reason text not null check (reason in ('not_as_described','not_working','counterfeit','damaged','return_condition','other')),
  urgent_two_hour boolean not null default false,
  status public.dispute_status not null default 'open',
  resolution jsonb,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  file_path text,
  statement text,
  ai_assessment jsonb,
  created_at timestamptz not null default now(),
  check (file_path is not null or statement is not null)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('top_up','hold','release','refund','fee','reversal')),
  reference text not null unique,
  order_id uuid references public.orders(id),
  user_id uuid references auth.users(id),
  evidence_path text,
  idempotency_key text not null unique,
  created_by uuid references auth.users(id),
  reverses_entry_id uuid references public.journal_entries(id),
  created_at timestamptz not null default now()
);
create table public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  order_id uuid references public.orders(id),
  kind text not null check (kind in ('user_available','order_escrow','platform_clearing','platform_fee')),
  currency text not null default 'MMK' check (currency = 'MMK'),
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, order_id, kind, currency)
);
create table public.postings (
  id bigint generated always as identity primary key,
  entry_id uuid not null references public.journal_entries(id),
  account_id uuid not null references public.ledger_accounts(id),
  amount_mmk bigint not null check (amount_mmk <> 0),
  created_at timestamptz not null default now()
);
create index postings_account_created on public.postings(account_id, created_at);

create table public.handover_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  actor text not null check (actor in ('buyer','seller','locker_operator')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.partner_locations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text,
  name text not null,
  coarse_area text not null,
  kind text not null check (kind in ('locker','counter','mini_mart')),
  active boolean not null default true,
  metadata jsonb not null default '{}'
);
create table public.logistics_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  location_id uuid references public.partner_locations(id),
  provider_reference text,
  event text not null,
  actor_id uuid references auth.users(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.eco_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  order_id uuid references public.orders(id),
  kind text not null check (kind in ('award','redeem','reversal','expiry')),
  points integer not null check (points <> 0),
  reference text not null unique,
  created_at timestamptz not null default now()
);
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null,
  title text not null,
  points_cost integer not null check (points_cost > 0),
  stock integer check (stock is null or stock >= 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'
);
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id),
  user_id uuid not null references auth.users(id),
  points integer not null check (points > 0),
  status text not null check (status in ('reserved','confirmed','cancelled','settled')),
  partner_reference text,
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator','admin'));
$$;

create or replace function private.is_conversation_member(conversation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.conversation_members where conversation_id = conversation and user_id = auth.uid());
$$;

create or replace function private.updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute function private.updated_at();
create trigger verification_updated before update on public.verification_cases for each row execute function private.updated_at();
create trigger listings_updated before update on public.listings for each row execute function private.updated_at();
create trigger orders_updated before update on public.orders for each row execute function private.updated_at();
create trigger disputes_updated before update on public.disputes for each row execute function private.updated_at();

create view public.trust_profiles with (security_invoker = true) as
select p.id, p.display_name, p.avatar_path, p.phone_verified_at, p.identity_verified_at, p.coarse_area, p.coarse_radius_m,
  count(distinct o.id) filter (where o.status = 'released')::integer as completed_orders,
  coalesce(round(100.0 * count(distinct o.id) filter (where o.status = 'released') / nullif(count(distinct o.id),0)),0)::integer as successful_rate
from public.profiles p left join public.orders o on o.seller_id = p.id
group by p.id;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.verification_cases enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.security_events enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.shipment_evidence enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.journal_entries enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.postings enable row level security;
alter table public.handover_tokens enable row level security;
alter table public.partner_locations enable row level security;
alter table public.logistics_events enable row level security;
alter table public.eco_entries enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy roles_read_own on public.user_roles for select to authenticated using (user_id = auth.uid() or private.is_admin());
create policy roles_admin_all on public.user_roles for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy verification_own_read on public.verification_cases for select to authenticated using (user_id = auth.uid() or private.is_admin());
create policy verification_own_insert on public.verification_cases for insert to authenticated with check (user_id = auth.uid() and status in ('draft','pending'));
create policy verification_admin_update on public.verification_cases for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy listings_public_read on public.listings for select using (status = 'active' or seller_id = auth.uid() or private.is_admin());
create policy listings_seller_insert on public.listings for insert to authenticated with check (seller_id = auth.uid());
create policy listings_seller_update on public.listings for update to authenticated using (seller_id = auth.uid() or private.is_admin()) with check (seller_id = auth.uid() or private.is_admin());
create policy media_read on public.listing_media for select using (exists(select 1 from public.listings l where l.id = listing_id and (l.status = 'active' or l.seller_id = auth.uid() or private.is_admin())));
create policy media_seller_write on public.listing_media for all to authenticated using (exists(select 1 from public.listings l where l.id = listing_id and (l.seller_id = auth.uid() or private.is_admin()))) with check (exists(select 1 from public.listings l where l.id = listing_id and (l.seller_id = auth.uid() or private.is_admin())));
create policy conversations_member on public.conversations for select to authenticated using (private.is_conversation_member(id) or private.is_admin());
create policy conversation_members_member on public.conversation_members for select to authenticated using (private.is_conversation_member(conversation_id) or private.is_admin());
create policy messages_member_read on public.messages for select to authenticated using (private.is_conversation_member(conversation_id) or private.is_admin());
create policy messages_member_insert on public.messages for insert to authenticated with check (sender_id = auth.uid() and private.is_conversation_member(conversation_id) and moderation_status <> 'blocked');
create policy security_admin on public.security_events for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy orders_participant on public.orders for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid() or private.is_admin());
create policy order_events_participant on public.order_events for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())) or private.is_admin());
create policy shipment_participant_read on public.shipment_evidence for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())) or private.is_admin());
create policy shipment_seller_insert on public.shipment_evidence for insert to authenticated with check (created_by = auth.uid() and exists(select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid()));
create policy dispute_participant on public.disputes for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())) or private.is_admin());
create policy dispute_open on public.disputes for insert to authenticated with check (opened_by = auth.uid() and exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())));
create policy dispute_evidence_participant on public.dispute_evidence for select to authenticated using (exists(select 1 from public.disputes d join public.orders o on o.id=d.order_id where d.id=dispute_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())) or private.is_admin());
create policy dispute_evidence_insert on public.dispute_evidence for insert to authenticated with check (submitted_by=auth.uid() and exists(select 1 from public.disputes d join public.orders o on o.id=d.order_id where d.id=dispute_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())));
create policy journals_owner_read on public.journal_entries for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.orders o where o.id=order_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())) or private.is_admin());
create policy accounts_owner_read on public.ledger_accounts for select to authenticated using (owner_id=auth.uid() or exists(select 1 from public.orders o where o.id=order_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())) or private.is_admin());
create policy postings_owner_read on public.postings for select to authenticated using (exists(select 1 from public.ledger_accounts a where a.id=account_id and (a.owner_id=auth.uid() or private.is_admin() or exists(select 1 from public.orders o where o.id=a.order_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())))));
create policy handovers_participant on public.handover_tokens for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())) or private.is_admin());
create policy locations_read on public.partner_locations for select using (active or private.is_admin());
create policy locations_admin on public.partner_locations for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy logistics_participant on public.logistics_events for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())) or private.is_admin());
create policy eco_own on public.eco_entries for select to authenticated using (user_id=auth.uid() or private.is_admin());
create policy rewards_read on public.rewards for select using (active or private.is_admin());
create policy rewards_admin on public.rewards for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy redemptions_own on public.reward_redemptions for select to authenticated using (user_id=auth.uid() or private.is_admin());
create policy audits_admin on public.audit_logs for select to authenticated using (private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('identity-evidence','identity-evidence',false,10485760,array['image/jpeg','image/png','image/webp']),
  ('transaction-evidence','transaction-evidence',false,20971520,array['image/jpeg','image/png','image/webp','video/mp4']),
  ('listing-originals','listing-originals',false,20971520,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy identity_upload_own on storage.objects for insert to authenticated with check (bucket_id='identity-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy identity_read_own_or_admin on storage.objects for select to authenticated using (bucket_id='identity-evidence' and ((storage.foldername(name))[1]=auth.uid()::text or private.is_admin()));
create policy transaction_evidence_read on storage.objects for select to authenticated using (bucket_id='transaction-evidence' and ((storage.foldername(name))[1]=auth.uid()::text or private.is_admin()));
create policy transaction_evidence_upload on storage.objects for insert to authenticated with check (bucket_id='transaction-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy listing_originals_own on storage.objects for all to authenticated using (bucket_id='listing-originals' and ((storage.foldername(name))[1]=auth.uid()::text or private.is_admin())) with check (bucket_id='listing-originals' and (storage.foldername(name))[1]=auth.uid()::text);

create index orders_buyer_created on public.orders(buyer_id, created_at desc);
create index orders_seller_created on public.orders(seller_id, created_at desc);
create index listings_active_category on public.listings(category, created_at desc) where status='active';
create index messages_conversation_created on public.messages(conversation_id, created_at);
create index disputes_order on public.disputes(order_id, created_at desc);
