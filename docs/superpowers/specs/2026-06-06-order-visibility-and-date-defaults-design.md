# Order Visibility and Date Defaults Design

**Date:** 2026-06-06  
**Scope:** 3 independent changes — server-side future order filtering, 15-day query window, date picker default

---

## Change 1 — Hide Future Orders from Assistante and Confirmatrice

**File:** `src/app/api/orders/route.ts`

**Problem:** Assistante and Confirmatrice currently see orders with a future `ship_date`. These should only become visible on or after the due date.

**Rule:** When role is `Assistante` or `Confirmatrice`, restrict results to orders where `ship_date IS NULL OR ship_date <= today`.

**Implementation:**  
After building `roleWhere`, compute today's date and, for the two affected roles, spread an additional `OR` condition into the Prisma `where` clause:

```ts
const today = new Date();
const hideFuture = role === 'Assistante' || role === 'Confirmatrice';
const futureFilter = hideFuture
  ? { OR: [{ ship_date: null }, { ship_date: { lte: today } }] }
  : {};

prisma.orders.findMany({
  where: { ...dateWhere, ...roleWhere, ...futureFilter },
  ...
})
```

- `ship_date: null` — orders with no scheduled date remain visible.
- Spreading `futureFilter` at the top level adds it as an AND with the existing conditions, which is correct for both Assistante (no other roleWhere) and Confirmatrice (`client_wilaya: { not: 'Alger' }`).
- Admin, Vendeuse, Livreur: unaffected.

---

## Change 2 — Default Query Window: 15 Days Instead of Month Start

**File:** `src/app/page.tsx`

**Problem:** Non-Nouveau filters fetch from the first of the current month. Replace with a rolling 15-day window.

**Rule:** When no explicit date range is set and filter is not `'Nouveau'`, use `today - 15 days` as the start date.

**Implementation:** Replace the `monthStart` calculation:

```ts
// Before
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  .toISOString().split('T')[0];

// After
const fifteenDaysAgo = new Date(now);
fifteenDaysAgo.setDate(now.getDate() - 15);
const fifteenDaysAgo_str = fifteenDaysAgo.toISOString().split('T')[0];
```

`'Nouveau'` filter: unchanged — still fetches all orders with no date range.

---

## Change 3 — DateSearch Default Start = 15 Days Ago

**File:** `Components/DateSearch.tsx`

**Problem:** When the date picker opens with no existing URL params, the start date defaults to today. It should default to 15 days ago, matching the query window in Change 2.

**Implementation:** Replace default `startDate` state:

```ts
// Before
const [startDate, setStartDate] = useState(searchParams.get('start') ?? today);

// After
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
const defaultStart = searchParams.get('start') ?? fifteenDaysAgo.toISOString().split('T')[0];
const [startDate, setStartDate] = useState(defaultStart);
```

The `endDate` default remains `today`.

---

## Out of Scope

- No change to how Vendeuse, Livreur, or Admin see orders.
- No change to the Nouveau filter behavior (already queries all orders).
- No UI changes for the visibility rule — it is purely API-enforced.
