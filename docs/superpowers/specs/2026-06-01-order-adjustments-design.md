# Order Management Adjustments — Design Spec
Date: 2026-06-01

## Overview

Four independent features added to the order management app:
1. Today's order counts next to each filter button
2. Order type field (livraison / echange)
3. Ship date with gray row appearance
4. New `/calculs` page for salary and delivery total forms

---

## Feature 1 — Filter Counts

### Goal
Show today's order count next to each status filter button, always reflecting today's orders regardless of the active date range.

### Implementation
- `page.tsx` fires a separate `GET /api/orders?start=TODAY&end=TODAY` on mount (after `userId` loads), independent of the main table fetch.
- Result stored in `todayCounts` state: `Record<string, number>` keyed by status string.
- Counts object passed as prop `counts` to `OrderFilter`.
- `OrderFilter` renders: `Nouveaux (3)`, `En route (1)`, etc.
- "Tout" shows total of all statuses for today.
- Count fetch does not re-run when date filter changes — always anchored to today.

### Files changed
- `src/app/page.tsx` — add `todayCounts` state + fetch, pass to `OrderFilter`
- `Components/OrdersFilter.tsx` — accept `counts` prop, render inline counts

---

## Feature 2 — Order Type

### Goal
Each order has a type: `livraison` (default) or `echange`. Visible under the order ID in the table.

### Database
One combined migration with Feature 3:
```sql
CREATE TYPE order_type AS ENUM ('livraison', 'echange');
ALTER TABLE orders ADD COLUMN order_kind order_type NOT NULL DEFAULT 'livraison';
ALTER TABLE orders ADD COLUMN ship_date DATE;
```

Prisma schema additions to `orders` model (field named `order_kind` to avoid Prisma's `type` keyword):
```prisma
order_kind order_type @default(livraison)
ship_date  DateTime?  @db.Date

enum order_type {
  livraison
  echange
}
```

### API
- `serializeOrder` in `lib/serialize.ts` adds `order_kind: order.order_kind`
- `POST /api/orders` accepts `order_kind` from body (defaults to `livraison` if omitted)

### UI
- Create form (`src/app/order/page.tsx`): `<select>` with livraison / echange, defaults to livraison
- `Components/TableRow.tsx`: ID cell renders order ID on first line, `order_kind` as small gray text on second line

### Files changed
- `prisma/schema.prisma`
- `lib/serialize.ts`
- `src/app/api/orders/route.ts`
- `src/app/order/page.tsx`
- `Components/TableRow.tsx`

---

## Feature 3 — Ship Date + Gray Rows

### Goal
Vendeuse can set a future date when creating an order. Until that date arrives, the row appears grayed out in the table.

### Database
Covered by combined migration above (`ship_date DATE` nullable).

### API
- `serializeOrder` adds `ship_date` as ISO date string (`YYYY-MM-DD`) or `null`
- `POST /api/orders` accepts optional `ship_date`

### UI
- Create form: optional date input (`<input type="date">`), no role restriction (both Vendeuse and Admin can set it)
- `Components/TableRow.tsx`: if `ship_date` is set and `ship_date > today`, row `<tr>` gets class `text-gray-500` to gray it out. Rows with no ship date or past ship date render normally.

### Files changed
- `lib/serialize.ts`
- `src/app/api/orders/route.ts`
- `src/app/order/page.tsx`
- `Components/TableRow.tsx`

---

## Feature 4 — `/calculs` Page

### Goal
Dedicated page for salary and delivery total calculations. Accessible to Admin and Assistante. SalaryForm is Admin-only; DeliveryTotalForm is visible to both.

### New page: `src/app/calculs/page.tsx`
- Server component (reads cookies server-side)
- Role check:
  - No session → redirect `/login`
  - Role not in `[Admin, Assistante]` → render "Accès restreint"
- Fetches users via Prisma (same query as `/users`)
- Renders:
  - `<SalaryForm users={users} />` — wrapped in `{role === 'Admin' && ...}`
  - `<DeliveryTotalForm users={users} />` — always rendered (both roles allowed)

### `/users` page changes
- Remove `<SalaryForm>` and `<DeliveryTotalForm>` imports and usage
- Page remains Admin-only (no role access change)

### Navbar changes (`Components/Navbar.tsx`)
- Add "Calculs" `<li>` to desktop nav list
- Add "Calculs" `<li>` to mobile overlay list
- Active highlight: `path == "/calculs"`
- Link always visible (page handles its own auth)

### Files changed
- `src/app/calculs/page.tsx` — new file
- `src/app/users/page.tsx` — remove form imports/usage
- `Components/Navbar.tsx` — add Calculs link

---

## Migration Strategy

Single raw SQL migration run once against the DB:
```sql
CREATE TYPE order_type AS ENUM ('livraison', 'echange');
ALTER TABLE orders ADD COLUMN order_kind order_type NOT NULL DEFAULT 'livraison';
ALTER TABLE orders ADD COLUMN ship_date DATE;
```

Prisma schema updated to match (reference only — runtime uses `pg` pool, not Prisma client for queries, but Prisma client is used in `api/orders/route.ts` so schema must be accurate and client regenerated).

---

## Out of Scope
- Edit order form (`/order/[id]`) type/ship_date fields — not requested
- Filter by type in the orders table — not requested
- Ship date display column in table — shown implicitly via row color only
