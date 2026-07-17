# CLAUDE.md — Transit & Goods Tracking Platform
## Project Overview
A multi-tenant-style (single company, multi-user) web application for a transit and goods transportation business. Tracks customers, goods/shipments, vehicle expenses, invoices, and profitability — with role-based access for owner, office staff, drivers, and accountant.
**Target users:** Tanzanian transit/logistics business — office staff and drivers primarily, owner reviewing financials. Assume mixed English/Swahili comfort levels; UI copy should support bilingual toggle (EN/SW) from the start, using `next-intl` or a simple JSON dictionary approach.
**Primary goal of MVP:** Replace manual/paper tracking of goods, vehicle expenses, and invoices with a single source of truth that gives the owner real-time profit visibility per vehicle and per customer.
---
## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Backend/DB:** Turso (libSQL/SQLite) via Drizzle ORM — see note below
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui as base primitives, customized
- **PDF generation:** `@react-pdf/renderer` for invoices
- **Forms/validation:** React Hook Form + Zod
- **Charts:** Recharts (profit dashboards)
- **Deployment:** Vercel (frontend) + Turso hosted DB
- **Mobile money:** M-Pesa manual payment logging in v1 (API integration deferred to v2)

> **Note:** This brief was originally drafted around Supabase (Postgres + Auth + RLS),
> but the database directive is **Turso**. Since SQLite has no Row Level Security,
> the RLS policy direction below is implemented in the **application layer**:
> `src/lib/authz.ts` holds the central permission matrix consulted by every server
> action, and driver access is scoped through `trip_assignments` in queries
> (`src/lib/queries/`). Auth is session-based (bcrypt + signed JWT cookie).
---
## Roles & Permissions
| Role | Customers | Vehicles | Shipments/Goods | Expenses | Invoices | Profit Reports | User Management |
|---|---|---|---|---|---|---|---|
| **Owner/Admin** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | View | Full CRUD |
| **Dispatcher/Office** | Full CRUD | View | Full CRUD | View own entries | Create/View | No access | No access |
| **Driver** | View (own trips only) | View (assigned vehicle only) | Update status on own trips | Create (own vehicle only) | No access | No access | No access |
| **Accountant** | View | View | View | View | Full CRUD | View | No access |
**Assumption (flag to confirm with the client):** Driver-vehicle assignment is modeled as flexible per-trip, not permanently fixed — a `trip_assignments` table links driver → vehicle → trip, since transit businesses often reassign drivers. If drivers are always tied to one vehicle, this simplifies to a fixed `vehicle_id` on the driver's profile — easy to change later, but decide before building auth logic.
Enforce all of this via the central authz module and per-query scoping — never just UI conditionals.
---
## Database Schema
See `src/lib/db/schema.ts` (Drizzle, SQLite dialect). Tables: `profiles` (with role
enum owner/dispatcher/driver/accountant and password hash), `vehicles`,
`trip_assignments` (shipment ↔ vehicle ↔ driver), `customers`, `shipments`,
`expenses`, `invoices`, `payments`. A "trip" is a shipment. Migrations live in
`drizzle/`; run `npm run db:migrate` then `npm run db:seed`.
---
## Access-control direction (implemented per table in actions/queries)
- `profiles`: users read their own row (fresh per-request lookup); owner manages all.
- `vehicles`: owner/dispatcher/accountant full read; driver reads only vehicles they're assigned to (via `trip_assignments`).
- `shipments`: driver sees only rows where they're the assigned driver on that trip; dispatcher/owner see all.
- `expenses`: driver can INSERT rows scoped to their assigned vehicle only; owner/accountant read all; only owner can DELETE.
- `invoices`/`payments`: dispatcher can create, only accountant/owner can update status or delete.
---
## Design Direction
- Dark, premium aesthetic — deep charcoal/near-black background, gold or amber accent for primary actions and key numbers (revenue, profit).
- Data-dense but legible tables — this is an operations tool, not a marketing site. Prioritize scanability: right-align numbers, monospace for currency/plate numbers, clear status badges (color-coded: pending/amber, in-transit/blue, delivered/green, overdue/red).
- Mobile-first for the **driver view** specifically — drivers will use this on phones in the field. Large tap targets, minimal typing (dropdowns/presets for expense categories).
- Desktop-first for **admin/accountant dashboards** — charts, filters, exportable tables.
- Bilingual toggle (EN/SW) accessible from the nav at all times.
---
## Build Phases
**Phase 1 — Foundation** ✅ auth, profiles/roles, authz scaffolding, role-aware layout shell
**Phase 2 — Core Operations** ✅ customers, vehicles, shipments + status tracking, driver mobile view
**Phase 3 — Money** ✅ expense entry (driver quick-add + admin), invoice PDF export, payment logging (manual M-Pesa reference)
**Phase 4 — Insights** ✅ profit dashboard (revenue − expenses by vehicle/customer), overdue invoice alerts, date-range filters, cost per km (vehicle performance table)
**Phase 5 — Polish** ✅ CSV export (`/api/export/*`), audit log for financial edits (`audit_logs`, owner-only page); ◻ notifications (Africa's Talking — needs API credentials)
---
## Open Questions for Client
1. Driver-vehicle assignment: fixed or per-trip? *(currently per-trip — see assumption above)*
2. Does pricing per shipment need to support variable rates (per km, per weight, flat) or is it manually entered each time? *(currently manual)*
3. Is M-Pesa API integration needed in v1, or is manual reference-number logging sufficient to start? *(currently manual logging)*
4. Multi-branch/multi-location support needed, or single office? *(currently single office)*
---
## Conventions
- TypeScript throughout, strict mode.
- Server Components by default; Client Components only where interactivity is required.
- Zod schemas (`src/lib/validation.ts`) shared between form validation and server-action input types.
- All currency stored as `numeric` in TZS (Tanzanian Shilling), formatted with thousands separators in UI (`formatTZS`). Database is Turso (libSQL); local dev uses `file:local.db`.
