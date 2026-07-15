# TransTrack — Transit & Goods Tracking Platform

Single source of truth for a Tanzanian transit/logistics business: customers,
shipments, vehicle expenses, invoices (PDF export, M-Pesa payment logging) and
real-time profit visibility per vehicle and per customer. Bilingual EN/SW UI.

## Stack

- **Next.js 14 (App Router)** + TypeScript strict, Server Components by default
- **Turso (libSQL/SQLite)** via **Drizzle ORM** — note: the project brief was
  originally drafted around Supabase, but the database directive is Turso, so
  auth and row-level access control are implemented in the application layer
  (see below) rather than Postgres RLS
- Tailwind CSS + shadcn-style primitives (dark, gold-accent operations theme)
- React Hook Form + Zod (schemas shared between client forms and server actions)
- `@react-pdf/renderer` for invoice PDFs, Recharts for the profit dashboard
- Session auth: bcrypt password hashes + signed JWT cookie (`jose`)

## Getting started

```bash
npm install
cp .env.example .env          # defaults to a local SQLite file (file:local.db)
npm run db:migrate            # apply drizzle migrations
npm run db:seed               # demo data + one user per role
npm run dev
```

Seed logins (password `password123` for all):

| Email | Role |
|---|---|
| `owner@example.com` | Owner |
| `dispatcher@example.com` | Dispatcher |
| `driver@example.com` | Driver |
| `accountant@example.com` | Accountant |

For production, point `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` at a Turso
database and set a strong `AUTH_SECRET`.

## Roles & access control

Turso/SQLite has no Row Level Security, so the RLS policy direction from the
brief is enforced in the app layer:

- `src/lib/authz.ts` — the central permission matrix (`can(role, permission)`),
  consulted by **every server action and page**, never just UI conditionals.
- Driver scoping goes through `trip_assignments`: drivers only see their own
  trips (`listShipmentsForDriver`), can only update status on trips assigned to
  them, and can only log expenses against vehicles they're assigned to — all
  re-checked server-side inside the actions.
- Sessions carry only the user id; role and active-status are looked up fresh
  per request, so deactivating a user or changing a role takes effect
  immediately.

Driver ↔ vehicle assignment is modeled **per-trip** (flexible) per the brief's
open question #1; a "trip" is a shipment.

## Structure

```
src/
  app/
    login/                    # public
    (app)/                    # authenticated shell w/ role-aware nav
      dashboard/              # owner+accountant profit overview (charts)
      customers|vehicles|shipments|expenses|invoices|users/
      driver/                 # mobile-first driver view (trips, quick expense)
    api/invoices/[id]/pdf/    # invoice PDF download
  components/                 # ui primitives + shared components
  lib/
    db/                       # drizzle schema, client, migrate, seed
    actions/                  # server actions (authz + zod re-validation)
    queries/                  # shared read queries (driver scoping lives here)
    i18n/                     # EN/SW dictionaries + locale cookie
    authz.ts                  # permission matrix
```

## Conventions

- All currency is whole TZS, formatted with thousands separators (`formatTZS`).
- Zod schemas in `src/lib/validation.ts` are shared by client forms and actions.
- Plate numbers and money render in monospace; status badges are color-coded
  (pending amber / in-transit blue / delivered green / overdue red).

## Deferred (per brief)

- M-Pesa API integration (v1 logs manual references)
- SMS/email notifications, CSV export, audit log (Phase 5)
