# Order Visibility and Date Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide future-dated orders from Assistante and Confirmatrice, switch the default query window from month-start to 15 days ago, and update the date picker default to match.

**Architecture:** Change 1 is server-side (API route WHERE clause). Changes 2 and 3 are client-side (one line each in page.tsx and DateSearch.tsx). All three are independent and touch separate files.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma ORM, PostgreSQL

---

### Task 1: Hide future orders from Assistante and Confirmatrice

**Files:**
- Modify: `src/app/api/orders/route.ts:37-50`

**Background:** The GET handler builds a `roleWhere` object then spreads it into Prisma's `where`. The Prisma schema has `ship_date` as a nullable `DateTime`. Orders with no `ship_date` must remain visible. Orders with `ship_date > today` must be hidden for Assistante and Confirmatrice only. Admin, Vendeuse, Livreur are unaffected.

- [ ] **Step 1: Add futureFilter after roleWhere**

In `src/app/api/orders/route.ts`, find the block starting at line 37:

```ts
    const roleWhere: any = {};
    if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
    else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
    else if (role === 'Confirmatrice') roleWhere.client_wilaya = { not: 'Alger' };

    const orders = await prisma.orders.findMany({
      where: { ...dateWhere, ...roleWhere },
      include: ORDER_INCLUDE,
      orderBy: { id: 'desc' },
    });
```

Replace with:

```ts
    const roleWhere: any = {};
    if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
    else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
    else if (role === 'Confirmatrice') roleWhere.client_wilaya = { not: 'Alger' };

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const futureFilter = (role === 'Assistante' || role === 'Confirmatrice')
      ? { OR: [{ ship_date: null }, { ship_date: { lte: todayEnd } }] }
      : {};

    const orders = await prisma.orders.findMany({
      where: { ...dateWhere, ...roleWhere, ...futureFilter },
      include: ORDER_INCLUDE,
      orderBy: { id: 'desc' },
    });
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`. Log in as Assistante or Confirmatrice. Confirm orders with a future `ship_date` do not appear. Log in as Admin — confirm those same orders still appear.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: hide future ship_date orders from Assistante and Confirmatrice"
```

---

### Task 2: Change default query window from month-start to 15 days ago

**Files:**
- Modify: `src/app/page.tsx:46-50`

**Background:** When no date range URL params are present and the filter is not `'Nouveau'`, the fetch URL is built with a date range. Currently it uses the first day of the current month. Replace with 15 days ago.

- [ ] **Step 1: Replace monthStart calculation**

In `src/app/page.tsx`, find lines 46–50 inside the orders fetch `useEffect`:

```ts
    } else if (filter !== 'Nouveau') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      url = `/api/orders?start=${monthStart}&end=${today}`;
    }
```

Replace with:

```ts
    } else if (filter !== 'Nouveau') {
      const now = new Date();
      const fifteenDaysAgo = new Date(now);
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const start15 = fifteenDaysAgo.toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      url = `/api/orders?start=${start15}&end=${today}`;
    }
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`. On the main page with no filter or a non-Nouveau filter active, confirm the loaded orders span the last 15 days (not the full current month). Switch to Nouveau filter — confirm it still loads all orders with no date restriction.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: change default order query window from month-start to 15 days ago"
```

---

### Task 3: Set DateSearch default start date to 15 days ago

**Files:**
- Modify: `Components/DateSearch.tsx:11-12`

**Background:** The date picker modal initialises `startDate` state from the URL `start` param or falls back to `today`. Change the fallback to 15 days ago so it matches the default query window from Task 2.

- [ ] **Step 1: Replace default startDate**

In `Components/DateSearch.tsx`, find lines 11–12:

```ts
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(searchParams.get('start') ?? today);
```

Replace with:

```ts
  const today = new Date().toISOString().split('T')[0];
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const defaultStart = searchParams.get('start') ?? fifteenDaysAgo.toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStart);
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`. Open the date picker (calendar icon). Confirm the "Du" field defaults to 15 days ago. Confirm the "Au" field still defaults to today. Navigate to `/?start=2026-01-01&end=2026-01-31` — confirm the date picker shows those values instead of the defaults.

- [ ] **Step 3: Commit**

```bash
git add Components/DateSearch.tsx
git commit -m "feat: set date picker default start date to 15 days ago"
```
