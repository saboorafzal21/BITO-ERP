# BITO ERP — Restaurant Sales & Inventory Management

Module 1 of the full build: **foundation, auth, dashboard, and POS**. Built with
Next.js 15, React 19, TypeScript, TailwindCSS v4, Supabase (Postgres + Auth + RLS),
React Hook Form, Zod, Recharts, and Lucide.

## What's included in this module

- Complete PostgreSQL schema (35+ tables) covering every module in the spec:
  branches, users/roles/permissions, employees/attendance, menu (categories,
  products, variants, addons, modifiers, combos, happy hour), inventory
  (ingredients, recipes, stock, logs, audits), sales/POS, purchasing, customers/
  loyalty, expenses, activity logs, notifications, settings.
- Row Level Security on every table, scoped by branch and role
  (`owner`, `admin`, `manager`, `cashier`, `kitchen`).
- Database triggers/functions: automatic stock deduction from recipes on every
  sale, low-stock notifications, loyalty point accrual, large-sale alerts,
  purchase-order receiving that restocks inventory, per-branch order numbering.
- Dashboard aggregation RPCs (today/week/month/year sales, profit, inventory
  worth, top products, low stock, 14-day revenue trend) and a working dashboard
  UI wired to them.
- Full auth flow: login, forgot/reset password, session middleware, protected
  routes, role-aware sidebar navigation.
- A working POS terminal: category filter, search, cart, discounts, tax,
  order type (dine-in/take-away/delivery), payment method, checkout that
  writes `sales` + `sale_items` + `sale_payments` and triggers stock deduction.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS v4 · Supabase ·
PostgreSQL · React Hook Form · Zod · TanStack Table · Recharts · Lucide ·
Server Actions · Supabase Auth · Sonner (toasts)

## Getting started

### 1. Create a Supabase project

Create a project at supabase.com, then grab:
- Project URL
- `anon` public key

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run migrations

In the Supabase SQL editor (or via the Supabase CLI: `supabase db push`), run
the files in `supabase/migrations/` **in order**:

1. `0001_core_schema.sql` — branches, users, menu, inventory
2. `0002_sales_purchasing_ops.sql` — sales, purchasing, expenses, notifications
3. `0003_functions_triggers.sql` — stock deduction, loyalty, order numbers
4. `0004_rls_policies.sql` — Row Level Security
5. `0005_auth_sync.sql` — auto-creates a `public.users` row per signup
6. `0006_dashboard_views.sql` — dashboard aggregation RPCs

Then run `supabase/seed/seed.sql` to load a demo branch, menu, ingredients,
recipes, suppliers, and customers.

### 4. Seed demo logins

`auth.users` can't be seeded with plain SQL (passwords are hashed by GoTrue).
Create demo accounts from the Supabase dashboard (Authentication → Users →
Add user) or via the Admin API, one per role, then update their `public.users`
row with the branch and role:

```sql
update public.users
set branch_id = '00000000-0000-0000-0000-000000000001', role = 'owner'
where email = 'owner@bito.pk';
```

Repeat for `admin@bito.pk` (admin), `manager@bito.pk` (manager),
`cashier@bito.pk` (cashier), `kitchen@bito.pk` (kitchen).

### 5. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the three environment variables from step 2 above in Vercel's project
   settings (set `NEXT_PUBLIC_SITE_URL` to your production URL).
4. Deploy. `npm run build` is the default build command and requires no changes.

## Project structure

```
src/
  app/
    (auth)/login, forgot-password        — public auth routes
    (app)/dashboard, pos                 — protected app routes (sidebar+topbar shell)
  components/
    ui/            — Button, Card, Input, Badge primitives
    layout/        — Sidebar, Topbar
    auth/          — login/forgot-password forms
    dashboard/     — KPI cards, revenue chart
    pos/           — POS terminal
  lib/
    supabase/      — browser/server/middleware Supabase clients
    actions/       — Server Actions (auth, dashboard, pos)
    validations/   — Zod schemas
    types/         — shared TS types
supabase/
  migrations/      — SQL migrations, run in order
  seed/            — demo data
```

## What's next (remaining modules)

This is Module 1 of a staged build. Still to come, in order:

2. Menu management UI (categories, products, variants, combos, happy hour)
3. Inventory UI (stock in/out, adjustments, expiry, waste, audits)
4. Purchasing (suppliers, POs, goods received, returns, payments)
5. Customers & loyalty UI
6. Employees & attendance
7. Expenses
8. Reports (P&L, sales, inventory, tax, employee) + PDF/Excel/CSV export
9. Multi-branch switching, notifications center, settings
10. PWA manifest, dark mode toggle, keyboard shortcuts, print templates

Each module ships as working code against the schema already in place — no
schema changes should be needed for the remaining modules.
