# ReTrust

A mobile-first, trust-centered second-hand marketplace PWA for Myanmar. ReTrust combines phone-bound identity, admin-assisted NRC verification, an auditable wallet/escrow ledger, evidence-backed delivery, guarded chat, QR handover, trial periods, disputes, partner logistics, and Eco-Points.

## What is implemented

- Responsive Next.js 16 marketplace, listing, seller, order, chat, wallet, rewards, trust, and admin experiences
- Phone OTP architecture with NRC as a verification factor—not a password
- Private identity and transaction evidence model with masked identifiers and retention metadata
- Immutable double-entry domain rules and Postgres ledger tables
- Transactional order states for 24-hour inspection, configurable 48-hour trials, returns, arbitration, refund, and dual-confirmed release
- Shipment evidence for product, package, order label, and capture timestamp
- AI Gateway adapter for conservative NRC/photo/condition signals with a mandatory human-review fallback
- Deterministic chat blocks for external links, contact scraping, wallet requests, and off-platform negotiation
- IMEI checksum and uniqueness controls with an external registry adapter
- Signed, expiring, single-use handover token architecture and QR pickup UI
- Admin-operated fallbacks for IMEI registries, lockers/drop-off counters, and reward partners
- Coarse location labels only; no exact home coordinates are exposed
- Non-cashable Eco-Point ledger and reward reservation flow
- RLS-enabled Supabase schema for every exposed table and private storage buckets

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The product UI runs with safe demo data when Supabase and AI Gateway credentials are absent. Server mutations that require durable identity, evidence, or tokens fail closed until services are configured.

To run Supabase locally:

```bash
npx supabase start
npx supabase db reset
```

Configure phone auth and an SMS provider in Supabase before testing real OTP delivery. Never place `SUPABASE_SECRET_KEY` in a `NEXT_PUBLIC_` variable.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Important production boundaries

The included wallet is an internal accounting and operations workflow. Holding or transmitting real customer money may require a licensed payment/escrow partner, safeguarding controls, reconciliation, AML/KYC procedures, and local legal approval. Connect a licensed provider through the payment adapter before presenting the balance as regulated stored value.

NRC AI signals are advisory. They must not independently approve identity, accuse fraud, decide counterfeiting, or resolve refunds. Production launch also requires a documented lawful basis, consent and deletion workflow, encryption/key management, strict operator access, incident response, and a reviewed retention period.

No public Myanmar stolen-device, KPay/WavePay/AYA Pay, smart-locker, or municipal reward APIs are assumed. The repository exposes provider interfaces and visible admin fallbacks so these workflows remain usable and auditable until approved integrations and credentials are supplied.

## Core directories

- `src/app` — PWA routes and protected service endpoints
- `src/components` — responsive product and operations experiences
- `src/lib/domain.ts` — ledger, state machine, trust, safety, IMEI, QR, location, and impact rules
- `src/lib/ai` — AI Gateway evidence assessment
- `src/lib/providers.ts` — external-provider contracts and admin fallbacks
- `src/lib/supabase` — SSR-safe Supabase clients
- `supabase/migrations` — schema, private helpers, RLS, indexes, and storage policies
- `supabase/seed.sql` — non-personal demo partners and rewards
