# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Run production server (0.0.0.0:3000)
npm run lint      # Run ESLint
```

Environment variable required: `DATABASE_URL` (PostgreSQL connection string).

## Architecture

**Next.js 16 App Router** with React 19, TypeScript, Tailwind CSS v4, and PostgreSQL.

### Data access

All database queries use raw SQL via the `pg` connection pool in `lib/db.ts`. **Prisma is not used at runtime** — `prisma/schema.prisma` defines the schema for reference/migrations only, and `lib/prisma.ts` exists but queries go through the pool. Always use `pool.query(sql, [params])` with `$1, $2, ...` placeholders.

### Authentication

Cookie-based session: login sets three HTTP-only cookies (`userId`, `role`, `username`). Every protected page/API reads these cookies. `lib/auth.ts` provides `getUser()` for server-side use; client pages call `/api/check-session` to get session data.

Roles: `Admin`, `Assistante`, `Vendeuse`, `Livreur`. Role-based logic is applied at the API layer — e.g., `GET /api/orders` filters orders by role, `DELETE` checks whether the user is Admin or a Vendeuse acting on a `Nouveau` order.

### Directory layout

- `src/app/` — Next.js pages and API routes (App Router)
- `Components/` — Shared client components (outside `src/`, imported with `../../Components/`)
- `lib/` — `db.ts` (pool), `auth.ts` (server-side session helper)
- `prisma/` — Schema and seed script
- `types/` — Custom type declarations (e.g., bwip-js)

### Key pages

| Route | Purpose |
|---|---|
| `/` | Orders table (today's orders, role-filtered) |
| `/order/[id]` | Edit order form (Admin/Assistante only) |
| `/users` | User list |
| `/users/[id]` | User detail/salary |
| `/login` | Auth page |
| `/adduser` | Create new user |

### Salary side-effects

When a new order is created (`POST /api/orders`), the seller's salary is automatically incremented by `benefit`, and the delivery person's salary is incremented by `fee`. The same adjustment logic must be accounted for when editing or deleting orders.

### Order status values

`Nouveau`, `En route`, `Livré`, `Annulé`, `Retour` — these are French strings used in both the DB and UI (Prisma enum maps to `order_status` type).

### React Compiler

`reactCompiler: true` is set in `next.config.ts`, so the React Compiler is active. Avoid manual `useMemo`/`useCallback` optimizations that conflict with it.
