# Order Adjustments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add filter counts, order type, ship date with gray rows, and a new /calculs page to the order management app.

**Architecture:** Six independent tasks in dependency order — DB first, then API/serialize, then UI layers. Features 2 and 3 share a single DB migration. No test infrastructure exists in this project; each task ends with a manual verification step via `npm run dev`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma (client used at runtime via `lib/prisma.ts`), PostgreSQL, Tailwind CSS v4.

---

## File Map

| File | Action | Reason |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `order_kind`, `ship_date` fields and `order_type` enum |
| `lib/serialize.ts` | Modify | Serialize `order_kind` and `ship_date` |
| `src/app/api/orders/route.ts` | Modify | Accept `order_kind` and `ship_date` in POST |
| `src/app/order/page.tsx` | Modify | Add type select + ship date input to create form |
| `Components/TableRow.tsx` | Modify | Show type under ID, gray rows for future ship dates |
| `src/app/page.tsx` | Modify | Fetch today's counts, pass to OrderFilter |
| `Components/OrdersFilter.tsx` | Modify | Accept `counts` prop, render inline counts |
| `src/app/calculs/page.tsx` | Create | New page for SalaryForm + DeliveryTotalForm |
| `src/app/users/page.tsx` | Modify | Remove SalaryForm + DeliveryTotalForm |
| `Components/Navbar.tsx` | Modify | Add Calculs nav link |

---

## Task 1: DB Migration + Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Run: raw SQL against PostgreSQL

- [ ] **Step 1: Run the SQL migration against your database**

Connect to your PostgreSQL database (using `psql $DATABASE_URL` or any DB client) and run:

```sql
CREATE TYPE order_type AS ENUM ('livraison', 'echange');
ALTER TABLE orders ADD COLUMN order_kind order_type NOT NULL DEFAULT 'livraison';
ALTER TABLE orders ADD COLUMN ship_date DATE;
```

- [ ] **Step 2: Update `prisma/schema.prisma`**

Add the `order_type` enum at the bottom of the file (after the existing `user_role` enum), and add two fields inside the `orders` model.

In the `orders` model, add after the `return_fee` field:

```prisma
  order_kind                      order_type   @default(livraison)
  ship_date                       DateTime?    @db.Date
```

At the bottom of the file, add the new enum:

```prisma
enum order_type {
  livraison
  echange
}
```

The full updated bottom of `prisma/schema.prisma` should look like:

```prisma
enum order_status {
  Nouveau
  En_route @map("En route")
  Livre    @map("Livré")
  Annule   @map("Annulé")
  Retour
}

enum user_role {
  Admin
  Assistante
  Vendeuse
  Livreur
  Confirmatrice
}

enum order_type {
  livraison
  echange
}
```

- [ ] **Step 3: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add order_kind and ship_date columns to orders table"
```

---

## Task 2: Update serialize.ts + API POST

**Files:**
- Modify: `lib/serialize.ts`
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Add `order_kind` and `ship_date` to `serializeOrder` in `lib/serialize.ts`**

Add two fields to the returned object, after `delivery_phone`:

```ts
    order_kind: order.order_kind ?? 'livraison',
    ship_date: order.ship_date
      ? (order.ship_date instanceof Date
          ? order.ship_date.toISOString().split('T')[0]
          : String(order.ship_date))
      : null,
```

The full return object in `serializeOrder` will end with:

```ts
    seller_name: seller?.username ?? null,
    seller_phone: seller?.phone ?? null,
    delivery_name: delivery?.username ?? null,
    delivery_phone: delivery?.phone ?? null,
    order_kind: order.order_kind ?? 'livraison',
    ship_date: order.ship_date
      ? (order.ship_date instanceof Date
          ? order.ship_date.toISOString().split('T')[0]
          : String(order.ship_date))
      : null,
  };
```

- [ ] **Step 2: Update POST handler in `src/app/api/orders/route.ts` to accept `order_kind` and `ship_date`**

In the destructure of `body` (line ~68), add `order_kind` and `ship_date`:

```ts
    const {
      seller_id, client_name, client_phone1, client_phone2,
      client_wilaya, client_address, products,
      delivery_id, benefit, total, fee, order_kind, ship_date,
    } = body;
```

In `prisma.orders.create({ data: { ... } })`, add after `fee: fee ?? null,`:

```ts
        order_kind: order_kind ?? 'livraison',
        ship_date: ship_date ? new Date(ship_date) : null,
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npm run build 2>&1 | head -30
```

Expected: no type errors related to `order_kind` or `ship_date`. (Build may fail on other unrelated things — focus only on these two fields.)

- [ ] **Step 4: Commit**

```bash
git add lib/serialize.ts src/app/api/orders/route.ts
git commit -m "feat: serialize and accept order_kind and ship_date in orders API"
```

---

## Task 3: Update Create Order Form

**Files:**
- Modify: `src/app/order/page.tsx`

- [ ] **Step 1: Add state for `orderKind` and `shipDate`**

In `src/app/order/page.tsx`, add these two state declarations after the existing `const [deliveryFee, setDeliveryFee] = useState(0);` line:

```ts
    const [orderKind, setOrderKind] = useState("livraison");
    const [shipDate, setShipDate] = useState("");
```

- [ ] **Step 2: Include both fields in the POST body inside `handleSubmit`**

In the `fetch('/api/orders', { body: JSON.stringify({...}) })` call, add after `fee: deliveryFee,`:

```ts
                order_kind: orderKind,
                ship_date: shipDate || null,
```

- [ ] **Step 3: Add the type select and ship date input to the form**

In the "Infos Commande" section (the `<div>` with `<h1>Infos Commande</h1>`), add a new row below the textarea. Insert after the closing `</textarea>` tag and before the price/benefit row:

```tsx
                        <div className="w-full lg:w-[40%] flex justify-between gap-x-2 my-5">
                            <select name="order_kind"
                            className="w-[48%] h-8 px-2 bg-white text-black"
                            onChange={(e) => setOrderKind(e.target.value)}>
                                <option value="livraison">Livraison</option>
                                <option value="echange">Echange</option>
                            </select>
                            <input type="date" name="ship_date"
                            className="w-[48%] h-8 px-2 bg-white text-black"
                            onChange={(e) => setShipDate(e.target.value)}/>
                        </div>
```

- [ ] **Step 4: Manually verify**

Run `npm run dev`, navigate to `/order`, confirm:
- Type select shows "Livraison" / "Echange" options
- Date input renders next to type select
- Submitting a new order succeeds (toast fires, redirects to `/`)
- In the DB, `order_kind` and `ship_date` are stored correctly

- [ ] **Step 5: Commit**

```bash
git add src/app/order/page.tsx
git commit -m "feat: add order type and ship date inputs to create order form"
```

---

## Task 4: TableRow — Type Badge + Gray Rows

**Files:**
- Modify: `Components/TableRow.tsx`

- [ ] **Step 1: Compute today's date string in the function body**

In `Components/TableRow.tsx`, add a constant in the function body before the `return` statement, after `handleDoubleClick`:

```tsx
  const today = new Date().toISOString().split('T')[0];

  return (
```

- [ ] **Step 2: Update each `<tr>` to apply gray class for future ship dates**

Replace the existing `<tr>` opening tag:

```tsx
        <tr key={order.id} className="hover:bg-foreground cursor-pointer" 
        onDoubleClick={() => handleDoubleClick(order.id)}>
```

With:

```tsx
        <tr key={order.id}
        className={`hover:bg-foreground cursor-pointer ${order.ship_date && order.ship_date > today ? 'text-gray-500' : ''}`}
        onDoubleClick={() => handleDoubleClick(order.id)}>
```

- [ ] **Step 3: Show `order_kind` under the ID in the ID cell**

Replace the existing ID cell:

```tsx
            <td className="border border-gray-600 px-5 w-1/16 py-1">{order.id}</td>
```

With:

```tsx
            <td className="border border-gray-600 px-5 w-1/16 py-1">
                {order.id}
                <div className="text-xs text-gray-400">{order.order_kind}</div>
            </td>
```

- [ ] **Step 4: Manually verify**

Run `npm run dev`, open `/`:
- Each order shows its type (livraison/echange) under the ID in small gray text
- Create a test order with a future ship date → row appears grayed out in the table
- Create a test order with no ship date → row renders normally

- [ ] **Step 5: Commit**

```bash
git add Components/TableRow.tsx
git commit -m "feat: show order type under ID and gray out future ship date rows"
```

---

## Task 5: Filter Counts (Today's Orders)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `Components/OrdersFilter.tsx`

- [ ] **Step 1: Add `todayCounts` state and fetch to `src/app/page.tsx`**

Add the state declaration after `const [loading, setLoading] = useState(true);`:

```ts
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
```

Add a new `useEffect` after the existing orders fetch `useEffect` (the one with `[userId, searchParams, filter]`):

```ts
  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    async function fetchTodayCounts() {
      const res = await fetch(`/api/orders?start=${today}&end=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const counts: Record<string, number> = { '': data.length };
      for (const order of data) {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
      }
      setTodayCounts(counts);
    }
    fetchTodayCounts();
  }, [userId]);
```

- [ ] **Step 2: Pass `todayCounts` to `OrderFilter`**

Replace:

```tsx
          <OrderFilter filter={filter} setFilter={setFilter} />
```

With:

```tsx
          <OrderFilter filter={filter} setFilter={setFilter} counts={todayCounts} />
```

- [ ] **Step 3: Update `Components/OrdersFilter.tsx` to accept and display counts**

Replace the entire file content:

```tsx
'use client'

type Props = {
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  counts: Record<string, number>;
};

function OrderFilter({ filter, setFilter, counts }: Props) {
  const fmt = (key: string) => counts[key] !== undefined ? ` (${counts[key]})` : '';

  return (
    <ul className="flex lg:justify-between items-end w-full lg:w-120 gap-x-3 text-gray-400">
      <li className={`${filter === "" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("")}>Tout{fmt('')}</li>
      <li className={`${filter === "Nouveau" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Nouveau")}>Nouveaux{fmt('Nouveau')}</li>
      <li className={`${filter === "En route" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("En route")}>En route{fmt('En route')}</li>
      <li className={`${filter === "Livré" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Livré")}>Livré{fmt('Livré')}</li>
      <li className={`${filter === "Annulé" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Annulé")}>Annulé{fmt('Annulé')}</li>
    </ul>
  );
}

export default OrderFilter;
```

- [ ] **Step 4: Manually verify**

Run `npm run dev`, open `/`:
- Each filter label shows today's count in parentheses: e.g. `Nouveaux (3)`
- Count updates when today has orders; shows `(0)` or nothing when empty
- Changing the date filter does NOT change the counts — they stay anchored to today

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx Components/OrdersFilter.tsx
git commit -m "feat: show today's order counts next to each filter button"
```

---

## Task 6: /calculs Page + Cleanup + Navbar

**Files:**
- Create: `src/app/calculs/page.tsx`
- Modify: `src/app/users/page.tsx`
- Modify: `Components/Navbar.tsx`

- [ ] **Step 1: Create `src/app/calculs/page.tsx`**

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { prisma } from "../../../lib/prisma";
import { num } from "../../../lib/serialize";
import SalaryForm from "../../../Components/SalaryForm";
import DeliveryTotalForm from "../../../Components/DeliveryTotalForm";

export default async function Calculs() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (!userId) redirect("/login");

  if (role !== "Admin" && role !== "Assistante") {
    return (
      <div className="text-2xl font-bold text-white text-center mx-auto mt-50">
        <h1>Accès restreint</h1>
      </div>
    );
  }

  const rawUsers = await prisma.users.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, salary: true, phone: true, active: true },
  });
  const users = rawUsers.map(u => ({ ...u, salary: num(u.salary) }));

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <main className="text-white mx-5 pt-30">
        {role === "Admin" && <SalaryForm users={users} />}
        <DeliveryTotalForm users={users} />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Remove SalaryForm and DeliveryTotalForm from `src/app/users/page.tsx`**

Remove these two import lines:

```ts
import SalaryForm from "../../../Components/SalaryForm";
import DeliveryTotalForm from "../../../Components/DeliveryTotalForm";
```

Remove these two JSX lines near the bottom of the return:

```tsx
          <SalaryForm users={users} />

          <DeliveryTotalForm users={users} />
```

- [ ] **Step 3: Add "Calculs" to the desktop nav in `Components/Navbar.tsx`**

In the desktop `<ul>` (the one with `className="hidden sm:flex ..."`), add after the `/users` list item:

```tsx
      <li className={`${path == "/calculs"? "bg-background" : ""} h-15 px-3 flex items-center rounded-t-lg`}>
        <Link href="/calculs" className="whitespace-nowrap">Calculs</Link>
      </li>
```

- [ ] **Step 4: Add "Calculs" to the mobile overlay nav in `Components/Navbar.tsx`**

In the mobile overlay `<ul>` (inside `{isMenuOpen && ...}`), add after the `/users` list item:

```tsx
            <li className={`${path == "/calculs"? "bg-background" : ""}`}>
              <a href="/calculs" className="block px-5 py-4 text-lg" onClick={() => setIsMenuOpen(false)}>
                Calculs
              </a>
            </li>
```

- [ ] **Step 5: Manually verify**

Run `npm run dev`:
- Navbar shows "Calculs" link on desktop and mobile
- `/calculs` as Admin: SalaryForm + DeliveryTotalForm both visible
- `/calculs` as Assistante: only DeliveryTotalForm visible
- `/calculs` as Vendeuse/Livreur: "Accès restreint" shown
- `/users` page: no longer shows salary/delivery forms

- [ ] **Step 6: Commit**

```bash
git add src/app/calculs/page.tsx src/app/users/page.tsx Components/Navbar.tsx
git commit -m "feat: add /calculs page for salary and delivery total forms, add navbar link"
```
